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
  console.log('================================================================');
  console.log('         FIXGO PRO - SEEDING DỮ LIỆU KIỂM THỬ THỰC TẾ');
  console.log('================================================================\n');

  // Mật khẩu chung 123456 đã hash
  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // ------------------------------------------------------------------
  // 1. SEED SUPER ADMIN
  // ------------------------------------------------------------------
  const adminEmail = 'admin@homeservice.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Super Administrator',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: adminEmail,
      phone: '0900000000',
      name: 'Super Administrator',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`✓ [Admin] Đã sẵn sàng: ${admin.email} (Pass: 123456)`);

  // ------------------------------------------------------------------
  // 2. SEED CATALOG: 4 NHÓM DANH MỤC & DỊCH VỤ
  // ------------------------------------------------------------------
  const createdCategories = {};
  const createdServices = {};

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
    } else {
      category = await prisma.serviceCategory.create({
        data: catFields,
      });
    }
    createdCategories[catData.name] = category;
    console.log(`📦 [Category]: ${category.name} (ID: ${category.id})`);

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

      let savedService;
      if (existingSvc) {
        savedService = await prisma.service.update({
          where: { id: existingSvc.id },
          data: svcPayload,
        });
      } else {
        savedService = await prisma.service.create({
          data: svcPayload,
        });
      }
      createdServices[svc.name] = savedService;
      console.log(`   └── ➕ [Service]: ${svc.name} - ${svc.basePrice.toLocaleString('vi-VN')} đ/${svc.unit}`);
    }
  }

  // ------------------------------------------------------------------
  // 3. SEED 2 TÀI KHOẢN KHÁCH HÀNG (CUSTOMER)
  // ------------------------------------------------------------------
  console.log('\n--- Seeding 2 Tài Khoản Khách Hàng (Customer) ---');

  const CUSTOMERS_DATA = [
    {
      name: 'Nguyễn Văn Khách 1',
      phone: '0901111111',
      email: 'khach1@fixgo.vn',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      address: {
        title: 'Nhà riêng',
        street: 'Số 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        latitude: 10.7769,
        longitude: 106.7009,
      },
    },
    {
      name: 'Trần Thị Khách 2',
      phone: '0902222222',
      email: 'khach2@fixgo.vn',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      address: {
        title: 'Căn hộ chung cư',
        street: 'Số 456 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
        ward: 'Phường 25',
        district: 'Quận Bình Thạnh',
        city: 'TP. Hồ Chí Minh',
        latitude: 10.8031,
        longitude: 106.7144,
      },
    },
  ];

  for (const cData of CUSTOMERS_DATA) {
    // Upsert User
    const user = await prisma.user.upsert({
      where: { phone: cData.phone },
      update: {
        name: cData.name,
        email: cData.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        avatarUrl: cData.avatarUrl,
      },
      create: {
        name: cData.name,
        phone: cData.phone,
        email: cData.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        avatarUrl: cData.avatarUrl,
      },
    });

    // Upsert Customer Profile
    const customerProfile = await prisma.customerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: cData.name,
        avatarUrl: cData.avatarUrl,
      },
      create: {
        userId: user.id,
        fullName: cData.name,
        avatarUrl: cData.avatarUrl,
      },
    });

    // Upsert Customer Wallet
    await prisma.wallet.upsert({
      where: { customerId: customerProfile.id },
      update: { balance: new Prisma.Decimal(1000000) },
      create: {
        customerId: customerProfile.id,
        balance: new Prisma.Decimal(1000000),
        currency: 'VND',
      },
    });

    // Create/Update Address
    const existingAddress = await prisma.address.findFirst({
      where: { customerId: customerProfile.id, isDefault: true },
    });

    if (existingAddress) {
      await prisma.address.update({
        where: { id: existingAddress.id },
        data: {
          ...cData.address,
          isDefault: true,
        },
      });
    } else {
      await prisma.address.create({
        data: {
          customerId: customerProfile.id,
          ...cData.address,
          isDefault: true,
        },
      });
    }

    console.log(`👤 [Customer]: ${cData.name} | SĐT: ${cData.phone} | Tọa độ: (${cData.address.latitude}, ${cData.address.longitude})`);
  }

  // ------------------------------------------------------------------
  // 4. SEED 2 TÀI KHOẢN THỢ (WORKER)
  // ------------------------------------------------------------------
  console.log('\n--- Seeding 2 Tài Khoản Thợ (Worker) ---');

  const catDienNuoc = createdCategories['Điện - Nước']?.id;
  const catVeSinh = createdCategories['Vệ sinh & Dọn dẹp']?.id;
  const catThietBi = createdCategories['Sửa chữa thiết bị gia đình']?.id;

  const WORKERS_DATA = [
    {
      name: 'Lê Văn Thợ Điện',
      phone: '0903333333',
      email: 'tho1@fixgo.vn',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Kỹ thuật viên điện nước chuyên nghiệp 5 năm kinh nghiệm, phục vụ nhanh khu vực Quận 1 và lân cận.',
      skills: ['Sửa chữa điện', 'Sửa chữa nước', 'Thay thế Aptomat', 'Xử lý rò rỉ ống nước'],
      experienceYears: 5,
      rating: 5.0,
      totalReviews: 18,
      currentLat: 10.7780,
      currentLng: 106.6990,
      categoryIds: [catDienNuoc, catThietBi].filter(Boolean),
      serviceNames: ['Sửa chữa điện', 'Sửa chữa nước', 'Sửa chữa thiết bị gia đình'],
      walletBalance: 500000,
    },
    {
      name: 'Phạm Văn Thợ Lạnh',
      phone: '0904444444',
      email: 'tho2@fixgo.vn',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bio: 'Chuyên gia bảo dưỡng, nạp gas máy lạnh dân dụng và sửa chữa tủ lạnh, máy giặt gia đình.',
      skills: ['Vệ sinh máy lạnh', 'Nạp gas R32/R410A', 'Sửa chữa tủ lạnh', 'Bảo dưỡng máy giặt'],
      experienceYears: 7,
      rating: 4.9,
      totalReviews: 32,
      currentLat: 10.8015,
      currentLng: 106.7120,
      categoryIds: [catVeSinh, catThietBi].filter(Boolean),
      serviceNames: ['Vệ sinh điện lạnh', 'Sửa chữa thiết bị gia đình'],
      walletBalance: 500000,
    },
  ];

  for (const wData of WORKERS_DATA) {
    // Upsert User
    const user = await prisma.user.upsert({
      where: { phone: wData.phone },
      update: {
        name: wData.name,
        email: wData.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.WORKER,
        status: UserStatus.ACTIVE,
        avatarUrl: wData.avatarUrl,
      },
      create: {
        name: wData.name,
        phone: wData.phone,
        email: wData.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.WORKER,
        status: UserStatus.ACTIVE,
        avatarUrl: wData.avatarUrl,
      },
    });

    // Upsert Worker Profile
    const workerProfile = await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: wData.name,
        avatarUrl: wData.avatarUrl,
        isOnline: true,
        approvalStatus: 'APPROVED',
        kycStatus: 'APPROVED',
        idCardVerified: true,
        faceVerifiedAt: new Date(),
        currentLat: wData.currentLat,
        currentLng: wData.currentLng,
        serviceCategoryIds: wData.categoryIds,
        skills: wData.skills,
        bio: wData.bio,
        experienceYears: wData.experienceYears,
        rating: wData.rating,
        ratingAvg: wData.rating,
        totalReviews: wData.totalReviews,
      },
      create: {
        userId: user.id,
        fullName: wData.name,
        avatarUrl: wData.avatarUrl,
        isOnline: true,
        approvalStatus: 'APPROVED',
        kycStatus: 'APPROVED',
        idCardVerified: true,
        faceVerifiedAt: new Date(),
        currentLat: wData.currentLat,
        currentLng: wData.currentLng,
        serviceCategoryIds: wData.categoryIds,
        skills: wData.skills,
        bio: wData.bio,
        experienceYears: wData.experienceYears,
        rating: wData.rating,
        ratingAvg: wData.rating,
        totalReviews: wData.totalReviews,
      },
    });

    // Upsert Worker Wallet (bảng worker_wallets)
    await prisma.workerWallet.upsert({
      where: { workerId: workerProfile.id },
      update: {
        balance: new Prisma.Decimal(wData.walletBalance),
      },
      create: {
        workerId: workerProfile.id,
        balance: new Prisma.Decimal(wData.walletBalance),
      },
    });

    // Upsert Wallet (bảng wallets cho compatibility)
    await prisma.wallet.upsert({
      where: { workerId: workerProfile.id },
      update: {
        balance: new Prisma.Decimal(wData.walletBalance),
      },
      create: {
        workerId: workerProfile.id,
        balance: new Prisma.Decimal(wData.walletBalance),
        currency: 'VND',
      },
    });

    // Liên kết WorkerService
    for (const sName of wData.serviceNames) {
      const svc = createdServices[sName];
      if (svc) {
        await prisma.workerService.upsert({
          where: {
            workerId_serviceId: {
              workerId: workerProfile.id,
              serviceId: svc.id,
            },
          },
          update: {
            isAvailable: true,
          },
          create: {
            workerId: workerProfile.id,
            serviceId: svc.id,
            isAvailable: true,
          },
        });
      }
    }

    console.log(`🔧 [Worker]: ${wData.name} | SĐT: ${wData.phone} | Tọa độ GPS: (${wData.currentLat}, ${wData.currentLng}) | Ví: ${wData.walletBalance.toLocaleString('vi-VN')} đ`);
  }

  console.log('\n================================================================');
  console.log('          HOÀN TẤT NẠP DỮ LIỆU SEED CHO HỆ THỐNG');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
