# Test plan và kết quả audit

## Đã chạy trong lần audit này

| Lệnh (tại package tương ứng) | Kết quả | Phạm vi chứng minh |
|---|---|---|
| server: `npm test -- --runInBand orders/validators/order-transition.validator.spec.js orders/diagnosis/diagnosis-resolver.spec.js orders/diagnosis/create-order-validation.spec.js` | 3 suites, 45 tests PASS, exit 0 | Unit/contract FSM, resolver, create validation theo test doubles hiện có |
| customer-app: `npm run test:ci -- --runTestsByPath __tests__/socketConnection.test.js __tests__/tokenRefresh.test.js` | 2 suites, 3 tests PASS, exit 0 | Socket client/token refresh với mocks, không có gateway/network thật |

Ngày chạy: 12/11/2026. Không thêm/sửa test hay application code. Các test pass ở trên **không chứng minh các lỗi tĩnh đã tìm thấy không tồn tại**; chúng không chạy hành trình UI/settlement thật. Không coi mock pass là E2E pass.

Bằng chứng test: [server/src/modules/orders/validators/order-transition.validator.spec.js:1](../../server/src/modules/orders/validators/order-transition.validator.spec.js#L1), [server/src/modules/orders/diagnosis/diagnosis-resolver.spec.js:1](../../server/src/modules/orders/diagnosis/diagnosis-resolver.spec.js#L1), [server/src/modules/orders/diagnosis/create-order-validation.spec.js:1](../../server/src/modules/orders/diagnosis/create-order-validation.spec.js#L1), [customer-app/__tests__/socketConnection.test.js:1](../../customer-app/__tests__/socketConnection.test.js#L1), [customer-app/__tests__/tokenRefresh.test.js:1](../../customer-app/__tests__/tokenRefresh.test.js#L1).

## Chưa chạy / NOT_VERIFIED

- Full journey Customer + Worker trên Android/iOS hoặc Expo web.
- API/Socket.IO với PostgreSQL thật, Redis/BullMQ thật, reconnect cross-process và rollout nhiều backend instance.
- OTP delivery eSMS/email, OAuth/Firebase thật, upload Cloudinary, AI models và ảnh thật.
- Provider sandbox VNPay/MoMo, tiền mặt đối soát, ledger thực và refund/dispute resolution.
- Accessibility, screenshot/visual, bàn phím, hiệu năng map/radar và background/kill app GPS.

Có `server/test/arc01.e2e-spec.js` sử dụng PostgreSQL + HTTP + Socket.IO và skip nếu không có `ARC01_TEST_DATABASE_URL`; không gọi là đã pass khi skip. Suite này còn ghi rõ Redis PubSub không được exercise. Script concurrency cũ tạo fixtures trực tiếp bằng Prisma và có giả định status ASSIGNED; cần chỉnh để khớp canonical/fixtures mới và chạy DB test riêng trước khi dùng làm release evidence. Không chạy các script có thể ghi DB dev chỉ để lấy nhãn E2E.

Bằng chứng: [server/test/arc01.e2e-spec.js:24](../../server/test/arc01.e2e-spec.js#L24), [server/test/jest-arc01.config.cjs:1](../../server/test/jest-arc01.config.cjs#L1), [server/test/concurrency-order-race.test.js:1](../../server/test/concurrency-order-race.test.js#L1).

## Các tầng kiểm thử đề xuất

| Tầng | Nội dung | Cần dữ liệu/hạ tầng | Bằng chứng đạt |
|---|---|---|---|
| Static/contract | Route reachability, actor matrix, payload/response/schema, enum aliases và callers | Working tree và schema cùng version | Bảng contract được đối chiếu, không lỗi tên trường/method |
| Unit | FSM mọi edge/alias/role, fee, quote parser/version, amount/commission, idempotency và stale reducer | Fake clock/test doubles thích hợp | Assert invariants và lỗi, không chỉ mock trả success |
| API + DB | Ownership, lock/race, quote, photos, dispute, settlement atomicity | PostgreSQL test riêng, Prisma generated cùng schema | Assert order/history/payment/ledger trước-sau transaction |
| Socket + Queue | JWT/expiry, room access, event sau commit, drop/reorder/reconnect, expansion + scheduled dispatch | Socket clients thật + backend + Redis/BullMQ | Event capture theo room và DB snapshot; job run đúng thời điểm |
| AI integration | Missing model, reference/selfie fail, image compare invalid/same/different | AI service thật với fixture versioned; tắt model được kiểm soát | Engine/provenance đúng, không success heuristic |
| Provider integration | Signed callbacks, delayed/duplicate/invalid callback, retry/cancel/pending | Sandbox provider và webhook endpoint test | TransactionId, payment, ledger, amount, commission khớp |
| Mobile E2E | Hành trình hai app với CTA thật và phục hồi | Hai thiết bị hoặc simulator độc lập + stack thật | Video/screenshot, requestId/event/DB và receipt truy vết |

## Bộ dữ liệu cần chuẩn bị

Customer A/B với User.id khác CustomerProfile.id; Worker W1/W2 hợp lệ cùng kỹ năng, W3 sai kỹ năng, W4 offline/approval pending/face hết hạn; ADMIN. Hai order cùng customer và hai order khác customer để thử event cross-talk. Catalog active/inactive, target nhiều dịch vụ/không dịch vụ; >25 orders gồm canonical và aliases cũ. Giá 0, có phần lẻ theo schema, giá lớn, nhiều lần điều chỉnh và quote legacy note hỏng. BEFORE/AFTER/ISSUE đúng/sai stage; ảnh thiếu/sai mime/local URI, URL không tải được, cùng ảnh/khác đối tượng. Payment pending/paid thiếu ledger, ledger sai worker/sai amount, callback trùng/provider id reuse.

Chỉ tạo fixture trên môi trường kiểm thử riêng; tiền và danh tính dùng sandbox/fixture có kiểm soát. Không tự tạo PAID/verified giả trong hành trình được tuyên bố E2E thành công. Fixtures trạng thái riêng phục vụ kiểm gate phải được ghi rõ là fixtures, không dùng chúng thay bước người dùng.

## Ma trận kịch bản truy vết

Mỗi test dưới đây **PLANNED / NOT_RUN** trong audit. Mã T01…T46 được dùng trong [06](06-gap-analysis.md) và [08](08-acceptance-criteria.md). Test có nhiều biến thể cần chạy từng biến thể, không tính một pass chung.

| Test | Issue | Thao tác / dữ liệu | Kỳ vọng cần quan sát |
|---|---|---|---|
| T01 | [CUS-01](06-gap-analysis.md#cus-01) | hai thiết bị đi toàn hành trình, quay lại History ở từng bước. | AC của CUS-01; assert UI + API/DB/event theo tầng, không success local |
| T02 | [CUS-01](06-gap-analysis.md#cus-01) | cold start/deep link ở AWAITING_ACCEPTANCE, AWAITING_PAYMENT, COMPLETED. | AC của CUS-01; assert UI + API/DB/event theo tầng, không success local |
| T03 | [CUS-02](06-gap-analysis.md#cus-02) | Dịch vụ khác online/offline, đổi máy, qua 20 phút. | AC của CUS-02; assert UI + API/DB/event theo tầng, không success local |
| T04 | [CUS-02](06-gap-analysis.md#cus-02) | xác nhận không còn nút Demo ở app thật. | AC của CUS-02; assert UI + API/DB/event theo tầng, không success local |
| T05 | [CUS-03](06-gap-analysis.md#cus-03) | offline hủy rồi reconnect. | AC của CUS-03; assert UI + API/DB/event theo tầng, không success local |
| T06 | [CUS-03](06-gap-analysis.md#cus-03) | race accept/cancel; retry hủy không tăng phí/lịch sử. | AC của CUS-03; assert UI + API/DB/event theo tầng, không success local |
| T07 | [CUS-04](06-gap-analysis.md#cus-04) | A đặt đơn → logout → B login offline/online. | AC của CUS-04; assert UI + API/DB/event theo tầng, không success local |
| T08 | [CUS-04](06-gap-analysis.md#cus-04) | detail có cache stale, API 403/404/500. | AC của CUS-04; assert UI + API/DB/event theo tầng, không success local |
| T09 | [CUS-05](06-gap-analysis.md#cus-05) | từng gate thiếu ảnh/sai actor/sai stage/local URI. | AC của CUS-05; assert UI + API/DB/event theo tầng, không success local |
| T10 | [CUS-05](06-gap-analysis.md#cus-05) | upload gián đoạn, retry cùng ảnh không tạo bản sao. | AC của CUS-05; assert UI + API/DB/event theo tầng, không success local |
| T11 | [CUS-06](06-gap-analysis.md#cus-06) | không quote, pending, accept, reject, hai proposal, hai thiết bị accept. | AC của CUS-06; assert UI + API/DB/event theo tầng, không success local |
| T12 | [CUS-06](06-gap-analysis.md#cus-06) | mất event giá rồi restart; giá sau duyệt không cộng hai lần. | AC của CUS-06; assert UI + API/DB/event theo tầng, không success local |
| T13 | [CUS-07](06-gap-analysis.md#cus-07) | provider sandbox thật success/fail/cancel/pending/return trước webhook. | AC của CUS-07; assert UI + API/DB/event theo tầng, không success local |
| T14 | [CUS-07](06-gap-analysis.md#cus-07) | callback 10 lần, hai callback đồng thời, sai amount, rollback từng điểm, tiền mặt theo chính sách đã duyệt. | AC của CUS-07; assert UI + API/DB/event theo tầng, không success local |
| T15 | [CUS-08](06-gap-analysis.md#cus-08) | model absent, timeout, reference tải lỗi, selfie người khác/ảnh in. | AC của CUS-08; assert UI + API/DB/event theo tầng, không success local |
| T16 | [CUS-08](06-gap-analysis.md#cus-08) | ảnh BEFORE/AFTER thiếu/giống nhau/khác đối tượng; không phát sinh điểm mặc định. | AC của CUS-08; assert UI + API/DB/event theo tầng, không success local |
| T17 | [CUS-09](06-gap-analysis.md#cus-09) | drop/duplicate/reorder event, hai order rooms. | AC của CUS-09; assert UI + API/DB/event theo tầng, không success local |
| T18 | [CUS-09](06-gap-analysis.md#cus-09) | ngắt mạng > token TTL, foreground lại, force server disconnect. | AC của CUS-09; assert UI + API/DB/event theo tầng, không success local |
| T19 | [CUS-10](06-gap-analysis.md#cus-10) | B đọc/trả tiền đơn A, worker lạ, anonymous mock callback. | AC của CUS-10; assert UI + API/DB/event theo tầng, không success local |
| T20 | [CUS-10](06-gap-analysis.md#cus-10) | signature sai, duplicate transactionId, amount âm/lệch, terminal order. | AC của CUS-10; assert UI + API/DB/event theo tầng, không success local |
| T21 | [CUS-11](06-gap-analysis.md#cus-11) | fake clock client + Redis/BullMQ thật 3 lần mở rộng. | AC của CUS-11; assert UI + API/DB/event theo tầng, không success local |
| T22 | [CUS-11](06-gap-analysis.md#cus-11) | Redis down/restart, hẹn tương lai, đổi lịch, accept đúng lúc timeout. | AC của CUS-11; assert UI + API/DB/event theo tầng, không success local |
| T23 | [CUS-12](06-gap-analysis.md#cus-12) | timeout sau commit rồi retry/double tap. | AC của CUS-12; assert UI + API/DB/event theo tầng, không success local |
| T24 | [CUS-12](06-gap-analysis.md#cus-12) | accept bằng id đoán được, sai chuyên môn, hai order một worker. | AC của CUS-12; assert UI + API/DB/event theo tầng, không success local |
| T25 | [CUS-13](06-gap-analysis.md#cus-13) | đặt giúp người khác, GPS denied, geocode fail, lat=0, out-of-range. | AC của CUS-13; assert UI + API/DB/event theo tầng, không success local |
| T26 | [CUS-13](06-gap-analysis.md#cus-13) | đổi địa chỉ rồi back/restart, sổ địa chỉ account khác. | AC của CUS-13; assert UI + API/DB/event theo tầng, không success local |
| T27 | [CUS-14](06-gap-analysis.md#cus-14) | nhiều ảnh, permission denied, ảnh lớn/HEIC, mất mạng giữa upload và attach. | AC của CUS-14; assert UI + API/DB/event theo tầng, không success local |
| T28 | [CUS-15](06-gap-analysis.md#cus-15) | catalog empty/500, backend partial, refetch không nhảy sang mock. | AC của CUS-15; assert UI + API/DB/event theo tầng, không success local |
| T29 | [CUS-15](06-gap-analysis.md#cus-15) | voucher hết hạn/không đúng điều kiện/retry. | AC của CUS-15; assert UI + API/DB/event theo tầng, không success local |
| T30 | [CUS-16](06-gap-analysis.md#cus-16) | rút/nạp/reload/offline không làm biến động tiền giả. | AC của CUS-16; assert UI + API/DB/event theo tầng, không success local |
| T31 | [CUS-16](06-gap-analysis.md#cus-16) | voucher fixed/percent/cap/zero finalPrice và stale price. | AC của CUS-16; assert UI + API/DB/event theo tầng, không success local |
| T32 | [CUS-17](06-gap-analysis.md#cus-17) | bất kỳ mật khẩu khác rỗng, OTP sai/hết hạn, đổi phone/email trùng. | AC của CUS-17; assert UI + API/DB/event theo tầng, không success local |
| T33 | [CUS-17](06-gap-analysis.md#cus-17) | lưu offline/timeout rồi refresh profile. | AC của CUS-17; assert UI + API/DB/event theo tầng, không success local |
| T34 | [CUS-18](06-gap-analysis.md#cus-18) | deep link trước/giữa restore, expired token, blocked user, refresh đồng thời. | AC của CUS-18; assert UI + API/DB/event theo tầng, không success local |
| T35 | [CUS-18](06-gap-analysis.md#cus-18) | OTP replay/expired/max attempts, +84/0, đăng ký gọi trực tiếp API. | AC của CUS-18; assert UI + API/DB/event theo tầng, không success local |
| T36 | [CUS-19](06-gap-analysis.md#cus-19) | seed >25 đơn đủ trạng thái, profile.id khác user.id. | AC của CUS-19; assert UI + API/DB/event theo tầng, không success local |
| T37 | [CUS-19](06-gap-analysis.md#cus-19) | cập nhật finalPrice và mở History offline/online. | AC của CUS-19; assert UI + API/DB/event theo tầng, không success local |
| T38 | [CUS-20](06-gap-analysis.md#cus-20) | lock screen/background/kill app Android+iOS, permission revoke, GPS jump. | AC của CUS-20; assert UI + API/DB/event theo tầng, không success local |
| T39 | [CUS-21](06-gap-analysis.md#cus-21) | reject acceptance có evidence, offline submit/retry. | AC của CUS-21; assert UI + API/DB/event theo tầng, không success local |
| T40 | [CUS-21](06-gap-analysis.md#cus-21) | admin resolve/hoàn tiền/sửa lại theo policy đã chốt, reopen và tra lịch sử. | AC của CUS-21; assert UI + API/DB/event theo tầng, không success local |
| T41 | [CUS-22](06-gap-analysis.md#cus-22) | workerId truyền từ Home được xử lý đúng kỳ vọng. | AC của CUS-22; assert UI + API/DB/event theo tầng, không success local |
| T42 | [CUS-22](06-gap-analysis.md#cus-22) | thợ mất kết nối/bỏ việc, hai thợ race thay thế, kiểm tra room/access cũ. | AC của CUS-22; assert UI + API/DB/event theo tầng, không success local |
| T43 | [CUS-23](06-gap-analysis.md#cus-23) | force delete category có completed/disputed/paid orders trong DB test riêng. | AC của CUS-23; assert UI + API/DB/event theo tầng, không success local |
| T44 | [CUS-23](06-gap-analysis.md#cus-23) | delete worker đang di chuyển/đang chờ thanh toán; assert giữ chứng từ. | AC của CUS-23; assert UI + API/DB/event theo tầng, không success local |
| T45 | [CUS-24](06-gap-analysis.md#cus-24) | Android/iOS nhỏ, TalkBack/VoiceOver, font lớn, bàn phím. | AC của CUS-24; assert UI + API/DB/event theo tầng, không success local |
| T46 | [CUS-24](06-gap-analysis.md#cus-24) | error/loading/empty/success cho mọi panel và sao chưa chọn. | AC của CUS-24; assert UI + API/DB/event theo tầng, không success local |

## Một kịch bản E2E bắt buộc trước phát hành

1. Customer A đăng nhập, chọn Category → Thiết bị → Service active từ Home. Đặt địa chỉ khác GPS hiện tại và ghim đúng nơi phục vụ, giờ hẹn hợp lệ, thêm ảnh ISSUE thật. Bấm xác nhận một lần. Ghi server orderId, amount và snapshot; thử mất response sau commit rồi mở lại để xác nhận không có đơn thứ hai.
2. Worker W1 check-in identity match thật, online với kỹ năng phù hợp; W2 cũng nhận cùng offer và bấm accept đồng thời. Chỉ một thợ thắng, một nhận 409, Customer thấy đúng một worker; thợ sai kỹ năng không thể lách bằng orderId.
3. W1 di chuyển. Customer nhận GPS đúng order; tắt mạng rồi bật lại thấy snapshot mới. Kill/reopen Worker trong en-route để kiểm phục hồi watcher. ETA có nhãn cũ khi không có tọa độ mới.
4. W1 báo đã tới, chụp/upload BEFORE, gửi báo giá/phạm vi. Thử start trước customer approval phải bị chặn. Customer đóng app khi quote pending, mở lại vẫn thấy và đồng ý đúng version. Thử duyệt lại không cộng giá hai lần. Chạy riêng biến thể reject rồi thỏa thuận/hủy đúng policy.
5. W1 start, thực hiện công việc, chụp/upload AFTER và finish. Customer xem ảnh thực của order, AI unavailable hiển thị đúng; tự kiểm tra và accept. Chạy riêng biến thể dispute có lý do/ảnh, admin giải quyết được, không ép thanh toán khi chưa có quyết định hợp lệ.
6. Customer chọn phương thức đã tích hợp. Tạo checkout bằng amount server; return trước callback vẫn pending. Provider callback signed tới, replay nhiều lần, chỉ một payment và payout; đối soát commission + worker payout = gross theo quy tắc rounding đã chốt. COMPLETED chỉ sau settlement hợp lệ. Chạy riêng cash theo accounting policy đã phê duyệt, không dùng webhook mock.
7. Khách nhận biên nhận, có thể bỏ qua review hoặc tự chọn sao/tag rồi gửi. History trên máy khác thấy đúng giá cuối, thời gian và trạng thái; logout A/login B không thấy cache A. Admin ngừng dịch vụ không mất chứng từ.

## Kiểm thử lỗi và thiết bị

Android/iOS (nếu là nền tảng phát hành), Expo web nếu hỗ trợ; màn 360dp, notch, font scale 1.0/1.3/2.0; TalkBack/VoiceOver; bàn phím che CTA, double tap; quyền camera/album/GPS từ chối hoặc thu hồi; mạng chậm/offline/flapping; API 401/403/404/409/422/500/timeout; refresh đồng thời, token hết hạn khi đang ở room, server disconnect; OS background/kill, redirect provider quay app đúng route. Các SLA timeout/stale vị trí phải chốt thành giá trị cấu hình trước assert, không lấy timer giả UI làm policy server.

## Release gate và báo cáo kết quả

- Tất cả P0 đã đạt AC và có bằng chứng đúng tầng; các P1 có thể chặn hành trình/tiền/ownership không được miễn bằng lời hứa sẽ sửa.
- Journey chuẩn trên hai app + backend thật đạt; các biến thể từ chối giá, hủy lúc race, dispute, mất mạng/reopen và payment duplicate đều có kết quả xác định.
- Đối soát DB/order/payment/ledger/commission, không tăng ví kép, không có verified/AI score/success tài chính từ heuristic/local.
- Không xóa route/alias trước khi kiểm deep link `fixgocustomer`, notification và version cũ; rollback đọc được dữ liệu mới.
- Mẫu ghi kết quả: `Test ID | AC | commit/build Customer/Worker/Server/AI | môi trường | fixture/orderId | bước | actual | expected | pass/fail/blocked/skipped | artifact/requestId/providerTxnId | người chạy`. Mask dữ liệu cá nhân trong artifacts.

Một suite pass với provider/DB/AI mock được báo là pass ở tầng đó. Test skipped/không có môi trường giữ NOT_VERIFIED; không đổi thành E2E PASS.
