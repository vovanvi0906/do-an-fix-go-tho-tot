import { PrismaClient, Prisma } from '@prisma/client';

/**
 * ============================================================================
 * FIXGO PRO - DATABASE SEEDING SCRIPT (PRISMA ORM)
 * ============================================================================
 * File: prisma/seed.ts
 * Ngôn ngữ: TypeScript
 * Mục đích: Khởi tạo dữ liệu danh mục dịch vụ (ServiceCategory) và các dịch vụ
 * chi tiết (Service) chuẩn hóa cho hệ sinh thái FixGo Pro.
 * Tính chất: Idempotent (Có thể chạy nhiều lần an toàn mà không sinh trùng lặp)
 */

const prisma = new PrismaClient();

/**
 * Định nghĩa cấu trúc dữ liệu cho dịch vụ con (Service)
 */
export interface ServiceSeedInput {
  /** Tên hiển thị dịch vụ */
  name: string;
  /** Đường dẫn định danh chuẩn SEO/URL */
  slug: string;
  /** Mô tả chi tiết phạm vi công việc */
  description: string;
  /** Giá sàn tham khảo định mức (VNĐ) */
  basePrice: number;
  /** Đơn vị tính chi phí (giờ, lần, cái, bộ, buổi...) */
  unit: string;
  /** Thời gian ước lượng thi công tối thiểu (phút) */
  estimatedDurationMin?: number;
  /** Icon hiển thị hoặc metadata tham chiếu */
  icon?: string;
  /** Trạng thái kích hoạt dịch vụ */
  isActive?: boolean;
}

/**
 * Định nghĩa cấu trúc dữ liệu cho nhóm danh mục (ServiceCategory)
 */
export interface CategorySeedInput {
  /** Tên nhóm danh mục */
  name: string;
  /** Slug danh mục phục vụ SEO */
  slug: string;
  /** Mô tả tổng quan nhóm dịch vụ */
  description: string;
  /** URL biểu tượng nhận diện */
  iconUrl: string;
  /** Trạng thái kích hoạt danh mục */
  isActive?: boolean;
  /** Danh sách các dịch vụ con thuộc danh mục này */
  services: ServiceSeedInput[];
}

/**
 * Dữ liệu mẫu chuẩn hóa 4 nhóm danh mục và các dịch vụ chi tiết của FixGo Pro
 */
const SEED_SERVICE_CATEGORIES: CategorySeedInput[] = [
  // ==========================================================================
  // 1. NHÓM ĐIỆN - NƯỚC (ELECTRICAL & PLUMBING)
  // ==========================================================================
  {
    name: 'Điện - Nước',
    slug: 'dien-nuoc',
    description: 'Dịch vụ sửa chữa, xử lý sự cố hệ thống điện dân dụng và cấp thoát nước sinh hoạt gia đình',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3100/3100553.png',
    isActive: true,
    services: [
      {
        name: 'Sửa chữa điện',
        slug: 'sua-chua-dien',
        description: 'Xử lý sự cố chập cháy điện cục bộ, thay thế Aptomat, ổ cắm, công tắc, lắp đặt quạt trần và các thiết bị chiếu sáng dân dụng.',
        basePrice: 150000,
        unit: 'lần',
        estimatedDurationMin: 60,
        icon: 'zap',
        isActive: true,
      },
      {
        name: 'Sửa chữa nước',
        slug: 'sua-chua-nuoc',
        description: 'Khắc phục rò rỉ đường ống nước, thay thế vòi nước, dây cấp, phao bồn cầu, xử lý tình trạng thông tắc lavabo và chậu rửa.',
        basePrice: 180000,
        unit: 'lần',
        estimatedDurationMin: 90,
        icon: 'droplet',
        isActive: true,
      },
    ],
  },

  // ==========================================================================
  // 2. NHÓM VỆ SINH & DỌN DẸP (CLEANING & HOUSEKEEPING)
  // ==========================================================================
  {
    name: 'Vệ sinh & Dọn dẹp',
    slug: 've-sinh-don-dep',
    description: 'Dịch vụ dọn dẹp vệ sinh nhà ở, căn hộ gia đình và bảo dưỡng, vệ sinh thiết bị điện lạnh định kỳ',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/995/995053.png',
    isActive: true,
    services: [
      {
        name: 'Dọn dẹp nhà cửa',
        slug: 'don-dep-nha-cua',
        description: 'Dọn dẹp theo giờ, tổng vệ sinh căn hộ, nhà ở theo yêu cầu.',
        basePrice: 80000,
        unit: 'giờ',
        estimatedDurationMin: 180,
        icon: 'sparkles',
        isActive: true,
      },
      {
        name: 'Vệ sinh điện lạnh',
        slug: 've-sinh-dien-lanh',
        description: 'Bảo dưỡng và vệ sinh máy lạnh (điều hòa), máy giặt định kỳ.',
        basePrice: 200000,
        unit: 'bộ',
        estimatedDurationMin: 75,
        icon: 'wind',
        isActive: true,
      },
    ],
  },

  // ==========================================================================
  // 3. NHÓM SỬA CHỮA THIẾT BỊ GIA ĐÌNH (HOME APPLIANCE REPAIR)
  // ==========================================================================
  {
    name: 'Sửa chữa thiết bị gia đình',
    slug: 'thiet-bi-gia-dinh',
    description: 'Kiểm tra, bảo dưỡng và khắc phục các sự cố kỹ thuật của các thiết bị điện máy, điện lạnh dân dụng',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
    isActive: true,
    services: [
      {
        name: 'Sửa chữa thiết bị gia đình',
        slug: 'sua-chua-thiet-bi-gia-dinh',
        description: 'Kiểm tra và khắc phục các lỗi cơ bản của tủ lạnh, lò vi sóng, máy lọc nước gia đình.',
        basePrice: 250000,
        unit: 'thiết bị',
        estimatedDurationMin: 90,
        icon: 'refrigerator',
        isActive: true,
      },
    ],
  },

  // ==========================================================================
  // 4. NHÓM SÂN VƯỜN & TIỆN ÍCH PHỤ (GARDENING & ODD JOBS)
  // ==========================================================================
  {
    name: 'Sân vườn & Tiện ích phụ',
    slug: 'san-vuon-tien-ich',
    description: 'Chăm sóc không gian xanh cảnh quan sân vườn và hỗ trợ lắp đặt nội thất đồ gỗ, giá kệ tại nhà',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1518/1518968.png',
    isActive: true,
    services: [
      {
        name: 'Sân vườn',
        slug: 'san-vuon',
        description: 'Cắt tỉa cây cảnh, dọn dẹp sân vườn quy mô hộ gia đình.',
        basePrice: 200000,
        unit: 'buổi',
        estimatedDurationMin: 120,
        icon: 'trees',
        isActive: true,
      },
      {
        name: 'Lắp đặt nội thất',
        slug: 'lap-dat-noi-that',
        description: 'Hỗ trợ lắp đặt nội thất cơ bản (lắp kệ treo tường, ráp bàn ghế lắp ráp sẵn).',
        basePrice: 150000,
        unit: 'sản phẩm',
        estimatedDurationMin: 60,
        icon: 'hammer',
        isActive: true,
      },
    ],
  },
];

