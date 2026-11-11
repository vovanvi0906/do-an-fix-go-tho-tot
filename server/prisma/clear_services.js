const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Xóa sạch dữ liệu Dịch vụ, Đối tượng và Danh mục hiện có
 */
async function clearAllServicesData() {
  console.log('🔄 Đang bắt đầu xóa dữ liệu danh mục, đối tượng và dịch vụ...');

  try {
    // 1. Xóa liên kết thợ - dịch vụ
    const deletedWorkerServices = await prisma.workerService.deleteMany();
    console.log(`✅ Đã xóa ${deletedWorkerServices.count} liên kết thợ - dịch vụ (worker_services)`);

    // 2. Xóa toàn bộ dịch vụ
    const deletedServices = await prisma.service.deleteMany();
    console.log(`✅ Đã xóa ${deletedServices.count} gói dịch vụ (services)`);

    // 3. Xóa toàn bộ đối tượng thiết bị
    const deletedTargets = await prisma.serviceTarget.deleteMany();
    console.log(`✅ Đã xóa ${deletedTargets.count} đối tượng/thiết bị (service_targets)`);

    // 4. Xóa toàn bộ danh mục dịch vụ
    const deletedCategories = await prisma.serviceCategory.deleteMany();
    console.log(`✅ Đã xóa ${deletedCategories.count} danh mục (service_categories)`);

    console.log('🎉 Xóa sạch toàn bộ dữ liệu phân cấp dịch vụ thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllServicesData();

