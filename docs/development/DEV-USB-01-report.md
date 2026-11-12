# DEV-USB-01 — Báo cáo

Ngày: 13/11/2026. Trạng thái: **PARTIAL** — công cụ và kiểm tra local hoàn tất;
nghiệm thu ứng dụng trên điện thoại còn NOT_VERIFIED.

Baseline `3a56586`, nhánh ban đầu `integration/fixgo-sprint-02`, working tree sạch.
Triển khai trên `chore/dev-usb-01`; không merge/push. Không sửa nghiệp vụ, database,
Prisma, package name, native project hoặc cấu hình production.

## Thay đổi / files changed

- `scripts/dev-usb-connect.sh`: chọn thiết bị, tạo/xác minh reverse và probe HTTP.
- `scripts/dev-mobile.sh`: chạy riêng Customer/Worker với localhost, cổng cố định.
- `docs/development/android-usb-development.md`: quy trình và troubleshooting.
- `docs/development/DEV-USB-01-report.md`: kết quả thực tế và giới hạn.

ADB: thử `$ANDROID_HOME/platform-tools/adb` có executable và chạy được `version`,
sau đó fallback ADB hợp lệ trong PATH; gọi start-server trước khi liệt kê thiết bị.
Chọn duy nhất thiết bị trạng thái device, hoặc chọn tương tác/--device khi nhiều
thiết bị. Cảnh báo unauthorized/offline bằng tiếng Việt. Không xóa reverse khác,
không sudo, không kill-server. Lỗi ADB/mapping trả nonzero. Backend chưa chạy là
cảnh báo độc lập; HTTP 404 được chấp nhận như phản hồi HTTP, không gọi là API khỏe.

Environment: chọn cơ chế tương đương env.local bằng export trong tiến trình script
Metro, chỉ thay API/Socket và NODE_ENV=development, CI=1 cho CLI không đổi cổng.
Không ghi `.env*`. @expo/env local đã xác nhận shell ưu tiên cao nhất, tiếp theo
.env.development.local, .env.local, .env.development, .env. IP cũ trong .env của
hai app được bảo toàn cho luồng cũ và không ghi đè URL USB. Hai biến public được
Expo inline khi bundle JS; không cần rebuild native chỉ vì đổi IP.
CI mode hạn chế tương tác terminal và có thể hạn chế watching; reload từ Dev Client.

Cả hai connection resolver đã hỗ trợ URL tường minh. API base chứa /api,
socket origin được service ghép /orders. Backend mặc định PORT 3000, prefix /api,
bind 0.0.0.0. start:debug sẵn có dùng 8081/8082, giữ nguyên để chạy LAN.
Release/EAS config không đổi, guard HTTPS preview/production sẵn có được giữ.
Worker vẫn cần tách EAS project trước preview/production theo tài liệu hiện hữu.

## Sử dụng hằng ngày

1. Cắm USB, mở khóa và chấp nhận debugging.
2. `bash scripts/dev-usb-connect.sh` (đặt ANDROID_HOME lần đầu).
3. Xác nhận DB/Redis development an toàn rồi `npm --prefix server run start:dev`.
4. Terminal riêng: `bash scripts/dev-mobile.sh customer` và
   `bash scripts/dev-mobile.sh worker`.
5. Mở từng Dev Client với localhost:8081 / localhost:8082, chuyển bằng Recent Apps.

## Kết quả kiểm thử thực tế

| Kiểm tra | Kết quả |
|---|---|
| bash -n hai scripts, --help | PASS |
| shellcheck | NOT_VERIFIED — chưa cài |
| git diff --check | PASS |
| Env.local hai app | Không tồn tại; git check-ignore xác nhận cả hai được ignore; không thêm secrets/local env vào Git |
| Hardcoded LAN IP mới | Không có trong bốn file mới |
| ADB devices -l thật | PASS — serial 10AG3G1KS800336, model V2536A, trạng thái device |
| Reverse thật | PASS — 3000, 8081, 8082; reverse --list xác minh từng mapping |
| Chạy lặp script thật | PASS — hai lần liên tiếp |
| Serial không tồn tại | PASS — nonzero, không tạo mapping cho serial khác |
| ADB mô phỏng an toàn | PASS — không thiết bị, unauthorized, offline, nhiều thiết bị noninteractive, chọn serial, reverse failure |
| HTTP 404 mô phỏng | PASS — được nhận là phản hồi HTTP |
| Backend host thật | Không kết nối được cổng 3000; cảnh báo riêng sau reverse thành công |
| Expo env loader thật, cả hai app | PASS — localhost thắng .env LAN hiện tại, các biến khác vẫn được nạp |
| Hai Metro thực tế đồng thời | PASS — /status cổng 8081/8082 trả packager-status:running; đã dừng các tiến trình thử |
| Metro port bận | PASS — socket thử giữ 8081, script trả nonzero và nêu cổng; không đổi cổng |
| Customer Jest | PASS — 17 suites, 92 tests |
| Worker Jest | PASS — 16 suites, 118 tests |
| Customer + Worker tsc --noEmit | PASS cả hai |
| Customer + Worker check:build | PASS cả hai ở development profile; chưa chứng minh release build |
| Native build/cài lên máy | NOT_VERIFIED — chưa thực hiện, cần chấp thuận riêng |
| API E2E/Socket.IO/camera/GPS/Google OAuth | NOT_VERIFIED — chưa chạy ứng dụng với backend thật |

Mock ADB/curl dùng executable tạm; không thay đổi trạng thái điện thoại để mô phỏng
unauthorized/offline. Không gọi API ghi dữ liệu, không khởi chạy backend/DB.
Metro được probe bằng tiến trình thử do task sở hữu và dừng sau kiểm tra.
Reverse mappings FixGo được giữ để dùng hằng ngày.

## Cấu hình thủ công và rủi ro còn lại

Developer đặt ANDROID_HOME hoặc PATH, cấp USB debugging/udev, xác nhận endpoint
backend và database, chuẩn bị Dev Client đã cài. Audit thấy Google Services local
ở cả hai app; cần xác nhận package/Firebase/SHA/OAuth khớp trước build.
Native audit: JDK17, Gradle8.10.2/AGP8.6.0, SDK35; có SDK35 local. Chưa chạy
Gradle nên việc tải dependency, NDK/build-tools và compatibility tổng thể chưa được
xác minh qua build. Không tự sửa package hay tái tạo native project.

Một điện thoại chỉ foreground một app; Android có thể suspend socket/GPS của app
nền. Muốn kiểm tra hai vai trò đồng thời cần hai thiết bị. Reverse không chứng minh
API từ điện thoại hoạt động cho tới khi có Dev Client + backend thật. Khi rút USB,
chạy lại chế độ LAN/HTTPS hoặc emulator; không dùng localhost USB cho release.

Không có app source/config được thay đổi. Sáu kiểm tra regression vẫn đã chạy
để có baseline; test xanh không thay thế kiểm thử thiết bị/API E2E.
