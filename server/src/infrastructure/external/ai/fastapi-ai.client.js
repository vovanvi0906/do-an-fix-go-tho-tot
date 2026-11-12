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

  async verifyFace(workerId, selfieUrl, idCardImageUrl = '', { allowFallback = true } = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/ai/face-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, photoUrl: selfieUrl, idCardImageUrl }),
      });
      if (response.ok) return await response.json();
    } catch (err) {
      console.warn('FastAPI AI Service (/ai/face-verify) không phản hồi:', err.message);
    }
    if (!allowFallback) return { verified: false, confidence: 0 };
    return getFallbackFaceVerify(workerId, selfieUrl);
  }

  // Compatibility aliases
  async analyzeIncident(imageUrl, description) {
    return this.diagnoseIncident(imageUrl, description);
  }

  async analyzeBeforeAfter(beforeImageUrl, afterImageUrl) {
    return this.compareBeforeAfter(beforeImageUrl, afterImageUrl);
  }
}
