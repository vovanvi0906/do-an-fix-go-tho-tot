# AUDIT-AI-THESIS — Kết luận độc lập

Ngày audit: **19/11/2026**, Asia/Ho_Chi_Minh. Baseline `1432f67264f4d67bd5718b50642f6b4c9d5289ce`, branch `update/face-id-cho-workerapp`; working tree sạch lúc bắt đầu. Chỉ bổ sung báo cáo; không sửa application/schema/model/dependency, không thao tác DB, commit, push hoặc đổi branch.

Không tìm thấy file `.docx` trong workspace. Đã yêu cầu cung cấp; người dùng trả lời bằng toàn văn đề tài trong hội thoại. Báo cáo dùng **bản văn do người dùng cung cấp**, chép các đoạn cần đối chiếu trong [01](01-thesis-requirement-mapping.md), không tuyên bố đã đọc bản DOCX hoặc xác minh quy định riêng của trường.

## Kết luận chính

**Hệ thống AI hiện tại: PHÙ HỢP MỘT PHẦN với đề tài.** Việc tích hợp pretrained/API phù hợp hướng công nghệ được đề tài nêu. Chưa đủ để công nhận hoàn thành: Before/After còn success giả và thiếu luồng AFTER trên Worker; Face ID có matching 1:1 nhưng chưa có đánh giá biometric/PAD trên dữ liệu độc lập; dataset sự cố bị trùng train/test. Không có cơ sở tuyên bố hệ thống đã đạt chuẩn đầu ra “hoàn chỉnh” hoặc “nhận diện chính xác”.

| Yêu cầu | Triển khai hiện tại / source | Runtime audit này | Trạng thái | Gap và hướng khắc phục |
|---|---|---|---|---|
| AI-01: phân tích sự cố, gợi ý, giá | CLIP/YOLO classifier → resolver → active catalog, triệu chứng/manual, giá DB. `recommendation/router.py:34`, `diagnosis-resolver.js:105`, `orders.service.js:137` | 4 test inference thật đạt; chưa storage/DB/booking E2E | PARTIAL | Nhận diện nhóm/đối tượng chưa chứng minh phát hiện lỗi; cần tập test thật, tách metric ảnh và rules |
| AI-02: ảnh trước/sau, nghiệm thu | ORB/RANSAC/SSIM/diff thật nhưng fallback `.92/true`; AFTER UI thiếu. `main.py:581,804`, Worker `job/[id].jsx:204` | Ảnh rỗng trả `.92/true`; fixture CV chạy được | FAIL | Bỏ success giả, hoàn thiện AFTER, abstain/manual và đánh giá theo nhãn người |
| AI-03: đúng người trước ca | YuNet/SFace 128-D + encrypted template, session/order proof, PAD MN3 experimental. `face_core.py:103`, `face-core.service.js:635` | YuNet/SFace load thật; fixture face bị NO_FACE; chưa genuine/impostor hay mobile E2E | PARTIAL | Hiệu chỉnh ngưỡng, kiểm PAD/FMR/FNMR; xác nhận mốc “nhận ca” với giảng viên |
| Bằng chứng thực nghiệm | Có training artifacts, confusion matrix và test code; benchmark đề xuất dùng fixture. `benchmark_recommendation.py:42` | Hash lại toàn bộ 1.200 ảnh: train–test chung 109 hash | FAIL | Không dùng metric cũ làm bằng chứng tổng quát hóa; tạo test set độc lập |
| Chuẩn đầu ra toàn hệ thống | Có API, app, FSM, guards; chưa audit đầy đủ mọi chức năng GPS/chat/thu chi trong task AI | Không chạy thanh toán, storage, DB hoặc thiết bị | NOT_VERIFIED | Cần E2E nghiệp vụ và settlement/commission/ledger thật hoặc sandbox có chứng từ |

Đường dẫn đầy đủ, symbol, dòng và giới hạn bằng chứng ở [02](02-current-ai-architecture.md)–[05](05-face-verification-audit.md); kết quả thực thi ở [09](09-test-matrix.md). `PASS` chỉ dùng cho tiêu chí hẹp đã kiểm, không suy từ endpoint hoặc file weights.

## Trả lời Q1–Q8

**Q1. Cách làm có hợp lệ theo đề tài?** Có, xét cách tiếp cận tích hợp AI/pretrained/API: mục 2 nêu Python FastAPI/YOLO/OpenCV; mục 4 cho phép kiến thức xử lý ảnh **“hoặc tích hợp các API nhận diện hình ảnh/khuôn mặt”**. Mức đáp ứng chức năng mới một phần; không đồng nghĩa được trường xác nhận đạt khóa luận.

**Q2. Bắt buộc tự huấn luyện?** Không có yêu cầu này trong toàn văn được cung cấp; chưa có văn bản riêng của trường/giảng viên. Repo đã có pipeline fine-tune YOLO và artifacts, nhưng điều đó không tạo nghĩa vụ phải train. Chất lượng dữ liệu mới là thiếu sót cần ưu tiên.

