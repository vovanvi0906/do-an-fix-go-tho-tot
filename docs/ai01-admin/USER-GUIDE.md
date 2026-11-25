# Sử dụng AI-01 trong FixGo Admin Web

## Quyền hiện hành — ACTIVE ADMIN tự quản trị

Tài khoản được JWT strategy xác minh trong PostgreSQL có `role=ADMIN`, `status=ACTIVE` tự có quyền quản lý nhân sự AI và Coordinator. Không cần bootstrap, phê duyệt thứ hai, permissionManagers hoặc cấp Coordinator thủ công. Quyết định thay đổi cơ chế này do chủ dự án yêu cầu; hướng dẫn bootstrap cũ không còn áp dụng.

Backend lấy user ID từ JWT đã xác minh, truy vấn lại trạng thái/role DB ở mỗi request. Không tin role claim, frontend, localStorage hoặc reviewerId từ body. Tài khoản bị khóa bị từ chối kể cả JWT còn hạn; hạ role mất quyền quản trị ngay request tiếp theo.

ADMIN được quản lý mapping, nhân sự, nguồn ảnh, phân xử, readiness và xuất GT. Quyền quản trị không thay thế chuyên môn, nhãn độc lập, quyền ảnh, metadata, hash hoặc export validation. Không tự đánh dấu Admin là chuyên gia. Nếu cần expert, một Admin khác xác minh/cấp `coordinator, expert=true` có lý do và audit; không tự khai chuyên môn.

## Chế độ SOLO_THESIS — tự gán nhãn khóa luận

Mở **Quản lý AI → Khóa luận một người** (`/admin/ai01/solo`). ADMIN active được tự gán và xác nhận nhãn, không cần Reviewer A/B hoặc người thứ ba. Có liên kết chuyển chế độ từ Tổng quan Dataset. Chọn chế độ không đổi role, không đổi policy và không ghi nhãn vào luồng độc lập.

1. **Duyệt mapping:** từng mapping SOLO cần lý do; được xác nhận, chỉnh, từ chối hoặc để chưa chắc. Mapping của chế độ độc lập không được sao chép hay duyệt thay.
2. **Gán nhãn:** chọn toàn bộ 150 ảnh hoặc thử 10 ảnh Sửa nước đầu tiên. Xem ảnh gốc, bật/tắt bbox/polygon nguồn; ghi taxonomy, dấu hiệu, tình trạng, lý do/bằng chứng. Chọn “Đã gán nhãn, chờ tự kiểm tra”, “Chưa chắc”, “Cần chuyên gia” hoặc “Loại ảnh”. Không suy nhãn bình thường từ annotation trống. Không có checkbox giả rằng đã review độc lập.
3. **Nguồn và ảnh trùng:** xác minh quyền sử dụng/license, nguồn, SHA/pHash/cùng cảnh và duplicateGroup. Metadata device/session phải có nguồn cung cấp và bằng chứng; không có thì giữ trống/cách ly. Chọn vùng phát triển khi có đủ chứng cứ. Dữ liệu nguồn trong SOLO cũng riêng, không cập nhật provenance độc lập.
4. **Tự kiểm tra:** đọc lại nhãn, bằng chứng và lịch sử. Nhập lý do tự xác nhận. Chỉ chính Admin đã gán nhãn được tự xác nhận bản mới nhất. Nhãn chưa chắc/cần chuyên gia/loại ảnh không được xác nhận để xuất; phải sửa bằng một quyết định mới có lý do khi đã giải quyết được vấn đề. Sửa nhãn, mapping hoặc nguồn sau xác nhận sẽ yêu cầu kiểm tra lại.
5. **Xuất dữ liệu phát triển:** nhập đúng từng img-ID của subset. Backend kiểm mọi ảnh, taxonomy, mapping SOLO, quyền/nguồn, nhóm trùng, metadata và hash. Một ảnh thiếu điều kiện chặn toàn yêu cầu; không âm thầm bỏ ảnh. Chỉ xuất nhãn của chính tài khoản hiện tại.

File `solo-development-*.jsonl` có schema `fixgo.ai01.solo-development.v1`, `mode=SOLO_THESIS`, `split=development`, `review.status=self_confirmed`, đúng một annotator ID và `independentlyReviewed=false`, `blindTest=false`. Đây là dữ liệu phát triển do một người thực hiện, **không phải independently approved GT hoặc blind test**. Không đổi tên, đổi cờ hoặc đưa file vào pipeline approved-development/TASK01 như GT độc lập. Schema SOLO cố ý khác Sample độc lập.

