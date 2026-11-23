# 01 — Yêu cầu đề tài và phạm vi kết luận

Nguồn **T**: toàn văn người dùng trả lời trong hội thoại ngày 19/11/2026, gồm tên đề tài và mục 1–5. Không có DOCX trong workspace; nội dung T là nguồn đối chiếu được người dùng cung cấp, chưa xác thực với hồ sơ đăng ký của trường. Không lấy các audit cũ làm yêu cầu chính thức. Các đoạn dưới được trích nguyên văn từ T.

| Mã | Yêu cầu chính thức theo T | Trích dẫn nguồn | Thành phần phụ trách | Tiêu chí kiểm chứng |
|---|---|---|---|---|
| SYS-01 | On-Demand kết nối người thuê và lao động | T §3: “Xây dựng nền tảng phần mềm kết nối theo mô hình On-Demand (tương tự Uber)” | Backend, hai app | Tạo đơn, phân bổ, nhận/từ chối, chuyển trạng thái có owner và lịch sử |
| SYS-02 | Định vị/phân bổ gần, realtime | T §1: “hệ thống định vị GPS tự động quét và phát đơn đến các người lao động phù hợp ở gần nhất” | PostGIS/matching/socket/worker/customer | Tọa độ thật, radius/eligibility, socket đúng người, reconnect |
| AI-01 | Sự cố → dịch vụ → giá ước tính | T §3: “Tự động nhận diện và phân loại dạng sự cố điện nước/hư hỏng thiết bị từ hình ảnh do khách hàng tải lên để gợi ý dịch vụ và ước tính chi phí.” | Customer upload, FastAPI, resolver/catalog, booking | Ảnh thật quyết định nhóm/đối tượng/dấu hiệu; đánh giá nhãn lỗi độc lập; dịch vụ active và giá từ DB; uncertain/manual |
| AI-02 | Đối chiếu trước/sau hỗ trợ nghiệm thu | T §3: “Tự động kiểm tra, so sánh hình ảnh trước và sau khi hoàn thành công việc (Before - After validation) để nghiệm thu chất lượng công việc.” | Worker media, CV, Orders, Customer acceptance | BEFORE/AFTER đúng thời điểm, xử lý pixel thật, không success khi không đọc ảnh; ground truth người đánh giá, quyền khách |
| AI-03 | Face Verification chính chủ trước ca | T §3: “Nhận diện khuôn mặt (Face Verification) người lao động trước khi nhận ca để đảm bảo chính chủ và an toàn cho gia chủ.” | Worker camera, Face Core, YuNet/SFace/PAD, authorization | Mẫu đăng ký gắn account; genuine/impostor; cấp proof chỉ sau match; gate đúng mốc nghiệp vụ được thống nhất |
| PAY-01 | Thanh toán/hoa hồng/ví | T §1: “giữ lại phần trăm (%) chiết khấu cho bên vận hành và chuyển số tiền còn lại vào ví điện tử của người lao động” | Payments, commission, ledger | Chứng từ thanh toán, đúng tỷ lệ và số tiền, retry không cộng lặp |
| APP-01 | Admin + hai mobile app | T §5: “Hệ thống phần mềm hoàn chỉnh gồm Web Admin và 02 Mobile Apps (Khách hàng & Người lao động) hoạt động mượt mà.” | client/customer-app/worker-app/server | E2E trên thiết bị, không chỉ build hoặc test mock |
| DOC-01 | Source, thiết kế, kiểm thử | T §5: “Bàn giao đầy đủ mã nguồn (Source Code), tài liệu phân tích thiết kế hệ thống, tài liệu thiết kế cơ sở dữ liệu/API và báo cáo kết quả kiểm thử.” | Repo, tài liệu, bộ test | Lệnh tái lập, phiên bản, raw results, giới hạn, không metric dựng sẵn |
| QUAL-01 | Nhận diện đúng mặt và phân tích ảnh | T §5: “Mô-đun xử lý ảnh nhận diện chính xác khuôn mặt xác thực và phân tích được hình ảnh nghiệm thu/sự cố.” | Cả ba AI | Metric trên tập độc lập + workflow thật; không tự gán ngưỡng “chính xác” do T không có số |

