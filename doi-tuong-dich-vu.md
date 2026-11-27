# Danh mục, đối tượng và dịch vụ hiện có của FixGo

Báo cáo đọc trực tiếp từ database FixGo ngày 25/11/2026 bằng transaction chỉ đọc. Bao gồm **6 danh mục**, **70 đối tượng** và **693 dịch vụ**; thể hiện cả trạng thái hoạt động và ngừng hoạt động.

Dữ liệu được trình bày theo cấu trúc **Danh mục → Đối tượng → Dịch vụ cụ thể**. Quan hệ lấy từ `categoryId` và `targetId` trong database. Giá là giá cấu hình hiện tại, không phải báo giá sau khảo sát.

## Tổng quan

| STT | Danh mục | Số đối tượng | Số dịch vụ | Đang hoạt động | Ngừng hoạt động |
|---|---|---:|---:|---:|---:|
| 1 | Giúp việc | 7 | 62 | 62 | 0 |
| 2 | Làm vườn | 5 | 50 | 50 | 0 |
| 3 | Sửa nước | 7 | 70 | 70 | 0 |
| 4 | Sửa điện | 29 | 289 | 289 | 0 |
| 5 | Thiết bị gia dụng | 15 | 130 | 130 | 0 |
| 6 | Điện lạnh | 7 | 92 | 92 | 0 |

## 1. Giúp việc

- **Mã danh mục:** `giup-viec`
- **ID danh mục:** `76c09b08-3231-4abd-be79-c2da76e06495`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng:** 7
- **Số dịch vụ:** 62

### 1.1. Cửa kính / Cửa sổ / Ban công

- **Mã đối tượng:** `cua-kinh-cua-so-ban-cong`
- **ID đối tượng:** `8ea8b042-3418-4ec9-8cd7-5c71b899a183`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Lau cửa sổ | `lau-cua-so` | 120.000 đ/giờ | Đang hoạt động |
| 2 | Lau kính trong nhà | `lau-kinh-trong-nha` | 120.000 đ/giờ | Đang hoạt động |
| 3 | Làm sạch bụi bẩn bề mặt ngoài trong phạm vi an toàn | `lam-sach-bui-ban-be-mat-ngoai-trong-pham-vi-an-toan` | 120.000 đ/giờ | Đang hoạt động |
| 4 | Vệ sinh ban công | `ve-sinh-ban-cong` | 120.000 đ/giờ | Đang hoạt động |
| 5 | Vệ sinh cửa kính | `ve-sinh-cua-kinh` | 120.000 đ/giờ | Đang hoạt động |
| 6 | Vệ sinh cửa ra vào | `ve-sinh-cua-ra-vao` | 120.000 đ/giờ | Đang hoạt động |
| 7 | Vệ sinh khung cửa và ray trượt | `ve-sinh-khung-cua-va-ray-truot` | 120.000 đ/giờ | Đang hoạt động |
| 8 | Vệ sinh lan can | `ve-sinh-lan-can` | 120.000 đ/giờ | Đang hoạt động |

### 1.2. Khu vực bếp / Thiết bị bếp bên ngoài

- **Mã đối tượng:** `khu-vuc-bep-thiet-bi-bep-ben-ngoai`
- **ID đối tượng:** `07174301-9fd2-4a3e-b3da-2b43303663e6`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Làm sạch dầu mỡ khu vực bếp | `lam-sach-dau-mo-khu-vuc-bep` | 120.000 đ/giờ | Đang hoạt động |
| 2 | Làm sạch tường / gạch ốp bếp | `lam-sach-tuong-gach-op-bep` | 120.000 đ/giờ | Đang hoạt động |
| 3 | Tổng vệ sinh bếp sau sử dụng | `tong-ve-sinh-bep-sau-su-dung` | 120.000 đ/giờ | Đang hoạt động |
| 4 | Vệ sinh bên ngoài tủ lạnh / lò / máy hút mùi | `ve-sinh-ben-ngoai-tu-lanh-lo-may-hut-mui` | 120.000 đ/giờ | Đang hoạt động |
| 5 | Vệ sinh bồn rửa và mặt đá | `ve-sinh-bon-rua-va-mat-da` | 120.000 đ/giờ | Đang hoạt động |
| 6 | Vệ sinh mặt bếp | `ve-sinh-mat-bep` | 120.000 đ/giờ | Đang hoạt động |
| 7 | Vệ sinh sàn bếp | `ve-sinh-san-bep` | 120.000 đ/giờ | Đang hoạt động |
| 8 | Vệ sinh tủ bếp | `ve-sinh-tu-bep` | 120.000 đ/giờ | Đang hoạt động |

### 1.3. Nhà vệ sinh / Phòng tắm

- **Mã đối tượng:** `nha-ve-sinh-phong-tam`
- **ID đối tượng:** `5ef7b978-d4dc-4287-b119-19926b473bac`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Cọ rửa bồn cầu | `co-rua-bon-cau` | 120.000 đ/giờ | Đang hoạt động |
| 2 | Khử mùi phòng tắm | `khu-mui-phong-tam` | 120.000 đ/giờ | Đang hoạt động |
| 3 | Lau sàn và vách tắm | `lau-san-va-vach-tam` | 120.000 đ/giờ | Đang hoạt động |
| 4 | Làm sạch kính phòng tắm | `lam-sach-kinh-phong-tam` | 120.000 đ/giờ | Đang hoạt động |
| 5 | Tẩy cặn bám trên bề mặt phù hợp | `tay-can-bam-tren-be-mat-phu-hop` | 120.000 đ/giờ | Đang hoạt động |
| 6 | Tổng vệ sinh phòng tắm | `tong-ve-sinh-phong-tam` | 120.000 đ/giờ | Đang hoạt động |
| 7 | Vệ sinh gạch / ron gạch | `ve-sinh-gach-ron-gach` | 120.000 đ/giờ | Đang hoạt động |
| 8 | Vệ sinh lavabo và vòi nước | `ve-sinh-lavabo-va-voi-nuoc` | 120.000 đ/giờ | Đang hoạt động |

### 1.4. Nhà ở / Căn hộ

- **Mã đối tượng:** `nha-o-can-ho`
- **ID đối tượng:** `cf864eb2-ba2a-4dd8-8b8f-d13602981783`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Dọn dẹp nhà theo giờ | `don-dep-nha-theo-gio` | 120.000 đ/giờ | Đang hoạt động |
| 2 | Dọn dẹp nhà định kỳ | `don-dep-nha-dinh-ky` | 120.000 đ/giờ | Đang hoạt động |
| 3 | Dọn dẹp trước / sau chuyển nhà | `don-dep-truoc-sau-chuyen-nha` | 120.000 đ/giờ | Đang hoạt động |
| 4 | Lau bụi nội thất | `lau-bui-noi-that` | 120.000 đ/giờ | Đang hoạt động |
| 5 | Quét / hút bụi / lau sàn | `quet-hut-bui-lau-san` | 120.000 đ/giờ | Đang hoạt động |
| 6 | Sắp xếp đồ dùng theo yêu cầu | `sap-xep-do-dung-theo-yeu-cau` | 120.000 đ/giờ | Đang hoạt động |
| 7 | Thu gom rác sinh hoạt | `thu-gom-rac-sinh-hoat` | 120.000 đ/giờ | Đang hoạt động |
| 8 | Tổng vệ sinh nhà ở | `tong-ve-sinh-nha-o` | 120.000 đ/giờ | Đang hoạt động |
| 9 | Vệ sinh các khu vực sinh hoạt | `ve-sinh-cac-khu-vuc-sinh-hoat` | 120.000 đ/giờ | Đang hoạt động |
| 10 | Vệ sinh nhà sau xây dựng | `ve-sinh-nha-sau-xay-dung` | 120.000 đ/giờ | Đang hoạt động |

### 1.5. Sofa / Nệm / Thảm / Rèm

- **Mã đối tượng:** `sofa-nem-tham-rem`
- **ID đối tượng:** `2e1b524a-80c8-409d-aa30-e4c8ca71bfbd`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Giặt nệm / đệm | `giat-nem-dem` | 120.000 đ/giờ | Đang hoạt động |
| 2 | Giặt rèm cửa | `giat-rem-cua` | 120.000 đ/giờ | Đang hoạt động |
| 3 | Giặt sofa vải | `giat-sofa-vai` | 120.000 đ/giờ | Đang hoạt động |
| 4 | Giặt thảm trải sàn | `giat-tham-trai-san` | 120.000 đ/giờ | Đang hoạt động |
| 5 | Hút bụi nệm chuyên sâu | `hut-bui-nem-chuyen-sau` | 120.000 đ/giờ | Đang hoạt động |
| 6 | Khử mùi sofa / nệm / thảm | `khu-mui-sofa-nem-tham` | 120.000 đ/giờ | Đang hoạt động |
| 7 | Vệ sinh ghế nệm | `ve-sinh-ghe-nem` | 120.000 đ/giờ | Đang hoạt động |
| 8 | Vệ sinh sofa da đúng chất liệu | `ve-sinh-sofa-da-dung-chat-lieu` | 120.000 đ/giờ | Đang hoạt động |
| 9 | Vệ sinh định kỳ đồ nội thất vải | `ve-sinh-dinh-ky-do-noi-that-vai` | 120.000 đ/giờ | Đang hoạt động |
| 10 | Xử lý vết bẩn theo chất liệu | `xu-ly-vet-ban-theo-chat-lieu` | 120.000 đ/giờ | Đang hoạt động |

### 1.6. Sàn nhà / Tường / Trần / Nội thất

- **Mã đối tượng:** `san-nha-tuong-tran-noi-that`
- **ID đối tượng:** `ee850727-ccde-4173-8b16-41e7be8065ca`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Hút bụi góc khuất | `hut-bui-goc-khuat` | 120.000 đ/giờ | Đang hoạt động |
| 2 | Lau sàn gạch | `lau-san-gach` | 120.000 đ/giờ | Đang hoạt động |
| 3 | Lau sàn gỗ theo vật liệu | `lau-san-go-theo-vat-lieu` | 120.000 đ/giờ | Đang hoạt động |
| 4 | Lau tủ / kệ / bàn ghế | `lau-tu-ke-ban-ghe` | 120.000 đ/giờ | Đang hoạt động |
| 5 | Làm sạch bề mặt nội thất | `lam-sach-be-mat-noi-that` | 120.000 đ/giờ | Đang hoạt động |
| 6 | Làm sạch vết bẩn sàn | `lam-sach-vet-ban-san` | 120.000 đ/giờ | Đang hoạt động |
| 7 | Phủi bụi tường / trần tại vị trí an toàn | `phui-bui-tuong-tran-tai-vi-tri-an-toan` | 120.000 đ/giờ | Đang hoạt động |
| 8 | Vệ sinh chân tường và len tường | `ve-sinh-chan-tuong-va-len-tuong` | 120.000 đ/giờ | Đang hoạt động |
| 9 | Vệ sinh sàn đá | `ve-sinh-san-da` | 120.000 đ/giờ | Đang hoạt động |

### 1.7. Văn phòng / Cửa hàng

- **Mã đối tượng:** `van-phong-cua-hang`
- **ID đối tượng:** `349b1f3b-5664-4ba4-a3c4-567c16c58ca0`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Hút bụi / lau sàn văn phòng | `hut-bui-lau-san-van-phong` | 120.000 đ/giờ | Đang hoạt động |
| 2 | Lau kính nội thất | `lau-kinh-noi-that` | 120.000 đ/giờ | Đang hoạt động |
| 3 | Thu gom rác và thay túi rác | `thu-gom-rac-va-thay-tui-rac` | 120.000 đ/giờ | Đang hoạt động |
| 4 | Tổng vệ sinh cửa hàng trước khai trương | `tong-ve-sinh-cua-hang-truoc-khai-truong` | 120.000 đ/giờ | Đang hoạt động |
| 5 | Vệ sinh bàn làm việc | `ve-sinh-ban-lam-viec` | 120.000 đ/giờ | Đang hoạt động |
| 6 | Vệ sinh khu vực lễ tân | `ve-sinh-khu-vuc-le-tan` | 120.000 đ/giờ | Đang hoạt động |
| 7 | Vệ sinh khu vực pantry | `ve-sinh-khu-vuc-pantry` | 120.000 đ/giờ | Đang hoạt động |
| 8 | Vệ sinh phòng họp | `ve-sinh-phong-hop` | 120.000 đ/giờ | Đang hoạt động |
| 9 | Vệ sinh văn phòng theo giờ | `ve-sinh-van-phong-theo-gio` | 120.000 đ/giờ | Đang hoạt động |

