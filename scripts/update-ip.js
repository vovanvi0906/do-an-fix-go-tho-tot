/**
 * @file update-ip.js
 * @description Tự động phát hiện địa chỉ IPv4 Wi-Fi/LAN của máy tính và đồng bộ vào file doan-kltn-mobile/.env.
 * Giúp thiết bị thật (iOS/Android qua Expo Go) và máy tính khác trong cùng mạng LAN luôn kết nối chính xác tới NestJS Backend.
 * Tương thích 100% với Windows (tiếng Anh & tiếng Việt), macOS và Linux.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Danh sách các từ khóa ưu tiên nhận diện card mạng thật
const PRIORITY_WIFI_KEYWORDS = [
  'wi-fi',
  'wifi',
  'wireless',
  'wlan',
  'mạng không dây',
  'en0', // macOS default Wi-Fi
  'wlan0', // Linux Wi-Fi
];

const PRIORITY_ETHERNET_KEYWORDS = [
  'ethernet',
  'eth',
  'lan',
  'local area connection',
  'kết nối mạng cục bộ',
  'en1',
  'eth0',
];

// Danh sách các card mạng ảo / VPN / Docker / WSL cần loại bỏ triệt để
const IGNORED_ADAPTER_PATTERNS = [
  'vethernet',
  'wsl',
  'virtualbox',
  'vmware',
  'loopback',
  'hyper-v',
  'docker',
  'tailscale',
  'zerotier',
  'pseudo',
  'tap',
  'tun',
  'teredo',
  'bluetooth',
  'npcap',
  'vpn',
  'bridge',
  'host-only',
  'hamachi',
  'wireguard',
  'cisco',
  'fortinet',
  'anyconnect',
];

/**
 * Kiểm tra xem IP có phải là địa chỉ LAN hợp lệ không (loại bỏ APIPA 169.254.x.x và loopback)
 */
function isValidLanIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip.startsWith('169.254.')) {
    return false;
  }
  return true;
}

/**
 * Tính điểm ưu tiên cho card mạng
 */
function getInterfaceScore(name, ip) {
  const lowerName = name.toLowerCase();

  // Kiểm tra Wi-Fi (Ưu tiên số 1 cho kết nối điện thoại di động)
  if (PRIORITY_WIFI_KEYWORDS.some((kw) => lowerName.includes(kw))) {
    return 100;
  }

  // Kiểm tra Cáp mạng Ethernet (Ưu tiên số 2)
  if (PRIORITY_ETHERNET_KEYWORDS.some((kw) => lowerName.includes(kw))) {
    return 80;
  }

  // Dải IP Private Class C (192.168.x.x)
  if (ip.startsWith('192.168.')) {
    return 60;
  }

  // Dải IP Private Class A/B (10.x.x.x, 172.16-31.x.x)
  if (ip.startsWith('10.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) {
    return 50;
  }

  return 20;
}

/**
 * Tự động tìm IP máy tính trong mạng LAN
 */
function detectLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;
    const lowerName = name.toLowerCase();

    // Bỏ qua card ảo
    const isVirtual = IGNORED_ADAPTER_PATTERNS.some((p) => lowerName.includes(p));
    if (isVirtual) continue;

    for (const net of netList) {
      // Chỉ lấy IPv4 non-internal
      if (net.family === 'IPv4' && !net.internal && isValidLanIp(net.address)) {
        const score = getInterfaceScore(name, net.address);
        candidates.push({
          name,
          ip: net.address,
          score,
        });
      }
    }
  }

  // Sắp xếp theo điểm ưu tiên giảm dần
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    const best = candidates[0];
    return {
      ip: best.ip,
      interfaceName: best.name,
      isAutoDetected: true,
      allCandidates: candidates,
    };
  }

  return {
    ip: '127.0.0.1',
    interfaceName: 'Localhost / Offline',
    isAutoDetected: false,
    allCandidates: [],
  };
}

/**
 * Main Runner
 */
function run() {
  console.log('================================================================');
  console.log('  🔍 FIXGO NETWORK SYNC - TỰ ĐỘNG ĐỒNG BỘ IP LAN CHO MOBILE');
  console.log('================================================================');

  // Hỗ trợ truyền tham số thủ công từ CLI (ví dụ: node scripts/update-ip.js 192.168.1.50)
  const args = process.argv.slice(2);
  let targetIp = null;
  let adapterName = 'Chỉ định thủ công';

  if (args.length > 0) {
    const rawArg = args[0].replace(/^--ip=|^--ip/, '').trim();
    if (rawArg === 'localhost' || rawArg === '127.0.0.1') {
      targetIp = '127.0.0.1';
      adapterName = 'Localhost Mode';
    } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rawArg)) {
      targetIp = rawArg;
    }
  }

  if (!targetIp) {
    const detection = detectLanIp();
    targetIp = detection.ip;
    adapterName = detection.interfaceName;

    if (!detection.isAutoDetected) {
      console.warn('⚠️ [CẢNH BÁO] Không tìm thấy kết nối Wi-Fi/LAN hợp lệ!');
      console.warn('   Hệ thống đang tạm thời gán IP = 127.0.0.1 (Localhost).');
      console.warn('   Nếu dùng điện thoại thật, hãy kết nối máy tính vào cùng Wi-Fi với điện thoại.');
    }
  }

  // Đường dẫn file .env của Mobile
  const mobileDir = path.resolve(__dirname, '..', 'doan-kltn-mobile');
  const envPath = path.join(mobileDir, '.env');

  if (!fs.existsSync(mobileDir)) {
    fs.mkdirSync(mobileDir, { recursive: true });
  }

  const envContent = [
    `# ================================================================`,
    `# FIXGO MOBILE - AUTO-GENERATED ENVIRONMENT CONFIGURATION`,
    `# Cập nhật lúc: ${new Date().toLocaleString('vi-VN')}`,
    `# Card mạng hoạt động: ${adapterName} (${targetIp})`,
    `# ================================================================`,
    `EXPO_PUBLIC_API_URL=http://${targetIp}:3000/api`,
    `EXPO_PUBLIC_SOCKET_URL=http://${targetIp}:3000`,
    `EXPO_PUBLIC_ENV=development`,
    ``,
  ].join('\n');

  fs.writeFileSync(envPath, envContent, 'utf-8');

  console.log(`\n✅ [ĐỒNG BỘ THÀNH CÔNG] File: doan-kltn-mobile/.env`);
  console.log(`   📍 Card mạng nhận diện: ${adapterName}`);
  console.log(`   🌐 IPv4 Máy tính chủ:   ${targetIp}`);
  console.log(`   📡 Backend API URL:     http://${targetIp}:3000/api`);
  console.log(`   ⚡ Realtime Socket URL: http://${targetIp}:3000`);
  console.log('================================================================\n');
}

run();
