import { Controller, Get, Req, Query, Bind, UseGuards, Dependencies } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiExcludeController } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { FaceLabDebugGuard } from './face-lab.guard';
import { FaceLabInspectorService } from './face-lab-inspector.service';

// The lab guard runs first, so a disabled/production environment answers 404 before auth.
@ApiExcludeController()
@ApiTags('worker-face-lab') @ApiBearerAuth()
@Controller('workers/me/face/lab')
@UseGuards(FaceLabDebugGuard, JwtAuthGuard, RolesGuard) @Roles('WORKER')
@Dependencies(FaceLabInspectorService)
export class FaceLabController {
  constructor(inspector) { this.inspector = inspector; }
  @Get('inspect') @ApiOperation({ summary: 'Lab-only: own session/proof/template metadata (no biometric data)' }) @ApiResponse({ status: 200 })
  @Bind(Req(), Query('orderId'))
  async inspect(req, orderId) { return { success: true, data: await this.inspector.inspect(req.user.userId, orderId) }; }
}
