# Catalog audit — read-only

Snapshot UTC: 2026-11-14T08:44:36.599Z. SHA256 input: `1c837e814c566536beadc80ff9d43708c8d5039a69f1dd06ca75438f7d383639`.

Truy vấn cả active/inactive trong một transaction `SET TRANSACTION READ ONLY`. Không sửa/seed/import DB.

Tổng: **6 danh mục, 70 đối tượng, 693 dịch vụ**.

## Kết quả kiểm tra

| Loại | Số lượng |
|---|---:|
| SERVICE_WITHOUT_TARGET | 0 |
| SERVICE_TARGET_MISSING | 0 |
| CATEGORY_TARGET_MISMATCH | 0 |
| SERVICE_INACTIVE | 0 |
| NEGATIVE_PRICE | 0 |
| INVALID_PRICE_RANGE | 0 |

### Trường tùy chọn/trạng thái bổ sung

| Trường hoặc trạng thái | Số bản ghi trống/inactive |
|---|---:|
| service.maxPrice | 693 |
| service.estimatedDurationMin | 0 |
| target.aiPrompts_empty | 0 |
| category.description | 0 |
| target.inactive | 0 |
| category.inactive | 0 |

maxPrice null là giá trên chưa xác định, không tự coi là dữ liệu sai. Không có Symptom table trong audit nguồn ban đầu; bộ đề xuất chỉ nằm trong CSV.

## Toàn bộ danh mục và đối tượng

