# Sơ đồ kết nối giữa Backend, Frontend và AI-Service# TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)
## HỆ THỐNG KẾT NỐI DỊCH VỤ GIA ĐÌNH ON-DEMAND TÍCH HỢP XỬ LÝ ẢNH & AI

---

## 1. TỔNG QUAN HỆ THỐNG & NGUYÊN LÝ THIẾT KẾ

### 1.1 Bối cảnh hệ thống
Hệ thống là nền tảng trung gian cung cấp dịch vụ gia đình theo mô hình On-Demand (sửa chữa điện nước, điện lạnh, dọn dẹp gia đình) kết nối 3 đối tượng chính:
* **Khách hàng (Customer):** Đặt dịch vụ, tra cứu vị trí thợ thời gian thực, chụp ảnh sự cố để AI phân tích, nghiệm thu công việc và thanh toán.
* **Người lao động / Thợ (Worker):** Nhận cuốc thợ theo thuật toán quét vị trí gần nhất, xác thực sinh trắc học khuôn mặt trước khi làm việc, nộp ảnh nghiệm thu và quản lý thu nhập qua ví điện tử.
* **Quản trị viên (Admin):** Phê duyệt hồ sơ thợ (KYC), cấu hình tỷ lệ hoa hồng chiết khấu cho sàn, giám sát các giao dịch tài chính và giải quyết khiếu nại.

### 1.2 Các nguyên lý kiến trúc cốt lõi
* **Tách biệt mối quan tâm (Separation of Concerns):** Tách bạch rõ rệt giữa Backend Nghiệp vụ (NestJS) và Service Tính toán nặng / AI Inference (Python FastAPI).
* **Kiến trúc hướng sự kiện thời gian thực (Event-Driven Realtime):** Sử dụng WebSocket (Socket.io) và Redis Pub/Sub phục vụ định vị GPS của thợ, cập nhật trạng thái đơn hàng và nhắn tin trực tiếp.
* **Bảo toàn dữ liệu tài chính (ACID & Transactional Integrity):** Áp dụng Database Transaction chặt chẽ kết hợp Distributed Lock (Redis Redlock) khi tính toán khấu trừ hoa hồng và biến động số dư ví.
* **Tối ưu hóa truy vấn không gian (Geospatial Optimization):** Ứng dụng PostGIS (PostgreSQL) với chỉ mục GiST để tính toán khoảng cách cầu học (Haversine/Spherical distance) và quét bán kính tìm thợ trong phạm vi $R$ km với độ trễ thấp (< 50ms).

---

## 2. KIẾN TRÚC TỔNG THỂ (HIGH-LEVEL ARCHITECTURE)

Hệ thống được thiết kế theo mô hình **Hybrid Modular Monolith & Microservice**, trong đó:
1. **NestJS Backend Core** đóng vai trò API Gateway, quản lý toàn bộ luồng nghiệp vụ, giao dịch ví, quản lý trạng thái đơn hàng và WebSocket Server.
2. **AI Microservice (FastAPI)** đóng vai trò một Dedicated Worker chuyên sâu về thị giác máy tính và Deep Learning.

```mermaid
flowchart TB
    subgraph Client_Layer ["Client Layer"]
        MobileCust["Customer Mobile App\n(Flutter / React Native)"]
        MobileWork["Worker Mobile App\n(Flutter / React Native)"]
        WebAdmin["Admin Dashboard Web\n(ReactJS / Vite)"]
    end

    subgraph Gateway_Proxy ["Edge / Reverse Proxy Layer"]
        Nginx["Nginx Reverse Proxy & Load Balancer\n(SSL Termination, Rate Limiting)"]
    end

    subgraph Core_Backend ["Backend Core (NestJS Modular Monolith)"]
        AuthModule["Auth & IAM Module\n(JWT, RBAC)"]
        OrderModule["Order & Dispatch Engine\n(State Machine)"]
        GeoModule["Geospatial & Tracking Service\n(PostGIS Queries)"]
        WalletModule["Wallet & Payment Settlement\n(Ledger Engine)"]
        SocketGateway["WebSocket Gateway\n(Socket.io Server)"]
    end

    subgraph AI_Subsystem ["AI Microservice (Python FastAPI)"]
        FastAPIGw["FastAPI Runner\n(Uvicorn)"]
        YoloWorker["YOLOv8 Engine\n(Incident Detection)"]
        FaceWorker["ArcFace / RetinaFace\n(Face Verification)"]
        DiffWorker["Diff Inspection Engine\n(Before-After Validation)"]
    end

    subgraph Data_Storage ["Persistence & Cache Layer"]
        PG[(PostgreSQL + PostGIS Ext)]
        Redis[(Redis Cache & Pub/Sub)]
        S3Bucket[("Object Storage (S3 / Cloudinary)\nMedia & Photos")]
    end

    MobileCust -->|HTTPS / WSS| Nginx
    MobileWork -->|HTTPS / WSS| Nginx
    WebAdmin -->|HTTPS| Nginx

    Nginx -->|Proxy HTTP :3000| Core_Backend
    Nginx -->|Proxy WSS :3000| SocketGateway

    Core_Backend -->|Internal REST :8000\n(x-internal-api-key)| FastAPIGw
    FastAPIGw --> YoloWorker
    FastAPIGw --> FaceWorker
    FastAPIGw --> DiffWorker

    Core_Backend -->|Prisma ORM| PG
    Core_Backend -->|ioredis| Redis
    SocketGateway <-->|Pub/Sub State| Redis
    
    Core_Backend -->|Upload / Presigned URL| S3Bucket
    AI_Subsystem -->|Fetch Media| S3Bucket