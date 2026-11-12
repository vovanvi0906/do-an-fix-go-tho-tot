# Test plan và acceptance traceability

Không sửa/viết application tests trong audit. Các kịch bản dưới đây là kế hoạch cho task được duyệt. Kết quả đã chạy ở [09](09-progress-tracker.md); trạng thái bảng là mức đáp ứng source, KHÔNG là kết quả chạy E2E. Chưa AC end-to-end nào được chứng minh PASS.

## Môi trường và dữ liệu kiểm thử

- Unit Jest dùng dependencies mock hiện tại; test identity/payment không được dùng mock success như bằng chứng AI/provider thật.
- Integration cần PostgreSQL/PostGIS và Redis riêng cho test, schema dựng từ migration đã được đối chiếu; hai worker APPROVED/ACTIVE, registered FaceProfile, dịch vụ đúng và check-in test fixture được đánh dấu môi trường test, một khách owner và một khách khác.
- E2E cần hai worker devices/emulators + một customer + admin, backend/AI/storage test cấu hình rõ. Mobile hỗ trợ nền/camera/GPS trên thiết bị thật; mock location/camera chỉ phục vụ deterministic tests, không thay QA thiết bị.
- Không dùng server/test/concurrency-order-race.test.js hiện tại làm bằng chứng accept API: nó tạo customerId bằng customerProfile.id sai FK, thiếu categoryId/addressText/lat/lng/estimatedPrice bắt buộc, thiếu check-in và mô phỏng transaction riêng thay gọi route/service thật.
- Không chạy seed/mutation/load test trên DB đang dùng chung. Chuẩn bị fixture namespace và cleanup chỉ dữ liệu của test, không reset/truncate shared DB. Audit chưa kết nối DB live hoặc xác minh staging.

## AC-01…25

| ID | Given/When | Then / acceptance | Bằng chứng hiện tại | Trạng thái source | Test cần thực hiện |
|---|---|---|---|---|---|
| AC-01 | Login hợp lệ, check-in còn hạn → bật online | Backend online + tọa độ thật; UI khớp profile | B5 updateAvailability, W1; 4 WorkersService mock tests có phạm vi hẹp | PARTIAL | Profile eligible, lat/lng thật; API và DB snapshot, reopen hydrate |
| AC-02 | Check-in hết hạn → bật online | Server reject trước verify pass, không sửa faceVerifiedAt khi AI fail | B5 tests expiry/no fallback; G06/07 vẫn mở | PARTIAL | Boundary 24h-1ms/24h/24h+1ms, future/invalid timestamp, AI heuristic/mismatch/down |
| AC-03 | Hai thợ nhận đồng thời một đơn | 1 assigned, còn lại conflict; history 1 accept | B1 accept row lock; race script cũ không chứng minh API thật | NOT_VERIFIED | HTTP Promise.all trên DB test, đủ profile/face/offer; query workerId/status/history |
| AC-04 | Offer hết hạn trước nhận | Server reject expired, UI đóng đúng lý do | B1/B4 không expiry persisted; W1 countdown local | MISSING | Server clock qua expiresAt, background popup rồi accept bằng direct API |
| AC-05 | Assigned → kill/relaunch | Current order và stage restore chính xác | W1/W2/B3 G09/10 | BUG | Mọi active enum, app force-close, deep link chỉ ID; current null xóa cache |
| AC-06 | Verify rồi quay lại detail | Không hỏi lại nếu server policy còn hạn | W2/W3 local flags, B1 verifyFace | BUG | Back/replace/refocus/relaunch; verified vs pending review vs expired |
| AC-07 | Bắt đầu di chuyển | Persist EN_ROUTE alias đúng; customer thấy; reload giữ | W2 status emit không handler; B1 alias có | BUG | API then socket then DB, fail/timeout không local success; tracking đúng identity |
| AC-08 | Thợ đến nơi | ARRIVED server, chưa bắt đầu tính work | W2 handleArrived và B1 markArrived thành IN_PROGRESS | BUG | Travel→arrive, retry, reload; timer chưa bắt đầu |
| AC-09 | Chưa BEFORE → start | Server reject thiếu BEFORE, ISSUE không đủ | B1 updateStatus/createOrder G01/12 | BUG | Chỉ ISSUE; không ảnh; ảnh BEFORE của worker khác; failed upload |
| AC-10 | BEFORE có, quote pending → start | Không IN_PROGRESS trước approve | B1 adjustPrice/updateStatus | BUG | Proposal persisted, refetch pending, direct start API phải reject |
| AC-11 | Khách từ chối phát sinh | Giữ chưa làm, điều chỉnh/hủy theo policy | B1 adjustPrice chỉ note/event; C1 reject | PARTIAL | Reject/version stale/worker edit + start; old quote accept bị conflict |
| AC-12 | Đang tính giờ → kill/reopen | Timer từ server và pause intervals, không reset | D1 startedAt có, W2 chưa timer | PARTIAL | Fake clock unit + real device relaunch, timezone/clock skew/pause |
| AC-13 | Upload lỗi/mất mạng | Không giả uploaded; preview còn, retry đúng một metadata | W5 API có, W2 không media flow | PARTIAL | Deny camera/oversize/network fail/storage ok DB fail/kill upload/duplicate checksum |
| AC-14 | Bấm AFTER | Mở camera AFTER thay face | W2 CTA route face | BUG | Route test và camera device, upload type AFTER rồi reload |
| AC-15 | AI không đánh giá được | Manual review, không điểm đạt giả | AI1/AI2/C1 fallback success | BUG | Unreadable/cross-object/same images/model missing/timeout; manual evidence acceptance |
| AC-16 | Gửi nghiệm thu hợp lệ | Worker awaiting acceptance, khách có ảnh/report thật | B1 finish không ảnh/report guard; W2 không flow | PARTIAL | Missing report/AFTER reject, submit retry, customer reload thấy snapshot |
| AC-17 | Khách yêu cầu sửa lại | Worker thấy reason và flow rework | DISPUTED có, chưa decision/rework flow | MISSING | Reject→feedback→rework→resubmit, dispute khác rework, ai fail không chặn |
| AC-18 | Accept nhưng chưa trả tiền | Không completed, không available wallet | B1 acceptCompletion ghi COMPLETED | BUG | Accept API/alias + reload mọi client, payment pending/fail, wallet không thay đổi |
| AC-19 | Webhook/API success gửi lặp | Chỉ 1 ledger/commission và 1 balance increment | B1 processPayment increment mỗi call, legacy B7 chưa mount | BUG | Parallel verified callback + pay, same provider event, duplicate amount tampering |
| AC-20 | Settlement + ledger commit | Đơn terminal đúng policy, thu nhập đối soát | B1 ghi PAID, worker earnings placeholder | PARTIAL | Inject failure từng bước transaction; sau commit compare Payment/CommissionRecord/ledger/balance |
| AC-21 | User khác truy cập order | Reject toàn read/write/socket, không PII | B1 detail có ownership một phần; images/compare/schedule/pay và B4 thiếu | BUG | Matrix CUSTOMER A/B, WORKER assigned/offer/outside/no profile, ADMIN; unauth socket/admin join/GPS |
| AC-22 | Socket reconnect/event trễ | Refetch state server; không rollback về packet cũ | W6 mock rejoin pass, không version/refetch active | PARTIAL | Disconnect/update server/reconnect; packet versions 8,7,8; foreground; logout account switch |
| AC-23 | Worker bận nhận offer mới | Server từ chối đơn thứ hai ngay cả cạnh tranh | B1 chỉ khóa order | MISSING | Một worker nhận 2 order song song; eligible recipients không gồm worker bận |
| AC-24 | Gửi mutation lặp | Không trùng ảnh/history/bút toán hay cộng quote | B1 status/quote/pay không dedupe | BUG | Same operation key, concurrent retry, lost response, cancellation conflict; query counts |
| AC-25 | Khách vắng/hủy hợp lệ | Reason/history/policy + cả hai app cập nhật | B1 cancel API có; UI issue/cancel chưa nối | PARTIAL | Hủy trước/sau travel, wrong actor, terminal, pay race, customer absent, worker unsafe |

