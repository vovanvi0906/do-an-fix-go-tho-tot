import { Injectable, Dependencies } from '@nestjs/common';
import { FaceCoreService } from './face-core.service';
@Injectable() @Dependencies(FaceCoreService)
export class FaceReadyGuard {
  constructor(core) { this.core = core; }
  async canActivate(context) {
    const req = context.switchToHttp().getRequest();
    await this.core.authorizeCapture(req.user.userId, req.params.id);
    return true;
  }
}
