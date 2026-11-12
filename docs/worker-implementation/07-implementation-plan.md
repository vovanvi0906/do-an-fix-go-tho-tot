# Kế hoạch triển khai theo phụ thuộc — chờ giao task

> Cập nhật 12/11/2026: ARC-01 đã triển khai policy/guards/transaction và contract mới; xem [báo cáo ARC-01](10-arc01-report.md). Phần audit/kế hoạch dưới đây được giữ làm baseline lịch sử, không phải tất cả đều là contract hiện hành.


Chưa task code nào được phê duyệt/thực hiện. AUD-01 là audit và bộ tài liệu này; runtime verification vẫn mở. Mỗi đường dẫn viết tắt `orders.*`, `workers.*`, `admin.*` bên dưới thuộc `server/src/modules/<module>/`; worker/customer/client và Prisma dùng các đường dẫn trong evidence index 01. Không cần rewrite kiến trúc.

## Thứ tự P0 đề xuất

1. **ARC-01 trước tiên:** policy/FSM/actor/mapping và contract tests; bao gồm quyết định lỗi ownership/room/tiền, không chỉ sơ đồ.
2. **ARC-02 → FACE-01 → ORD-02:** baseline schema/CAS, identity đáng tin và read/restore đúng; FACE/ORD-02 không cần đợi toàn UI.
3. **ORD-01 → ORD-03 → SYNC-01:** recipient/expiry và single-active, lifecycle, realtime có quyền/refetch.
4. **UX-01 → UX-02 → UX-03 → GPS-01 → IMG-01 → QUO-01 → TIMER-01 → IMG-02:** lát cắt công việc hiện trường.
5. **AI-01 → ACC-01 → PAY-01 → WAL-01 → E2E-01:** bằng chứng nghiệm thu, thanh toán rõ ràng, ledger và kiểm thử xuyên suốt.

Đây là thứ tự hợp lệ của phụ thuộc, không yêu cầu làm nhiều task cùng lúc. Điều chỉnh so với §11 tài liệu mục tiêu: FACE-01 đưa trước accept vì heuristic có thể cấp phiên giả; ownership/realtime core của HARD-01 đưa vào P0; sửa ORD-02 thay tạo endpoint active mới; kiểm tra schema/migrations sớm vì include/fields sai có thể làm API hỏng ngay. PAY-01/WAL-01 phải được phát hành cùng lát cắt settlement an toàn, không release tăng ví trước unique ledger. Timeline trên không đồng nghĩa các task UI độc lập đã được phép bắt đầu.

Tác động chung: mọi thay state/quote/payment phải test Customer Tracking/Acceptance/PaymentReview và Admin status/detail/revenue; không tự đổi business logic của các client. Mọi schema task cần dry-run trên DB test, backup/data inventory, expand–migrate–contract; không drop/rename enum/table/column. Mỗi task hoàn tất phải có report TASK/CURRENT STATUS/IMPLEMENTED/FILES CHANGED/API-DATABASE/TEST RESULTS/RISKS/NEXT TASK.

## ARC-01 — P0 — Một policy FSM/ownership và mapping tương thích

- **Hiện trạng/vấn đề:** CONFLICT; gap G01/G02/G04/G05/G18 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** AUD-01.
- **File/module dự kiến:** orders/constants, validators, orders.service, order-workflow.service, orders.gateway, admin.service; customer Tracking/Acceptance và admin status UI.
- **Yêu cầu và giải pháp:** Giữ enums/routes, chốt actor/active/terminal; adapter legacy; chặn ownership và state bypass ở tất cả entry points.
- **API/database:** REST orders/status/acceptance/admin; WS rooms/GPS; không cần migration enum ngay.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Khách chưa trả tiền không completed; user ngoài đơn không thao tác; admin không bypass tài chính.
- **Test cases:** AC-07/08/18/21; table-driven transition/actor tests và contract clients; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Giữ adapter cũ khi rollback ứng dụng; không khôi phục bypass bằng tắt auth.

## ARC-02 — P0 — History/version/CAS và schema baseline