Lịch sử riêng tại `<AI01_REVIEW_STATE_DIR>/solo-thesis/events.jsonl`, artifact trong `solo-thesis/exports/`; mỗi quyết định có timestamp UTC, user ID từ JWT, policy/input revisions và chuỗi hash. Bản nhãn mới lưu hash bản trước; xác nhận lưu hash nhãn/mapping/nguồn. Lịch sử ảnh hiển thị ngay dưới form, gồm các lần sửa nhãn, mapping liên quan và kiểm nguồn. Restart kiểm/replay chuỗi hash; không tự sửa audit hỏng. Cùng khóa single-writer với engine Admin.

SOLO vẫn giữ điều kiện taxonomy/source/hash/metadata, không tự cấp chuyên môn và không làm giả triệu chứng hoặc dịch vụ. Dịch vụ dương cần chuyên môn đã xác minh cùng bằng chứng. Exposure prediction cũ được ghi vào bản xuất để minh bạch, không được mô tả là đánh giá mù. Quy trình độc lập 7 bước và export gate TASK01 bên dưới giữ nguyên; không dùng nhãn/xác nhận SOLO thay A/B/phân xử.

Chi tiết API và bằng chứng: [SOLO-THESIS-RESULTS.txt](SOLO-THESIS-RESULTS.txt).

## 1. Runtime backend

Giữ cấu hình ngoài Git, policy và state riêng ngoài raw/TASK03C:

```bash
AI01_REVIEW_ENABLED=true
AI01_PILOT_DIR=/home/vanvi/Work/datasetai/06-benchmarks/ai01-pilot-v1
AI01_REVIEW_STATE_DIR=/home/vanvi/Work/datasetai/06-benchmarks/ai01-admin-v1/reviews
AI01_REVIEW_POLICY_FILE=/home/vanvi/Work/datasetai/06-benchmarks/ai01-admin-v1/role-policy.json
```

`AI01_REVIEW_PYTHON` mặc định `ai-service/.venv/bin/python`. JWT_SECRET backend tối thiểu 32 ký tự, không fallback; không đưa secret vào Vite. Runtime root 0700, file 0600, chạy một backend writer. Python adapter qua stdio, không cần HTTP 8767.

Policy tối thiểu `{"version":1,"users":[]}` đã đủ cho mọi ACTIVE ADMIN quản trị. Metadata bootstrap/permissionManagers cũ có thể giữ để bảo toàn lịch sử nhưng không còn quyết định quyền. Không sửa/xóa log quyền để chuyển cơ chế. Policy hỏng, checksum sai hoặc state không hợp lệ vẫn chặn request; quyền Admin không bỏ validation.

## 2. Đăng nhập và quản trị

Đăng nhập thật tại `/login`, mở **Quản lý AI → Tổng quan Dataset** (`/admin/ai01/overview`). `/api/admin/ai01/access` trả `role=coordinator`, `assigned=true`, `canManagePermissions=true` cho Admin active, kể cả users rỗng. Không có API bootstrap hoặc self-grant quản trị.

Các trang quản trị: `overview`, `mapping`, `permissions`, `adjudication`, `sources`, `export` dưới `/admin/ai01/`. Trang annotation độc lập không cho Admin nộp nhãn Reviewer A/B. Để tự gán nhãn, mở chế độ SOLO_THESIS riêng bên dưới. Trang phân xử chỉ trả cặp nhãn khi đủ hai người; người phân xử phải khác cả A và B và đủ chuyên môn nếu trường hợp yêu cầu.

## 3. Phân công người thật và bảo vệ độc lập

Mở **Quản lý nhân sự AI**, tìm tài khoản FixGo ACTIVE thật (không chỉ Admin), chọn ID khác mình, vai trò, chuyên môn đã xác minh và lý do. API ghi audit, kiểm expectedRevision, chống self-grant, giữ ràng buộc lịch sử. Không thay role DB hoặc tạo tài khoản từ trang này.

Reviewer A và B phải là hai người thật khác nhau, tài khoản **không phải ADMIN** để không có quyền quản trị xem mapping/nhãn người khác. Backend từ chối assignment Reviewer A/B cho ADMIN. Hai slot mỗi slot một user; không giả hai người bằng hai tab. Không tự động phân công reviewer cho ai.

Reviewer đăng nhập bình thường, sau đó mở `/ai01/annotation` (hoặc `/ai01/overview`). Workspace này không mở các trang quản trị FixGo. API chỉ gửi nhãn nguồn/metadata trung tính và bản của chính reviewer, không gửi mapping AI, prediction, nhãn người khác. Link trực tiếp không thay quyền backend.

Nếu reviewer đang gắn slot được nâng thành ADMIN, chặn xung đột để đối chiếu lịch sử; không tự chuyển vai trò hoặc cho xem nhãn. Ràng buộc engine vẫn chặn đổi vai trò/chuyên môn sau khi đã có principal_binding. Thu hồi assignment không xóa lịch sử và có hiệu lực request tiếp theo cho non-admin. Thu hồi assignment không hạ quyền quản trị mặc định của ADMIN.

