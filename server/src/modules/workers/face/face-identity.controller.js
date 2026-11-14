import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FacePreflightDto } from '../dto/face-preflight.dto';
import { Controller, Get, Post, Bind, Req, Body, Query, UseGuards, Dependencies } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { FaceIdentityService } from './face-identity.service';

@ApiTags('worker-face')
@ApiBearerAuth()
@Controller('workers/me/face')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('WORKER')
@Dependencies(FaceIdentityService)
export class FaceIdentityController {
  constructor(service) { this.service = service; }
  @Get('status')
  @ApiOperation({ summary: 'Trạng thái khả dụng Face ID, không cấp proof' })
  @ApiResponse({ status: 200, description: 'Capabilities và blockers; không có dữ liệu sinh trắc học' })
  @Bind(Req(), Query('orderId'))
  async status(req, orderId) { return { success: true, data: await this.service.status(req.user.userId, orderId) }; }
  @Post('enrollment/preflight')
  @ApiOperation({ summary: 'Kiểm tra điều kiện đăng ký, chưa thu nhận khuôn mặt' })
  @ApiBody({ type: FacePreflightDto })
  @ApiResponse({ status: 201, description: 'accepted=false; chưa gửi yêu cầu duyệt' })
  @ApiResponse({ status: 400, description: 'Thiếu đồng ý hoặc gửi trường không được phép' })
  @Bind(Req(), Body())
  async enrollment(req, body) { return { success: true, data: await this.service.preflight(req.user.userId, body) }; }
  @Post('reset/preflight')
  @ApiOperation({ summary: 'Kiểm tra điều kiện cấp lại, không thay đổi template' })
  @ApiBody({ type: FacePreflightDto })
  @ApiResponse({ status: 201, description: 'accepted=false; workflow cấp lại đang khóa' })
  @ApiResponse({ status: 400, description: 'Thiếu đồng ý hoặc gửi trường không được phép' })
  @Bind(Req(), Body())
  async reset(req, body) { return { success: true, data: await this.service.preflight(req.user.userId, body, true) }; }
}
