# Đăng ký khuôn mặt bằng lần quét đầu — 2026-11-15

Yêu cầu mới thay thế điều kiện duyệt danh tính thủ công trong các tài liệu one-scan
trước đó. Không đối chiếu CCCD; không cần admin, reviewerId hay thời hạn duyệt.

## Hành vi

- Thợ ACTIVE và hồ sơ nghề nghiệp APPROVED lưu đồng ý theo phiên bản hiện hành.
- Nếu chưa có mẫu: lần quét ENROLLMENT hợp lệ lưu embedding mã hóa cho tài khoản.
- DAILY/ORDER đối chiếu với mẫu hiện hành; không tạo hoặc ghi đè mẫu.
- Không nhận ảnh đại diện làm mẫu. Chất lượng ảnh, PAD, model readiness, nonce,
  session TTL/quota, owner/order scope, khóa mã hóa và proof vẫn được kiểm tra.
- Đăng ký lại: thu hồi/xóa mẫu cũ, vô hiệu hóa session/proof, đồng ý và quét lại.
  Version tăng; không khôi phục ciphertext đã xóa.
- Các endpoint duyệt cũ trả MANUAL_IDENTITY_REVIEW_REMOVED. Mobile bỏ yêu cầu duyệt.

## Database

Migration: `server/prisma/migrations/20261115000000_face_self_enrollment/migration.sql`.
`reviewId` của session/template thành nullable, bản ghi mới dùng NULL. Trigger mới
kiểm tra worker/consent/epoch/version và không cho tạo mẫu thứ hai còn hiệu lực.
Giữ bảng biometric_reviews và reviewerId cũ để không xóa lịch sử; chúng không còn
là điều kiện đăng ký hoặc xác thực. Không tạo admin/review giả để lấp khóa ngoại.
Không rollback về NOT NULL khi đã có dữ liệu tự đăng ký.

## Kiểm tra và vận hành

- Backend unit: 25 suites, 261 tests (bao gồm kiểm tra còn chặn PAD/consent/approval).
- PostgreSQL disposable: 69 integration cases; schema diff rỗng, guard tồn tại,
  migration apply và teardown/reapply đạt. Gateway trong tests là fixture,
  không phải đánh giá sinh trắc học/PAD thật.
- Mobile liên quan: faceCoreFlow, faceScreen, faceNavigation, faceStatus,
  faceLoginPrompt: 5 suites, 22 tests.
- Mobile: toàn bộ 178 ca đã đạt sau khi cập nhật fixture proof readiness/ACK URL
  và assertion thông báo tiếng Việt; lần chạy cuối kiểm riêng orderFsm đạt 19 ca.
- ARC-01 PostgreSQL/HTTP/Socket: 19 ca đạt; fixture có dịch vụ thợ hợp lệ và
  không cần bản duyệt thủ công.
- FaceID Lab: typecheck và 82 test đạt; UI hiển thị SELF_ENROLLMENT thay Identity review.
- Backend build: Babel 176 files.

Khởi động lại backend và reload mobile sau migration. Các cấu hình Face Core,
khóa mã hóa, capture policy và mô hình/PAD được đánh giá vẫn cần sẵn sàng trước
khi mở camera; thay đổi này chỉ bỏ duyệt danh tính thủ công.

Migration đã được áp dụng vào database local `ondemand_db` sau khi tạo backup
`/tmp/fixgo-self-enrollment-backup-UhtZVc/database.dump` (quyền 0600).
Không bật tự động Face Core, capture policy hoặc phê duyệt PAD.

Đối chiếu bổ sung: 3 lần xác thực DAILY/ORDER thành công giữ nguyên toàn bộ
mẫu đầu tiên (ID, phiên bản, ciphertext và thời điểm tạo); chỉ gọi enroll một lần,
verify ba lần. 69 PostgreSQL integration tests và 15 mobile flow/navigation tests
đạt; backend build đạt. Audit enrollment dùng SELF_ENROLLMENT_QUALITY_PAD_VALIDATED.

Cập nhật: chế độ PAD theo ngưỡng thử nghiệm đã được bổ sung. Xem
[EXPERIMENTAL-PAD-FLOW.md](./EXPERIMENTAL-PAD-FLOW.md). Cơ chế evaluated giữ nguyên.