## 2. Làm vườn

- **Mã danh mục:** `lam-vuon`
- **ID danh mục:** `ef9682ad-e5dc-494e-a22f-45df72b68f9e`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng:** 5
- **Số dịch vụ:** 50

### 2.1. Cây bóng mát / Cây lớn

- **Mã đối tượng:** `cay-bong-mat-cay-lon`
- **ID đối tượng:** `e6e9a725-4058-4af4-83b7-a35fc91af354`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bón phân / cải tạo gốc | `bon-phan-cai-tao-goc` | 150.000 đ/lần | Đang hoạt động |
| 2 | Chăm sóc cây bóng mát | `cham-soc-cay-bong-mat` | 150.000 đ/lần | Đang hoạt động |
| 3 | Cắt tỉa cành cây | `cat-tia-canh-cay` | 150.000 đ/lần | Đang hoạt động |
| 4 | Dọn cành khô / gãy | `don-canh-kho-gay` | 150.000 đ/lần | Đang hoạt động |
| 5 | Khảo sát xử lý cây nguy hiểm bởi đội chuyên môn | `khao-sat-xu-ly-cay-nguy-hiem-boi-doi-chuyen-mon` | 150.000 đ/lần | Đang hoạt động |
| 6 | Kiểm tra cây nghiêng / nguy cơ đổ | `kiem-tra-cay-nghieng-nguy-co-do` | 150.000 đ/lần | Đang hoạt động |
| 7 | Thu gom cành sau cắt | `thu-gom-canh-sau-cat` | 150.000 đ/lần | Đang hoạt động |
| 8 | Trồng / thay cây bóng mát | `trong-thay-cay-bong-mat` | 150.000 đ/lần | Đang hoạt động |
| 9 | Tạo tán cây | `tao-tan-cay` | 150.000 đ/lần | Đang hoạt động |

### 2.2. Cây cảnh / Chậu cây

- **Mã đối tượng:** `cay-canh-chau-cay`
- **ID đối tượng:** `fbcd5b31-5530-43ba-b35b-a32d25479477`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bón phân cây cảnh | `bon-phan-cay-canh` | 150.000 đ/lần | Đang hoạt động |
| 2 | Cắt tỉa cây cảnh | `cat-tia-cay-canh` | 150.000 đ/lần | Đang hoạt động |
| 3 | Cố định / chống đỡ cây | `co-dinh-chong-do-cay` | 150.000 đ/lần | Đang hoạt động |
| 4 | Di dời chậu cây | `di-doi-chau-cay` | 150.000 đ/lần | Đang hoạt động |
| 5 | Kiểm tra sâu bệnh | `kiem-tra-sau-benh` | 150.000 đ/lần | Đang hoạt động |
| 6 | Thay đất / thay chậu | `thay-dat-thay-chau` | 150.000 đ/lần | Đang hoạt động |
| 7 | Trồng cây mới | `trong-cay-moi` | 150.000 đ/lần | Đang hoạt động |
| 8 | Tưới và chăm sóc định kỳ | `tuoi-va-cham-soc-dinh-ky` | 150.000 đ/lần | Đang hoạt động |
| 9 | Tạo dáng cây cảnh | `tao-dang-cay-canh` | 150.000 đ/lần | Đang hoạt động |
| 10 | Xử lý vàng lá / héo cây | `xu-ly-vang-la-heo-cay` | 150.000 đ/lần | Đang hoạt động |

### 2.3. Hàng rào cây / Bồn hoa / Vườn rau

- **Mã đối tượng:** `hang-rao-cay-bon-hoa-vuon-rau`
- **ID đối tượng:** `059da690-c6be-46a8-83d5-d96e250cbe4f`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bón phân và chăm sóc | `bon-phan-va-cham-soc` | 150.000 đ/lần | Đang hoạt động |
| 2 | Cắt tỉa hàng rào cây | `cat-tia-hang-rao-cay` | 150.000 đ/lần | Đang hoạt động |
| 3 | Kiểm tra sâu bệnh | `kiem-tra-sau-benh-hang-rao-cay-bon-hoa-vuon-rau` | 150.000 đ/lần | Đang hoạt động |
| 4 | Làm luống trồng rau | `lam-luong-trong-rau` | 150.000 đ/lần | Đang hoạt động |
| 5 | Nhổ cỏ và dọn bồn hoa | `nho-co-va-don-bon-hoa` | 150.000 đ/lần | Đang hoạt động |
| 6 | Thay đất / bổ sung giá thể | `thay-dat-bo-sung-gia-the` | 150.000 đ/lần | Đang hoạt động |
| 7 | Thu gom lá / cành | `thu-gom-la-canh` | 150.000 đ/lần | Đang hoạt động |
| 8 | Trồng hoa theo mùa | `trong-hoa-theo-mua` | 150.000 đ/lần | Đang hoạt động |
| 9 | Trồng rau / cây gia vị | `trong-rau-cay-gia-vi` | 150.000 đ/lần | Đang hoạt động |
| 10 | Tạo hình cây hàng rào | `tao-hinh-cay-hang-rao` | 150.000 đ/lần | Đang hoạt động |

### 2.4. Hệ thống tưới / Sân vườn tổng thể

- **Mã đối tượng:** `he-thong-tuoi-san-vuon-tong-the`
- **ID đối tượng:** `cc0ab115-0758-4fd3-a4ad-b10a68cd0cdb`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 12

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Chăm sóc sân vườn định kỳ | `cham-soc-san-vuon-dinh-ky` | 150.000 đ/lần | Đang hoạt động |
| 2 | Cài đặt lịch tưới | `cai-dat-lich-tuoi` | 150.000 đ/lần | Đang hoạt động |
| 3 | Cải tạo / bố trí cây xanh | `cai-tao-bo-tri-cay-xanh` | 150.000 đ/lần | Đang hoạt động |
| 4 | Dọn vệ sinh sân vườn | `don-ve-sinh-san-vuon` | 150.000 đ/lần | Đang hoạt động |
| 5 | Khảo sát thiết kế cảnh quan nhỏ | `khao-sat-thiet-ke-canh-quan-nho` | 150.000 đ/lần | Đang hoạt động |
| 6 | Kiểm tra áp lực hệ thống tưới | `kiem-tra-ap-luc-he-thong-tuoi` | 150.000 đ/lần | Đang hoạt động |
| 7 | Lắp hệ thống tưới tự động | `lap-he-thong-tuoi-tu-dong` | 150.000 đ/lần | Đang hoạt động |
| 8 | Sửa bộ hẹn giờ tưới | `sua-bo-hen-gio-tuoi` | 150.000 đ/lần | Đang hoạt động |
| 9 | Sửa đầu tưới bị nghẹt | `sua-dau-tuoi-bi-nghet` | 150.000 đ/lần | Đang hoạt động |
| 10 | Sửa ống tưới rò nước | `sua-ong-tuoi-ro-nuoc` | 150.000 đ/lần | Đang hoạt động |
| 11 | Thay van / đầu phun tưới | `thay-van-dau-phun-tuoi` | 150.000 đ/lần | Đang hoạt động |
| 12 | Thu gom lá / rác hữu cơ | `thu-gom-la-rac-huu-co` | 150.000 đ/lần | Đang hoạt động |

### 2.5. Thảm cỏ / Bãi cỏ

- **Mã đối tượng:** `tham-co-bai-co`
- **ID đối tượng:** `32acffd8-6255-49b1-8035-eb34a5dff180`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bón phân / cải tạo đất thảm cỏ | `bon-phan-cai-tao-dat-tham-co` | 150.000 đ/lần | Đang hoạt động |
| 2 | Cắt cỏ mọc cao | `cat-co-moc-cao` | 150.000 đ/lần | Đang hoạt động |
| 3 | Cắt cỏ định kỳ | `cat-co-dinh-ky` | 150.000 đ/lần | Đang hoạt động |
| 4 | Dặm cỏ bị trống | `dam-co-bi-trong` | 150.000 đ/lần | Đang hoạt động |
| 5 | Nhổ / dọn cỏ dại | `nho-don-co-dai` | 150.000 đ/lần | Đang hoạt động |
| 6 | Thu gom cỏ sau cắt | `thu-gom-co-sau-cat` | 150.000 đ/lần | Đang hoạt động |
| 7 | Trồng mới thảm cỏ | `trong-moi-tham-co` | 150.000 đ/lần | Đang hoạt động |
| 8 | Tưới và chăm sóc thảm cỏ | `tuoi-va-cham-soc-tham-co` | 150.000 đ/lần | Đang hoạt động |
| 9 | Xử lý sâu bệnh thảm cỏ | `xu-ly-sau-benh-tham-co` | 150.000 đ/lần | Đang hoạt động |

## 3. Sửa nước

- **Mã danh mục:** `sua-nuoc`
- **ID danh mục:** `2a367f64-e8b2-4b94-8227-f5058c842af8`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng:** 7
- **Số dịch vụ:** 70

### 3.1. Bể tự hoại / Hố ga / Cống thoát

- **Mã đối tượng:** `be-tu-hoai-ho-ga-cong-thoat`
- **ID đối tượng:** `d9924692-19d1-4185-9e35-b381953c42a3`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Hút bể tự hoại qua đơn vị chuyên trách | `hut-be-tu-hoai-qua-don-vi-chuyen-trach` | 150.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra / sửa nắp hố ga | `kiem-tra-sua-nap-ho-ga` | 150.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra cống thoát bị trào ngược | `kiem-tra-cong-thoat-bi-trao-nguoc` | 150.000 đ/điểm | Đang hoạt động |
| 4 | Nạo vét hố ga | `nao-vet-ho-ga` | 150.000 đ/điểm | Đang hoạt động |
| 5 | Sửa đoạn ống thoát ngoài nhà | `sua-doan-ong-thoat-ngoai-nha` | 150.000 đ/điểm | Đang hoạt động |
| 6 | Thông tắc hố ga | `thong-tac-ho-ga` | 150.000 đ/điểm | Đang hoạt động |
| 7 | Thông tắc đường cống | `thong-tac-duong-cong` | 150.000 đ/điểm | Đang hoạt động |
| 8 | Xử lý mùi hôi hố ga | `xu-ly-mui-hoi-ho-ga` | 150.000 đ/điểm | Đang hoạt động |

### 3.2. Bồn cầu / Két nước

- **Mã đối tượng:** `bon-cau-ket-nuoc`
- **ID đối tượng:** `78e95d0e-4ea5-43d1-b0fe-9b3d9be8b3c3`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Lắp đặt / thay bồn cầu | `lap-dat-thay-bon-cau` | 150.000 đ/điểm | Đang hoạt động |
| 2 | Sửa bồn cầu không xả | `sua-bon-cau-khong-xa` | 150.000 đ/điểm | Đang hoạt động |
| 3 | Sửa bồn cầu rò nước | `sua-bon-cau-ro-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 4 | Sửa bồn cầu xả yếu | `sua-bon-cau-xa-yeu` | 150.000 đ/điểm | Đang hoạt động |
| 5 | Thay bộ xả / nút nhấn | `thay-bo-xa-nut-nhan` | 150.000 đ/điểm | Đang hoạt động |
| 6 | Thay nắp / bệ ngồi | `thay-nap-be-ngoi` | 150.000 đ/điểm | Đang hoạt động |
| 7 | Thay phao / van cấp | `thay-phao-van-cap` | 150.000 đ/điểm | Đang hoạt động |
| 8 | Thông tắc bồn cầu | `thong-tac-bon-cau` | 150.000 đ/điểm | Đang hoạt động |
| 9 | Xử lý mùi hôi quanh bồn cầu | `xu-ly-mui-hoi-quanh-bon-cau` | 150.000 đ/điểm | Đang hoạt động |
| 10 | Xử lý rò nước tại chân bồn cầu | `xu-ly-ro-nuoc-tai-chan-bon-cau` | 150.000 đ/điểm | Đang hoạt động |

### 3.3. Bồn nước / Máy bơm / Phao nước

- **Mã đối tượng:** `bon-nuoc-may-bom-phao-nuoc`
- **ID đối tượng:** `47c02e77-5604-49ae-8ca7-a38f619acd0d`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 12

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo trì hệ thống cấp nước | `bao-tri-he-thong-cap-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 2 | Lắp đặt / di dời bồn nước | `lap-dat-di-doi-bon-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 3 | Lắp đặt / thay máy bơm | `lap-dat-thay-may-bom` | 150.000 đ/điểm | Đang hoạt động |
| 4 | Sửa / thay phao điện | `sua-thay-phao-dien` | 150.000 đ/điểm | Đang hoạt động |
| 5 | Sửa bơm chạy liên tục | `sua-bom-chay-lien-tuc` | 150.000 đ/điểm | Đang hoạt động |
| 6 | Sửa bơm không chạy | `sua-bom-khong-chay` | 150.000 đ/điểm | Đang hoạt động |
| 7 | Sửa bơm không lên nước | `sua-bom-khong-len-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 8 | Sửa bơm kêu to | `sua-bom-keu-to` | 150.000 đ/điểm | Đang hoạt động |
| 9 | Sửa bồn nước rò rỉ | `sua-bon-nuoc-ro-ri` | 150.000 đ/điểm | Đang hoạt động |
| 10 | Sửa rơ le áp suất / bộ điều khiển | `sua-ro-le-ap-suat-bo-dieu-khien` | 150.000 đ/điểm | Đang hoạt động |
| 11 | Thay phao cơ | `thay-phao-co` | 150.000 đ/điểm | Đang hoạt động |
| 12 | Vệ sinh bồn chứa nước | `ve-sinh-bon-chua-nuoc` | 150.000 đ/điểm | Đang hoạt động |

