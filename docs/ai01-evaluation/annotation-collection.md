# Annotation schema và dữ liệu cần thu thực tế

Contract thực thi: [annotation.py](../../ai-service/eval/ai01/annotation.py), [JSON Schema](../../ai-service/eval/ai01/annotation.schema.json). Một object mỗi dòng JSONL, không thêm predicted labels hay latency vào dataset. Pydantic `extra=forbid` từ chối field lạ. Schema không thay DB.

| Trường | Ý nghĩa / quy ước |
|---|---|
| `id`, `image`, `sha256`, `split` | ID mẫu, đường dẫn tương đối image-root, hash bytes, train/validation/test/quarantine/smoke |
| `provenance` | origin, nguồn cụ thể, quyền/consent, thời gian chụp, deviceId/sessionId/siteId/duplicateGroup; ID nhóm ẩn danh |
| `observation.text` | Mô tả ban đầu của người dùng, ghi trước khi thấy AI/nhãn. Không viết mô tả bằng cách chép nhãn đúng |
| `observation.confirmedAnswers` | Câu trả lời thực tế trong workflow; categoryId/targetId/symptom hoặc symptomId(s), UUID đúng snapshot. Không có serviceId vì sẽ cho sẵn đáp án |
| `labels.category` | Slug/UUID category, null nếu chưa xác minh hoặc không thuộc miền |
| `labels.target` | Slug/UUID target độc lập; null khi chưa biết |
| `labels.visibleFault` | Danh sách code dấu hiệu **nhìn thấy**, ví dụ scorch_mark/water_drip/cracked_surface; không suy hỏng bo mạch từ ảnh vỏ |
| `labels.symptom` | Danh sách code triệu chứng người dùng báo hoặc đo vận hành; tách nguồn bằng review.evidence, không xem là visual truth |
| `labels.recommendedService` | Tập slug/UUID các service chuyên gia thấy hợp lệ, có thể nhiều đáp án. [] nghĩa không được khuyến nghị sửa từ bằng chứng hiện có |
| `labels.unknown` | Ngoài miền/không xác định; true không đồng nghĩa chỉ thiếu ảnh hoặc thiếu annotation |
| `labels.needsInspection` | Cần kiểm tra tại chỗ trước khi khuyến nghị sửa; không đồng nghĩa `needs_more_info` của API (thiếu bước tương tác) |
| `review` | status, annotatorIds, adjudicatorId, annotatedAt, evidence và quy tắc giải quyết bất đồng |

`null` = chưa gán nhãn/không biết, không được tự đổi thành đúng hoặc sai. `[]` = đã xem và xác nhận không có dấu hiệu/không có dịch vụ phù hợp. `visibleFault=[]` có thể là ảnh bình thường hoặc lỗi ẩn; phân biệt bằng symptom/needsInspection/evidence. Với protocol bảo thủ hiện tại, unknown hoặc needsInspection=true thì repair service recommendations là unsafe; dùng recommendedService=[] và ghi nhu cầu khảo sát trong evidence. Nếu muốn coi “dịch vụ khảo sát” là đáp án hợp lệ, phải sửa định nghĩa safety và khóa protocol **trước** test, không đổi sau khi thấy kết quả.

Hai người gán nhãn độc lập không thấy output AI, ít nhất một người có hiểu biết sửa chữa; bất đồng category/target/service/needsInspection do người thứ ba phân xử. Lưu nhãn gốc riêng và thống kê agreement (category/target Cohen kappa hoặc agreement; fault/service set agreement), rồi adjudicated label. Schema hỗ trợ kết quả cuối và ID người gán; không tự chứng minh quy trình hai người đã thực hiện.

## Danh sách cần tự thu

1. Ảnh điện thoại thật của sáu category catalog, đặc biệt giup_viec đang thiếu trong YOLO dataset. Chọn các target/service có thể tiếp cận thực tế; công bố phạm vi subset nếu chưa phủ 70/693, không tuyên bố phủ toàn catalog.
2. Mỗi nhóm có nhiều **thiết bị vật lý/địa điểm/phiên** độc lập: ảnh toàn cảnh, cận dấu hiệu, nhiều góc/ánh sáng/máy chụp, phản chiếu/che khuất. Nhiều ảnh cùng thiết bị chỉ tăng số ảnh, không tăng số nhóm độc lập.
3. Trường hợp có lỗi thấy được, thiết bị bình thường cùng loại, lỗi ẩn chỉ có triệu chứng, cần đo/kiểm tra tại chỗ, ảnh mờ/tối/không đủ góc, nhiều thiết bị một ảnh, OOD không liên quan. Thu cả triệu chứng có vẻ tương tự nhưng cần dịch vụ khác.
4. Mô tả nguyên bản tiếng Việt có/không dấu, sai chính tả, rất ngắn, mô tả đúng và mâu thuẫn với ảnh. Thu trước khi xem AI, không chế mô tả để giúp model. Benchmark cần các cặp ảnh–text thật, không chỉ text rỗng.
5. Với mỗi ca: device/session/site IDs ẩn danh, ngày giờ, camera model, nguồn/quyền/consent, category/target, dấu hiệu visible, triệu chứng reported/đo được, kết luận chuyên gia, tập service hợp lệ và khi nào cần inspection. Không thu mặt/địa chỉ/giấy tờ vào ảnh sự cố nếu không cần.
6. Ghi hành vi xác nhận target/symptom riêng để đánh giá workflow assisted; tuyệt đối không điền answers bằng cách nhìn nhãn ground truth trong runner. Nếu chưa có lịch sử tương tác, chỉ báo cáo phiên đầu, không tạo answers giả.

Cỡ mẫu phải dựa số nhóm độc lập, phân bố lớp và độ rộng CI mong muốn cùng giảng viên. Có thể thu pilot trên **development** để ước lượng rồi chốt số nhóm/test; không tự gọi vài ảnh/class là đủ học thuật. Báo cáo số ảnh, số thiết bị và số phiên từng lớp, bao gồm rare classes và exclusions. Không bảo đảm độc lập với pretraining web của CLIP/YOLO nếu dùng ảnh Internet; ưu tiên ảnh mới tự chụp và công khai giới hạn này.
