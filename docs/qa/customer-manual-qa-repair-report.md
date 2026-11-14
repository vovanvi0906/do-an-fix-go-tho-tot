# Customer Manual QA Repair — CUS-QA-01…06

Ngày: 13/11/2026 (Asia/Ho_Chi_Minh). Branch ban đầu `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`. Working tree ban đầu chỉ có `?? dev-local-usb.sh`; giữ nguyên file này, không stage/ghi đè.

VERIFIED = code hoặc test được nêu; INFERRED = giả thuyết; NOT VERIFIED = chưa xác minh; RECOMMENDED = đề xuất. Không có tuyên bố PASS E2E Android.

## Root cause từ code trước khi sửa

| Task | Nguyên nhân có bằng chứng | Điều chưa biết |
|---|---|---|
| QA-01 | Không validation URI; tên file content URI có thể không có extension; upload/storage có nhiều chặng | Root cause ERR_NETWORK trên V2536A chưa tái hiện; xem báo cáo riêng |
| QA-02 | `RegistrationProofService.createCustomer` gộp mọi Prisma P2002 thành generic 400; AuthService gộp mọi lỗi DTO thành một câu | Chưa có payload/log của lần đăng ký thực tế để biết xung đột email/phone hay thiếu field |
| QA-03 | register-customer dùng 6 input maxLength=1; handler Backspace chỉ chuyển focus, không xóa ô trước; shared OtpInput không phải component màn hình này đang dùng | Trải nghiệm bàn phím native và autofill cần thiết bị |
| QA-04 | useBooking gọi getAvailableServices không tham số; screen tạo object service từ route với giá mặc định 150000, unit lần; không có nút đổi khi có serviceId | Danh sách catalog thực tế thay đổi theo DB; 693 là quan sát môi trường trước đó |
| QA-05/06 | API GET services/:id có thật; Home chuyển ID sang booking, không có route chi tiết Customer riêng được xác minh. PriceEstimateScreen cũ dùng mock catalog; Home fallback mock và tự gán rating/review | Không đủ bước tái hiện để gán mọi lỗi chi tiết dịch vụ cho cùng nguyên nhân |

## Các thay đổi

**VERIFIED — QA-02:** Backend trả `REGISTRATION_VALIDATION_FAILED` kèm constraints/field, HTTP 400; xung đột email/phone trả HTTP 409 với `REGISTRATION_EMAIL_CONFLICT`/`REGISTRATION_PHONE_CONFLICT`; không trả tài khoản khác. Proof vẫn hash SHA-256, purpose, binding phone chuẩn hóa, TTL 300s, consumedAt conditional UPDATE cùng transaction tạo user. Unique failure rollback proof; không giảm an toàn OTP. Proof hết hạn/đã dùng/sai vẫn chung `REGISTRATION_PROOF_INVALID` vì Backend hiện không cung cấp mã tách riêng; không tự phân biệt bằng suy đoán frontend.

**VERIFIED — QA-03:** Cho dán mã sáu số từ mọi ô, lọc số và chia ô; nhập một số chuyển focus; Backspace ô rỗng xóa số ô trước và chuyển focus; selectTextOnFocus để thay số; disable khi loading và giữ khóa `flow.run` chống double-submit. Giữ resend/cooldown hiện có. Không viết lại cả màn hình. Backend OTP không có mã tách sai/hết hạn/đã dùng đáng tin để frontend suy ra; hiển thị message thực nhận.

**VERIFIED — QA-04:** Tải detail ID đã chọn từ Backend để giữ giá/unit/category/target thật, sau đó chỉ GET services theo categoryId/targetId. Không gọi global services trong booking khi thiếu context. Có đổi dịch vụ trong target và chọn category/target khác ngay trong form (đọc service-targets có category); không điều hướng bỏ form. Ghi chú, ảnh, địa chỉ, lịch hẹn giữ state. Home/AI truyền serviceId thì detail bổ sung target, không tin giá route. API tạo đơn và FSM không đổi.

