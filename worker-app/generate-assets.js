const Jimp = require('jimp-compact');
const path = require('path');
const fs = require('fs');

const FIXGO_BLUE = 0x3B82F6FF; // #3B82F6
const WHITE = 0xFFFFFFFF;

async function createValidAssets() {
  console.log('🎨 Đang tạo bộ icon và splash chuẩn định dạng PNG cho Expo...');

  const iconDir = path.join(__dirname, 'assets', 'icons');
  const imageDir = path.join(__dirname, 'assets', 'images');
  fs.mkdirSync(iconDir, { recursive: true });
  fs.mkdirSync(imageDir, { recursive: true });

  // 1. icon.png (1024x1024) - Chuẩn App Store & Play Store
  const appIcon = new Jimp(1024, 1024, FIXGO_BLUE);
  await appIcon.writeAsync(path.join(iconDir, 'icon.png'));
  console.log('✅ Đã tạo assets/icons/icon.png (1024x1024)');

  // 2. adaptive-icon.png (1024x1024) - Android Foreground Icon
  const adaptiveIcon = new Jimp(1024, 1024, FIXGO_BLUE);
  await adaptiveIcon.writeAsync(path.join(iconDir, 'adaptive-icon.png'));
  console.log('✅ Đã tạo assets/icons/adaptive-icon.png (1024x1024)');

  // 3. favicon.png (48x48) - Web favicon
  const favicon = new Jimp(48, 48, FIXGO_BLUE);
  await favicon.writeAsync(path.join(iconDir, 'favicon.png'));
  console.log('✅ Đã tạo assets/icons/favicon.png (48x48)');

  // 4. splash-icon.png (1024x1024) - Màn hình splash
  const splashIcon = new Jimp(1024, 1024, FIXGO_BLUE);
  await splashIcon.writeAsync(path.join(imageDir, 'splash-icon.png'));
  console.log('✅ Đã tạo assets/images/splash-icon.png (1024x1024)');

  console.log('\n🎉 Toàn bộ ảnh asset đã được tái tạo hợp lệ 100% với CRC checksum chuẩn!');
}

createValidAssets().catch(err => {
  console.error('❌ Lỗi tạo asset:', err);
  process.exit(1);
});
