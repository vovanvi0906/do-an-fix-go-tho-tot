# Kiến trúc Hiện tại và Mục tiêu (Current-to-Target Architecture)

## 1. Bối cảnh và Đánh giá Hiện trạng (Baseline Audit)

Tại thời điểm baseline (`integration/fixgo-sprint-02`), hệ thống chẩn đoán và đề xuất dịch vụ gặp các vấn đề nghiêm trọng về tính đúng đắn (correctness) và toàn vẹn dữ liệu:

1. **FastAPI JSON Description bị bỏ qua**: Endpoint `diagnose` chỉ đọc `imageUrl` từ request JSON, khiến mô tả sự cố của khách hàng hoàn toàn bị mất trong nhánh gọi từ NestJS.
2. **Backend bỏ qua kết quả Target/Service từ AI**: `diagnosis-resolver.js` chỉ lấy `ai.suggestedCategoryId` và điểm `confidence`, toàn bộ suy luận về thiết bị cụ thể bị vứt bỏ.
3. **Danh mục dịch vụ tĩnh (Static Catalog)**: AI Service dựa vào danh sách tĩnh `SUB_SERVICES_CATALOG` gồm đúng 25 dịch vụ, trong khi cơ sở dữ liệu thực tế có 693 dịch vụ thương mại, 70 đối tượng và 6 danh mục.
4. **Vi phạm quan hệ Category - Target - Service**: Target softmax tính trên toàn bộ 70 targets mà không lọc theo category; service fallback tự động gán phần tử đầu tiên của danh mục với điểm nhân hệ số tùy ý `score * 0.92`.
5. **Thiếu kiểm tra trạng thái hoạt động (Active status)**: Resolver và AI Service không kiểm tra `target.isActive` và `service.isActive`, dẫn đến nguy cơ đề xuất dịch vụ đã bị vô hiệu hóa.
6. **Đồng bộ Catalog thiếu tin cậy**: Khi Admin cập nhật Category hoặc Service, AI Service không được kích hoạt làm mới embeddings; bộ đệm RAM không có versioning.

## 2. Kiến trúc Đích (Target Architecture)

Hệ thống được tái cấu trúc theo mô hình phân tách trách nhiệm rõ ràng:

```mermaid
flowchart TD
    subgraph MobileApp["Customer Mobile App"]
        Photo["Chụp / Chọn ảnh + Mô tả sự cố"]
        TargetCard["Xác nhận Đối tượng (Đúng / Đổi thiết bị)"]
        SymptomQ["Trả lời Triệu chứng (Theo đối tượng)"]
        ServiceList["Dịch vụ đề xuất Top-k (Kèm lý do & giá thực)"]
        BookingScreen["Xác nhận & Chuyển sang Booking Flow"]
    end

    subgraph Backend["NestJS Backend"]
        OrdersCtrl["OrdersController: /orders/diagnose-upload & /diagnose"]
        DiagResolver["DiagnosisResolver (Orchestrator)"]
        SymptomTax["SymptomTaxonomy (Dynamic Question Generator)"]
        ServiceRanker["ServiceRanker (Target-scoped DB Ranking)"]
        CatalogDB[("PostgreSQL Database (Source of Truth)")]
        AdminSvc["AdminService (CRUD + notifyAiServiceSync)"]
    end

    subgraph AIService["FastAPI AI Service"]
        V2Router["Recommendation Router (/ai/v2/diagnose)"]
        YoloClip["Ensemble Category Classifier (YOLOv8 + CLIP)"]
        TargetMatcher["Category-Scoped Target Matcher (CLIP ViT-B/32)"]
        CatalogMgr["Catalog Manager (Atomic Swap & Versioned Embeddings)"]
    end

    Photo --> OrdersCtrl
    OrdersCtrl --> DiagResolver
    DiagResolver --> V2Router
    V2Router --> YoloClip
    V2Router --> TargetMatcher
    YoloClip --> V2Router
    TargetMatcher --> V2Router
    V2Router --> DiagResolver
    DiagResolver --> CatalogDB
    DiagResolver --> SymptomTax
    DiagResolver --> ServiceRanker
    DiagResolver --> TargetCard
    TargetCard --> SymptomQ
    SymptomQ --> ServiceList
    ServiceList --> BookingScreen
    AdminSvc --> CatalogDB
    AdminSvc -.->|"notifyAiServiceSync()"| CatalogMgr
```

## 3. Luồng Tương tác Dữ liệu Chi tiết

```mermaid
sequenceDiagram
    actor C as Khách hàng
    participant APP as Customer App
    participant BE as NestJS Backend
    participant DB as PostgreSQL
    participant AI as FastAPI AI Service

    Note over C,AI: Bước 1: Quét ảnh & Phân tích ban đầu
    C->>APP: Chọn ảnh sự cố + nhập mô tả
    APP->>BE: POST /orders/diagnose-upload (Multipart)
    BE->>AI: POST /ai/v2/diagnose (imageUrl + description)
    AI-->>BE: categoryCandidates, targetCandidates, observableSigns
    BE->>DB: Query active categories & targets
    BE-->>APP: status: needs_more_info, targetCandidates, questions

    Note over C,AI: Bước 2: Khách hàng xác nhận đối tượng
    C->>APP: Nhấn "Đúng thiết bị này" hoặc chọn thiết bị khác
    APP->>BE: POST /orders/diagnose (categoryId + targetId)
    BE->>DB: Query active services của targetId
    BE-->>APP: questions (câu hỏi triệu chứng theo thiết bị)

    Note over C,AI: Bước 3: Xác nhận triệu chứng & Đề xuất dịch vụ
    C->>APP: Chọn triệu chứng (ví dụ: "Không hoạt động")
    APP->>BE: POST /orders/diagnose (categoryId + targetId + symptom)
    BE->>DB: Query active services, lọc & rank top-k
    BE-->>APP: status: suggested, suggestedServices (giá DB, lý do, unit)

    Note over C,AI: Bước 4: Đặt lịch dịch vụ
    C->>APP: Khách hàng xác nhận dịch vụ đề xuất
    APP->>BE: POST /orders (Tạo đơn đặt lịch với giá Server)
    BE->>DB: Kiểm tra tính hợp lệ & ghi đơn hàng
```
