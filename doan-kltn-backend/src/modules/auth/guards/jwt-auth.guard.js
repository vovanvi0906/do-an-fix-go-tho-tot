import { Injectable, Dependencies } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
@Dependencies(Reflector)
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(reflector) {
    super();
    this.reflector = reflector;
  }

  canActivate(context) {
    const isPublic = this.reflector?.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
