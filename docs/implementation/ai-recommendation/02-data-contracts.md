# Hợp đồng Dữ liệu (Data Contracts)

## 1. So sánh Hợp đồng Trước và Sau Cải tiến

| Trường dữ liệu | Trước (Baseline) | Sau (Target Implementation) | Ý nghĩa nghiệp vụ |
|---|---|---|---|
| `status` | `'suggested'` / `'needs_more_info'` / `'manual_selection'` / `'unavailable'` | Giữ nguyên 4 trạng thái | Quản lý vòng đời bước chẩn đoán |
| `decisionSource` | Không có (chỉ có `source`) | `'model'`, `'rules'`, `'manual'`, `'unavailable'` | Phân biệt kết quả do ML, rule catalog hay người dùng chọn |
| `categoryCandidates` | ❌ Không có | ✅ Mảng top ứng viên kèm confidence và provenance | Khách hàng và UI nắm được độ tự tin danh mục |
| `targetCandidates` | ❌ Không có | ✅ Mảng top thiết bị kèm similarity, confidence | Cho phép khách hàng xác nhận đối tượng thị giác |
| `suggestedTargetId` | Bị bỏ qua bởi Backend | ✅ ID đối tượng DB chính xác (`target.id`) | Ràng buộc dịch vụ theo thiết bị cụ thể |
| `suggestedServices` | ❌ Không có (chỉ có 1 service duy nhất) | ✅ Mảng Top-k dịch vụ xếp hạng kèm giá DB và lý do | Đề xuất minh bạch nhiều dịch vụ hợp lệ |
| `observableSigns` | ❌ Không có (gán nhầm symptom) | ✅ Dấu hiệu quan sát thực tế từ ảnh | Tránh ảo giác "ổ cắm mất điện" từ ảnh tĩnh |
| `reportedSymptoms` | ❌ Không lưu | ✅ Triệu chứng khách xác nhận | Lưu vết khách hàng khai báo |
| `reasonCodes` | Chuỗi đơn | ✅ Mảng mã lý do chuẩn hóa | Cho phép giải thích chi tiết quyết định |
| `modelVersion` | ❌ Không có | ✅ `'fixgo-ai-rec-v1'` | Quản trị phiên bản pipeline đề xuất |
| `availableTargets` | ❌ Bị reject | ✅ Danh sách thiết bị thuộc danh mục | Hỗ trợ chọn lại khi AI nhận sai đối tượng |

## 2. Hợp đồng Yêu cầu (Request Contract)

### 2.1. Upload trực tiếp ảnh (Turn 1): `POST /orders/diagnose-upload`
- `Content-Type`: `multipart/form-data`
- Body fields:
  - `image`: File ảnh (jpg, png, webp, tối đa 10MB)
  - `description`: Chuỗi mô tả sự cố (tùy chọn)
  - `answers`: Chuỗi JSON mã hóa `{ categoryId?, targetId?, serviceId?, symptom? }`

### 2.2. Gửi câu trả lời / Chẩn đoán lại (Turn 2, 3): `POST /orders/diagnose`
- `Content-Type`: `application/json`
```json
{
  "imageUrl": "https://res.cloudinary.com/.../incident.jpg",
  "description": "công tắc bấm không lên đèn",
  "answers": {
    "categoryId": "4d397d29-ec22-4eae-88ea-8e411e04bdb3",
    "targetId": "f2b5a73e-b1e3-45c2-97c1-a09015ad18b6",
    "symptom": "switch_power"
  }
}
```

## 3. Hợp đồng Phản hồi Toàn diện (Full Response Contract)

