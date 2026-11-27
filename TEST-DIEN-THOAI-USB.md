# Build và test FixGo trên điện thoại Android qua USB

Dành cho Ubuntu/Linux và điện thoại Android thật. Build cài trực tiếp từ laptop
bằng Expo Development Client; không cần Expo Go hay EAS cloud build.
Chạy các khối theo thứ tự, mỗi terminal giữ chạy riêng như hướng dẫn.

## 1. Chuẩn bị lần đầu

Trên điện thoại: bật **Tùy chọn nhà phát triển → Gỡ lỗi USB**, cắm cáp truyền
dữ liệu, mở khóa và chấp nhận thông báo cho phép gỡ lỗi từ laptop.

Máy tính cần Node/npm, JDK 17, Android SDK trong Android Studio (Android 35,
Build Tools 35.0.0, Platform Tools). Gradle có thể cần tải thêm dependency/NDK
trong lần build đầu. Hai app đã có thư mục native Android, không cần prebuild.

Trong mỗi terminal dùng lệnh Android, chạy phần thiết lập sau. Nếu SDK được
cài chỗ khác, thay đường dẫn ANDROID_HOME tương ứng.

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

node --version
npm --version
java -version
adb version
adb devices -l
```

Điện thoại phải hiện trạng thái `device`. Nếu là `unauthorized`, mở khóa và
chấp nhận thông báo RSA trên điện thoại. Nếu không thấy máy, kiểm tra cáp,
chế độ kết nối USB và quyền udev trên Ubuntu.

Nếu chưa cài dependencies hoặc vừa đổi lockfile:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
npm --prefix server ci --legacy-peer-deps
npm --prefix customer-app ci --legacy-peer-deps
npm --prefix worker-app ci --legacy-peer-deps
```

Giữ các file cấu hình local hiện có: `server/.env`, `.env` của hai app và
`google-services.json` tương ứng. Không chép đè file đang dùng.

## 2. Terminal A — backend

Backend dùng cổng 3000. `server/.env` cần trỏ tới PostgreSQL/Redis development
đang chạy. Lệnh bên dưới không khởi tạo hoặc migrate database.

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
npm --prefix server run start:dev
```

Nếu PostgreSQL/Redis của dự án dùng Docker Compose và đang dừng, mở terminal
khác để bật riêng chúng. Compose cần `POSTGRES_PASSWORD` trong môi trường hoặc
file `.env` riêng ở root, khớp DB local đã cấu hình:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
docker compose up -d postgres redis
docker compose ps
```

Không cần chạy seed, reset DB hay `prisma db push` để cài app qua USB.

## 3. Terminal B — AI service (khi cần test quét ảnh)

Nếu AI service đã chạy cổng 8000 thì bỏ qua bước khởi động. Backend local cần
`AI_SERVICE_URL=http://127.0.0.1:8000` trong `server/.env`; nếu đổi biến này,
khởi động lại backend.

Dùng môi trường Python/model đã chuẩn bị của dự án:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
node scripts/start-usb-ai.cjs
```

Kiểm tra ở terminal khác:

```bash
curl -f http://127.0.0.1:8000/health
curl -I http://127.0.0.1:3000/api/docs
```

Điện thoại gọi backend 3000; backend gọi AI 8000 trên laptop, nên không cần
reverse 8000. Model dấu hiệu chính là `fixgo-multiservice-observer-v2-gated`, hiện bật lớp
nứt. `/health` trả `observableModel.loaded=true`, tên version và danh sách lớp
để kiểm tra model thực sự đã được nạp. App nhận vùng dấu hiệu qua
`observableAnalysis` trong API chẩn đoán hiện có.

Bộ ánh xạ 12 nhãn mới hiện chưa nối vào luồng quét ảnh; việc chạy
app không tự bật model hoặc bảng ánh xạ đó.

## 4. Kết nối USB và chuyển tiếp cổng

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

bash scripts/dev-usb-connect.sh
adb reverse --list
```

Script tạo reverse cho backend **3000**, Customer Metro **8081**, Worker Metro
**8082**. Chạy lại sau khi rút/cắm cáp hoặc khởi động lại điện thoại/ADB.

Nếu nhiều thiết bị đang cắm, lấy serial từ `adb devices -l`, rồi chạy:

```bash
bash scripts/dev-usb-connect.sh --device SERIAL_CUA_DIEN_THOAI
```

Các lệnh build dưới dùng `--device` để bạn chọn đúng điện thoại từ danh sách.
Với lệnh `adb` thủ công khi có nhiều máy, thêm `-s SERIAL_CUA_DIEN_THOAI` ngay
sau `adb`.

## 5. Build và cài app Khách hàng lần đầu

Chạy ở terminal riêng, chờ build xong. `--no-bundler` để Metro được chạy riêng
ở bước 6. Nếu app vừa cài báo chưa kết nối dev server, tiếp tục bước 6.

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot/customer-app
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api
export EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:3000

