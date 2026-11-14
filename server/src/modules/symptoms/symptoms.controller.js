import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Bind,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SymptomsService } from './symptoms.service';
import {
  CreateSymptomDto,
  UpdateSymptomDto,
  SymptomMappingDto,
} from './dto/symptom.dto';

@ApiTags('symptoms')
@Controller()
@Dependencies(SymptomsService)
export class SymptomsController {
  constructor(service) {
    this.service = service;
  }
  @Get('service-targets/:id/symptoms')
  @ApiOperation({ summary: 'Triệu chứng active đã duyệt theo thiết bị' })
  @ApiQuery({ name: 'categoryId', required: false })
  @Bind(Param('id'), Query('categoryId'))
  async get(id, categoryId) {
    return this.service.getSymptoms(id, categoryId);
  }
  @Get('services/recommendations')
  @ApiOperation({
    summary: 'Top 1–3 dịch vụ từ triệu chứng người dùng xác nhận',
  })
  @ApiQuery({ name: 'targetId', required: true })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({
    name: 'symptomIds',
    required: true,
    description: 'IDs cách nhau bằng dấu phẩy',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Bind(Query())
  async recommend(query) {
    return this.service.recommend(query);
  }
}

@ApiTags('admin-symptoms')
@ApiBearerAuth()
@Controller('admin/symptoms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Dependencies(SymptomsService)
export class AdminSymptomsController {
  constructor(service) {
    this.service = service;
  }
  @Get()
  @ApiOperation({ summary: 'Tìm kiếm và lọc triệu chứng, mapping và cảnh báo' })
  @Bind(Query())
  async list(query) {
    return this.service.listAdmin(query);
  }
  @Post()
  @ApiOperation({ summary: 'Tạo triệu chứng (mặc định chờ duyệt, inactive)' })
  @ApiBody({ type: CreateSymptomDto })
  @Bind(Body(), Req())
  async create(body, req) {
    return this.service.create(body, req.user.userId || req.user.id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Sửa/duyệt/vô hiệu hóa triệu chứng; giữ lịch sử' })
  @ApiBody({ type: UpdateSymptomDto })
  @Bind(Param('id'), Body(), Req())
  async update(id, body, req) {
    return this.service.update(id, body, req.user.userId || req.user.id);
  }
  @Put(':id/services/:serviceId')
  @ApiOperation({
    summary: 'Liên kết hoặc cập nhật priority của service cùng target',
  })
  @ApiBody({ type: SymptomMappingDto })
  @Bind(Param('id'), Param('serviceId'), Body(), Req())
  async map(id, serviceId, body, req) {
    return this.service.mapService(
      id,
      serviceId,
      body,
      req.user.userId || req.user.id,
    );
  }
  @Delete(':id/services/:serviceId')
  @ApiOperation({ summary: 'Bỏ liên kết bằng cách archive, không xóa bản ghi' })
  @Bind(Param('id'), Param('serviceId'), Req())
  async unmap(id, serviceId, req) {
    return this.service.unmapService(
      id,
      serviceId,
      req.user.userId || req.user.id,
    );
  }
}
