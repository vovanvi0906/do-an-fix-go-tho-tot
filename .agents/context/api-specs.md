# TÀI LIỆU ĐẶC TẢ API CHI TIẾT (API SPECIFICATIONS)
## HỆ THỐNG DỊCH VỤ GIA ĐÌNH ON-DEMAND TÍCH HỢP XỬ LÝ ẢNH & AI

---

## 1. QUY ƯỚC CHUNG (GENERAL CONVENTIONS)

### 1.1 Base URLs
* **Backend API Gateway (NestJS):** `http://localhost:3000/api/v1` (Production: `https://api.mooniverse-home.vn/api/v1`)
* **AI Microservice (Python FastAPI):** `http://localhost:8000/api/v1` (Internal Gateway: `http://ai-service:8000/api/v1`)
* **WebSocket Gateway (Socket.io):** `ws://localhost:3000/socket.io`

### 1.2 Authentication & Security
* **Authentication Header:** `Authorization: Bearer <access_token>`
* **Internal API Key (Giữa NestJS và FastAPI):** `x-internal-api-key: <AI_SERVICE_SECRET_KEY>`
* **Role-Based Access Control (RBAC):**
  * `CUSTOMER`: Người dùng có nhu cầu đặt dịch vụ gia đình.
  * `WORKER`: Thợ kỹ thuật / Người lao động cung cấp dịch vụ.
  * `ADMIN`: Quản trị viên hệ thống (Vận hành, kế toán, duyệt KYC).

### 1.3 Cấu trúc Response chuẩn (Standard Response Format)

#### Success Response (HTTP 200, 201)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Mô tả kết quả thành công",
  "data": {},
  "timestamp": "2026-09-13T16:20:00.000Z"
}
```

#### Error Response (HTTP 400, 401, 403, 404, 422, 500)
```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "INVALID_INPUT_DATA",
  "message": "Thông tin đầu vào không hợp lệ",
  "errors": [
    {
      "field": "phone",
      "message": "Số điện thoại không đúng định dạng"
    }
  ],
  "timestamp": "2026-09-13T16:20:00.000Z"
}
```

---

## 2. PHÂN HỆ XÁC THỰC & NGƯỜI DÙNG (AUTH & USERS)

### 2.1 Đăng ký Khách hàng (Customer Register)
* **Endpoint:** `POST /auth/register/customer`
* **Quyền:** Public
* **Request Body:**
```json
{
  "phone": "0987654321",
  "password": "SecurePassword123@",
  "fullName": "Võ Văn Vĩ",
  "email": "vovanvi@example.com"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Đăng ký tài khoản khách hàng thành công",
  "data": {
    "userId": "usr_cust_01J7K8M9",
    "phone": "0987654321",
    "role": "CUSTOMER"
  }
}
```

### 2.2 Đăng ký Người lao động / Thợ (Worker Register & KYC)
* **Endpoint:** `POST /auth/register/worker`
* **Quyền:** Public
* **Request Body (`multipart/form-data`):**
  * `phone` (string, required): "0912345678"
  * `password` (string, required): "SecurePassword123@"
  * `fullName` (string, required): "Nguyễn Văn Thợ"
  * `email` (string, optional): "tho.nguyen@example.com"
  * `idCardNumber` (string, required): "079201008899"
  * `serviceCategoryIds` (string[] JSON): `["cat_dien_lanh", "cat_dien_nuoc"]`
  * `idCardFront` (File, required): Ảnh mặt trước CCCD
  * `idCardBack` (File, required): Ảnh mặt sau CCCD
  * `portraitPhoto` (File, required): Ảnh chân dung gốc dùng cho AI Face Verification
* **Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Hồ sơ đăng ký đã được ghi nhận. Vui lòng chờ phê duyệt KYC.",
  "data": {
    "workerId": "wrk_01J7K9AB",
    "status": "PENDING_VERIFICATION"
  }
}
```

