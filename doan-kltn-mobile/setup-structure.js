const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();

// Helper to ensure directories exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[DIR CREATED] ${path.relative(ROOT_DIR, dirPath) || '.'}`);
  }
}

// Helper to write file if not exists
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf-8');
  console.log(`[FILE CREATED] ${path.relative(ROOT_DIR, filePath)}`);
}

// Boilerplate screen template
function createScreenComponent(screenTitle, description = '') {
  return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ${screenTitle.replace(/[^a-zA-Z0-9]/g, '')}Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Màn hình: ${screenTitle}</Text>
      ${description ? `<Text style={styles.subtitle}>${description}</Text>` : ''}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
`;
}

console.log('🚀 Đang khởi tạo cấu trúc dự án Expo Router (doan-kltn-mobile)...\n');

// 1. Cấu hình Config files
const packageJson = {
  name: "doan-kltn-mobile",
  version: "1.0.0",
  main: "expo-router/entry",
  scripts: {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  dependencies: {
    "expo": "~52.0.0",
    "expo-asset": "~11.0.4",
    "expo-constants": "~17.0.0",
    "expo-font": "~13.0.4",
    "expo-linking": "~7.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-system-ui": "~4.0.8",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.9",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0"
  },
  devDependencies: {
    "@babel/core": "^7.20.0"
  },
  private: true
};

writeFile(path.join(ROOT_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));

const appJson = {
  expo: {
    name: "doan-kltn-mobile",
    slug: "doan-kltn-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icons/icon.png",
    scheme: "doankltn",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icons/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    plugins: [
      "expo-router"
    ],
    experiments: {
      typedRoutes: true
    }
  }
};

writeFile(path.join(ROOT_DIR, 'app.json'), JSON.stringify(appJson, null, 2));

const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`;

writeFile(path.join(ROOT_DIR, 'babel.config.js'), babelConfig);

const envConfig = `# API & Backend Configuration
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
EXPO_PUBLIC_ENV=development
`;

writeFile(path.join(ROOT_DIR, '.env'), envConfig);

const gitignore = `node_modules/
.expo/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
.env.local
.env.*.local
`;

writeFile(path.join(ROOT_DIR, '.gitignore'), gitignore);

// 2. Thư mục app/ (Expo Router)

// Root Layout
const rootLayout = `import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#0F172A',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="(worker)" options={{ headerShown: false }} />
        <Stack.Screen name="common/settings" options={{ presentation: 'modal', headerShown: true, title: 'Cài đặt' }} />
        <Stack.Screen name="common/help" options={{ presentation: 'modal', headerShown: true, title: 'Trợ giúp & Hỗ trợ' }} />
      </Stack>
    </>
  );
}
`;
writeFile(path.join(ROOT_DIR, 'app/_layout.jsx'), rootLayout);

// Root Index (Launcher/Navigation Hub for development)
const rootIndex = `import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function LaunchIndexScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>🎓 ĐỒ ÁN TỐT NGHIỆP</Text>
      <Text style={styles.headerSubtitle}>Nền Tảng Dịch Vụ Thông Minh (Customer & Worker)</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Phân hệ Xác thực (Auth)</Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Đăng nhập (Login)</Text></TouchableOpacity>
        </Link>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Đăng ký (Register)</Text></TouchableOpacity>
        </Link>
        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Quên mật khẩu (Forgot Password)</Text></TouchableOpacity>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Phân hệ Khách hàng (Customer)</Text>
        <Link href="/(user)/(tabs)" asChild>
          <TouchableOpacity style={[styles.button, styles.primaryBtn]}><Text style={styles.primaryBtnText}>Vào Tabs Khách Hàng (Home)</Text></TouchableOpacity>
        </Link>
        <Link href="/(user)/booking" asChild>
          <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Quy trình Đặt lịch (Booking)</Text></TouchableOpacity>
        </Link>
        <Link href="/(user)/order/ORD-123456" asChild>
          <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Chi tiết Đơn hàng (#ORD-123456)</Text></TouchableOpacity>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Phân hệ Thợ (Worker / Provider)</Text>
        <Link href="/(worker)/(tabs)" asChild>
          <TouchableOpacity style={[styles.button, styles.workerBtn]}><Text style={styles.primaryBtnText}>Vào Tabs Thợ (Worker Hub)</Text></TouchableOpacity>
        </Link>
        <Link href="/(worker)/job/JOB-998877" asChild>
          <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Chi tiết Công việc (#JOB-998877)</Text></TouchableOpacity>
        </Link>
        <Link href="/(worker)/verification/face" asChild>
          <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Xác thực khuôn mặt (Face Verification)</Text></TouchableOpacity>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Màn hình dùng chung (Common)</Text>
        <Link href="/common/settings" asChild>
          <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Cài đặt (Settings)</Text></TouchableOpacity>
        </Link>
        <Link href="/common/help" asChild>
          <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Trợ giúp (Help)</Text></TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
  },
  workerBtn: {
    backgroundColor: '#059669',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
`;
writeFile(path.join(ROOT_DIR, 'app/index.jsx'), rootIndex);

// (auth)
const authLayout = `import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0F172A',
        headerBackTitle: 'Quay lại',
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Đăng nhập' }} />
      <Stack.Screen name="register" options={{ title: 'Đăng ký tài khoản' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Quên mật khẩu' }} />
    </Stack>
  );
}
`;
writeFile(path.join(ROOT_DIR, 'app/(auth)/_layout.jsx'), authLayout);
writeFile(path.join(ROOT_DIR, 'app/(auth)/login.jsx'), createScreenComponent('Đăng nhập', 'Màn hình đăng nhập tài khoản Khách hàng / Thợ'));
writeFile(path.join(ROOT_DIR, 'app/(auth)/register.jsx'), createScreenComponent('Đăng ký', 'Màn hình đăng ký tài khoản mới'));
writeFile(path.join(ROOT_DIR, 'app/(auth)/forgot-password.jsx'), createScreenComponent('Quên mật khẩu', 'Màn hình khôi phục mật khẩu'));

// (user)
const userLayout = `import React from 'react';
import { Stack } from 'expo-router';

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="booking/index" options={{ headerShown: true, title: 'Đặt dịch vụ' }} />
      <Stack.Screen name="booking/select-service" options={{ headerShown: true, title: 'Chọn dịch vụ' }} />
      <Stack.Screen name="booking/address" options={{ headerShown: true, title: 'Địa chỉ nhận việc' }} />
      <Stack.Screen name="booking/confirm" options={{ headerShown: true, title: 'Xác nhận đặt lịch' }} />
      <Stack.Screen name="order/[id]" options={{ headerShown: true, title: 'Chi tiết đơn hàng' }} />
    </Stack>
  );
}
`;
writeFile(path.join(ROOT_DIR, 'app/(user)/_layout.jsx'), userLayout);

// (user)/(tabs)
const userTabsLayout = `import React from 'react';
import { Tabs } from 'expo-router';

export default function UserTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarLabel: 'Khám phá' }} />
      <Tabs.Screen name="orders" options={{ title: 'Đơn của tôi', tabBarLabel: 'Hoạt động' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarLabel: 'Thông báo' }} />
      <Tabs.Screen name="profile" options={{ title: 'Cá nhân', tabBarLabel: 'Tài khoản' }} />
    </Tabs>
  );
}
`;
writeFile(path.join(ROOT_DIR, 'app/(user)/(tabs)/_layout.jsx'), userTabsLayout);
writeFile(path.join(ROOT_DIR, 'app/(user)/(tabs)/index.jsx'), createScreenComponent('Trang chủ Khách hàng', 'Danh sách danh mục dịch vụ, banner, thợ nổi bật'));
writeFile(path.join(ROOT_DIR, 'app/(user)/(tabs)/orders.jsx'), createScreenComponent('Danh sách Đơn hàng', 'Quản lý đơn đang thực hiện, hoàn thành, đã huỷ'));
writeFile(path.join(ROOT_DIR, 'app/(user)/(tabs)/notifications.jsx'), createScreenComponent('Thông báo Khách hàng', 'Cập nhật trạng thái đơn hàng & khuyến mãi'));
writeFile(path.join(ROOT_DIR, 'app/(user)/(tabs)/profile.jsx'), createScreenComponent('Hồ sơ Khách hàng', 'Thông tin cá nhân, ví tiền, lịch sử đặt dịch vụ'));

// (user)/booking & order
writeFile(path.join(ROOT_DIR, 'app/(user)/booking/index.jsx'), createScreenComponent('Khởi tạo Đặt lịch', 'Bước khởi tạo chọn loại hình dịch vụ'));
writeFile(path.join(ROOT_DIR, 'app/(user)/booking/select-service.jsx'), createScreenComponent('Chọn Dịch vụ & Gói cước', 'Danh sách dịch vụ chi tiết'));
writeFile(path.join(ROOT_DIR, 'app/(user)/booking/address.jsx'), createScreenComponent('Chọn Địa chỉ', 'Chọn vị trí trên bản đồ / địa chỉ đã lưu'));
writeFile(path.join(ROOT_DIR, 'app/(user)/booking/confirm.jsx'), createScreenComponent('Xác nhận Đặt lịch & Thanh toán', 'Xem tổng quan tiền và phương thức thanh toán'));
writeFile(path.join(ROOT_DIR, 'app/(user)/order/[id].jsx'), `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function UserOrderDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Màn hình: Chi tiết đơn hàng</Text>
      <Text style={styles.idText}>Mã đơn (ID): {id || 'N/A'}</Text>
      <Text style={styles.subtitle}>Hiển thị trạng thái đơn hàng, thông tin thợ, tiến độ thực hiện và chat.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  idText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
`);

// (worker)
const workerLayout = `import React from 'react';
import { Stack } from 'expo-router';

export default function WorkerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="job/[id]" options={{ headerShown: true, title: 'Chi tiết việc làm' }} />
      <Stack.Screen name="verification/face" options={{ headerShown: true, title: 'Xác thực khuôn mặt AI' }} />
    </Stack>
  );
}
`;
writeFile(path.join(ROOT_DIR, 'app/(worker)/_layout.jsx'), workerLayout);

// (worker)/(tabs)
const workerTabsLayout = `import React from 'react';
import { Tabs } from 'expo-router';

export default function WorkerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bàn làm việc', tabBarLabel: 'Trực tuyến' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Nhận việc', tabBarLabel: 'Việc mới' }} />
      <Tabs.Screen name="earnings" options={{ title: 'Thu nhập', tabBarLabel: 'Thu nhập' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarLabel: 'Thông báo' }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ Thợ', tabBarLabel: 'Cá nhân' }} />
    </Tabs>
  );
}
`;
writeFile(path.join(ROOT_DIR, 'app/(worker)/(tabs)/_layout.jsx'), workerTabsLayout);
writeFile(path.join(ROOT_DIR, 'app/(worker)/(tabs)/index.jsx'), createScreenComponent('Bảng điều khiển Thợ (Dashboard)', 'Trạng thái On/Off trực tuyến, công việc đang nhận'));
writeFile(path.join(ROOT_DIR, 'app/(worker)/(tabs)/jobs.jsx'), createScreenComponent('Danh sách Việc làm cần Thợ', 'Danh sách việc làm xung quanh theo định vị GPS'));
writeFile(path.join(ROOT_DIR, 'app/(worker)/(tabs)/earnings.jsx'), createScreenComponent('Thống kê Thu nhập & Ví', 'Báo cáo doanh thu ngày, tuần, tháng và rút tiền'));
writeFile(path.join(ROOT_DIR, 'app/(worker)/(tabs)/notifications.jsx'), createScreenComponent('Thông báo Thợ', 'Thông báo đơn mới, thưởng và hệ thống'));
writeFile(path.join(ROOT_DIR, 'app/(worker)/(tabs)/profile.jsx'), createScreenComponent('Hồ sơ Thợ', 'Đánh giá sao, chứng chỉ nghề, cài đặt bán kính nhận việc'));

// (worker)/job & verification
writeFile(path.join(ROOT_DIR, 'app/(worker)/job/[id].jsx'), `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function WorkerJobDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Màn hình: Chi tiết việc làm cho Thợ</Text>
      <Text style={styles.idText}>Mã việc (Job ID): {id || 'N/A'}</Text>
      <Text style={styles.subtitle}>Xem vị trí khách hàng, chi tiết công việc cần làm, nút nhận việc hoặc hoàn thành.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  idText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
`);

writeFile(path.join(ROOT_DIR, 'app/(worker)/verification/face.jsx'), createScreenComponent('Xác thực Khuôn mặt (Face Verification)', 'Chụp ảnh khuôn mặt và đối chiếu AI trước khi bắt đầu ca làm việc'));

// common screens
writeFile(path.join(ROOT_DIR, 'app/common/settings.jsx'), createScreenComponent('Cài đặt hệ thống (Settings)', 'Cài đặt ngôn ngữ, thông báo, giao diện'));
writeFile(path.join(ROOT_DIR, 'app/common/help.jsx'), createScreenComponent('Trợ giúp & Hỗ trợ (Help)', 'FAQ, chính sách, liên hệ hỗ trợ trung tâm'));

// 3. Cấu trúc thư mục src/
const features = [
  'auth',
  'booking',
  'orders',
  'services',
  'location',
  'chat',
  'payment',
  'face-verification',
  'image-analysis',
];

features.forEach(feat => {
  const featurePath = path.join(ROOT_DIR, 'src', 'features', feat);
  ensureDir(path.join(featurePath, 'components'));
  ensureDir(path.join(featurePath, 'hooks'));
  ensureDir(path.join(featurePath, 'services'));
  ensureDir(path.join(featurePath, 'store'));

  const indexContent = `// Feature: ${feat}
// Export public API cho module ${feat}

export * from './components';
export * from './hooks';
export * from './services';
export * from './store';
`;
  writeFile(path.join(featurePath, 'index.js'), indexContent);
  writeFile(path.join(featurePath, 'components', 'index.js'), `// Export components of ${feat}\n`);
  writeFile(path.join(featurePath, 'hooks', 'index.js'), `// Export hooks of ${feat}\n`);
  writeFile(path.join(featurePath, 'services', 'index.js'), `// Export services of ${feat}\n`);
  writeFile(path.join(featurePath, 'store', 'index.js'), `// Export store/slices of ${feat}\n`);
});

// Shared src folders
const sharedSrcDirs = [
  'components/ui',
  'components/layout',
  'components/feedback',
  'services/api',
  'services/storage',
  'services/socket',
  'store',
  'hooks',
  'utils',
  'constants',
  'config',
  'types',
];

sharedSrcDirs.forEach(subDir => {
  const dirPath = path.join(ROOT_DIR, 'src', subDir);
  ensureDir(dirPath);
  writeFile(path.join(dirPath, 'index.js'), `// Module: ${subDir}\nexport {};\n`);
});

// 4. Thư mục assets/
const assetDirs = [
  'assets/images',
  'assets/icons',
  'assets/fonts',
];

assetDirs.forEach(aDir => {
  const dirPath = path.join(ROOT_DIR, aDir);
  ensureDir(dirPath);
  writeFile(path.join(dirPath, '.gitkeep'), '');
});

console.log('\n✅ Đã tạo thành công toàn bộ cấu trúc dự án!');
console.log('👉 Bây giờ bạn có thể chạy:');
console.log('   npm install');
console.log('   npx expo start');
