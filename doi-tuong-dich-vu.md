# Danh mục dịch vụ và đối tượng phục vụ của FixGo

Báo cáo được đọc trực tiếp từ database FixGo ngày 25/11/2026 bằng transaction chỉ đọc. Hệ thống hiện có **6 danh mục dịch vụ** và **70 đối tượng**. Đối tượng được nhóm theo quan hệ `categoryId` trong database.

Trong báo cáo này, “đối tượng” là thiết bị, hạng mục hoặc phạm vi mà dịch vụ phục vụ. Các gói dịch vụ cụ thể cho từng đối tượng không nằm trong danh sách này.

## Tổng quan

| STT | Danh mục dịch vụ | Số đối tượng |
|---|---|---:|
| 1 | Giúp việc | 7 |
| 2 | Làm vườn | 5 |
| 3 | Sửa nước | 7 |
| 4 | Sửa điện | 29 |
| 5 | Thiết bị gia dụng | 15 |
| 6 | Điện lạnh | 7 |

## 1. Giúp việc

- **Mã danh mục:** `giup-viec`
- **ID trong database:** `76c09b08-3231-4abd-be79-c2da76e06495`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng liên quan:** 7

| STT | Đối tượng thuộc danh mục | Mã đối tượng | Trạng thái |
|---|---|---|---|
| 1 | Cửa kính / Cửa sổ / Ban công | `cua-kinh-cua-so-ban-cong` | Đang hoạt động |
| 2 | Khu vực bếp / Thiết bị bếp bên ngoài | `khu-vuc-bep-thiet-bi-bep-ben-ngoai` | Đang hoạt động |
| 3 | Nhà vệ sinh / Phòng tắm | `nha-ve-sinh-phong-tam` | Đang hoạt động |
| 4 | Nhà ở / Căn hộ | `nha-o-can-ho` | Đang hoạt động |
| 5 | Sofa / Nệm / Thảm / Rèm | `sofa-nem-tham-rem` | Đang hoạt động |
| 6 | Sàn nhà / Tường / Trần / Nội thất | `san-nha-tuong-tran-noi-that` | Đang hoạt động |
| 7 | Văn phòng / Cửa hàng | `van-phong-cua-hang` | Đang hoạt động |

## 2. Làm vườn

- **Mã danh mục:** `lam-vuon`
- **ID trong database:** `ef9682ad-e5dc-494e-a22f-45df72b68f9e`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng liên quan:** 5

| STT | Đối tượng thuộc danh mục | Mã đối tượng | Trạng thái |
|---|---|---|---|
| 1 | Cây bóng mát / Cây lớn | `cay-bong-mat-cay-lon` | Đang hoạt động |
| 2 | Cây cảnh / Chậu cây | `cay-canh-chau-cay` | Đang hoạt động |
| 3 | Hàng rào cây / Bồn hoa / Vườn rau | `hang-rao-cay-bon-hoa-vuon-rau` | Đang hoạt động |
| 4 | Hệ thống tưới / Sân vườn tổng thể | `he-thong-tuoi-san-vuon-tong-the` | Đang hoạt động |
| 5 | Thảm cỏ / Bãi cỏ | `tham-co-bai-co` | Đang hoạt động |

## 3. Sửa nước

- **Mã danh mục:** `sua-nuoc`
- **ID trong database:** `2a367f64-e8b2-4b94-8227-f5058c842af8`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng liên quan:** 7

| STT | Đối tượng thuộc danh mục | Mã đối tượng | Trạng thái |
|---|---|---|---|
| 1 | Bể tự hoại / Hố ga / Cống thoát | `be-tu-hoai-ho-ga-cong-thoat` | Đang hoạt động |
| 2 | Bồn cầu / Két nước | `bon-cau-ket-nuoc` | Đang hoạt động |
| 3 | Bồn nước / Máy bơm / Phao nước | `bon-nuoc-may-bom-phao-nuoc` | Đang hoạt động |
| 4 | Lavabo / Chậu rửa / Bồn rửa | `lavabo-chau-rua-bon-rua` | Đang hoạt động |
| 5 | Phễu thoát sàn / Khu vực phòng tắm | `pheu-thoat-san-khu-vuc-phong-tam` | Đang hoạt động |
| 6 | Vòi nước / Vòi sen | `voi-nuoc-voi-sen` | Đang hoạt động |
| 7 | Đường ống cấp / thoát nước | `duong-ong-cap-thoat-nuoc` | Đang hoạt động |

