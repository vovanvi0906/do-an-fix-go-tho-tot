import { Injectable, Dependencies } from '@nestjs/common';
import { FastApiAiClient } from '../../../infrastructure/external/ai/fastapi-ai.client';

@Injectable()
@Dependencies(FastApiAiClient)
export class FaceEvidenceGateway {
  constructor(client) { this.client = client; }
  async capabilities() {
    // No PAD checkpoint has been approved/evaluated. No environment flag can fake it.
    return { padEvaluated: false, modelVersion: null, padModelVersion: null };
  }
  async enroll() { return { qualityDecision: 'NOT_EVALUATED', padDecision: 'NOT_EVALUATED', errorCode: 'PAD_NOT_EVALUATED' }; }
  async verify(input) { return this.client.verifyFaceTemplate(input); }
}
