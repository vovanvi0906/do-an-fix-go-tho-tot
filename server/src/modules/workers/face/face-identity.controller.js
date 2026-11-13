import { Controller, Get, Post, Bind, Req, Body, UseGuards, Dependencies } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { FaceIdentityService } from './face-identity.service';

@Controller('workers/me/face')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('WORKER')
@Dependencies(FaceIdentityService)
export class FaceIdentityController {
  constructor(service) { this.service = service; }
  @Get('status')
  @Bind(Req())
  status(req) { return this.service.status(req.user.userId); }
  @Post('enrollment/preflight')
  @Bind(Req(), Body())
  enrollment(req, body) { return this.service.preflight(req.user.userId, body); }
  @Post('reset/preflight')
  @Bind(Req(), Body())
  reset(req, body) { return this.service.preflight(req.user.userId, body, true); }
}
