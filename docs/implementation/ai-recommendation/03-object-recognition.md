# Thuật toán Nhận diện Đối tượng (Object Recognition Algorithm)

## 1. Phân tách Nhiệm vụ: Danh mục vs. Đối tượng Thiết bị

Thay vì ép buộc một mạng neural duy nhất dự đoán trực tiếp hàng trăm dịch vụ (dẫn đến overfitting và sai lệch logic), hệ thống phân tách rõ ràng thành hai giai đoạn:

```
                      Ảnh đầu vào (Image Input)
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ Giai đoạn A: Phân loại    │
                    │ Danh mục (Category)       │
                    │ (YOLOv8 + CLIP Ensemble)  │
                    └─────────────┬─────────────┘
                                  │  Danh mục hợp lệ (ví dụ: sua-dien)
                                  ▼
                    ┌───────────────────────────┐
                    │ Giai đoạn B: Nhận diện    │
                    │ Thiết bị (Target)         │
                    │ (CLIP ViT-B/32 Zero-Shot) │
                    └─────────────┬─────────────┘
                                  │  Top-k đối tượng ứng viên
                                  ▼
                   Ứng viên thiết bị cho khách xác nhận
```

### Tại sao không train YOLO Classifier 693 class dịch vụ?
1. **Lỗi phân loại sai bản chất**: Dịch vụ (service) là hành vi sửa chữa nghiệp vụ (ví dụ: "kiểm tra", "thay mới", "sửa chập"), không phải là một thực thể hình ảnh (visual entity) có thể nhận dạng qua pixel.
2. **Mất cân bằng dữ liệu cực lớn**: Để huấn luyện 693 class cần hàng chục nghìn ảnh thực địa được gán nhãn chính xác từng lỗi nhỏ.
3. **Dễ vỡ khi Catalog thay đổi**: Mỗi khi Admin thêm hoặc sửa một dịch vụ, toàn bộ mô hình sẽ phải train lại từ đầu.

## 2. Giai đoạn A: Category Classification & Ensemble

- **Mô hình**: YOLOv8n Classification + Zero-Shot CLIP ViT-B/32.
- **Ensemble Logic**:
  - Khi YOLO và CLIP đồng thuận danh mục ($\text{top}_{\text{clip}} == \text{top}_{\text{yolo}} \neq \text{other\_unclear}$): kết hợp trọng số bình phương độ tự tin:
    $$w_{\text{clip}} = p_{\text{clip}}^2, \quad w_{\text{yolo}} = p_{\text{yolo}}^2, \quad w_{\text{total}} = w_{\text{clip}} + w_{\text{yolo}}$$
    $$P(c) = \frac{w_{\text{clip}} P_{\text{clip}}(c) + w_{\text{yolo}} P_{\text{yolo}}(c)}{w_{\text{total}}}$$
  - Khi YOLO phân vân hoặc rơi vào nhãn OOD `other_unclear`: cho phép CLIP override nếu $p_{\text{clip}} \ge 0.50$.
  - Khi người dùng cung cấp từ khóa mô tả (Multimodal text boosting): cộng điểm ưu tiên $+0.35$ cho danh mục trùng khớp.
- **Ngưỡng chấp nhận (Acceptance Threshold)**:
  - Ngưỡng tối thiểu: $0.48$ khi có tín hiệu văn bản hoặc CLIP tự tin, $0.55$ cho trường hợp thông thường.
  - Ngưỡng biên độ chênh lệch (margin): $p_{\text{top}} - p_{\text{second}} \ge 0.10$.
  - Nếu không thỏa mãn: Hệ thống **từ chối đưa ra kết luận vội vã** (`image_uncertain`), chuyển sang gợi ý chọn thủ công.

## 3. Giai đoạn B: Category-Scoped Target Identification

- **Nguồn dữ liệu thiết bị**: 70 đối tượng (targets) trong PostgreSQL, kèm các câu mô tả tiếng Việt và tiếng Anh trong trường `aiPrompts` (ví dụ: `["a photo of a Công tắc điện home appliance", "a photo of cong tac dien"]`).
- **Tạo Text Embeddings**:
  $$\mathbf{e}_t = \text{Normalize}\left(\frac{1}{M}\sum_{m=1}^M \mathbf{e}_{\text{prompt}_m}\right)$$
- **Lọc không gian tìm kiếm theo Danh mục (Category-Scoped)**:
  Chỉ tính độ tương đồng giữa vector ảnh $\mathbf{v}_{\text{img}}$ với các targets $t \in T_{\text{category}}$.
  $$\text{Sim}(\mathbf{v}_{\text{img}}, \mathbf{e}_t) = \frac{\mathbf{v}_{\text{img}} \cdot \mathbf{e}_t}{\|\mathbf{v}_{\text{img}}\| \|\mathbf{e}_t\|}$$
- **Tránh Fallback sai đối tượng**:
  Tuyệt đối không sử dụng global argmax vượt ra ngoài danh mục đã xác định. Nếu không có thiết bị nào trong danh mục vượt ngưỡng, trả về danh sách đối tượng rỗng để khách hàng tự chọn.
- **Xử lý ảnh nhiều đối tượng**:
  Trả về Top-3 đối tượng khả dĩ nhất kèm điểm tin cậy và provenance (`clip_target_similarity`), trao quyền quyết định cuối cùng cho khách hàng trên giao diện ứng dụng.