## 4. Sửa điện

- **Mã danh mục:** `sua-dien`
- **ID trong database:** `4d397d29-ec22-4eae-88ea-8e411e04bdb3`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng liên quan:** 29

| STT | Đối tượng thuộc danh mục | Mã đối tượng | Trạng thái |
|---|---|---|---|
| 1 | Aptomat / CB / MCB | `aptomat-cb-mcb` | Đang hoạt động |
| 2 | Bóng đèn / Đèn LED | `bong-den-den-led` | Đang hoạt động |
| 3 | Bộ sạc xe điện / Ổ cắm sạc | `bo-sac-xe-dien-o-cam-sac` | Đang hoạt động |
| 4 | Chuông cửa / Nút nhấn | `chuong-cua-nut-nhan` | Đang hoạt động |
| 5 | Công tắc thông minh / Relay | `cong-tac-thong-minh-relay` | Đang hoạt động |
| 6 | Công tắc điện | `cong-tac-dien` | Đang hoạt động |
| 7 | Cảm biến / Thiết bị tự động | `cam-bien-thiet-bi-tu-dong` | Đang hoạt động |
| 8 | Dây điện / Cáp điện | `day-dien-cap-dien` | Đang hoạt động |
| 9 | Hệ thống điện phòng | `he-thong-dien-phong` | Đang hoạt động |
| 10 | Hệ thống điện toàn nhà | `he-thong-dien-toan-nha` | Đang hoạt động |
| 11 | Hộp nối điện / Hộp kỹ thuật | `hop-noi-dien-hop-ky-thuat` | Đang hoạt động |
| 12 | Kiểm tra / Khảo sát sự cố điện | `kiem-tra-khao-sat-su-co-dien` | Đang hoạt động |
| 13 | Máy bơm nước – Phần điện | `may-bom-nuoc-phan-dien` | Đang hoạt động |
| 14 | Nguồn cấp cho thiết bị cố định | `nguon-cap-cho-thiet-bi-co-dinh` | Đang hoạt động |
| 15 | Nguồn điện / Adapter / Bộ nguồn | `nguon-dien-adapter-bo-nguon` | Đang hoạt động |
| 16 | Quạt thông gió / Quạt hút | `quat-thong-gio-quat-hut` | Đang hoạt động |
| 17 | Quạt trần / Quạt treo tường | `quat-tran-quat-treo-tuong` | Đang hoạt động |
| 18 | Thiết bị chống rò / Chống giật | `thiet-bi-chong-ro-chong-giat` | Đang hoạt động |
| 19 | Thiết bị đo điện / Công tơ điện | `thiet-bi-do-dien-cong-to-dien` | Đang hoạt động |
| 20 | Tiếp địa / Chống sét | `tiep-dia-chong-set` | Đang hoạt động |
| 21 | Tủ điện / Bảng điện | `tu-dien-bang-dien` | Đang hoạt động |
| 22 | Điện cửa cuốn / Cổng tự động | `dien-cua-cuon-cong-tu-dong` | Đang hoạt động |
| 23 | Điện mặt trời / Inverter | `dien-mat-troi-inverter` | Đang hoạt động |
| 24 | Đèn ngoài trời / Sân vườn | `den-ngoai-troi-san-vuon` | Đang hoạt động |
| 25 | Đèn sự cố / Đèn thoát hiểm | `den-su-co-den-thoat-hiem` | Đang hoạt động |
| 26 | Đèn trang trí / Đèn chùm | `den-trang-tri-den-chum` | Đang hoạt động |
| 27 | Ổ cắm thông minh / Hẹn giờ | `o-cam-thong-minh-hen-gio` | Đang hoạt động |
| 28 | Ổ cắm điện | `o-cam-dien` | Đang hoạt động |
| 29 | Ổn áp / UPS / Bộ lưu điện | `on-ap-ups-bo-luu-dien` | Đang hoạt động |

