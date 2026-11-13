# Báo cáo Kiểm thử Tự động Toàn diện (Comprehensive Test Report)

## 1. Tổng quan Kết quả Kiểm thử

Hệ thống đã thiết lập và vượt qua toàn bộ 82 kịch bản kiểm thử tự động trên 3 tầng công nghệ:

| Tầng kiểm thử | Test Suites | Số bài test | Trạng thái | Thời gian chạy |
|---|---|---|---|---|
| **NestJS Backend** | 8 suites | 60 tests | **PASS (100%)** | 1.37 s |
| **Customer Mobile App** | 3 suites | 11 tests | **PASS (100%)** | 0.75 s |
| **FastAPI AI Service** | 2 suites | 11 tests | **PASS (100%)** | 0.06 s |
| **TỔNG CỘNG** | **13 suites** | **82 tests** | **PASS (100%)** | **~2.18 s** |

## 2. Chi tiết các Kịch bản Kiểm thử theo Yêu cầu Nghiệp vụ

### 2.1. Backend NestJS (`server/src/modules/orders/diagnosis/`)
1. `asks for symptoms even when the image model returns a service`: Trả về `needs_more_info` và danh sách câu hỏi triệu chứng, không vội gán dịch vụ.
2. `does not turn an outage or heuristic into a diagnosis`: AI lỗi hoặc trả về `heuristic` sẽ chuyển thành `unavailable`, không gán điểm tự tin giả.
3. `rejects insufficient/invalid score [0, 0.59, null, NaN, 2]`: Điểm không đạt ngưỡng yêu cầu chọn thủ công (`manual_selection`).
4. `does not replace an unknown category with the first category`: Danh mục lạ không bị ép chọn danh mục đầu tiên.
5. `resolves confirmed symptom to the exact active DB service and catalog price`: Triệu chứng đã xác nhận tìm chính xác dịch vụ trong database với giá niêm yết chuẩn.
6. `allows manual service selection without AI`: Hỗ trợ đặt lịch thủ công không cần AI.
7. `rejects forged or stale answers`: Chặn các câu trả lời giả mạo, ID danh mục không tồn tại, dịch vụ thuộc danh mục khác.
8. `never manufactures an upper price when catalog has none`: Giữ `maxPrice: null` và định dạng `Từ X đ` nếu catalog không có giá trần.
9. `does not offer a symptom whose mapped service has been disabled`: Dịch vụ bị vô hiệu hóa sẽ tự động biến mất khỏi danh sách câu hỏi.
10. `rejects target belonging to a different category`: Bắt lỗi `Thiết bị không thuộc danh mục` nếu gửi thiết bị sai danh mục.
11. `passes target and scopes services when valid target is selected`: Lọc chính xác danh mục và dịch vụ của thiết bị được chọn.
12. `ranks services and includes top ranked recommendations upon symptom confirmation`: Đề xuất danh sách Top-k dịch vụ có thứ hạng và lý do minh bạch.

### 2.2. Customer Mobile App (`customer-app/src/components/diagnosis/`)
1. `sends confirmed symptoms with category and uploaded URL`: Gửi đúng payload multipart/JSON lên Backend.
2. `shows connection errors without inventing a result`: Hiển thị thông báo lỗi khi rớt mạng, không bịa kết quả.
3. `changing category clears the previous service and symptom from answers`: Đổi danh mục sẽ xóa sạch trạng thái cũ để tránh sai lệch quan hệ.
4. `confirms detected target when user clicks "Đúng thiết bị này"`: Chuyển sang bước triệu chứng với `targetId` tương ứng.
5. `allows user to change target via "Không đúng thiết bị"`: Mở rộng danh sách thiết bị và cập nhật `targetId` mới.
6. `selects suggested service and includes targetId in answers`: Chọn dịch vụ đề xuất giữ nguyên ngữ cảnh thiết bị.

### 2.3. FastAPI AI Service (`ai-service/eval/`)
1. `test_unreadable_image_has_no_confidence_or_fake_diagnosis`: Ảnh lỗi trả về `unavailable`.
2. `test_filename_and_description_do_not_replace_missing_models`: Không lấy tên file hay mô tả thay thế cho mô hình bị thiếu.
3. `test_clip_classifies_group_without_claiming_specific_damage`: CLIP chỉ nhận diện danh mục, không tự claim hỏng hóc.
4. `test_ambiguous_and_out_of_scope_images_abstain`: Ảnh mờ hoặc OOD chủ động từ chối kết luận (`cat is None`).
5. `test_ensemble_agreement_boosts_confidence`: YOLO và CLIP cùng đồng thuận làm tăng độ tự tin danh mục.
6. `test_yolo_unclear_falls_back_to_clip`: YOLO không rõ chuyển giao cho CLIP nếu CLIP tự tin cao.
7. `test_multimodal_description_boosts_matching_category`: Khai thác từ khóa trong ô mô tả văn bản để tăng điểm danh mục.
8. `test_target_matcher_restricts_to_category_and_ranks`: Chỉ tính similarity trên các thiết bị thuộc danh mục hợp lệ.
9. `test_catalog_manager_sync_and_state`: Kiểm tra cơ chế đồng bộ và quản lý phiên bản catalog.
