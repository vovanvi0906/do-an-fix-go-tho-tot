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

## 2. Ghi chú Khắc phục Lỗi Upload `ERR_NETWORK` Trước đây

Lỗi `ERR_NETWORK` trong các bản build Android cũ xuất phát từ:
1. URL cấu hình `localhost:3000` thay vì IP LAN máy chủ phát triển (ví dụ: `192.168.1.x`).
2. Định dạng file `FormData` trên Android yêu cầu thuộc tính `{ uri, name, type }` chính xác.

Đoạn mã trong `customer-app/src/services/api/aiService.ts` đã được chuẩn hóa để luôn tự động trích xuất đúng MIME type (`image/jpeg`, `image/png`, `image/webp`) và tên file, kèm `timeout: 45000` ms để tránh đứt kết nối khi mạng yếu.
