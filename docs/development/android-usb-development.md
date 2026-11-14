# Android development qua USB

Luồng này dùng Expo Development Client, không dùng Expo Go. Chỉ các tiến trình
Metro chạy bằng script USB nhận localhost; không cần sửa IP khi đổi Wi-Fi.

## Chuẩn bị Ubuntu lần đầu

- Cài Node và dependencies theo lockfile của từng app (`npm ci --legacy-peer-deps`).
- Cài Android SDK/platform-tools, cấp quyền udev nếu Ubuntu chưa nhận điện thoại.
- Đặt `export ANDROID_HOME="$HOME/Android/Sdk"`; thêm platform-tools vào PATH nếu cần.
- Cần Bash, curl; JDK 17 nếu build native.
- Bật Developer options và USB debugging, dùng cáp truyền dữ liệu, mở khóa máy
  và chấp nhận dấu RSA của laptop. Kiểm tra `"$ANDROID_HOME/platform-tools/adb" devices -l`.

Audit local: Expo 52, React Native 0.76.9, expo-dev-client 5, Google Sign-in,
WebView, image-picker và location đã có dependencies. Hai package khác nhau:
`com.fixgo.app`, `com.fixgo.worker`; scheme `fixgocustomer`, `fixgoworker`.
Native projects đã tồn tại; không cần prebuild lại chỉ để thay URL.
Gradle wrapper 8.10.2, AGP 8.6.0, compileSdk 35, build-tools 35.0.0,
Kotlin 1.9.25, NDK 26.1.10909125; máy audit có Java 17 và platform 35.
Đây là đối chiếu cấu hình, chưa chứng minh build native thành công.
Cả hai app dùng Google Services Gradle plugin và `google-services.json`;
kiểm tra file local khớp package, Firebase project và SHA chứng chỉ debug
trước khi build. Không đưa secrets vào Git. OAuth cần client ID/redirect/SHA riêng.

## Chạy hằng ngày

Từ root repo:

```bash
bash scripts/dev-usb-connect.sh
# Hoặc chọn rõ thiết bị:
bash scripts/dev-usb-connect.sh --device 10AG3G1KS800336
```

Script ưu tiên ADB hợp lệ từ ANDROID_HOME, sau đó PATH. Một thiết bị sẵn sàng
được chọn tự động; nhiều thiết bị thì chọn tương tác hoặc dùng --device.
Script chỉ thêm/cập nhật reverse 3000, 8081, 8082; giữ mapping khác.
Chạy lại sau khi cắm lại USB hoặc ADB server khởi động lại. Không dùng sudo mặc định.
Backend chưa chạy chỉ là cảnh báo, không biến reverse thành thất bại.

Kiểm tra `server/.env` local, PORT=3000 (hoặc không đặt PORT), DATABASE_URL,
Redis và dịch vụ phụ thuộc: chỉ dùng DB development/test được xác nhận.
Sau khi xác nhận, mở terminal backend:

```bash
npm --prefix server run start:dev
```

Không dùng launcher cũ tự chạy db push để thực hiện quy trình này. Script USB
không khởi chạy DB, backend, migration hay xóa volume.
Backend source có prefix `/api`, Swagger `/api/docs`, bind `0.0.0.0`.

Mở hai terminal độc lập:

```bash
bash scripts/dev-mobile.sh customer
```

```bash
bash scripts/dev-mobile.sh worker
```

Metro chạy dev-client trên localhost, cổng cố định tương ứng 8081/8082.
Script dùng CI mode để Expo không hỏi chuyển cổng khi cổng bận; kiểm tra log,
dừng đúng tiến trình cũ và chạy lại. CI mode hạn chế phím tắt terminal và có thể
hạn chế theo dõi thay đổi theo hành vi Expo/Metro; reload từ Dev Client khi cần.
Ctrl+C dừng riêng Metro của terminal đó. Hai native build không chạy song song.

Mở Dev Client Customer và nhập `http://127.0.0.1:8081`, Worker nhập
`http://127.0.0.1:8082` trong launcher. Có thể mở deep link bằng ADB:

```bash
"$ANDROID_HOME/platform-tools/adb" -s 10AG3G1KS800336 shell am start -a android.intent.action.VIEW -d 'fixgocustomer://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
"$ANDROID_HOME/platform-tools/adb" -s 10AG3G1KS800336 shell am start -a android.intent.action.VIEW -d 'fixgoworker://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8082'
```

Một điện thoại cài được cả hai app, nhưng chỉ một app foreground tại một thời
điểm. Chuyển bằng Recent Apps; Android có thể suspend app nền, ngắt socket hoặc
hạn chế GPS. Dùng hai thiết bị nếu cần chứng minh realtime đồng thời/background.

## Environment và production

Script `dev-mobile.sh` export đúng hai URL cho tiến trình con:

```dotenv
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api
EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:3000
```

