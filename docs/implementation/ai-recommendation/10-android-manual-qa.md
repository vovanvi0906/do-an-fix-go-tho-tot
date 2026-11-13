# Danh mục Kiểm thử Thực tế trên Android (Android Manual QA Checklist)

> [!NOTE]
> Tại thời điểm kiểm tra, `adb devices` chưa kết nối thiết bị thật. Bảng kiểm này được thiết kế để đội QA/Tester thực thi trực tiếp trên máy Android qua USB debugging hoặc Expo Go.

## 1. Danh mục Kiểm tra Chi tiết (Checklist)

| STT | Bước thực hiện | Thao tác trên thiết bị | Kết quả kỳ vọng | Trạng thái |
|---|---|---|---|---|
| **1** | Mở AI Scan | Bấm nút "Quét AI" tại màn hình chính | Modal mở mượt mà, hiển thị 2 lựa chọn: Camera & Thư viện | [ ] Pending |
| **2** | Cấp quyền Camera | Chọn "Chụp ảnh sự cố" lần đầu | Hệ điều hành Android hiển thị hộp thoại xin quyền máy ảnh chuẩn | [ ] Pending |
| **3** | Xem trước ảnh | Chụp ảnh hoặc chọn 1 ảnh sự cố | Ảnh hiển thị sắc nét trong khung xem trước, ô nhập mô tả sẵn sàng | [ ] Pending |
| **4** | Hiệu ứng Quét | Bấm "Phân tích ảnh" | Tia Laser beam quét lên xuống kèm thông báo trạng thái thay đổi | [ ] Pending |
| **5** | Lỗi Mạng (`ERR_NETWORK`) | Bật chế độ máy bay rồi bấm Quét | Hiển thị thông báo "Không thể kết nối. Vui lòng thử lại" + Nút Thử lại; **Không mất ảnh đã chụp** | [ ] Pending |
| **6** | Thử lại thành công | Tắt chế độ máy bay, bấm Thử lại | Tải ảnh lên Cloudinary và trả về kết quả phân tích bình thường | [ ] Pending |
| **7** | Thẻ Đối tượng AI | Xem kết quả chẩn đoán bước 1 | Hiển thị đúng thiết bị nhận diện (ví dụ: "Công tắc điện (85%)") kèm 2 nút bấm | [ ] Pending |
| **8** | Đổi thiết bị | Bấm "Không đúng thiết bị" | Danh sách thiết bị cùng danh mục mở ra, chọn thiết bị khác thành công | [ ] Pending |
| **9** | Đổi danh mục | Cuộn xuống bấm "Đổi / chọn danh mục" | Toàn bộ thiết bị và dịch vụ cũ được làm mới theo danh mục mới chọn | [ ] Pending |
| **10** | Trả lời triệu chứng | Chọn 1 triệu chứng trong danh sách | Hệ thống đối chiếu và trả về dịch vụ phù hợp nhất | [ ] Pending |
| **11** | Thẻ Dịch vụ Đề xuất | Xem danh sách dịch vụ đề xuất | Hiển thị rõ giá tiền (VNĐ), đơn vị tính và dòng lý do giải thích minh bạch | [ ] Pending |
| **12** | Chọn dịch vụ khác | Bấm chọn 1 dịch vụ khác trong danh sách | Thẻ dịch vụ được chọn sáng lên, nút "Xác nhận dịch vụ" kích hoạt | [ ] Pending |
| **13** | Chuyển sang Booking | Bấm "Xác nhận dịch vụ" | Modal đóng lại, chuyển sang màn hình Tạo đơn Đặt lịch với đầy đủ Category, Target, Service và Giá | [ ] Pending |
| **14** | Tạo đơn hoàn tất | Bấm "Tìm thợ ngay" trên Booking | Đơn hàng được tạo thành công với trạng thái `SEARCHING_WORKER`, quét thợ 5km | [ ] Pending |

## 2. Kế hoạch Trace `ERR_NETWORK` và Luồng Dữ liệu theo `x-request-id`

> [!IMPORTANT]
> **Quy tắc môi trường USB Debugging:**
> Khi thiết bị Android kết nối qua USB và đã chạy `adb reverse tcp:3000 tcp:3000`, Base URL `http://localhost:3000/api` là **hoàn toàn hợp lệ**. Tuyệt đối **không tự ý đổi sang IP LAN** khi `adb reverse` đang kích hoạt.

### 2.1. Chuỗi Trace End-to-End qua `x-request-id`

Mỗi lượt chẩn đoán ảnh được gán một `x-request-id` duy nhất xuyên suốt 4 chặng:

```
[Customer Mobile App] ──(1) FormData + reqId──> [NestJS OrdersController]
                                                       │
                                            (2) Upload Buffer + reqId
                                                       ▼
                                              [Cloudinary Storage]
                                                       │
                                            (3) secure_url + reqId
                                                       ▼
                                            [FastAPI /ai/v2/diagnose]
                                                       │
[Customer Mobile App] <──(4) V2 Contract + reqId───────┘
```

1. **Chặng 1 — Mobile Client (`customer-app`):**
   - Sinh UUIDv4: `const reqId = uuidv4()`.
   - Gắn header: `headers: { 'x-request-id': reqId, 'Content-Type': 'multipart/form-data' }`.
   - Định dạng payload Android bắt buộc:
     ```javascript
     formData.append('image', {
       uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
       name: `diagnosis_${Date.now()}.jpg`,
       type: mimeType || 'image/jpeg',
     });
     ```
   - Log chẩn đoán: `console.log('[Mobile Request]', { reqId, url: '/orders/diagnose-upload' })`.

2. **Chặng 2 — Backend NestJS Gateway (`OrdersController.diagnoseUpload`):**
   - Trích xuất `reqId = req.headers['x-request-id'] || uuidv4()`.
   - Log tiếp nhận: `logger.log(`[NestJS][reqId: ${reqId}] Uploading image buffer to Cloudinary...`);`.

3. **Chặng 3 — Cloudinary Upload:**
   - Đẩy stream buffer lên Cloudinary với timeout 20s.
   - Log phản hồi: `logger.log(`[NestJS][reqId: ${reqId}] Cloudinary success: ${secure_url}`);`.
   - Nếu lỗi: Ghi rõ mã lỗi Cloudinary và hủy request, trả HTTP 502 kèm `reqId`.

4. **Chặng 4 — FastAPI AI Service (`/ai/v2/diagnose`):**
   - Gửi POST JSON `{ imageUrl: secure_url, description }` kèm header `x-request-id: ${reqId}`.
   - FastAPI ghi log: `logger.info(f"[FastAPI V2][reqId: {req_id}] Inference start - {image_url}")`.
   - Trả response V2 kèm model version và decision source.

### 2.2. Lệnh giám sát trực tiếp trên máy chủ và thiết bị

Khi phát hiện `ERR_NETWORK` trên màn hình:
1. Kiểm tra cầu nối ADB Reverse:
   ```bash
   adb reverse --list
   # Kỳ vọng: tcp:3000 tcp:3000
   ```
2. Giám sát logcat thời gian thực của ứng dụng Mobile:
   ```bash
   adb logcat -s "ReactNativeJS" "FixGo-API"
   ```
3. Đối chiếu `reqId` trên terminal Backend NestJS để xác định chính xác chặng phát sinh sự cố (Mobile, Cloudinary, hay AI Service).
