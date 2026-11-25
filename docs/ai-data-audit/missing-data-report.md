# Dữ liệu còn thiếu theo catalog và ontology

## Cách hiểu “thiếu”

Đã đối chiếu **70target,693service**. **14target có source candidate**,56target không có matching target tag trong canonical raw đã quét; không khẳng định chúng không xuất hiện ở pixel của source image, screenshot hoặc nguồn chưa có local. Chỉ5target có ứng viên bbox vật thể sau policy; tất cả còn cần review/rights. Không thể trừ candidate khỏi quota rồi gọi phần còn lại là số ảnh cần thu chính xác.

| Category | Target | Slug | Raw candidate tags | Whole-object bbox candidates |
|---|---|---|---|---|
| Giúp việc | Cửa kính / Cửa sổ / Ban công | cua-kinh-cua-so-ban-cong | 0 | 0 |
| Giúp việc | Khu vực bếp / Thiết bị bếp bên ngoài | khu-vuc-bep-thiet-bi-bep-ben-ngoai | 0 | 0 |
| Giúp việc | Nhà vệ sinh / Phòng tắm | nha-ve-sinh-phong-tam | 0 | 0 |
| Giúp việc | Nhà ở / Căn hộ | nha-o-can-ho | 0 | 0 |
| Giúp việc | Sofa / Nệm / Thảm / Rèm | sofa-nem-tham-rem | 541 | 0 |
| Giúp việc | Sàn nhà / Tường / Trần / Nội thất | san-nha-tuong-tran-noi-that | 2249 | 0 |
| Giúp việc | Văn phòng / Cửa hàng | van-phong-cua-hang | 0 | 0 |
| Làm vườn | Cây bóng mát / Cây lớn | cay-bong-mat-cay-lon | 4949 | 0 |
| Làm vườn | Cây cảnh / Chậu cây | cay-canh-chau-cay | 4949 | 0 |
| Làm vườn | Hàng rào cây / Bồn hoa / Vườn rau | hang-rao-cay-bon-hoa-vuon-rau | 4949 | 0 |
| Làm vườn | Hệ thống tưới / Sân vườn tổng thể | he-thong-tuoi-san-vuon-tong-the | 0 | 0 |
| Làm vườn | Thảm cỏ / Bãi cỏ | tham-co-bai-co | 0 | 0 |
| Sửa nước | Bể tự hoại / Hố ga / Cống thoát | be-tu-hoai-ho-ga-cong-thoat | 0 | 0 |
| Sửa nước | Bồn cầu / Két nước | bon-cau-ket-nuoc | 766 | 0 |
| Sửa nước | Bồn nước / Máy bơm / Phao nước | bon-nuoc-may-bom-phao-nuoc | 0 | 0 |
| Sửa nước | Lavabo / Chậu rửa / Bồn rửa | lavabo-chau-rua-bon-rua | 728 | 0 |
| Sửa nước | Phễu thoát sàn / Khu vực phòng tắm | pheu-thoat-san-khu-vuc-phong-tam | 0 | 0 |
| Sửa nước | Vòi nước / Vòi sen | voi-nuoc-voi-sen | 1048 | 32 |
| Sửa nước | Đường ống cấp / thoát nước | duong-ong-cap-thoat-nuoc | 2381 | 0 |
| Sửa điện | Aptomat / CB / MCB | aptomat-cb-mcb | 0 | 0 |
| Sửa điện | Bóng đèn / Đèn LED | bong-den-den-led | 0 | 0 |
| Sửa điện | Bộ sạc xe điện / Ổ cắm sạc | bo-sac-xe-dien-o-cam-sac | 0 | 0 |
| Sửa điện | Chuông cửa / Nút nhấn | chuong-cua-nut-nhan | 0 | 0 |
| Sửa điện | Công tắc thông minh / Relay | cong-tac-thong-minh-relay | 0 | 0 |
| Sửa điện | Công tắc điện | cong-tac-dien | 0 | 0 |
| Sửa điện | Cảm biến / Thiết bị tự động | cam-bien-thiet-bi-tu-dong | 0 | 0 |
| Sửa điện | Dây điện / Cáp điện | day-dien-cap-dien | 0 | 0 |
| Sửa điện | Hệ thống điện phòng | he-thong-dien-phong | 0 | 0 |
| Sửa điện | Hệ thống điện toàn nhà | he-thong-dien-toan-nha | 0 | 0 |
| Sửa điện | Hộp nối điện / Hộp kỹ thuật | hop-noi-dien-hop-ky-thuat | 0 | 0 |
| Sửa điện | Kiểm tra / Khảo sát sự cố điện | kiem-tra-khao-sat-su-co-dien | 0 | 0 |
| Sửa điện | Máy bơm nước – Phần điện | may-bom-nuoc-phan-dien | 0 | 0 |
| Sửa điện | Nguồn cấp cho thiết bị cố định | nguon-cap-cho-thiet-bi-co-dinh | 0 | 0 |
| Sửa điện | Nguồn điện / Adapter / Bộ nguồn | nguon-dien-adapter-bo-nguon | 0 | 0 |
| Sửa điện | Quạt thông gió / Quạt hút | quat-thong-gio-quat-hut | 0 | 0 |
| Sửa điện | Quạt trần / Quạt treo tường | quat-tran-quat-treo-tuong | 0 | 0 |
| Sửa điện | Thiết bị chống rò / Chống giật | thiet-bi-chong-ro-chong-giat | 0 | 0 |
| Sửa điện | Thiết bị đo điện / Công tơ điện | thiet-bi-do-dien-cong-to-dien | 0 | 0 |
| Sửa điện | Tiếp địa / Chống sét | tiep-dia-chong-set | 0 | 0 |
| Sửa điện | Tủ điện / Bảng điện | tu-dien-bang-dien | 0 | 0 |
| Sửa điện | Điện cửa cuốn / Cổng tự động | dien-cua-cuon-cong-tu-dong | 0 | 0 |
| Sửa điện | Điện mặt trời / Inverter | dien-mat-troi-inverter | 1016 | 0 |
| Sửa điện | Đèn ngoài trời / Sân vườn | den-ngoai-troi-san-vuon | 0 | 0 |
| Sửa điện | Đèn sự cố / Đèn thoát hiểm | den-su-co-den-thoat-hiem | 0 | 0 |
| Sửa điện | Đèn trang trí / Đèn chùm | den-trang-tri-den-chum | 0 | 0 |
| Sửa điện | Ổ cắm thông minh / Hẹn giờ | o-cam-thong-minh-hen-gio | 0 | 0 |
| Sửa điện | Ổ cắm điện | o-cam-dien | 11204 | 11134 |
| Sửa điện | Ổn áp / UPS / Bộ lưu điện | on-ap-ups-bo-luu-dien | 0 | 0 |
| Thiết bị gia dụng | Bàn ủi / Bàn là hơi nước | ban-ui-ban-la-hoi-nuoc | 0 | 0 |
| Thiết bị gia dụng | Bình nóng lạnh điện | binh-nong-lanh-dien | 0 | 0 |
| Thiết bị gia dụng | Bếp gas / Bếp gas âm | bep-gas-bep-gas-am | 0 | 0 |
| Thiết bị gia dụng | Bếp từ / Bếp hồng ngoại | bep-tu-bep-hong-ngoai | 0 | 0 |
| Thiết bị gia dụng | Lò nướng / Nồi chiên không dầu | lo-nuong-noi-chien-khong-dau | 0 | 0 |
| Thiết bị gia dụng | Lò vi sóng | lo-vi-song | 0 | 0 |
| Thiết bị gia dụng | Máy hút bụi / Robot hút bụi | may-hut-bui-robot-hut-bui | 0 | 0 |
| Thiết bị gia dụng | Máy hút mùi | may-hut-mui | 0 | 0 |
| Thiết bị gia dụng | Máy lọc không khí / Máy hút ẩm | may-loc-khong-khi-may-hut-am | 0 | 0 |
| Thiết bị gia dụng | Máy lọc nước RO / Nano | may-loc-nuoc-ro-nano | 0 | 0 |
| Thiết bị gia dụng | Máy pha cà phê / Ấm siêu tốc | may-pha-ca-phe-am-sieu-toc | 0 | 0 |
| Thiết bị gia dụng | Máy rửa chén / Máy rửa bát | may-rua-chen-may-rua-bat | 0 | 0 |
| Thiết bị gia dụng | Máy xay / Máy ép / Máy đánh trứng | may-xay-may-ep-may-danh-trung | 0 | 0 |
| Thiết bị gia dụng | Nồi cơm điện / Nồi áp suất điện | noi-com-dien-noi-ap-suat-dien | 0 | 0 |
| Thiết bị gia dụng | Quạt điện / Quạt đứng / Quạt bàn | quat-dien-quat-dung-quat-ban | 0 | 0 |
| Điện lạnh | Máy giặt / Máy giặt sấy | may-giat-may-giat-say | 86 | 79 |
| Điện lạnh | Máy làm mát / Quạt điều hòa | may-lam-mat-quat-dieu-hoa | 0 | 0 |
| Điện lạnh | Máy lạnh / Điều hòa | may-lanh-dieu-hoa | 247 | 220 |
| Điện lạnh | Máy nước uống nóng lạnh | may-nuoc-uong-nong-lanh | 0 | 0 |
| Điện lạnh | Máy sấy quần áo | may-say-quan-ao | 0 | 0 |
| Điện lạnh | Tủ lạnh / Tủ lạnh side-by-side | tu-lanh-tu-lanh-side-by-side | 264 | 200 |
| Điện lạnh | Tủ đông / Tủ mát | tu-dong-tu-mat | 0 | 0 |

