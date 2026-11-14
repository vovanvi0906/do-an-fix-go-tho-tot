# AUTH-BE-01 — Server-side OTP Registration Proof

Ngày: 2026-11-12 (Asia/Ho_Chi_Minh). **Status: DONE (backend implementation + isolated integration verification); chưa triển khai database/client đang dùng.**

Branch: `agent/backend-auth`. Baseline: `bd1b8eed7ac6c0462e73110512f1961a1623193a`; working tree ban đầu sạch.
Commit: commit chứa báo cáo này, lấy hash chính xác bằng `git log -1 --format=%H -- server/AUTH-BE-01-report.md`.
Không push/merge, không chuyển sang FACE-BE-01.

## Audit và root cause

Đã đọc master roadmap, AUTH-WRK-01-report, Customer API audit, source auth/OTP, DTO, UsersService/Repository, Prisma schema/migrations, RedisService, các client Customer/Worker/web và tests backend hiện có.

- Prefix thực tế `/api`. Phone OTP: POST `/auth/send-phone-otp`, POST `/auth/verify-phone-otp`; email có cặp endpoint tương ứng. Verify dùng query `purpose=register` (mặc định) hoặc `reset-password`.
- Redis hiện có: `otp:phone:<normalizedPhone>`, `otp:cooldown:phone:<phone>`, `otp:attempts:phone:<phone>`; TTL OTP 180s, cooldown 60s, tối đa 5 lần sai. Trước đây OTP lưu plaintext và log mã; verify GET/compare/DEL không nguyên tử.
- Verify đăng ký chỉ trả `verified: true`, không cấp credential. Reset-password cấp random resetToken lưu Redis TTL 600s, namespace riêng.
- `registerCustomer` không kiểm OTP; cả `/auth/register/customer` và dispatcher `/auth/register` đều bypass được. Phone còn có thể bỏ trống.
- Google/Firebase cũng tự tạo CUSTOMER mới, do đó cần cùng gate khi tạo mới. Worker registration là đường riêng và giữ contract.
- PostgreSQL dùng Prisma; không có bảng proof/token dùng được để ghi trạng thái tiêu thụ trong transaction tạo User. Redis không thể commit nguyên tử cùng PostgreSQL.
- Customer App gọi endpoint Customer, verify OTP hiện chỉ dùng boolean; Worker gọi endpoint Worker hoặc dispatcher; web có fallback dispatcher. Không sửa các client.
- JavaScript `@Bind(Body())` không cung cấp DTO metatype để global ValidationPipe tự validate. Customer registration nay thực thi trực tiếp các rule RegisterDto, không bỏ validation.

## Thiết kế và bảo mật

- Credential opaque 256-bit từ `crypto.randomBytes`, không chứa claim do client tự khai, không phải unsigned JWT. Chỉ SHA-256 digest được lưu PostgreSQL; bearer proof chỉ trả một lần cho client.
- Bảng `registration_proofs`: hash khóa chính, phone canonical, purpose `customer-registration`, expiresAt, consumedAt, createdAt; TTL 300s, dùng giờ PostgreSQL khi cấp và tiêu thụ.
- Conditional UPDATE kiểm hash + phone + purpose + expiry + consumedAt null; UPDATE và nested User/CustomerProfile create trong **cùng Prisma transaction**. PostgreSQL row lock chống double-submit; rollback khôi phục proof khi tạo tài khoản thất bại. Expiry kiểm bằng `clock_timestamp()` cả khi phải chờ khóa.
- Proof không được dùng như resetToken và ngược lại. Sai/thiếu/giả/hết hạn/đã dùng/sai phone/sai purpose cùng lỗi HTTP 400 `REGISTRATION_PROOF_INVALID`, không tiết lộ record proof.
- Unique conflict khi tạo Customer dùng thông báo chung. Không precheck email/phone để lộ tồn tại qua luồng này.
- Phone canonical cùng hàm normalize hiện có; sau normalize bắt buộc số VN 10 chữ số bắt đầu 03/05/07/08/09. Không nhận phone thiếu hoặc object.
- Phone OTP lưu HMAC-SHA256; yêu cầu `OTP_HASH_SECRET` hoặc fallback `JWT_SECRET` dài tối thiểu 32 ký tự; thiếu cấu hình thì fail closed. Không dùng JWT fallback mặc định yếu cho HMAC.
- Redis Lua kiểm mã, đếm sai và consume OTP nguyên tử; lần sai thứ 5 xóa OTP. Cooldown reserve bằng SET NX EX, chặn send đồng thời.
- Xóa OTP/resetToken log và SMS content/provider response có thể lộ mã; email OTP cũng bỏ log mã. Lỗi SMS ra client là thông báo chung.
- Google/Firebase: tạo Customer mới phải có phone + proof; đăng nhập/liên kết tài khoản đã tồn tại, kể cả Worker, giữ hành vi cũ.

