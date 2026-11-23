# 03 — AI-01: phân tích sự cố và gợi ý dịch vụ

**PARTIAL.** Có xử lý pixel/model thật, có resolver/catalog/giá server. Chưa chứng minh phát hiện lỗi thực tế hoặc đầy đủ camera–storage–database–booking trên môi trường triển khai.

## Truy vết và phát hiện

| ID | Kiểm tra / kết luận | Bằng chứng source cụ thể | Runtime / giới hạn |
|---|---|---|---|
| D01 | Customer có gửi bytes ảnh local; ảnh HTTP gửi URL để AI tải pixel | [diagnoseIssueImage:70–98](../../customer-app/src/services/api/aiService.ts#L70), [DiagnosisImageStorage._handleFile:64](../../server/src/modules/orders/diagnosis/diagnosis-upload.interceptor.js#L64), [OrdersController.diagnoseUpload:89](../../server/src/modules/orders/orders.controller.js#L89) | Upload Cloudinary thật và thiết bị NOT_VERIFIED |
| D02 | Nest gọi v2 trước, legacy sau, cuối cùng unavailable/null confidence | [FastApiAiClient.diagnoseIncident:30](../../server/src/infrastructure/external/ai/fastapi-ai.client.js#L30) | Không có filename/URL heuristic success trong Node diagnosis fallback |
| D03 | v2 decode pixel, CLIP wrapper và YOLO classifier predict thật | [diagnose_v2:48–80](../../ai-service/recommendation/router.py#L48), [predict_clip_full:251](../../ai-service/clip_classifier.py#L251) | `eval.test_live_inference`: 4/4 đạt, model thật, static catalog fallback do backend không kết nối |
| D04 | YOLO đang phân loại toàn ảnh theo 6 lớp, chưa chứng minh detector khoanh lỗi | [main.lifespan:210](../../ai-service/main.py#L210), [v2:66](../../ai-service/recommendation/router.py#L66) | YOLO predict local top1 `dien_lanh`, score .63175 trên một fixture; không phải accuracy |
| D05 | CLIP encode ảnh, cosine/logit-scale/softmax với prompt; target similarity đổi sang confidence | [CLIP._encode_image:132](../../ai-service/clip_classifier.py#L132), [predict_clip_full:262](../../ai-service/clip_classifier.py#L262), [match_targets:47](../../ai-service/recommendation/target_matcher.py#L47) | `(sim+1)/2` là score biến đổi, không phải xác suất đúng đã calibration |
| D06 | Text có ảnh hưởng có chủ đích, không phải visual-only | [fuse_category_scores](../../ai-service/recommendation/category_classifier.py#L17): category keyword ×1.8 rồi normalize | Cần ablation ảnh-only/text-only/combined; không quy mọi cải thiện cho ảnh |
| D07 | Không model/ảnh lỗi có abstention; không sinh confidence thành công từ tên file | [v2:51](../../ai-service/recommendation/router.py#L51), [evaluate_categories](../../ai-service/recommendation/category_classifier.py#L51), [resolveCategory:33](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L33) | Test unreadable và fixture OOD đạt; chưa stress ảnh thực OOD |
| D08 | Category/target AI phải map vào active DB; service theo category/target đã xác nhận | [resolveDiagnosis:108–151](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L108) | Đúng guard theo source. Không truy vấn DB live nên không xác nhận tồn tại toàn bộ slug AI |
| D09 | Service selection là manual/rules/symptom catalog; không phải model tự chẩn đoán nguyên nhân | [resolveService:69](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L69), [recommendServices call:225](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L225), [rankServices:18](../../server/src/modules/orders/diagnosis/service-ranker.js#L18) | rankingScore 50/100 và keyword hit là heuristic minh bạch; `confidence:null`, không là precision model |
| D10 | Có needs_more_info/manual_selection/unavailable và chọn thủ công | [STATUS](../../server/src/modules/orders/diagnosis/diagnosis-constants.js#L1), [payload builder](../../server/src/modules/orders/diagnosis/diagnosis-payload-builder.js), [DiagnosisChoices:43](../../customer-app/src/components/diagnosis/DiagnosisChoices.jsx#L43) | Consumer nối API; chưa thao tác trên mobile |
| D11 | Giá output resolver từ Service basePrice/maxPrice; booking kiểm lại active service/category và giá server | [formatPriceRange:1](../../server/src/modules/orders/diagnosis/service-ranker.js#L1), [resolver:258](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L258), [createOrder:119–138](../../server/src/modules/orders/orders.service.js#L119), [useBooking:194](../../customer-app/src/features/booking/hooks/useBooking.js#L194) | Không cần AI sinh giá. Không xác nhận giá thị trường hoặc báo giá sửa thực tế |
| D12 | Dataset/train artifacts có nhưng benchmark học thuật chưa hợp lệ | [prepare_dataset.generate_class_images:70](../../ai-service/training/prepare_dataset.py#L70), [benchmark.run_benchmark:42](../../ai-service/eval/benchmark_recommendation.py#L42) | Split overlap được hash lại; xem [07](07-academic-evidence-gap.md) |

## Legacy endpoint vẫn có nhánh cần công khai

[main.diagnose:387](../../ai-service/main.py#L387) có pixel inference thật; docstring nói fallback heuristic theo text không còn mô tả chính xác mọi nhánh. Tuy nhiên:

- `description` JSON chỉ đọc `imageUrl` ở dòng 402–403; khác v2 đọc cả description. Node retry sang legacy có thể mất mô tả JSON.
- Dòng 493–498 cộng `.35` theo keyword; dòng 524–532 ghi target confidence `.95` từ mô tả. Đây không phải xác suất visual model.
- Dòng 534–550 chọn dịch vụ đầu catalog nếu chưa có sub-service; confidence `score*.92`, giá static catalog. Không gọi đây là phát hiện lỗi thực tế.
- Nest resolver hiện không tin giá/service tự sinh đó để tạo đơn: vẫn yêu cầu chọn dịch vụ/rules và tra catalog server. Vì vậy rủi ro legacy response trực tiếp khác với luồng booking chính; không quy nhầm mọi fallback này thành dịch vụ giả đã được booking.

## Ba nhiệm vụ không tương đương

| Nhiệm vụ | Thực trạng |
|---|---|
| Nhận diện thiết bị / nhóm dịch vụ | Có CLIP target và YOLO category; smoke chạy được, cần test thực địa |
| Phát hiện bất thường nhìn thấy | Chưa thấy model/ground truth chuyên biệt chứng minh phát hiện vết rò/cháy/nứt; label nhóm không đủ |
| Chẩn đoán nguyên nhân hư hỏng | Không được chứng minh. Resolver ghi rõ “Ảnh chưa xác định được nguyên nhân hỏng” (dòng 206); phải hỏi triệu chứng/kiểm tra của thợ |

`observableSigns` v2 chỉ ghép “Nhận diện danh mục/đối tượng”, không phải detector đo dấu hiệu hỏng. YOLOv8n COCO có file/load không chứng minh đang phát hiện lỗi điện/nước. Tham số `yolo_model` của compare cũng không tạo fault detector.

## Kết quả kiểm chứng hẹp

Test thật `sample_appliance + 'bếp từ không nóng'` trả category `thiet-bi`, confidence `.5271`, target đầu `lo-vi-song`. Test chấp nhận một trong ba category; không yêu cầu đúng thiết bị mục tiêu. Backend default confidence `.6` sẽ không nhận `.5271` nếu dùng cấu hình mặc định. Đây là bằng chứng smoke 4/4 không tương đương PASS độ chính xác hoặc PASS Nest E2E; không phải bug fail-open vì backend yêu cầu thêm thông tin.

Ảnh fixture appliance/garden/face không có bộ nhãn chuyên gia đủ để đo quality; face OOD abstention chỉ là một case. Việc model load thành công khi service deployment khởi động vẫn NOT_VERIFIED: audit load trực tiếp và TestClient có model, không boot toàn main/server/DB.

## Khắc phục đề xuất

Giữ resolver và giá authoritative; pin weights/revision/prompt/catalog; xuất provenance của visual/text/rules; bỏ confidence heuristic mang nghĩa xác suất; kiểm service/target active trên DB test. Thu test set ảnh thật, có ảnh bình thường và OOD, nhãn category/target/dấu hiệu/service riêng. Đo category macro-F1, target/service Top-k, coverage/abstention, false recommendation, latency; chỉ fine-tune nếu dữ liệu cho thấy domain gap. Chưa thực hiện thay đổi nào trong task.
