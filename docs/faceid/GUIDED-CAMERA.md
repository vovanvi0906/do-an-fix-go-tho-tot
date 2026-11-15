# Camera hướng dẫn và tự chụp

Camera Android và web hướng dẫn gần/xa, căn giữa, nhìn thẳng, giữ đầu thẳng,
chỉ một người và ánh sáng ở vùng mặt. Độ sáng trung bình vùng mặt cần nằm trong
40–220/255; ngoài mức đó hướng dẫn đổi ánh sáng. Không đo nền ảnh để suy ra mặt sáng.
Khuôn mặt cần >=80px mỗi chiều, chiếm 16–80% chiều rộng ảnh; tâm lệch không quá
18% chiều rộng/22% chiều cao; yaw <=25 độ, roll <=22 độ theo bộ dò trên thiết bị.
Đây là tiêu chí hướng dẫn local, không thay kiểm tra chất lượng/PAD của máy chủ.

Khi điều kiện đạt: giữ ổn định 3 giây, hiện 3–2–1 và tự chụp một lần. Mất mặt,
đổi tư thế, ánh sáng không đạt, gián đoạn mẫu >1.5 giây hoặc di chuyển đáng kể
sẽ đặt lại đếm. Có thể tắt tự chụp và chụp thủ công. Bấm chụp khi detector bận
được xếp chờ, không bỏ qua thao tác.

Android đọc JPEG camera tạm trong RAM bằng jpeg-js để đo ánh sáng, không gửi
các ảnh dò nền lên máy chủ. Chọn cỡ ảnh được thiết bị hỗ trợ, ưu tiên chiều nhỏ
>=480px và <=1.5MP. Giới hạn decoder 2MP/32MiB. Ảnh cache được dọn theo luồng cũ.
Hai dependency JS thuần: jpeg-js, base64-js; không thêm module native.

Chụp xong vẫn về màn hình xem trước và gửi mẫu. Chưa gửi mẫu thì chưa đăng ký.
PAD/độ nét/phát hiện mặt phía máy chủ có thể từ chối ảnh dù local đã đạt.

Kiểm thử: toàn bộ 185 test mobile đạt trước khi thêm test tự chụp; 8 test targeted
sau đó đạt, bao gồm tự chụp sau đủ 3 giây, gần/xa, tối/sáng và reset khi mất điều kiện.
Android JS export đã thành công. Chưa xác nhận một lượt đăng ký thật trên thiết bị.

## Phản hồi camera và đo sáng theo hướng JPEG

Không hạ ngưỡng sáng để ép đạt. Đã bổ sung đọc EXIF orientation và ánh xạ tọa độ
mặt ML Kit về pixel JPEG thô khi đo sáng (jpeg-js không tự xoay pixel). Test ảnh
xoay 90 độ kiểm tra lấy đúng dải pixel sáng, không lấy nền tối.

UI Android: khung vàng nhấp nháy khi chưa đạt, xanh khi đạt; banner hướng dẫn
lớn trên camera với biểu tượng chuyển động, checklist vị trí/ánh sáng và số đếm
nảy nhẹ. Text hướng dẫn dưới camera tăng cỡ chữ. Khi đạt sáng vẫn có thể trượt
PAD trên máy chủ; không diễn giải FACE_PAD_REJECTED là thiếu sáng.

## Bộ đếm trên thiết bị xử lý chậm

Ngưỡng gián đoạn 1.5 giây trước đây tính cả thời gian chụp/JPEG/ML nên thiết bị
mất 2 giây xử lý mỗi ảnh có thể luôn reset về 3 dù mặt đạt điều kiện. Native nay
trừ thời gian xử lý khỏi khoảng gián đoạn (vẫn reset khi xử lý quá 5 giây), dùng
ít nhất 3 quan sát hợp lệ và đủ 3 giây. Mất chất lượng/di chuyển/ngắt quãng vẫn reset.
UI đếm và thanh tiến độ chạy bằng đồng hồ riêng, không phụ thuộc tốc độ detector.
Hết đếm nhưng chưa có quan sát xác nhận mới: hiện đang xác nhận, không chụp ảnh
chưa được kiểm tra. Test component với detector trì hoãn 2 giây/ảnh xác nhận
chụp một lần; cả 8 test camera/guidance đạt. Chưa xác nhận trên điện thoại thật.
