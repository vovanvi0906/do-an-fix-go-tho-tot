import { Injectable, Dependencies } from '@nestjs/common';
import { OrderBeforeMediaService } from './order-before-media.service';

// Runs before multipart interception; unauthorized captures never reach cloud storage.
@Injectable()
@Dependencies(OrderBeforeMediaService)
export class OrderBeforeMediaGuard {
  constructor(media) { this.media = media; }
  async canActivate(context) {
    const req = context.switchToHttp().getRequest();
    await this.media.authorize(req.user.userId, req.params.id);
    return true;
  }
}
