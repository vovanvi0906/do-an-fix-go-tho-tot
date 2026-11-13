import { Injectable, ForbiddenException } from '@nestjs/common';

// Reject BEFORE multipart storage. No collection until identity/PAD/storage policy exists.
@Injectable()
export class FaceCaptureBlockedGuard {
  canActivate() { throw new ForbiddenException('FACE_CAPTURE_UNAVAILABLE: ENROLLMENT_PAD_AND_PROOF_REQUIRED'); }
}