**Q3. Ba chức năng thực sự hoạt động?** AI-01 có inference thật đã chạy trên fixture; chưa chứng minh toàn luồng và độ chính xác thực địa. AI-02 có thuật toán CV chạy thật nhưng còn fail-open nên không đạt tiêu chí nghiệm thu tin cậy. AI-03 đã có identity matching và cấp proof được kiểm soát ở source, không còn detection-only; happy path người thật/thiết bị/PAD chưa được audit này xác nhận.

**Q4. Mock/heuristic/giả ở đâu?** Compare FastAPI mặc định `.92/true`, Node fallback cùng kiểu; backend thiếu score mặc định `.9`; Customer thiếu kết quả mặc định 94% và ảnh Unsplash. Legacy diagnosis có target keyword `.95` và chọn dịch vụ đầu danh sách; v2 có text boost và confidence similarity chưa calibration. Benchmark đề xuất đọc predicted/rank/latency từ fixture. Xem [03](03-ai-diagnosis-audit.md), [04](04-before-after-audit.md), [07](07-academic-evidence-gap.md). Rules minh bạch không tự động là kết quả giả; success khi không có ảnh là sai có bằng chứng.

**Q5. Rủi ro lớn nhất khi bảo vệ?** Demo “AI nghiệm thu đạt” khi ảnh không đọc được, hoặc trình bày accuracy synthetic/leakage và latency fixture như đo thực tế. Hội đồng có thể kiểm bằng ảnh lỗi, thiết bị khác góc, người khác và mất AI. Ngoài ra thiếu AFTER khiến không hoàn thành quy trình trên app hiện hành.

**Q6. Thay bằng Gemini 2.5 Flash/Qwen3-VL-8B?** Chưa có benchmark so sánh để chứng minh nên thay. Giữ baseline để đo trước. API VLM phù hợp thử nghiệm mở rộng dấu hiệu nhìn thấy; Qwen tự host tốn tài nguyên hơn máy hiện tại. Riêng Gemini 2.5 Flash đã được nhà cung cấp thông báo deprecated, không nên khóa một triển khai mới vào phiên bản này; xem [nguồn chính thức](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash) và [06](06-model-options-comparison.md). Không thay Face ID/PAD bằng VLM tổng quát.

**Q7. Phương án tối ưu thời gian/chi phí?** Sửa tính trung thực của luồng nghiệm thu và nối AFTER trước; giữ resolver/catalog/giá server, YuNet/SFace và baseline CLIP; thu test set thật, đo baseline và một API VLM trên cùng dữ liệu đã ẩn thông tin cá nhân. Chỉ thay mô hình khi cải thiện đo được, phù hợp ngân sách và điều khoản. Không ưu tiên fine-tune mới hoặc tự host 8B trên laptop hiện tại. Kế hoạch ở [08](08-recommended-improvement-plan.md) là đề xuất, chưa triển khai.

**Q8. Bằng chứng cần chuẩn bị?** Dataset có nguồn/quyền/nhãn và split độc lập; raw predictions + model hash/prompt/catalog/config; precision/recall/F1/confusion matrix, service Top-1/Top-3, abstention và coverage; Face FMR/FNMR, PAD APCER/BPCER theo loại tấn công; Before/After đối chiếu người đánh giá; p50/p95/tỷ lệ lỗi/unavailable; video + log requestId từ camera tới DB/booking/proof/nghiệm thu/thanh toán. Không bộ metric nào tự bảo đảm hội đồng chấp nhận; tiêu chí nghiệm thu học thuật cuối cùng thuộc quy định và người hướng dẫn.

## Năm góc đánh giá

1. **Phù hợp yêu cầu:** hướng tích hợp đúng; chưa đủ bằng chứng đáp ứng toàn bộ ba AI và mốc xác thực.
2. **Hoàn thiện triển khai:** kiến trúc nền có đóng góp thực; AFTER và trạng thái không thể đánh giá còn thiếu/sai.
3. **Thực nghiệm:** primitive/fixture được xác nhận hẹp; chất lượng miền nghiệp vụ chưa được xác nhận.
4. **Rủi ro bảo vệ:** cao nếu giữ claim “chẩn đoán nguyên nhân”, “an toàn kỹ thuật”, “accuracy 100%” hoặc “chống giả mạo” mà không có dữ liệu.
5. **Đóng góp sinh viên:** tích hợp ảnh–AI–catalog–booking, rules triệu chứng, giá authoritative, FSM, encrypted versioned templates, scope/nonce/proof consumption, thiết kế thực nghiệm. Không nhận là tác giả YOLO/CLIP/SFace/MN3 hoặc người thu dữ liệu thực địa khi chưa có provenance.

**Hệ thống AI hiện tại: PHÙ HỢP MỘT PHẦN với đề tài**, vì có xử lý ảnh và model thật nhưng nghiệm thu còn kết quả giả, luồng AFTER chưa hoàn thiện và thiếu kiểm chứng độc lập cho chất lượng sự cố/khuôn mặt/PAD.
