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
import { CustomerHomeSummaryDto } from './dto/customer-home-summary.dto';

/**
 * CustomerHomeController
 * Cung cấp các RESTful API phục vụ Trang Chủ Cổng Khách Hàng (Customer Portal Home).
 * Hỗ trợ các endpoint:
 *  - GET /api/v1/customer/home/summary
 *  - GET /api/customer/home/summary
 */
@ApiTags('customer-home')
@ApiBearerAuth()
@Controller(['v1/customer/home', 'customer/home'])
@UseGuards(OptionalJwtAuthGuard)
@Dependencies(CustomerHomeService)
export class CustomerHomeController {
  /**
   * @param {CustomerHomeService} customerHomeService
   */
  constructor(customerHomeService) {
    this.customerHomeService = customerHomeService;
  }

  /**
   * API: GET /api/v1/customer/home/summary
   * Lấy số liệu tổng quan thời gian thực (Real-time Data) cho trang chủ Khách Hàng.
   * Bao gồm:
   *  - activeServicesCount: Số lượng dịch vụ đang hoạt động
   *  - walletBalance: Số dư ví thực tế của tài khoản khách hàng
   *  - availableVouchersCount: Số lượng mã giảm giá hợp lệ đang kích hoạt
   *
   * @param {Object} req - Request object từ Express
   * @returns {Promise<CustomerHomeSummaryDto>}
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Lấy số liệu tổng quan thực tế cho trang chủ khách hàng',
    description:
      'Trả về số lượng dịch vụ đang kích hoạt, số dư ví khách hàng và số lượng mã giảm giá khả dụng.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy dữ liệu tổng quan thành công (activeServicesCount, walletBalance, availableVouchersCount)',
  })
  @Bind(Req())
  async getSummary(req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.customerHomeService.getSummary(userId);
  }

  /**
   * API: GET /api/v1/customer/home/orders/active
   * Endpoint alias cho phép lấy đơn hàng đang hoạt động
   */
  @Get('orders/active')
  @ApiOperation({
    summary: 'Lấy đơn hàng đang hoạt động gần nhất của khách hàng (Home alias)',
  })
  @Bind(Req())
  async getActiveOrder(req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.customerHomeService.getActiveOrder(userId);
  }
}