/**
 * Hàm khởi tạo cơ sở dữ liệu (Main Seeder)
 * Đảm bảo kết nối prisma an toàn, xử lý upsert theo từng danh mục và dịch vụ
 */
async function main(): Promise<void> {
  // 1. Khởi tạo kết nối tới cơ sở dữ liệu PostgreSQL
  await prisma.$connect();
  console.log('🔌 [FixGo Pro] Kết nối cơ sở dữ liệu thành công.');
  console.log('🚀 [FixGo Pro] Bắt đầu quá trình nạp dữ liệu mẫu (Seeding Service Catalog)...');
  console.log('----------------------------------------------------------------------');

  let totalCategoriesSeeded = 0;
  let totalServicesSeeded = 0;

  for (const categoryData of SEED_SERVICE_CATEGORIES) {
    const { services, ...categoryFields } = categoryData;

    // 2. Tìm hoặc khởi tạo nhóm danh mục (Idempotent theo tên danh mục)
    let category = await prisma.serviceCategory.findFirst({
      where: { name: categoryFields.name },
    });

    if (category) {
      category = await prisma.serviceCategory.update({
        where: { id: category.id },
        data: {
          description: categoryFields.description,
          iconUrl: categoryFields.iconUrl,
          isActive: categoryFields.isActive ?? true,
        },
      });
      console.log(`📦 [CATEGORY ĐÃ TỒN TẠI - CẬP NHẬT]: ${category.name} (ID: ${category.id})`);
    } else {
      category = await prisma.serviceCategory.create({
        data: {
          name: categoryFields.name,
          description: categoryFields.description,
          iconUrl: categoryFields.iconUrl,
          isActive: categoryFields.isActive ?? true,
        },
      });
      console.log(`✨ [CATEGORY TẠO MỚI]: ${category.name} (ID: ${category.id})`);
    }
    totalCategoriesSeeded++;

    // 3. Khởi tạo các dịch vụ thuộc danh mục
    for (const serviceData of services) {
      const existingService = await prisma.service.findFirst({
        where: {
          name: serviceData.name,
          categoryId: category.id,
        },
      });

      const servicePayload = {
        name: serviceData.name,
        description: serviceData.description,
        basePrice: new Prisma.Decimal(serviceData.basePrice),
        unit: serviceData.unit,
        estimatedDurationMin: serviceData.estimatedDurationMin ?? 60,
        isActive: serviceData.isActive ?? true,
        categoryId: category.id,
      };

      let service;
      if (existingService) {
        service = await prisma.service.update({
          where: { id: existingService.id },
          data: servicePayload,
        });
        console.log(
          `   └── 🔄 [SERVICE CẬP NHẬT]: ${service.name} | Định mức: ${Number(service.basePrice).toLocaleString('vi-VN')} đ/${service.unit}`
        );
      } else {
        service = await prisma.service.create({
          data: servicePayload,
        });
        console.log(
          `   └── ➕ [SERVICE TẠO MỚI]: ${service.name} | Định mức: ${Number(service.basePrice).toLocaleString('vi-VN')} đ/${service.unit}`
        );
      }
      totalServicesSeeded++;
    }
    console.log('----------------------------------------------------------------------');
  }

  console.log(`🎉 [KẾT QUẢ]: Đã đồng bộ thành công ${totalCategoriesSeeded} danh mục và ${totalServicesSeeded} dịch vụ FixGo Pro!`);
}

// 4. Kích hoạt hàm main với cơ chế try / catch / finally chuẩn Production
main()
  .catch((error: Error) => {
    console.error('❌ [FixGo Pro] Quá trình seed dữ liệu thất bại:', error.message);
    console.error(error.stack);
    process.exit(1);
  })
  .finally(async () => {
    // Luôn ngắt kết nối an toàn sau khi hoàn thành hoặc có lỗi
    await prisma.$disconnect();
    console.log('🔒 [FixGo Pro] Đã ngắt kết nối Prisma Client an toàn.');
  });