**VERIFIED — QA-05/06:** Route price-list và price-estimate dùng chung màn hình catalog thật ba tầng thay vì đưa ID mock vào đặt lịch. Home không fallback danh mục/dịch vụ giả khi API rỗng/lỗi; carousel có empty state, không gán rating 4.9/review count giả và không hứa có mặt 15 phút. WorkerMapSection gọi API thợ gần đây thật; useHomeData.nearbyWorkers khởi tạo rỗng, chưa tích hợp API trong hook nên không coi là có thợ. Các component legacy `PriceEstimateModal`, `SubServiceListModal` còn mock nhưng chưa thấy Home hiện tại mount chúng; ghi nợ cần dọn trong task UI riêng, không khẳng định mọi mock repo đã xóa.

## Kiểm thử

Chi tiết kết quả cuối cùng ở [evidence/validation.md](evidence/validation.md). Tests mới: native multipart/URI/error propagation; đăng ký paste/Backspace; hook booking chỉ fetch target và giữ giá 0/unit; conflict/proof validation; empty catalog/không review giả/live price view.

Không chạy integration auth e2e dùng DB để tránh tạo tài khoản/OTP và tác động DB đang dùng. Unit tests proof/conflict không chứng minh transaction concurrency trên PostgreSQL; cơ chế transaction đã kiểm từ code, E2E còn pending. Không migration/db push/reset, không thay weights/train, không sửa Worker/FSM/payment/wallet, không push/merge/rebase.

## Manual retest trên Android — PENDING

- QA-01: theo [CUS-QA-01-report.md](CUS-QA-01-report.md), camera/library/content provider, logcat + request ID, mạng lỗi/AI unavailable.
- QA-02: OTP thật → hoàn thành trong 300s; email hợp lệ mới; dữ liệu thiếu; email xung đột; phone xung đột thuộc số đã xác thực; proof hết hạn/replay/phone khác; retry sau conflict không mất proof do rollback; không ghi credential vào log.
- QA-03: nhập/dán ở ô đầu/giữa/cuối, sửa số, giữ Backspace, mã không đủ, nhấn hai lần, resend cooldown và lỗi OTP. Bàn phím native có thể phát keyPress khác Jest nên cần kiểm trên máy.
- QA-04: vào từ Home, AI và wizard; đúng ID/giá/unit (cả giá 0), đúng target; đổi target/category giữ toàn bộ thông tin; API lỗi/ID stale không tự dựng dịch vụ; tạo đơn với service mới vẫn contract cũ.
- QA-05/06: bảng giá qua cả hai route dùng DB, empty khi không có dữ liệu; kiểm service ID không tồn tại và điều hướng quay lại; worker empty không hiển thị thợ giả; review thiếu không hiển thị điểm giả.

## Bảng kết thúc

| Task | Trạng thái | Bằng chứng | Tests | Blocker | Đề xuất tiếp theo |
|---|---|---|---|---|---|
| CUS-QA-01 | PARTIAL | Multipart live 201, URI validation | Multipart adapter + errors | Không thiết bị/logcat ca lỗi | Tái hiện và trace P0 trước đóng |
| CUS-QA-02 | Sửa error mapping, manual pending | DTO/P2002/proof code | Conflict/proof unit, registration regressions | Chưa payload ca lỗi/DB e2e | Retest OTP thật và lỗi field |
| CUS-QA-03 | Sửa code, manual pending | Handler/maxLength/loading | Paste/Backspace + double submit hiện có | Keyboard Android chưa thử | Retest giữ Backspace/autofill |
| CUS-QA-04 | Sửa code, manual pending | Scoped fetch/detail ID/chooser | Hook catalog và regression | Không Android E2E | Retest đổi target giữ form |
| CUS-QA-05/06 | Đã sửa các đường có bằng chứng; phần chi tiết chưa tái hiện | Catalog thật, worker empty, bỏ review giả | Presentation + catalog hook | Thiếu bước tái hiện detail cụ thể | Test navigation/service stale và dọn legacy mock |
| AI-AUDIT-01 | Tài liệu + evidence đã lập | 10 docs, hashes, leakage, 12 inference | 5 contract tests; leakage phát hiện lỗi | Thiếu test set thật độc lập | Phê duyệt taxonomy/benchmark/roadmap, chưa train |
