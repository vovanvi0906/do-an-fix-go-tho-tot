import { IsNumber, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object (DTO) đại diện cho dữ liệu tổng quan trang chủ Khách Hàng
 * Trả về từ GET /api/v1/customer/home/summary
 */
export class CustomerHomeSummaryDto {
  /**
   * Tổng số lượng dịch vụ đang ở trạng thái hoạt động (isActive: true)
   * @type {number}
   */
  @IsNumber()
  @IsNotEmpty()
  activeServicesCount;

  /**
   * Số dư ví thực tế của tài khoản khách hàng hiện tại (Wallet model)
   * @type {number}
   */
  @IsNumber()
  @IsNotEmpty()
  walletBalance;

  /**
   * Số lượng mã giảm giá còn hiệu lực và đang kích hoạt (Voucher model)
   * @type {number}
   */
  @IsNumber()
  @IsNotEmpty()
  availableVouchersCount;
}
