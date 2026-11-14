import { Injectable, NotFoundException } from '@nestjs/common';

// FaceID Lab inspector is a development/staging diagnostic. It is invisible (404) unless
// explicitly enabled outside production. It never widens worker ownership: the route is
// additionally protected by JWT + WORKER role and only reads the caller's own records.
export const FACE_LAB_ENVIRONMENTS = ['development', 'test', 'staging'];

export function faceLabEnabled(env = process.env) {
  return env.FACE_LAB_DEBUG_ENABLED === 'true' && FACE_LAB_ENVIRONMENTS.includes(env.NODE_ENV) && env.NODE_ENV !== 'production';
}

@Injectable()
export class FaceLabDebugGuard {
  constructor(env = process.env) { this.env = env; }
  canActivate() {
    if (!faceLabEnabled(this.env)) throw new NotFoundException();
    return true;
  }
}