npm run check:build
npx expo run:android --device --variant debug --port 8081 --no-bundler
```

Lệnh trên build native và cài app **FixGo Khách Hàng** (`com.fixgo.app`) vào máy.
Đây là bản debug cần Metro khi sử dụng.

## 6. Terminal C — chạy app Khách hàng để test

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
bash scripts/dev-mobile.sh customer
```

Giữ terminal này chạy. Mở **FixGo Khách Hàng** trên điện thoại, nhập URL sau
trong màn hình Development Client nếu app chưa tự kết nối:

```text
http://127.0.0.1:8081
```

Hoặc mở bằng lệnh ở terminal đã thiết lập ADB:

```bash
adb shell am start -a android.intent.action.VIEW -d 'fixgocustomer://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
```

Script Metro ép API/socket về localhost cho USB, không sửa `.env` và không cần
chạy `sync-ip`. Reload từ menu developer của app nếu thay đổi chưa hiển thị.

## 7. Tùy chọn — build và chạy app Thợ

Build tuần tự sau khi app Khách hàng đã build xong:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot/worker-app
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api
export EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:3000

npm run check:build
npx expo run:android --device --variant debug --port 8082 --no-bundler
```

Terminal D, giữ chạy riêng:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
bash scripts/dev-mobile.sh worker
```

Mở **FixGo Đối Tác Thợ** (`com.fixgo.worker`), nhập `http://127.0.0.1:8082`,
hoặc chạy ở terminal có ADB:

```bash
adb shell am start -a android.intent.action.VIEW -d 'fixgoworker://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8082'
```

Một máy cài được cả hai app; chuyển bằng Recent Apps. Muốn kiểm tra hai vai trò
realtime đồng thời, dùng hai điện thoại và chạy script reverse cho từng serial.

## 8. Những lần test tiếp theo

Không cần build lại khi chỉ sửa JavaScript/TypeScript hoặc đổi URL API.
Giữ backend/AI chạy và thực hiện:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
bash scripts/dev-usb-connect.sh
bash scripts/dev-mobile.sh customer
```

Nếu cần app Thợ, mở terminal khác chạy `bash scripts/dev-mobile.sh worker`.
Chỉ build native lại khi thêm/đổi native dependency hoặc cấu hình Android.

Kiểm tra trên máy thật: đăng nhập, tải danh mục dịch vụ, chụp/chọn ảnh, xem kết
quả AI, cấp quyền camera/GPS, và luồng đặt lịch bằng tài khoản test. Những thao
tác đặt/hủy đơn sẽ ghi dữ liệu vào backend đang kết nối.

## 9. Xem log và xử lý lỗi thường gặp

Kiểm tra thiết bị, reverse và Metro:

```bash
adb devices -l
adb reverse --list
curl http://127.0.0.1:8081/status
curl http://127.0.0.1:8082/status
```

Chỉ probe 8082 nếu đang chạy Worker. Metro hoạt động trả
`packager-status:running`.

Log JavaScript và crash Android; Ctrl+C để dừng xem:

```bash
adb logcat -s ReactNativeJS AndroidRuntime
```

- **Không kết nối Metro:** chạy lại reverse, kiểm tra terminal Metro đúng app
  và nhập URL localhost đúng cổng trong Development Client.
- **Không gọi được API:** kiểm tra backend 3000 và log terminal A; API URL có
  `/api`, socket URL không có `/api`. Khi đổi biến môi trường, restart Metro.
- **Cổng Metro bận:** dùng `ss -ltnp 'sport = :8081'` hoặc
  `ss -ltnp 'sport = :8082'`, dừng đúng Metro cũ bằng Ctrl+C rồi chạy lại.
- **Không tìm thấy SDK:** kiểm tra ANDROID_HOME trỏ đúng thư mục SDK và đã
  export trong terminal build. Java phải là JDK 17.
- **Google login lỗi nhưng app vẫn mở:** kiểm tra package, Firebase/OAuth và
  SHA chứng chỉ debug. Xem SHA bằng `./gradlew signingReport` trong thư mục
  `customer-app/android` hoặc `worker-app/android`.
- **INSTALL_FAILED_UPDATE_INCOMPATIBLE:** bản đang cài khác chữ ký. Chỉ khi
  chấp nhận mất dữ liệu local của app mới gỡ bản cũ và build lại:

```bash
# Chỉ chạy cho app bạn muốn gỡ; mất phiên đăng nhập/dữ liệu local của app đó.
adb uninstall com.fixgo.app
# Hoặc app Thợ:
adb uninstall com.fixgo.worker
```

## 10. Kết thúc

Ctrl+C tại các terminal Metro, backend và AI do bạn khởi động. Nếu muốn bỏ riêng
các reverse của FixGo trên điện thoại đang chọn:

```bash
adb reverse --remove tcp:3000
adb reverse --remove tcp:8081
adb reverse --remove tcp:8082
```

Tài liệu chỉ cung cấp lệnh. Việc build/cài và kiểm thử trên điện thoại chưa được
thực hiện trong lần viết hướng dẫn này.
