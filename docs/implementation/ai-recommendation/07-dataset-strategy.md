# Chiến lược Dữ liệu và Kiểm soát Rò rỉ (Dataset Strategy & Leakage Control)

## 1. Phát hiện Từ Báo cáo Kiểm toán Dữ liệu (Forensic Audit Findings)

Kiểm toán tự động thông qua `dataset_manifest_builder.py` và `exact-leakage.json` xác nhận:
- Tập dữ liệu 1.200 ảnh lịch sử trong `ai-service/dataset/` hoàn toàn là ảnh tổng hợp (synthetic) được vẽ bằng OpenCV script (`prepare_dataset.py`).
- **Rò rỉ dữ liệu trùng khớp tuyệt đối (Exact SHA-256 Leakage)**:
  - Giao Train - Validation: 210 hashes trùng lặp tuyệt đối.
  - Giao Train - Test: 109 hashes trùng lặp tuyệt đối.
  - Giao Validation - Test: 109 hashes trùng lặp tuyệt đối.
  - Tổng số 546 mục trùng lặp hash chéo giữa các tập chia.
- **Kết luận chuyên môn**: Con số "100% accuracy" hay "Top-1=1.0" trong các báo cáo lịch sử (`results.csv`) là kết quả của việc mô hình học thuộc lòng các mẫu tổng hợp trùng lặp giữa train và test. **Tuyệt đối không sử dụng độ chính xác lịch sử làm thước đo chất lượng sản phẩm.**

## 2. Tiêu chuẩn Xây dựng Bộ Dữ liệu Chuẩn (Clean Dataset Protocol)

Để chuẩn bị cho các đợt fine-tune tương lai khi có đủ ảnh thực địa, quy trình thu thập và quản lý dữ liệu bắt buộc tuân thủ:

### 2.1. Phân loại và Nguồn gốc (Provenance Classification)
- Mỗi mẫu ảnh phải được gắn nhãn nguồn gốc rõ ràng:
  - `origin`: `'real_device_photo'` (ảnh chụp từ điện thoại thực tế có consent), `'synthetic_opencv'` (ảnh tổng hợp từ thuật toán), hoặc `'external_licensed'` (ảnh từ bộ dữ liệu mở có giấy phép).
  - Nghiêm cấm trộn lẫn ảnh tổng hợp vào tập test dùng để đánh giá năng lực thực tế.

### 2.2. Chiến lược Phân chia Chống Rò rỉ (Disjoint Group Splitting)
- **Group-disjoint Split**: Phân chia Train / Validation / Test phải nhóm theo:
  - Thiết bị chụp (`device_id`).
  - Hộ gia đình / Bối cảnh không gian (`household_id` / `scene_id`).
  - Phiên chụp (`session_id`).
- Ảnh cùng một góc máy, cùng một vật thể chụp liên tiếp nhiều lần phải ở cùng một tập (cùng train hoặc cùng test), không được xé lẻ sang hai bên.
- **Kiểm tra Dedup**: Tự động chặn bằng mã băm SHA-256 và dHash perceptual hash (Hamming distance $\le 4$) trước khi đưa vào pipeline đánh giá.

## 3. Hướng dẫn Gán nhãn Chuẩn hóa (Labeling Guidelines)

| Tầng thông tin | Định nghĩa nhãn | Ví dụ hợp lệ | Lỗi gán nhãn cần tránh |
|---|---|---|---|
| **Category** | 1 trong 6 danh mục ngành nghề của FixGo | `sua-dien`, `dien-lanh`, `sua-nuoc` | Gán nhãn dịch vụ con chi tiết làm category |
| **Target** | Đối tượng / Thiết bị vật lý quan sát được | `cong-tac-dien`, `may-lanh-treo-tuong` | Gán nhãn nguyên nhân hỏng hóc |
| **Observable Sign** | Dấu hiệu thị giác thực tế có thể nhìn thấy bằng mắt | "Vỡ mặt nạ nhựa", "Chảy nước ở ống xả" | "Hỏng tụ điện", "Mất nguồn" khi chỉ chụp vỏ ngoài |
| **Relevance Graded** | Mức độ phù hợp của dịch vụ đề xuất (0 - 3) | 3: Đúng lỗi cần sửa; 2: Dịch vụ bảo trì liên quan; 0: Dịch vụ sai thiết bị | Gán tất cả dịch vụ trong cùng category là đúng |