### 2.3 Đăng nhập (Login - All Roles)
* **Endpoint:** `POST /auth/login`
* **Quyền:** Public
* **Request Body:**
```json
{
  "phone": "0987654321",
  "password": "SecurePassword123@"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "d8f3c7e2-a4b1-...",
    "expiresIn": 86400,
    "user": {
      "id": "usr_cust_01J7K8M9",
      "fullName": "Võ Văn Vĩ",
      "role": "CUSTOMER",
      "avatarUrl": "https://cdn.mooniverse.vn/avatars/u1.jpg"
    }
  }
}
```

### 2.4 Cập nhật vị trí thời gian thực của Thợ (Worker Realtime Location)
* **Endpoint:** `PATCH /workers/location`
* **Quyền:** `WORKER`
* **Request Body:**
```json
{
  "latitude": 10.776889,
  "longitude": 106.700806,
  "isOnline": true
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật vị trí GPS thành công",
  "data": {
    "lastUpdated": "2026-09-13T16:25:00.000Z"
  }
}
```

---

## 3. PHÂN HỆ AI MICROSERVICE (PYTHON FASTAPI)

### 3.1 AI Nhận diện Sự cố & Đề xuất Dịch vụ (Incident & Defect Detection)
* **Endpoint:** `POST /api/v1/ai/incident/detect`
* **Header:** `x-internal-api-key: <AI_KEY>`
* **Request:** `multipart/form-data`
  * `image`: File ảnh sự cố do khách chụp (JPG, PNG)
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "detectedIssues": [
      {
        "issueCode": "PIPE_BURST",
        "label": "Vỡ đường ống cấp nước",
        "confidence": 0.92,
        "boundingBox": {
          "xMin": 145,
          "yMin": 220,
          "xMax": 430,
          "yMax": 580
        }
      }
    ],
    "suggestedCategoryId": "cat_dien_nuoc",
    "suggestedCategoryName": "Sửa chữa Điện Nước",
    "suggestedServiceId": "srv_ong_nuoc_vo",
    "estimatedPrice": {
      "min": 150000,
      "max": 300000,
      "currency": "VND"
    }
  }
}
```

### 3.2 AI Xác thực Khuôn mặt Thợ Check-in (Face Verification)
* **Endpoint:** `POST /api/v1/ai/worker/verify-face`
* **Header:** `x-internal-api-key: <AI_KEY>`
* **Request:** `multipart/form-data`
  * `workerId` (string, required): Mã thợ
  * `liveImage` (File, required): Ảnh selfie chụp trực tiếp tại hiện trường
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "workerId": "wrk_01J7K9AB",
    "isMatched": true,
    "similarityScore": 0.885,
    "threshold": 0.68,
    "livenessVerified": true,
    "verifiedAt": "2026-09-13T16:30:15.120Z"
  }
}
```

