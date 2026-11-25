# Kết quả kiểm thử AI-ADMIN-01 (lịch sử)

Cơ chế bootstrap bên dưới đã được thay thế theo yêu cầu chủ dự án. Kết quả hiện hành: [ADMIN-AUTO-RESULTS.txt](ADMIN-AUTO-RESULTS.txt).

**14/14 HTTP/security integration tests đạt.** Kiểm thử Chromium Admin Web cũng đạt. Client và backend build thành công; `git diff --check` cho source liên quan không lỗi.

## Đã kiểm

- Swagger document được tạo thành công với DTO JavaScript khai báo kiểu tường minh; backend thật khởi động và endpoint mới trả 401 khi không token.
- LoginPage/AuthController/AuthService/JWT strategy hiện có; password sai, account blocked, refresh token, mock token, claim role ADMIN giả cho user CUSTOMER bị chặn.
- AI module không dùng secret fallback/ngắn, không thay luồng auth chung.
- Admin chưa assignment bị từ chối; Viewer/Coordinator không tự có quyền khác.
- Đủ 54 mapping, từng quyết định gắn user ID server.
- Payload độc lập không có prediction, mapping AI, sampling hint, filesystem path hoặc nhãn người khác; API trả 403 cho reviewer gọi các endpoint này.
- Từ chối reviewerId/role/principal do client gài vào body/nested payload.
- Hai bản nhãn là hai UUID khác nhau; người phân xử thứ ba, không cho A/B tự phân xử.
- Không trả bản phân xử/cặp nhãn trước khi có đủ hai bản độc lập.
- Chặn export khi thiếu nhãn/phân xử/nguồn/quyền/metadata, hoặc user không có quyền.
- Positive export chỉ là **contract fixture trong thư mục tạm**: gọi Store.export và validation TASK 01 thật, UUID lấy từ JWT; không phải GT người thật, artifact tạm đã được dọn.
- Hash byte ảnh đúng, img-ID/path traversal không mở được file bất kỳ.
- Đổi policy để cùng user giả làm reviewer khác bị chặn bởi identity binding đã lưu.
- Permission manager tách biệt, Coordinator/ordinary Admin không quản lý quyền; chặn self-grant, cấp thêm manager từ body, slot trùng và stale revision; grant/revoke audit, token cũ bị từ chối sau revoke.
- Engine restart replay đủ eventHash, không mất nhãn và không sửa lịch sử gốc.
- Browser đi qua 7 bước và trang nhân sự AI, A/B là hai session/tài khoản fixture riêng, nhãn B không được prefill từ A; source review, export bị chặn, grant/revoke qua UI đều đạt.

## Phạm vi bằng chứng

Không tạo/seed tài khoản trong PostgreSQL, không dùng một tài khoản thật đóng nhiều reviewer. Những UUID/email `*.invalid` trong test/screenshot là object mô phỏng **trong bộ nhớ** của harness, không là user FixGo đã được cấp quyền. Prisma user read được thay bằng adapter bộ nhớ chỉ trong test; login/JWT guards và Python engine là source thật. OTP/social auth không được gọi, không có API trả phí.

Browser chạy Vite/Admin Web thật; các request API được forward tới Nest harness loopback riêng. Không lấy mật khẩu/session của người dùng hoặc bypass guard production. Vì chưa có bootstrap và user ID thật được duyệt, **chưa nghiệm thu quy trình bằng tài khoản/DB FixGo thật**. Điều đó vẫn chờ operator cấu hình và tổ chức người duyệt.

`evidence/integrity.json` xác nhận checksum 35 artifact bất biến TASK 03C, 21.437 ảnh/annotation raw và 1.200 ảnh tham chiếu; source/weights/inference cũ không đổi. Review history được đọc và giữ nguyên, không ghi lại với actor mới. Integrity không là accuracy hoặc nhãn được người xác nhận.

## Lệnh tái chạy

```bash
cd server
./node_modules/.bin/jest --config test/jest-ai01-admin.config.cjs --runInBand
```

Từ repo root, khi Admin Vite đang chạy ở 5173:

```bash
node server/test/check-ai01-admin-ui.cjs
python3 server/scripts/ai01/verify_integrity.py --out docs/ai01-admin/evidence/integrity.json
npm run build --prefix client
npm run build --prefix server
```

Harness dùng port loopback 3039, temporary policy/state, cleanup khi kết thúc. Không chạy các bài e2e seed/migration DB khác để thay thế bài test này. Dependency test đã có sẵn, không cài model hay gọi inference.

## Còn chờ

- Runtime paths/feature flag và bootstrap permission manager thật với hồ sơ phê duyệt.
- Cấp các vai trò cho các Admin FixGo khác nhau; không tự nâng role hệ thống/DB.
- Chốt cutover lịch sử local sang vùng Admin trước khi nhập nhãn thật.
- Gán nhãn, phân xử và chứng cứ nguồn/metadata thật; hiện không tự tạo approved GT.
- Thiết kế persistence/RBAC tập trung trước nhiều replica; schema/migration mới chỉ là đề xuất, chưa thực hiện.
