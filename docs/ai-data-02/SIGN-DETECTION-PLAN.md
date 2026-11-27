# Kế hoạch thử nghiệm phát hiện dấu hiệu — 25/11/2026

Trạng thái: đã có adapter trial và công cụ đóng băng test ứng viên; xem [TRIAL-WORKFLOW.md](TRIAL-WORKFLOW.md). Dữ liệu thực vẫn cần review; chưa có detector dấu hiệu được huấn luyện hoặc đánh giá độc lập. Giữ pipeline nhận diện hiện tại. Các checkpoint object/classification hiện có không trở thành detector lỗi khi đổi prompt hoặc threshold.

## 1. Phạm vi vòng đầu

Chọn 4 dấu hiệu đã có trong ontology, ưu tiên thiết bị điện và nước. Bảng này là hướng dẫn gán nhãn thử nghiệm, chưa phê duyệt quan hệ target–defect hoặc dịch vụ. Target cụ thể phải lấy từ catalog đã pin và được người duyệt xác nhận phù hợp.

| Mã hiện có | Bằng chứng dương cần nhìn thấy | Ví dụ dễ nhầm cần đưa vào dữ liệu | Câu hỏi bổ sung khi gợi ý dịch vụ |
|---|---|---|---|
| `burn_mark` | Vùng cháy/xém trên thiết bị, khoanh đúng phần nhìn thấy | Bụi đen, bóng, màu nhựa, vết bẩn | Vết xuất hiện khi nào? Có mùi khét hoặc thiết bị ngừng hoạt động không? |
| `crack` | Đường nứt vật liệu nhìn thấy rõ | Khe ghép, rãnh thiết kế, dây nằm trên bề mặt | Vết này có mới xuất hiện? Thiết bị còn hoạt động không? |
| `broken_part` | Chi tiết gãy/vỡ nhìn thấy, gắn với một object | Chi tiết tháo rời đúng thiết kế, ảnh lắp ráp | Chi tiết bị gãy có ảnh hưởng sử dụng không? |
| `wet_surface` | Vùng ẩm/nước nhìn thấy trên bề mặt | Bóng phản chiếu, vết ố khô, bề mặt bóng | Nước có xuất hiện lại sau khi lau? Có xác định được nguồn không? |

Ảnh không đủ chi tiết: lưu `UNKNOWN` hoặc `NEEDS_REVIEW`, không gán thành ảnh âm. `wet_surface` không đồng nghĩa rò nước; `burn_mark` không chứng minh nguyên nhân chập điện. Chưa đưa nước đang chảy vào lớp lỗi rò.

## 2. Tạo dữ liệu bằng Studio

Khởi động theo README. Duyệt từng ảnh, bbox object và bbox dấu hiệu có `objectId` rõ ràng; kiểm toàn bộ dấu hiệu trong phạm vi trên ảnh. Lưu tiến độ bằng NEEDS_REVIEW. Chỉ xác nhận HUMAN_VERIFIED sau khi người duyệt thực sự xem ảnh. Ghi nguồn, quyền và bằng chứng thật trước export.

Phân loại mẫu cần bổ sung cho từng dấu hiệu: dương rõ, bình thường cùng loại thiết bị, ví dụ dễ nhầm trong bảng, góc chụp/ánh sáng khác nhau. Ảnh mờ hoặc che khuất được giữ trong hàng đợi chất lượng, không coi thiếu bbox là bình thường. Ảnh chỉ được coi âm cho phạm vi 4 dấu hiệu khi đã kiểm đầy đủ cả 4; NORMAL là đánh giá quan sát, không xác nhận thiết bị hoạt động tốt.

Mốc lập kế hoạch ban đầu cho mỗi dấu hiệu: 200 ảnh dương train, 50 validation, 50 test mới; bổ sung ảnh âm/dễ nhầm ở cả ba tập. Đây là mục tiêu thu thập sơ bộ, không bảo đảm chất lượng hoặc điều kiện thống kê. Một ảnh có thể chứa nhiều dấu hiệu; phải báo riêng số ảnh, số box và số nhóm độc lập. Nếu thiếu dữ liệu thì thu hẹp số lớp, không nhân bản ảnh để đạt quota.

## 3. Chia tập và đóng băng

- Pilot 50 và dữ liệu đã dùng phát triển thuộc development; không dùng làm test độc lập.
- Gom cùng thiết bị, cảnh, lần chụp/video, nguồn và mọi liên kết trùng/gần trùng vào cùng nhóm trước khi chia. Người duyệt phải xác minh nhóm thực; hash chỉ hỗ trợ.
- Thu nhận test mới có quyền, chưa dùng phát triển hoặc xem để chỉnh model. Đóng băng danh sách ID/SHA, group, nhãn, ontology và phạm vi nhiệm vụ trước thí nghiệm. Reviewer test không được xem proposal của model đang đánh giá.
- Chỉ dùng validation để chọn model, threshold và cấu hình. Test được mở sau khi chốt; nếu sửa theo lỗi test thì tập đó thành development và cần test mới cho lần kết luận tiếp theo.

