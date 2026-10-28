# BÁO CÁO TOÀN DIỆN TIẾN ĐỘ DỰ ÁN FIXGO (FIXGO PRO)
> **Đề tài:** Xây dựng hệ thống phần mềm kết nối dịch vụ gia đình theo mô hình On-Demand tích hợp xử lý ảnh và AI  
> **Thời điểm đánh giá:** 28/10/2026 (Sau khi hoàn tất đợt tích hợp AI Soft-Voting)  
> **Người đánh giá:** Tech Lead & QA Lead cầu toàn  

---

## 📊 TỔNG QUAN TIẾN ĐỘ TOÀN DỰ ÁN: ~72%
```
[██████████████████████░░░░░░░░] 72% Hoàn thành
```
* **Backend (NestJS + Prisma + PostGIS + Redis + Socket.io):** ~**85%** (Rất tốt, nghiệp vụ lõi, bảo mật OTP, Google OAuth, phân bổ đơn gần như hoàn thiện).
* **AI Service (FastAPI + YOLOv8-cls + CLIP ViT-B/32 + YuNet/SFace):** ~**80%** (Đã train model YOLO 1.200 ảnh, tích hợp Soft-Voting Ensemble 2 tầng, nhận diện tốt cả khi không có text).
* **Mobile App (React Native Expo Router):** ~**60%** (Phía Khách hàng làm khá chi tiết, nhưng phía Thợ và 2 màn hình AI camera còn bỏ dở dạng mock).
* **Web Admin Dashboard (React Vite + Tailwind):** ~**65%** (Giao diện đẹp, đã có quản lý User/Worker/Services và trang Cấu hình % hoa hồng động; còn thiếu trang giải quyết tranh chấp).

---

## PHẦN 1: ĐÁNH GIÁ CHI TIẾT THỰC TRẠNG AI-SERVICE (ĐÁP ỨNG ĐƯỢC BAO NHIÊU?)

Mục tiêu đề tài yêu cầu 3 tính năng AI:
1. Gợi ý sự cố & dịch vụ từ ảnh (**Incident Diagnosis**).
2. Xác thực khuôn mặt thợ (**Face Verification**).
3. Nghiệm thu trước - sau (**Before - After Verification**).

### 1.1. Chẩn đoán sự cố (`/ai/diagnose`): **Đáp ứng 85%**
* **Hiện trạng trong code:**
  * Đã chuyển đổi thành công sang kiến trúc **Tam giác Biểu quyết (Tri-Model Ensemble)**:
    1. **YOLOv8n-cls** (`yolov8n-cls-fixgo.pt` 2.84MB) đã được huấn luyện chính thức trên **1.200 ảnh sự cố 6 lớp**.
    2. **OpenAI CLIP ViT-B/32 Zero-Shot** với bộ prompt tiếng Anh & tiếng Việt mới giàu đặc trưng thị giác.
    3. Thuật toán **Soft-Voting Ensemble** kết hợp: $P_{Final} = 0.60 \times P_{YOLO} + 0.40 \times P_{CLIP}$.
    4. Heuristics fallback và trích xuất dịch vụ con (Sub-service) kèm dải giá tiền tự động.
* **Kết quả thực nghiệm:**
  * Gửi ảnh `dien_lanh_0011.jpg` thuần túy (không nhập mô tả) $\rightarrow$ YOLO đạt 99.7%, CLIP đạt 30.6%, điểm tổng hợp 72.1% $\rightarrow$ Tự động ra danh mục **Điện lạnh** và dịch vụ **Vệ sinh máy lạnh treo tường** (150.000đ - 220.000đ).
* **Điểm cần khắc phục:**
  * Cần thêm bộ test tự động đo đạc F1-score / Confusion Matrix trên tập test 120 ảnh để đưa biểu đồ vào báo cáo đồ án.