## Pretrained/API và huấn luyện

T §2 nêu “mô-đun AI/Xử lý ảnh (Python FastAPI/YOLO/OpenCV)”. T §4 nêu “Có kiến thức về xử lý ảnh, thị giác máy tính (OpenCV, YOLO, TensorFlow/PyTorch) hoặc tích hợp các API nhận diện hình ảnh/khuôn mặt.”

**Không tìm thấy yêu cầu tự train/fine-tune, model độc quyền, cấm pretrained hoặc cấm API trong T.** Việc dùng pretrained/API vì vậy phù hợp hướng được mô tả, với điều kiện thực hiện chức năng, đánh giá và trình bày đóng góp trung thực. Không có bằng chứng về quy định trường/giảng viên khác; không suy ra quy chế chung từ tên khóa luận.

## Điểm phải giải thích khi đối chiếu

- **Mốc face:** T §1 viết “qua camera trước khi bắt đầu ca làm”; T §3 viết “trước khi nhận ca”. Source cho accept trước, ORDER proof tại ARRIVED trước IN_PROGRESS. Nếu “nhận ca” là accept đơn thì hiện tại lệch yêu cầu; nếu là bắt đầu làm thì thiết kế này phù hợp mốc §1. Chưa được tự chốt cách hiểu thay người hướng dẫn. Bằng chứng: [workflow transition](../../server/src/modules/orders/order-workflow.service.js#L186), [orderAccess](../../server/src/modules/workers/face/face-core.service.js#L334).
- **Ảnh ban đầu:** T §1 cho AI đối chiếu với ảnh ban đầu; source tách ISSUE khách và BEFORE thợ sau ARRIVED. Tách thêm BEFORE hợp lý để ghi nhận hiện trường, nhưng báo cáo/demo phải chỉ rõ so với ảnh nào và có dùng ISSUE không. `verifyCompletion` chọn BEFORE, không ISSUE: [OrdersService](../../server/src/modules/orders/orders.service.js#L513).
- **Identity:** T không quy định CCCD, manual review, liveness hay 24h. So khớp với mẫu tự đăng ký chứng minh sự nhất quán người quay lại tài khoản; không tự chứng minh mẫu ban đầu là đúng chủ danh tính pháp lý. Phải mô tả cơ chế duyệt hồ sơ riêng và giới hạn này.
- **Nghiệm thu:** ảnh không chứng minh được lỗi điện ẩn, áp suất, nhiệt độ hoặc vận hành thiết bị. Cần phân biệt nhận diện thiết bị, dấu hiệu bất thường nhìn thấy và chẩn đoán nguyên nhân. Không diễn giải AI-01 thành nghĩa vụ xác định mọi nguyên nhân từ một ảnh.

## Phân loại cơ sở yêu cầu

| Nhóm | Có bằng chứng | Không được tự khẳng định |
|---|---|---|
| Đề tài T | Ba AI, đa nền tảng, On-Demand, GPS, thanh toán/hoa hồng/ví, tài liệu kiểm thử | Tự train; độ chính xác tối thiểu; check-in 24h; model bắt buộc duy nhất |
| Trường/giảng viên | Chưa có văn bản riêng | Cho phép/cấm Gemini, Qwen hay pretrained theo quy chế trường |
| Khuyến nghị kỹ thuật audit | Fail-closed face, abstain khi thiếu ảnh, dữ liệu độc lập, provenance, privacy, kiểm replay/PAD | Xem mọi khuyến nghị là điều khoản đã đăng ký |
| Chưa đủ bằng chứng | Bản DOCX gốc, ngưỡng nghiệm thu học thuật, cách hiểu “nhận ca” | PASS toàn đề tài hoặc bảo đảm hội đồng chấp nhận |

SYS/PAY/APP được đưa vào mapping để không bỏ chuẩn đầu ra; task này không phải audit toàn bộ payment/GPS/chat và không đánh dấu chúng PASS.
