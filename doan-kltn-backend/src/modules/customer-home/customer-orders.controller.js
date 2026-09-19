import {
  Controller,
  Get,
  Req,
  Bind,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CustomerHomeService } from './customer-home.service';

/**
 * CustomerOrdersController
 * Cung cấp API truy vấn đơn hàng phía khách hàng cho trang chủ Customer Portal.
 * Route: GET /api/v1/customer/orders/active
 */
@ApiTags('customer-orders')
@ApiBearerAuth()
@Controller(['v1/customer/orders', 'customer/orders'])
@UseGuards(OptionalJwtAuthGuard)
@Dependencies(CustomerHomeService)
export class CustomerOrdersController {
  /**
   * @param {CustomerHomeService} customerHomeService
   */
  constructor(customerHomeService) {
    this.customerHomeService = customerHomeService;
  }

  /**
   * API: GET /api/v1/customer/orders/active
   * Lấy thông tin đơn hàng đang xử lý (ASSIGNED, WORKER_ARRIVING, ARRIVED, IN_PROGRESS)
   * phục vụ Dynamic Active Order Widget trên trang chủ Khách Hàng.
   *
   * @param {Object} req - Request object từ Express
   * @returns {Promise<Object | null>}
   */
  @Get('active')
  @ApiOperation({
    summary: 'Lấy đơn hàng đang hoạt động gần nhất của khách hàng hiện tại',
    description:
      'Trả về đơn hàng đang tiến hành hoặc thợ đang đến để hiển thị Widget trạng thái động trên trang chủ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin đơn hàng thành công (hoặc null nếu không có đơn nào đang chạy)',
  })
  @Bind(Req())
  async getActiveOrder(req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.customerHomeService.getActiveOrder(userId);
  }
}