## Dấu hiệu quan sát

| Code sign hiện hành | Raw tag candidate images | ZIP unique candidate SHA | Existing admin overlay images | Nhãn/bbox đã verified |
|---|---|---|---|---|
| water_dripping | 0 | 0 | 0 | NOT_ASSESSED;0 released by this task |
| wet_surface | 0 | 0 | 0 | NOT_ASSESSED;0 released by this task |
| crack | 0 | 0 | 0 | NOT_ASSESSED;0 released by this task |
| burn_mark | 0 | 20 | 1 | NOT_ASSESSED;0 released by this task |
| water_spray | 0 | 0 | 0 | NOT_ASSESSED;0 released by this task |
| stain_or_discoloration | 0 | 0 | 0 | NOT_ASSESSED;0 released by this task |
| broken_part | 0 | 0 | 0 | NOT_ASSESSED;0 released by this task |
| surface_soiling | 169 | 0 | 0 | NOT_ASSESSED;0 released by this task |
| bird_droppings | 358 | 0 | 0 | NOT_ASSESSED;0 released by this task |
| leaf_debris | 492 | 0 | 0 | NOT_ASSESSED;0 released by this task |

Bird_droppings/surface_soiling/leaf_debris là tag source vùng bề mặt, không xác minh target hoặc dấu hiệu bằng mắt trong task. Burn_mark của20SHA ZIP chỉ là nhãn ChatGPT đề xuất, chưa bbox/rights/prompt hợp chuẩn. Một admin upload có saved overlay confirmed2boxes khớp SHA, nhưng quyền trong review còn rightsVerified=false; nó là nguồn cần hoàn thiện, không phải independent GT được audit cấp. RawOUTLET11.204 có thể gồm bình thường/lỗi chưa gán; **0tag burn_mark không nghĩa0ảnh thật có vết xém**. Cần người xem kho ổ cắm trước khi yêu cầu tạo thêm ảnh.

