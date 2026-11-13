# Chiến lược Dữ liệu và Kiểm soát Rò rỉ (Dataset Strategy & Leakage Control)

## 1. Phân tích Chi tiết Con số Trùng lặp (Dataset Leakage Breakdown)

Báo cáo kiểm toán tự động qua `dataset_manifest_builder.py` ghi nhận:
- **Tổng số tệp ảnh trong tập dữ liệu**: 1.200 tệp (Train: 840, Validation: 240, Test: 120).
- **Số mã băm SHA-256 duy nhất (Unique Hashes)**: 654 mã băm.
- **Số lượng mục trùng lặp tuyệt đối (Duplicate Count)**:
  $$1.200 - 654 = 546 \text{ mục trùng lặp}$$

### Bảng phân tích rò rỉ chéo giữa các tập chia (Cross-split Leakage):

| Tập dữ liệu | Tổng số tệp | Số hash duy nhất nội bộ | Trùng lặp với Train | Trùng lặp với Val | Trùng lặp với Test |
|---|---|---|---|---|---|
| **Train** | 840 | 646 | — | **210 hashes** | **109 hashes** |
| **Validation** | 240 | 213 | **210 hashes** | — | **109 hashes** |
| **Test** | 120 | 114 | **109 hashes** | **109 hashes** | — |

**Nhận định Kỹ thuật:**
- Có đến 109 trong tổng số 114 hash của tập Test (tức **95.6%**) đã xuất hiện trong tập Train và Validation.
- Điều này giải thích tại sao mô hình YOLO trong báo cáo cũ đạt `top1=1.0` (100%) tại epoch 5: mô hình chỉ học thuộc lòng các mẫu tổng hợp trùng lặp giữa các tập chia, không có khả năng khái quát hóa (generalization) trên ảnh thực tế.
- **Quy tắc An toàn**: Không sử dụng tập dữ liệu này để huấn luyện lại hoặc công bố số liệu chất lượng sản phẩm.

---

## 2. Tiêu chuẩn Xây dựng Bộ Dữ liệu Mới (Clean Dataset Standard)

Để xây dựng bộ dữ liệu ảnh thực địa tin cậy cho tương lai:

1. **Phân loại nguồn gốc rõ ràng (Provenance Tagging)**:
   - Tách biệt hoàn toàn `real_device_photo` và `synthetic_opencv`.
   - Lưu trữ `source_manifest.json` ghi rõ ngày thu thập, thiết bị camera, người gán nhãn.
2. **Phân chia Group-Disjoint**:
   - Khóa phân chia theo `household_id` hoặc `session_id`. Toàn bộ ảnh của cùng một thiết bị hoặc một buổi chụp chỉ được nằm trong 1 tập duy nhất (Train hoặc Test).
3. **Bộ lọc Dedup Tự động**:
   - Chặn ngay lập tức các tệp có SHA-256 trùng khớp hoặc dHash perceptual distance $\le 4$ giữa các tập chia.
4. **Gán nhãn Đa cấp (Hierarchical Multi-Labeling)**:
   - Cấp 1: Category (6 danh mục nghề nghiệp).
   - Cấp 2: Target (70 đối tượng thiết bị).
   - Cấp 3: Dấu hiệu thị giác quan sát được (`observableSigns`).
   - Cấp 4: Mức độ liên quan dịch vụ theo thang điểm 0 - 3 (Graded Relevance).