Đây là cơ chế tương đương `.env.local` nhưng không ghi file. Theo @expo/env
đang cài: biến shell > `.env.development.local` > `.env.local` >
`.env.development` > `.env`. Script ghi đè hai biến đã export trong shell
của tiến trình script, giữ các biến khác và ép NODE_ENV=development.
IP LAN cũ vẫn có trong hai `.env` local, nhưng đã xác minh không ghi đè được
URL script. Không cần chạy sync-ip cho USB. Chạy Expo trực tiếp sẽ dùng lại
cấu hình bình thường. Không tạo/sửa `.env.local`; hai đường dẫn đó đã bị ignore.

Chỉ API có `/api`; socket URL là origin, service tự nối `/orders`.
Đổi URL cần restart Metro và reload app; không cần rebuild native.
Không chạy release/export/EAS từ một shell tự export localhost. EAS preview và
production dùng HTTPS public theo environment, có check:build sẵn; worker còn
cần EAS project riêng như `docs/mobile-debugging.md`. Task không đổi release config.

## Build/cài lần đầu (thực hiện thủ công sau khi chấp thuận)

Task này chưa build/cài ứng dụng. Trước khi build: kiểm tra ADB, JDK/SDK/NDK,
Google Services, OAuth và native dependencies như trên. Dừng Metro tương ứng
nếu Expo báo cổng bận. Build lần lượt, chờ Customer xong mới chạy Worker:

```bash
cd customer-app
npx expo run:android --device 10AG3G1KS800336 --port 8081 --no-bundler
cd ../worker-app
npx expo run:android --device 10AG3G1KS800336 --port 8082 --no-bundler
```

`--no-bundler` để dùng hai Metro USB riêng đã hướng dẫn; tránh Metro do run:android
khởi chạy lấy lại URL LAN trong .env. Không chạy prebuild --clean.
Build lại khi thay native libraries/plugins, permissions, scheme hoặc config native;
không build lại vì đổi Wi-Fi, URL API hay JS/TS.

## Kiểm tra và troubleshooting

- Host: `curl --noproxy '*' --max-time 5 -i http://127.0.0.1:3000`.
  HTTP 404 chứng minh có HTTP response, không chứng minh API/DB khỏe.
  Kiểm tra Swagger tại `/api/docs`; chọn API chỉ đọc với tài khoản test.
- Reverse: `"$ANDROID_HOME/platform-tools/adb" -s 10AG3G1KS800336 reverse --list`.
- Metro: `curl http://127.0.0.1:8081/status` và cổng 8082 phải trả
  `packager-status:running`.
- Trong từng app xác minh log API base URL localhost, API đọc hoạt động,
  Socket.IO kết nối `/orders`, reconnect và nhận sự kiện với DB test.
- Camera: cấp/từ chối quyền, chụp ảnh bằng màn hình hiện có; GPS: bật location,
  cấp/từ chối quyền, kiểm tra tọa độ thực và trạng thái khi đưa app xuống nền.
  Không đánh dấu camera/GPS/socket PASS chỉ từ curl hoặc unit test.
- `unauthorized`: mở khóa, chấp nhận USB debugging; nếu không xuất hiện, thu hồi
  quyền debugging trên điện thoại rồi kết nối lại.
- `offline`: cắm lại cáp/đổi cổng USB, bật lại debugging; kiểm tra devices trước.
- `Network request failed`: kiểm tra backend, reverse 3000, URL log trong app,
  cleartext native config, restart Metro và reload; không ghép `/api/api`.
- Metro lỗi: kiểm tra reverse đúng cổng, đúng Dev Client/package, dependencies;
  nếu cần clear cache, dừng Metro và chạy Expo với cùng hai URL shell,
  `--dev-client --localhost --port 8081 --clear` (Worker dùng 8082).
- Trùng cổng: dùng `ss -ltnp` tìm chủ sở hữu, tự dừng đúng tiến trình; script
  không kill dịch vụ khác và không tự chọn cổng mới.

## Không có USB

Dừng Metro USB, chạy `npm run start:debug` trong mỗi app với API/Socket URL
LAN hoặc HTTPS backend được cấu hình rõ trong môi trường của bạn. Đảm bảo điện
thoại truy cập được backend và Metro, firewall/cùng Wi-Fi phù hợp. Khi đó mới
cần cập nhật địa chỉ LAN nếu đổi mạng. Emulator có thể dùng `10.0.2.2` hoặc ADB
reverse với serial emulator; điện thoại khác cần reverse riêng hoặc URL reachable.
APK release dùng backend HTTPS public, không phụ thuộc USB/localhost.
Firebase/Google/OAuth vẫn cần internet và cấu hình riêng dù API đi qua USB.

## Phạm vi đã xác minh

Ngày 13/11/2026: reverse thật cả ba cổng và chạy lặp PASS; backend không phản hồi.
Regression và môi trường được ghi chi tiết trong `DEV-USB-01-report.md`.
Build/cài native, API E2E, Socket.IO, camera/GPS và Google OAuth trên điện thoại
chưa được xác minh. Không coi kiểm tra host là kiểm tra HTTP từ điện thoại.
