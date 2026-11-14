import { Injectable, Dependencies } from '@nestjs/common';
import { FastApiAiClient } from '../../../infrastructure/external/ai/fastapi-ai.client';

// Populate only alongside the reviewed Python PAD evaluation record (exact version/reference).
export const APPROVED_FACE_PAD = Object.freeze({});

@Injectable()
@Dependencies(FastApiAiClient)
export class FaceEvidenceGateway {
  constructor(client, approved = APPROVED_FACE_PAD) {
    this.client = client;
    this.approved = approved;
  }
  async capabilities() {
    let identity;
    try {
      identity = await this.client.faceCapabilities?.();
    } catch (_) {
      /* unavailable */
    }
    const approvedReference =
      identity?.padModelVersion && this.approved[identity.padModelVersion];
    const padEvaluated =
      identity?.padEvaluated === true &&
      typeof approvedReference === 'string' &&
      approvedReference.length > 0 &&
      identity.padEvaluationReference === approvedReference;
    return {
      identityModelReady: identity?.identityModelReady === true,
      modelVersion:
        identity?.identityModelReady === true ? identity.modelVersion : null,
      padEvaluated,
      padModelVersion: padEvaluated ? identity.padModelVersion : null,
    };
  }
  async enroll(input) {
    if (typeof this.client.enrollFaceTemplate !== 'function')
      return {
        qualityDecision: 'NOT_EVALUATED',
        padDecision: 'NOT_EVALUATED',
        errorCode: 'PAD_NOT_EVALUATED',
      };
    return this.client.enrollFaceTemplate(input);
  }
  async verify(input) {
    return this.client.verifyFaceTemplate(input);
  }
}