- **Hiện trạng/vấn đề:** PARTIAL; gap G14/G16 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ARC-01.
- **File/module dự kiến:** prisma/schema+migrations; orders repository/service; gateway; mobile snapshot types/cache.
- **Yêu cầu và giải pháp:** Diff migrations/schema trên DB test; thêm version và operation dedupe additive; transaction history + CAS.
- **API/database:** Order.version/history/op keys mới cần migration review; CORS nếu header mới.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** 2 requests cùng version chỉ 1 commit; không mất history; clean DB migrate ra schema tương thích.
- **Test cases:** AC-22/24; schema validation, migration test DB tách biệt, parallel CAS; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Không reset; backup và kiểm kê trước rollout; rollback app giữ columns/keys, không drop dữ liệu.

## FACE-01 — P0 — Xác thực thật và policy check-in thống nhất

- **Hiện trạng/vấn đề:** BUG; gap G06/G07 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ARC-01.
- **File/module dự kiến:** workers.service, orders.service.verifyFace, fastapi-ai.client, aiFallbackHelper, ai-service/main.py, worker daily+face hook.
- **Yêu cầu và giải pháp:** Chỉ identity match model hợp lệ/manual approved mới cấp verifiedAt; expiresAt từ server; không heuristic pass/detection-only; reuse phiên còn hạn.
- **API/database:** workers/profile/daily/order face giữ aliases, bổ sung engine/status/expiry; audit verification additive nếu cần.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** AI down/khác mặt/reference hỏng không cấp phiên; đúng 24h hết hạn; quay lại job không selfie lặp.
- **Test cases:** AC-01/02/06; thật/khác mặt/no face/reference unreadable/heuristic/provider timeout, mobile return; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Chặn bypass cả hai endpoints; rollback UI không làm hợp thức hóa phiên failed; thu hồi phiên giả theo policy được duyệt.

## ORD-02 — P0 — Sửa current order và detail + restore thực

- **Hiện trạng/vấn đề:** BUG; gap G09/G10 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ARC-01.
- **File/module dự kiến:** orders.repository.findCurrentOrderForWorker/findById, orders.service.getCurrentWorkerOrder; worker orderService, home, job route.
- **Yêu cầu và giải pháp:** Sửa customer relation theo User, active filter cả enum; startup/focus/foreground/reconnect load; job theo id, không PII fallback.
- **API/database:** Reuse GET orders/worker/current và GET orders/:id; raw order/null; không tạo API current trùng.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** MATCHED/EN_ROUTE/acceptance/payment restore đúng; null xóa cache; trái quyền không rò PII.
- **Test cases:** AC-05/21/22; Prisma integration mọi active state, kill/relaunch manual, API schema tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Additive read fix; giữ method/path cũ, không persist local state thành authoritative.

## ORD-01 — P0 — Offer đúng recipient, expiry và accept theo worker+order

- **Hiện trạng/vấn đề:** PARTIAL; gap G04/G11/G17 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ARC-02, FACE-01.
- **File/module dự kiến:** orders.service.acceptOrder/matchNearbyWorkers, orders.gateway.broadcastNewOrderToWorkers, order-queue.service, Prisma offer/lock, worker modal.
- **Yêu cầu và giải pháp:** Auth room server; eligible offer snapshot + expiresAt; khóa worker/order thứ tự cố định; busy check atomic; queue expansion gọi hàm thật.
- **API/database:** Offer persisted/additive migration hoặc khóa nghiệp vụ tương đương được chứng minh; giữ accept route.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Chỉ một thợ/đơn và một active/thợ; offer hết hạn/outside recipients reject; expansion chọn lại đúng thợ.
- **Test cases:** AC-03/04/23/24; HTTP concurrent requests trên DB test, Redis expansion tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Deadlock/DB lock timeout: retry có kiểm soát; rollback giữ dữ liệu offer, không bỏ expiry/busy guards.

## ORD-03 — P0 — Lifecycle API có preconditions