```json
{
  "requestId": "a8f3b412-881c-4b53-91b3-3a18a9947721",
  "status": "suggested",
  "source": "rules",
  "decisionSource": "rules",
  "modelVersion": "fixgo-ai-rec-v1",
  "imageUrl": "https://res.cloudinary.com/.../incident.jpg",
  "confidence": 0.88,
  "modelScore": 0.88,
  "detectedLabels": ["Sửa điện"],
  "observableSigns": [
    "Nhận diện danh mục: Sửa điện",
    "Nhận diện đối tượng: Công tắc điện"
  ],
  "reportedSymptoms": ["switch_power"],
  "reason": "symptom_confirmed",
  "reasonCodes": ["symptom_confirmed"],
  "needsMoreInfo": false,
  "requiresManualSelection": false,

  "suggestedCategoryId": "4d397d29-ec22-4eae-88ea-8e411e04bdb3",
  "suggestedCategoryName": "Sửa điện",
  "category": {
    "id": "4d397d29-ec22-4eae-88ea-8e411e04bdb3",
    "slug": "sua-dien",
    "name": "Sửa điện"
  },
  "categoryCandidates": [
    { "id": "sua-dien", "slug": "sua-dien", "name": "Sửa điện", "confidence": 0.88, "provenance": "ensemble+text" },
    { "id": "thiet-bi", "slug": "thiet-bi", "name": "Thiết bị gia dụng", "confidence": 0.12, "provenance": "ensemble" }
  ],

  "suggestedTargetId": "f2b5a73e-b1e3-45c2-97c1-a09015ad18b6",
  "suggestedTargetName": "Công tắc điện",
  "target": {
    "id": "f2b5a73e-b1e3-45c2-97c1-a09015ad18b6",
    "slug": "cong-tac-dien",
    "name": "Công tắc điện"
  },
  "targetCandidates": [
    { "targetId": "f2b5a73e-b1e3-45c2-97c1-a09015ad18b6", "targetName": "Công tắc điện", "targetCategory": "sua-dien", "confidence": 0.84, "provenance": "clip_target_similarity" },
    { "targetId": "e14b43c1-6b22-4a0b-8d59-3a87679805d2", "targetName": "Ổ cắm điện", "targetCategory": "sua-dien", "confidence": 0.52, "provenance": "clip_target_similarity" }
  ],

  "suggestedServiceId": "00a5f8a1-29f9-4179-adc1-556cb7bad482",
  "suggestedServiceName": "Sửa công tắc không hoạt động",
  "service": {
    "id": "00a5f8a1-29f9-4179-adc1-556cb7bad482",
    "slug": "sua-cong-tac-khong-hoat-dong",
    "name": "Sửa công tắc không hoạt động",
    "unit": "điểm"
  },
  "suggestedServices": [
    {
      "id": "00a5f8a1-29f9-4179-adc1-556cb7bad482",
      "name": "Sửa công tắc không hoạt động",
      "slug": "sua-cong-tac-khong-hoat-dong",
      "basePrice": 100000,
      "maxPrice": 200000,
      "unit": "điểm",
      "confidence": 0.95,
      "reason": "Khớp chính xác triệu chứng đã xác nhận: Sửa công tắc không hoạt động",
      "provenance": "symptom_match"
    },
    {
      "id": "11b7f8a1-39f9-4179-adc1-667cb7bad493",
      "name": "Thay công tắc hỏng",
      "slug": "thay-cong-tac-hong",
      "basePrice": 120000,
      "maxPrice": null,
      "unit": "điểm",
      "confidence": 0.5,
      "reason": "Dịch vụ phù hợp trong danh mục",
      "provenance": "catalog_match"
    }
  ],

  "estimatedPriceMin": 100000,
  "estimatedPriceMax": 200000,
  "estimatedPriceRange": {
    "min": 100000,
    "max": 200000,
    "unit": "điểm",
    "formatted": "100.000 đ ~ 200.000 đ / điểm"
  },
  "priceEstimate": {
    "min": 100000,
    "max": 200000,
    "unit": "điểm"
  },

  "questions": [],
  "availableCategories": [...],
  "availableTargets": [...],
  "availableServices": [...],
  "message": "Dịch vụ theo thông tin bạn xác nhận. Giá tham khảo; thợ kiểm tra và báo giá thực tế."
}
```
