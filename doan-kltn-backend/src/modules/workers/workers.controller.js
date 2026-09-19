import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Bind,
  Req,
  Body,
  Query,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkersService } from './workers.service';

@ApiTags('workers')
@ApiBearerAuth()
@Controller('workers')
@Dependencies(WorkersService)
export class WorkersController {
  constructor(workersService) {
    this.workersService = workersService;
  }

  @Get('nearby')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Tìm danh sách thợ trực tuyến gần nhất theo tọa độ GPS và bán kính' })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: 10.803 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: 106.711 })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 15.0 })
  @Bind(Query('lat'), Query('lng'), Query('radius'))
  async getNearbyWorkers(lat, lng, radius) {
    return this.workersService.findNearby(lat, lng, radius || 15.0);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ cá nhân và kỹ năng của thợ' })
  @Bind(Req())
  async getProfile(req) {
    return this.workersService.getProfile(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ cá nhân của thợ (bio, CCCD, kinh nghiệm, tọa độ...)' })
  @Bind(Req(), Body())
  async updateProfile(req, body) {
    return this.workersService.updateProfile(req.user.userId, body);
  }

  @Put('me/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @ApiOperation({ summary: 'Cập nhật danh sách dịch vụ đăng ký cung cấp (gửi mảng serviceIds)' })
  @Bind(Req(), Body())
  async updateServices(req, body) {
    return this.workersService.updateServices(req.user.userId, body);
  }

  @Post('me/submit-approval')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @ApiOperation({ summary: 'Nộp hồ sơ để yêu cầu quản trị viên phê duyệt (DRAFT -> PENDING)' })
  @Bind(Req())
  async submitApproval(req) {
    return this.workersService.submitApproval(req.user.userId);
  }

  @Patch('me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @ApiOperation({ summary: 'Bật/tắt trạng thái trực tuyến sẵn sàng nhận việc (yêu cầu User ACTIVE, Worker APPROVED, đã chọn dịch vụ)' })
  @Bind(Req(), Body())
  async updateAvailability(req, body) {
    return this.workersService.updateAvailability(req.user.userId, body);
  }
}

