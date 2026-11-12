# Build, test và debug hai app FixGo

## Chạy hằng ngày

Cài dependencies bằng `npm ci --legacy-peer-deps` trong từng thư mục app.
Hai app dùng Jest 29 với jest-expo 52. Unit test mock Google Sign-in, WebView,
Firebase và OTP; đăng nhập Google và gửi OTP thật phải được kiểm thử trên thiết bị.

1. Chạy backend: `npm --prefix server run start:dev`.
2. Điền `.env` của cả hai app với cùng backend:
   ```dotenv
   EXPO_PUBLIC_API_URL=http://<IP-LAN>:3000/api
   EXPO_PUBLIC_SOCKET_URL=http://<IP-LAN>:3000
   ```
3. Build Development Client lần đầu: trong từng app chạy `npx expo run:android --device`.
4. Chạy Metro: `npm --prefix customer-app run start:debug` (8081),
   `npm --prefix worker-app run start:debug` (8082).

URL khai báo tường minh luôn được ưu tiên, kể cả localhost. Android emulator dùng
`10.0.2.2`, điện thoại thật dùng IP LAN có thể truy cập. Nếu không khai báo URL,
app suy ra host từ Metro rồi dùng fallback emulator/localhost.
API, socket và logger dùng chung `src/config/connection.js` trong mỗi app.
Sửa JS/TS dùng Fast Refresh; đổi native dependencies/config phải build lại client.

## Kiểm tra trước khi bàn giao

Chạy tại root:
```bash
bash scripts/check-mobile.sh
```
Script chạy unit test cả hai app, unit test và build backend. Không kết nối DB
hay tự chạy script tạo dữ liệu. GitHub Actions thực hiện các kiểm tra tương ứng.
Kiểm tra Android JS bundle riêng trong từng app:
```bash
npx expo export --platform android --output-dir /tmp/fixgo-bundle
```
Bundle thành công chưa xác nhận Gradle, signing, permissions hoặc runtime native.

## APK preview và môi trường EAS

Profile development/preview/production đã chọn EAS environment tương ứng.
URL tunnel cũ được bỏ khỏi eas.json. Thiết lập trong EAS environment:

- `EXPO_PUBLIC_API_URL=https://<stable-backend>/api`
- `EXPO_PUBLIC_SOCKET_URL=https://<stable-backend>`

Worker hiện có projectId kế thừa từ customer. Tạo một dự án EAS riêng trên tài
khoản Expo của bạn, rồi cấu hình `EXPO_EAS_PROJECT_ID` và `EXPO_EAS_SLUG` khớp
với dự án đó (biến plain text, cần có cả lúc EAS CLI đọc cấu hình local).
`app.config.js` nhận override này; không tự tạo UUID hoặc thay liên kết tài khoản.
Đặt hai biến ở shell chạy EAS CLI và EAS environment tương ứng.

Kiểm tra trước khi build, trong từng app:
```bash
EAS_BUILD_PROFILE=preview npm run check:build
npx eas-cli build --platform android --profile preview
```
`eas-build-post-install` cũng chạy kiểm tra trên EAS. Preview/production bị chặn
nếu thiếu endpoint HTTPS ổn định; worker bị chặn nếu chưa tách projectId.
Không dùng URL example làm endpoint thật. Không cần tách dự án để chạy local.

## Đọc lỗi theo request

API client giữ `status`, `code`, `url`, `requestId`, `response`, `cause` trên lỗi.
Log API không in body/token; có request ID và thời gian response thành công.
Backend nhận hoặc tạo `X-Request-ID`, trả lại header và ghi method/path/status/
duration. CORS cho phép header này trên web.

`logs/mobile.log` ghi app, version, build, route, orderId suy ra từ route order/job,
requestId và timestamp từ client. Log gọi thủ công có thể truyền tham số thứ tư:
```js
sendErrorToLog(error, 'ORDER_ACCEPT', 'error', { orderId, requestId });
```
Tìm cùng requestId trong log backend và mobile để đối chiếu. Đặt breakpoint bằng
React Native DevTools; lỗi native Android dùng `adb -s <device-id> logcat -b crash`.
Logger không có hàng đợi offline và không bảo đảm gửi được khi tiến trình crash.
Error Boundary bắt lỗi render; không thay thế việc catch lỗi async ở event handler.

## Checklist hai thiết bị — theo skill order-flow-qa

Dùng DB test/staging và tài khoản riêng. Ghi commit/build, thiết bị, thời điểm,
orderId, requestId, bước tái hiện và kết quả thực tế. Các mục dưới đây cần chạy
thủ công trên thiết bị; unit test xanh không được tính là đã nghiệm thu.

| Luồng | Kết quả phải kiểm tra |
|---|---|
| Home khách | Summary khi guest/login/token hết hạn; đơn active đúng người |
| Đăng nhập | Customer/worker đúng app; refresh token; logout rồi mở lại |
| Google/OTP | Native sign-in; OTP sai/hết hạn/gửi lại; lỗi mạng hiển thị được |
| Thợ bật/tắt online | Vị trí và khả năng nhận việc đồng bộ với backend |
| Tạo đơn + AI | Chọn dịch vụ, tọa độ, ảnh; AI timeout/lỗi có hành vi rõ ràng |
| Tìm thợ | Đúng dịch vụ, trạng thái online và bán kính; không có thợ |
| Nhận đơn đồng thời | Một thợ thắng; các thợ còn lại nhận 409; DB không bị ghi đè |
| Socket reconnect | Tắt Wi-Fi, bật lại; vào lại phòng; tải lại trạng thái từ API |
| Khôi phục app | Đóng/mở app ở các bước; đơn active không mất/nhân đôi |
| Đến nơi/KYC | Khuôn mặt đúng/sai; từ chối camera/GPS; AI unavailable |
| Hoàn tất | Ảnh trước/sau, trạng thái khách và thợ đồng bộ |
| Thanh toán/ví | Bấm lặp/retry không ghi nhận hai lần; hoa hồng và ví nhất quán |

`server/test/concurrency-order-race.test.js` là script tích hợp có tạo dữ liệu DB,
không thuộc Jest mặc định. Chỉ chạy sau khi cấu hình DB test và kiểm tra seed/
cleanup; không chạy trên dữ liệu thật. Test E2E bootstrap hiện chưa thay thế checklist.