### 3.4. Lavabo / Chậu rửa / Bồn rửa

- **Mã đối tượng:** `lavabo-chau-rua-bon-rua`
- **ID đối tượng:** `4f2dd034-f575-49b6-a913-cea3a620b618`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Lắp đặt / thay chậu rửa | `lap-dat-thay-chau-rua` | 150.000 đ/điểm | Đang hoạt động |
| 2 | Sửa rò nước dưới chậu | `sua-ro-nuoc-duoi-chau` | 150.000 đ/điểm | Đang hoạt động |
| 3 | Sửa thoát nước chậm | `sua-thoat-nuoc-cham` | 150.000 đ/điểm | Đang hoạt động |
| 4 | Sửa vòi chậu rửa | `sua-voi-chau-rua` | 150.000 đ/điểm | Đang hoạt động |
| 5 | Thay xi phông / bộ xả | `thay-xi-phong-bo-xa` | 150.000 đ/điểm | Đang hoạt động |
| 6 | Thay ống mềm cấp nước | `thay-ong-mem-cap-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 7 | Thông tắc lavabo / chậu rửa | `thong-tac-lavabo-chau-rua` | 150.000 đ/điểm | Đang hoạt động |
| 8 | Trám kín mép chậu | `tram-kin-mep-chau` | 150.000 đ/điểm | Đang hoạt động |
| 9 | Xử lý mùi hôi đường thoát | `xu-ly-mui-hoi-duong-thoat` | 150.000 đ/điểm | Đang hoạt động |

### 3.5. Phễu thoát sàn / Khu vực phòng tắm

- **Mã đối tượng:** `pheu-thoat-san-khu-vuc-phong-tam`
- **ID đối tượng:** `3a9061ae-55b0-4130-b48c-7b6f1c281247`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra đọng nước khu vực tắm | `kiem-tra-dong-nuoc-khu-vuc-tam` | 150.000 đ/điểm | Đang hoạt động |
| 2 | Lắp van ngăn mùi / ngăn trào | `lap-van-ngan-mui-ngan-trao` | 150.000 đ/điểm | Đang hoạt động |
| 3 | Sửa rò nước đường xả sàn | `sua-ro-nuoc-duong-xa-san` | 150.000 đ/điểm | Đang hoạt động |
| 4 | Sửa đường cấp nước vòi sen | `sua-duong-cap-nuoc-voi-sen` | 150.000 đ/điểm | Đang hoạt động |
| 5 | Thay phễu thoát sàn | `thay-pheu-thoat-san` | 150.000 đ/điểm | Đang hoạt động |
| 6 | Thay phụ kiện thoát nước | `thay-phu-kien-thoat-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 7 | Thông tắc phễu thoát sàn | `thong-tac-pheu-thoat-san` | 150.000 đ/điểm | Đang hoạt động |
| 8 | Xử lý mùi hôi từ phễu thoát | `xu-ly-mui-hoi-tu-pheu-thoat` | 150.000 đ/điểm | Đang hoạt động |
| 9 | Xử lý thoát nước sàn chậm | `xu-ly-thoat-nuoc-san-cham` | 150.000 đ/điểm | Đang hoạt động |

### 3.6. Vòi nước / Vòi sen

- **Mã đối tượng:** `voi-nuoc-voi-sen`
- **ID đối tượng:** `520cae18-9d24-4109-850f-1752f26f05ee`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra rò nước tại chân vòi | `kiem-tra-ro-nuoc-tai-chan-voi` | 150.000 đ/điểm | Đang hoạt động |
| 2 | Lắp đặt vòi mới | `lap-dat-voi-moi` | 150.000 đ/điểm | Đang hoạt động |
| 3 | Sửa / thay van khóa nước | `sua-thay-van-khoa-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 4 | Sửa vòi bị kẹt / khó khóa | `sua-voi-bi-ket-kho-khoa` | 150.000 đ/điểm | Đang hoạt động |
| 5 | Sửa vòi chảy yếu | `sua-voi-chay-yeu` | 150.000 đ/điểm | Đang hoạt động |
| 6 | Sửa vòi rò nước | `sua-voi-ro-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 7 | Thay lõi trộn / gioăng | `thay-loi-tron-gioang` | 150.000 đ/điểm | Đang hoạt động |
| 8 | Thay vòi lavabo | `thay-voi-lavabo` | 150.000 đ/điểm | Đang hoạt động |
| 9 | Thay vòi rửa chén | `thay-voi-rua-chen` | 150.000 đ/điểm | Đang hoạt động |
| 10 | Thay vòi sen / dây sen / bát sen | `thay-voi-sen-day-sen-bat-sen` | 150.000 đ/điểm | Đang hoạt động |

### 3.7. Đường ống cấp / thoát nước

