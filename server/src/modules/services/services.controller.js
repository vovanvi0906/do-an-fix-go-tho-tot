import {
  Controller,
  Get,
  Bind,
  Query,
  Param,
  Dependencies,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller()
@Dependencies(ServicesService)
export class ServicesController {
  constructor(servicesService) {
    this.servicesService = servicesService;
  }

  @Get('service-categories')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOperation({ summary: 'Lấy danh sách các danh mục dịch vụ đang hoạt động' })
  async getCategories() {
    return this.servicesService.getCategories();
  }

  @Get('service-categories/tree')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOperation({ summary: 'Lấy toàn bộ cây phân cấp Danh mục -> Đối tượng -> Dịch vụ' })
  async getCategoryTree() {
    return this.servicesService.getCategoryTree();
  }

  @Get('service-targets')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOperation({ summary: 'Lấy danh sách Đối tượng/Thiết bị sửa chữa (Targets)' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @Bind(Query('categoryId'))
  async getTargets(categoryId) {
    return this.servicesService.getTargets(categoryId);
  }

  @Get('services')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ (lọc theo categoryId hoặc targetId)' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'targetId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Bind(Query('categoryId'), Query('targetId'), Query())
  async getServices(categoryId, targetId, query) {
    return this.servicesService.getServices(categoryId, targetId, query);
  }

  @Get('services/:id')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một dịch vụ theo ID' })
  @Bind(Param('id'))
  async getServiceById(id) {
    return this.servicesService.getServiceById(id);
  }
}
