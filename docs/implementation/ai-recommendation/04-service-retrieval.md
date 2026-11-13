# Truy xuất và Xếp hạng Dịch vụ Thương mại (Service Retrieval & Ranking)

## 1. Cơ sở Dữ liệu là Nguồn Sự thật Duy nhất (Single Source of Truth)

Khắc phục hoàn toàn lỗi dùng danh mục tĩnh 25 dịch vụ:
- Hệ thống truy vấn trực tiếp từ bảng `services`, `service_targets`, và `service_categories` trong cơ sở dữ liệu PostgreSQL.
- Tất cả thông tin thương mại (tên dịch vụ, giá sàn `basePrice`, giá trần `maxPrice`, đơn vị tính `unit`) đều lấy từ database tại thời điểm truy vấn.
- **Quy tắc bất biến (Relational Invariant)**:
  1. `category.isActive === true`
  2. `target.isActive === true`
  3. `service.isActive === true`
  4. `service.categoryId === category.id`
  5. `service.targetId === target.id`

Nếu một thiết bị hoặc dịch vụ bị Admin vô hiệu hóa (`isActive = false`), nó lập tức bị loại khỏi kết quả chẩn đoán và câu hỏi triệu chứng.

## 2. Thuật toán Xếp hạng Dịch vụ (Service Ranking Algorithm)

Thuật toán thực thi trong `server/src/modules/orders/diagnosis/service-ranker.js`:

```
Active Services của Target trong Database (Pool: ~10 dịch vụ)
                          │
                          ▼
            [Phân tích Triệu chứng & Mô tả]
                          │
      ┌───────────────────┴───────────────────┐
      ▼                                       ▼
Có mã triệu chứng (symptom)           Có mô tả tự do (description)
      │                                       │
Khớp chính xác slug dịch vụ            Token overlap (BM25 / Keyword)
(Confidence = 0.95)                   (Confidence = 0.50 + hits * 0.15, max 0.90)
      │                                       │
      └───────────────────┬───────────────────┘
                          │
                          ▼
             Gán Điểm & Lý do Minh bạch
                          │
                          ▼
               Sắp xếp theo Điểm giảm dần
                          │
                          ▼
             Trả về Top-3 Dịch vụ Đề xuất
```

### Điểm số và Nguồn gốc Quyết định (Provenance & Reason Codes)
1. **Khớp chính xác triệu chứng (`symptom_match`)**:
   - Gán `confidence = 0.95`.
   - Lý do: `Khớp chính xác triệu chứng đã xác nhận: [Tên dịch vụ]`.
2. **Khớp từ khóa mô tả (`keyword_match`)**:
   - Gán `confidence = min(0.90, 0.50 + hits * 0.15)`.
   - Lý do: `Khớp với mô tả của khách hàng ([hits] từ khóa)`.
3. **Phù hợp danh mục chung (`catalog_match`)**:
   - Gán `confidence = 0.50`.
   - Lý do: `Dịch vụ phù hợp trong danh mục`.

## 3. Sinh Câu hỏi Triệu chứng Động (Dynamic Symptom Generation)

Triển khai tại `server/src/modules/orders/diagnosis/symptom-taxonomy.js`:
- Thay vì hardcode vài câu hỏi cố định, hệ thống kiểm tra các dịch vụ đang hoạt động thực tế của thiết bị đó.
- Lọc các quy tắc trong `SYMPTOM_RULES` tương ứng với các dịch vụ đang `isActive: true`.
- Nếu thiết bị có dịch vụ chuyên biệt ngoài bộ rules tĩnh, tự động trích xuất các dịch vụ con của thiết bị để tạo các lựa chọn triệu chứng thân thiện cho người dùng.
- Khi người dùng chưa chọn triệu chứng: Trả về trạng thái `status: 'needs_more_info'`, `needsMoreInfo: true`, `suggestedServiceId: null`, tuyệt đối không tự ý chọn dịch vụ đầu tiên!