- **Mã đối tượng:** `duong-ong-cap-thoat-nuoc`
- **ID đối tượng:** `f27226de-570a-4c1e-84b5-dc419fe9c32e`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 12

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Cải tạo đường ống cấp thoát | `cai-tao-duong-ong-cap-thoat` | 150.000 đ/điểm | Đang hoạt động |
| 2 | Dò tìm vị trí rò nước | `do-tim-vi-tri-ro-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra áp lực nước | `kiem-tra-ap-luc-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 4 | Lắp van khóa / van một chiều | `lap-van-khoa-van-mot-chieu` | 150.000 đ/điểm | Đang hoạt động |
| 5 | Lắp đặt đường ống nước mới | `lap-dat-duong-ong-nuoc-moi` | 150.000 đ/điểm | Đang hoạt động |
| 6 | Sửa mối nối / co / tê | `sua-moi-noi-co-te` | 150.000 đ/điểm | Đang hoạt động |
| 7 | Sửa đường ống âm tường | `sua-duong-ong-am-tuong` | 150.000 đ/điểm | Đang hoạt động |
| 8 | Sửa ống cấp nước rò rỉ | `sua-ong-cap-nuoc-ro-ri` | 150.000 đ/điểm | Đang hoạt động |
| 9 | Thay đoạn ống nứt / vỡ | `thay-doan-ong-nut-vo` | 150.000 đ/điểm | Đang hoạt động |
| 10 | Thông tắc ống thoát nước | `thong-tac-ong-thoat-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 11 | Xử lý mùi hôi đường thoát | `xu-ly-mui-hoi-duong-thoat-duong-ong-cap-thoat-nuoc` | 150.000 đ/điểm | Đang hoạt động |
| 12 | Xử lý thoát nước chậm | `xu-ly-thoat-nuoc-cham` | 150.000 đ/điểm | Đang hoạt động |

## 4. Sửa điện

- **Mã danh mục:** `sua-dien`
- **ID danh mục:** `4d397d29-ec22-4eae-88ea-8e411e04bdb3`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng:** 29
- **Số dịch vụ:** 289

### 4.1. Aptomat / CB / MCB

- **Mã đối tượng:** `aptomat-cb-mcb`
- **ID đối tượng:** `484e7b6f-469e-4b22-acd8-bae2b7ea60a1`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra CB không đóng được | `kiem-tra-cb-khong-dong-duoc` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra CB nhảy liên tục | `kiem-tra-cb-nhay-lien-tuc` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra CB phát nóng | `kiem-tra-cb-phat-nong` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra lỗi quá tải / ngắn mạch | `kiem-tra-loi-qua-tai-ngan-mach` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra mất điện do CB | `kiem-tra-mat-dien-do-cb` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Lắp aptomat mới | `lap-aptomat-moi` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Thay CB nhánh | `thay-cb-nhanh` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay CB tổng | `thay-cb-tong` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay aptomat hỏng | `thay-aptomat-hong` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Đánh giá tải để chọn CB đúng thông số | `danh-gia-tai-de-chon-cb-dung-thong-so` | 100.000 đ/điểm | Đang hoạt động |

### 4.2. Bóng đèn / Đèn LED

- **Mã đối tượng:** `bong-den-den-led`
- **ID đối tượng:** `b45c19d2-93d2-43ac-8330-87d223d941b4`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 11

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra đèn phát nóng bất thường | `kiem-tra-den-phat-nong-bat-thuong` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp đèn gắn tường | `lap-den-gan-tuong` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp đèn âm trần | `lap-den-am-tran` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp đèn ốp trần | `lap-den-op-tran` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sửa đèn không sáng | `sua-den-khong-sang` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa đèn nhấp nháy | `sua-den-nhap-nhay` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa đèn sáng yếu | `sua-den-sang-yeu` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay bóng LED | `thay-bong-led` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay bóng tuýp | `thay-bong-tuyp` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Thay driver / nguồn LED | `thay-driver-nguon-led` | 100.000 đ/điểm | Đang hoạt động |
| 11 | Thay đui đèn | `thay-dui-den` | 100.000 đ/điểm | Đang hoạt động |

### 4.3. Bộ sạc xe điện / Ổ cắm sạc

- **Mã đối tượng:** `bo-sac-xe-dien-o-cam-sac`
- **ID đối tượng:** `34f7d2f7-e63f-4081-b968-2b8275cab527`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo trì cấp điện bộ sạc | `bao-tri-cap-dien-bo-sac` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Khảo sát vị trí lắp sạc | `khao-sat-vi-tri-lap-sac` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra sạc báo lỗi | `kiem-tra-sac-bao-loi` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra sạc không cấp điện | `kiem-tra-sac-khong-cap-dien` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra thiết bị bảo vệ nhánh sạc | `kiem-tra-thiet-bi-bao-ve-nhanh-sac` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Kiểm tra tiếp địa sạc | `kiem-tra-tiep-dia-sac` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Kiểm tra ổ sạc phát nóng | `kiem-tra-o-sac-phat-nong` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Lắp bộ sạc tại nhà | `lap-bo-sac-tai-nha` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Lắp mạch cấp điện riêng | `lap-mach-cap-dien-rieng` | 100.000 đ/điểm | Đang hoạt động |

### 4.4. Chuông cửa / Nút nhấn

- **Mã đối tượng:** `chuong-cua-nut-nhan`
- **ID đối tượng:** `b5e21dc2-ed41-4aaa-9f0f-8f5f5aaf025c`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra mất kết nối chuông | `kiem-tra-mat-ket-noi-chuong` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp chuông có dây | `lap-chuong-co-day` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp chuông không dây | `lap-chuong-khong-day` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp chuông màn hình | `lap-chuong-man-hinh` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Lắp chuông thông minh | `lap-chuong-thong-minh` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa bộ cấp nguồn chuông | `sua-bo-cap-nguon-chuong` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa chuông không kêu | `sua-chuong-khong-keu` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa chuông kêu liên tục | `sua-chuong-keu-lien-tuc` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay bộ chuông | `thay-bo-chuong` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Thay nút nhấn | `thay-nut-nhan` | 100.000 đ/điểm | Đang hoạt động |

### 4.5. Công tắc thông minh / Relay

- **Mã đối tượng:** `cong-tac-thong-minh-relay`
- **ID đối tượng:** `1c1b61c3-be55-4d27-8a32-46410e2a2017`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Cài lịch tự động | `cai-lich-tu-dong` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra tương thích tải / dây trung tính | `kiem-tra-tuong-thich-tai-day-trung-tinh` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kết nối ứng dụng | `ket-noi-ung-dung` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp công tắc thông minh Wi-Fi | `lap-cong-tac-thong-minh-wi-fi` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Lắp công tắc thông minh Zigbee | `lap-cong-tac-thong-minh-zigbee` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Lắp relay điều khiển | `lap-relay-dieu-khien` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Nâng cấp công tắc cơ | `nang-cap-cong-tac-co` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa công tắc mất kết nối | `sua-cong-tac-mat-ket-noi` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Sửa công tắc thông minh không hoạt động | `sua-cong-tac-thong-minh-khong-hoat-dong` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Sửa relay không đóng / ngắt | `sua-relay-khong-dong-ngat` | 100.000 đ/điểm | Đang hoạt động |

### 4.6. Công tắc điện

- **Mã đối tượng:** `cong-tac-dien`
- **ID đối tượng:** `f2b5a73e-b1e3-45c2-97c1-a09015ad18b6`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Di dời công tắc | `di-doi-cong-tac` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp công tắc cảm ứng | `lap-cong-tac-cam-ung` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp công tắc âm tường / nổi | `lap-cong-tac-am-tuong-noi` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp công tắc điều chỉnh độ sáng | `lap-cong-tac-dieu-chinh-do-sang` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sửa công tắc chập chờn | `sua-cong-tac-chap-chon` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa công tắc hai chiều / cầu thang | `sua-cong-tac-hai-chieu-cau-thang` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa công tắc không hoạt động | `sua-cong-tac-khong-hoat-dong` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa công tắc kẹt | `sua-cong-tac-ket` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Sửa công tắc điều chỉnh độ sáng | `sua-cong-tac-dieu-chinh-do-sang` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Thay công tắc hỏng | `thay-cong-tac-hong` | 100.000 đ/điểm | Đang hoạt động |

### 4.7. Cảm biến / Thiết bị tự động

- **Mã đối tượng:** `cam-bien-thiet-bi-tu-dong`
- **ID đối tượng:** `56725529-2a0c-4bdf-a437-4f18d98b5939`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Cấu hình điều khiển thông minh | `cau-hinh-dieu-khien-thong-minh` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp bộ điều khiển đèn tự động | `lap-bo-dieu-khien-den-tu-dong` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp công tắc hẹn giờ | `lap-cong-tac-hen-gio` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp cảm biến chuyển động | `lap-cam-bien-chuyen-dong` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Lắp cảm biến hiện diện | `lap-cam-bien-hien-dien` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Lắp cảm biến ánh sáng | `lap-cam-bien-anh-sang` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa bộ điều khiển tự động | `sua-bo-dieu-khien-tu-dong` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa công tắc hẹn giờ | `sua-cong-tac-hen-gio` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Sửa cảm biến chuyển động | `sua-cam-bien-chuyen-dong` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Sửa cảm biến ánh sáng | `sua-cam-bien-anh-sang` | 100.000 đ/điểm | Đang hoạt động |

### 4.8. Dây điện / Cáp điện

- **Mã đối tượng:** `day-dien-cap-dien`
- **ID đối tượng:** `36d41107-3c4a-4a4e-9aa1-22cba07aed57`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 13

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bổ sung đường dây cấp điện | `bo-sung-duong-day-cap-dien` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra dây điện đứt | `kiem-tra-day-dien-dut` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Luồn dây trong ống | `luon-day-trong-ong` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Sửa mối nối lỏng | `sua-moi-noi-long` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Thay cáp nguồn | `thay-cap-nguon` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Thay dây cũ / xuống cấp | `thay-day-cu-xuong-cap` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Thay dây hở lõi | `thay-day-ho-loi` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay dây điện cháy | `thay-day-dien-chay` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Xử lý dây điện chập | `xu-ly-day-dien-chap` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Đi dây trong máng cáp | `di-day-trong-mang-cap` | 100.000 đ/điểm | Đang hoạt động |
| 11 | Đi dây điện nổi | `di-day-dien-noi` | 100.000 đ/điểm | Đang hoạt động |
| 12 | Đi dây điện âm tường | `di-day-dien-am-tuong` | 100.000 đ/điểm | Đang hoạt động |
| 13 | Đánh giá tiết diện dây theo tải | `danh-gia-tiet-dien-day-theo-tai` | 100.000 đ/điểm | Đang hoạt động |

### 4.9. Hệ thống điện phòng

- **Mã đối tượng:** `he-thong-dien-phong`
- **ID đối tượng:** `cc357a32-647e-4598-9c0c-86c6d62f2427`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 11

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bổ sung mạch điện khu vực | `bo-sung-mach-dien-khu-vuc` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra mất điện ban công | `kiem-tra-mat-dien-ban-cong` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra mất điện nhà bếp | `kiem-tra-mat-dien-nha-bep` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra mất điện phòng khách | `kiem-tra-mat-dien-phong-khach` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra mất điện phòng ngủ | `kiem-tra-mat-dien-phong-ngu` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Kiểm tra mất điện phòng tắm | `kiem-tra-mat-dien-phong-tam` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Kiểm tra mất điện sân vườn | `kiem-tra-mat-dien-san-vuon` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Kiểm tra quá tải khu vực | `kiem-tra-qua-tai-khu-vuc` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Kiểm tra điện chập chờn một phòng | `kiem-tra-dien-chap-chon-mot-phong` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Lắp thêm ổ cắm / công tắc | `lap-them-o-cam-cong-tac` | 100.000 đ/điểm | Đang hoạt động |
| 11 | Nâng cấp điện một phòng | `nang-cap-dien-mot-phong` | 100.000 đ/điểm | Đang hoạt động |

### 4.10. Hệ thống điện toàn nhà

- **Mã đối tượng:** `he-thong-dien-toan-nha`
- **ID đối tượng:** `481e60aa-a20b-466e-8ae0-c581284e67ee`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 13

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo trì hệ thống điện | `bao-tri-he-thong-dien` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Cải tạo điện nhà cũ | `cai-tao-dien-nha-cu` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Khoanh vùng sự cố chập điện | `khoanh-vung-su-co-chap-dien` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra mất điện toàn nhà | `kiem-tra-mat-dien-toan-nha` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra nhánh điện | `kiem-tra-nhanh-dien` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Kiểm tra quá tải | `kiem-tra-qua-tai` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Kiểm tra rò điện | `kiem-tra-ro-dien` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Kiểm tra sụt áp | `kiem-tra-sut-ap` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Kiểm tra điện chập chờn | `kiem-tra-dien-chap-chon` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Kiểm tra điện áp bất thường | `kiem-tra-dien-ap-bat-thuong` | 100.000 đ/điểm | Đang hoạt động |
| 11 | Kiểm tra đường cấp nguồn chính | `kiem-tra-duong-cap-nguon-chinh` | 100.000 đ/điểm | Đang hoạt động |
| 12 | Lắp đặt điện nhà mới | `lap-dat-dien-nha-moi` | 100.000 đ/điểm | Đang hoạt động |
| 13 | Nghiệm thu an toàn điện | `nghiem-thu-an-toan-dien` | 100.000 đ/điểm | Đang hoạt động |

### 4.11. Hộp nối điện / Hộp kỹ thuật

- **Mã đối tượng:** `hop-noi-dien-hop-ky-thuat`
- **ID đối tượng:** `56d03ad1-b3a0-469a-bf79-ec9e83d23e08`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra mối nối phát nóng | `kiem-tra-moi-noi-phat-nong` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp hộp kỹ thuật | `lap-hop-ky-thuat` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp hộp nối mới | `lap-hop-noi-moi` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Sắp xếp dây trong hộp nối | `sap-xep-day-trong-hop-noi` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sửa hộp nối bị chập | `sua-hop-noi-bi-chap` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa mối nối lỏng | `sua-moi-noi-long-hop-noi-dien-hop-ky-thuat` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Thay hộp nối | `thay-hop-noi` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay nắp hộp nối | `thay-nap-hop-noi` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay đầu nối | `thay-dau-noi` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Xử lý nước xâm nhập hộp điện | `xu-ly-nuoc-xam-nhap-hop-dien` | 100.000 đ/điểm | Đang hoạt động |

### 4.12. Kiểm tra / Khảo sát sự cố điện

- **Mã đối tượng:** `kiem-tra-khao-sat-su-co-dien`
- **ID đối tượng:** `53a59ef2-9ffe-4206-940f-bc364951b917`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Khảo sát nâng cấp điện | `khao-sat-nang-cap-dien` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Khảo sát sửa điện tại nhà | `khao-sat-sua-dien-tai-nha` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra an toàn trước sử dụng | `kiem-tra-an-toan-truoc-su-dung` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra sự cố chưa xác định | `kiem-tra-su-co-chua-xac-dinh` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra tình trạng cách điện | `kiem-tra-tinh-trang-cach-dien` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Kiểm tra điểm phát nóng | `kiem-tra-diem-phat-nong` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Lập phương án sửa chữa | `lap-phuong-an-sua-chua` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Nghiệm thu sau sửa chữa | `nghiem-thu-sau-sua-chua` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Đo điện áp / dòng tải | `do-dien-ap-dong-tai` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Đánh giá phụ tải | `danh-gia-phu-tai` | 100.000 đ/điểm | Đang hoạt động |

### 4.13. Máy bơm nước – Phần điện

- **Mã đối tượng:** `may-bom-nuoc-phan-dien`
- **ID đối tượng:** `bc70283c-4093-4574-aa3f-f5ef1fcdb353`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra đường cấp điện máy bơm | `kiem-tra-duong-cap-dien-may-bom` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra động cơ quá nhiệt | `kiem-tra-dong-co-qua-nhiet` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp bảo vệ máy bơm | `lap-bao-ve-may-bom` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Sửa bơm không khởi động | `sua-bom-khong-khoi-dong` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sửa bơm không lên nguồn | `sua-bom-khong-len-nguon` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa công tắc áp suất | `sua-cong-tac-ap-suat` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa phao điện | `sua-phao-dien` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa điều khiển bơm tự động | `sua-dieu-khien-bom-tu-dong` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay tụ khởi động | `thay-tu-khoi-dong` | 100.000 đ/điểm | Đang hoạt động |

### 4.14. Nguồn cấp cho thiết bị cố định

- **Mã đối tượng:** `nguon-cap-cho-thiet-bi-co-dinh`
- **ID đối tượng:** `9e70ad4f-39e3-44f9-90d6-cb70c8ce9fbe`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra CB nhánh thiết bị | `kiem-tra-cb-nhanh-thiet-bi` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra tiếp điểm phát nóng | `kiem-tra-tiep-diem-phat-nong` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp công tắc cách ly thiết bị | `lap-cong-tac-cach-ly-thiet-bi` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp nguồn riêng cho bình nóng lạnh | `lap-nguon-rieng-cho-binh-nong-lanh` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Lắp nguồn riêng cho bếp điện | `lap-nguon-rieng-cho-bep-dien` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Lắp nguồn riêng cho máy giặt | `lap-nguon-rieng-cho-may-giat` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Lắp nguồn riêng cho máy lạnh | `lap-nguon-rieng-cho-may-lanh` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay dây cấp nguồn cố định | `thay-day-cap-nguon-co-dinh` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Đo điện áp cấp cho thiết bị | `do-dien-ap-cap-cho-thiet-bi` | 100.000 đ/điểm | Đang hoạt động |

### 4.15. Nguồn điện / Adapter / Bộ nguồn

- **Mã đối tượng:** `nguon-dien-adapter-bo-nguon`
- **ID đối tượng:** `199c79fa-7e5d-424f-bb45-f2fd9242024f`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra adapter không ra điện | `kiem-tra-adapter-khong-ra-dien` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra bộ nguồn DC | `kiem-tra-bo-nguon-dc` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra dây / đầu cắm nguồn | `kiem-tra-day-dau-cam-nguon` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra nguồn phát nóng | `kiem-tra-nguon-phat-nong` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Lắp bộ nguồn đúng thông số | `lap-bo-nguon-dung-thong-so` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa bộ nguồn không cấp điện | `sua-bo-nguon-khong-cap-dien` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Thay adapter hỏng | `thay-adapter-hong` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay bộ chuyển đổi điện áp | `thay-bo-chuyen-doi-dien-ap` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay nguồn LED | `thay-nguon-led` | 100.000 đ/điểm | Đang hoạt động |

### 4.16. Quạt thông gió / Quạt hút

- **Mã đối tượng:** `quat-thong-gio-quat-hut`
- **ID đối tượng:** `9b5276c6-9692-46be-a8ad-f3e1afdac569`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Lắp quạt hút gắn tường / trần | `lap-quat-hut-gan-tuong-tran` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp quạt hút nhà vệ sinh | `lap-quat-hut-nha-ve-sinh` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp quạt thông gió | `lap-quat-thong-gio` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Sửa quạt hút yếu | `sua-quat-hut-yeu` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sửa quạt không chạy | `sua-quat-khong-chay` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa quạt rung / kêu | `sua-quat-rung-keu-quat-thong-gio-quat-hut` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Thay công tắc | `thay-cong-tac` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay quạt hút | `thay-quat-hut` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay động cơ / tụ | `thay-dong-co-tu` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Vệ sinh quạt | `ve-sinh-quat` | 100.000 đ/điểm | Đang hoạt động |

### 4.17. Quạt trần / Quạt treo tường

- **Mã đối tượng:** `quat-tran-quat-treo-tuong`
- **ID đối tượng:** `492a7d40-96f6-4b1a-8146-34956f8a95f8`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 11

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo dưỡng quạt | `bao-duong-quat` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp quạt treo tường | `lap-quat-treo-tuong` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp quạt trần | `lap-quat-tran` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Sửa bộ điều tốc | `sua-bo-dieu-toc` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sửa quạt không quay | `sua-quat-khong-quay` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa quạt quay chậm | `sua-quat-quay-cham` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa quạt rung / kêu | `sua-quat-rung-keu` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa điều khiển quạt | `sua-dieu-khien-quat` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay công tắc quạt | `thay-cong-tac-quat` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Thay tụ quạt | `thay-tu-quat` | 100.000 đ/điểm | Đang hoạt động |
| 11 | Tháo / di dời quạt trần | `thao-di-doi-quat-tran` | 100.000 đ/điểm | Đang hoạt động |

### 4.18. Thiết bị chống rò / Chống giật

- **Mã đối tượng:** `thiet-bi-chong-ro-chong-giat`
- **ID đối tượng:** `9a3f2d63-e61b-4d6c-8ff0-15e179c15d02`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Khoanh vùng nhánh điện rò | `khoanh-vung-nhanh-dien-ro` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra RCCB / RCBO nhảy liên tục | `kiem-tra-rccb-rcbo-nhay-lien-tuc` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra dòng rò | `kiem-tra-dong-ro` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra nút TEST | `kiem-tra-nut-test` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra thiết bị chống rò không đóng được | `kiem-tra-thiet-bi-chong-ro-khong-dong-duoc` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Kiểm tra đấu nối trung tính / tiếp địa | `kiem-tra-dau-noi-trung-tinh-tiep-dia` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Lắp thiết bị chống rò | `lap-thiet-bi-chong-ro` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay RCCB / RCBO hỏng | `thay-rccb-rcbo-hong` | 100.000 đ/điểm | Đang hoạt động |

### 4.19. Thiết bị đo điện / Công tơ điện

- **Mã đối tượng:** `thiet-bi-do-dien-cong-to-dien`
- **ID đối tượng:** `93797cd8-e539-456e-a38f-f76316e84107`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Chuyển yêu cầu liên quan công tơ niêm phong cho đơn vị điện lực | `chuyen-yeu-cau-lien-quan-cong-to-niem-phong-cho-don-vi-dien-luc` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra bộ đo điện năng thông minh | `kiem-tra-bo-do-dien-nang-thong-minh` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra công tơ mất hiển thị | `kiem-tra-cong-to-mat-hien-thi` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra dây cấp cho công tơ phụ | `kiem-tra-day-cap-cho-cong-to-phu` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra kết nối công tơ phụ | `kiem-tra-ket-noi-cong-to-phu` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Kiểm tra sai lệch đo đếm sơ bộ | `kiem-tra-sai-lech-do-dem-so-bo` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Lắp bộ giám sát tiêu thụ điện | `lap-bo-giam-sat-tieu-thu-dien` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Lắp công tơ phụ nội bộ | `lap-cong-to-phu-noi-bo` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay công tơ phụ hỏng | `thay-cong-to-phu-hong` | 100.000 đ/điểm | Đang hoạt động |

### 4.20. Tiếp địa / Chống sét

- **Mã đối tượng:** `tiep-dia-chong-set`
- **ID đối tượng:** `aa15b0ce-a9e6-4faf-9c87-1d5102d339f5`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo trì chống sét | `bao-tri-chong-set` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Bổ sung tiếp địa ổ cắm | `bo-sung-tiep-dia-o-cam` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra SPD | `kiem-tra-spd` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra dây tiếp địa đứt | `kiem-tra-day-tiep-dia-dut` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra hệ thống tiếp địa | `kiem-tra-he-thong-tiep-dia` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Kiểm tra liên kết đẳng thế | `kiem-tra-lien-ket-dang-the` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Lắp hệ thống tiếp địa | `lap-he-thong-tiep-dia` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa mối nối tiếp địa | `sua-moi-noi-tiep-dia` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay SPD hỏng | `thay-spd-hong` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Đo điện trở tiếp địa | `do-dien-tro-tiep-dia` | 100.000 đ/điểm | Đang hoạt động |

### 4.21. Tủ điện / Bảng điện

- **Mã đối tượng:** `tu-dien-bang-dien`
- **ID đối tượng:** `470acb27-41b1-4d36-9ee3-84b9bbc857de`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 11

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo trì tủ điện | `bao-tri-tu-dien` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp bảng điện | `lap-bang-dien` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp tủ điện dân dụng | `lap-tu-dien-dan-dung` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Nâng cấp tủ điện | `nang-cap-tu-dien` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sắp xếp / đánh nhãn các nhánh | `sap-xep-danh-nhan-cac-nhanh` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa bảng điện hỏng | `sua-bang-dien-hong` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa tủ điện mất nguồn | `sua-tu-dien-mat-nguon` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay dây điện trong tủ | `thay-day-dien-trong-tu` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay terminal / thanh đấu nối | `thay-terminal-thanh-dau-noi` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Thay vỏ tủ điện | `thay-vo-tu-dien` | 100.000 đ/điểm | Đang hoạt động |
| 11 | Xử lý điểm tiếp xúc phát nóng | `xu-ly-diem-tiep-xuc-phat-nong` | 100.000 đ/điểm | Đang hoạt động |

### 4.22. Điện cửa cuốn / Cổng tự động

- **Mã đối tượng:** `dien-cua-cuon-cong-tu-dong`
- **ID đối tượng:** `2fe406ed-6aae-4f00-b90f-b262e69645e5`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo trì phần điện cửa cuốn | `bao-tri-phan-dien-cua-cuon` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra cảm biến an toàn | `kiem-tra-cam-bien-an-toan` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra cổng không đóng / mở | `kiem-tra-cong-khong-dong-mo` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra cửa cuốn mất nguồn | `kiem-tra-cua-cuon-mat-nguon` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra motor cửa cuốn | `kiem-tra-motor-cua-cuon` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa bộ nhận điều khiển | `sua-bo-nhan-dieu-khien` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa công tắc hành trình | `sua-cong-tac-hanh-trinh` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa nút nhấn cửa cuốn | `sua-nut-nhan-cua-cuon` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay bộ nguồn điều khiển | `thay-bo-nguon-dieu-khien` | 100.000 đ/điểm | Đang hoạt động |

### 4.23. Điện mặt trời / Inverter

- **Mã đối tượng:** `dien-mat-troi-inverter`
- **ID đối tượng:** `72afafec-8d91-4ed9-b153-238d314ddfdf`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo dưỡng phần điện | `bao-duong-phan-dien` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra bảo vệ phía DC | `kiem-tra-bao-ve-phia-dc` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra dây / đầu nối | `kiem-tra-day-dau-noi` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra giám sát mất kết nối | `kiem-tra-giam-sat-mat-ket-noi` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra inverter báo lỗi | `kiem-tra-inverter-bao-loi` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Kiểm tra inverter không phát điện | `kiem-tra-inverter-khong-phat-dien` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Kiểm tra tiếp địa | `kiem-tra-tiep-dia` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Kiểm tra tủ điện mặt trời | `kiem-tra-tu-dien-mat-troi` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Kiểm tra đóng cắt phía AC | `kiem-tra-dong-cat-phia-ac` | 100.000 đ/điểm | Đang hoạt động |

### 4.24. Đèn ngoài trời / Sân vườn

- **Mã đối tượng:** `den-ngoai-troi-san-vuon`
- **ID đối tượng:** `2f246a0e-3617-4083-83da-2713460741cb`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra dây cấp điện ngoài trời | `kiem-tra-day-cap-dien-ngoai-troi` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp đèn chống nước | `lap-den-chong-nuoc` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp đèn cảm biến chuyển động | `lap-den-cam-bien-chuyen-dong` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp đèn cảm biến ánh sáng | `lap-den-cam-bien-anh-sang` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Lắp đèn cổng | `lap-den-cong` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Lắp đèn pha LED | `lap-den-pha-led` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Lắp đèn sân vườn | `lap-den-san-vuon` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa đèn chập chờn | `sua-den-chap-chon` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Sửa đèn ngoài trời không sáng | `sua-den-ngoai-troi-khong-sang` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Thay driver / bộ nguồn | `thay-driver-bo-nguon` | 100.000 đ/điểm | Đang hoạt động |

### 4.25. Đèn sự cố / Đèn thoát hiểm

- **Mã đối tượng:** `den-su-co-den-thoat-hiem`
- **ID đối tượng:** `8e1b308f-a8cd-4de8-9a30-6db52cfdb32c`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo trì đèn sự cố | `bao-tri-den-su-co` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra chiếu sáng dự phòng | `kiem-tra-chieu-sang-du-phong` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp đèn EXIT | `lap-den-exit` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp đèn sự cố | `lap-den-su-co` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sửa đèn không sạc | `sua-den-khong-sac` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa đèn sự cố không sáng | `sua-den-su-co-khong-sang` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Thay nguồn đèn EXIT | `thay-nguon-den-exit` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay pin đèn sự cố | `thay-pin-den-su-co` | 100.000 đ/điểm | Đang hoạt động |

### 4.26. Đèn trang trí / Đèn chùm

- **Mã đối tượng:** `den-trang-tri-den-chum`
- **ID đối tượng:** `667cd41a-d6ab-42fa-808c-08898ba947dc`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 11

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Lắp đèn LED dây | `lap-den-led-day` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Lắp đèn hắt trần | `lap-den-hat-tran` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp đèn thả trần | `lap-den-tha-tran` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp đặt đèn chùm | `lap-dat-den-chum` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sửa bộ điều khiển đèn RGB | `sua-bo-dieu-khien-den-rgb` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa đèn LED dây | `sua-den-led-day` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa đèn chùm không sáng | `sua-den-chum-khong-sang` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay bóng / đui đèn chùm | `thay-bong-dui-den-chum` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay driver đèn trang trí | `thay-driver-den-trang-tri` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Tháo / di dời đèn chùm | `thao-di-doi-den-chum` | 100.000 đ/điểm | Đang hoạt động |
| 11 | Vệ sinh / bảo dưỡng đèn trang trí | `ve-sinh-bao-duong-den-trang-tri` | 100.000 đ/điểm | Đang hoạt động |

### 4.27. Ổ cắm thông minh / Hẹn giờ

- **Mã đối tượng:** `o-cam-thong-minh-hen-gio`
- **ID đối tượng:** `215bc4ef-6d9d-49ec-841f-4a9fb91868f5`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Cấu hình lịch bật / tắt | `cau-hinh-lich-bat-tat` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra quá tải ổ cắm | `kiem-tra-qua-tai-o-cam` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp ổ cắm hẹn giờ | `lap-o-cam-hen-gio` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp ổ cắm thông minh | `lap-o-cam-thong-minh` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Sửa bộ hẹn giờ điện | `sua-bo-hen-gio-dien` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa ổ cắm mất kết nối | `sua-o-cam-mat-ket-noi` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa ổ cắm thông minh mất điện | `sua-o-cam-thong-minh-mat-dien` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Thay ổ cắm thông minh | `thay-o-cam-thong-minh` | 100.000 đ/điểm | Đang hoạt động |

### 4.28. Ổ cắm điện

- **Mã đối tượng:** `o-cam-dien`
- **ID đối tượng:** `ca1e389e-6302-4a19-a086-5c815a836473`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 11

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Di dời ổ cắm | `di-doi-o-cam` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra ổ cắm phát nóng hoặc có mùi khét | `kiem-tra-o-cam-phat-nong-hoac-co-mui-khet` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Lắp đặt ổ cắm mới | `lap-dat-o-cam-moi` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Lắp ổ cắm USB / USB-C | `lap-o-cam-usb-usb-c` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Lắp ổ cắm chống nước | `lap-o-cam-chong-nuoc` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Sửa ổ cắm chập chờn | `sua-o-cam-chap-chon` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Sửa ổ cắm không có điện | `sua-o-cam-khong-co-dien` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Sửa ổ cắm lỏng / tiếp xúc kém | `sua-o-cam-long-tiep-xuc-kem` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Thay ổ cắm cháy / hỏng | `thay-o-cam-chay-hong` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Thay ổ cắm nổi | `thay-o-cam-noi` | 100.000 đ/điểm | Đang hoạt động |
| 11 | Thay ổ cắm âm tường | `thay-o-cam-am-tuong` | 100.000 đ/điểm | Đang hoạt động |

### 4.29. Ổn áp / UPS / Bộ lưu điện

- **Mã đối tượng:** `on-ap-ups-bo-luu-dien`
- **ID đối tượng:** `ec503642-d273-4742-bf35-e8b3d509e7e5`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo dưỡng UPS / ổn áp | `bao-duong-ups-on-ap` | 100.000 đ/điểm | Đang hoạt động |
| 2 | Kiểm tra UPS báo lỗi | `kiem-tra-ups-bao-loi` | 100.000 đ/điểm | Đang hoạt động |
| 3 | Kiểm tra UPS không cấp điện | `kiem-tra-ups-khong-cap-dien` | 100.000 đ/điểm | Đang hoạt động |
| 4 | Kiểm tra UPS không sạc | `kiem-tra-ups-khong-sac` | 100.000 đ/điểm | Đang hoạt động |
| 5 | Kiểm tra cấp điện dự phòng | `kiem-tra-cap-dien-du-phong` | 100.000 đ/điểm | Đang hoạt động |
| 6 | Kiểm tra ổn áp không hoạt động | `kiem-tra-on-ap-khong-hoat-dong` | 100.000 đ/điểm | Đang hoạt động |
| 7 | Kiểm tra ổn áp đầu ra bất thường | `kiem-tra-on-ap-dau-ra-bat-thuong` | 100.000 đ/điểm | Đang hoạt động |
| 8 | Lắp UPS | `lap-ups` | 100.000 đ/điểm | Đang hoạt động |
| 9 | Lắp ổn áp | `lap-on-ap` | 100.000 đ/điểm | Đang hoạt động |
| 10 | Thay ắc quy UPS | `thay-ac-quy-ups` | 100.000 đ/điểm | Đang hoạt động |

## 5. Thiết bị gia dụng

- **Mã danh mục:** `thiet-bi`
- **ID danh mục:** `0666ad90-ac9d-4d34-b04a-8925e7d1605d`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng:** 15
- **Số dịch vụ:** 130

### 5.1. Bàn ủi / Bàn là hơi nước

- **Mã đối tượng:** `ban-ui-ban-la-hoi-nuoc`
- **ID đối tượng:** `a265bdb4-3c9f-4d0a-bcba-1f0722c8b420`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 7

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Khử cặn đường hơi | `khu-can-duong-hoi` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa bàn ủi không nóng | `sua-ban-ui-khong-nong` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa bàn ủi không ra hơi | `sua-ban-ui-khong-ra-hoi` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa bàn ủi rò nước | `sua-ban-ui-ro-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa bộ điều nhiệt | `sua-bo-dieu-nhiet-ban-ui-ban-la-hoi-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa dây nguồn | `sua-day-nguon` | 120.000 đ/máy | Đang hoạt động |
| 7 | Vệ sinh mặt đế / bảo dưỡng | `ve-sinh-mat-de-bao-duong` | 120.000 đ/máy | Đang hoạt động |

### 5.2. Bình nóng lạnh điện

- **Mã đối tượng:** `binh-nong-lanh-dien`
- **ID đối tượng:** `8c5b11b7-adfe-4c5d-a3b6-fd7afbf53636`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra an toàn điện và tiếp địa | `kiem-tra-an-toan-dien-va-tiep-dia` | 120.000 đ/máy | Đang hoạt động |
| 2 | Kiểm tra bình nhảy thiết bị chống rò | `kiem-tra-binh-nhay-thiet-bi-chong-ro` | 120.000 đ/máy | Đang hoạt động |
| 3 | Lắp đặt / tháo dỡ bình | `lap-dat-thao-do-binh` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa bình không nóng | `sua-binh-khong-nong` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa bình nóng yếu | `sua-binh-nong-yeu` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa bình rò nước | `sua-binh-ro-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 7 | Sửa bộ điều nhiệt | `sua-bo-dieu-nhiet` | 120.000 đ/máy | Đang hoạt động |
| 8 | Thay thanh đốt / thanh magie theo loại bình | `thay-thanh-dot-thanh-magie-theo-loai-binh` | 120.000 đ/máy | Đang hoạt động |
| 9 | Vệ sinh khử cặn | `ve-sinh-khu-can` | 120.000 đ/máy | Đang hoạt động |

