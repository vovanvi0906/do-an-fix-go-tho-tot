# QUY CHUẨN PHÁT TRIỂN MODULE AI & COMPUTER VISION (AI-SERVICE RULES)
## DỰ ÁN: ON-DEMAND HOME SERVICE PLATFORM WITH AI/CV

---

## 1. VAI TRÒ & NGUYÊN TẮC CỐT LÕI

* **Phạm vi hoạt động:** `ai-service` là một Microservice độc lập viết bằng **Python FastAPI**, chuyên trách xử lý các tác vụ tính toán nặng, thị giác máy tính và Deep Learning suy luận (inference)[cite: 1, 2].
* **Không lưu trữ trạng thái đơn hàng:** Microservice này không can thiệp vào nghiệp vụ database chính (không kết nối trực tiếp đến bảng `orders` hay `wallets` của NestJS)[cite: 1, 2]. Chỉ nhận dữ liệu đầu vào (ảnh, vector đặc trưng), xử lý và trả về kết quả định lượng[cite: 1, 2].
* **Xác thực nội bộ bắt buộc:** Mọi endpoint nội bộ đều phải được bảo vệ bằng header `x-internal-api-key` thông qua FastAPI Dependency Injection. Từ chối ngay các request không có key hợp lệ với HTTP 403 Forbidden.
* **Quản lý tài nguyên mô hình (Model Lifespan):** Tuyệt đối **không** khởi tạo hoặc tải lại trọng số mô hình (weights) bên trong các hàm xử lý request. Toàn bộ mô hình AI (YOLO, ArcFace/RetinaFace) phải được load duy nhất 1 lần vào bộ nhớ khi service khởi động thông qua cơ chế `lifespan` của FastAPI[cite: 1, 2].

---

## 2. CẤU TRÚC THƯ MỤC CHUẨN (`ai-service/`)

Mọi code mới hoặc tái cấu trúc trong thư mục `ai-service/` phải tuân thủ nghiêm ngặt cây thư mục sau:

```text
ai-service/
├── app/
│   ├── api/
│   │   ├── dependencies.py       # Dependency verify x-internal-api-key
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── incident.py   # Pipeline 1: Nhận diện lỗi hư hỏng
│   │   │   │   ├── face.py       # Pipeline 2: Xác thực khuôn mặt thợ
│   │   │   │   └── validation.py # Pipeline 3: Nghiệm thu Before-After
│   │   │   └── router.py         # Gom nhóm API v1
│   ├── core/
│   │   ├── config.py             # Settings (pydantic-settings, load .env)
│   │   ├── exceptions.py         # Custom AI Exceptions
│   │   └── lifespan.py           # Quản lý nạp mô hình vào app.state
│   ├── models/                   # Thư mục chứa trọng số weights (.pt, .onnx)
│   │   ├── yolo_incident.pt
│   │   └── arcface.onnx
│   ├── schemas/                  # Pydantic schemas (Request & Response)
│   │   ├── incident_schema.py
│   │   ├── face_schema.py
│   │   └── validation_schema.py
│   ├── services/                 # Business logic thuật toán AI/CV
│   │   ├── incident_service.py   # Wrapper chạy YOLO inference
│   │   ├── face_service.py       # Wrapper RetinaFace + Cosine Similarity
│   │   └── validation_service.py # SSIM, ORB, Diff detector
│   └── utils/
│       ├── image_ops.py          # Decode bytes, resize, crop, normalize
│       └── logger.py             # Cấu hình logging chuẩn hóa
├── Dockerfile
├── requirements.txt
├── .env.example
└── main.py                       # Điểm khởi chạy ứng dụng