Chưa có confirmed normal/negative benchmark. EmptyTXT148, ảnh không thấy rõ hoặc không có class không được dùng như negative tự động. Source category fixture không mô tả defect GT.

## Ontology/modality gaps

Theo ontology hiện tại chưa có code bbox riêng cho exposed_conductor/exposed_wire, corrosion/rust, deformation, standing water, frost, error-code OCR hay bệnh cây. Không tự thêm YAML hoặc thay bằng class gần nghĩa. Mất điện, dòng rò, quá tải, nhiệt độ, áp lực, mùi, âm thanh và root cause cần questionnaire/đo/thợ kiểm, không “thiếu ảnh là sinh ảnh lỗi vô hình”.

## Thứ tự bổ sung sau review

1. Rà10ảnh/target của pilot50, ưu tiên ổ cắm; chốt target extent và nhãn bình thường/xém/nứt thực sự. Tái sử dụng source có quyền/GT trước.
2. Rà source signs bề mặt với context phù hợp, xử lý leaf/fault-region scope. Không gọi class source là object luôn đúng.
3. Rà56target không có tag, phân biệt thiết bị cụ thể và phạm vi hệ thống/khu vực; chỉ đặt quota mới sau biết số verified unique groups.
4. Bổ sung **test thật độc lập** và normal/hard-negative sau clearance; hiện0 test được phát hành. Không lấy ảnh train hoặc synthetic để đủ test.
5. Quyền/ngày/nguồn/prompt/ảnh thực-synthetic chưa có căn cứ phải để UNKNOWN, không điền thay để qua import/export.

Không phát sinh yêu cầu thu/sinh13.340ảnh tự động từ kế hoạch cũ; đây là báo cáo gap metadata và review, không chứng minh tổng ảnh tối ưu để đạt accuracy.