### 5.3. Bếp gas / Bếp gas âm

- **Mã đối tượng:** `bep-gas-bep-gas-am`
- **ID đối tượng:** `863b2a1d-05f2-4792-beaa-4073e6197141`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo dưỡng bếp gas | `bao-duong-bep-gas` | 120.000 đ/máy | Đang hoạt động |
| 2 | Kiểm tra và xử lý rò rỉ gas bởi kỹ thuật viên đủ điều kiện | `kiem-tra-va-xu-ly-ro-ri-gas-boi-ky-thuat-vien-du-dieu-kien` | 120.000 đ/máy | Đang hoạt động |
| 3 | Lắp đặt / thay bếp gas | `lap-dat-thay-bep-gas` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa bếp không đánh lửa | `sua-bep-khong-danh-lua` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa bếp lửa yếu hoặc không đều | `sua-bep-lua-yeu-hoac-khong-deu` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa bếp đánh lửa liên tục | `sua-bep-danh-lua-lien-tuc` | 120.000 đ/máy | Đang hoạt động |
| 7 | Thay dây / van điều áp phù hợp | `thay-day-van-dieu-ap-phu-hop` | 120.000 đ/máy | Đang hoạt động |
| 8 | Thay núm vặn | `thay-num-van` | 120.000 đ/máy | Đang hoạt động |
| 9 | Vệ sinh đầu đốt / kiềng bếp | `ve-sinh-dau-dot-kieng-bep` | 120.000 đ/máy | Đang hoạt động |

