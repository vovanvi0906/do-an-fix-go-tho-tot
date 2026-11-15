import { faceCoreConfig } from './face-core.config';
import { Injectable, Dependencies } from '@nestjs/common';
import { FastApiAiClient } from '../../../infrastructure/external/ai/fastapi-ai.client';

// Populate only alongside the reviewed Python PAD evaluation record (exact version/reference).
export const APPROVED_FACE_PAD = Object.freeze({});

@Injectable()
@Dependencies(FastApiAiClient)
export class FaceEvidenceGateway {
  constructor(client, approved = APPROVED_FACE_PAD, options = faceCoreConfig()) {
    this.client = client;
    this.approved = approved;
    this.options = options;
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
    const padExperimentalReady = this.options.experimentalPad === true &&
      identity?.padMode === 'experimental' && identity.padExperimentalReady === true &&
      identity.padThreshold === this.options.padThreshold &&
      Number.isFinite(identity.padThreshold) && identity.padThreshold > 0 && identity.padThreshold < 1 &&
      identity.padModelVersion === 'experimental:anti-spoof-mn3:c4c99af04603b62d7e44f6f4daeb33e0daeccc696008c0b1d62f6f5cebbb3262';
    return {
      padExperimentalReady,
      padMode: padExperimentalReady ? 'experimental' : 'evaluated',
      padThreshold: padExperimentalReady ? identity.padThreshold : null,
      identityModelReady: identity?.identityModelReady === true,
      modelVersion:
        identity?.identityModelReady === true ? identity.modelVersion : null,
      padEvaluated,
      padModelVersion: padEvaluated || padExperimentalReady ? identity.padModelVersion : null,
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
