import { Injectable, Dependencies, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * CustomerHomeService
 * Xử lý nghiệp vụ tổng hợp số liệu thời gian thực (Real-time Data) cho trang chủ Khách Hàng FixGo Pro.
 */
@Injectable()
@Dependencies(PrismaService)
export class CustomerHomeService {
  /**
   * @param {PrismaService} prisma
   */
  constructor(prisma) {
    this.prisma = prisma;
    this.logger = new Logger(CustomerHomeService.name);
  }

  /**
   * Lấy tổng quan số liệu thực tế cho trang chủ khách hàng
   * @param {string | null | undefined} userId - ID người dùng nếu đã đăng nhập
   * @returns {Promise<{ activeServicesCount: number, walletBalance: number, availableVouchersCount: number }>}
   */
  async getSummary(userId) {
    try {
      // 1. Đếm số lượng dịch vụ đang ở trạng thái hoạt động (isActive: true)
      const activeServicesCount = await this.prisma.service.count({
        where: {
          isActive: true,
        },
      });

      // 2. Lấy số dư ví thực tế của tài khoản khách hàng
      let walletBalance = 0;

      if (userId) {
        // Tìm hồ sơ khách hàng liên kết với userId
        const customerProfile = await this.prisma.customerProfile.findUnique({
          where: { userId },
          include: {
            wallet: true,
          },
        });

        if (customerProfile?.wallet) {
          walletBalance = Number(customerProfile.wallet.balance) || 0;
        } else if (customerProfile) {
          // Nếu hồ sơ khách hàng chưa có bản ghi Wallet, khởi tạo ví mặc định với số dư 0
          try {
            const newWallet = await this.prisma.wallet.create({
              data: {
                customerId: customerProfile.id,
                balance: 0,
                currency: 'VND',
              },
            });
            walletBalance = Number(newWallet.balance) || 0;
          } catch (createErr) {
            this.logger.warn(`Không thể khởi tạo ví mặc định cho customer ${customerProfile.id}: ${createErr.message}`);
          }
        } else {
          // Trường hợp user đăng nhập vai trò khác (như Worker) ghé thăm trang khách hàng
          const workerProfile = await this.prisma.workerProfile.findUnique({
            where: { userId },
            include: {
              wallet: true,
            },
          });
          if (workerProfile?.wallet) {
            walletBalance = Number(workerProfile.wallet.balance) || 0;
          }
        }
      }

      // 3. Đếm số lượng mã giảm giá hợp lệ đang hoạt động và còn hạn sử dụng
      const now = new Date();
      const availableVouchersCount = await this.prisma.voucher.count({
        where: {
          isActive: true,
          endDate: {
            gte: now,
          },
        },
      });

      return {
        activeServicesCount,
        walletBalance,
        availableVouchersCount,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi tổng hợp số liệu trang chủ khách hàng: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy thông tin đơn hàng đang hoạt động gần nhất của khách hàng (ACCEPTED / ASSIGNED / IN_PROGRESS / ARRIVING)
   * Phục vụ Dynamic Active Order Widget trên trang chủ
   * RESTful API: GET /api/v1/customer/orders/active
   *
   * @param {string | null | undefined} userId - ID người dùng nếu đã xác thực
   * @returns {Promise<Object | null>} Đơn hàng đang chạy hoặc null nếu không có
   */
  async getActiveOrder(userId) {
    if (!userId) {
      return { activeOrder: null, hasActiveOrder: false };
    }

    try {
      // 1. Tìm hồ sơ khách hàng
      const customerProfile = await this.prisma.customerProfile.findUnique({
        where: { userId },
      });

      if (!customerProfile) {
        return { activeOrder: null, hasActiveOrder: false };
      }

      // 2. Tìm đơn hàng gần nhất đang ở trạng thái xử lý
      const order = await this.prisma.order.findFirst({
        where: {
          customerId: customerProfile.id,
          status: {
            in: [
              'ASSIGNED',
              'WORKER_ARRIVING',
              'ARRIVED',
              'IN_PROGRESS',
              'SEARCHING',
              'AWAITING_CONFIRMATION',
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              unit: true,
            },
          },
          worker: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              ratingAvg: true,
              currentLat: true,
              currentLng: true,
              user: {
                select: {
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return { activeOrder: null, hasActiveOrder: false };
      }

      // 3. Tính toán trạng thái thân thiện và tiến trình
      let statusLabel = 'Đang tìm kiếm thợ...';
      let progressPercent = 25;
      let estimatedTime = 'Đang kết nối';
      let estimatedDistance = 'Trong bán kính 5km';

      switch (order.status) {
        case 'SEARCHING':
          statusLabel = 'Đang quét tìm thợ gần bạn...';
          progressPercent = 25;
          estimatedTime = '1 - 3 phút';
          break;
        case 'ASSIGNED':
          statusLabel = 'Thợ đã tiếp nhận đơn';
          progressPercent = 50;
          estimatedTime = 'Thợ chuẩn bị di chuyển';
          estimatedDistance = '~1.5 km';
          break;
        case 'WORKER_ARRIVING':
          statusLabel = 'Thợ đang di chuyển đến';
          progressPercent = 65;
          estimatedTime = '10 - 15 phút';
          estimatedDistance = '~1.2 km';
          break;
        case 'ARRIVED':
          statusLabel = 'Thợ đã có mặt tại điểm hẹn';
          progressPercent = 80;
          estimatedTime = 'Đã đến nơi';
          estimatedDistance = 'Tại chỗ';
          break;
        case 'IN_PROGRESS':
          statusLabel = 'Đang tiến hành sửa chữa';
          progressPercent = 90;
          estimatedTime = 'Đang xử lý';
          estimatedDistance = 'Tại chỗ';
          break;
        case 'AWAITING_CONFIRMATION':
          statusLabel = 'Chờ bạn nghiệm thu công việc';
          progressPercent = 95;
          estimatedTime = 'Hoàn tất nghiệm thu';
          break;
        default:
          statusLabel = 'Đang xử lý';
          progressPercent = 50;
      }

      const activeOrderData = {
        id: order.id,
        status: order.status,
        statusLabel,
        progressPercent,
        estimatedTime,
        estimatedDistance,
        service: {
          id: order.service?.id || order.serviceId,
          name: order.service?.name || 'Dịch vụ sửa chữa',
          basePrice: Number(order.service?.basePrice || order.totalPrice || 0),
          unit: order.service?.unit || 'gói',
        },
        totalPrice: Number(order.totalPrice || 0),
        pickupAddress: order.pickupAddress || 'Địa chỉ khách hàng',
        createdAt: order.createdAt,
        scheduledAt: order.scheduledAt,
        worker: order.worker
          ? {
              id: order.worker.id,
              fullName: order.worker.fullName || 'Kỹ thuật viên FixGo',
              avatarUrl: order.worker.avatarUrl,
              ratingAvg: Number(order.worker.ratingAvg || 4.9),
              phone: order.worker.user?.phone || '1900-8888',
            }
          : null,
      };

      return {
        activeOrder: activeOrderData,
        hasActiveOrder: true,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy đơn hàng đang hoạt động: ${error.message}`, error.stack);
      return { activeOrder: null, hasActiveOrder: false };
    }
  }
}
