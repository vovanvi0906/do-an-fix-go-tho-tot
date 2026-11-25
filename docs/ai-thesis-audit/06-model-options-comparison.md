# 06 — So sánh YOLO/CLIP/OpenCV, Gemini và Qwen

Ngày tra nguồn: **19/11/2026**. Đây là đánh giá phương án, không thay model hoặc gọi API tính phí. Chưa có benchmark A/B/C trên cùng ảnh FixGo; mọi kết luận về ưu thế chất lượng miền sửa chữa là **NOT_VERIFIED**.

T §4 cho phép xử lý ảnh hoặc tích hợp API; không quy định tự train. Pretrained inference, prompt, retrieval và policy là các phần kỹ thuật hợp lệ nếu được kiểm chứng và ghi nguồn. Việc hội đồng chấp nhận còn phụ thuộc quy định/tiêu chí của trường, chưa có văn bản bổ sung.

## Bảng phương án

| Tiêu chí | A — YOLO + CLIP + OpenCV | B — Gemini 2.5 Flash API | C — Qwen3-VL-8B-Instruct |
|---|---|---|---|
| Vai trò hợp lý | Nhóm/thiết bị qua classifier/embedding; so ảnh bằng CV | Ứng viên phân tích dấu hiệu nhìn thấy và hỏi thêm thông tin | Ứng viên VLM phân tích ảnh, triển khai tự quản |
| AI-01 | Có sẵn baseline; thiếu chất lượng fault detection thực địa | Có thể mở rộng ngữ nghĩa; phải kiểm nhãn/JSON/catalog | Tương tự, chưa benchmark miền FixGo |
| AI-02 | Giữ ORB/SSIM như tín hiệu đối chiếu, không là chứng nhận sửa tốt | Có thể hỗ trợ giải thích cặp ảnh, vẫn phải đo agreement người | Có thể xử lý nhiều ảnh qua prompt; chưa tích hợp ở repo |
| AI-03 | Giữ YuNet/SFace/PAD riêng, không dùng CLIP cho identity | Không thay matcher/PAD bằng trả lời VLM | Không thay matcher/PAD bằng trả lời VLM |
| Cần train? | CLIP zero-shot không; YOLO repo đã có fine-tune. Train mới chỉ khi test cho thấy cần | Không cần train để dùng API | Không cần fine-tune để inference pretrained |
| Hạ tầng hiện tại | CPU primitives đã chạy; chưa đo tải đồng thời | Backend HTTP, không cần GPU local, cần mạng/key/quota/billing | Chưa có weights/runtime của Qwen; laptop hiện tại 14 GiB RAM Intel iGPU không phù hợp làm cấu hình BF16 tiêu chuẩn |
| Chi phí | Không phí API/token; có CPU/RAM/storage và công vận hành | Theo token, retry/thinking và nhà cung cấp; lifecycle model ảnh hưởng tái lập | Không phí token khi tự host, có GPU/RAM/storage/điện/công vận hành hoặc thuê máy |
| Tiếng Việt | UI/rules tiếng Việt; CLIP prompt tiếng Anh, không coi CLIP là model tiếng Việt đã đánh giá | Gemini có khả năng trả lời tiếng Việt; lỗi/thuật ngữ sửa chữa phải test riêng | Khả năng tiếng Việt cho task này chưa kiểm; năng lực đa ngôn ngữ tổng quát không thay benchmark |
| FastAPI | Đã có code, giữ contract/resolver | Adapter HTTP + schema validation + timeout/quota/provenance | Adapter Transformers hoặc dịch vụ inference riêng; phải xác minh version/memory |
| Đánh giá độc lập | Offline weights/prompt cố định; metric thực địa còn thiếu | Freeze test set, lưu model ID/date/prompt/raw output, token/latency; provider có thể đổi | Pin weights/revision/quantization/config, dataset độc lập; nhiều công chuẩn bị hơn |
| Dữ liệu | Có thể giữ inference local; upload Cloudinary vẫn là dịch vụ ngoài | Ảnh gửi bên ngoài, cần phân loại dữ liệu và điều khoản phù hợp | Tự host kiểm soát dữ liệu tốt hơn; provider Qwen bên ngoài thì vẫn có rủi ro API |
| Giấy phép/điều khoản | YOLO AGPL/Enterprise, CLIP MIT code + model card, OpenCV/model license riêng | Terms API, hạn mức, policy và data use theo loại dịch vụ | Model card `Qwen3-VL-8B-Instruct` ghi Apache-2.0; dữ liệu/quantized artifact cần kiểm quyền riêng |
| Rủi ro chính | Domain gap, synthetic leakage, heuristic score, overclaim | Hallucination, phụ thuộc mạng/vendor, model lifecycle, privacy/cost | RAM/VRAM/latency, dependency compatibility, model vẫn có hallucination |

