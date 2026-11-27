# Tiêu chí nghiệm thu dữ liệu và đánh giá AI

Đây là tiêu chí kế hoạch. Ngưỡng mã hiện hành giữ nguyên; các mục tiêu chất lượng bổ sung bên dưới là **đề xuất cần người phụ trách duyệt**, chưa phải số liệu đạt được hoặc quyền đổi runtime gate.

## Gate ảnh tạo — áp dụng cho từng output

- Đúng target vật lý và cảnh; không nhầm ổ cắm thường/thông minh/adapter, không dùng cả căn phòng làm bbox hệ thống. Target có scope hold chưa được chạy.
- Không collage, vật thể nhân bản vô lý, lỗ cắm/chân cắm/cánh quạt/đường ống méo, vật liệu xuyên nhau, dây treo phi vật lý hoặc bộ phận không tồn tại. Loại ảnh sai hình học/vật lý; không cố vẽ bbox cho đủ quota.
- Dấu hiệu phải nhìn thấy và phân biệt được với màu vật liệu, bóng, đường ghép, bụi/phản sáng. Không nhìn rõ thì loại positive hoặc chuyển hàng chờ review, không gán dựa trên prompt.
- Ảnh bình thường chỉ là không thấy dấu hiệu trong phạm vi đã kiểm, không chứng nhận hoạt động tốt. Ảnh operational_lookalike kiểm việc hỏi thêm, không mang nhãn lỗi vận hành.
- OOS phải không có target thật ngoài ý muốn; không ép target_id. Ảnh có nhiều loại dấu hiệu ngoài khả năng v1 được giữ riêng chờ xử lý, không xóa nhãn hoặc coi âm.
- Không yêu cầu con người chạm điện/mở thiết bị sống, làm rò gas/lửa để minh họa. Không dùng chữ AI bịa làm mã lỗi/OCR GT.
- Provenance actual prompt/tool/date/source/rights đầy đủ và có căn cứ. Không nhận placeholder, công cụ/ngày đoán hoặc prompt tái dựng gọi là gốc.

## Gate bbox

Người gán nhãn đo trên ảnh cuối đã chuẩn hóa, không lấy tọa độ từ mô tả/prompt. Object bbox bao phần vật thể thật nhìn thấy; sign bbox chỉ vùng quan sát, cùng target. YOLO chuẩn hóa finite, trong ảnh, width/height ≥2 px, ≤100 bbox/ảnh, không trùng class/vị trí; ảnh có EXIF xoay phải chuẩn hóa ảnh/box đồng bộ.

Có hình học đo được: `bbox_status=proposed`, `review_status=unreviewed`; không có: `not_annotated` và không TXT. Tất cả nhãn nguồn vẫn là ứng viên cho tới reviewer FixGo xác nhận. Không tự bật objectExtentReviewed/rightsVerified/approvedGroundTruth. Mục tiêu review đề xuất: 100% output qua người xem; 20% chọn ngẫu nhiên cho người kiểm thứ hai nếu có người độc lập thực tế; mọi bất đồng nguy hiểm và box khó được adjudicate hoặc loại. Nếu chỉ một người, ghi rõ SOLO, không báo independentlyReviewed.

## Import-ready

Chỉ đạt sau khi ZIP đúng v1 và header 18 cột, ID/slug/ontology hiện hành, SHA byte ảnh cuối khớp, ảnh/box hợp lệ, đủ khai báo nguồn/quyền/cảnh thật; validator exit 0 được lưu bằng chứng và backend preview không lỗi cho ảnh định nhập. Kiểm trùng trong lô/toàn kho/tập bảo vệ; ảnh duplicate không tăng quota. Kiểm near-duplicate và source groups không chỉ filename.

Tối đa min(20 ảnh kế hoạch, giới hạn server thực tế), đồng thời thỏa byte upload/expanded/ratio/entry và disk reserve. File nguồn metadata duy nhất CSV, YAML chỉ cấu trúc/classes; không đưa service code/gap code vào names. No-bbox vẫn import-ready nếu thông tin khác hợp lệ, nhưng chưa training-eligible. Offline thiếu inventory/reference thì giữ pending backend check, không coi là đã kiểm toàn kho.

## Training-eligible theo gate hiện hành