- **Hiện trạng/vấn đề:** BUG; gap G01/G10 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ARC-02, FACE-01, ORD-02.
- **File/module dự kiến:** orders.service.updateStatus+aliases, workflow/validator, DTO, admin status mutation.
- **Yêu cầu và giải pháp:** Một mutation policy: travel→ARRIVED→start→finish; timestamps server; trả snapshot; guards ảnh/quote hoàn thiện cùng IMG/QUO.
- **API/database:** Reuse PATCH status/arriving/arrived/start/finish; update response thêm fields; chưa đổi enum hàng loạt.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Arrive không start; wrong stage reject; retry không lặp history/timestamp; ownership ở server.
- **Test cases:** AC-07/08/09/10/24; transition table, concurrency cancel/start, aliases tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Backward compatibility adapter cần test Customer/Admin; rollback không xóa lịch sử/timestamps.

## SYNC-01 — P0 — Realtime auth/refetch và bỏ event status vô hiệu

- **Hiện trạng/vấn đề:** BUG; gap G04/G14 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ORD-01, ORD-02, ORD-03.
- **File/module dự kiến:** orders.gateway, worker socketService, active/order hooks, customer socket consumers, admin OrdersManagementPage.
- **Yêu cầu và giải pháp:** JWT handshake/room scope, events sau commit có version; refetch reconnect/foreground; stale guard; bỏ worker:status_update làm mutation.
- **API/database:** Giữ event aliases cho clients; thêm version/updatedAt, không tin client workerId.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Event lặp/trễ không rollback snapshot; reconnect về đúng đơn; unauthed admin room reject.
- **Test cases:** AC-21/22/24; gateway auth integration + replay/out-of-order tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Rollout server+clients tương thích; fallback refetch khi packet legacy, không fallback global broadcast.

## UX-01 — P0 — Home dữ liệu server và banner active

- **Hiện trạng/vấn đề:** PARTIAL; gap G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ORD-02, SYNC-01.
- **File/module dự kiến:** worker tabs/index + active/profile hooks; workers read summary nếu chưa thể reuse.
- **Yêu cầu và giải pháp:** Hydrate online/check-in/active; bỏ stats/giá/address giả; summary thật hoặc unavailable rõ.
- **API/database:** GET workers/me/current; summary mới chỉ khi không có API reuse.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Không nhấp nháy online sai; active chặn offer; loading/empty/error/retry rõ.
- **Test cases:** AC-01/02/05/23; component states, offline/foreground manual; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Giữ Expo tabs; rollback không đưa số giả lại.

## UX-02 — P0 — Popup offer theo deadline và snapshot

- **Hiện trạng/vấn đề:** PARTIAL; gap G11 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ORD-01, SYNC-01.
- **File/module dự kiến:** worker tabs/index incoming modal + offer adapter.
- **Yêu cầu và giải pháp:** Render đủ service/target/note/ISSUE/schedule/distance/gross-net; countdown expiresAt, accepting lock.
- **API/database:** Offer snapshot thêm fields nhưng giữ orderId; không tự suy 30s là expiry.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Background quá hạn không nhận; mất response refetch; conflict code rõ.
- **Test cases:** AC-03/04; fake-clock/foreground/component tests và 2 devices; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Giữ modal hiện tại, không đổi matching policy bằng UI.

## UX-03 — P0 — Job detail theo snapshot/allowedActions

- **Hiện trạng/vấn đề:** BUG; gap G10 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ORD-02, ORD-03, SYNC-01.
- **File/module dự kiến:** worker job/[id], reusable job hooks/components, orderService.
- **Yêu cầu và giải pháp:** Bỏ state ASSIGNED mặc định/PII route params; timeline + một CTA; refetch focus sau Face.
- **API/database:** Reuse order detail/status, computed allowedActions additive.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Mở bằng id đúng dữ liệu; không CTA vượt state; không success trước API.
- **Test cases:** AC-05/06/07/08/21; component every-state + device back/reload; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Tách UI vừa đủ, không rewrite routing; rollback giữ read API.

## GPS-01 — P0 — GPS theo identity/stage và quyền thiết bị

