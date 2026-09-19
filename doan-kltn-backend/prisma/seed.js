const { PrismaClient, UserRole, UserStatus, Prisma } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const SEED_SERVICE_CATEGORIES = [
  // 1. NHÓM ĐIỆN - NƯỚC (ELECTRICAL & PLUMBING)
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

  // 2. NHÓM VỆ SINH & DỌN DẸP (CLEANING & HOUSEKEEPING)
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

  // 3. NHÓM SỬA CHỮA THIẾT BỊ GIA ĐÌNH (HOME APPLIANCE REPAIR)
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

  // 4. NHÓM SÂN VƯỜN & TIỆN ÍCH PHỤ (GARDENING & ODD JOBS)
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

async function main() {
  await prisma.$connect();
  console.log('--- Bắt đầu Seeding Dữ Liệu FixGo Pro ---');

  // 1. Seed Super Admin User (Idempotent)
  const adminEmail = 'admin@homeservice.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  if (existingAdmin) {
    console.log(`✓ Admin đã tồn tại: ${admin.email}`);
  } else {
    console.log(`✓ Tạo mới Admin thành công: ${admin.email}`);
  }

  // 2. Seed 4 Nhóm Danh Mục & Dịch Vụ
  for (const catData of SEED_SERVICE_CATEGORIES) {
    const { services, slug, ...catFields } = catData;

    let category = await prisma.serviceCategory.findFirst({
      where: { name: catFields.name },
    });

    if (category) {
      category = await prisma.serviceCategory.update({
        where: { id: category.id },
        data: catFields,
      });
      console.log(`📦 [Category cập nhật]: ${category.name}`);
    } else {
      category = await prisma.serviceCategory.create({
        data: catFields,
      });
      console.log(`✨ [Category tạo mới]: ${category.name}`);
    }

    for (const svc of services) {
      const existingSvc = await prisma.service.findFirst({
        where: {
          name: svc.name,
          categoryId: category.id,
        },
      });

      const svcPayload = {
        name: svc.name,
        description: svc.description,
        basePrice: new Prisma.Decimal(svc.basePrice),
        unit: svc.unit,
        estimatedDurationMin: svc.estimatedDurationMin || 60,
        isActive: svc.isActive !== false,
        categoryId: category.id,
      };

      if (existingSvc) {
        await prisma.service.update({
          where: { id: existingSvc.id },
          data: svcPayload,
        });
        console.log(`   └── 🔄 [Service cập nhật]: ${svc.name} - ${svc.basePrice.toLocaleString('vi-VN')} đ/${svc.unit}`);
      } else {
        await prisma.service.create({
          data: svcPayload,
        });
        console.log(`   └── ➕ [Service tạo mới]: ${svc.name} - ${svc.basePrice.toLocaleString('vi-VN')} đ/${svc.unit}`);
      }
    }
  }

  console.log('✅ Hoàn thành Seeding Catalog FixGo Pro thành công.');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
