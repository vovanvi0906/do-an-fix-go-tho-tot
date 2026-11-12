# Kiến trúc kết nối Khách và Thợ

```mermaid
flowchart TD
  W[Worker App: Bật nhận đơn] --> F{Check-in còn hạn 24 giờ?}
  F -->|Không| S[Camera selfie]
  S --> V[POST /api/workers/verify-face-daily]
  V --> AI[AI so khớp ảnh khuôn mặt đã đăng ký]
  AI -->|Đạt ngưỡng| T[Lưu faceVerifiedAt]
  T --> GPS[GPS thực tế của thợ]
  F -->|Có| GPS
  GPS --> ON[PATCH /api/workers/status]
  ON --> DB[(worker_profiles: online và tọa độ)]
  C[Customer App] --> CGPS[GPS hoặc tọa độ chọn trên bản đồ]
  CGPS --> R[GET /api/workers/nearby radius=10]
  DB --> R
  R --> MAP[RealLeafletMap: vị trí thợ thật]
  C --> SERVICE[Chọn dịch vụ hợp lệ]
  SERVICE --> ORDER[Tạo đơn qua REST]
  ORDER --> SOCKET[Socket.IO namespace /orders]
  SOCKET --> NEW[order.new tới Worker App]
  NEW --> ACCEPT[Thợ nhận đơn]
  ACCEPT --> MATCH[order:matched và order.accepted]
  MATCH --> CACHE[Lọc orderId, chống trùng, lưu assignedWorker]
  CACHE --> TRACK[Customer App: order/id]
```

Ảnh selfie hằng ngày được upload bằng multipart field `image`, đối chiếu với `faceProfile.facePhotoUrl`. AI lỗi hoặc không đạt ngưỡng sẽ không cấp mốc xác thực. Bật online cần tài khoản ACTIVE, hồ sơ APPROVED, dịch vụ đã đăng ký, GPS hợp lệ và check-in trong 24 giờ. Tắt online không yêu cầu GPS hoặc check-in.

Hai app dùng namespace `/orders`. Khách nghe cả hai alias khớp đơn, chỉ cập nhật đơn đang tìm thợ. Các alias join_order/leave_order vẫn được giữ để tương thích.

Kiểm tra thực tế bằng hai tài khoản trên thiết bị: check-in thợ, bật online, xác nhận vị trí thợ trên bản đồ khách, chọn dịch vụ, tạo đơn, nhận đơn, kiểm tra khách chuyển sang theo dõi với đúng thông tin thợ. Kiểm tra thêm từ chối GPS, hủy camera, AI không khả dụng, check-in quá hạn và kết nối lại socket.
