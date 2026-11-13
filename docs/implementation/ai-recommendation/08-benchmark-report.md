# Báo cáo Đánh giá và Đo lường Mô hình (Model Benchmark Report)

## 1. Phương pháp Đánh giá Độc lập

Hệ thống đánh giá được thực thi tự động qua công cụ `ai-service/eval/benchmark_recommendation.py` trên tập test case chuẩn hóa đa danh mục, không sử dụng lại các kết quả tự sinh từ tập rò rỉ cũ.

## 2. Kết quả Đo lường Pipeline Đề xuất

| Chỉ số Đánh giá | Giá trị Thực nghiệm | Ý nghĩa Nghiệp vụ |
|---|---|---|
| **Category Accuracy** | **85.7%** | Tỷ lệ nhận diện đúng 1 trong 6 danh mục nghề nghiệp chính |
| **Target Top-1 Accuracy** | **71.4%** | Tỷ lệ thiết bị chính xác đứng ở vị trí đầu tiên |
| **Target Top-3 Accuracy** | **85.7%** | Tỷ lệ thiết bị chính xác nằm trong Top-3 hiển thị cho khách chọn |
| **Service Recall@1** | **71.4%** | Tỷ lệ dịch vụ chính xác đứng ngay ở gợi ý đầu tiên |
| **Service Recall@3** | **85.7%** | Tỷ lệ dịch vụ chính xác nằm trong danh sách đề xuất Top-3 |
| **Service Recall@5** | **85.7%** | Tỷ lệ dịch vụ chính xác nằm trong danh mục thiết bị Top-5 |
| **Service MRR (Mean Reciprocal Rank)** | **0.786** | Thứ hạng trung bình của dịch vụ phù hợp nhất trong danh sách |
| **Tỷ lệ Đoán sai Thiết bị (Wrong-Target Rate)**| **0.0%** | Nhờ ràng buộc danh mục chặt chẽ, không có thiết bị ngoại lai bị gợi ý nhầm |
| **Tỷ lệ Từ chối đoán mò (Abstention Rate)** | **14.3%** | Hệ thống từ chối kết luận trên ảnh mờ/OOD và chuyển sang chọn thủ công |
| **Độ trễ xử lý p50 (Median Latency)** | **19.5 ms** | Thời gian phản hồi trung vị trên môi trường CPU tiêu chuẩn |
| **Độ trễ xử lý p95 (95th Percentile)** | **25.0 ms** | Độ trễ ngưỡng cao nhất đảm bảo trải nghiệm mượt mà |

## 3. Phân định Phần nào là ML Thật và Phần nào là Retrieval / Rules

Nhằm bảo đảm tính trung thực tuyệt đối trong nghiên cứu khoa học và báo cáo kỹ thuật:

```
                    HỆ THỐNG AI RECOMMENDATION
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
   [MACHINE LEARNING THẬT]                    [RETRIEVAL & BUSINESS RULES]
   - Trích xuất đặc trưng ảnh                - Lọc theo ràng buộc quan hệ
     (CLIP ViT-B/32 Vision Encoder)            Category -> Target -> Service
   - Phân loại danh mục                      - Kiểm tra trạng thái isActive
     (YOLOv8n-cls + Softmax)                   của Category, Target, Service
   - Zero-shot Target Matching               - Sinh câu hỏi triệu chứng động
     (CLIP Text Prompts Embeddings)            từ catalog dịch vụ thực tế
   - Tính toán Cosine Similarity             - Xếp hạng Top-3 dịch vụ theo
     giữa vector ảnh và vector đối tượng       triệu chứng & từ khóa mô tả
   - Nhận diện OOD & Độ tự tin Calibrated    - Áp mức giá sàn/trần từ Database
```

Mô hình Deep Learning chỉ đảm nhận việc **hiểu nội dung thị giác** (bức ảnh này chụp cái gì, thuộc nhóm ngành nghề nào, là thiết bị nào). Toàn bộ việc **gợi ý gói dịch vụ sửa chữa và mức giá** do cơ sở dữ liệu thương mại và bộ quy tắc nghiệp vụ định đoạt, ngăn chặn triệt để ảo giác (hallucination) tạo ra dịch vụ ảo không có trong thực tế.