| Category (ID) | Target (ID) | Active | Services active / tổng |
|---|---|---|---:|
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Máy lọc không khí / Máy hút ẩm `31a46f93-b19d-46e0-89ec-de97705944e4` | True | 8 / 8 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Máy hút mùi `42c03e7a-0da1-446a-ae1e-db7783716016` | True | 8 / 8 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Máy rửa chén / Máy rửa bát `44c6d84b-0c8c-44f0-855b-36aff9d8222a` | True | 9 / 9 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Nồi cơm điện / Nồi áp suất điện `65f531cd-165d-4feb-b69f-922398fde6db` | True | 9 / 9 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Bếp từ / Bếp hồng ngoại `79d5736c-c8e1-4514-a9ce-e01899beffa9` | True | 10 / 10 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Máy xay / Máy ép / Máy đánh trứng `812864e5-2682-4d13-bbd4-5c22aba656cd` | True | 8 / 8 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Máy lọc nước RO / Nano `82430f58-a332-4d4f-aa99-5c27f888a0e7` | True | 10 / 10 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Bếp gas / Bếp gas âm `863b2a1d-05f2-4792-beaa-4073e6197141` | True | 9 / 9 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Bình nóng lạnh điện `8c5b11b7-adfe-4c5d-a3b6-fd7afbf53636` | True | 9 / 9 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Bàn ủi / Bàn là hơi nước `a265bdb4-3c9f-4d0a-bcba-1f0722c8b420` | True | 7 / 7 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Lò nướng / Nồi chiên không dầu `a289a9b0-6cb9-4d94-b3a3-3ff6dd55e1f7` | True | 8 / 8 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Quạt điện / Quạt đứng / Quạt bàn `a9f91e3c-16d5-484d-92bf-68c526ac9606` | True | 9 / 9 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Máy hút bụi / Robot hút bụi `ac770808-e06b-4f11-8c0d-ea2c5ca4ab55` | True | 10 / 10 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Lò vi sóng `c3e13154-aeb8-4c3f-a6d3-6fa4f20566df` | True | 8 / 8 |
| Thiết bị gia dụng `0666ad90-ac9d-4d34-b04a-8925e7d1605d` | Máy pha cà phê / Ấm siêu tốc `f37e014f-c25d-4bcf-a5de-af804d32bd40` | True | 8 / 8 |
| Sửa nước `2a367f64-e8b2-4b94-8227-f5058c842af8` | Phễu thoát sàn / Khu vực phòng tắm `3a9061ae-55b0-4130-b48c-7b6f1c281247` | True | 9 / 9 |
| Sửa nước `2a367f64-e8b2-4b94-8227-f5058c842af8` | Bồn nước / Máy bơm / Phao nước `47c02e77-5604-49ae-8ca7-a38f619acd0d` | True | 12 / 12 |
| Sửa nước `2a367f64-e8b2-4b94-8227-f5058c842af8` | Lavabo / Chậu rửa / Bồn rửa `4f2dd034-f575-49b6-a913-cea3a620b618` | True | 9 / 9 |
| Sửa nước `2a367f64-e8b2-4b94-8227-f5058c842af8` | Vòi nước / Vòi sen `520cae18-9d24-4109-850f-1752f26f05ee` | True | 10 / 10 |
| Sửa nước `2a367f64-e8b2-4b94-8227-f5058c842af8` | Bồn cầu / Két nước `78e95d0e-4ea5-43d1-b0fe-9b3d9be8b3c3` | True | 10 / 10 |
| Sửa nước `2a367f64-e8b2-4b94-8227-f5058c842af8` | Bể tự hoại / Hố ga / Cống thoát `d9924692-19d1-4185-9e35-b381953c42a3` | True | 8 / 8 |
| Sửa nước `2a367f64-e8b2-4b94-8227-f5058c842af8` | Đường ống cấp / thoát nước `f27226de-570a-4c1e-84b5-dc419fe9c32e` | True | 12 / 12 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Nguồn điện / Adapter / Bộ nguồn `199c79fa-7e5d-424f-bb45-f2fd9242024f` | True | 9 / 9 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Công tắc thông minh / Relay `1c1b61c3-be55-4d27-8a32-46410e2a2017` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Ổ cắm thông minh / Hẹn giờ `215bc4ef-6d9d-49ec-841f-4a9fb91868f5` | True | 8 / 8 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Đèn ngoài trời / Sân vườn `2f246a0e-3617-4083-83da-2713460741cb` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Điện cửa cuốn / Cổng tự động `2fe406ed-6aae-4f00-b90f-b262e69645e5` | True | 9 / 9 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Bộ sạc xe điện / Ổ cắm sạc `34f7d2f7-e63f-4081-b968-2b8275cab527` | True | 9 / 9 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Dây điện / Cáp điện `36d41107-3c4a-4a4e-9aa1-22cba07aed57` | True | 13 / 13 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Tủ điện / Bảng điện `470acb27-41b1-4d36-9ee3-84b9bbc857de` | True | 11 / 11 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Hệ thống điện toàn nhà `481e60aa-a20b-466e-8ae0-c581284e67ee` | True | 13 / 13 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Aptomat / CB / MCB `484e7b6f-469e-4b22-acd8-bae2b7ea60a1` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Quạt trần / Quạt treo tường `492a7d40-96f6-4b1a-8146-34956f8a95f8` | True | 11 / 11 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Kiểm tra / Khảo sát sự cố điện `53a59ef2-9ffe-4206-940f-bc364951b917` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Cảm biến / Thiết bị tự động `56725529-2a0c-4bdf-a437-4f18d98b5939` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Hộp nối điện / Hộp kỹ thuật `56d03ad1-b3a0-469a-bf79-ec9e83d23e08` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Đèn trang trí / Đèn chùm `667cd41a-d6ab-42fa-808c-08898ba947dc` | True | 11 / 11 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Điện mặt trời / Inverter `72afafec-8d91-4ed9-b153-238d314ddfdf` | True | 9 / 9 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Đèn sự cố / Đèn thoát hiểm `8e1b308f-a8cd-4de8-9a30-6db52cfdb32c` | True | 8 / 8 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Thiết bị đo điện / Công tơ điện `93797cd8-e539-456e-a38f-f76316e84107` | True | 9 / 9 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Thiết bị chống rò / Chống giật `9a3f2d63-e61b-4d6c-8ff0-15e179c15d02` | True | 8 / 8 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Quạt thông gió / Quạt hút `9b5276c6-9692-46be-a8ad-f3e1afdac569` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Nguồn cấp cho thiết bị cố định `9e70ad4f-39e3-44f9-90d6-cb70c8ce9fbe` | True | 9 / 9 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Tiếp địa / Chống sét `aa15b0ce-a9e6-4faf-9c87-1d5102d339f5` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Bóng đèn / Đèn LED `b45c19d2-93d2-43ac-8330-87d223d941b4` | True | 11 / 11 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Chuông cửa / Nút nhấn `b5e21dc2-ed41-4aaa-9f0f-8f5f5aaf025c` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Máy bơm nước – Phần điện `bc70283c-4093-4574-aa3f-f5ef1fcdb353` | True | 9 / 9 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Ổ cắm điện `ca1e389e-6302-4a19-a086-5c815a836473` | True | 11 / 11 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Hệ thống điện phòng `cc357a32-647e-4598-9c0c-86c6d62f2427` | True | 11 / 11 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Ổn áp / UPS / Bộ lưu điện `ec503642-d273-4742-bf35-e8b3d509e7e5` | True | 10 / 10 |
| Sửa điện `4d397d29-ec22-4eae-88ea-8e411e04bdb3` | Công tắc điện `f2b5a73e-b1e3-45c2-97c1-a09015ad18b6` | True | 10 / 10 |
| Giúp việc `76c09b08-3231-4abd-be79-c2da76e06495` | Khu vực bếp / Thiết bị bếp bên ngoài `07174301-9fd2-4a3e-b3da-2b43303663e6` | True | 8 / 8 |
| Giúp việc `76c09b08-3231-4abd-be79-c2da76e06495` | Sofa / Nệm / Thảm / Rèm `2e1b524a-80c8-409d-aa30-e4c8ca71bfbd` | True | 10 / 10 |
| Giúp việc `76c09b08-3231-4abd-be79-c2da76e06495` | Văn phòng / Cửa hàng `349b1f3b-5664-4ba4-a3c4-567c16c58ca0` | True | 9 / 9 |
| Giúp việc `76c09b08-3231-4abd-be79-c2da76e06495` | Nhà vệ sinh / Phòng tắm `5ef7b978-d4dc-4287-b119-19926b473bac` | True | 8 / 8 |
| Giúp việc `76c09b08-3231-4abd-be79-c2da76e06495` | Cửa kính / Cửa sổ / Ban công `8ea8b042-3418-4ec9-8cd7-5c71b899a183` | True | 8 / 8 |
| Giúp việc `76c09b08-3231-4abd-be79-c2da76e06495` | Nhà ở / Căn hộ `cf864eb2-ba2a-4dd8-8b8f-d13602981783` | True | 10 / 10 |
| Giúp việc `76c09b08-3231-4abd-be79-c2da76e06495` | Sàn nhà / Tường / Trần / Nội thất `ee850727-ccde-4173-8b16-41e7be8065ca` | True | 9 / 9 |
| Điện lạnh `8ba77998-c7aa-4b53-875f-b14b8fba78f7` | Máy nước uống nóng lạnh `043e30bc-6493-4f96-82b6-e6a2f26e4bf2` | True | 8 / 8 |
| Điện lạnh `8ba77998-c7aa-4b53-875f-b14b8fba78f7` | Máy sấy quần áo `1746c918-2fb7-41ac-a111-5c3e807616bf` | True | 11 / 11 |
| Điện lạnh `8ba77998-c7aa-4b53-875f-b14b8fba78f7` | Máy lạnh / Điều hòa `3d946ff9-d116-4d07-9f38-c175669f74ed` | True | 17 / 17 |
| Điện lạnh `8ba77998-c7aa-4b53-875f-b14b8fba78f7` | Tủ lạnh / Tủ lạnh side-by-side `521d7ce8-9e72-492e-b0cd-4eb88508f58d` | True | 16 / 16 |
| Điện lạnh `8ba77998-c7aa-4b53-875f-b14b8fba78f7` | Tủ đông / Tủ mát `5e8f3e42-a1e4-47e3-8e76-8c774d04d5ea` | True | 12 / 12 |
| Điện lạnh `8ba77998-c7aa-4b53-875f-b14b8fba78f7` | Máy làm mát / Quạt điều hòa `8e1a07e4-134d-4214-8841-ad2969a584fa` | True | 9 / 9 |
| Điện lạnh `8ba77998-c7aa-4b53-875f-b14b8fba78f7` | Máy giặt / Máy giặt sấy `eaa18ae1-41b8-4588-bcdb-96192e5a2da8` | True | 19 / 19 |
| Làm vườn `ef9682ad-e5dc-494e-a22f-45df72b68f9e` | Hàng rào cây / Bồn hoa / Vườn rau `059da690-c6be-46a8-83d5-d96e250cbe4f` | True | 10 / 10 |
| Làm vườn `ef9682ad-e5dc-494e-a22f-45df72b68f9e` | Thảm cỏ / Bãi cỏ `32acffd8-6255-49b1-8035-eb34a5dff180` | True | 9 / 9 |
| Làm vườn `ef9682ad-e5dc-494e-a22f-45df72b68f9e` | Hệ thống tưới / Sân vườn tổng thể `cc0ab115-0758-4fd3-a4ad-b10a68cd0cdb` | True | 12 / 12 |
| Làm vườn `ef9682ad-e5dc-494e-a22f-45df72b68f9e` | Cây bóng mát / Cây lớn `e6e9a725-4058-4af4-83b7-a35fc91af354` | True | 9 / 9 |
| Làm vườn `ef9682ad-e5dc-494e-a22f-45df72b68f9e` | Cây cảnh / Chậu cây `fbcd5b31-5530-43ba-b35b-a32d25479477` | True | 10 / 10 |

## Chi tiết bản ghi cần xử lý

| Loại | Record ID |
|---|---|