- **Hiện trạng/vấn đề:** BUG; gap G20 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** UX-03, SYNC-01.
- **File/module dự kiến:** worker useWorkerLocationTracker + job/app lifecycle; gateway GPS handler.
- **Yêu cầu và giải pháp:** Server derive profile/assignment; stage/coords validation; start-stop idempotent; consent foreground/background policy.
- **API/database:** Reuse worker:update_location, bỏ tin workerId; lưu accuracy/time khi schema được duyệt.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Không update profile người khác; denied/reconnect/unmount không sai online/travel; terminal stop.
- **Test cases:** AC-07/08/21/22; fake GPS + device background/denied checks; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Background mode chỉ khi policy được duyệt; rollback giữ server auth, không tracking ngoài stage.

## IMG-01 — P0 — Ảnh BEFORE của thợ và upload an toàn

- **Hiện trạng/vấn đề:** PARTIAL; gap G05/G12 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** UX-03, ORD-03.
- **File/module dự kiến:** worker photo camera hook/screen theo routing cũ, orderService; orders.controller/service image; storage config/schema.
- **Yêu cầu và giải pháp:** Reuse images route metadata; binary upload tái sử dụng storage nếu có; ISSUE riêng; quyền trước upload; checksum/status metadata.
- **API/database:** OrderImage additive uploader/source/meta; ISSUE enum sẵn có; không reclassify ảnh cũ không rõ nguồn.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** ISSUE không đủ start; BEFORE persisted sau reload; failed upload giữ retry; owner enforced.
- **Test cases:** AC-09/13/21/24; media type/size/duplicate/auth tests + camera denied; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Orphan cleanup policy, không xóa ảnh cũ/audit; additive metadata rollback.

## QUO-01 — P0 — Báo giá có version và customer approval thật

- **Hiện trạng/vấn đề:** PARTIAL; gap G13 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** IMG-01, ARC-02.
- **File/module dự kiến:** orders adjustPrice/DTO, Prisma quote/items, worker assessment UI, customer TrackingScreen.
- **Yêu cầu và giải pháp:** Persist proposal/items/version,total server; accept theo quote version, không additionalPrice client; start guard pending.
- **API/database:** Giữ adjust-price adapter, thêm quote read state/detail; additive Quote nếu cần.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Reload vẫn pending; repeat accept không cộng lại; reject không start khi scope chưa chốt.
- **Test cases:** AC-10/11/24; client tampering/concurrent approve-reject/start tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Legacy pending notes không backfill thành approved; rollout customer trước enforced contract bắt buộc.

## TIMER-01 — P0 — Session thời gian server/pause/resume

- **Hiện trạng/vấn đề:** PARTIAL; gap G15 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ORD-03, UX-03.
- **File/module dự kiến:** orders/workflow session logic, Prisma timestamps/intervals, worker job timer.
- **Yêu cầu và giải pháp:** Server timestamps/intervals; UI chỉ tick render; fixed price độc lập duration; hourly chỉ khi policy đã chốt.
- **API/database:** Additive session/finish/pause fields, reuse startedAt tương thích.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Kill app không về 0; pause không overlap; retry không reset start; chưa policy hourly không tính tiền.
- **Test cases:** AC-12/24; deterministic clock, intervals/cancel/rework tests + relaunch; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Giữ timestamps gốc; rollback giữ session records không recompute giá quá khứ.

## IMG-02 — P0 — AFTER camera và report gửi nghiệm thu

- **Hiện trạng/vấn đề:** BUG; gap G10/G12 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** IMG-01, TIMER-01.
- **File/module dự kiến:** worker job AFTER CTA/photo UI, order upload/report/finish guards.
- **Yêu cầu và giải pháp:** Route camera AFTER, preview/retry, report persisted; chỉ submit khi AFTER hợp lệ.
- **API/database:** Reuse images+finish, report additive khi thiếu.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Không Face route; ảnh thật owner+type đúng, report không mất khi retry.
- **Test cases:** AC-13/14/16/21; route assertion + upload/status integration/device; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Giữ BEFORE/AFTER riêng; không xóa media khi rollback.

## AI-01 — P0 — AI compare trung thực và manual fallback

