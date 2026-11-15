# Worker App — giao diện 5 tab

Thiết kế thống nhất: nền sáng #F5F7F8, thẻ trắng, chữ xanh đen, nhấn emerald và
thẻ trạng thái làm việc xanh đậm. Header theo safe area; bỏ header mặc định lặp
và khoảng trống thừa. Bottom tabs dùng Lucide SVG, không phụ thuộc glyph/font icon.
Jest map Lucide về bản CJS để test sử dụng SVG thật thay vì mock hết icon.

- Trang chủ: tên thật, trạng thái nhận đơn có ACK cũ, công việc đang làm, lối vào
  FaceID, đánh giá/dịch vụ từ hồ sơ. Bỏ số liệu 3 đơn/650.000đ viết cố định.
- Việc làm: GET /orders, phân trang và lọc hoàn tất; mở đơn theo ID. Không tự
  tuyên bố có danh sách việc GPS công khai khi backend chưa cung cấp endpoint đó.
  Việc mới tiếp tục được xử lý bởi socket + nhận đơn như luồng cũ ở Trang chủ.
- Thu nhập: thực nhận workerPayoutAmount, phí commissionAmount từ tối đa 50 đơn
  COMPLETED có payment.status=PAID. Có lọc tháng; mô tả phạm vi tổng rõ ràng.
  Không giả số dư ví hoặc nút rút tiền chưa được hỗ trợ.
- Thông báo: tổng hợp trạng thái của 10 đơn gần nhất; không giả có API hộp thư,
  thông báo thưởng hay lịch sử push khi backend chưa hỗ trợ.
- Cá nhân: hồ sơ, FaceID, hướng dẫn mới không quét đầu ca, cài đặt/hỗ trợ/đăng xuất.
  FaceIdentityCard đổi cùng nền sáng, vẫn giữ nguồn status và điều kiện xác thực.

Không đổi schema, backend API, điều kiện nhận đơn hoặc protocol FaceID. Các tab
có trạng thái tải, lỗi/thử lại và rỗng; hook recovery hiện có vẫn hủy kết quả cũ
khi đổi tài khoản/tab hoặc tải lại.

Xác minh: 28 suites / 192 tests đạt, gồm dữ liệu đơn thực, payout loại trừ đơn
chưa thanh toán, điều hướng, retry, đăng nhập, nhận việc và FaceID. Android JS
bundle export đạt. Chưa xác nhận ảnh chụp giao diện mới trên thiết bị thực.
