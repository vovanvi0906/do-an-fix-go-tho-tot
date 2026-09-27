---
name: order-flow-qa
description: Kịch bản kiểm thử toàn diện luồng nghiệp vụ đặt lịch thợ, tìm thợ qua PostGIS, xác thực AI và thanh toán.
---

# 📋 Kịch Bản Kiểm Thử Luồng Đơn Hàng FixGo Pro (End-to-End QA)

## 1. Luồng Nghiệp Vụ Chuẩn
1. **Khách hàng tạo đơn (`POST /api/orders`)**:
   - Khách hàng chọn dịch vụ, nhập tọa độ GPS và ảnh sự cố hư hỏng.
   - Trạng thái ban đầu: `PENDING` -> `SEARCHING`.
2. **AI Service phân tích ảnh hư hỏng (`POST /api/v1/incident/detect`)**:
   - Backend gọi sang AI service phân tích độ nghiêm trọng và gợi ý dịch vụ.
3. **Quét tìm thợ theo bán kính (PostGIS Spatial Query)**:
   - Hệ thống tìm thợ đang `is_online: true` trong bán kính $R$ km và phát sự kiện WebSocket tới thợ.
4. **Thợ nhận đơn (Atomic Update)**:
   - Thợ bấm nhận đơn -> Hệ thống thực hiện atomic update chuyển sang `ACCEPTED`.
   - Báo `409 Conflict` nếu cuốc đã bị người khác nhận.
5. **Thợ đến nơi & Xác thực khuôn mặt (`POST /api/v1/face/verify`)**:
   - Thợ chụp ảnh khuôn mặt tại hiện trường, AI đối chiếu với ảnh đăng ký KYC ban đầu.
6. **Thợ hoàn thành công việc & Nghiệm thu Before/After**:
   - Thợ nộp ảnh sau sửa chữa -> AI đối chiếu trước/sau.
   - Trạng thái chuyển sang `COMPLETED`.
7. **Khấu trừ hoa hồng & Quyết toán ví (`Wallet Transaction`)**:
   - Khấu trừ tiền hoa hồng sàn, cộng số dư cho thợ trong cùng 1 Prisma Transaction.
