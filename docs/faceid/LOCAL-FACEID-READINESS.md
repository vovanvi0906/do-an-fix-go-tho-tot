# Mở FaceID local

## Nguyên nhân chưa quét được

Khi `FACE_CORE_ENABLED` không phải `true`, `FaceIdentityService.status` trả về
`canEnroll: false` mà không đọc bản duyệt sinh trắc học. SQL duyệt tài khoản
không thay đổi cấu hình này. Thông báo khi tắt Core phải chỉ rõ máy chủ chưa mở
chức năng; không suy luận rằng người dùng chưa được duyệt danh tính.

Core bật vẫn cần: worker ACTIVE/APPROVED, đồng ý đúng phiên bản, khóa mã hóa hợp lệ, chính sách thu nhận được phê duyệt,
identity model sẵn sàng và PAD có đánh giá được phê duyệt.

## Thử camera và đo mô hình bằng Lab

Từ thư mục gốc:

```bash
./dev-local.sh faceid
./dev-local.sh faceid --status
```

Dùng URL và đường dẫn token riêng do launcher in ra. Lab dùng database thử
nghiệm riêng, không phải tài khoản `tho1@fixgo.vn` trong database chính.
Đọc [hướng dẫn Lab](../../ai-faceid-lab/README.md) và các tùy chọn launcher
trước khi cho phép thu nhận ảnh. Camera chỉ gửi khi research service cho phép.
Lab đo thử mô hình; không cấp template/proof tin cậy khi PAD chưa được duyệt.

## Mở xác thực thật

1. Thực hiện đánh giá theo [PAD protocol](../ai-labs/faceid-pad-evaluation-protocol.md).
   Hiện `ai-service/pad_policy.py:APPROVED_EVALUATIONS` và
   `server/src/modules/workers/face/face-evidence.gateway.js:APPROVED_FACE_PAD`
   đều trống. Cần hồ sơ đánh giá thật, cùng phiên bản model, tiền xử lý,
   crop, checksum và approval reference ở cả hai phía. Không dùng record từ tests.
2. Chạy AI với model identity và `FACE_PAD_MODEL_PATH` đúng artifact đã đánh giá.
   Đặt `AI_SERVICE_URL` của backend trỏ đúng dịch vụ này.
3. Cấu hình riêng trong `server/.env`: `FACE_TEMPLATE_KEYS_JSON` (map key id sang
   khóa base64 32 byte), `FACE_TEMPLATE_KEY_ID` trỏ key hiện hành,
   `FACE_NONCE_KEY_BASE64` (khóa bí mật ngẫu nhiên ít nhất 32 byte).
   Không commit hoặc dùng khóa mẫu. Chỉ bật `FACE_BIOMETRIC_CAPTURE_APPROVED=true`
   khi chính sách thu nhận đã được phê duyệt; bật `FACE_CORE_ENABLED=true` sau
   khi các phụ thuộc sẵn sàng. Khởi động lại backend.
4. Không cần bản duyệt danh tính, reviewerId hoặc thời hạn duyệt. Áp dụng migration
   `20261115000000_face_self_enrollment`. Lần quét đầu tạo mẫu cho tài khoản;
   các lần sau so khớp với mẫu. Không chạy lại SQL tạo review demo.
5. Người dùng đồng ý trên ứng dụng. Đọc `GET /api/workers/me/face/status`
   bằng phiên đăng nhập của thợ, xử lý từng blocker; không sửa `canEnroll` ở client.
6. Nếu còn `Cannot find native module 'ExpoCamera'`, từ `worker-app` chạy
   `npm run android` với thiết bị/emulator đã kết nối. Đây là build và cài lại
   native app, không chỉ reload Metro. Cấp quyền camera và thử trên thiết bị.

Chưa có hồ sơ PAD thì bước 1 vẫn là phần chưa hoàn tất. Bật cờ cấu hình không
thay thế được đánh giá; nhận diện khuôn mặt hoặc đo điểm spoof không tự chứng
minh người thật.
