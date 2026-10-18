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

async function detectNgrokTunnel() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const publicUrl = data.tunnels?.[0]?.public_url;
      if (publicUrl && publicUrl.startsWith('http')) {
        return publicUrl;
      }
    }
  } catch (err) {
    // ngrok is not active
  }
  return null;
}

/**
 * Main Runner
 */
async function run() {
  console.log('================================================================');
  console.log('  🔍 FIXGO NETWORK SYNC - TỰ ĐỘNG ĐỒNG BỘ IP LAN / NGROK CHO MOBILE');
  console.log('================================================================');

  // Đường dẫn file .env của Mobile
  const mobileDir = path.resolve(__dirname, '..', 'doan-kltn-mobile');
  const envPath = path.join(mobileDir, '.env');

  if (!fs.existsSync(mobileDir)) {
    fs.mkdirSync(mobileDir, { recursive: true });
  }

  // Hỗ trợ truyền tham số thủ công từ CLI (ví dụ: node scripts/update-ip.js 192.168.1.50)
  const args = process.argv.slice(2);
  let targetIp = null;
  let adapterName = 'Chỉ định thủ công';
  let apiUrl = null;
  let socketUrl = null;

  if (args.length > 0) {
    const rawArg = args[0].replace(/^--ip=|^--ip/, '').trim();
    if (rawArg.startsWith('http')) {
      apiUrl = rawArg.endsWith('/api') ? rawArg : `${rawArg}/api`;
      socketUrl = rawArg.replace(/\/api\/?$/, '');
      adapterName = 'Chỉ định URL thủ công';
    } else if (rawArg === 'localhost' || rawArg === '127.0.0.1') {
      targetIp = '127.0.0.1';
      adapterName = 'Localhost Mode';
    } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rawArg)) {
      targetIp = rawArg;
    }
  }

  // 1. Kiểm tra xem ngrok có đang chạy tunnel công khai không
  if (!apiUrl && !targetIp) {
    const ngrokUrl = await detectNgrokTunnel();
    if (ngrokUrl) {
      apiUrl = `${ngrokUrl}/api`;
      socketUrl = ngrokUrl;
      adapterName = `Ngrok HTTPS Tunnel (${ngrokUrl})`;
      console.log(`🌐 [TỰ ĐỘNG] Phát hiện đường hầm Ngrok HTTPS đang chạy: ${ngrokUrl}`);
    }
  }

  // 2. Nếu file .env hiện tại đã có link ngrok và người dùng không yêu cầu --force-ip
  if (!apiUrl && !targetIp && fs.existsSync(envPath) && !args.includes('--force-ip')) {
    const currentEnv = fs.readFileSync(envPath, 'utf-8');
    const ngrokMatch = currentEnv.match(/EXPO_PUBLIC_API_URL=(https?:\/\/[^\s]+ngrok[^\s]*)/);
    if (ngrokMatch && ngrokMatch[1]) {
      const existingNgrok = ngrokMatch[1];
      apiUrl = existingNgrok;
      socketUrl = existingNgrok.replace(/\/api\/?$/, '');
      adapterName = 'Bảo tồn cấu hình Ngrok trong .env';
      console.log(`🔒 [BẢO LƯU] Giữ nguyên cấu hình Ngrok trong file .env: ${apiUrl}`);
    }
  }

  // 3. Nếu không có ngrok, fallback sang IP LAN Wi-Fi
  if (!apiUrl) {
    if (!targetIp) {
      const detection = detectLanIp();
      targetIp = detection.ip;
      adapterName = detection.interfaceName;

      if (!detection.isAutoDetected) {
        console.warn('⚠️ [CẢNH BÁO] Không tìm thấy kết nối Wi-Fi/LAN hợp lệ!');
        console.warn('   Hệ thống đang tạm thời gán IP = 127.0.0.1 (Localhost).');
      }
    }
    apiUrl = `http://${targetIp}:3000/api`;
    socketUrl = `http://${targetIp}:3000`;
  }

  const envContent = [
    `# ================================================================`,
    `# FIXGO MOBILE - AUTO-GENERATED ENVIRONMENT CONFIGURATION`,
    `# Cập nhật lúc: ${new Date().toLocaleString('vi-VN')}`,
    `# Chế độ kết nối: ${adapterName}`,
    `# ================================================================`,
    `EXPO_PUBLIC_API_URL=${apiUrl}`,
    `EXPO_PUBLIC_SOCKET_URL=${socketUrl}`,
    `EXPO_PUBLIC_ENV=development`,
    ``,
    `# Google Sign-In OAuth Client IDs`,
    `EXPO_PUBLIC_GOOGLE_CLIENT_ID=255047379055-cu8ifeqgfak7nj3sq8bcve9hqh9v85m4.apps.googleusercontent.com`,
    `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=255047379055-cu8ifeqgfak7nj3sq8bcve9hqh9v85m4.apps.googleusercontent.com`,
    `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=255047379055-fnfeg3subj9ej2vda53ho0fluo9f8rib.apps.googleusercontent.com`,
    `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=`,
    `EXPO_PUBLIC_GOOGLE_REDIRECT_URI=https://auth.expo.io/@fuxdaj1501/doan-kltn-mobile`,
    ``,
    `# Firebase Configuration`,
    `EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBAm_qPVoIMUbrHg2bNM3IbRvmYfsErZ9w`,
    `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=fixgo-a0c01.firebaseapp.com`,
    `EXPO_PUBLIC_FIREBASE_REDIRECT_HANDLER=https://fixgo-a0c01.firebaseapp.com/__/auth/handler`,
    `EXPO_PUBLIC_FIREBASE_PROJECT_ID=fixgo-a0c01`,
    `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=fixgo-a0c01.firebasestorage.app`,
    `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=255047379055`,
    `EXPO_PUBLIC_FIREBASE_APP_ID=1:255047379055:android:d984d72c63a8d10b22059a`,
    `EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID=255047379055-mifsjkk52gvrrrj7jfb6851l8hhqfngp.apps.googleusercontent.com`,
    ``,
  ].join('\n');

  fs.writeFileSync(envPath, envContent, 'utf-8');

  console.log(`\n✅ [ĐỒNG BỘ THÀNH CÔNG] File: doan-kltn-mobile/.env`);
  console.log(`   📍 Cấu hình:            ${adapterName}`);
  console.log(`   📡 Backend API URL:     ${apiUrl}`);
  console.log(`   ⚡ Realtime Socket URL: ${socketUrl}`);
  console.log('================================================================\n');
}

run();
