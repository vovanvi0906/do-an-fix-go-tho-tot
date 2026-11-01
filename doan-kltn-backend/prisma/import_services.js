// EXEMPTION: Script import và bóc tách dữ liệu tự động từ tài liệu Markdown (service-dich-vu.md), chứa cấu hình ánh xạ danh mục tĩnh
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CATEGORY_META = {
  'giup-viec': {
    name: 'Giúp việc',
    icon: 'Sparkles',
    basePrice: 120000,
    unit: 'giờ',
    estimatedMinutes: 120,
    warrantyDays: 7,
    description: 'Dịch vụ dọn dẹp nhà ở, giặt sofa thảm rèm, tổng vệ sinh văn phòng căn hộ chuyên nghiệp.',
  },
  'lam-vuon': {
    name: 'Làm vườn',
    icon: 'Trees',
    basePrice: 150000,
    unit: 'lần',
    estimatedMinutes: 90,
    warrantyDays: 15,
    description: 'Cắt tỉa cây cảnh, chăm sóc thảm cỏ, bảo dưỡng và lắp đặt hệ thống tưới tự động sân vườn.',
  },
  'sua-nuoc': {
    name: 'Sửa nước',
    icon: 'Droplet',
    basePrice: 150000,
    unit: 'điểm',
    estimatedMinutes: 60,
    warrantyDays: 30,
    description: 'Sửa chữa rò rỉ đường ống, thông tắc bồn cầu chậu rửa, lắp đặt thiết bị vệ sinh và máy bơm nước.',
  },
  'sua-dien': {
    name: 'Sửa điện',
    icon: 'Zap',
    basePrice: 100000,
    unit: 'điểm',
    estimatedMinutes: 45,
    warrantyDays: 30,
    description: 'Khắc phục sự cố điện dân dụng, chập cháy, thay thế công tắc ổ cắm, aptomat và bảng điện an toàn.',
  },
  'thiet-bi': {
    name: 'Thiết bị gia dụng',
    icon: 'Refrigerator',
    basePrice: 120000,
    unit: 'máy',
    estimatedMinutes: 60,
    warrantyDays: 30,
    description: 'Sửa chữa và bảo dưỡng các thiết bị gia dụng: bếp từ, lò vi sóng, máy lọc nước, máy hút bụi...',
  },
  'dien-lanh': {
    name: 'Điện lạnh',
    icon: 'Wind',
    basePrice: 180000,
    unit: 'máy',
    estimatedMinutes: 60,
    warrantyDays: 30,
    description: 'Vệ sinh, sửa chữa, bảo trì máy lạnh, tủ lạnh, máy giặt, máy sấy và thiết bị làm mát.',
  },
};

const CAT_NAME_TO_SLUG = {
  'GIÚP VIỆC': 'giup-viec',
  'LÀM VƯỜN': 'lam-vuon',
  'SỬA NƯỚC': 'sua-nuoc',
  'SỬA ĐIỆN': 'sua-dien',
  'THIẾT BỊ GIA DỤNG': 'thiet-bi',
  'ĐIỆN LẠNH': 'dien-lanh',
};

function parseServiceMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const categories = [];
  let currentCat = null;
  let currentTarget = null;
  let inServices = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('4. Schema và quy tắc')) break;

    const catMatch = line.match(/^3\.\d+\.\s+([A-ZÀ-Ỹ\s]+)$/u);
    if (catMatch && !line.includes('Đối tượng')) {
      const catSlug = CAT_NAME_TO_SLUG[catMatch[1].trim()];
      if (catSlug) {
        currentCat = { slug: catSlug, ...CATEGORY_META[catSlug], targets: [] };
        categories.push(currentCat);
      }
      currentTarget = null;
      inServices = false;
      continue;
    }

    const targetMatch = line.match(/^3\.\d+\.\d+\.\s+Đối tượng:\s*(.+)$/);
    if (targetMatch && currentCat) {
      const targetName = targetMatch[1].trim();
      currentTarget = {
        name: targetName,
        slug: slugify(targetName),
        sortOrder: currentCat.targets.length + 1,
        services: [],
      };
      currentCat.targets.push(currentTarget);
      inServices = false;
      continue;
    }

    if (line.includes('- Các dịch vụ:')) {
      inServices = true;
      continue;
    }

    if (inServices && currentTarget) {
      const svcMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (svcMatch) {
        currentTarget.services.push({
          name: svcMatch[2].trim(),
          order: parseInt(svcMatch[1]),
        });
      } else if (line.startsWith('3.') || line.startsWith('4.')) {
        inServices = false;
      }
    }
  }

  return categories;
}