## Contract trước / sau

Path dưới đây nằm sau `/api`. Giữ status Nest hiện hữu: POST thành công HTTP 201; lỗi input/proof HTTP 400 (không đổi status sang 200 theo Swagger mô tả cũ).

| API | Trước | Sau |
|---|---|---|
| POST `/auth/send-phone-otp` | `{phone}` → message/expiresIn/cooldown | Giữ shape; HMAC storage, atomic cooldown |
| POST `/auth/verify-phone-otp[?purpose=register]` | `{phone,code}` → verified/message | Thêm `registrationProof` (64 hex), `registrationProofExpiresIn: 300` |
| Verify `?purpose=reset-password` | verified/message/resetToken | Giữ shape, không trả registrationProof |
| Verify purpose không biết | Ngầm coi như register | 400, không consume OTP |
| POST `/auth/register/customer` | Email/password, phone tùy chọn, không proof | Phone và registrationProof bắt buộc; response user/accessToken/refreshToken giữ shape |
| POST `/auth/register` | Dispatch theo role | CUSTOMER/default bắt buộc proof; WORKER giữ contract |
| POST `/auth/google-login`, `/auth/firebase-google-login`, các alias controller hiện có | Tự tạo Customer bằng idToken | Nếu tạo mới cần thêm phone + registrationProof; login existing không cần proof |
| POST `/auth/register/worker`, `/auth/login` | Worker registration/login | Giữ contract |

Request mẫu sau verify:

```json
{
  "email": "customer@example.test",
  "password": "a-valid-password",
  "phone": "0901234567",
  "fullName": "Khách hàng",
  "registrationProof": "<64-hex-secret-returned-by-verify>"
}
```

## File thay đổi

- `server/prisma/schema.prisma`
- `server/prisma/migrations/20261112000000_registration_proof/migration.sql`
- `server/src/modules/auth/registration-proof.service.js`
- `server/src/modules/auth/auth.service.js`, `auth.controller.js`, `auth.module.js`
- `server/src/modules/auth/otp.service.js`, `otp.controller.js`
- `server/src/modules/auth/email.service.js`, `esms.service.js`
- `server/src/modules/auth/dto/register.dto.js`, `google-login.dto.js`, `firebase-login.dto.js`
- `server/test/auth-be-01.e2e-spec.js`, `jest-auth-be-01.config.cjs`
- Báo cáo này.

Không sửa UI/frontend, AI, Admin, Users modules hoặc Order FSM ARC-01. Admin provisioning có xác thực là phạm vi riêng, không phải public registration.

## Kiểm thử và bằng chứng

Môi trường: container PostGIS `postgis/postgis:16-3.4-alpine` riêng `auth-be-01-postgres`, host port 55432, database `auth_be_01_test`; Redis `redis:7-alpine` riêng `auth-be-01-redis`, host port 56379. Không dùng database/Redis dev ở port 5432/6379/6380.

Chuẩn bị: `npm ci --no-audit --no-fund`; `npx prisma format`; `npx prisma generate`.
Chỉ trên DATABASE_URL test riêng: `npx prisma db push --skip-generate` để dựng **schema hiện tại**. Lịch sử migrations cũ không phản ánh đầy đủ schema hiện tại; không dùng migrate deploy toàn bộ trên DB đang dùng mà chưa reconcile baseline.
SQL migration mới được chạy bằng `psql -v ON_ERROR_STOP=1` trên DB test trống khác `auth_be_01_migration_test`: CREATE TABLE và CREATE INDEX thành công.

Lệnh từ `server/`:

```bash
AUTH_BE_01_TEST_DATABASE_URL='postgresql://postgres:<test-password>@127.0.0.1:55432/auth_be_01_test' \
AUTH_BE_01_TEST_REDIS_URL='redis://127.0.0.1:56379' \
npx jest --config test/jest-auth-be-01.config.cjs --runInBand
npm test -- --runInBand
npm run build
npx prisma validate
```

