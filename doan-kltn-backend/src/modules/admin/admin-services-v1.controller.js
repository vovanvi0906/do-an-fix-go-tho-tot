import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Bind,
  Body,
  Param,
  Query,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

/**
 * ============================================================================
 * ADMIN SERVICES V1 RESTFUL CONTROLLER
 * ============================================================================
 * Quản lý Danh mục & Gói Dịch Vụ (Service Category & Item Management CRUD)
 * Chuẩn RESTful API v1: /api/v1/admin/services
 */
@ApiTags('v1/admin/services')
@ApiBearerAuth()
@Controller('v1/admin/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Dependencies(AdminService)
export class AdminServicesV1Controller {
  constructor(adminService) {
    this.adminService = adminService;
  }

  /**
   * GET /api/v1/admin/services
   * Lấy danh sách dịch vụ (hỗ trợ query params: search, categoryId, status, page, limit)
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách dịch vụ (hỗ trợ search, categoryId, status, page, limit)',
    description: 'Truy vấn danh sách gói dịch vụ kèm thông tin danh mục và số lượng đơn hàng liên kết.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'ALL'] })
  @ApiQuery({ name: 'isActive', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Bind(Query())
  async getServices(query) {
    return this.adminService.getAdminServices(query);
  }

  /**
   * GET /api/v1/admin/services/categories
   * Lấy danh sách nhóm danh mục dịch vụ phục vụ dropdown và phân loại
   */
  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách tất cả danh mục dịch vụ' })
  async getCategories() {
    return this.adminService.getServiceCategories();
  }

  /**
   * POST /api/v1/admin/services
   * Tạo mới một gói dịch vụ
   */
  @Post()
  @ApiOperation({ summary: 'Tạo mới một gói dịch vụ' })
  @Bind(Body())
  async createService(body) {
    return this.adminService.createService(body);
  }

  /**
   * PUT /api/v1/admin/services/:id
   * Cập nhật toàn diện thông tin gói dịch vụ
   */
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin dịch vụ (PUT)' })
  @ApiParam({ name: 'id', description: 'ID gói dịch vụ' })
  @Bind(Param('id'), Body())
  async putService(id, body) {
    return this.adminService.updateService(id, body);
  }

  /**
   * PATCH /api/v1/admin/services/:id
   * Cập nhật một phần thông tin gói dịch vụ
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin dịch vụ (PATCH)' })
  @ApiParam({ name: 'id', description: 'ID gói dịch vụ' })
  @Bind(Param('id'), Body())
  async patchService(id, body) {
    return this.adminService.updateService(id, body);
  }

  /**
   * PATCH /api/v1/admin/services/:id/toggle
   * Bật/Tắt nhanh trạng thái hoạt động của dịch vụ
   */
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Bật/Tắt nhanh trạng thái hoạt động của dịch vụ (Toggle)' })
  @ApiParam({ name: 'id', description: 'ID gói dịch vụ' })
  @Bind(Param('id'))
  async toggleServiceStatus(id) {
    return this.adminService.toggleServiceStatus(id);
  }

  /**
   * DELETE /api/v1/admin/services/:id
   * Xóa hoặc vô hiệu hóa dịch vụ
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hoặc vô hiệu hóa dịch vụ' })
  @ApiParam({ name: 'id', description: 'ID gói dịch vụ' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Xóa vĩnh viễn' })
  @Bind(Param('id'), Query('force'))
  async deleteService(id, force) {
    return this.adminService.deleteService(id, force);
  }
}
