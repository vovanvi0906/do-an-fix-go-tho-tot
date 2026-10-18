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
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({
    summary: 'Lấy danh sách các danh mục dịch vụ đang hoạt động',
  })
  async getCategories() {
    return this.servicesService.getCategories();
  }

  @Get('services')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({
    summary: 'Lấy danh sách các dịch vụ (có thể lọc theo categoryId)',
  })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @Bind(Query('categoryId'))
  async getServices(categoryId) {
    return this.servicesService.getServices(categoryId);
  }

  @Get('services/:id')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một dịch vụ theo ID' })
  @Bind(Param('id'))
  async getServiceById(id) {
    return this.servicesService.getServiceById(id);
  }
}