- **Hiện trạng/vấn đề:** BUG; gap G08 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** IMG-02.
- **File/module dự kiến:** ai-service/main.py compare, fastapi-ai.client/aiFallbackHelper, orders.verifyCompletion, customer AcceptanceScreen.
- **Yêu cầu và giải pháp:** Không URL-based/default success; status engine evidence/limitations/human review; bỏ ảnh demo và 94%; không AI tự quyết chất lượng.
- **API/database:** Giữ fields tương thích, thêm unavailable/uncertain/manual metadata; timeout rõ.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** AI down/ảnh giống/góc khác/lỗi vô hình không sinh đạt; khách có đường xem bằng chứng thủ công.
- **Test cases:** AC-15; controlled AI fixtures + thực ảnh có ground truth, API timeout + manual path; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Không rollback sang điểm giả; lưu raw result đã redacted khi policy duyệt.

## ACC-01 — P0 — Acceptance/rework và phân biệt chờ tiền

- **Hiện trạng/vấn đề:** BUG; gap G02/G18 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** AI-01, QUO-01.
- **File/module dự kiến:** orders acceptCompletion/dispute + acceptance storage; customer Acceptance/Tracking; worker job; admin resolution reader.
- **Yêu cầu và giải pháp:** Guard submitted state, customer decision persisted; accept→awaiting payment, rework reason/version; timeout policy chưa có không auto accept.
- **API/database:** Reuse accept-completion/dispute aliases; additive acceptance/resolution, update all state consumers.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Chưa trả tiền không completed/available wallet; reject hiện lý do ở worker; admin thấy evidence.
- **Test cases:** AC-16/17/18/21; accept retry/concurrent reject, rework→resubmit and client contract tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Bản ghi COMPLETED cũ phân loại từ payment/audit, không backfill thanh toán từ state đơn thuần.

## PAY-01 — P0 — Thanh toán đúng owner/settlement, sandbox rõ

- **Hiện trạng/vấn đề:** BUG; gap G03/G16 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ACC-01, ARC-02.
- **File/module dự kiến:** orders.processPayment/controller, payment adapter/service nếu reuse; customer PaymentReviewScreen, admin payment/status UI.
- **Yêu cầu và giải pháp:** Một entry service settlement; xác thực owner/source/amount, provider signature hoặc sandbox công khai; không mount legacy chưa sửa.
- **API/database:** Giữ pay aliases tương thích; provider event/ref unique, payment pending/failed/settled semantics.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Bấm pay chưa được xem thu tiền thật; foreign customer reject; pending/fail không complete.
- **Test cases:** AC-18/19/20/21; signature/amount/role/retry/provider failure tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Không rollback mất settlement; sandbox guard môi trường; đối soát tiền trước release.

## WAL-01 — P0 — Ledger/commission một lần và một nguồn số dư

- **Hiện trạng/vấn đề:** BUG; gap G03/G16 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** PAY-01.
- **File/module dự kiến:** orders/payment settlement service, Prisma Payment/CommissionRecord/WorkerWallet/WalletTransaction, workers.getProfile/read APIs, admin reconciliation.
- **Yêu cầu và giải pháp:** Unique business keys và transaction payment+commission+ledger+terminal; chọn WorkerWallet/read adapter, tiền mặt debt policy riêng.
- **API/database:** Additive dedupe/commission snapshot, không drop Wallet cũ; earnings read model.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Parallel webhook+pay chỉ 1 credit/commission; balance=ledger; không double available.
- **Test cases:** AC-19/20/24; DB concurrency/injected rollback/reconciliation tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Không sửa/xóa ledger settled; sai lệch dùng adjustment có audit, rollback app giữ keys.

## E2E-01 — P0 — Chứng minh luồng thật và race/restart

