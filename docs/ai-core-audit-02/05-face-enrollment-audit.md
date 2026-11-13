# Enrollment và mẫu khuôn mặt thợ

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

## Mẫu tồn tại ở đâu?

**VERIFIED:** Schema có `FaceProfile.id`, `workerId @unique` FK WorkerProfile.id, `facePhotoUrl String`, `faceEmbedding Json?`, `isRegistered Boolean default false`, timestamps. `FaceVerification` có faceProfileId/orderId/capturedPhotoUrl/similarityScore/isMatched/verifiedAt. Không có field tên `faceId`; không coi workerId/faceProfile.id là tên khác của một API enrollment đã triển khai. Migration init tạo cột/relations, chưa chứng minh dữ liệu đã có. [E34](13-evidence-index.md#e34) [E55](13-evidence-index.md#e55)

**VERIFIED:** Search source `server/src` và Prisma scripts cho `faceProfile.create/upsert`, `faceEmbedding`, `isRegistered`, enrollment không tìm thấy writer cho template/embedding. Các consumer hiện đọc `facePhotoUrl`; chưa có caller nạp faceEmbedding. Không đọc dữ liệu sinh trắc học thật trong DB để kiểm tra có row hay không. **NOT VERIFIED:** Template được tạo ngoài repo bởi thao tác admin/manual hoặc quy trình hạ tầng khác. [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26) [E34](13-evidence-index.md#e34) [E37](13-evidence-index.md#e37)

## Call chain đăng ký thực tế

1. Worker App `register-worker` [E63](13-evidence-index.md#e63) → authService.registerWorker → `/api/auth/register/worker` → AuthService.registerWorker tạo User+WorkerProfile DRAFT (name/avatar/idCardNumber/skills). Không tạo FaceProfile, không upload template/CCCD face ở nhánh này. [E35](13-evidence-index.md#e35)
2. PATCH `/workers/me` chỉ cập nhật allowlist (có avatarUrl/idCardNumber), submitApproval kiểm profile/services và chuyển approvalStatus PENDING. Đây là hồ sơ nghề nghiệp, chưa phải biometric enrollment. [E36](13-evidence-index.md#e36)
3. Admin quản lý user/worker và approvalStatus; search không thấy màn enrollment hay template approval. `TargetModal.aiPrompts` quản lý đối tượng dịch vụ, không phải embedding khuôn mặt. [E14](13-evidence-index.md#e14) [E37](13-evidence-index.md#e37)
4. Worker `verification/face` [E62](13-evidence-index.md#e62) là check-in: camera/gallery→daily API; có orderId thì hook báo thiếu contract và screen disable. Không gọi create/upsert template. [E39](13-evidence-index.md#e39) [E40](13-evidence-index.md#e40) [E41](13-evidence-index.md#e41)

**VERIFIED:** Daily yêu cầu `worker.faceProfile.facePhotoUrl`, bỏ qua `isRegistered`; nếu chưa có reference thì reject trước AI. Vì registration không tạo mẫu, tài khoản mới có thể mắc ở check-in dù hồ sơ đã được duyệt. **INFERRED:** Cần provisioning ngoài luồng hiện có để vượt bước thiếu reference; chưa truy DB người thật để xác nhận số tài khoản chịu tác động. [E25](13-evidence-index.md#e25) [E35](13-evidence-index.md#e35)

## Bảng yêu cầu enrollment

| Hạng mục | Hiện trạng audit |
|---|---|
| Thời điểm trước/sau Admin approval | NOT VERIFIED: không có enrollment flow để xác định; daily không tự kiểm approvalStatus trước AI, online gate kiểm riêng [E25](13-evidence-index.md#e25) [E30](13-evidence-index.md#e30) |
| Chủ sở hữu mẫu | VERIFIED: FaceProfile.workerId FK worker; daily lấy worker theo JWT userId. Per-order access cũng assigned-worker. Không tin frontend workerId ở hai endpoint này [E24](13-evidence-index.md#e24) [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26) [E29](13-evidence-index.md#e29) |
| Chứng minh mẫu thuộc danh tính đã duyệt | NOT VERIFIED: reference existence không chứng minh danh tính; idCardNumber text không phải ảnh CCCD đã đối chiếu [E34](13-evidence-index.md#e34) [E35](13-evidence-index.md#e35) |
| Quality/số mặt/góc/ánh sáng | VERIFIED: không enrollment quality pipeline; face_verify chọn faces[0] khi len>0, không yêu cầu đúng một face [E23](13-evidence-index.md#e23) |
| Số mẫu/giới hạn lần/ai được đổi | NOT VERIFIED: không có enrollment/re-enrollment endpoint/policy; schema unique worker ngăn nhiều row, không chặn đổi nội dung row [E34](13-evidence-index.md#e34) |
| Ghi đè reference | VERIFIED: không thấy FaceProfile update API; per-order fallback reference dùng worker.avatarUrl/user.avatarUrl, là các đường có cập nhật của chủ tài khoản [E26](13-evidence-index.md#e26) [E36](13-evidence-index.md#e36) [E50](13-evidence-index.md#e50) |
| Audit thay template | NOT VERIFIED: timestamps updatedAt không phải audit log actor/reason/old version; FaceVerification chưa có writer trong runtime source |
| Ảnh/embedding | VERIFIED: URL ảnh ở DB, ảnh upload ở Cloudinary; faceEmbedding optional chưa dùng; inference hiện tính lại từ ảnh reference mỗi lần [E23](13-evidence-index.md#e23) [E34](13-evidence-index.md#e34) [E38](13-evidence-index.md#e38) |
| Bảo mật | VERIFIED: storage block không cấu hình authenticated/private delivery; không thấy field encryption service cho template. NOT VERIFIED: encryption-at-rest/IAM/TLS/cloud policy ngoài repo [E38](13-evidence-index.md#e38) |
| Xóa/lưu trữ | VERIFIED: admin delete user xóa DB face rows, FK cascade; không tìm thấy Cloudinary destroy/delete_resources hoặc job retention cho face. NOT VERIFIED: lifecycle cloud/dashboard [E37](13-evidence-index.md#e37) [E34](13-evidence-index.md#e34) |

## Rủi ro và quy trình khuyến nghị

**CRITICAL SECURITY FINDING liên quan reference — VERIFIED theo đường code:** Per-order không có FaceProfile có thể dùng avatar do worker sửa; nếu ảnh reference không đọc được hoặc không có mặt, FastAPI có thể dùng detection-only và trả verified=true. Như vậy “đối chiếu danh tính đã đăng ký” chưa được bảo đảm, dù request có JWT đúng người. [E26](13-evidence-index.md#e26) [E36](13-evidence-index.md#e36) [E23](13-evidence-index.md#e23)

**RECOMMENDED:** Enrollment sau identity review theo policy, fresh enrollment session, quality gate đúng một mặt; template versioned chỉ được service riêng ghi; xác nhận lại danh tính/một reviewer cho thay mẫu, revoke sessions cũ, audit actor/reason/old/new template version. Không fallback avatar. Lưu template mã hóa, quyền đọc tối thiểu, ảnh gốc có TTL/consent; deletion phải bao gồm object storage và backup theo chính sách đã phê duyệt. Chưa coding/migration trong audit.

**ANDROID E2E PENDING:** đăng ký mới→duyệt→enroll, thay mẫu được/không được phép, thiếu quality, mất mạng giữa upload và commit, tài khoản đổi trên app, thu hồi/xóa mẫu. Không dùng ảnh người thật trong fixture công khai.