### 5.4. Bếp từ / Bếp hồng ngoại

- **Mã đối tượng:** `bep-tu-bep-hong-ngoai`
- **ID đối tượng:** `79d5736c-c8e1-4514-a9ce-e01899beffa9`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo dưỡng và vệ sinh bếp | `bao-duong-va-ve-sinh-bep` | 120.000 đ/máy | Đang hoạt động |
| 2 | Lắp đặt bếp âm | `lap-dat-bep-am` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa bảng điều khiển cảm ứng | `sua-bang-dieu-khien-cam-ung` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa bếp báo mã lỗi | `sua-bep-bao-ma-loi` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa bếp không lên nguồn | `sua-bep-khong-len-nguon` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa bếp không nhận nồi | `sua-bep-khong-nhan-noi` | 120.000 đ/máy | Đang hoạt động |
| 7 | Sửa bếp không nóng / nóng yếu | `sua-bep-khong-nong-nong-yeu` | 120.000 đ/máy | Đang hoạt động |
| 8 | Sửa mạch công suất | `sua-mach-cong-suat` | 120.000 đ/máy | Đang hoạt động |
| 9 | Sửa quạt tản nhiệt | `sua-quat-tan-nhiet` | 120.000 đ/máy | Đang hoạt động |
| 10 | Thay mặt kính bếp nứt vỡ | `thay-mat-kinh-bep-nut-vo` | 120.000 đ/máy | Đang hoạt động |

### 5.5. Lò nướng / Nồi chiên không dầu

- **Mã đối tượng:** `lo-nuong-noi-chien-khong-dau`
- **ID đối tượng:** `a289a9b0-6cb9-4d94-b3a3-3ff6dd55e1f7`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa bảng điều khiển | `sua-bang-dieu-khien-lo-nuong-noi-chien-khong-dau` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa bộ hẹn giờ | `sua-bo-hen-gio` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa cửa / tay cầm / khay | `sua-cua-tay-cam-khay` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa quạt đối lưu | `sua-quat-doi-luu` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa thiết bị không lên nguồn | `sua-thiet-bi-khong-len-nguon` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa thiết bị không nóng | `sua-thiet-bi-khong-nong` | 120.000 đ/máy | Đang hoạt động |
| 7 | Sửa thiết bị nóng không đều | `sua-thiet-bi-nong-khong-deu` | 120.000 đ/máy | Đang hoạt động |
| 8 | Vệ sinh và bảo dưỡng | `ve-sinh-va-bao-duong` | 120.000 đ/máy | Đang hoạt động |

### 5.6. Lò vi sóng

- **Mã đối tượng:** `lo-vi-song`
- **ID đối tượng:** `c3e13154-aeb8-4c3f-a6d3-6fa4f20566df`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa bảng điều khiển | `sua-bang-dieu-khien` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa cửa / khóa liên động | `sua-cua-khoa-lien-dong` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa lò không lên nguồn | `sua-lo-khong-len-nguon` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa lò không nóng | `sua-lo-khong-nong` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa lò không quay đĩa | `sua-lo-khong-quay-dia` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa lò phát tia lửa | `sua-lo-phat-tia-lua` | 120.000 đ/máy | Đang hoạt động |
| 7 | Sửa đèn lò vi sóng | `sua-den-lo-vi-song` | 120.000 đ/máy | Đang hoạt động |
| 8 | Vệ sinh và bảo dưỡng lò | `ve-sinh-va-bao-duong-lo` | 120.000 đ/máy | Đang hoạt động |

### 5.7. Máy hút bụi / Robot hút bụi

- **Mã đối tượng:** `may-hut-bui-robot-hut-bui`
- **ID đối tượng:** `ac770808-e06b-4f11-8c0d-ea2c5ca4ab55`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa chổi / bánh xe | `sua-choi-banh-xe` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa cảm biến va chạm / chống rơi | `sua-cam-bien-va-cham-chong-roi` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa hộp bụi / đường hút | `sua-hop-bui-duong-hut` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa máy hút yếu / không hút | `sua-may-hut-yeu-khong-hut` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa máy không lên nguồn | `sua-may-khong-len-nguon-may-hut-bui-robot-hut-bui` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa máy không sạc | `sua-may-khong-sac` | 120.000 đ/máy | Đang hoạt động |
| 7 | Sửa robot báo lỗi | `sua-robot-bao-loi` | 120.000 đ/máy | Đang hoạt động |
| 8 | Sửa robot mất kết nối | `sua-robot-mat-ket-noi` | 120.000 đ/máy | Đang hoạt động |
| 9 | Thay pin / bộ sạc tương thích | `thay-pin-bo-sac-tuong-thich` | 120.000 đ/máy | Đang hoạt động |
| 10 | Vệ sinh / bảo dưỡng | `ve-sinh-bao-duong` | 120.000 đ/máy | Đang hoạt động |

### 5.8. Máy hút mùi

- **Mã đối tượng:** `may-hut-mui`
- **ID đối tượng:** `42c03e7a-0da1-446a-ae1e-db7783716016`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Lắp đặt / di dời máy | `lap-dat-di-doi-may` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa bảng điều khiển | `sua-bang-dieu-khien-may-hut-mui` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa máy không hút / hút yếu | `sua-may-khong-hut-hut-yeu` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa máy không lên nguồn | `sua-may-khong-len-nguon` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa quạt / động cơ | `sua-quat-dong-co` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa đèn máy hút mùi | `sua-den-may-hut-mui` | 120.000 đ/máy | Đang hoạt động |
| 7 | Thay lưới lọc / lọc than | `thay-luoi-loc-loc-than` | 120.000 đ/máy | Đang hoạt động |
| 8 | Vệ sinh dầu mỡ và đường hút | `ve-sinh-dau-mo-va-duong-hut` | 120.000 đ/máy | Đang hoạt động |

### 5.9. Máy lọc không khí / Máy hút ẩm