- **Hiện trạng/vấn đề:** NOT_VERIFIED; gap G01–G20 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** Tất cả P0 core trước đó.
- **File/module dự kiến:** server/test isolated fixtures, worker/customer/admin test harness; docs evidence.
- **Yêu cầu và giải pháp:** HTTP thật + DB/Redis test + 2 worker/1 customer, AI fixtures tách test vs runtime; mobile camera/location.
- **API/database:** Không dùng seed vào DB live; cập nhật race script setup đúng schema, test route thực.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** AC-01…25 pass hoặc blocker minh bạch; không gọi E2E done nếu core chưa pass.
- **Test cases:** 25 AC ở 08; artifact logs/redacted/screenshots/reconciliation; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Fixture namespace và cleanup DB test riêng, không reset shared DB.

## EXC-01 — P1 — Hủy/sự cố/khách vắng có policy

- **Hiện trạng/vấn đề:** PARTIAL; gap G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ARC-01, SYNC-01.
- **File/module dự kiến:** orders.cancelOrder, worker issue/cancel UI, customer/admin views.
- **Yêu cầu và giải pháp:** Reason/fee công khai, ownership/state CAS, cả hai app cập nhật.
- **API/database:** Reuse cancel + incident persisted nếu thiếu.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Không hủy terminal, race pay/cancel nhất quán, giữ reason.
- **Test cases:** AC-25; cancel by actor/stage và payment race; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Rollback giữ history/fee snapshot, không tính lại quá khứ.

## EXC-02 — P1 — Rework/dispute resolution Admin

- **Hiện trạng/vấn đề:** PARTIAL; gap G18/G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ACC-01.
- **File/module dự kiến:** orders dispute/acceptance; admin service/UI; Prisma resolution.
- **Yêu cầu và giải pháp:** Persist ticket/resolution và evidence, policy rework/refund, không xóa history.
- **API/database:** Reuse DISPUTED, additive resolution.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Worker/khách thấy kết quả và reason; chỉ admin đúng quyền resolve.
- **Test cases:** AC-17/25; resolution auth/version/rework tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Không delete dispute/evidence, adjustment cho tài chính.

## OFF-01 — P1 — Media queue bền vững và retry

- **Hiện trạng/vấn đề:** MISSING; gap G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** IMG-01, IMG-02.
- **File/module dự kiến:** worker photo storage/hooks/app lifecycle.
- **Yêu cầu và giải pháp:** Queue ảnh/notes có trạng thái; refetch trước replay, không queue accept/payment mù.
- **API/database:** Local queue IDs+checksum; server dedupe ảnh.
- **Tác động Customer/Admin:** Giữ contract cũ; kiểm tra quyền/detail và không ảnh hưởng settlement; thay đổi chủ yếu read/UI worker. 
- **Acceptance Criteria:** Kill/offline giữ ảnh, retry không duplicate, logout cách ly tài khoản.
- **Test cases:** AC-13/22/24; airplane/kill/login-other-user; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Giữ queue version readable, không replay thao tác nguy hiểm.

## NOT-01 — P1 — Inbox thông báo/deep link

- **Hiện trạng/vấn đề:** MISSING; gap G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** SYNC-01.
- **File/module dự kiến:** worker notifications tab, backend event/inbox API/entity.
- **Yêu cầu và giải pháp:** Persist notifications từ event commit, read/unread, auth deep link.
- **API/database:** API mới chỉ nếu không có inbox reuse; additive Notification.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Không mất event quan trọng khi offline, link đúng owner order.
- **Test cases:** Unread pagination/auth/reconnect tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Giữ event/read IDs, rollback UI không mất inbox.

## HIST-01 — P1 — Lịch sử đơn thật và lọc

- **Hiện trạng/vấn đề:** PARTIAL; gap G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ORD-02.
- **File/module dự kiến:** worker jobs/history tab, orderService.getMyOrders.
- **Yêu cầu và giải pháp:** Reuse list API, filter/page/status adapter, detail timeline.
- **API/database:** GET orders page/limit/status.
- **Tác động Customer/Admin:** Giữ contract cũ; kiểm tra quyền/detail và không ảnh hưởng settlement; thay đổi chủ yếu read/UI worker. 
- **Acceptance Criteria:** Không demo history; không xem đơn khác; empty/error/retry.
- **Test cases:** Pagination/status/owner/component tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Không đổi API cũ, rollback chỉ read UI.

## EARN-01 — P1 — Summary/ledger/thu nhập UI