**Giới hạn công cụ hiện tại:** exporter Studio chỉ tạo train/val development và đánh dấu `independentTest=false`. Không đổi tên thư mục val thành test. Đã có workflow CLI riêng để tiếp nhận hồ sơ người duyệt và đóng băng ảnh test mới; Studio vẫn chỉ xuất development. Workflow chưa tự cấp phê duyệt tính độc lập hoặc kiểm soát lần mở test.

## 4. Huấn luyện và so sánh

Chạy baseline YOLOv8n detection, sau đó YOLO11n detection với cùng ảnh, class map, split, độ phân giải, ngân sách epochs và seed. Chỉ thử bản s nếu bản n thiếu chất lượng và còn ngân sách máy. Dùng checkpoint detection được cấp phép phù hợp; không dùng checkpoint classification làm detector. Train trong thư mục trial riêng, không ghi đè weights hoặc manifest production.

**Tương thích công cụ:** `ai-service/training/visual_service_training.py` nhận export bbox-quality-v1 có journal riêng; không nhận trực tiếp `fixgo.studio.development.v1`. Adapter `scripts/ai-data-02/trial.py prepare` đã kiểm schema, checksum nguồn, audit revision, quyền, bbox/objectId, coverage, nhóm và class map; tạo bundle YOLO trial riêng, giữ nguyên gate và đầu vào của CLI train cũ. Export hiện tại gồm 70 object + 10 sign; adapter đã remap nhãn nhất quán cho dấu hiệu đã chọn và giữ toàn bộ object catalog, không chỉ sửa `data.yaml`. Ảnh có lớp bị loại phải được xử lý theo chính sách rõ ràng để tránh biến annotation bị bỏ thành âm giả.

Báo cáo mỗi trial phải có hash weights/dataset/code, phiên bản thư viện, cấu hình và máy chạy. Đo:

| Chỉ số | Cách sử dụng |
|---|---|
| Precision/recall từng dấu hiệu, AP và mAP50–95 | Đánh giá đúng lớp và vị trí, báo số mẫu/nhóm hỗ trợ |
| Tỷ lệ ảnh âm có ít nhất một dự đoán dấu hiệu | Đo cảnh báo nhầm trên ảnh bình thường/dễ nhầm đã duyệt |
| Tỷ lệ dấu hiệu gắn sai object hoặc bị loại do liên kết mơ hồ | Đánh giá cả pipeline sau xử lý, không chỉ YOLO thô |
| Latency p50/p95, peak RSS | Đo trên máy đích; tách cold start khỏi lượt đã nạp model |
| Khoảng bất định theo nhóm độc lập | Tránh coi nhiều ảnh cùng cảnh là nhiều thử nghiệm độc lập |

Chọn trước mục tiêu vận hành cùng người phụ trách sản phẩm: mức precision tối thiểu, recall mong muốn, tỷ lệ cảnh báo nhầm và ngân sách latency/RAM. Chưa có các ngưỡng được thống nhất nên chưa tuyên bố đạt để kích hoạt. Điểm confidence chưa hiệu chỉnh không hiển thị như xác suất lỗi.

## 5. Tích hợp sau đánh giá

Tái sử dụng `ai-service/recommendation/visual_detector.py`: đầu ra có bbox, mã dấu hiệu, score, objectId và phiên bản/hash model. Adapter hiện yêu cầu object và sign trong cùng class map, chỉ giữ sign liên kết không mơ hồ với object; phải kiểm độ phù hợp quy tắc containment trên validation trước khi chốt.

UI hiển thị “Phát hiện dấu hiệu nghi…” và vùng bằng chứng; kết quả rỗng dùng “Chưa thấy đủ bằng chứng trong ảnh”, không khẳng định thiết bị bình thường. Dấu hiệu chưa đủ để kết luận nguyên nhân hoặc tự chọn dịch vụ. Hỏi triệu chứng theo bảng, áp dụng mapping được duyệt rồi cho người dùng sửa. Phản hồi người dùng vào hàng đợi review, không tự trở thành nhãn train.

Chỉ tạo manifest kích hoạt khi có báo cáo đánh giá thật được reviewer phê duyệt theo gate hiện hành. Theo dõi cảnh báo nhầm, độ trễ, tỷ lệ người dùng sửa và chuẩn bị quay lại model trước. Không tự đặt `approvedForPilot=true` từ kết quả train.

## Thứ tự bàn giao

1. Người phụ trách xác nhận phạm vi và duyệt dữ liệu/quyền; lập hồ sơ nhóm thực.
2. Đã có adapter Studio → trial và workflow test ứng viên, kiểm gate bằng fixture riêng; cần chạy bằng hồ sơ/dữ liệu thật khi đủ điều kiện.
3. Khi dữ liệu đạt điều kiện, chạy hai baseline trong trial, chốt bằng validation.
4. Đánh giá test đóng băng, review báo cáo, rồi mới tích hợp/kích hoạt.

Tài liệu này không tạo nhãn, bằng chứng quyền, dataset train/test, tải weights hoặc thực hiện train/deploy. Những việc cần người duyệt ảnh và nguồn thật vẫn chưa được hoàn tất bởi kế hoạch.