- Integration: **23/23 PASS** (1 suite). Bao gồm valid proof, missing/forged, expired, wrong phone, wrong purpose, used/replay sau đổi phone, dispatcher, 2 HTTP request đồng thời, expiry trong lúc chờ row lock, 2 DB session thực cùng chờ lock rồi chỉ 1 commit, DTO invalid, rollback khi unique conflict, OTP sai/5-attempt lockout, verify đồng thời chỉ cấp 1 proof, send cooldown đồng thời, OTP expiry, reset purpose separation, unknown purpose, normalize phone, Worker registration/login qua cả 2 route, Google/Firebase create gate và existing Worker login.
- Regression có sẵn: **54/54 PASS**, 7 suites.
- Build Babel: PASS, 124 files. Project là JavaScript, không có script TypeScript typecheck.
- Prisma schema validate/generate: PASS.
- ESLint chỉ các JS thay đổi: PASS, **0 errors, 11 unused-variable warnings** (phần lớn có sẵn). Không chạy script lint `--fix` toàn repository.
- `git diff --check`: PASS. Phạm vi diff chỉ backend auth, schema/migration, tests và báo cáo.
- HTTP/auth service/UsersRepository/transaction/Redis đều thực. Chỉ SMS delivery và Google/Firebase identity-provider boundary được stub. Không tuyên bố kiểm thử concurrency bằng mock DB.

## Schema, triển khai và limitations

**Có đổi schema**, thêm 1 bảng và 1 index, không đổi bảng User/Worker/Order. Đã báo trước khi sửa qua commentary. **Không chạy migration/db push vào database đang dùng.** Trước rollout cần review/apply migration mới theo baseline DB thực tế, generate client và đặt secret OTP mạnh (tối thiểu 32 ký tự) ở mọi backend instance.

- Live SMS và live Google/Firebase token verification: **NOT_VERIFIED**; không gọi provider thật trong tests.
- Frontend end-to-end và deployment production: **NOT_VERIFIED**; chưa sửa client theo giới hạn task.
- Old plaintext phone OTP trong Redis sẽ bị từ chối sau rollout; người dùng cần gửi OTP lại. Đồng bộ phiên bản mọi backend instance, không để instance cũ còn public registration bypass.
- TTL/proof được bảo vệ trên DB, không phụ thuộc client time. Xóa record đã hết hạn có thể làm định kỳ theo expiresAt index; task chưa thêm cleanup job. Xóa record không làm proof cũ hợp lệ trở lại.
- Crash giữa consume OTP trong Redis và insert proof vào DB làm OTP mất hiệu lực, không cấp quyền; người dùng gửi lại sau cooldown. Crash sau DB commit trước response làm đăng ký đã thành công; retry proof bị từ chối, người dùng có thể login. Không có distributed transaction giữa OTP delivery/verification và DB; atomicity bắt buộc ở consume proof + account creation được đáp ứng.
- Rate limit hiện tại là theo phone (cooldown/attempt cap), chưa có quota toàn cục hoặc per-IP/provider abuse protection. Phone/profile update và các chính sách email OTP ngoài registration không được harden đầy đủ trong task này.
- SMS gateway còn cấu hình/credential legacy và default HTTP hiện hữu; cần review transport/rotate credential trong công việc vận hành riêng. Báo cáo không chứa credential.

## Customer App cần cập nhật

1. Giữ registrationProof từ response verify ở bộ nhớ luồng đăng ký; không log mã/proof hoặc persist vào storage lâu dài.
2. Gửi phone đã xác minh và registrationProof cùng request đăng ký Customer; fallback dispatcher cũng phải gửi cùng credential.
3. Nếu proof không hợp lệ/hết hạn/đã dùng, đưa người dùng xác minh OTP lại; đổi phone phải xác minh lại. Không dùng boolean verified làm bằng chứng.
4. Google/Firebase first signup cần bổ sung bước OTP và gửi phone/proof. Existing login giữ flow cũ.
5. Worker không cần thêm field; các client cũ tạo Customer thiếu proof nay bị từ chối có chủ đích. Web registration cũng cần contract mới.

## Acceptance criteria

| Tiêu chí | Kết quả |
|---|---|
| Public Customer registration không có OTP proof bị chặn ở dedicated/dispatcher/social create | PASS |
| Proof bound phone + purpose + short TTL; giả/hết hạn/used bị từ chối | PASS |
| Consume proof + User/CustomerProfile atomic, chống replay/double-submit | PASS — PostgreSQL thực |
| OTP sai/attempt limit/cooldown/concurrent verify | PASS — Redis thực |
| Customer registration thành công, response token/user đúng | PASS |
| Worker register/login regression | PASS |
| Không log OTP/proof/resetToken trong các luồng sửa | PASS — source audit |
| Build/schema/lint/diff check và scope | PASS |
| Không migration trên DB đang dùng, không sửa frontend/AI/Admin/FSM, không push/merge | PASS |
| Live provider, Customer App E2E, rollout trên DB đang dùng | NOT_VERIFIED — dependency triển khai ngoài task |