Nguồn kỹ thuật: [CLIP model card](https://huggingface.co/openai/clip-vit-base-patch32) mô tả zero-shot và giới hạn tiếng Anh; [Qwen model card](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct) công bố image-text inference, license và hướng tích hợp Transformers/vLLM; [Qwen upstream](https://github.com/QwenLM/Qwen3-VL) mô tả năng lực đa ngôn ngữ/OCR. Khả năng OCR đa ngôn ngữ không tự chứng minh phân tích lỗi sửa chữa tiếng Việt. [Google model languages](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/google-models) có Vietnamese; cần test đúng model/version và môi trường API của đề xuất.

## Thông tin Gemini phải cập nhật tại thời điểm audit

Tài liệu nhà cung cấp thông báo `gemini-2.5-flash` đã deprecated; API giới hạn người dùng hiện hữu tới 01/12/2026 và từ mốc đó route sang model khác. Vì vậy không khuyến nghị bắt đầu triển khai mới khóa cứng tên 2.5 Flash. [Model lifecycle](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash).

Bảng giá công bố cho 2.5 Flash trước chuyển đổi là input text/image/video **$0.30/triệu token**, output gồm thinking **$2.50/triệu token**. [Pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash). Ví dụ kế hoạch **giả định** 1.000 input token và 500 output token/lượt: $0.00155/lượt, $1.55/1.000 lượt; chưa gồm thinking thêm, retry, công cụ, lưu trữ hay thuế, không phải chi phí đã đo. Không giả định giá này tiếp tục sau route đổi model.

Free/unpaid có thể dùng input/output để cải thiện sản phẩm; paid có cơ chế dữ liệu khác. Cần đọc điều khoản áp dụng tài khoản/khu vực và tránh gửi dữ liệu cá nhân/nhạy cảm vào unpaid. [Gemini API terms](https://ai.google.dev/gemini-api/terms). Không gửi ảnh mặt/giấy tờ sang VLM chỉ để phân tích sự cố.

## Qwen và tài nguyên: ước lượng, không phải benchmark

8 tỷ tham số ×2 byte cho BF16 xấp xỉ 16 GB **chỉ weights theo phép tính lý thuyết**, chưa KV cache/vision encoder/runtime/context/batch. Do đó máy ~14 GiB RAM đang chạy nhiều dịch vụ không đủ cho cách load BF16 thông thường. Quantization 4-bit giảm phần weight lý thuyết còn ~4 GB nhưng không làm tổng memory bằng 4 GB; bản quantized, offload, tốc độ CPU/iGPU đều chưa thử. GPU 24 GB là một cấu hình thử nghiệm thực dụng để khảo sát ảnh/context ngắn, **không phải bảo đảm chạy mọi context**; cần đo memory thực trước chọn hạ tầng. Không đưa giá thuê GPU chưa tra báo giá thành chi phí cố định.

## Quyết định khuyến nghị

1. **Giữ A làm baseline tái lập**, nhưng sửa lỗi fail-open Before/After, dữ liệu và luồng app trước. Thêm model không sửa được thiếu ảnh/giả score/AFTER chưa có.
2. Nếu cần hiểu dấu hiệu hình ảnh rộng hơn, so A với **một API VLM đang được hỗ trợ** trên cùng test set đã ẩn dữ liệu riêng; B như tên model cụ thể đang có rủi ro vòng đời. Giữ interface provider để thay phiên bản có kiểm soát; lưu model ID thực của từng lần thử.
3. Chọn C khi có nhu cầu tự host rõ, GPU/tài nguyên sẵn và thời gian vận hành. Chưa có lý do chi phí/thời gian để ưu tiên C trên laptop hiện tại.
4. Không chọn thắng chỉ bằng vài ảnh demo hoặc độ tự tin tự khai báo. Dùng cùng taxonomy/ground truth, abstention, schema compliance, service Top-k sau resolver, p95 latency và chi phí thực. Chỉ nâng cấp khi cải thiện có bằng chứng.

Các phương án đều phải trả candidate/dấu hiệu và quyền từ chối; chỉ backend map active catalog và tính giá. Không cho VLM tự tạo service ID, giá, quality pass hay Face authorization.
