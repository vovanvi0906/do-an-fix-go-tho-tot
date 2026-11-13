import { Injectable, Dependencies } from '@nestjs/common';
import { FastApiAiClient } from '../../../infrastructure/external/ai/fastapi-ai.client';

@Injectable()
@Dependencies(FastApiAiClient)
export class FaceEvidenceGateway {
  constructor(client) { this.client = client; }
  async capabilities() {
    let identity;
    try { identity = await this.client.faceCapabilities?.(); } catch (_) { /* unavailable */ }
    // No approved/evaluated PAD provider exists. An AI readiness flag cannot approve itself.
    return { identityModelReady: identity?.identityModelReady === true,
      modelVersion: identity?.identityModelReady === true ? identity.modelVersion : null,
      padEvaluated: false, padModelVersion: null };
  }
  async enroll(input) {
    if (typeof this.client.enrollFaceTemplate !== 'function') return { qualityDecision: 'NOT_EVALUATED', padDecision: 'NOT_EVALUATED', errorCode: 'PAD_NOT_EVALUATED' };
    return this.client.enrollFaceTemplate(input);
  }
  async verify(input) { return this.client.verifyFaceTemplate(input); }
}
