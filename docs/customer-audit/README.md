# Customer App Audit — FixGo

Audit ngày **12/11/2026**, theo working tree tại thời điểm đọc; HEAD `535cc98fc0270858c6afe74e23f54e51f20c870b` **có thay đổi chưa commit**. Đây là audit tĩnh kèm một số test tự động hiện có, không phải chứng nhận chạy production hay E2E. Chỉ tạo tài liệu trong thư mục này; không sửa application code, schema, route hoặc dữ liệu.

## Đọc theo mục đích

| Tài liệu | Nội dung |
|---|---|
| [00 — Executive summary](00-executive-summary.md) | Kết luận, rủi ro chặn phát hành, thứ tự triển khai |
| [01 — Current user flow](01-current-user-flow.md) | Repository, routes thật, luồng hiện tại, phân loại mức hoàn thiện |
| [02 — Target user flow](02-target-user-flow.md) | Hành trình mục tiêu, CTA và phục hồi theo trạng thái hiện có |
| [03 — UX/UI review](03-ux-ui-review.md) | Mục tiêu, dữ liệu, CTA, trạng thái và điểm kẹt từng màn hình |
| [04 — State machine](04-customer-worker-state-machine.md) | Canonical/alias, quyền, gates, migration |
| [05 — API/socket contract](05-api-socket-contract.md) | Endpoint, payload, response, event, xung đột và cách chuyển tiếp |
| [06 — Gap analysis](06-gap-analysis.md) | 24 issue có file/dòng, UX, frontend, backend, dependencies, AC, test |
| [07 — Backlog](07-prioritized-backlog.md) | P0/P1/P2, nhóm triển khai, dependencies và gate |
| [08 — Acceptance criteria](08-acceptance-criteria.md) | Các tiêu chí có thể kiểm chứng, trace tới issue |
| [09 — Test plan](09-test-plan.md) | Test đã chạy, chưa chạy, kịch bản và release gate |

## Quy ước kết luận

- **IMPLEMENTED:** đã lần tới implementation và caller/contract liên quan ở mức mã; không ngụ ý chạy thật thành công.
- **PARTIAL:** có phần thực hiện nhưng thiếu điều kiện/đường nối quan trọng.
- **MOCK:** dữ liệu hoặc success được mô phỏng trong đường được khảo sát; không tự suy thành code đã chạy trên thiết bị.
- **BROKEN:** thấy mâu thuẫn rõ giữa caller, implementation hoặc schema có thể làm sai/chặn hành vi.
- **NOT_IMPLEMENTED:** phần được kiểm tra chỉ placeholder, hoặc chưa tìm thấy implementation trong phạm vi routes/services đã tra. Luôn đọc cùng phạm vi bằng chứng.
- **NOT_VERIFIED:** cần thiết bị, hạ tầng, provider, model hoặc dữ liệu thật; audit chưa kiểm chứng được.

Phân loại theo khả năng cụ thể, không gán cả ứng dụng IMPLEMENTED chỉ vì có file màn hình. Một flow có thể có API IMPLEMENTED nhưng route tích hợp BROKEN. Bằng chứng dùng đường dẫn tương đối từ thư mục này và số dòng working tree; GitHub line anchors có thể chỉ điều hướng chính xác sau khi commit cùng snapshot.

## Phạm vi và giới hạn

Đã đọc và đối chiếu customer-app (Expo Router, hooks, API, storage, socket), worker-app (nhận việc, job detail, face check-in, GPS), server (Nest controllers/service/repository/FSM/guards/Prisma/queue/payment), ai-service (diagnosis, face và compare fallback), một số thao tác admin ảnh hưởng dữ liệu đơn, test hiện có và references. `client` là web quản trị: chỉ đối chiếu tham chiếu admin/socket cần thiết, không audit đầy đủ UI admin. Không dùng báo cáo worker cũ làm chứng cứ thay implementation.

Không có AGENTS.md áp dụng trong đường dẫn project được khảo sát (file trong node_modules hoặc repository khác không áp dụng). Không dùng skill tạo API/migration/UI implementation vì yêu cầu chỉ audit; không phát sinh schema/API mới. Không có yêu cầu hoặc chỉ dẫn áp dụng cho phép phân công agent, nên audit thực hiện trực tiếp.

Không chạy server/Expo/AI stack và không gọi SMS, thanh toán, Cloudinary hoặc sửa DB. Các cấu hình thiết bị, chất lượng model, OTP delivery, push/background GPS, payment thật và full journey: **NOT_VERIFIED**. Xem [09](09-test-plan.md) để phân biệt test mock, test tích hợp và E2E.

## Cách sử dụng backlog

Đọc 00 → 01 → 04 → 05 trước khi chọn task. Dùng Issue ID `CUS-01`…`CUS-24` xuyên suốt; AC và test đặt trong 06 rồi lập bảng truy vết ở 08/09. Đóng issue chỉ khi có bằng chứng đúng cấp kiểm thử. Với thay đổi trạng thái/tiền, chốt contract/migration trước code. Giữ routes/aliases cũ tới khi kiểm tra references, Expo linking, installed app versions và deep links ngoài repository.
