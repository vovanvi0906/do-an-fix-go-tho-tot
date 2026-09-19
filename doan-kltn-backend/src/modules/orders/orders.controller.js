import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  Bind,
  Dependencies,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { DiagnoseOrderDto } from './dto/diagnose-order.dto';
import { FaceVerifyDto } from './dto/face-verify.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UploadOrderImageDto } from './dto/upload-order-image.dto';
import { DisputeOrderDto } from './dto/dispute-order.dto';
import { ReviewOrderDto } from './dto/review-order.dto';
import { AdjustPriceDto } from './dto/adjust-price.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
@Dependencies(OrdersService)
export class OrdersController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  /**
   * 1. POST /orders/diagnose: Upload ảnh sự cố, gọi AI service, trả về gợi ý category + confidence + khoảng giá ước tính
   */
  @Post('diagnose')
  @ApiOperation({
    summary: 'Chẩn đoán sự cố qua AI (Upload ảnh -> Trả về gợi ý danh mục, độ tin cậy và ước tính giá)',
  })
  @ApiBody({ type: DiagnoseOrderDto })
  @ApiResponse({ status: 200, description: 'Kết quả phân tích AI thành công' })
  @ApiResponse({ status: 400, description: 'Thiếu imageUrl hoặc dữ liệu không hợp lệ' })
  @Bind(Req(), Body())
  async diagnose(req, diagnoseDto) {
    return this.ordersService.diagnose(req.user.userId, diagnoseDto);
  }

  /**
   * 2. POST /orders: Tạo đơn dịch vụ mới (Khách xác nhận -> status = SEARCHING_WORKER)
   */
  @Post()
  @Roles('CUSTOMER')
  @ApiOperation({
    summary: 'Tạo đơn dịch vụ mới (Khách hàng xác nhận -> status SEARCHING_WORKER & quét thợ 5km)',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Tạo đơn thành công, lên lịch BullMQ 3 phút mở rộng bán kính' })
  @ApiResponse({ status: 400, description: 'Tọa độ GPS hoặc danh mục không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực JWT' })
  @Bind(Req(), Body())
  async createOrder(req, createOrderDto) {
    return this.ordersService.createOrder(req.user.userId, createOrderDto);
  }

  /**
   * 3. GET /orders: Danh sách đơn của user hiện tại (phân trang, filter status)
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của user hiện tại (phân trang, lọc theo status)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, type: String, example: 'SEARCHING_WORKER' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn hàng và phân trang' })
  @Bind(Req(), Query())
  async getMyOrders(req, query) {
    return this.ordersService.getMyOrders(req.user.userId, req.user.role, query);
  }

  /**
   * Compatibility: GET /orders/worker/current
   */
  @Get('worker/current')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Lấy đơn hàng đang nhận/đang thực hiện của kỹ thuật viên' })
  @ApiResponse({ status: 200, description: 'Đơn hàng hiện tại hoặc null' })
  @Bind(Req())
  async getCurrentWorkerOrder(req) {
    return this.ordersService.getCurrentWorkerOrder(req.user.userId);
  }

  /**
   * 4. GET /orders/:id: Chi tiết đơn hàng (Khách hoặc thợ liên quan mới xem được)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết đơn hàng (Chỉ khách tạo đơn, thợ được phân công, hoặc Admin)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Chi tiết đơn hàng đầy đủ' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem đơn hàng này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @Bind(Req(), Param('id'))
  async getOrderById(req, id) {
    return this.ordersService.getOrderById(id, req.user.userId, req.user.role);
  }

  /**
   * 5. PATCH /orders/:id/cancel: Khách huỷ đơn, kiểm tra rule phí huỷ theo status hiện tại
   */
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Hủy đơn hàng (Trước MATCHED: Miễn phí; Từ MATCHED trở đi: Áp phí hủy 20%)',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: CancelOrderDto })
  @ApiResponse({ status: 200, description: 'Hủy đơn thành công kèm phí hủy tính toán' })
  @ApiResponse({ status: 400, description: 'Đơn hàng không thể hủy ở trạng thái hiện tại' })
  @Bind(Req(), Param('id'), Body())
  async cancelOrder(req, id, cancelDto) {
    return this.ordersService.cancelOrder(
      id,
      req.user.userId,
      req.user.role,
      cancelDto?.reason || 'Hủy theo yêu cầu',
    );
  }

  /**
   * 6. POST /orders/:id/match: (Internal, gọi từ worker job) Tìm thợ gần nhất theo bán kính
   */
  @Post(':id/match')
  @ApiOperation({
    summary: 'Tìm thợ gần nhất theo bán kính GPS (Internal / Delayed Job quét PostGIS & Haversine)',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: 'Danh sách ứng viên kỹ thuật viên sắp xếp theo khoảng cách' })
  @Bind(Req(), Param('id'), Query('radiusKm'))
  async matchNearbyWorkers(req, id, radiusKm) {
    return this.ordersService.matchNearbyWorkers(id, radiusKm || 5);
  }

  /**
   * 7. POST /orders/:id/accept: Thợ nhận đơn (Yêu cầu đã faceVerifiedAt trong 24h & Khóa SELECT FOR UPDATE)
   */
  @Post(':id/accept')
  @Roles('WORKER')
  @ApiOperation({
    summary: 'Kỹ thuật viên nhận đơn (Yêu cầu faceVerifiedAt trong 24h & Khóa bi quan chống Race Condition)',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Nhận đơn thành công -> Chuyển trạng thái MATCHED' })
  @ApiResponse({ status: 400, description: 'Chưa xác thực khuôn mặt hoặc xác thực đã quá 24h' })
  @ApiResponse({ status: 409, description: 'Đơn đã có kỹ thuật viên khác nhận trước' })
  @Bind(Req(), Param('id'))
  async acceptOrderPost(req, id) {
    return this.ordersService.acceptOrder(id, req.user.userId);
  }

  /**
   * Compatibility alias: PATCH /orders/:id/accept
   */
  @Patch(':id/accept')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Kỹ thuật viên nhận đơn (Alias method PATCH)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @Bind(Req(), Param('id'))
  async acceptOrder(req, id) {
    return this.ordersService.acceptOrder(id, req.user.userId);
  }

  /**
   * 8. POST /orders/:id/face-verify: Xác thực khuôn mặt thợ trước khi accept (gọi AI service)
   */
  @Post(':id/face-verify')
  @Roles('WORKER')
  @ApiOperation({
    summary: 'Xác thực sinh trắc học khuôn mặt thợ qua AI Service trước khi nhận đơn (Hiệu lực 24h)',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: FaceVerifyDto })
  @ApiResponse({ status: 200, description: 'Xác thực thành công, cập nhật faceVerifiedAt' })
  @ApiResponse({ status: 400, description: 'Khuôn mặt không khớp hoặc ảnh không hợp lệ' })
  @Bind(Req(), Param('id'), Body())
  async verifyFace(req, id, faceVerifyDto) {
    return this.ordersService.verifyFace(id, req.user.userId, faceVerifyDto);
  }

  /**
   * 9. PATCH /orders/:id/status: Cập nhật trạng thái tiến độ (EN_ROUTE, IN_PROGRESS...)
   */
  @Patch(':id/status')
  @Roles('WORKER')
  @ApiOperation({
    summary: 'Cập nhật trạng thái tiến trình công việc (WORKER_EN_ROUTE, IN_PROGRESS, AWAITING_ACCEPTANCE)',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({ status: 200, description: 'Cập nhật tiến trình thành công' })
  @ApiResponse({ status: 403, description: 'Không phải thợ phụ trách đơn' })
  @Bind(Req(), Param('id'), Body())
  async updateStatus(req, id, updateStatusDto) {
    return this.ordersService.updateStatus(id, req.user.userId, updateStatusDto);
  }

  /**
   * 10. POST /orders/:id/images: Upload ảnh BEFORE/AFTER lên S3, lưu OrderImage
   */
  @Post(':id/images')
  @ApiOperation({
    summary: 'Upload và lưu trữ ảnh minh chứng (ISSUE, BEFORE, AFTER) vào OrderImage',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: UploadOrderImageDto })
  @ApiResponse({ status: 201, description: 'Lưu ảnh minh chứng thành công' })
  @ApiResponse({ status: 400, description: 'Loại ảnh không hợp lệ' })
  @Bind(Req(), Param('id'), Body())
  async uploadImage(req, id, uploadDto) {
    return this.ordersService.uploadImage(id, uploadDto);
  }

  /**
   * 11. POST /orders/:id/verify-completion: Gọi AI so sánh ảnh before/after, trả matchScore
   */
  @Post(':id/verify-completion')
  @ApiOperation({
    summary: 'Nghiệm thu AI: So sánh ảnh trước (BEFORE) và sau (AFTER) hoàn thành, trả về matchScore',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Kết quả đối soát so sánh AI thành công' })
  @ApiResponse({ status: 400, description: 'Thiếu ảnh BEFORE hoặc AFTER để đối soát' })
  @Bind(Req(), Param('id'))
  async verifyCompletion(req, id) {
    return this.ordersService.verifyCompletion(id);
  }

  /**
   * 12. POST /orders/:id/accept-completion: Khách xác nhận nghiệm thu -> status COMPLETED
   */
  @Post(':id/accept-completion')
  @Roles('CUSTOMER')
  @ApiOperation({
    summary: 'Khách hàng xác nhận nghiệm thu kết quả công việc -> chuyển status COMPLETED',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Nghiệm thu thành công, sẵn sàng thanh toán' })
  @ApiResponse({ status: 403, description: 'Chỉ khách tạo đơn mới có quyền nghiệm thu' })
  @Bind(Req(), Param('id'))
  async acceptCompletion(req, id) {
    return this.ordersService.acceptCompletion(id, req.user.userId);
  }

  /**
   * 13. POST /orders/:id/dispute: Khách khiếu nại -> status DISPUTED, tạo ticket cho admin
   */
  @Post(':id/dispute')
  @Roles('CUSTOMER')
  @ApiOperation({
    summary: 'Khách hàng tạo khiếu nại đơn hàng -> status DISPUTED & tạo Ticket cho Ban Quản trị',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: DisputeOrderDto })
  @ApiResponse({ status: 200, description: 'Gửi khiếu nại thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền khiếu nại đơn hàng này' })
  @Bind(Req(), Param('id'), Body())
  async disputeOrder(req, id, disputeDto) {
    return this.ordersService.disputeOrder(id, req.user.userId, disputeDto);
  }

  /**
   * 14. POST /orders/:id/pay: Xử lý thanh toán, tính commissionPercent, cộng vào WorkerWallet trong 1 transaction
   */
  @Post(':id/pay')
  @Roles('CUSTOMER', 'ADMIN')
  @ApiOperation({
    summary: 'Thanh toán đơn hàng (Tính % hoa hồng category và cộng tiền ví thợ WorkerWallet trong 1 transaction)',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Thanh toán và giải ngân ví thành công -> status PAID' })
  @ApiResponse({ status: 400, description: 'Đơn hàng chưa có thợ hoặc không hợp lệ' })
  @Bind(Req(), Param('id'))
  async payOrder(req, id) {
    return this.ordersService.processPayment(id, req.user.userId);
  }

  /**
   * 15. POST /orders/:id/review: Khách đánh giá thợ sau khi PAID/COMPLETED
   */
  @Post(':id/review')
  @Roles('CUSTOMER')
  @ApiOperation({
    summary: 'Khách hàng đánh giá chất lượng thợ (1-5 sao) và cập nhật rating trung bình',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: ReviewOrderDto })
  @ApiResponse({ status: 200, description: 'Đánh giá thành công' })
  @ApiResponse({ status: 400, description: 'Đơn hàng chưa hoàn thành/thanh toán để đánh giá' })
  @Bind(Req(), Param('id'), Body())
  async reviewOrder(req, id, reviewDto) {
    return this.ordersService.reviewOrder(id, req.user.userId, reviewDto);
  }

  /**
   * 16. PATCH /orders/:id/adjust-price: Thợ đề xuất phát sinh ngoài báo giá hoặc khách duyệt/từ chối
   */
  @Patch(':id/adjust-price')
  @ApiOperation({
    summary: 'Xử lý chi phí phát sinh ngoài báo giá (Thợ đề xuất PROPOSE -> Khách duyệt ACCEPT hoặc từ chối REJECT)',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: AdjustPriceDto })
  @ApiResponse({ status: 200, description: 'Xử lý yêu cầu điều chỉnh giá thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu phát sinh không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện thao tác này' })
  @Bind(Req(), Param('id'), Body())
  async adjustPrice(req, id, adjustPriceDto) {
    return this.ordersService.adjustPrice(
      id,
      req.user.userId,
      req.user.role,
      adjustPriceDto,
    );
  }

  /**
   * 17. PATCH /orders/:id/schedule: Đặt lịch hẹn sau khi không tìm được thợ ngay
   */
  @Patch(':id/schedule')
  @Roles('CUSTOMER')
  @ApiOperation({
    summary: 'Khách hàng đặt lại lịch hẹn sau khi hệ thống mở rộng bán kính không tìm thấy thợ',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Đặt lịch hẹn thành công' })
  @Bind(Req(), Param('id'), Body('scheduledAt'))
  async scheduleOrder(req, id, scheduledAt) {
    return this.ordersService.scheduleOrder(id, req.user.userId, scheduledAt);
  }


  // ==========================================
  // COMPATIBILITY ALIASES (Tương thích giao diện cũ)
  // ==========================================
  @Patch(':id/arriving')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Thợ đang di chuyển đến địa điểm (WORKER_EN_ROUTE)' })
  @Bind(Req(), Param('id'))
  async markArriving(req, id) {
    return this.ordersService.markArriving(id, req.user.userId);
  }

  @Patch(':id/arrived')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Thợ đã có mặt tại địa điểm (IN_PROGRESS)' })
  @Bind(Req(), Param('id'))
  async markArrived(req, id) {
    return this.ordersService.markArrived(id, req.user.userId);
  }

  @Patch(':id/start')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Thợ bắt đầu thực hiện công việc (IN_PROGRESS)' })
  @Bind(Req(), Param('id'))
  async startWork(req, id) {
    return this.ordersService.startWork(id, req.user.userId);
  }

  @Patch(':id/finish')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Thợ báo cáo hoàn thành công việc (AWAITING_ACCEPTANCE)' })
  @Bind(Req(), Param('id'))
  async finishWork(req, id) {
    return this.ordersService.finishWork(id, req.user.userId);
  }

  @Patch(':id/confirm-completion')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Khách hàng nghiệm thu dịch vụ' })
  @Bind(Req(), Param('id'))
  async confirmCompletion(req, id) {
    return this.ordersService.confirmCompletion(id, req.user.userId);
  }

  @Patch(':id/complete-payment')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xác nhận thanh toán và hoàn tất đơn (ADMIN)' })
  @Bind(Req(), Param('id'))
  async completePayment(req, id) {
    return this.ordersService.completePayment(id, req.user.userId);
  }
}
