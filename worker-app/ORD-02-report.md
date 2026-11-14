# ORD-02 — Active Order Recovery

Ngày: 12/11/2026. Branch: `agent/codex-worker`. Chỉ sửa `worker-app/**`.

## CURRENT STATUS / contract đã đối chiếu

Đã đối chiếu tài liệu worker-app-doc và docs/worker-implementation/{01,02,07,08,10}, source controller/service/repository/constants/schema hiện hành sau ARC-01.

- `GET /orders/worker/current`: WORKER JWT, derive worker profile từ user; trả raw Order hoặc null. Repository include customer là User, service/category, address, images, statusHistory. ACTIVE_STATUSES đã gồm MATCHED, WORKER_EN_ROUTE, ARRIVED, IN_PROGRESS, AWAITING_ACCEPTANCE, AWAITING_PAYMENT, DISPUTED và aliases legacy. Không thấy lỗi source cần sửa backend.
- `GET /orders/:id`: raw Order, kiểm tra ownership, customer.name, estimatedPrice/finalPrice, worker, statusHistory, images, payment. Không dùng params ngoài ID.
- `GET /orders`: service có sẵn `getMyOrders(params)`, trả `{ data: Order[], pagination }`; đã kiểm tra contract bằng test. Giữ nguyên API/service này; không lấy phần tử đầu của lịch sử làm active order và không dùng list để che lỗi current endpoint. Theo implementation-plan ORD-02, recovery dùng current và detail theo ID.
- Axios interceptor đã unwrap response.data; không unwrap thêm `.data`/`.order` giả. Nest có thể serialize null thành empty body, adapter chấp nhận null hoặc chuỗi rỗng; envelope sai bị reject.

## IMPLEMENTED

- Hook recovery dùng chung: fetch khi mount/focus, AppState active và Socket.IO connect (bao gồm reconnect), refetch khi nhận status event. Event chỉ là tín hiệu; không tin state trong payload.
- Request generation + focus cleanup chặn snapshot chậm ghi đè request mới hoặc publish sau blur/unmount/đổi identity.
- Home đọc current backend; bỏ fallback incoming offer khi accept. Clear snapshot khi refetch/lỗi/null/terminal, có loading/empty/error/retry, giá/tên/địa chỉ card từ backend, navigation chỉ ID. Join/leave room active theo focus.
- Detail fetch theo ID + profile backend, không mặc định ASSIGNED, không nhận face/price/customer từ params. Error không giữ PII hay CTA cũ; retry tải lại snapshot. Timeline dùng statusHistory và trạng thái hiện tại. Chờ nghiệm thu/chờ thanh toán/tranh chấp không có CTA chuyển sai bước.
- Mutations tiếp tục REST; refetch sau acknowledgement, không emit socket status mutation. Face timestamp tương lai không được coi còn hiệu lực; thông báo phiên check-in không khẳng định AI đã đối chiếu danh tính.

## FILES CHANGED

- `app/(worker)/(tabs)/index.jsx`
- `app/(worker)/job/[id].jsx`
- `src/services/api/orderService.js`
- `src/features/orders/hooks/useOrderRecovery.js`
- `__tests__/activeOrderRecovery.test.js`
- `__tests__/workerActiveOrder.test.js`
- `__tests__/orderFsm.test.js`
- `ORD-02-report.md`

## API / DATABASE

Không thay backend, schema, migration, enum, dependencies hoặc lockfile. Không tạo API giả, không ghi DB, không push/merge. Dependency phục vụ test dùng symlink tạm tới node_modules có sẵn ở checkout gốc, không đưa vào commit.

## TEST RESULTS

Tại root repo:

```bash
npm --prefix worker-app run test:ci -- --silent
npm --prefix worker-app run check:build
git diff --check
```

Kết quả: 13 suites / 92 tests PASS; check:build PASS (kiểm tra cấu hình endpoint development, không phải native build); diff check PASS.

Recovery tests bao phủ tất cả active states/aliases, fresh mount, null/empty/COMPLETED clear, foreground, reconnect, request về sai thứ tự, HTTP 401/403/404/500 và retry. UI tests kiểm tra home card backend, navigation ID, xóa card sau reconnect, detail timeline/CTA cho MATCHED/WORKER_EN_ROUTE/ARRIVED/IN_PROGRESS/AWAITING_ACCEPTANCE/AWAITING_PAYMENT/COMPLETED, ẩn PII/CTA sau lỗi; không socket mutation. Test dùng mocked HTTP/socket, không chứng minh gateway/DB live.

Lần chạy đầu của các test timeline mới fail do matcher predicate không được phiên bản Testing Library hỗ trợ; đã sửa matcher và chạy lại toàn bộ đạt. Full suite không silent có cảnh báo act từ AuthProvider trong test auth có sẵn, ngoài ORD-02.

## BLOCKERS / RISKS

- Không phát hiện blocker backend current-order từ source. API live/Prisma thực chưa chạy trong task; chưa có bằng chứng runtime để kết luận current API bị lỗi.
- Force-close/relaunch, navigation focus, offline/foreground và reconnect trên Android/iOS thật: NOT_VERIFIED. Test fresh mount/lifecycle mocked không thay thế device QA.
- Profile backend lỗi thì detail hiển thị error/retry để không giả trạng thái face. Tính tin cậy AI/check-in thuộc FACE-01, không thay đổi trong task này.
- BEFORE/AFTER UI còn thiếu theo ARC-01; backend có thể chặn start/finish đúng guard. Không bỏ guard hoặc mở rộng task media.
- Không thêm version/outbox, GPS recovery hay lịch sử đơn; không tuyên bố giải quyết SYNC-01/GPS-01/HIST-01. Số liệu dashboard và offer mock fallback có sẵn ngoài active card vẫn thuộc task khác.

## NEXT TASK

Dừng ở ORD-02. Không tự bắt đầu task tiếp theo.
