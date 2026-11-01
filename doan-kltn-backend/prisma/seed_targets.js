const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU SEED SERVICE TARGETS (21 ĐỐI TƯỢNG) VÀ LIÊN KẾT 41 DỊCH VỤ ---');

  // Lấy các categories hiện có
  const categories = await prisma.serviceCategory.findMany();
  const catMap = {};
  for (const c of categories) {
    catMap[c.slug] = c.id;
  }

  // Danh sách 21 Targets phân theo Category Slug
  const targetsData = [
    // 1. Sửa điện (sua-dien)
    {
      catSlug: 'sua-dien',
      name: 'Ổ cắm & Công tắc',
      slug: 'o-cam-cong-tac',
      icon: 'Zap',
      description: 'Sửa chữa, thay mới ổ cắm tường, công tắc cơ và thông minh',
      sortOrder: 1,
      serviceSlugs: ['sua-thay-o-cam-cong-tac-aptomat', 'lap-dat-cong-tac-o-cam-smarthome']
    },
    {
      catSlug: 'sua-dien',
      name: 'Aptomat & Tủ điện',
      slug: 'aptomat-tu-dien',
      icon: 'ShieldAlert',
      description: 'Xử lý chập điện nhảy CB, cân pha, lắp tủ điện và công tơ phụ',
      sortOrder: 2,
      serviceSlugs: ['xu-ly-su-co-chap-dien-nhay-cb', 'lap-dat-sua-tu-dien-dong-ho-phu']
    },
    {
      catSlug: 'sua-dien',
      name: 'Đèn & Thiết bị quạt',
      slug: 'den-chieu-sang-quat',
      icon: 'Lightbulb',
      description: 'Lắp đặt, thay bóng đèn LED chiếu sáng, quạt trần, quạt thông gió',
      sortOrder: 3,
      serviceSlugs: ['lap-dat-sua-den-chieu-sang', 'sua-thay-quat-tran-quat-hut']
    },
    {
      catSlug: 'sua-dien',
      name: 'Dây nguồn & Mạng điện',
      slug: 'day-nguon-mang-dien',
      icon: 'Cable',
      description: 'Kéo dây điện nổi, âm nẹp cách điện an toàn',
      sortOrder: 4,
      serviceSlugs: ['dau-noi-keo-day-dien-noi-luon-ghen']
    },

    // 2. Sửa nước (sua-nuoc)
    {
      catSlug: 'sua-nuoc',
      name: 'Vòi nước & Sen tắm',
      slug: 'voi-nuoc-sen-tam',
      icon: 'Droplet',
      description: 'Khắc phục vòi rỉ nước, thay vòi sen, củ sen nóng lạnh',
      sortOrder: 1,
      serviceSlugs: ['sua-voi-nuoc-ro-ri-thay-voi-sen']
    },
    {
      catSlug: 'sua-nuoc',
      name: 'Chậu rửa & Thoát sàn',
      slug: 'chau-rua-thoat-san',
      icon: 'Waves',
      description: 'Thông tắc lavabo, bồn rửa chén, cống sàn ngập nước',
      sortOrder: 2,
      serviceSlugs: ['thong-tac-lavabo-cong-san-chau-rua-bat']
    },
    {
      catSlug: 'sua-nuoc',
      name: 'Bồn cầu & Bộ xả',
      slug: 'bon-cau-bo-xa',
      icon: 'Bath',
      description: 'Sửa rỉ nước két bồn cầu, thông nghẹt bồn cầu cấp tốc',
      sortOrder: 3,
      serviceSlugs: ['sua-chua-thay-bo-xa-bon-cau', 'thong-tac-bon-cau-nghet']
    },
    {
      catSlug: 'sua-nuoc',
      name: 'Đường ống & Chống thấm',
      slug: 'duong-ong-chong-tham',
      icon: 'Pipette',
      description: 'Sửa vỡ ống nước âm tường, chống thấm cổ ống sàn vệ sinh',
      sortOrder: 4,
      serviceSlugs: ['khac-phuc-buc-vo-ong-nuoc-pvc-ppr', 'chong-tham-co-ong-thoat-san']
    },
    {
      catSlug: 'sua-nuoc',
      name: 'Máy bơm & Bồn nước',
      slug: 'may-bom-bon-nuoc',
      icon: 'Gauge',
      description: 'Sửa máy bơm tăng áp, thay phao cơ ngắt nước bồn tràn',
      sortOrder: 5,
      serviceSlugs: ['sua-chua-lap-may-bom-nuoc-tang-ap', 'thay-phao-co-phao-dien-ngat-nuoc']
    },

    // 3. Điện lạnh (dien-lanh)
    {
      catSlug: 'dien-lanh',
      name: 'Máy lạnh (Điều hòa)',
      slug: 'may-lanh-dieu-hoa',
      icon: 'Wind',
      description: 'Vệ sinh xịt rửa, nạp gas R32/R410A, sửa chảy nước, tháo dỡ lắp đặt',
      sortOrder: 1,
      serviceSlugs: [
        've-sinh-may-lanh-treo-tuong',
        'nap-gas-bo-sung-may-lanh',
        'khac-phuc-may-lanh-chay-nuoc-mang-sau',
        'thao-do-di-doi-lap-dat-may-lanh'
      ]
    },
    {
      catSlug: 'dien-lanh',
      name: 'Máy giặt',
      slug: 'may-giat',
      icon: 'Disc',
      description: 'Vệ sinh tháo lồng, sửa lỗi không vắt, kêu rung lắc, hỏng cấp nước',
      sortOrder: 2,
      serviceSlugs: ['ve-sinh-bao-duong-may-giat', 'sua-may-giat-khong-vat-keu-rung']
    },
    {
      catSlug: 'dien-lanh',
      name: 'Tủ lạnh',
      slug: 'tu-lanh',
      icon: 'Refrigerator',
      description: 'Sửa tủ không đông đá, kém lạnh ngăn mát, hở ron cửa',
      sortOrder: 3,
      serviceSlugs: ['sua-tu-lanh-kem-lanh-hong-ron']
    },

    // 4. Thiết bị gia dụng (thiet-bi)
    {
      catSlug: 'thiet-bi',
      name: 'Bếp từ & Hồng ngoại',
      slug: 'bep-tu-hong-ngoai',
      icon: 'Flame',
      description: 'Sửa bếp từ báo lỗi E0-E9, chập nổ sò công suất, liệt cảm ứng',
      sortOrder: 1,
      serviceSlugs: ['sua-bep-tu-bep-hong-ngoai']
    },
    {
      catSlug: 'thiet-bi',
      name: 'Lò vi sóng & Nồi cơm',
      slug: 'lo-vi-song-noi-com',
      icon: 'Utensils',
      description: 'Sửa lò vi sóng không nóng, xẹt lửa; sửa nồi cơm cao tần báo lỗi',
      sortOrder: 2,
      serviceSlugs: ['sua-lo-vi-song-khong-nong', 'sua-noi-com-dien-tu-cao-tan']
    },
    {
      catSlug: 'thiet-bi',
      name: 'Máy lọc nước & Bình nóng lạnh',
      slug: 'may-loc-binh-nong-lanh',
      icon: 'Coffee',
      description: 'Thay lõi lọc nước RO định kỳ, sửa bình nóng lạnh không nóng/chập điện',
      sortOrder: 3,
      serviceSlugs: ['bao-duong-thay-loi-loc-nuoc-ro', 'sua-may-nuoc-nong-truc-tiep-gian-tiep']
    },
    {
      catSlug: 'thiet-bi',
      name: 'Máy rửa chén & Lò nướng',
      slug: 'may-rua-chen-lo-nuong-am',
      icon: 'Sparkle',
      description: 'Lắp đặt đường cấp thoát máy rửa chén, lò nướng âm tủ',
      sortOrder: 4,
      serviceSlugs: ['lap-dat-may-rua-chen-lo-nuong']
    },

    // 5. Làm vườn (lam-vuon)
    {
      catSlug: 'lam-vuon',
      name: 'Cỏ & Sân vườn',
      slug: 'co-san-vuon',
      icon: 'Scissors',
      description: 'Cắt cỏ bằng máy cầm tay, nhổ cỏ dại sân biệt thự',
      sortOrder: 1,
      serviceSlugs: ['cat-tia-co-san-vuon-don-co-dai']
    },
    {
      catSlug: 'lam-vuon',
      name: 'Cây cảnh & Cây bóng mát',
      slug: 'cay-canh-cay-bong-mat',
      icon: 'Trees',
      description: 'Tỉa cành tạo tán bonsai, chặt hạ cành cây to nguy hiểm mùa mưa',
      sortOrder: 2,
      serviceSlugs: ['cat-tia-tao-tan-cay-canh', 'chat-ha-tia-canh-cay-nguy-hiem']
    },
    {
      catSlug: 'lam-vuon',
      name: 'Đất & Hệ thống tưới',
      slug: 'dat-he-thong-tuoi',
      icon: 'Sprout',
      description: 'Cải tạo bón phân vi sinh, lắp đặt bộ tưới nhỏ giọt tự động',
      sortOrder: 3,
      serviceSlugs: ['cai-tao-dat-bon-phan-vi-sinh', 'lap-dat-sua-he-thong-tuoi-nho-giot']
    },

    // 6. Giúp việc (giup-viec)
    {
      catSlug: 'giup-viec',
      name: 'Dọn dẹp nhà cửa',
      slug: 'don-dep-nha-cua',
      icon: 'Home',
      description: 'Dọn nhà theo giờ định kỳ hoặc tổng vệ sinh sau xây dựng',
      sortOrder: 1,
      serviceSlugs: ['don-dep-nha-cua-theo-gio', 'tong-ve-sinh-nha-sau-xay-dung']
    },
    {
      catSlug: 'giup-viec',
      name: 'Giặt hấp & Vệ sinh chuyên sâu',
      slug: 'giat-hap-ve-sinh-chuyen-sau',
      icon: 'Sparkles',
      description: 'Giặt nệm sofa rèm cửa tại chỗ; lau kính nhà cao tầng, khử khuẩn phòng',
      sortOrder: 2,
      serviceSlugs: [
        'giat-hap-sofa-nem-rem-cua',
        'lau-chui-kinh-nha-pho-can-ho',
        'khu-khuan-diet-nam-moc-phong-ngu'
      ]
    },

    // 7. Dịch vụ khác (dich-vu-khac)
    {
      catSlug: 'dich-vu-khac',
      name: 'Khóa & Côn trùng & Tiện ích',
      slug: 'khoa-con-trung-tien-ich',
      icon: 'Wrench',
      description: 'Sửa khóa cửa, khoan tường treo tranh, phun thuốc muỗi côn trùng',
      sortOrder: 1,
      serviceSlugs: [
        'sua-khoa-cua-thay-khoa-van-tay',
        'khoan-tuong-treo-tranh-gia-ke',
        'phun-thuoc-diet-muoi-kien-gian'
      ]
    }
  ];

  let targetCount = 0;
  let linkedCount = 0;

  for (const t of targetsData) {
    const categoryId = catMap[t.catSlug];
    if (!categoryId) {
      console.warn(`Không tìm thấy category slug: ${t.catSlug}`);
      continue;
    }

    // Upsert Target
    const target = await prisma.serviceTarget.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        categoryId: categoryId,
        icon: t.icon,
        description: t.description,
        sortOrder: t.sortOrder,
        isActive: true,
      },
      create: {
        name: t.name,
        slug: t.slug,
        categoryId: categoryId,
        icon: t.icon,
        description: t.description,
        sortOrder: t.sortOrder,
        isActive: true,
      },
    });
    targetCount++;

    // Liên kết các dịch vụ có slug trong danh sách
    if (t.serviceSlugs && t.serviceSlugs.length > 0) {
      const res = await prisma.service.updateMany({
        where: {
          slug: { in: t.serviceSlugs }
        },
        data: {
          targetId: target.id
        }
      });
      linkedCount += res.count;
    }
  }

  console.log(`Đã seed thành công ${targetCount} ServiceTarget.`);
  console.log(`Đã liên kết targetId cho ${linkedCount} Services.`);
}

main()
  .catch((e) => {
    console.error('Lỗi seed targets:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