### 3.3 AI Nghiệm thu Đối chiếu Trước & Sau (Before-After Validation)
* **Endpoint:** `POST /api/v1/ai/job/validate-completion`
* **Header:** `x-internal-api-key: <AI_KEY>`
* **Request:** `multipart/form-data`
  * `orderId` (string, required): ID đơn hàng
  * `beforeImageUrl` (string, required): URL ảnh ban đầu do khách chụp
  * `afterImage` (File, required): Ảnh nghiệm thu thợ chụp sau khi sửa xong
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "orderId": "ord_01J7M9ZZ",
    "isApproved": true,
    "defectResolved": true,
    "confidenceScore": 0.89,
    "differencesDetected": "Khu vực ống nước đã được thay mối nối mới, không còn phát hiện rò rỉ hoặc ẩm ướt",
    "recommendation": "AUTO_ACCEPT"
  }
}
```

---

## 4. PHÂN HỆ ĐẶT ĐƠN & ĐIỀU PHỐI (ORDERS & DISPATCH)

### 4.1 Khách hàng tạo yêu cầu dịch vụ (Create Order)
* **Endpoint:** `POST /orders`
* **Quyền:** `CUSTOMER`
* **Request Body:**
```json
{
  "serviceId": "srv_ong_nuoc_vo",
  "description": "Bồn rửa chén bị xì nước ngập chân tủ bếp",
  "address": "227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM",
  "latitude": 10.762918,
  "longitude": 106.682173,
  "mediaUrls": [
    "https://cdn.mooniverse.vn/orders/before_01.jpg"
  ],
  "aiDetectedIssueCode": "PIPE_BURST",
  "paymentMethod": "WALLET"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Đã tạo đơn và đang quét tìm thợ gần nhất",
  "data": {
    "orderId": "ord_01J7M9ZZ",
    "status": "SEARCHING_WORKER",
    "estimatedCost": 220000,
    "searchRadiusKm": 5.0,
    "createdAt": "2026-09-13T16:32:00.000Z"
  }
}
```

### 4.2 Thợ chấp nhận đơn hàng (Worker Accept Order)
* **Endpoint:** `POST /orders/:orderId/accept`
* **Quyền:** `WORKER`
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Nhận đơn thành công. Hãy di chuyển đến nhà khách hàng.",
  "data": {
    "orderId": "ord_01J7M9ZZ",
    "status": "ACCEPTED",
    "customer": {
      "name": "Võ Văn Vĩ",
      "phone": "0987654321",
      "address": "227 Nguyễn Văn Cừ, Quận 5, TP.HCM"
    }
  }
}
```

### 4.3 Thợ Check-in bắt đầu làm (Worker Face Check-in)
* **Endpoint:** `POST /orders/:orderId/check-in`
* **Quyền:** `WORKER`
* **Request:** `multipart/form-data`
  * `selfieImage`: File ảnh selfie tại địa điểm của khách
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xác thực khuôn mặt thành công. Bắt đầu tính giờ làm việc.",
  "data": {
    "orderId": "ord_01J7M9ZZ",
    "status": "IN_PROGRESS",
    "checkinTime": "2026-09-13T16:45:00.000Z"
  }
}
```

### 4.4 Thợ nộp kết quả nghiệm thu (Worker Complete Job)
* **Endpoint:** `POST /orders/:orderId/complete`
* **Quyền:** `WORKER`
* **Request:** `multipart/form-data`
  * `proofImage`: File ảnh chụp kết quả sau khi hoàn thành
  * `note`: Ghi chú sửa chữa bổ sung
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "AI đã đối soát hình ảnh thành công. Chuyển trạng thái sang chờ nghiệm thu.",
  "data": {
    "orderId": "ord_01J7M9ZZ",
    "status": "COMPLETED_PENDING_CONFIRMATION",
    "aiValidation": {
      "isApproved": true,
      "confidence": 0.89
    }
  }
}
```

### 4.5 Khách hàng nghiệm thu & Hoàn tất đơn hàng (Customer Confirm & Pay)
* **Endpoint:** `POST /orders/:orderId/confirm-payment`
* **Quyền:** `CUSTOMER`
* **Request Body:**
```json
{
  "rating": 5,
  "comment": "Thợ đến nhanh, sửa rất sạch sẽ cẩn thận!"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thanh toán và nghiệm thu đơn hàng thành công",
  "data": {
    "orderId": "ord_01J7M9ZZ",
    "status": "SETTLED",
    "financialSummary": {
      "totalAmount": 220000,
      "platformCommissionRate": 0.15,
      "platformFee": 33000,
      "workerNetEarnings": 187000
    }
  }
}
```

---

## 5. PHÂN HỆ TÀI CHÍNH & VÍ ĐIỆN TỬ (WALLET & FINANCIAL)

