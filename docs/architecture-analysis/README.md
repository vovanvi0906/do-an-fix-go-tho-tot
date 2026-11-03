# FixGo Pro — Architecture Analysis

Báo cáo học kiến trúc từ source, snapshot **01/11/2026**. Chỉ tạo tài liệu; không sửa application code hay chạy ứng dụng/test có thể ghi dữ liệu. Các Mermaid diagram mô tả **AS-IS**; đề xuất TO-BE được ghi riêng bằng chữ/pseudocode.

## Navigation

| Tài liệu | Nội dung |
|---|---|
| [00 — Executive summary](00-executive-summary.md) | Kết luận, phát hiện cần ưu tiên và giới hạn |
| [01 — Project structure](01-project-structure.md) | Multi-app inventory, module/entry point/dependency graph |
| [02 — Tech stack](02-tech-stack.md) | Manifest stack, runtime/config và integration |
| [03 — Architecture overview](03-architecture-overview.md) | Kiến trúc chủ đạo, layer direction, labels được/chưa xác nhận |
| [04 — Design patterns](04-design-patterns.md) | DI/Repository/Adapter/Observer/Builder/DTO và giới hạn gán nhãn |
| [05 — Design principles](05-design-principles.md) | SOLID và các nguyên lý kèm source, impact/trade-off |
| [06 — Runtime data flow](06-runtime-data-flow.md) | Login, upload/AI, booking/accept, dashboard, payment |
| [07 — Database architecture](07-database-architecture.md) | ER, IDs/relations, indexes, transaction/migration/query review |
| [08 — API/security/performance](08-api-security-performance.md) | Contract, trust boundaries, testing/CI/operations |
| [09 — Architecture review](09-architecture-review.md) | 22 findings ưu tiên và incremental improvements |
| [10 — Learning roadmap](10-learning-roadmap.md) | Beginner → Advanced, trade-offs, 5 bài tập chưa thực hiện |
| [11 — Evidence index](11-evidence-index.md) | Claim → file → symbol → confidence, coverage/file inventory |

## Thứ tự đọc

- Cần nắm hệ thống nhanh: **00 → 01 → 03 → 06 → 09**.
- Học theo source: **01 → 02 → 06 → 07 → 04 → 05 → 10**.
- Kiểm tra nhận định: mở **11**, theo link source và line number, đối chiếu caller và schema.

## Quy ước

**CONFIRMED** = thấy trực tiếp source/config; **INFERRED** = suy luận có evidence; **NOT FOUND** = không tìm thấy trong phạm vi scan; **NOT VERIFIED** = cần runtime hoặc môi trường để xác minh. Confidence khác severity. Không có test pass/runtime claim khi chưa chạy.

Source link tương đối `../../application/path#L...`, cạnh link ghi symbol và dòng tại snapshot. Link GitHub-style `#L` có thể không cuộn trong mọi Markdown viewer; đường dẫn và số dòng vẫn dùng để tra source. Nếu source đổi, line có thể dịch chuyển; ưu tiên symbol.

Không chứa env values, credentials, private keys, actual tokens hoặc log/dataset của người dùng. Metadata/source inventory là scan tĩnh, không phải audit mọi dòng UI hay chứng minh deployment production. Phạm vi loại trừ được ghi trong evidence index.

Ghi chú snapshot: source có thay đổi đồng thời trong lúc review; đã đối chiếu lại phần AI/backend liên quan và cập nhật dẫn chiếu. Các source changes ngoài báo cáo được giữ nguyên; xem mục cuối evidence index.