## Test layers và tiêu chí phát hành

| Layer | Phạm vi | Bằng chứng cần lưu |
|---|---|---|
| Unit | Transition/actor table, allowedActions, check-in expiry, quote total/version, pause duration, commission rounding | Lệnh, exit code, assertions pass/fail; case invalid inputs |
| API+DB integration | Ownership đọc/ghi, aliases, CAS, row locks, one-active invariant, ảnh/meta, quote decisions, settlement/ledger | HTTP responses và DB before/after redacted, số row/history/ledger/commission |
| Gateway/Redis | JWT handshake, owner room/Admin role, recipient matching, expiry/expansion, GPS throttle/stage, after-commit event | Packet event/version, absence of leakage, reconnect snapshot |
| Mobile | Startup/focus/foreground/kill, Face return, one CTA, upload/error/retry, GPS/camera denied | Screen recording/screenshots và steps, Android/iOS thực được test |
| AI | Identity match vs detection-only/heuristic; before-after cùng/khác vật/góc/thiếu sáng; invisible repair | Ground truth, engine và limitations; human fallback; không dùng URL flags chứng minh model |
| Finance | Gross/commission/net, 0% commission, duplicate callback, tiền mặt policy, rollback giữa transaction, reconciliation | Payment+CommissionRecord+WalletTransaction+balance khớp; không “thu thật” chỉ từ nội bộ |
| UX/accessibility | Vùng chạm/font lớn/screen reader/contrast/loading/empty/error/deep links | Đo và capture thật; không đánh PASS từ đọc StyleSheet |

Mỗi task kiểm tra cả success/failure/ownership/retry; chỉ PASS khi điều kiện backend và UI liên quan cùng đạt. Những test mock hiện hữu không kiểm tra dữ liệu Prisma thật, gateway auth, model liveness hoặc provider settlement. Task P0 không được đóng khi các AC cốt lõi vẫn fail/NOT_VERIFIED; hạn chế môi trường phải ghi rõ, không tự biến thành DONE.

## Lệnh kiểm tra đã dùng, không thay source

```bash
cd server
npm test -- --runInBand workers.service.spec.js update-availability.dto.spec.js orders.service.spec.js

cd ../worker-app
npm run test:ci -- --runTestsByPath __tests__/workerSession.test.js __tests__/tokenRefresh.test.js __tests__/socketConnection.test.js
```

Lint backend script có `--fix`; không chạy trong audit chỉ tài liệu. Typecheck/build/full test suite/E2E/live AI/provider/device QA chưa chạy; khi triển khai dùng check phù hợp và cấu hình không tự sửa ngoài scope.