- **Mã đối tượng:** `may-loc-khong-khi-may-hut-am`
- **ID đối tượng:** `31a46f93-b19d-46e0-89ec-de97705944e4`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa bình chứa / phao báo đầy | `sua-binh-chua-phao-bao-day` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa cảm biến bụi / độ ẩm | `sua-cam-bien-bui-do-am` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa máy báo lỗi | `sua-may-bao-loi-may-loc-khong-khi-may-hut-am` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa máy hút ẩm không thu nước | `sua-may-hut-am-khong-thu-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa máy không chạy quạt | `sua-may-khong-chay-quat` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa máy không lên nguồn | `sua-may-khong-len-nguon-may-loc-khong-khi-may-hut-am` | 120.000 đ/máy | Đang hoạt động |
| 7 | Thay lọc phù hợp | `thay-loc-phu-hop` | 120.000 đ/máy | Đang hoạt động |
| 8 | Vệ sinh và bảo dưỡng | `ve-sinh-va-bao-duong-may-loc-khong-khi-may-hut-am` | 120.000 đ/máy | Đang hoạt động |

### 5.10. Máy lọc nước RO / Nano

- **Mã đối tượng:** `may-loc-nuoc-ro-nano`
- **ID đối tượng:** `82430f58-a332-4d4f-aa99-5c27f888a0e7`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 10

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra chất lượng nước đầu ra | `kiem-tra-chat-luong-nuoc-dau-ra` | 120.000 đ/máy | Đang hoạt động |
| 2 | Lắp đặt / di dời máy lọc nước | `lap-dat-di-doi-may-loc-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa bơm tăng áp | `sua-bom-tang-ap` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa máy không ngắt | `sua-may-khong-ngat` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa máy không ra nước | `sua-may-khong-ra-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa máy ra nước yếu | `sua-may-ra-nuoc-yeu` | 120.000 đ/máy | Đang hoạt động |
| 7 | Sửa máy rò nước | `sua-may-ro-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 8 | Sửa van điện từ | `sua-van-dien-tu` | 120.000 đ/máy | Đang hoạt động |
| 9 | Thay lõi lọc định kỳ | `thay-loi-loc-dinh-ky` | 120.000 đ/máy | Đang hoạt động |
| 10 | Vệ sinh / khử khuẩn hệ thống | `ve-sinh-khu-khuan-he-thong` | 120.000 đ/máy | Đang hoạt động |

### 5.11. Máy pha cà phê / Ấm siêu tốc

- **Mã đối tượng:** `may-pha-ca-phe-am-sieu-toc`
- **ID đối tượng:** `f37e014f-c25d-4bcf-a5de-af804d32bd40`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa công tắc / cảm biến nhiệt | `sua-cong-tac-cam-bien-nhiet` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa máy không lên nguồn | `sua-may-khong-len-nguon-may-pha-ca-phe-am-sieu-toc` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa máy pha cà phê không bơm nước | `sua-may-pha-ca-phe-khong-bom-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa máy rò nước | `sua-may-ro-nuoc-may-pha-ca-phe-am-sieu-toc` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa thiết bị không đun nóng | `sua-thiet-bi-khong-dun-nong` | 120.000 đ/máy | Đang hoạt động |
| 6 | Thay gioăng / phin lọc | `thay-gioang-phin-loc` | 120.000 đ/máy | Đang hoạt động |
| 7 | Thông tắc đường dẫn nước / khử cặn | `thong-tac-duong-dan-nuoc-khu-can` | 120.000 đ/máy | Đang hoạt động |
| 8 | Vệ sinh và bảo dưỡng | `ve-sinh-va-bao-duong-may-pha-ca-phe-am-sieu-toc` | 120.000 đ/máy | Đang hoạt động |

### 5.12. Máy rửa chén / Máy rửa bát

- **Mã đối tượng:** `may-rua-chen-may-rua-bat`
- **ID đối tượng:** `44c6d84b-0c8c-44f0-855b-36aff9d8222a`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Lắp đặt / di dời máy | `lap-dat-di-doi-may-may-rua-chen-may-rua-bat` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa máy báo lỗi | `sua-may-bao-loi` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa máy không cấp nước | `sua-may-khong-cap-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa máy không lên nguồn | `sua-may-khong-len-nguon-may-rua-chen-may-rua-bat` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa máy không sấy khô | `sua-may-khong-say-kho` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa máy không xả nước | `sua-may-khong-xa-nuoc` | 120.000 đ/máy | Đang hoạt động |
| 7 | Sửa máy rò nước | `sua-may-ro-nuoc-may-rua-chen-may-rua-bat` | 120.000 đ/máy | Đang hoạt động |
| 8 | Sửa máy rửa không sạch | `sua-may-rua-khong-sach` | 120.000 đ/máy | Đang hoạt động |
| 9 | Vệ sinh bộ lọc / tay phun | `ve-sinh-bo-loc-tay-phun` | 120.000 đ/máy | Đang hoạt động |

### 5.13. Máy xay / Máy ép / Máy đánh trứng

- **Mã đối tượng:** `may-xay-may-ep-may-danh-trung`
- **ID đối tượng:** `812864e5-2682-4d13-bbd4-5c22aba656cd`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa công tắc / nút bấm | `sua-cong-tac-nut-bam` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa máy rò nước từ cối | `sua-may-ro-nuoc-tu-coi` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa thiết bị không lên nguồn | `sua-thiet-bi-khong-len-nguon-may-xay-may-ep-may-danh-trung` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa thiết bị không quay | `sua-thiet-bi-khong-quay` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa thiết bị quay yếu | `sua-thiet-bi-quay-yeu` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa động cơ | `sua-dong-co` | 120.000 đ/máy | Đang hoạt động |
| 7 | Thay bộ dao / khớp truyền động | `thay-bo-dao-khop-truyen-dong` | 120.000 đ/máy | Đang hoạt động |
| 8 | Vệ sinh và bảo dưỡng | `ve-sinh-va-bao-duong-may-xay-may-ep-may-danh-trung` | 120.000 đ/máy | Đang hoạt động |

### 5.14. Nồi cơm điện / Nồi áp suất điện

- **Mã đối tượng:** `noi-com-dien-noi-ap-suat-dien`
- **ID đối tượng:** `65f531cd-165d-4feb-b69f-922398fde6db`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa bộ cảm biến / bộ điều nhiệt | `sua-bo-cam-bien-bo-dieu-nhiet` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa nút bấm / bảng điều khiển | `sua-nut-bam-bang-dieu-khien` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa nồi báo lỗi | `sua-noi-bao-loi` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa nồi không lên nguồn | `sua-noi-khong-len-nguon` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa nồi không nóng | `sua-noi-khong-nong` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa nồi nấu cơm sống / khê | `sua-noi-nau-com-song-khe` | 120.000 đ/máy | Đang hoạt động |
| 7 | Thay dây nguồn | `thay-day-nguon` | 120.000 đ/máy | Đang hoạt động |
| 8 | Thay gioăng / van nồi áp suất | `thay-gioang-van-noi-ap-suat` | 120.000 đ/máy | Đang hoạt động |
| 9 | Vệ sinh và bảo dưỡng nồi | `ve-sinh-va-bao-duong-noi` | 120.000 đ/máy | Đang hoạt động |

### 5.15. Quạt điện / Quạt đứng / Quạt bàn

- **Mã đối tượng:** `quat-dien-quat-dung-quat-ban`
- **ID đối tượng:** `a9f91e3c-16d5-484d-92bf-68c526ac9606`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa bộ điều khiển tốc độ | `sua-bo-dieu-khien-toc-do` | 120.000 đ/máy | Đang hoạt động |
| 2 | Sửa dây nguồn / công tắc | `sua-day-nguon-cong-tac` | 120.000 đ/máy | Đang hoạt động |
| 3 | Sửa quạt không quay | `sua-quat-khong-quay-quat-dien-quat-dung-quat-ban` | 120.000 đ/máy | Đang hoạt động |
| 4 | Sửa quạt không đảo gió | `sua-quat-khong-dao-gio` | 120.000 đ/máy | Đang hoạt động |
| 5 | Sửa quạt kêu to / rung | `sua-quat-keu-to-rung` | 120.000 đ/máy | Đang hoạt động |
| 6 | Sửa quạt quay chậm | `sua-quat-quay-cham-quat-dien-quat-dung-quat-ban` | 120.000 đ/máy | Đang hoạt động |
| 7 | Thay cánh / lồng quạt | `thay-canh-long-quat` | 120.000 đ/máy | Đang hoạt động |
| 8 | Thay tụ quạt | `thay-tu-quat-quat-dien-quat-dung-quat-ban` | 120.000 đ/máy | Đang hoạt động |
| 9 | Vệ sinh / bảo dưỡng | `ve-sinh-bao-duong-quat-dien-quat-dung-quat-ban` | 120.000 đ/máy | Đang hoạt động |

## 6. Điện lạnh

- **Mã danh mục:** `dien-lanh`
- **ID danh mục:** `8ba77998-c7aa-4b53-875f-b14b8fba78f7`
- **Trạng thái:** Đang hoạt động
- **Số đối tượng:** 7
- **Số dịch vụ:** 92

### 6.1. Máy giặt / Máy giặt sấy

- **Mã đối tượng:** `may-giat-may-giat-say`
- **ID đối tượng:** `eaa18ae1-41b8-4588-bcdb-96192e5a2da8`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 19

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo dưỡng máy giặt | `bao-duong-may-giat` | 180.000 đ/máy | Đang hoạt động |
| 2 | Khử mùi máy giặt | `khu-mui-may-giat` | 180.000 đ/máy | Đang hoạt động |
| 3 | Kiểm tra máy giặt báo mã lỗi | `kiem-tra-may-giat-bao-ma-loi` | 180.000 đ/máy | Đang hoạt động |
| 4 | Lắp đặt / di dời máy giặt | `lap-dat-di-doi-may-giat` | 180.000 đ/máy | Đang hoạt động |
| 5 | Sửa bơm xả | `sua-bom-xa` | 180.000 đ/máy | Đang hoạt động |
| 6 | Sửa bảng điều khiển / bo mạch | `sua-bang-dieu-khien-bo-mach` | 180.000 đ/máy | Đang hoạt động |
| 7 | Sửa chức năng sấy của máy giặt sấy | `sua-chuc-nang-say-cua-may-giat-say` | 180.000 đ/máy | Đang hoạt động |
| 8 | Sửa cửa / khóa cửa máy giặt | `sua-cua-khoa-cua-may-giat` | 180.000 đ/máy | Đang hoạt động |
| 9 | Sửa dây curoa / bộ truyền động | `sua-day-curoa-bo-truyen-dong` | 180.000 đ/máy | Đang hoạt động |
| 10 | Sửa máy giặt không cấp nước | `sua-may-giat-khong-cap-nuoc` | 180.000 đ/máy | Đang hoạt động |
| 11 | Sửa máy giặt không lên nguồn | `sua-may-giat-khong-len-nguon` | 180.000 đ/máy | Đang hoạt động |
| 12 | Sửa máy giặt không quay lồng | `sua-may-giat-khong-quay-long` | 180.000 đ/máy | Đang hoạt động |
| 13 | Sửa máy giặt không vắt | `sua-may-giat-khong-vat` | 180.000 đ/máy | Đang hoạt động |
| 14 | Sửa máy giặt không xả nước | `sua-may-giat-khong-xa-nuoc` | 180.000 đ/máy | Đang hoạt động |
| 15 | Sửa máy giặt rung lắc hoặc kêu to | `sua-may-giat-rung-lac-hoac-keu-to` | 180.000 đ/máy | Đang hoạt động |
| 16 | Sửa máy giặt rò nước | `sua-may-giat-ro-nuoc` | 180.000 đ/máy | Đang hoạt động |
| 17 | Sửa van cấp nước | `sua-van-cap-nuoc` | 180.000 đ/máy | Đang hoạt động |
| 18 | Vệ sinh lồng giặt cửa ngang | `ve-sinh-long-giat-cua-ngang` | 180.000 đ/máy | Đang hoạt động |
| 19 | Vệ sinh lồng giặt cửa trên | `ve-sinh-long-giat-cua-tren` | 180.000 đ/máy | Đang hoạt động |

### 6.2. Máy làm mát / Quạt điều hòa

- **Mã đối tượng:** `may-lam-mat-quat-dieu-hoa`
- **ID đối tượng:** `8e1a07e4-134d-4214-8841-ad2969a584fa`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 9

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo dưỡng máy làm mát | `bao-duong-may-lam-mat` | 180.000 đ/máy | Đang hoạt động |
| 2 | Sửa bơm nước không hoạt động | `sua-bom-nuoc-khong-hoat-dong` | 180.000 đ/máy | Đang hoạt động |
| 3 | Sửa bảng điều khiển | `sua-bang-dieu-khien-may-lam-mat-quat-dieu-hoa` | 180.000 đ/máy | Đang hoạt động |
| 4 | Sửa máy không làm mát | `sua-may-khong-lam-mat` | 180.000 đ/máy | Đang hoạt động |
| 5 | Sửa máy không lên nguồn | `sua-may-khong-len-nguon-may-lam-mat-quat-dieu-hoa` | 180.000 đ/máy | Đang hoạt động |
| 6 | Sửa máy rò nước | `sua-may-ro-nuoc-may-lam-mat-quat-dieu-hoa` | 180.000 đ/máy | Đang hoạt động |
| 7 | Sửa quạt không quay | `sua-quat-khong-quay-may-lam-mat-quat-dieu-hoa` | 180.000 đ/máy | Đang hoạt động |
| 8 | Thay tấm làm mát | `thay-tam-lam-mat` | 180.000 đ/máy | Đang hoạt động |
| 9 | Vệ sinh bình chứa / tấm làm mát | `ve-sinh-binh-chua-tam-lam-mat` | 180.000 đ/máy | Đang hoạt động |

