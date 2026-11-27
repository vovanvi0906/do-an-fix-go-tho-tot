# Ánh xạ nhãn nguồn sang dịch vụ FixGo

Phương án được người dùng duyệt ngày 27/11/2026: tận dụng annotation nguồn,
không gán lại toàn bộ, dùng dịch vụ hiện có và khách xác nhận trước khi đặt.

## Artifact

- `ai-service/recommendation/source_label_mapping.json`: đủ 12 lớp của
  `defect-images-v2-audit/classes.csv`, gắn ID dịch vụ, đối tượng và danh mục thật.
- `ai-service/recommendation/source_label_mapping.py`: bộ phân giải nhận nhãn
  dự đoán và danh mục mới từ backend, trả lựa chọn còn hoạt động.
- `docs/ai-data-02/evidence/source-label-mapping-v1.json`: kiểm tra bằng snapshot
  PostgreSQL chỉ đọc ngày 27/11/2026, 6 nhóm / 70 đối tượng / 693 dịch vụ.

Không dùng class index đứng riêng: phải giải mã theo class-map của checkpoint.
Không lấy nhãn annotation hoặc tên file làm dự đoán cho ảnh người dùng.

## Quy tắc đã duyệt

| Nhãn | Trạng thái | Dịch vụ / hành vi |
| --- | --- | --- |
| Bathtub | unsupported | Chưa có đối tượng bồn tắm phù hợp |
| Clogged Drain | confirm_context | Chọn phễu sàn, chậu rửa, ống thoát hoặc cống; ánh xạ tới bốn dịch vụ thông tắc tương ứng |
| Clogged Toilet | suggest | Thông tắc bồn cầu; khách vẫn xác nhận |
| Dirty Air Filter | confirm_context | Xác nhận máy lạnh và loại treo tường/âm trần trước khi chọn vệ sinh |
| Improper wiring for water heater | confirm_context | Kiểm tra an toàn điện và tiếp địa cho bình nóng lạnh điện |
| Improper wiring on panel box | confirm_context | Bảo trì tủ điện; không tự chọn thay linh kiện |
| Laundry Units | choose_need | Chọn máy giặt hoặc máy sấy, sau đó chọn nhu cầu từ dịch vụ đang hoạt động |
| Water Heater Thermostat | confirm_need | Xác nhận bình nóng lạnh điện và nhu cầu sửa bộ điều nhiệt |
| Opossum, Scorpion, Spider, Termites | unsupported | Chưa có dịch vụ phù hợp |

## Contract dùng khi tích hợp detector

```python
from recommendation.source_label_mapping import resolve_source_label

# Chỉ gọi sau khi dự đoán thật đã qua kiểm tra chất lượng/ngưỡng riêng của lớp.
result = resolve_source_label(
    predicted_class_name,
    fresh_backend_catalog,  # categories, targets, services; đầy đủ isActive
    selected_target_id=customer_selected_target_id,  # có thể None
)
```

- `suggest`: đưa dịch vụ lên đầu, khách xác nhận trước khi đặt.
- `confirm_context`: hỏi câu trong `question`; dịch vụ trả về là lựa chọn có
  điều kiện, không phải kết luận hỏng. Chọn target chưa đủ phân biệt máy lạnh
  treo tường/âm trần, khách phải chọn đúng dịch vụ.
- `confirm_need`: nhận diện bộ phận không chứng minh hỏng; xác nhận nhu cầu sửa.
- `choose_need`: chỉ duyệt dịch vụ thuộc đối tượng được chọn.
- `unsupported`, `catalog_unavailable`, `context_mismatch`: chuyển chọn danh mục
  thủ công. Không tự tạo dịch vụ hoặc lấy snapshot thay danh mục hiện tại.

Mọi kết quả có `requiresCustomerConfirmation=true`. Tên/giá lấy từ catalog
đầu vào; dịch vụ, đối tượng hoặc nhóm bị tắt bị loại. ID dịch vụ bị đổi đối
 tượng/danh mục hoặc slug không còn khớp cũng bị loại.

## Phạm vi đã thực hiện và phần còn lại

Đã tạo cấu hình và bộ phân giải, kiểm tra toàn bộ ánh xạ trên DB hiện tại.
Chưa nối vào `/ai/v2/diagnose` hoặc giao diện: chưa xác nhận checkpoint hiện
có hỗ trợ 12 lớp nguồn này. Các detector dấu hiệu nhiều dịch vụ đang có dùng
class-map khác, không được đổi tên lớp của chúng thành các lớp nguồn này.

Bước tiếp theo là đối chiếu annotation nguồn, chuẩn bị split giữ nhóm trùng,
train/đánh giá detector các lớp được hỗ trợ, rồi đưa dự đoán đã qua ngưỡng vào
bộ phân giải. Không cần train năm lớp chưa có dịch vụ trong phạm vi này.
Sau đó tích hợp câu hỏi/xác nhận trong UI và kiểm tra trọn luồng đặt lịch.
Chưa có tuyên bố chất lượng nhận diện cho 12 lớp hoặc triển khai production.

## Kiểm chứng

```bash
ai-service/.venv/bin/python -m unittest discover -s ai-service/eval -p test_source_label_mapping.py
```

6 kiểm thử: đủ 12 lớp và fallback, gợi ý không xác nhận đơn, câu hỏi ngữ cảnh,
loại dịch vụ tắt/chuyển đối tượng, lấy tên/giá mới, lọc dịch vụ máy giặt/máy sấy.
Kiểm tra DB thật: 7 nhãn có đường ánh xạ, 5 nhãn chưa hỗ trợ; không có dịch vụ
tham chiếu bị thiếu/tắt. Laundry Units có 30 dịch vụ đang hoạt động trước khi
khách chọn một trong hai đối tượng.
