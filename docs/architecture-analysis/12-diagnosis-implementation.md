# Triển khai chẩn đoán và chọn dịch vụ

Ngày: 08/11/2026. Áp dụng trong source; chưa xác nhận deployment hoặc độ chính xác trên ảnh thực tế.

## Luồng đã triển khai

1. Mobile upload ảnh lên backend; backend gọi AI với timeout 15 giây.
2. AI phân loại nhóm từ pixel bằng YOLO/CLIP/ensemble. Không suy luận từ tên file, không mặc định sửa điện, không chọn dịch vụ đầu tiên, không gán nhãn hỏng theo nhóm.
3. Backend chỉ chấp nhận kết quả có `engine=model`, điểm hữu hạn trong [0,1] và category đang hoạt động khớp chính xác slug/ID.
4. Nhận diện nhóm thành công vẫn cần khách xác nhận triệu chứng hoặc chọn dịch vụ. AI không tự quyết định nguyên nhân hỏng.
5. Quy tắc triệu chứng ánh xạ sang slug chính xác trong DB; chỉ hiển thị quy tắc có dịch vụ đang hoạt động. Các nhóm chưa có quy tắc dùng danh sách dịch vụ để khách tự chọn.
6. Khách có thể đổi nhóm/chọn dịch vụ thủ công khi AI offline hoặc không chắc chắn. Backend offline thì hiện lỗi kết nối; không tạo kết quả giả.
7. Chỉ cho tiếp tục khi có service ID hợp lệ. Backend tạo đơn kiểm tra service/category, lấy giá từ catalog server.
8. Đơn tiêu chuẩn chỉ cache sau khi backend xác nhận ID thật. Không tạo mã đơn dự phòng để báo thành công.

## Contract

Dùng tiếp POST `/orders/diagnose` và `/orders/diagnose-upload`, không thêm endpoint hay migration.

JSON input:

```json
{
  "imageUrl": "https://storage.example/incident.jpg",
  "description": "Máy lạnh chảy nước",
  "answers": { "categoryId": "DB_CATEGORY_ID", "symptom": "ac_leak" }
}
```

Lượt đầu bỏ `answers`. Chọn thủ công dùng `{categoryId, serviceId}`. Đổi nhóm chỉ gửi `{categoryId}` để không giữ service/triệu chứng cũ. Upload dùng `answers` dạng chuỗi JSON trong multipart. Không đồng thời gửi symptom và serviceId.

Response có `requestId`, `status`, `source`, `reason`, `questions`, `category`, `service`, `priceEstimate`, `availableCategories`, `availableServices`; giữ các field phẳng `suggestedCategoryId`, `suggestedServiceId`, `estimatedPriceMin/Max`, `confidence` để tương thích các màn hình cũ.

| Status | Mobile xử lý |
|---|---|
| suggested | Hiện dịch vụ và giá tham khảo; khách xác nhận hoặc đổi |
| needs_more_info | Hỏi triệu chứng / chọn dịch vụ |
| manual_selection | Chọn nhóm rồi dịch vụ |
| unavailable | Hiện AI chưa khả dụng, cho chọn nhóm/dịch vụ |

`confidence/modelScore` là điểm nhận diện nhóm chưa hiệu chỉnh, không phải tỷ lệ chẩn đoán đúng. Khi chọn bằng quy tắc/thủ công không tạo confidence giả. Giá tối đa không có trong DB được giữ `null`; UI hiển thị giá từ catalog, không tự nhân hệ số.

## Nơi mở rộng

- `doan-kltn-backend/src/modules/orders/diagnosis/diagnosis-resolver.js`: `SYMPTOM_RULES`, xác thực đầu vào và ánh xạ DB. Thêm quy tắc chỉ khi slug dịch vụ tương ứng thực sự tồn tại. Tránh ánh xạ triệu chứng sang biện pháp sửa chưa được kiểm tra.
- `doan-kltn-mobile/src/components/diagnosis/DiagnosisChoices.jsx`: UI dùng chung cho Home modal và DiagnoseScreen.
- `ai-service/main.py`: nhận diện nhóm và ngưỡng tạm thời. Chưa hiệu chỉnh ngưỡng hoặc huấn luyện lại model.

## Kiểm tra tái lập

Chạy từ root repository:

```bash
npm run build --prefix doan-kltn-backend
npm test --prefix doan-kltn-backend -- --runInBand diagnosis/
npm test --prefix doan-kltn-mobile -- --runInBand DiagnosisChoices.test.jsx aiService.test.js
python3 -m unittest discover -s ai-service/eval -p test_diagnose_contract.py -v
python3 -m py_compile ai-service/main.py ai-service/eval/eval_cls.py ai-service/eval/audit_dataset.py
python3 ai-service/eval/audit_dataset.py
```

TypeScript: chạy `./node_modules/.bin/tsc --noEmit` trong `doan-kltn-mobile`.

AI unit test thực thi thân endpoint thật với model giả lập, không chứng minh độ chính xác model hoặc khả năng tải weights. Test backend dùng DB giả lập; test mobile dùng API giả lập.

Audit dataset cố ý exit 1 với dữ liệu hiện tại: 210 hash trùng train/val, 109 train/test, 109 val/test. Evaluation từ chối báo accuracy nếu split thiếu hoặc trùng ảnh. Không tự xóa, sửa hoặc huấn luyện lại trên dataset này. Audit hash chưa phát hiện ảnh gần trùng.

Kết quả kiểm tra source: build backend và TypeScript mobile đạt; 22 test backend, 8 test mobile, 5 test logic endpoint AI đạt. Kiểm tra cú pháp Python/JSX và `git diff --check` đạt.

## Nghiệm thu trên môi trường chạy

Khởi động đồng bộ backend, AI và mobile để tránh contract cũ/mới lệch nhau. Cần DB có category/service đang hoạt động và Cloudinary upload hợp lệ.

- Ảnh máy lạnh → nhóm Điện lạnh → chọn “Máy lạnh chảy nước” → service DB đúng → tạo đơn có ID thật và ảnh ban đầu.
- Dừng AI → chọn nhóm/dịch vụ thủ công → tạo đơn; không xuất hiện điểm 90–93% giả.
- Ảnh mờ/ngoài phạm vi → không tự chọn sửa điện.
- Đổi nhóm hoặc ảnh → không giữ dịch vụ cũ.
- Tắt/xóa service sau khi đề xuất → tạo đơn bị từ chối rõ ràng.
- Mất mạng backend → không hiện đơn tiêu chuẩn thành công và không cache đơn giả.

## Giới hạn còn lại

Chưa đo accuracy thực tế; cần ảnh thật, nhãn chuyên môn và test split độc lập theo ca sự cố/thiết bị. Chưa lưu requestId/kết luận thợ thành bộ dữ liệu phản hồi trong DB, chưa thêm dashboard đo chất lượng. Các bước này cần thiết kế lưu trữ riêng.

Cơ chế backend tìm thợ cho đơn có scheduledAt vẫn giữ hành vi tìm thợ hiện tại; chưa xây scheduler kích hoạt sát giờ hẹn. Nhánh dịch vụ tùy chỉnh chờ admin không thuộc thay đổi luồng chẩn đoán tiêu chuẩn. Cần nghiệm thu riêng luồng socket, GPS, lịch hẹn và thanh toán trước khi tuyên bố toàn bộ đặt lịch hoạt động hoàn chỉnh.