## 5. Thiết bị gia dụng

- **Mã danh mục:** `thiet-bi`
- **ID trong database:** `0666ad90-ac9d-4d34-b04a-8925e7d1605d`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng liên quan:** 15

| STT | Đối tượng thuộc danh mục | Mã đối tượng | Trạng thái |
|---|---|---|---|
| 1 | Bàn ủi / Bàn là hơi nước | `ban-ui-ban-la-hoi-nuoc` | Đang hoạt động |
| 2 | Bình nóng lạnh điện | `binh-nong-lanh-dien` | Đang hoạt động |
| 3 | Bếp gas / Bếp gas âm | `bep-gas-bep-gas-am` | Đang hoạt động |
| 4 | Bếp từ / Bếp hồng ngoại | `bep-tu-bep-hong-ngoai` | Đang hoạt động |
| 5 | Lò nướng / Nồi chiên không dầu | `lo-nuong-noi-chien-khong-dau` | Đang hoạt động |
| 6 | Lò vi sóng | `lo-vi-song` | Đang hoạt động |
| 7 | Máy hút bụi / Robot hút bụi | `may-hut-bui-robot-hut-bui` | Đang hoạt động |
| 8 | Máy hút mùi | `may-hut-mui` | Đang hoạt động |
| 9 | Máy lọc không khí / Máy hút ẩm | `may-loc-khong-khi-may-hut-am` | Đang hoạt động |
| 10 | Máy lọc nước RO / Nano | `may-loc-nuoc-ro-nano` | Đang hoạt động |
| 11 | Máy pha cà phê / Ấm siêu tốc | `may-pha-ca-phe-am-sieu-toc` | Đang hoạt động |
| 12 | Máy rửa chén / Máy rửa bát | `may-rua-chen-may-rua-bat` | Đang hoạt động |
| 13 | Máy xay / Máy ép / Máy đánh trứng | `may-xay-may-ep-may-danh-trung` | Đang hoạt động |
| 14 | Nồi cơm điện / Nồi áp suất điện | `noi-com-dien-noi-ap-suat-dien` | Đang hoạt động |
| 15 | Quạt điện / Quạt đứng / Quạt bàn | `quat-dien-quat-dung-quat-ban` | Đang hoạt động |

## 6. Điện lạnh

- **Mã danh mục:** `dien-lanh`
- **ID trong database:** `8ba77998-c7aa-4b53-875f-b14b8fba78f7`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng liên quan:** 7

| STT | Đối tượng thuộc danh mục | Mã đối tượng | Trạng thái |
|---|---|---|---|
| 1 | Máy giặt / Máy giặt sấy | `may-giat-may-giat-say` | Đang hoạt động |
| 2 | Máy làm mát / Quạt điều hòa | `may-lam-mat-quat-dieu-hoa` | Đang hoạt động |
| 3 | Máy lạnh / Điều hòa | `may-lanh-dieu-hoa` | Đang hoạt động |
| 4 | Máy nước uống nóng lạnh | `may-nuoc-uong-nong-lanh` | Đang hoạt động |
| 5 | Máy sấy quần áo | `may-say-quan-ao` | Đang hoạt động |
| 6 | Tủ lạnh / Tủ lạnh side-by-side | `tu-lanh-tu-lanh-side-by-side` | Đang hoạt động |
| 7 | Tủ đông / Tủ mát | `tu-dong-tu-mat` | Đang hoạt động |

## Nguồn và phạm vi dữ liệu

- Danh mục lấy từ bảng `service_categories`; đối tượng lấy từ bảng `service_targets`.
- Mỗi đối tượng được liệt kê dưới danh mục mà trường `categoryId` của đối tượng tham chiếu tới.
- Bao gồm tất cả danh mục và đối tượng trong lần đọc database, có thể hiện trạng thái hoạt động.
- Không tự thêm đối tượng ngoài database hoặc suy đoán quan hệ dựa trên tên.