### 1.2. Xác thực khuôn mặt thợ (`/ai/face-verify`): **Đáp ứng 75% ở AI, nhưng mới 20% trên App Mobile**
* **Hiện trạng trong code:**
  * Backend AI dùng ONNX: **YuNet** (Face Detection) + **SFace** (Face Recognition Cosine Similarity) chạy siêu nhẹ trên CPU.
  * Backend NestJS (`orders.service.js`) đã có cơ chế phân luồng ngưỡng tin cậy (ngưỡng 0.6, thấp hơn thì chuyển Admin Audit Queue).
* **Điểm yếu trên Mobile:**
  * Trên Mobile App thợ, file [`app/(worker)/verification/face.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(worker)/verification/face.jsx) hiện tại **chỉ là mockup tĩnh (33 dòng UI)**, chưa tích hợp Camera selfie thực tế và chưa gọi API.

### 1.3. Nghiệm thu Before - After (`/ai/compare-before-after`): **Đáp ứng 65% ở AI, mới 10% trên Mobile**
* **Hiện trạng trong code:**
  * Backend AI dùng thuật toán so khớp **SSIM (Structural Similarity Index)** kết hợp **CLIP Image Feature Cosine Similarity**.
* **Điểm yếu trên Mobile:**
  * Thợ sau khi làm xong việc chưa có nút bấm mở Camera chụp ảnh "After" trên app để bắn lên đối chiếu với ảnh "Before" của khách.

---

## PHẦN 2: BẢNG KIỂM TRA CHỨC NĂNG HỆ THỐNG THEO ĐỀ TÀI

| Phân hệ / Nghiệp vụ | Trạng thái | Đánh giá của Lead / Tester |
|---|---|---|
| **1. Đăng nhập & Xác thực** | **HOÀN THÀNH (95%)** | Google Login (Firebase), Phone OTP (eSMS), JWT Guards, RBAC hoạt động tốt sau các bản vá. |
| **2. Quét thợ gần nhất (PostGIS)** | **HOÀN THÀNH (90%)** | Dùng PostgreSQL `ST_DWithin`, Geolocation, bán kính động 5km-15km chạy chuẩn. |
| **3. Dispatch & Nhận đơn thời gian thực** | **HOÀN THÀNH (75%)** | Socket.io phát sóng đơn (`order.new`), đếm ngược 30s, chống tranh chấp Race Condition (HTTP 409) tốt. Cần bổ sung hiển thị lộ trình di chuyển của thợ trên bản đồ. |
| **4. AI Chẩn đoán sự cố** | **HOÀN THÀNH (85%)** | App khách hàng đã có `AiScanModal`, chụp ảnh gửi phân tích Soft-Voting Ensemble gợi ý đúng dịch vụ + giá tiền. |
| **5. AI Xác thực khuôn mặt** | **CHƯA HOÀN THIỆN (35%)** | AI backend đã có API, nhưng App Mobile Thợ hoàn toàn chưa có Camera selfie đối chiếu. |
| **6. AI Nghiệm thu Before/After** | **CHƯA HOÀN THIỆN (30%)** | AI service và Backend Orders có API nhưng Mobile chưa có luồng Thợ chụp ảnh sau khi làm. |
| **7. Thanh toán & Trích xuất % hoa hồng** | **HOÀN THÀNH (75%)** | Backend đã có logic tách tiền `commissionRate = 15%` vào ví Admin và ví Thợ. Đã có tích hợp VNPAY sandbox. App Mobile mới dừng ở giao diện chọn phương thức. |
| **8. Web Admin Dashboard** | **HOÀN THÀNH (65%)** | Quản lý User/Worker/Services tốt. **ĐÃ CÓ** trang cấu hình % hoa hồng động (`SystemSettingsPage.jsx`). **CHƯA CÓ** trang giải quyết tranh chấp (Dispute Resolution). |
| **9. App Thợ (Worker App)** | **CHƯA HOÀN THIỆN (40%)** | Mới có Dashboard nhận đơn; màn hình Chi tiết công việc [`(worker)/job/[id].jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(worker)/job/[id].jsx) và các tab thu nhập/hồ sơ vẫn là UI mẫu tĩnh. |