Pilot có 150 ảnh: 70 Sửa nước, 50 Sửa điện, 8 Điện lạnh, 7 Giúp việc, 7 Làm vườn, 8 Thiết bị gia đình. Bắt đầu 10 ảnh Sửa nước đã đề xuất, giữ quarantine nếu thiếu điều kiện; chỉ mở rộng sau khi quy trình hai reviewer và người thứ ba phân xử được kiểm chứng.

## 4. Quy trình 7 bước

1. **Duyệt Mapping:** Coordinator xem bảng 54 lớp tiếng Việt, xác nhận/chỉnh/từ chối/chưa chắc từng dòng, ghi lý do. Không duyệt hàng loạt hoặc coi Roboflow là GT. Chỉ cần xử lý lớp thuộc subset sẽ xuất.
2. **Reviewer A:** đăng nhập tài khoản A, mở Gán nhãn ảnh. Xem ảnh gốc và bbox/polygon/nhãn nguồn, tự chọn category/target/dấu hiệu/tình trạng, ghi lý do. Không xem mapping AI, prediction hoặc nhãn B; backend không cung cấp các dữ liệu này.
3. **Reviewer B:** làm độc lập trên cùng pilot bằng user B. Không dùng nhiều tab cùng tài khoản giả làm A/B. Giữ `uncertain`, `needsExpertReview` hoặc `reject` khi thiếu chứng cứ.
4. **Phân xử:** user thứ ba mở Phân xử nhãn sau khi đủ hai bản. Hai bản giống nhau vẫn cần duyệt cuối. Tự ghi nhãn cuối và lý do; không tự copy A/B thành approved. Ngoại lệ nhãn nguồn sai cần chuyên gia và lý do cụ thể.
5. **Kiểm nguồn / ảnh trùng:** Coordinator xem family ứng viên, kiểm quyền ảnh/license/attribution, SHA/pHash/cùng nguồn/cùng cảnh. Không tự tạo deviceId/sessionId/siteId; nếu nguồn không có thì trống và quarantine. Nhãn “bình thường” không được suy từ annotation rỗng.
6. **Kiểm điều kiện:** xem từng ảnh thiếu gì. Nhãn hoặc mapping đổi sau phân xử sẽ yêu cầu duyệt lại. Giấy phép khai trong YAML chưa tự chứng minh quyền mọi ảnh stock.
7. **Xuất Ground Truth:** nhập đúng các img-ID subset muốn xuất. Engine kiểm đủ mapping, hai reviewer, người thứ ba, chuyên môn, nguồn/quyền/group/metadata và hash, validate contract TASK 01 rồi ghi artifact mới. Thiếu một ảnh thì chặn toàn request, không âm thầm bỏ ảnh. File là approved-development/validation, **không phải blind test mới**.

Tài liệu chi tiết gán nhãn cho người mới vẫn ở `~/Work/datasetai/06-benchmarks/ai01-pilot-v1/HUONG-DAN.md`. Phần tài khoản local A/B ở tài liệu cũ không dùng trong Admin; dùng tài khoản FixGo đã được cấp vai trò AI.

## 5. Lịch sử và khắc phục lỗi

Source TASK 03C giữ nguyên. Vùng Admin có `baseline.json`, `events.jsonl`, snapshot trạng thái, `permission-events.jsonl` và `exports/`. Không sửa log bằng tay. Không copy mật khẩu reviewer local. Không tự sửa alias cũ thành UUID; dùng quyết định mới có authenticated principal.

- 401: đăng nhập lại tài khoản FixGo thật; mock UI/network fallback không dùng được cho AI.
- 403: tài khoản không phải Admin hoặc chưa có assignment AI hoặc sai bước; nhờ Admin phân công, không tự thay localStorage/role.
- 409: nhãn, mapping, assignment hoặc policy revision đã đổi; tải lại/duyệt lại. Cũng có thể là cố đổi slot đã gắn lịch sử hoặc export còn thiếu điều kiện.
- 503: chưa bật module/cấu hình path/secret, sai checksum, engine đang có writer khác, hoặc cần đối chiếu policy/audit. Không tắt validation hoặc đổi checksum để hợp thức hóa.

Log policy ghi trước atomic policy swap. Nếu crash hoặc sửa file ngoài quy trình gây lệch revision, operator đối chiếu backup/audit và hồ sơ thật trước khôi phục; không xóa audit, không tự viết lại review history. Với nhiều backend replica cần thiết kế persistence tập trung trước; bản local này dùng một writer.
