# 08 — Kế hoạch cải thiện đề xuất

**Chỉ là kế hoạch sau audit; chưa triển khai.** Không cần tự train chỉ để chứng minh “có AI”; cần loại kết quả giả, hoàn thiện nghiệp vụ và có đánh giá độc lập. Yêu cầu chính thức ở [01](01-thesis-requirement-mapping.md), thiếu bằng chứng ở [07](07-academic-evidence-gap.md).

| Ưu tiên / việc | Vấn đề và source | Kết quả có thể nghiệm thu | Phụ thuộc / rủi ro |
|---|---|---|---|
| P0 — Trung thực Before/After | `main.py:804`, `aiFallbackHelper.js:10`, `orders.service.js:531`, `AcceptanceScreen.jsx:43–83` | Decode/model/network lỗi → unavailable/inconclusive, score null; không ảnh demo/94%; engine/provenance xuyên suốt; khách vẫn có thao tác đánh giá phù hợp | Thống nhất response/status giữa FastAPI/Nest/Customer, xử lý dữ liệu score lịch sử không đáng tin |
| P0 — Nối AFTER trên Worker | `job/[id].jsx:204`, `OrdersService.uploadImage:483` | Camera sau sau bắt đầu, upload bytes, ACK/persist/refetch, retry đúng scope; finish chỉ có ảnh thật; không thay bằng URL bất kỳ | Storage/auth/validation và quyền truy cập, không tái dùng ảnh BEFORE/ISSUE |
| P0 — Chốt phạm vi/mốc Face theo đề tài | `workflow:186,203`; T §1/§3 | Người hướng dẫn xác nhận mốc trước accept hay trước start; giải thích self-enrollment/account identity; cập nhật tài liệu đúng source | Không mặc định phải quay về Daily 24h hoặc bắt CCCD; không nới PAD để demo |
| P0 — Tách benchmark fixture khỏi kết quả nghiên cứu | `benchmark_recommendation.py:42`, dataset/training artifacts | Báo cáo cũ gắn nhãn fixture/synthetic/leakage; benchmark thật gọi pipeline, giữ raw prediction và thời gian đo | Không xóa chứng cứ cũ; không trích latency fixture như inference |
| P1 — Dataset sự cố độc lập | `prepare_dataset.py:70`, hash overlap [07] | Ảnh có nguồn/quyền/nhãn category/target/visible fault/service, normal/OOD; chia theo thiết bị/công việc; exact + near-duplicate audit | Công thu/nhãn và kiểm chéo; bảo vệ dữ liệu trong nhà |
| P1 — Đánh giá baseline và API VLM | `v2.router`, `clip_classifier`, `diagnosis-resolver` | Cùng frozen test set, image-only/text-only/combined; category F1, target/service Top-k, abstention, p95, cost, schema validity | Chọn provider/version còn hỗ trợ; không khóa mới Gemini 2.5 Flash deprecated |
| P1 — Face identity + PAD evaluation | `face_core.py:19`, `face_pad.py:49`, `pad_policy.py:33` | Genuine/impostor, no/multiple faces, print/screen/replay, threshold calibration/test độc lập; FMR/FNMR/APCER/BPCER + CI | Consent/quyền dữ liệu, nhiều người/camera/session; không xem score .85 là chuẩn đã hiệu chỉnh |
| P1 — E2E và nguồn dữ liệu authoritative | `FaceCoreService`, `OrderBeforeMediaService`, FSM, Customer acceptance | Session/template/proof thật, expiry/revoke/wrong owner, transaction rollback; camera→storage→model→DB→booking, AFTER→customer; kèm logs/video | DB test riêng/được phép, credentials test, thiết bị; task audit này không dựng DB |
| P1 — Chuẩn đầu ra giao dịch | `order-workflow.service.js` settlement guard, `orders.service.js` | Thanh toán sandbox/provider có chứng từ, commission snapshot, một ledger/payout đúng khi retry | Task riêng payment/ledger; có guard không thay việc writer/provider hoạt động |
| P2 — Reproducibility và deployment | `requirements.txt`, `Dockerfile`, model/cache, main/face_app | Pin dependencies/models/prompt/catalog, health từng capability, cold/warm test, cấu hình production và privacy | Thay dependency/model phải task riêng có regression |
| P2 — Fine-tune có điều kiện | `training/train.py` | Chỉ train khi baseline thiếu rõ rệt và có data đủ; ghi ablation và holdout sạch | Không tái dùng test làm training hoặc tuning; tăng công không bảo đảm tăng chất lượng |