- **Hiện trạng/vấn đề:** MISSING; gap G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** WAL-01.
- **File/module dự kiến:** worker earnings tab/API, backend earnings read model, admin reconcile.
- **Yêu cầu và giải pháp:** Tính pending/available/commission từ ledger, withdrawal unavailable khi chưa có backend.
- **API/database:** Read API reuse wallet/ledger nếu đủ; không tạo writer thứ hai.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Tổng khớp ledger, không stats cố định/rút tiền giả.
- **Test cases:** Read aggregation/timezone/pagination đối soát tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Giữ read model tương thích, không sửa ledger.

## PROF-01 — P1 — Hồ sơ/kỹ năng/approval/radius

- **Hiện trạng/vấn đề:** PARTIAL; gap G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** AUD-01, ORD-01.
- **File/module dự kiến:** worker profile UI, workers profile/services/submitApproval, admin approval.
- **Yêu cầu và giải pháp:** Reuse API, đồng bộ skill eligibility theo WorkerService/category; radius/chứng chỉ policy.
- **API/database:** Profile/services hiện hữu; additive evidence/radius nếu duyệt.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Approval đúng quyền; thay matching skill có audit; real loading/error.
- **Test cases:** Profile validation/approval/eligibility tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Không auto approve; giữ mapping cũ qua adapter nếu cần.

## HARD-01 — P1 — Hardening còn lại và accessibility

- **Hiện trạng/vấn đề:** BUG; gap G18/G19/G20 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** E2E-01.
- **File/module dự kiến:** upload/logging/redaction, worker shared UI, gateway rate limits, admin mock fallback.
- **Yêu cầu và giải pháp:** Core ownership đã phải xong ở P0; phần còn lại là logs/retention/perf/a11y, bỏ mock che lỗi.
- **API/database:** Không lộ selfie/PII/secrets; policy retention cần duyệt.
- **Tác động Customer/Admin:** Cập nhật cùng contract state/quote/payment/read model liên quan; regression customer Tracking/Acceptance/PaymentReview và admin Orders/detail; không suy trạng thái/tiền từ local UI. 
- **Acceptance Criteria:** Screen reader/font scaling/GPS battery và error reporting thật.
- **Test cases:** Security regression + physical device measurements; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Tắt feature mới khi lỗi, không bật lại fake data/bypass.

## NEAR-01 — P2 — Nearby jobs theo policy đã chốt

- **Hiện trạng/vấn đề:** MISSING; gap G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** ORD-01, E2E-01.
- **File/module dự kiến:** worker jobs tab, matching read model.
- **Yêu cầu và giải pháp:** Chỉ làm khi chọn offer-only hay marketplace, bảo vệ location/PII.
- **API/database:** Reuse candidate APIs nếu quyền phù hợp.
- **Tác động Customer/Admin:** Giữ contract cũ; kiểm tra quyền/detail và không ảnh hưởng settlement; thay đổi chủ yếu read/UI worker. 
- **Acceptance Criteria:** Không xung đột dispatch và busy invariant.
- **Test cases:** Eligibility/privacy/race tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Feature flag giữ offer-only.

## ADV-01 — P2 — Thống kê nâng cao

- **Hiện trạng/vấn đề:** MISSING; gap G19 trong 02, chứng cứ ở 01.
- **Phụ thuộc:** E2E-01, EARN-01.
- **File/module dự kiến:** worker dashboard/read analytics.
- **Yêu cầu và giải pháp:** Metric thật từ ledger/order và đo UX, không giả số.
- **API/database:** Read-only summary có pagination/timezone.
- **Tác động Customer/Admin:** Giữ contract cũ; kiểm tra quyền/detail và không ảnh hưởng settlement; thay đổi chủ yếu read/UI worker. 
- **Acceptance Criteria:** Đối soát được từng metric.
- **Test cases:** Aggregation/empty/error tests; luôn kiểm tra happy path, thiếu quyền, lỗi mạng và retry phù hợp.
- **Rủi ro/rollback:** Rollback UI/read endpoint, không ghi tài chính.