### 6.3. Máy lạnh / Điều hòa

- **Mã đối tượng:** `may-lanh-dieu-hoa`
- **ID đối tượng:** `3d946ff9-d116-4d07-9f38-c175669f74ed`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 17

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo dưỡng máy lạnh định kỳ | `bao-duong-may-lanh-dinh-ky` | 180.000 đ/máy | Đang hoạt động |
| 2 | Kiểm tra máy lạnh báo mã lỗi | `kiem-tra-may-lanh-bao-ma-loi` | 180.000 đ/máy | Đang hoạt động |
| 3 | Kiểm tra máy lạnh không lạnh hoặc lạnh yếu | `kiem-tra-may-lanh-khong-lanh-hoac-lanh-yeu` | 180.000 đ/máy | Đang hoạt động |
| 4 | Kiểm tra và nạp môi chất lạnh đúng kỹ thuật | `kiem-tra-va-nap-moi-chat-lanh-dung-ky-thuat` | 180.000 đ/máy | Đang hoạt động |
| 5 | Kiểm tra và xử lý rò rỉ môi chất lạnh | `kiem-tra-va-xu-ly-ro-ri-moi-chat-lanh` | 180.000 đ/máy | Đang hoạt động |
| 6 | Lắp đặt máy lạnh | `lap-dat-may-lanh` | 180.000 đ/máy | Đang hoạt động |
| 7 | Sửa bo mạch hoặc cảm biến máy lạnh | `sua-bo-mach-hoac-cam-bien-may-lanh` | 180.000 đ/máy | Đang hoạt động |
| 8 | Sửa máy lạnh chảy nước | `sua-may-lanh-chay-nuoc` | 180.000 đ/máy | Đang hoạt động |
| 9 | Sửa máy lạnh có mùi bất thường | `sua-may-lanh-co-mui-bat-thuong` | 180.000 đ/máy | Đang hoạt động |
| 10 | Sửa máy lạnh không lên nguồn | `sua-may-lanh-khong-len-nguon` | 180.000 đ/máy | Đang hoạt động |
| 11 | Sửa máy lạnh kêu to hoặc rung | `sua-may-lanh-keu-to-hoac-rung` | 180.000 đ/máy | Đang hoạt động |
| 12 | Sửa máy lạnh đóng tuyết | `sua-may-lanh-dong-tuyet` | 180.000 đ/máy | Đang hoạt động |
| 13 | Sửa quạt dàn nóng hoặc dàn lạnh | `sua-quat-dan-nong-hoac-dan-lanh` | 180.000 đ/máy | Đang hoạt động |
| 14 | Sửa đường thoát nước ngưng máy lạnh | `sua-duong-thoat-nuoc-ngung-may-lanh` | 180.000 đ/máy | Đang hoạt động |
| 15 | Tháo dỡ / di dời máy lạnh | `thao-do-di-doi-may-lanh` | 180.000 đ/máy | Đang hoạt động |
| 16 | Vệ sinh máy lạnh treo tường | `ve-sinh-may-lanh-treo-tuong` | 180.000 đ/máy | Đang hoạt động |
| 17 | Vệ sinh máy lạnh âm trần | `ve-sinh-may-lanh-am-tran` | 180.000 đ/máy | Đang hoạt động |

### 6.4. Máy nước uống nóng lạnh

- **Mã đối tượng:** `may-nuoc-uong-nong-lanh`
- **ID đối tượng:** `043e30bc-6493-4f96-82b6-e6a2f26e4bf2`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 8

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Lắp đặt / di dời máy | `lap-dat-di-doi-may-may-nuoc-uong-nong-lanh` | 180.000 đ/máy | Đang hoạt động |
| 2 | Sửa bộ điều nhiệt | `sua-bo-dieu-nhiet-may-nuoc-uong-nong-lanh` | 180.000 đ/máy | Đang hoạt động |
| 3 | Sửa máy không làm lạnh | `sua-may-khong-lam-lanh` | 180.000 đ/máy | Đang hoạt động |
| 4 | Sửa máy không làm nóng | `sua-may-khong-lam-nong` | 180.000 đ/máy | Đang hoạt động |
| 5 | Sửa máy không lên nguồn | `sua-may-khong-len-nguon-may-nuoc-uong-nong-lanh` | 180.000 đ/máy | Đang hoạt động |
| 6 | Sửa máy rò nước | `sua-may-ro-nuoc-may-nuoc-uong-nong-lanh` | 180.000 đ/máy | Đang hoạt động |
| 7 | Sửa vòi lấy nước | `sua-voi-lay-nuoc` | 180.000 đ/máy | Đang hoạt động |
| 8 | Vệ sinh khử cặn và bảo dưỡng | `ve-sinh-khu-can-va-bao-duong` | 180.000 đ/máy | Đang hoạt động |

### 6.5. Máy sấy quần áo

- **Mã đối tượng:** `may-say-quan-ao`
- **ID đối tượng:** `1746c918-2fb7-41ac-a111-5c3e807616bf`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 11

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Bảo dưỡng máy sấy | `bao-duong-may-say` | 180.000 đ/máy | Đang hoạt động |
| 2 | Kiểm tra dây đai / con lăn | `kiem-tra-day-dai-con-lan` | 180.000 đ/máy | Đang hoạt động |
| 3 | Lắp đặt / di dời máy sấy | `lap-dat-di-doi-may-say` | 180.000 đ/máy | Đang hoạt động |
| 4 | Sửa cửa / công tắc cửa | `sua-cua-cong-tac-cua` | 180.000 đ/máy | Đang hoạt động |
| 5 | Sửa máy sấy báo lỗi | `sua-may-say-bao-loi` | 180.000 đ/máy | Đang hoạt động |
| 6 | Sửa máy sấy không lên nguồn | `sua-may-say-khong-len-nguon` | 180.000 đ/máy | Đang hoạt động |
| 7 | Sửa máy sấy không nóng | `sua-may-say-khong-nong` | 180.000 đ/máy | Đang hoạt động |
| 8 | Sửa máy sấy không quay | `sua-may-say-khong-quay` | 180.000 đ/máy | Đang hoạt động |
| 9 | Sửa máy sấy kêu to | `sua-may-say-keu-to` | 180.000 đ/máy | Đang hoạt động |
| 10 | Sửa máy sấy sấy lâu / không khô | `sua-may-say-say-lau-khong-kho` | 180.000 đ/máy | Đang hoạt động |
| 11 | Vệ sinh lọc xơ vải / đường thoát khí | `ve-sinh-loc-xo-vai-duong-thoat-khi` | 180.000 đ/máy | Đang hoạt động |

### 6.6. Tủ lạnh / Tủ lạnh side-by-side

- **Mã đối tượng:** `tu-lanh-tu-lanh-side-by-side`
- **ID đối tượng:** `521d7ce8-9e72-492e-b0cd-4eb88508f58d`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 16

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra hệ thống làm lạnh / rò môi chất | `kiem-tra-he-thong-lam-lanh-ro-moi-chat` | 180.000 đ/máy | Đang hoạt động |
| 2 | Lắp đặt / di dời tủ lạnh | `lap-dat-di-doi-tu-lanh` | 180.000 đ/máy | Đang hoạt động |
| 3 | Sửa bản lề / tay nắm cửa | `sua-ban-le-tay-nam-cua` | 180.000 đ/máy | Đang hoạt động |
| 4 | Sửa bảng điều khiển hoặc mã lỗi | `sua-bang-dieu-khien-hoac-ma-loi` | 180.000 đ/máy | Đang hoạt động |
| 5 | Sửa bộ xả đá | `sua-bo-xa-da` | 180.000 đ/máy | Đang hoạt động |
| 6 | Sửa cảm biến nhiệt độ | `sua-cam-bien-nhiet-do` | 180.000 đ/máy | Đang hoạt động |
| 7 | Sửa ngăn mát đóng tuyết | `sua-ngan-mat-dong-tuyet` | 180.000 đ/máy | Đang hoạt động |
| 8 | Sửa ngăn đá không đông | `sua-ngan-da-khong-dong` | 180.000 đ/máy | Đang hoạt động |
| 9 | Sửa quạt tủ lạnh | `sua-quat-tu-lanh` | 180.000 đ/máy | Đang hoạt động |
| 10 | Sửa tủ lạnh không lên nguồn | `sua-tu-lanh-khong-len-nguon` | 180.000 đ/máy | Đang hoạt động |
| 11 | Sửa tủ lạnh không lạnh | `sua-tu-lanh-khong-lanh` | 180.000 đ/máy | Đang hoạt động |
| 12 | Sửa tủ lạnh kêu to | `sua-tu-lanh-keu-to` | 180.000 đ/máy | Đang hoạt động |
| 13 | Sửa tủ lạnh rò nước | `sua-tu-lanh-ro-nuoc` | 180.000 đ/máy | Đang hoạt động |
| 14 | Sửa đèn tủ lạnh | `sua-den-tu-lanh` | 180.000 đ/máy | Đang hoạt động |
| 15 | Thay gioăng cửa | `thay-gioang-cua` | 180.000 đ/máy | Đang hoạt động |
| 16 | Vệ sinh và bảo dưỡng tủ lạnh | `ve-sinh-va-bao-duong-tu-lanh` | 180.000 đ/máy | Đang hoạt động |

### 6.7. Tủ đông / Tủ mát

- **Mã đối tượng:** `tu-dong-tu-mat`
- **ID đối tượng:** `5e8f3e42-a1e4-47e3-8e76-8c774d04d5ea`
- **Trạng thái:** Đang hoạt động
- **Dịch vụ liên quan:** 12

| STT | Dịch vụ hiện có | Mã dịch vụ | Giá cấu hình | Trạng thái |
|---|---|---|---|---|
| 1 | Kiểm tra hệ thống lạnh | `kiem-tra-he-thong-lanh` | 180.000 đ/máy | Đang hoạt động |
| 2 | Lắp đặt / di dời tủ | `lap-dat-di-doi-tu` | 180.000 đ/máy | Đang hoạt động |
| 3 | Sửa cảm biến / bộ điều nhiệt | `sua-cam-bien-bo-dieu-nhiet` | 180.000 đ/máy | Đang hoạt động |
| 4 | Sửa cửa / gioăng tủ | `sua-cua-gioang-tu` | 180.000 đ/máy | Đang hoạt động |
| 5 | Sửa quạt và hệ thống xả đá | `sua-quat-va-he-thong-xa-da` | 180.000 đ/máy | Đang hoạt động |
| 6 | Sửa tủ chạy liên tục | `sua-tu-chay-lien-tuc` | 180.000 đ/máy | Đang hoạt động |
| 7 | Sửa tủ không lạnh | `sua-tu-khong-lanh` | 180.000 đ/máy | Đang hoạt động |
| 8 | Sửa tủ kêu to | `sua-tu-keu-to` | 180.000 đ/máy | Đang hoạt động |
| 9 | Sửa tủ lạnh yếu | `sua-tu-lanh-yeu` | 180.000 đ/máy | Đang hoạt động |
| 10 | Sửa tủ rò nước | `sua-tu-ro-nuoc` | 180.000 đ/máy | Đang hoạt động |
| 11 | Sửa tủ đóng tuyết bất thường | `sua-tu-dong-tuyet-bat-thuong` | 180.000 đ/máy | Đang hoạt động |
| 12 | Vệ sinh và bảo dưỡng tủ | `ve-sinh-va-bao-duong-tu` | 180.000 đ/máy | Đang hoạt động |

## Nguồn và kiểm tra tính đầy đủ

- Danh mục: bảng `service_categories`; đối tượng: `service_targets`; dịch vụ: `services`.
- Liệt kê tất cả bản ghi dịch vụ, không chỉ dịch vụ phổ biến hoặc đang hoạt động.
- Đã đối chiếu: **693/693 dịch vụ** xuất hiện đúng một lần trong báo cáo.
- Không tự suy diễn dịch vụ từ tên đối tượng; đối tượng chưa có dịch vụ được ghi rõ.
- Không chỉnh sửa database hoặc thêm dịch vụ trong quá trình lập báo cáo.
