# AUTH-CUS-02 — DONE

2026-11-13, Asia/Ho_Chi_Minh. Branch `agent/gemini-customer`; baseline `d0ba8cadcf89ed65e0e6b44e47c86470ffdc5280`. Commit: commit chứa báo cáo này.

## Audit

HEAD đúng baseline, đúng 5 file Gemini chưa commit. Giữ phần đúng: bỏ log OTP ở service, AuthContext truyền registration cho social, service gửi field mới và fixture proof. Màn đăng ký còn bỏ qua response verify, thiếu proof; hook đưa idToken vào route params và fallback direct Google sau lỗi backend. Đã hoàn thiện các phần này. Đã đọc server/AUTH-BE-01-report.md, auth controller/service, OTP service, registration-proof service và social DTO; không sửa backend.

## Contract tích hợp

- Verify `/auth/verify-phone-otp` nhận `{phone, code}`, register purpose mặc định. Chỉ chấp nhận verified true cùng registrationProof và registrationProofExpiresIn dương.
- Proof bound phone và TTL chỉ nằm trong memory flow; đổi phone, resend, thành công, unmount xóa proof. Thiếu/hết hạn/sai phone bị chặn trước request.
- `/auth/register/customer` gửi phone + registrationProof cùng profile/password. Shared synchronous lock chống submit trùng send/verify/register.
- API client giữ code backend. REGISTRATION_PROOF_INVALID đưa về bước phone để verify lại.
- Existing Google/Firebase login vẫn gọi bằng idToken. First signup bị backend gate sẽ mở phone OTP rồi retry đúng provider với phone + proof. Không dùng updatePhone để bypass first signup. Direct Google fallback khi Firebase credential exchange thất bại; không retry provider sau lỗi backend/role.
- Social credential giữ ở memory, TTL 10 phút, clear khi hoàn tất/hủy/logout. Route chỉ mang cờ isSocialSignup. Reload cần Google login lại.
- Không persist/log OTP/proof; request setup error không log nguyên object có thể chứa credential. Role guard và session storage vẫn qua authService.

## Files

app/(auth)/register-customer.jsx; jest.setup.js; src/features/auth/context/AuthContext.jsx; src/features/auth/services/{authService.js,otpService.js,registrationFlow.js}; src/hooks/useGoogleAuth.js; src/services/api/apiClient.js; __tests__/{apiClient.test.js,registerCustomer.test.js,registrationProof.test.js,socialRegistration.test.js}; báo cáo này.

## Kiểm thử

- npm run test:ci: PASS, 17 suites / 92 tests. Valid/failed OTP, missing/expired/wrong-phone proof, registration success, double-submit, backend invalid proof recovery, existing social login, first Firebase/Google signup, memory cleanup, no credential logging/persistence. Regression role guard, order storage isolation, refresh/logout PASS. Không xóa test.
- npx tsc --noEmit: PASS.
- npm run check:build: PASS; development endpoint fallback enabled.
- git diff --check: PASS.
- Còn warning React Animated act ở tests UI; không có test fail.

## Dependencies và giới hạn

Không có blocker từ source contract. Backend live cần AUTH-BE-01, bảng registration_proofs, generated Prisma client và OTP secret đúng theo báo cáo backend. Không deploy/migrate hoặc xác minh môi trường live trong task này.

Live SMS, Google/Firebase token thật, device/native/web E2E với backend/DB thật: NOT_VERIFIED. Tests mock identity-provider/network boundaries. Client TTL chỉ là UX; backend quyết định expiry/consume. Nếu backend commit nhưng mất response, proof đã dùng sẽ bị từ chối; người dùng có thể đăng nhập.

Chỉ sửa customer-app; bảo toàn thay đổi Gemini đúng, không reset, không push/merge, không chuyển task.