## Phương án tiết kiệm nhất trong phạm vi đề tài

Giữ FastAPI/Nest, active catalog, symptom rules/manual selection và giá server. Giữ CLIP/YOLO classifier như baseline hỗ trợ chọn nhóm/thiết bị; không diễn đạt thành chẩn đoán nguyên nhân toàn diện. Dùng CV làm tín hiệu đối chiếu ảnh, nói rõ giới hạn và quyền khách; không dùng độ khác ảnh làm chứng nhận an toàn. Giữ YuNet/SFace và session/proof security, công khai PAD experimental và chưa calibration.

Đầu tư trước vào dataset nhỏ nhưng có nguồn và nhãn đáng tin, test negatives, luồng AFTER và demo thật. Có thể làm pilot để ước lượng lỗi/chi phí rồi mới xác định cỡ mẫu nghiên cứu. Không gọi pilot vài ảnh là đủ chứng minh quality toàn hệ thống.

Nếu VLM API cải thiện rõ so với baseline trên dữ liệu khóa, tích hợp adapter cho AI-01 với output có cấu trúc: category candidates, target candidates, visible signs, cần hỏi thêm. Resolver vẫn quyết dịch vụ/giá; không tin serviceId/price do model tự tạo. Không dùng VLM tổng quát quyết identity hoặc cấp Face proof.

Qwen8B tự host chưa tối ưu cho laptop hiện tại; chỉ cân nhắc khi có GPU và yêu cầu kiểm soát dữ liệu đủ rõ để bù công triển khai. Không đề xuất đổi mọi model một lượt.

## Điều kiện đóng task cải thiện và chuẩn bị bảo vệ

1. Không còn successful AI outcome khi thiếu ảnh/model/bằng chứng trong negative matrix; UI hiển thị đúng uncertain/offline.
2. Worker chụp được BEFORE/AFTER, backend xác nhận ảnh đúng đơn/giai đoạn; khách xem ảnh thật và quyết định nghiệm thu.
3. Face genuine/impostor/PAD có thử thực và báo cáo giới hạn; mốc gate khớp cách hiểu đề tài đã thống nhất; không cấp timestamp/proof ngoài pipeline được kiểm.
4. Dataset/test độc lập, raw predictions, model hash, prompt/catalog version, metric và lệnh tái lập; không dùng số training/fixture thay số test.
5. Toàn quy trình theo T §5 có demo và evidence: đặt–định vị–nhận–face–ảnh–nghiệm thu–thanh toán–hoa hồng–ví. Audit AI không thay kiểm thử phần còn lại.

Nguồn chi tiết: [03](03-ai-diagnosis-audit.md) D01–D12, [04](04-before-after-audit.md) B01–B12, [05](05-face-verification-audit.md) F01–F12; phương án model và nguồn nhà cung cấp ở [06](06-model-options-comparison.md).

## Cách mô tả đóng góp khi bảo vệ

Trình bày “thiết kế và tích hợp hệ thống On-Demand có AI hỗ trợ phân tích ảnh, catalog/rules và xác thực 1:1 có kiểm soát”, kèm kết quả thực nghiệm riêng. Tách rõ mô hình pretrained của bên thứ ba khỏi phần tự xây: orchestration, provenance, resolver, business state, scoped media, encrypted/versioned template, authorization proof, error handling và evaluation. Nếu fine-tune YOLO, ghi đúng dữ liệu và hạn chế; không nhận là tự xây kiến trúc YOLO hoặc dữ liệu thực địa chưa chứng minh.