- Review quyền/nguồn/nhóm bằng bằng chứng thật; xác nhận nhãn, bbox và phạm vi vật thể/dấu hiệu đầy đủ; giải quyết near-duplicate.
- Export có audit/hash đúng owner và revision mới nhất; ảnh mới không tự thành ảnh âm; object review complete/none_visible và sign review positive/none_visible theo nội dung người đã xem.
- Synthetic ở development train; validation độc lập có quyền và đã review, không cùng nguồn/cảnh/crop/reference. Tập test thật độc lập không synthetic, không tái sử dụng ảnh development/model-exposed làm blind test.
- Min hiện hành mỗi lớp ≥20 train/≥5 val, ≥2 nhóm train/≥1 val; ≥5 ảnh âm train/≥2 val. Không thay ngưỡng khi thiếu dữ liệu. Vẫn kiểm các blocker khác của export/training, không chỉ đếm ảnh.
- Quota 48 ảnh synthetic không chứng minh đủ group/val; số ảnh chưa được tạo có thể bị loại. Trial pipeline hiện một target mặc định ổ cắm và nhóm signs được chọn; model runtime class manifest 2–100 class. Không biến toàn manifest thành lệnh train chung.

## Thiết kế tập đánh giá

Lập tập development synthetic riêng để tìm lỗi nhanh; validation development theo group riêng; test ảnh thật độc lập có quyền, provenance và nhãn được người kiểm độc lập thực sự. Niêm phong test trước khi tuning, lưu hash/split/source group, chỉ dùng một lần cho đánh giá phiên bản chốt; nếu đã xem để chỉnh model thì không gọi là blind nữa. Chưa thu thập tập thật trong task này.

Cỡ đánh giá đề xuất (chưa có dữ liệu): tối thiểu 50 ảnh thật dương mỗi target được pilot, 50 ảnh thật mỗi sign-target cần đánh giá (có thể giao ảnh với object set), 50 normal/dễ nhầm mỗi target và 100 OOS thật mỗi đợt pilot. Nêu rõ mẫu chồng nhau, số scene độc lập và khoảng tin cậy; không nhân tổng ảnh theo các bảng đo. Không tuyên bố bao phủ 693 dịch vụ bằng 693 ảnh hoặc một ảnh/nhãn.

| Tầng | Đo lường | Mục tiêu pilot đề xuất, chưa đo |
|---|---|---|
| Object | mAP50 và mAP50:95, precision/recall theo target, confusion cùng subtype, IoU và object extent | Precision ≥0,90 và recall ≥0,85 mỗi target đủ mẫu; báo mAP, không dùng một điểm trung bình để che lớp yếu |
| Sign | precision/recall theo sign-target, mAP/IoU, nhầm bụi/cháy, mối ghép/nứt, nước/phản sáng | Precision ≥0,90 và recall ≥0,80 mỗi cặp đủ mẫu; ca xém điện báo riêng false negatives và không tự kết luận an toàn khi không phát hiện |
| Gắn sign-object | Tỷ lệ gán đúng object, ambiguity/containment và abstention | 0 ca gán bằng chứng sang object khác trong tập kiểm quy tắc; báo lỗi thực nghiệm riêng |
| Gợi ý dịch vụ | precision@3, recall@3 trên bộ dịch vụ phù hợp được chuyên gia chốt; harmful-suggestion rate; câu hỏi còn thiếu | precision@3 ≥0,90 trên ca đủ triệu chứng/catalog; 0 gợi ý nguy hiểm được chấp nhận trong bộ kiểm; báo CI và ca fail |
| Không đủ bằng chứng/OOS | tỷ lệ abstain/hỏi thêm, false positive service suggestions | ≥0,95 ca thiếu bằng chứng chuyển hỏi/abstain; không gợi ý chỉ từ tên thiết bị hoặc metadata client |
| Catalog/gates | sai target/category, service inactive, symptom/link chưa duyệt, model manifest/hash thiếu | 100% ca kiểm quy tắc phải chặn; hiện chưa có approved symptom/link nên chưa được tuyên bố service accuracy |

Tách kiểm thử tất định resolver/gate khỏi đánh giá model. Sinh test cases theo từng service ID (693 ca tối thiểu cho coverage catalog), cộng ca đối kháng: cùng object nhiều bbox, sign ngoài object, độ tin cậy thấp, spoof answers, service không thuộc target, danh mục tắt, code mới chưa duyệt, quyền/split thiếu. Những ca này là thiết kế test, chưa được chạy hoặc tạo dữ kiện GT tự động từ CSV đề xuất.

Chỉ đánh giá recommendation khi chuyên gia đã xác nhận câu trả lời, triệu chứng/link được duyệt và tập đáp án có thể nhiều dịch vụ đúng; không dùng mapping đề xuất này làm cả nhãn chuẩn lẫn predictor. Luôn báo nhóm chưa đủ mẫu/không đánh giá, chưa đạt không deploy.