### 5.1 Xem số dư ví (Get Wallet Balance)
* **Endpoint:** `GET /wallets/me`
* **Quyền:** `CUSTOMER` / `WORKER`
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "walletId": "wlt_01J7N8XX",
    "balance": 1850000,
    "currency": "VND",
    "pendingHold": 0,
    "status": "ACTIVE"
  }
}
```

### 5.2 Lịch sử giao dịch ví (Wallet Transactions)
* **Endpoint:** `GET /wallets/transactions?page=1&limit=10`
* **Quyền:** `CUSTOMER` / `WORKER`
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "tx_99812",
        "type": "EARNING",
        "amount": 187000,
        "description": "Thu nhập đơn hàng ord_01J7M9ZZ (Đã trừ 15% phí sàn)",
        "createdAt": "2026-09-13T17:15:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10
    }
  }
}
```

### 5.3 Thợ gửi yêu cầu rút tiền (Withdrawal Request)
* **Endpoint:** `POST /wallets/withdraw`
* **Quyền:** `WORKER`
* **Request Body:**
```json
{
  "amount": 1000000,
  "bankCode": "MBBANK",
  "bankAccountNumber": "098765432100",
  "accountHolderName": "NGUYEN VAN THO"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Yêu cầu rút tiền đã được tạo và chuyển sang trạng thái chờ xử lý",
  "data": {
    "withdrawalId": "wtd_01J7P1AA",
    "amount": 1000000,
    "status": "PROCESSING"
  }
}
```

---

## 6. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN DASHBOARD)

### 6.1 Quản lý tỷ lệ chiết khấu sàn (Update Platform Commission Rate)
* **Endpoint:** `PATCH /admin/settings/commission`
* **Quyền:** `ADMIN`
* **Request Body:**
```json
{
  "defaultRate": 0.15,
  "categoryOverrides": [
    {
      "categoryId": "cat_dien_lanh",
      "rate": 0.18
    }
  ]
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật chính sách chiết khấu hoa hồng thành công"
}
```

### 6.2 Phê duyệt hồ sơ thợ (Approve Worker KYC)
* **Endpoint:** `PATCH /admin/workers/:workerId/verify`
* **Quyền:** `ADMIN`
* **Request Body:**
```json
{
  "status": "APPROVED",
  "rejectionReason": null
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã phê duyệt tài khoản người lao động thành công"
}
```

---

## 7. ĐẶC TẢ SỰ KIỆN THỜI GIAN THỰC (WEBSOCKET / SOCKET.IO)

* **Namespace:** `/gateway`
* **Xác thực:** Gửi qua `auth: { token: "Bearer <token>" }` khi handshake.

| Tên Sự kiện (Event) | Hướng truyền (Direction) | Payload tóm tắt | Mô tả |
| :--- | :--- | :--- | :--- |
| `order:new_available` | Server $
ightarrow$ Client (Worker) | `{ orderId, category, distanceKm, coordinates }` | Thông báo đơn mới cho các thợ trong bán kính quét PostGIS. |
| `worker:location_update` | Client (Worker) $
ightarrow$ Server | `{ latitude, longitude, bearing }` | Thợ phát tọa độ định kỳ 3-5 giây/lần khi đang di chuyển đến nhà khách. |
| `order:tracking` | Server $
ightarrow$ Client (Customer) | `{ orderId, workerLocation: { lat, lng } }` | Khách xem thợ di chuyển trên bản đồ trực thơi gian thực. |
| `order:status_changed` | Server $
ightarrow$ Both | `{ orderId, status, timestamp }` | Đồng bộ trạng thái đơn (ACCEPTED, IN_PROGRESS, SETTLED). |
| `chat:send_message` | Client $
ightarrow$ Server | `{ orderId, message, senderId }` | Chat trực tiếp giữa Khách và Thợ trong phiên làm việc. |
| `chat:new_message` | Server $
ightarrow$ Client | `{ orderId, message, senderId, sentAt }` | Nhận tin nhắn chat mới theo thời gian thực. |