---

## PHẦN 3: CHI TIẾT CÁC GIAO DIỆN CHƯA LÀM & CHƯA HOÀN THIỆN

### 📱 1. PHÂN HỆ MOBILE KHÁCH HÀNG (CUSTOMER APP)
| File giao diện | Hiện trạng | Những việc cần làm để hoàn thiện |
|---|---|---|
| [`app/(user)/order/[id].jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(user)/order/[id].jsx) | **Chưa hoàn thiện** (Có UI hiển thị tiến độ và hủy đơn, nhưng chưa có luồng xem kết quả AI nghiệm thu và bấm Xác nhận nghiệm thu) | - Thêm component hiển thị ảnh Trước & Sau do Thợ gửi lên.<br>- Hiển thị điểm tương đồng AI (`aiMatchScore`) kèm nút **"Xác nhận nghiệm thu"** (`POST /orders/:id/accept-completion`) hoặc **"Khiếu nại / Không hài lòng"** (`POST /orders/:id/dispute`). |
| [`app/(user)/booking/confirm.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(user)/booking/confirm.jsx) | **Chưa hoàn thiện** | Kết nối trực tiếp dữ liệu từ `AiScanModal` để điền tự động địa chỉ, dịch vụ và thời gian đặt thợ vào đơn hàng. |
| [`app/(user)/profile/wallet.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(user)/profile/wallet.jsx) | **Chưa hoàn thiện** (Giao diện tĩnh) | Kết nối API ví tiền `/wallets`, hiển thị số dư ví khách và lịch sử trừ tiền cọc/hoàn tiền. |

---

### 🛠️ 2. PHÂN HỆ MOBILE NGƯỜI LAO ĐỘNG (WORKER APP) - *MỨC ĐỘ TRỐNG CAO NHẤT*
| File giao diện | Hiện trạng | Những việc cần làm để hoàn thiện |
|---|---|---|
| [`app/(worker)/verification/face.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(worker)/verification/face.jsx) | **CHƯA LÀM (Mockup rỗng 33 dòng)** | - Tích hợp `expo-camera` hoặc `expo-image-picker` chụp ảnh selfie chân dung.<br>- Thêm khung tròn hướng dẫn căn chỉnh khuôn mặt.<br>- Gọi API `POST /orders/:id/face-verify` gửi ảnh lên backend đối chiếu YuNet/SFace trước khi bấm nhận đơn hoặc bắt đầu làm việc. |
| [`app/(worker)/job/[id].jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(worker)/job/[id].jsx) | **CHƯA LÀM (Mockup rỗng 38 dòng)** | - Hiển thị bản đồ dẫn đường GPS tới nhà khách hàng.<br>- Nút bấm cập nhật trạng thái ca làm: `Bắt đầu di chuyển` $\rightarrow$ `Đã đến nơi` $\rightarrow$ `Đang sửa chữa`.<br>- **Khâu quan trọng nhất:** Nút **"Chụp ảnh nghiệm thu sau sửa chữa (After)"** $\rightarrow$ Gửi lên API `/orders/:id/complete` để kích hoạt AI so khớp. |
| [`app/(worker)/(tabs)/earnings.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(worker)/(tabs)/earnings.jsx) | **CHƯA LÀM (Mockup rỗng 33 dòng)** | - Kết nối API `/wallets` của thợ.<br>- Hiển thị tổng thu nhập, số tiền thực nhận sau khi đã **khấu trừ % hoa hồng (15%)** của hệ thống.<br>- Nút yêu cầu rút tiền về tài khoản ngân hàng. |
| [`app/(worker)/(tabs)/jobs.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(worker)/(tabs)/jobs.jsx) | **CHƯA LÀM (Mockup rỗng 33 dòng)** | - Danh sách đơn hàng lịch sử của Thợ phân theo 3 tab: `Đang làm`, `Hoàn thành`, `Đã hủy`. |
| [`app/(worker)/(tabs)/profile.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/(worker)/(tabs)/profile.jsx) | **CHƯA LÀM (Mockup rỗng 33 dòng)** | - Xem và cập nhật hồ sơ thợ (kỹ năng sửa chữa, CCCD/CMND đã duyệt, avatar, đánh giá sao từ khách). |
| [`app/common/settings.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/common/settings.jsx) & [`help.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kltn-mobile/app/common/help.jsx) | **CHƯA LÀM (Mockup rỗng 33 dòng)** | - Các màn hình cài đặt thông báo, ngôn ngữ, chính sách và trung tâm hỗ trợ cứu hộ. |

