import { validFaceResult, validTemplateFaceResult } from './face-result';
import { Injectable, Dependencies } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getFallbackCompare, getFallbackFaceVerify } from './aiFallbackHelper';

@Injectable()
@Dependencies(ConfigService)
export class FastApiAiClient {
  constructor(configService) {
    this.configService = configService;
    this.baseUrl =
      configService.get('AI_SERVICE_URL') ||
      process.env.AI_SERVICE_URL ||
      configService.get('app.fastApiAiUrl') ||
      process.env.FASTAPI_AI_URL ||
      'http://localhost:8000';

    this.confidenceThreshold = parseFloat(
      configService.get('AI_CONFIDENCE_THRESHOLD') ||
        process.env.AI_CONFIDENCE_THRESHOLD ||
        '0.6',
    );
  }

  /**
   * 1. POST /ai/diagnose: Chẩn đoán sự cố hình ảnh
   * input: imageUrl, description
   * output: { suggestedCategoryId, confidence (0-1), detectedLabels: string[] }
   */
  async diagnoseIncident(imageUrl, description = '') {
    try {
      const response = await fetch(`${this.baseUrl}/ai/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, description }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const result = await response.json();
        if (result && typeof result === 'object' && !Array.isArray(result)) return result;
      }
    } catch (err) {
      console.warn(
        'FastAPI AI Service (/ai/diagnose) không phản hồi, chuyển sang chọn dịch vụ thủ công:',
        err.message,
      );
    }

    // Không sinh kết quả nhận diện khi AI chưa bật hoặc offline
    return { status: 'unavailable', engine: 'unavailable', confidence: null, detectedLabels: [], notes: 'AI chưa khả dụng. Vui lòng chọn dịch vụ.' };
  }

  /**
   * 2. POST /ai/compare-before-after: So sánh ảnh trước & sau hoàn thành
   * input: beforeImageUrl, afterImageUrl
   * output: { matchScore (0-1), passed: boolean, notes: string }
   */
  async compareBeforeAfter(beforeImageUrl, afterImageUrl) {
    try {
      const response = await fetch(`${this.baseUrl}/ai/compare-before-after`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beforeImageUrl, afterImageUrl }),
      });
      if (response.ok) return await response.json();
    } catch (err) {
      console.warn('FastAPI AI Service (/ai/compare-before-after) không phản hồi:', err.message);
    }
    return getFallbackCompare(afterImageUrl);
  }

  async verifyFace(workerId, selfieUrl, idCardImageUrl = '') {
    try {
      const response = await fetch(`${this.baseUrl}/ai/face-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-face-service-token': this.configService.get('AI_FACE_SERVICE_TOKEN') || process.env.AI_FACE_SERVICE_TOKEN || '' },
        body: JSON.stringify({ workerId, photoUrl: selfieUrl, idCardImageUrl }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const result = await response.json();
        if (validFaceResult(result) && result.workerId === workerId) return result;
      }
    } catch (err) {
      console.warn('Face AI transport unavailable');
    }
    return getFallbackFaceVerify(workerId, selfieUrl);
  }

  // Called only with a backend-selected, decrypted, versioned template and session.
  async verifyFaceTemplate({ workerId, sessionId, photo, templateEmbedding, templateVersion, modelVersion }) {
    const threshold = Number(this.configService.get('FACE_IDENTITY_THRESHOLD') ?? process.env.FACE_IDENTITY_THRESHOLD ?? '.60');
    const token = this.configService.get('AI_FACE_SERVICE_TOKEN') || process.env.AI_FACE_SERVICE_TOKEN;
    const failure = { identityDecision: 'TECHNICAL_ERROR', identityScore: null, verificationMethod: 'none',
      modelVersion: null, templateVersion: null, qualityDecision: 'NOT_EVALUATED', padDecision: 'NOT_EVALUATED', errorCode: 'FACE_SERVICE_UNAVAILABLE' };
    if (!token || !Number.isFinite(threshold) || threshold < -1 || threshold > 1 ||
        typeof sessionId !== 'string' || !sessionId || typeof workerId !== 'string' || !workerId ||
        !Number.isSafeInteger(templateVersion) || templateVersion < 1 || !modelVersion ||
        !Array.isArray(templateEmbedding) || templateEmbedding.length !== 128 ||
        !templateEmbedding.every(v => typeof v === 'number' && Number.isFinite(v)) ||
        !Number.isFinite(Math.hypot(...templateEmbedding)) || Math.hypot(...templateEmbedding) === 0) return failure;
    try {
      const response = await fetch(`${this.baseUrl}/ai/face-verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-face-service-token': token },
        body: JSON.stringify({ workerId, sessionId, photo, templateEmbedding, templateVersion, modelVersion }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const result = await response.json();
        if (validTemplateFaceResult(result, { workerId, sessionId, templateVersion, modelVersion, threshold })) return result;
      }
    } catch (_) { /* Never log captures, templates or transport exception contents. */ }
    return failure;
  }

  async faceCapabilities() {
    const unavailable = { identityModelReady: false, modelVersion: null, padEvaluated: false, padModelVersion: null };
    const token = this.configService.get('AI_FACE_SERVICE_TOKEN') || process.env.AI_FACE_SERVICE_TOKEN;
    if (!token) return unavailable;
    try {
      const response = await fetch(`${this.baseUrl}/ai/face-capabilities`, {
        headers: { 'x-face-service-token': token }, signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const r = await response.json();
        if (r?.identityModelReady === true && typeof r.modelVersion === 'string' &&
            /^yunet-sface:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.modelVersion) && r.verificationMethod === 'yunet_sface_cosine') {
          // Readiness for identity inference is independent of evaluated PAD approval.
          return { ...unavailable, identityModelReady: true, modelVersion: r.modelVersion };
        }
      }
    } catch (_) { /* No secret headers, images or transport details in logs. */ }
    return unavailable;
  }

  async enrollFaceTemplate({ workerId, sessionId, photo, templateVersion, modelVersion }) {
    const failure = { identityDecision: 'TECHNICAL_ERROR', identityScore: null, verificationMethod: 'none',
      qualityDecision: 'NOT_EVALUATED', padDecision: 'NOT_EVALUATED', padModelVersion: null, errorCode: 'FACE_SERVICE_UNAVAILABLE' };
    const token = this.configService.get('AI_FACE_SERVICE_TOKEN') || process.env.AI_FACE_SERVICE_TOKEN;
    if (!token || !workerId || !sessionId || !Number.isSafeInteger(templateVersion) || templateVersion < 1 ||
        typeof modelVersion !== 'string' || typeof photo !== 'string' || photo.length > 6990600) return failure;
    try {
      const response = await fetch(`${this.baseUrl}/ai/face-enroll`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-face-service-token': token },
        body: JSON.stringify({ workerId, sessionId, photo, templateVersion, modelVersion }), signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const r = await response.json();
        if (r?.workerId !== workerId || r.sessionId !== sessionId || r.modelVersion !== modelVersion || r.templateVersion !== templateVersion ||
            !['MATCH','NON_MATCH','INCONCLUSIVE','TECHNICAL_ERROR'].includes(r.identityDecision) || r.identityScore !== null ||
            !['PASS','FAIL','NOT_EVALUATED'].includes(r.qualityDecision) || !['PASS','FAIL','NOT_EVALUATED','INCONCLUSIVE'].includes(r.padDecision)) return failure;
        if (r.embedding !== undefined) {
          if (r.padDecision !== 'PASS' || typeof r.padModelVersion !== 'string' || !r.padModelVersion || r.qualityDecision !== 'PASS' ||
              r.verificationMethod !== 'yunet_sface_embedding' || !Array.isArray(r.embedding) || r.embedding.length !== 128 ||
              !r.embedding.every(v => typeof v === 'number' && Number.isFinite(v)) ||
              !Number.isFinite(Math.hypot(...r.embedding)) || Math.hypot(...r.embedding) === 0) return failure;
        }
        return r;
      }
    } catch (_) { /* Fail closed, no biometric logs. */ }
    return failure;
  }

  // Compatibility aliases
  async analyzeIncident(imageUrl, description) {
    return this.diagnoseIncident(imageUrl, description);
  }

  async analyzeBeforeAfter(beforeImageUrl, afterImageUrl) {
    return this.compareBeforeAfter(beforeImageUrl, afterImageUrl);
  }
}
