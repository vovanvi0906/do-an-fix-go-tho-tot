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
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

/**
 * ============================================================================
 * ADMIN CATEGORIES V1 RESTFUL CONTROLLER
 * ============================================================================
 * Quản lý Danh mục Ngành nghề (Category Management CRUD)
 * Chuẩn RESTful API v1: /api/v1/admin/categories
 */
@ApiTags('v1/admin/categories')
@ApiBearerAuth()
@Controller('v1/admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Dependencies(AdminService)
export class AdminCategoriesV1Controller {
  constructor(adminService) {
    this.adminService = adminService;
  }

  /**
   * GET /api/v1/admin/categories
   * Lấy danh sách danh mục ngành nghề kèm thống kê số lượng dịch vụ
   * Hỗ trợ tìm kiếm theo từ khóa (search) và lọc theo trạng thái (status: all | active | inactive)
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách danh mục ngành nghề kèm thống kê số lượng dịch vụ',
    description: 'Truy vấn toàn bộ các nhóm ngành nghề và số lượng gói dịch vụ trực thuộc. Hỗ trợ query search và status.',
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Từ khóa tìm kiếm theo tên hoặc mô tả' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Lọc trạng thái: all | active | inactive' })
  @Bind(Query('search'), Query('status'))
  async getCategories(search, status) {
    return this.adminService.getServiceCategories({ search, status });
  }

  /**
   * POST /api/v1/admin/categories
   * Tạo mới danh mục ngành nghề
   */
  @Post()
  @ApiOperation({ summary: 'Tạo mới danh mục ngành nghề' })
  @Bind(Body())
  async createCategory(createDto) {
    return this.adminService.createServiceCategory(createDto);
  }

  /**
   * PUT /api/v1/admin/categories/:id
   * Cập nhật thông tin danh mục
   */
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục' })
  @Bind(Param('id'), Body())
  async updateCategory(id, updateDto) {
    return this.adminService.updateServiceCategory(id, updateDto);
  }

  /**
   * PATCH /api/v1/admin/categories/:id/toggle
   * Bật/Tắt nhanh trạng thái hoạt động của danh mục
   */
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Bật/Tắt trạng thái danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục' })
  @Bind(Param('id'))
  async toggleCategoryStatus(id) {
    return this.adminService.toggleCategoryStatus(id);
  }

  /**
   * DELETE /api/v1/admin/categories/:id
   * Vô hiệu hóa hoặc xóa danh mục
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Vô hiệu hóa hoặc xóa danh mục' })
  @ApiParam({ name: 'id', description: 'ID danh mục' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Xóa vĩnh viễn' })
  @Bind(Param('id'), Query('force'))
  async deleteCategory(id, force) {
    return this.adminService.deleteServiceCategory(id, force);
  }
}