---

### 💻 3. PHÂN HỆ WEB ADMIN DASHBOARD
| File giao diện | Hiện trạng | Những việc cần làm để hoàn thiện |
|---|---|---|
| **Dispute Management (Trang giải quyết tranh chấp)** | **CHƯA LÀM (Chưa có page)** | - Tạo trang `DisputesPage.jsx` trong `features/orders/`.<br>- Cho phép Admin xem ảnh Before - After, điểm AI gợi ý, lý do khách khiếu nại $\rightarrow$ Bấm nút quyết định: Hoàn tiền cho Khách hay Giải ngân cho Thợ. |
| [`features/workers/pages/WorkerApprovalPage.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kttn-frontend/src/features/workers/pages/WorkerApprovalPage.jsx) | **Chưa hoàn thiện** | - Hiển thị hàng đợi Thợ có khuôn mặt nhận diện thấp (`needsManualReview: true`) để Admin xem ảnh và bấm duyệt thủ công. |
| [`features/dashboard/pages/DashboardPage.jsx`](file:///home/vanvi/Work/do-an-fix-go-tho-tot/doan-kttn-frontend/src/features/dashboard/pages/DashboardPage.jsx) | **Chưa hoàn thiện** | - Cần gắn API đếm số liệu thực tế: Tổng doanh thu nền tảng, tổng tiền hoa hồng thu được, số đơn hoàn thành theo ngày/tháng. |

---

## PHẦN 4: ACTION PLAN (KẾ HOẠCH HÀNH ĐỘNG ƯU TIÊN)

Để đạt điểm tối đa (Giỏi / Xuất sắc) trong buổi bảo vệ, bạn nên ưu tiên làm theo thứ tự sau:

1. **Tuần này (Ưu tiên số 1 - Hoàn thiện 2 mắt xích AI trên Mobile):**
   - Hoàn thiện camera chụp selfie ở `app/(worker)/verification/face.jsx` và bắn lên API `/orders/:id/face-verify`.
   - Trên màn hình chi tiết đơn của Thợ `app/(worker)/job/[id].jsx`, thêm nút **"Hoàn thành ca làm"** $\rightarrow$ Mở camera chụp ảnh kết quả $\rightarrow$ Gọi API đối chiếu Before/After.
2. **Tuần tới (Ưu tiên số 2 - Web Admin & Khiếu nại):**
   - Tạo trang giải quyết khiếu nại (Disputes) cho Admin để xử lý các đơn hàng Before/After không đạt chuẩn.
   - Gắn kết nối API thống kê hoa hồng thực tế trên Dashboard Admin.
3. **Tuần cuối (Ưu tiên số 3 - Chốt báo cáo & Demo rehearsal):**
   - Chuẩn bị sẵn bộ 5 kịch bản ảnh mẫu (1 ảnh chập điện, 1 ảnh vỡ ống nước, 1 ảnh khuôn mặt đúng, 1 ảnh mặt giả, 1 ảnh chụp Before/After sạch sẽ) để demo trực tiếp mượt mà trước hội đồng.

   - Chuẩn bị sẵn bộ 5 kịch bản ảnh mẫu (1 ảnh chập điện, 1 ảnh vỡ ống nước, 1 ảnh khuôn mặt đúng, 1 ảnh mặt giả, 1 ảnh chụp Before/After sạch sẽ) để demo trực tiếp mượt mà trước hội đồng.