function resolveFilePath() {
  const candidates = [
    path.resolve(__dirname, '../../.doc/service-dich-vu.md'),
    path.resolve(process.cwd(), '.doc/service-dich-vu.md'),
    path.resolve(process.cwd(), '../.doc/service-dich-vu.md'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(`Không tìm thấy file service-dich-vu.md tại các đường dẫn: ${candidates.join(', ')}`);
  }
  return found;
}

async function linkWorkersToCategories() {
  const workers = await prisma.workerProfile.findMany();
  if (workers.length === 0) return;

  const allServices = await prisma.service.findMany();
  let linkCount = 0;

  for (const worker of workers) {
    // Lấy các dịch vụ phù hợp để gán cho thợ
    const matchedServices = allServices.slice(0, 15);
    for (const svc of matchedServices) {
      await prisma.workerService.upsert({
        where: { workerId_serviceId: { workerId: worker.id, serviceId: svc.id } },
        create: { workerId: worker.id, serviceId: svc.id, customPrice: svc.basePrice, isAvailable: true },
        update: { isAvailable: true },
      });
      linkCount++;
    }
  }
  console.log(`🔗 Đã liên kết ${linkCount} gói dịch vụ với ${workers.length} hồ sơ thợ.`);
}

async function main() {
  console.log('🚀 Bắt đầu đọc file .doc/service-dich-vu.md và import dữ liệu...');
  const mdPath = resolveFilePath();
  console.log(`📖 Đường dẫn file: ${mdPath}`);

  const parsedCategories = parseServiceMarkdown(mdPath);
  console.log(`📂 Đã bóc tách thành công ${parsedCategories.length} danh mục.`);

  const usedServiceSlugs = new Set();
  let createdTargetsCount = 0;
  let createdServicesCount = 0;

  for (const catData of parsedCategories) {
    console.log(`\n🔹 Đang tạo Danh mục: "${catData.name}" (${catData.targets.length} đối tượng)...`);

    const category = await prisma.serviceCategory.upsert({
      where: { slug: catData.slug },
      create: {
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        icon: catData.icon,
        basePrice: catData.basePrice,
        unit: catData.unit,
        estimatedMinutes: catData.estimatedMinutes,
        warrantyDays: catData.warrantyDays,
        isActive: true,
      },
      update: {
        name: catData.name,
        description: catData.description,
        icon: catData.icon,
        basePrice: catData.basePrice,
        unit: catData.unit,
        estimatedMinutes: catData.estimatedMinutes,
        warrantyDays: catData.warrantyDays,
      },
    });

    for (const tgtData of catData.targets) {
      const target = await prisma.serviceTarget.upsert({
        where: { slug: tgtData.slug },
        create: {
          categoryId: category.id,
          name: tgtData.name,
          slug: tgtData.slug,
          icon: catData.icon,
          description: `Các gói dịch vụ chuyên trách cho ${tgtData.name}`,
          sortOrder: tgtData.sortOrder,
          isActive: true,
        },
        update: {
          categoryId: category.id,
          name: tgtData.name,
          icon: catData.icon,
          sortOrder: tgtData.sortOrder,
        },
      });
      createdTargetsCount++;

      for (const svcData of tgtData.services) {
        let baseSlug = slugify(svcData.name);
        let finalSlug = baseSlug;
        if (usedServiceSlugs.has(finalSlug)) {
          finalSlug = `${baseSlug}-${tgtData.slug}`;
        }
        let counter = 2;
        while (usedServiceSlugs.has(finalSlug)) {
          finalSlug = `${baseSlug}-${tgtData.slug}-${counter}`;
          counter++;
        }
        usedServiceSlugs.add(finalSlug);

        await prisma.service.upsert({
          where: { slug: finalSlug },
          create: {
            categoryId: category.id,
            targetId: target.id,
            name: svcData.name,
            slug: finalSlug,
            description: `${svcData.name} chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành ${catData.warrantyDays} ngày.`,
            basePrice: catData.basePrice,
            unit: catData.unit,
            estimatedDurationMin: catData.estimatedMinutes,
            isActive: true,
            isPopular: svcData.order <= 2,
          },
          update: {
            categoryId: category.id,
            targetId: target.id,
            name: svcData.name,
            basePrice: catData.basePrice,
            unit: catData.unit,
            estimatedDurationMin: catData.estimatedMinutes,
          },
        });
        createdServicesCount++;
      }
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 IMPORT HOÀN TẤT THÀNH CÔNG:`);
  console.log(`- Tổng danh mục:   ${parsedCategories.length}`);
  console.log(`- Tổng đối tượng:  ${createdTargetsCount}`);
  console.log(`- Tổng dịch vụ:    ${createdServicesCount}`);
  console.log('======================================================\n');

  await linkWorkersToCategories();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Lỗi import dữ liệu:', e);
  process.exit(1);
});
