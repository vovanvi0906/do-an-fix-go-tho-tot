# Báo cáo Đánh giá và Đo lường Mô hình (Model Benchmark Report)

> [!WARNING]
> **Tuyên bố Tính trung thực (Honesty & Provenance Statement):**
> Bộ dữ liệu 1.200 ảnh lịch sử trong `ai-service/dataset/` đã được kiểm toán là ảnh tổng hợp (synthetic) bằng OpenCV và bị rò rỉ chéo hash giữa Train - Validation - Test. Hiện tại dự án **CHƯA CÓ bộ dữ liệu ảnh thực địa độc lập (Real Household Dataset)**.
> Do đó, các chỉ số độ chính xác trên ảnh thực tế được phân loại chính thức là: **NOT MEASURED (Chưa đo lường trên dữ liệu thực tế)**.
> Tuyệt đối không sử dụng độ chính xác mô phỏng hoặc số liệu lịch sử để tuyên bố chất lượng sản phẩm.

---

## 1. Kết quả Chạy Thử nghiệm Inference Thật trên Ảnh Mẫu (Live Model Execution)

Kiểm thử tự động tại `ai-service/eval/test_live_inference.py` sử dụng trực tiếp:
- Mô hình YOLO thật: `yolov8n-cls-fixgo.pt`
- Mô hình CLIP thật: `openai/clip-vit-base-patch32` (nạp từ local HuggingFace cache)
- Endpoint FastAPI: `/ai/v2/diagnose`

### Kết quả đo lường trực tiếp trên 4 ảnh mẫu (`ai-service/eval/images/`):

| Ảnh thử nghiệm | Đầu vào (Ảnh + Mô tả) | Nhãn Dự đoán V2 | Target Đề xuất Top-1 | Cosine Sim | Model Conf | Ghi chú & Đánh giá |
|---|---|---|---|---|---|---|
| `sample_appliance.jpg` | Ảnh bếp/tủ lạnh + "bếp từ không nóng" | `dien-lanh` (hoặc `thiet-bi`) | Tủ lạnh (`tu-lanh-tu-lanh-side-by-side`) | `0.2726` | `0.6317` | Nhận diện đúng danh mục thiết bị gia đình; similarity thô phản ánh đúng đặc trưng thị giác. |
| `sample_garden.jpg` | Ảnh sân vườn + "cắt tỉa cây vườn" | `lam-vuon` | Hàng rào cây / Bồn hoa / Vườn rau | `0.2110` | `1.0000` | Đồng thuận Ensemble + Text boost; lọc đúng 3 target sân vườn. |
| `sample_face.jpg` | Ảnh khuôn mặt (Không liên quan / OOD) | `lam-vuon` (Borderline) | Hàng rào cây | `0.1667` | `0.5496` | Cosine similarity rất thấp (0.16); mô hình không tự tin. Phản ánh đúng việc cần cơ chế OOD abstention. |
| `invalid_path.jpg` | Ảnh lỗi / không đọc được | `None` | `None` | `None` | `None` | Trả về `engine: 'unavailable'` an toàn, không sinh chẩn đoán giả. |

---

## 2. Bảng Phân loại Đo lường (Measurement Status)

| Hạng mục Đo lường | Trạng thái Thực tế | Phương pháp / Bằng chứng |
|---|---|---|
| **Category Accuracy (Real Dataset)** | **NOT MEASURED** | Cần thu thập ảnh thực tế hộ gia đình trước khi benchmark |
| **Target Top-1 / Top-3 (Real Dataset)** | **NOT MEASURED** | Chưa có tập ảnh thực địa gắn nhãn 70 đối tượng |
| **Service Recall@k (Real Dataset)** | **NOT MEASURED** | Cần tập dữ liệu ground truth đánh giá độ liên quan dịch vụ |
| **Pipeline Latency p50 (CPU Inference)** | **19.5 ms** | Đo trực tiếp qua `benchmark_recommendation.py` |
| **Pipeline Latency p95 (CPU Inference)** | **25.0 ms** | Đo trực tiếp qua `benchmark_recommendation.py` |
| **Ràng buộc Quan hệ 3 Tầng** | **100% Verified** | Kiểm thử qua 28 unit tests NestJS (`diagnosis-resolver.spec.js`) |
| **Kiểm tra Trạng thái Hoạt động Active** | **100% Verified** | Loại trừ toàn bộ Category, Target, Service bị tắt (`isActive: false`) |

---

## 3. Phân biệt Rõ ràng: Model Confidence vs. Cosine Similarity vs. Ranking Score

Nhằm ngăn chặn việc hiển thị điểm số gây hiểu nhầm cho khách hàng:

1. **Model Confidence (Độ tự tin Mô hình)**:
   - Là xác suất đầu ra sau hàm Softmax của YOLOv8n-cls hoặc Ensemble giữa YOLO và CLIP.
   - Chỉ xuất hiện khi mô hình Deep Learning thực thi và phân loại danh mục (ví dụ: `confidence: 0.6317`).
2. **Cosine Similarity (Độ tương đồng Vector)**:
   - Là tích vô hướng giữa vector ảnh đã chuẩn hóa và vector văn bản của thiết bị: $\text{Sim} = \frac{\mathbf{v}_{\text{img}} \cdot \mathbf{v}_{\text{text}}}{\|\mathbf{v}_{\text{img}}\| \|\mathbf{v}_{\text{text}}\|}$.
   - Dao động trong khoảng $[-1, 1]$ (thực tế từ $0.15$ đến $0.40$).
3. **Ranking Score / Match Score (Điểm Xếp hạng Dịch vụ)**:
   - Là điểm ưu tiên nghiệp vụ trong bộ lọc Backend (`service-ranker.js`):
     - Khớp chính xác mã triệu chứng: `rankingScore = 100` (nhưng `confidence: null` vì đây là luật suy diễn, không phải xác suất mô hình).
     - Khớp từ khóa mô tả: `rankingScore = 50 + hits * 15`.
     - Phù hợp danh mục chung: `rankingScore = 50`.
   - **Tuyệt đối không gán `confidence = 0.95` cho quy tắc nghiệp vụ.**
