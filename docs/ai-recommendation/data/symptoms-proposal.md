# Đề xuất triệu chứng — chưa import

Nguồn: snapshot catalog 2026-11-14T08:44:36.599Z; 693 symptom candidates và 693 mapping candidates.

**Tất cả NEEDS_REVIEW, is_active=false**. Đây là tài liệu biên tập từ tên/mô tả/phạm vi dịch vụ, không phải dữ liệu đã duyệt hoặc nhãn AI. Không import tự động. Một candidate mỗi dịch vụ giúp trace service ID; reviewer cần gộp alias/trùng triệu chứng và tách yêu cầu bảo dưỡng/lắp đặt khỏi sự cố trước phê duyệt.

Code ổn định theo slug dịch vụ, ID đề xuất UUIDv5 theo target/service. Mapping chỉ trỏ ID đã có; service không target hoặc mismatch được đưa vào audit, không tự đoán target.

`VISUAL_OBSERVABLE` chỉ là dấu hiệu có thể quan sát bởi người dùng; không xác nhận model nhìn được. `USER_REPORTED` cần người dùng mô tả. `REQUIRES_TECHNICIAN_CHECK` không được khẳng định từ ảnh; tên yêu cầu dùng “Cần …” để tránh gọi nguyên nhân hỏng là dấu hiệu quan sát.

## Quy trình duyệt

1. Chủ catalog kiểm phạm vi công việc, tên/alias, kind, gộp candidate cùng dấu hiệu và loại scope request không phù hợp.
2. Duyệt từng liên kết dịch vụ, priority và active; loại candidate từ service inactive. Không tự APPROVED chỉ vì trùng tên.
3. Kiểm tra CSV bằng disposable import riêng sau review; không có lệnh import DB thật trong nhiệm vụ này.
4. Review migration, backup/restore và feature flag trước triển khai thật. Public API chỉ đọc active + APPROVED cho cả symptom và mapping.

## Danh sách theo từng đối tượng

### Máy nước uống nóng lạnh — `043e30bc-6493-4f96-82b6-e6a2f26e4bf2`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_may_khong_lam_lanh` — Máy không làm lạnh | USER_REPORTED | `216e281d-3254-4b65-a1c2-5f753a1e262f` | NEEDS_REVIEW |
| `request_sua_voi_lay_nuoc` — Cần sửa vòi lấy nước | USER_REPORTED | `4d234ba0-3d60-4b2c-b849-1c7617c34422` | NEEDS_REVIEW |
| `request_sua_bo_dieu_nhiet_may_nuoc_uong_nong_lanh` — Cần sửa bộ điều nhiệt | USER_REPORTED | `5ee5180e-7ab4-4ebf-8939-cc859e812fdb` | NEEDS_REVIEW |
| `symptom_sua_may_khong_len_nguon_may_nuoc_uong_nong_lanh` — Máy không lên nguồn | USER_REPORTED | `7da35063-9d71-47ec-b1a9-00506bda543b` | NEEDS_REVIEW |
| `request_lap_dat_di_doi_may_may_nuoc_uong_nong_lanh` — Cần lắp đặt / di dời máy | USER_REPORTED | `c5f7f547-d8a1-4758-becf-96ee14962f36` | NEEDS_REVIEW |
| `symptom_sua_may_khong_lam_nong` — Máy không làm nóng | USER_REPORTED | `c7add428-6358-4dae-977f-6841eac9821a` | NEEDS_REVIEW |
| `request_ve_sinh_khu_can_va_bao_duong` — Cần vệ sinh khử cặn và bảo dưỡng | USER_REPORTED | `ead7dbb0-6c6c-41c0-91fa-e2e0ca821e9e` | NEEDS_REVIEW |
| `symptom_sua_may_ro_nuoc_may_nuoc_uong_nong_lanh` — Máy rò nước | VISUAL_OBSERVABLE | `f0191689-b717-45e0-9f22-79a81711afe2` | NEEDS_REVIEW |

### Hàng rào cây / Bồn hoa / Vườn rau — `059da690-c6be-46a8-83d5-d96e250cbe4f`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lam_luong_trong_rau` — Cần làm luống trồng rau | USER_REPORTED | `266e601a-f32f-4e8c-b715-2495f2ceb1e1` | NEEDS_REVIEW |
| `request_thu_gom_la_canh` — Cần thu gom lá / cành | USER_REPORTED | `565d9f8c-e2a7-4bc0-80dd-820acb256fdb` | NEEDS_REVIEW |
| `request_tao_hinh_cay_hang_rao` — Cần tạo hình cây hàng rào | USER_REPORTED | `70b8a415-fb62-4d6e-92fe-9de192f1a5de` | NEEDS_REVIEW |
| `request_trong_hoa_theo_mua` — Cần trồng hoa theo mùa | USER_REPORTED | `9a6ad845-040f-4d61-b77e-54caea1454f9` | NEEDS_REVIEW |
| `request_thay_dat_bo_sung_gia_the` — Cần thay đất / bổ sung giá thể | USER_REPORTED | `9b744942-de8a-45d8-a142-0d76184af1dd` | NEEDS_REVIEW |
| `request_nho_co_va_don_bon_hoa` — Cần nhổ cỏ và dọn bồn hoa | USER_REPORTED | `a7109339-acfd-45d6-b3b5-04bbad722856` | NEEDS_REVIEW |
| `request_cat_tia_hang_rao_cay` — Cần cắt tỉa hàng rào cây | USER_REPORTED | `aa75530f-a4f2-4590-9c8e-0223f7aa6536` | NEEDS_REVIEW |
| `request_kiem_tra_sau_benh_hang_rao_cay_bon_hoa_vuon_rau` — Cần kiểm tra sâu bệnh | USER_REPORTED | `d4175c80-d0db-4f06-83d4-930292057d45` | NEEDS_REVIEW |
| `request_bon_phan_va_cham_soc` — Cần bón phân và chăm sóc | USER_REPORTED | `eb7d24c5-1dcd-4d75-a2fb-7cdda995f283` | NEEDS_REVIEW |
| `request_trong_rau_cay_gia_vi` — Cần trồng rau / cây gia vị | USER_REPORTED | `f61e029b-8e53-4a8d-a619-92ab58ffaf0c` | NEEDS_REVIEW |

### Khu vực bếp / Thiết bị bếp bên ngoài — `07174301-9fd2-4a3e-b3da-2b43303663e6`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_ve_sinh_ben_ngoai_tu_lanh_lo_may_hut_mui` — Cần vệ sinh bên ngoài tủ lạnh / lò / máy hút mùi | USER_REPORTED | `028ccaac-9cc3-4a66-aff9-654ec731f425` | NEEDS_REVIEW |
| `request_lam_sach_dau_mo_khu_vuc_bep` — Cần làm sạch dầu mỡ khu vực bếp | USER_REPORTED | `173cf3f1-d617-45ef-9bc2-3bb8f493b404` | NEEDS_REVIEW |
| `request_ve_sinh_san_bep` — Cần vệ sinh sàn bếp | USER_REPORTED | `31bb6380-ed6a-487d-9074-3b2266c1fd58` | NEEDS_REVIEW |
| `request_ve_sinh_tu_bep` — Cần vệ sinh tủ bếp | USER_REPORTED | `6d78726c-6267-464d-9de9-a8bdd88c7476` | NEEDS_REVIEW |
| `request_ve_sinh_bon_rua_va_mat_da` — Cần vệ sinh bồn rửa và mặt đá | USER_REPORTED | `b6b31b52-419b-432e-a9e4-56e90bc8acac` | NEEDS_REVIEW |
| `request_ve_sinh_mat_bep` — Cần vệ sinh mặt bếp | USER_REPORTED | `bdb541b8-07b8-4184-aadf-b13ee4165d12` | NEEDS_REVIEW |
| `request_lam_sach_tuong_gach_op_bep` — Cần làm sạch tường / gạch ốp bếp | USER_REPORTED | `c403d74d-a5a9-425d-bffc-de24816bf746` | NEEDS_REVIEW |
| `request_tong_ve_sinh_bep_sau_su_dung` — Cần tổng vệ sinh bếp sau sử dụng | USER_REPORTED | `f4e03a3d-1d45-4af1-a193-9be79fe34857` | NEEDS_REVIEW |

### Máy sấy quần áo — `1746c918-2fb7-41ac-a111-5c3e807616bf`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_bao_duong_may_say` — Cần bảo dưỡng máy sấy | USER_REPORTED | `0bc77866-2219-49c7-8d2c-4e91e924ab2a` | NEEDS_REVIEW |
| `symptom_sua_cua_cong_tac_cua` — Cửa / công tắc cửa | USER_REPORTED | `29088e59-3a7b-4e32-af4a-fc4fba4dbf97` | NEEDS_REVIEW |
| `request_kiem_tra_day_dai_con_lan` — Cần kiểm tra dây đai / con lăn | USER_REPORTED | `3a5f14fa-c059-4819-ae5b-a907c5158d3f` | NEEDS_REVIEW |
| `symptom_sua_may_say_khong_nong` — Máy sấy không nóng | USER_REPORTED | `3ef99885-8979-410b-85c6-fdb5d98a5e84` | NEEDS_REVIEW |
| `request_lap_dat_di_doi_may_say` — Cần lắp đặt / di dời máy sấy | USER_REPORTED | `75c06ae8-58e9-4126-9de8-02104327b388` | NEEDS_REVIEW |
| `symptom_sua_may_say_bao_loi` — Máy sấy báo lỗi | USER_REPORTED | `7abe4c00-a5a1-411d-b2a3-1a46b842de56` | NEEDS_REVIEW |
| `symptom_sua_may_say_keu_to` — Máy sấy kêu to | USER_REPORTED | `87138ef1-4a89-4b6b-a618-56cb5d7a99bf` | NEEDS_REVIEW |
| `symptom_sua_may_say_say_lau_khong_kho` — Máy sấy sấy lâu / không khô | USER_REPORTED | `a1e36e47-6d1f-4c52-9f63-32e6e4179c8d` | NEEDS_REVIEW |
| `symptom_sua_may_say_khong_quay` — Máy sấy không quay | USER_REPORTED | `c837c2a3-5fe1-4514-9261-0fe3a8551407` | NEEDS_REVIEW |
| `symptom_sua_may_say_khong_len_nguon` — Máy sấy không lên nguồn | USER_REPORTED | `dcc074b3-3a7f-42e9-a13c-bf504cfc833d` | NEEDS_REVIEW |
| `request_ve_sinh_loc_xo_vai_duong_thoat_khi` — Cần vệ sinh lọc xơ vải / đường thoát khí | USER_REPORTED | `eed47ab5-d557-4a82-a539-0dc73287ecae` | NEEDS_REVIEW |

### Nguồn điện / Adapter / Bộ nguồn — `199c79fa-7e5d-424f-bb45-f2fd9242024f`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_bo_nguon_dung_thong_so` — Cần lắp bộ nguồn đúng thông số | USER_REPORTED | `2227d4d9-d3e5-479b-889c-93bd720b5d74` | NEEDS_REVIEW |
| `symptom_kiem_tra_adapter_khong_ra_dien` — Kiểm tra adapter không ra điện | USER_REPORTED | `7bde7f24-2090-4f6b-8d0b-361b49cd1246` | NEEDS_REVIEW |
| `request_kiem_tra_day_dau_cam_nguon` — Cần kiểm tra dây / đầu cắm nguồn | USER_REPORTED | `9636569a-745d-4adb-a191-87303526815d` | NEEDS_REVIEW |
| `symptom_sua_bo_nguon_khong_cap_dien` — Bộ nguồn không cấp điện | USER_REPORTED | `9d2946fe-fe63-40af-a2ca-69956ed08e00` | NEEDS_REVIEW |
| `symptom_thay_adapter_hong` — Thay adapter hỏng | USER_REPORTED | `a1203b94-9176-4197-a17d-f55eb02f92bd` | NEEDS_REVIEW |
| `request_kiem_tra_bo_nguon_dc` — Cần kiểm tra bộ nguồn DC | USER_REPORTED | `b099f902-bf95-452a-a44c-eb8f58d17fbc` | NEEDS_REVIEW |
| `request_thay_bo_chuyen_doi_dien_ap` — Cần thay bộ chuyển đổi điện áp | USER_REPORTED | `b1fb07d6-d6be-48d2-9fee-5e3c402fca73` | NEEDS_REVIEW |
| `request_thay_nguon_led` — Cần thay nguồn LED | USER_REPORTED | `b71ec9b3-8b2e-475b-9718-cb8aad4cc393` | NEEDS_REVIEW |
| `request_kiem_tra_nguon_phat_nong` — Cần kiểm tra nguồn phát nóng | USER_REPORTED | `ffe23ef5-8e7c-43d5-9133-12d673c1455e` | NEEDS_REVIEW |

### Công tắc thông minh / Relay — `1c1b61c3-be55-4d27-8a32-46410e2a2017`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_lap_cong_tac_thong_minh_wi_fi` — Lắp công tắc thông minh Wi-Fi | USER_REPORTED | `211e7981-8298-42ec-bc83-1cecc859a3e6` | NEEDS_REVIEW |
| `request_cai_lich_tu_dong` — Cần cài lịch tự động | USER_REPORTED | `5be747c9-6c52-4622-ba81-05eba50e1894` | NEEDS_REVIEW |
| `symptom_nang_cap_cong_tac_co` — Nâng cấp công tắc cơ | USER_REPORTED | `7905df33-3df5-469b-b610-c13b4b85ac23` | NEEDS_REVIEW |
| `symptom_sua_cong_tac_thong_minh_khong_hoat_dong` — Công tắc thông minh không hoạt động | USER_REPORTED | `93f8eb87-a886-4c55-af02-f2ed48fb1ca3` | NEEDS_REVIEW |
| `symptom_kiem_tra_tuong_thich_tai_day_trung_tinh` — Kiểm tra tương thích tải / dây trung tính | USER_REPORTED | `ad329a75-5f4d-4a5d-b50b-99b0188c1820` | NEEDS_REVIEW |
| `request_ket_noi_ung_dung` — Cần kết nối ứng dụng | USER_REPORTED | `bc0bf2c3-4da1-48f1-a487-f7e2808d2789` | NEEDS_REVIEW |
| `symptom_lap_cong_tac_thong_minh_zigbee` — Lắp công tắc thông minh Zigbee | USER_REPORTED | `d3de58b4-91da-4238-8a6a-ea21fe893a39` | NEEDS_REVIEW |
| `request_lap_relay_dieu_khien` — Cần lắp relay điều khiển | USER_REPORTED | `d7a58400-d1df-42a9-87a7-9033827e25e4` | NEEDS_REVIEW |
| `symptom_sua_cong_tac_mat_ket_noi` — Công tắc mất kết nối | USER_REPORTED | `d7e5f8d3-65c7-4809-8abb-967a35dc7322` | NEEDS_REVIEW |
| `symptom_sua_relay_khong_dong_ngat` — Relay không đóng / ngắt | USER_REPORTED | `fae3ff66-6777-4df9-a44b-73ba26999c25` | NEEDS_REVIEW |

### Ổ cắm thông minh / Hẹn giờ — `215bc4ef-6d9d-49ec-841f-4a9fb91868f5`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_o_cam_hen_gio` — Cần lắp ổ cắm hẹn giờ | USER_REPORTED | `1555a030-574b-40ce-98cd-6f73b707dcdb` | NEEDS_REVIEW |
| `symptom_sua_o_cam_mat_ket_noi` — Ổ cắm mất kết nối | USER_REPORTED | `1596f7dc-d6de-4e7f-9ae2-b73d63b87cef` | NEEDS_REVIEW |
| `request_cau_hinh_lich_bat_tat` — Cần cấu hình lịch bật / tắt | USER_REPORTED | `292731f3-9895-48eb-87fd-db4683c64c01` | NEEDS_REVIEW |
| `symptom_sua_o_cam_thong_minh_mat_dien` — Ổ cắm thông minh mất điện | USER_REPORTED | `6202ee51-b6df-4994-8648-a1bbd95d3965` | NEEDS_REVIEW |
| `request_lap_o_cam_thong_minh` — Cần lắp ổ cắm thông minh | USER_REPORTED | `6a8ec183-d41d-427b-90d0-be2f6883b5d6` | NEEDS_REVIEW |
| `request_sua_bo_hen_gio_dien` — Cần sửa bộ hẹn giờ điện | USER_REPORTED | `a574b5a9-6330-4cbc-b231-01bde90c15d4` | NEEDS_REVIEW |
| `request_thay_o_cam_thong_minh` — Cần thay ổ cắm thông minh | USER_REPORTED | `b2c5d0dc-9001-439b-86c1-07e9502e3685` | NEEDS_REVIEW |
| `request_kiem_tra_qua_tai_o_cam` — Cần kiểm tra quá tải ổ cắm | USER_REPORTED | `f6120d5a-528d-42bf-bb37-c4bef4e4bf31` | NEEDS_REVIEW |

### Sofa / Nệm / Thảm / Rèm — `2e1b524a-80c8-409d-aa30-e4c8ca71bfbd`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_khu_mui_sofa_nem_tham` — Cần khử mùi sofa / nệm / thảm | USER_REPORTED | `0a624e1c-1fe9-4bbc-815f-8f981a84917b` | NEEDS_REVIEW |
| `request_giat_sofa_vai` — Cần giặt sofa vải | USER_REPORTED | `186f55db-db39-4f5f-9fee-481682bd3220` | NEEDS_REVIEW |
| `request_giat_tham_trai_san` — Cần giặt thảm trải sàn | USER_REPORTED | `46bbe328-8ada-4c8a-92dc-ad26d65d645a` | NEEDS_REVIEW |
| `request_ve_sinh_dinh_ky_do_noi_that_vai` — Cần vệ sinh định kỳ đồ nội thất vải | USER_REPORTED | `62eeb182-dea3-43a4-aaca-377334dfa299` | NEEDS_REVIEW |
| `request_hut_bui_nem_chuyen_sau` — Cần hút bụi nệm chuyên sâu | USER_REPORTED | `6fa177d7-0c20-4d85-b8fa-a622b21488f0` | NEEDS_REVIEW |
| `request_xu_ly_vet_ban_theo_chat_lieu` — Cần xử lý vết bẩn theo chất liệu | USER_REPORTED | `710a464d-997a-4ed6-84d3-322923088951` | NEEDS_REVIEW |
| `request_giat_nem_dem` — Cần giặt nệm / đệm | USER_REPORTED | `915707d0-c0bd-4094-8b5e-23a449034f3f` | NEEDS_REVIEW |
| `request_ve_sinh_sofa_da_dung_chat_lieu` — Cần vệ sinh sofa da đúng chất liệu | USER_REPORTED | `c224ef3f-0511-41ec-b758-e001aeb1bc44` | NEEDS_REVIEW |
| `request_ve_sinh_ghe_nem` — Cần vệ sinh ghế nệm | USER_REPORTED | `d059b4a8-9028-464a-a675-8d91e0d2ab16` | NEEDS_REVIEW |
| `request_giat_rem_cua` — Cần giặt rèm cửa | USER_REPORTED | `e9881edd-fe0e-47b3-a541-9af3503911b9` | NEEDS_REVIEW |

### Đèn ngoài trời / Sân vườn — `2f246a0e-3617-4083-83da-2713460741cb`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_den_chong_nuoc` — Cần lắp đèn chống nước | USER_REPORTED | `3f6beab4-563a-4411-a84c-18b2b2699390` | NEEDS_REVIEW |
| `symptom_sua_den_chap_chon` — Đèn chập chờn | USER_REPORTED | `46bc102a-748b-40ed-a528-02d752ca43ce` | NEEDS_REVIEW |
| `request_kiem_tra_day_cap_dien_ngoai_troi` — Cần kiểm tra dây cấp điện ngoài trời | USER_REPORTED | `93e6e943-f177-49fd-8f73-b6c19afe8f10` | NEEDS_REVIEW |
| `request_lap_den_san_vuon` — Cần lắp đèn sân vườn | USER_REPORTED | `95011ad2-f677-4979-93d8-8e40b763e48a` | NEEDS_REVIEW |
| `request_thay_driver_bo_nguon` — Cần thay driver / bộ nguồn | USER_REPORTED | `9c0e175b-0e9f-4363-a2df-1e333313eabe` | NEEDS_REVIEW |
| `request_lap_den_cong` — Cần lắp đèn cổng | USER_REPORTED | `a0f3b8a6-fc7a-4c50-95d3-12c5c64ba271` | NEEDS_REVIEW |
| `request_lap_den_pha_led` — Cần lắp đèn pha LED | USER_REPORTED | `a907b14d-ab0a-4e22-b938-39ec408a3366` | NEEDS_REVIEW |
| `request_lap_den_cam_bien_anh_sang` — Cần lắp đèn cảm biến ánh sáng | REQUIRES_TECHNICIAN_CHECK | `aafff347-72fc-4250-bdab-1aa570335c1d` | NEEDS_REVIEW |
| `symptom_sua_den_ngoai_troi_khong_sang` — Đèn ngoài trời không sáng | USER_REPORTED | `ed2f1d4d-7e69-4591-82ee-46f7ce41e65a` | NEEDS_REVIEW |
| `request_lap_den_cam_bien_chuyen_dong` — Cần lắp đèn cảm biến chuyển động | REQUIRES_TECHNICIAN_CHECK | `f3cd8b92-c315-464c-a025-8099fe9b1b9e` | NEEDS_REVIEW |

### Điện cửa cuốn / Cổng tự động — `2fe406ed-6aae-4f00-b90f-b262e69645e5`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_kiem_tra_cam_bien_an_toan` — Cần kiểm tra cảm biến an toàn | REQUIRES_TECHNICIAN_CHECK | `3129b695-aefc-4577-8476-ef73d32e321f` | NEEDS_REVIEW |
| `symptom_kiem_tra_cua_cuon_mat_nguon` — Kiểm tra cửa cuốn mất nguồn | USER_REPORTED | `4e2ebf2a-13ed-4f38-a843-973333b0a67b` | NEEDS_REVIEW |
| `request_sua_bo_nhan_dieu_khien` — Cần sửa bộ nhận điều khiển | USER_REPORTED | `5f900e92-169d-4ce1-ad57-3434891da4ca` | NEEDS_REVIEW |
| `request_thay_bo_nguon_dieu_khien` — Cần thay bộ nguồn điều khiển | USER_REPORTED | `61102935-648e-4568-9f54-1a12b9ead59a` | NEEDS_REVIEW |
| `symptom_kiem_tra_cong_khong_dong_mo` — Kiểm tra cổng không đóng / mở | USER_REPORTED | `a94c8087-bf4d-4371-b66e-e76f5d6bd109` | NEEDS_REVIEW |
| `symptom_sua_cong_tac_hanh_trinh` — Công tắc hành trình | USER_REPORTED | `b02d6729-0ed6-40fd-a9b0-4719381c5bbe` | NEEDS_REVIEW |
| `request_bao_tri_phan_dien_cua_cuon` — Cần bảo trì phần điện cửa cuốn | USER_REPORTED | `e0dbff62-dafe-48b2-827c-cf4d38a3651a` | NEEDS_REVIEW |
| `request_kiem_tra_motor_cua_cuon` — Cần kiểm tra motor cửa cuốn | USER_REPORTED | `e4ad678f-b765-42be-9b36-557fc2297fee` | NEEDS_REVIEW |
| `request_sua_nut_nhan_cua_cuon` — Cần sửa nút nhấn cửa cuốn | USER_REPORTED | `e976b1a4-749a-40f6-8d6f-b7d05118a5e2` | NEEDS_REVIEW |

### Máy lọc không khí / Máy hút ẩm — `31a46f93-b19d-46e0-89ec-de97705944e4`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_ve_sinh_va_bao_duong_may_loc_khong_khi_may_hut_am` — Cần vệ sinh và bảo dưỡng | USER_REPORTED | `29effb60-c3fa-4d30-b614-2f4b210889eb` | NEEDS_REVIEW |
| `request_thay_loc_phu_hop` — Cần thay lọc phù hợp | USER_REPORTED | `306c9acd-ba0d-45a0-8c9d-2aaf37002bea` | NEEDS_REVIEW |
| `symptom_sua_may_hut_am_khong_thu_nuoc` — Máy hút ẩm không thu nước | USER_REPORTED | `3e373171-0db6-48f9-95a6-a1ec671103fb` | NEEDS_REVIEW |
| `symptom_sua_may_bao_loi_may_loc_khong_khi_may_hut_am` — Máy báo lỗi | USER_REPORTED | `82e59186-ffff-4048-b5c8-660d5ce3099f` | NEEDS_REVIEW |
| `request_sua_binh_chua_phao_bao_day` — Cần sửa bình chứa / phao báo đầy | USER_REPORTED | `a487e4be-cf0e-4644-87f3-d94ce8801dc7` | NEEDS_REVIEW |
| `symptom_sua_may_khong_len_nguon_may_loc_khong_khi_may_hut_am` — Máy không lên nguồn | USER_REPORTED | `b58273de-8f5f-4bbd-b1ff-28a6c565c29a` | NEEDS_REVIEW |
| `symptom_sua_may_khong_chay_quat` — Máy không chạy quạt | USER_REPORTED | `b6628836-9381-4a02-9c1a-40a39be9715c` | NEEDS_REVIEW |
| `request_sua_cam_bien_bui_do_am` — Cần sửa cảm biến bụi / độ ẩm | REQUIRES_TECHNICIAN_CHECK | `f3bc6c21-12ab-4749-bb06-83b0bdd59635` | NEEDS_REVIEW |

### Thảm cỏ / Bãi cỏ — `32acffd8-6255-49b1-8035-eb34a5dff180`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_thu_gom_co_sau_cat` — Cần thu gom cỏ sau cắt | USER_REPORTED | `12842817-1645-47df-bb4c-7ad640f864e6` | NEEDS_REVIEW |
| `request_trong_moi_tham_co` — Cần trồng mới thảm cỏ | USER_REPORTED | `1da87ebe-2778-46f3-a664-e86263a0d0cf` | NEEDS_REVIEW |
| `request_tuoi_va_cham_soc_tham_co` — Cần tưới và chăm sóc thảm cỏ | USER_REPORTED | `2e2257b1-d789-4d91-8286-24beddedff6c` | NEEDS_REVIEW |
| `request_nho_don_co_dai` — Cần nhổ / dọn cỏ dại | USER_REPORTED | `4f667a88-e6e4-40ce-b248-a5beeb0f1e6e` | NEEDS_REVIEW |
| `request_bon_phan_cai_tao_dat_tham_co` — Cần bón phân / cải tạo đất thảm cỏ | USER_REPORTED | `b38e7a73-0256-479e-ab8d-417b17978102` | NEEDS_REVIEW |
| `request_dam_co_bi_trong` — Cần dặm cỏ bị trống | USER_REPORTED | `c09dba0e-acf8-4caf-80fc-1206054e3320` | NEEDS_REVIEW |
| `request_cat_co_moc_cao` — Cần cắt cỏ mọc cao | USER_REPORTED | `ce98a712-094e-44f4-b1a5-760b7f610d6d` | NEEDS_REVIEW |
| `request_cat_co_dinh_ky` — Cần cắt cỏ định kỳ | USER_REPORTED | `d98a5506-1cd3-451f-a163-af80055ccb3b` | NEEDS_REVIEW |
| `request_xu_ly_sau_benh_tham_co` — Cần xử lý sâu bệnh thảm cỏ | USER_REPORTED | `e14866f1-08b8-4cb0-8ea5-e6332f1422e2` | NEEDS_REVIEW |

### Văn phòng / Cửa hàng — `349b1f3b-5664-4ba4-a3c4-567c16c58ca0`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_ve_sinh_khu_vuc_pantry` — Cần vệ sinh khu vực pantry | USER_REPORTED | `149cc0d7-1d6a-44a4-929a-8f326d59ac5a` | NEEDS_REVIEW |
| `request_ve_sinh_khu_vuc_le_tan` — Cần vệ sinh khu vực lễ tân | USER_REPORTED | `2aa208dc-c348-4524-ab5f-c8fe447c5a74` | NEEDS_REVIEW |
| `request_tong_ve_sinh_cua_hang_truoc_khai_truong` — Cần tổng vệ sinh cửa hàng trước khai trương | USER_REPORTED | `3638ab19-9c73-46fe-ae39-c43edc3b8f4a` | NEEDS_REVIEW |
| `request_hut_bui_lau_san_van_phong` — Cần hút bụi / lau sàn văn phòng | USER_REPORTED | `601d4fb0-2942-4ed6-b16d-588f1605fc4f` | NEEDS_REVIEW |
| `request_ve_sinh_phong_hop` — Cần vệ sinh phòng họp | USER_REPORTED | `7ddc6714-c06e-4be7-94d8-e6c435d01f94` | NEEDS_REVIEW |
| `request_thu_gom_rac_va_thay_tui_rac` — Cần thu gom rác và thay túi rác | USER_REPORTED | `8d436442-ecd8-481c-94b7-948edc9d977f` | NEEDS_REVIEW |
| `request_lau_kinh_noi_that` — Cần lau kính nội thất | USER_REPORTED | `a4288b4a-f4f9-4719-bf45-4818955cda7f` | NEEDS_REVIEW |
| `request_ve_sinh_ban_lam_viec` — Cần vệ sinh bàn làm việc | USER_REPORTED | `b334fa16-a1b6-4747-a694-792ff707eee7` | NEEDS_REVIEW |
| `request_ve_sinh_van_phong_theo_gio` — Cần vệ sinh văn phòng theo giờ | USER_REPORTED | `f3b22584-5fd9-46ea-a066-80fe44becc7a` | NEEDS_REVIEW |

### Bộ sạc xe điện / Ổ cắm sạc — `34f7d2f7-e63f-4081-b968-2b8275cab527`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_kiem_tra_o_sac_phat_nong` — Cần kiểm tra ổ sạc phát nóng | USER_REPORTED | `1549a196-222f-42e0-be3e-e7b1683767a8` | NEEDS_REVIEW |
| `request_lap_bo_sac_tai_nha` — Cần lắp bộ sạc tại nhà | USER_REPORTED | `6176c32c-4756-4b9c-9a3c-1400a285e778` | NEEDS_REVIEW |
| `request_lap_mach_cap_dien_rieng` — Cần lắp mạch cấp điện riêng | USER_REPORTED | `66cd27c0-35aa-4638-a280-55b399096b34` | NEEDS_REVIEW |
| `request_kiem_tra_thiet_bi_bao_ve_nhanh_sac` — Cần kiểm tra thiết bị bảo vệ nhánh sạc | USER_REPORTED | `68e090de-3d4e-4477-87b6-0b3bd8e40bcd` | NEEDS_REVIEW |
| `request_kiem_tra_tiep_dia_sac` — Cần kiểm tra tiếp địa sạc | USER_REPORTED | `b9758450-dcf7-4749-9ac6-de15b13c65f1` | NEEDS_REVIEW |
| `request_bao_tri_cap_dien_bo_sac` — Cần bảo trì cấp điện bộ sạc | USER_REPORTED | `c85d6bc0-c45a-4763-8000-61976d4df7bb` | NEEDS_REVIEW |
| `symptom_kiem_tra_sac_bao_loi` — Kiểm tra sạc báo lỗi | USER_REPORTED | `d64b3bf4-6f02-43bc-b3f4-88f6bef09635` | NEEDS_REVIEW |
| `symptom_kiem_tra_sac_khong_cap_dien` — Kiểm tra sạc không cấp điện | USER_REPORTED | `f2be9d66-c2ff-418c-bad8-cf36d5613fda` | NEEDS_REVIEW |
| `request_khao_sat_vi_tri_lap_sac` — Cần khảo sát vị trí lắp sạc | USER_REPORTED | `fd553dfa-0afc-4126-8a79-71a823eff038` | NEEDS_REVIEW |

### Dây điện / Cáp điện — `36d41107-3c4a-4a4e-9aa1-22cba07aed57`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_thay_day_cu_xuong_cap` — Cần thay dây cũ / xuống cấp | USER_REPORTED | `003d2d41-f59b-4592-972a-57915bd42935` | NEEDS_REVIEW |
| `symptom_xu_ly_day_dien_chap` — Dây điện chập | USER_REPORTED | `033c328a-47f5-46dd-8926-941dae227468` | NEEDS_REVIEW |
| `request_danh_gia_tiet_dien_day_theo_tai` — Cần đánh giá tiết diện dây theo tải | USER_REPORTED | `4e76cedc-2498-4f6a-a439-29bcf95d681c` | NEEDS_REVIEW |
| `request_di_day_dien_noi` — Cần đi dây điện nổi | USER_REPORTED | `4ef1745e-3a36-4af3-b774-48982897ae39` | NEEDS_REVIEW |
| `request_thay_cap_nguon` — Cần thay cáp nguồn | USER_REPORTED | `69ac89b3-9bdb-4922-b801-284c448ab90f` | NEEDS_REVIEW |
| `request_kiem_tra_day_dien_dut` — Cần kiểm tra dây điện đứt | USER_REPORTED | `6af3ccd0-ec3e-47ac-8603-ffca0d5f5172` | NEEDS_REVIEW |
| `request_thay_day_ho_loi` — Cần thay dây hở lõi | USER_REPORTED | `7820d04f-c0ce-4b1b-b6b2-b9c822bf7f32` | NEEDS_REVIEW |
| `request_sua_moi_noi_long` — Cần sửa mối nối lỏng | USER_REPORTED | `a2b31ebb-5f16-4952-a9a7-30099ce519c8` | NEEDS_REVIEW |
| `symptom_thay_day_dien_chay` — Thay dây điện cháy | USER_REPORTED | `a3b74a07-5e80-4de8-88a3-c87fad215617` | NEEDS_REVIEW |
| `request_di_day_trong_mang_cap` — Cần đi dây trong máng cáp | USER_REPORTED | `a48b7fc9-a63c-4de1-b176-d899c57b8d92` | NEEDS_REVIEW |
| `request_luon_day_trong_ong` — Cần luồn dây trong ống | USER_REPORTED | `b808d866-4bd1-4a34-9c4b-53f451fe65ca` | NEEDS_REVIEW |
| `request_di_day_dien_am_tuong` — Cần đi dây điện âm tường | USER_REPORTED | `df4ce796-5b2c-4ee9-9bb1-1ed894086ee6` | NEEDS_REVIEW |
| `request_bo_sung_duong_day_cap_dien` — Cần bổ sung đường dây cấp điện | USER_REPORTED | `fb71ae4f-db5f-4364-8365-0b5f6c5a80d2` | NEEDS_REVIEW |

### Phễu thoát sàn / Khu vực phòng tắm — `3a9061ae-55b0-4130-b48c-7b6f1c281247`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_xu_ly_mui_hoi_tu_pheu_thoat` — Cần xử lý mùi hôi từ phễu thoát | USER_REPORTED | `1bc6be66-6bdc-4f79-be83-749c9d525917` | NEEDS_REVIEW |
| `request_lap_van_ngan_mui_ngan_trao` — Cần lắp van ngăn mùi / ngăn trào | USER_REPORTED | `1ce7ac47-5acc-43b2-a33e-88ecaaf7f5ba` | NEEDS_REVIEW |
| `symptom_thong_tac_pheu_thoat_san` — Thông tắc phễu thoát sàn | USER_REPORTED | `326dd83f-f690-4f85-9229-96c52d543e37` | NEEDS_REVIEW |
| `request_xu_ly_thoat_nuoc_san_cham` — Cần xử lý thoát nước sàn chậm | USER_REPORTED | `365b57c0-d7f4-4bf6-b42a-2b9cda531cf1` | NEEDS_REVIEW |
| `symptom_sua_ro_nuoc_duong_xa_san` — Rò nước đường xả sàn | VISUAL_OBSERVABLE | `36ae174e-1143-4370-b51e-cadcf8350332` | NEEDS_REVIEW |
| `request_thay_phu_kien_thoat_nuoc` — Cần thay phụ kiện thoát nước | USER_REPORTED | `54ba4bee-0628-4601-bf7e-725e63468841` | NEEDS_REVIEW |
| `request_thay_pheu_thoat_san` — Cần thay phễu thoát sàn | USER_REPORTED | `5e0791d6-f148-494e-9fd7-3033c5b0da20` | NEEDS_REVIEW |
| `request_kiem_tra_dong_nuoc_khu_vuc_tam` — Cần kiểm tra đọng nước khu vực tắm | USER_REPORTED | `913794e1-1698-494c-a60d-a35ac13391a1` | NEEDS_REVIEW |
| `request_sua_duong_cap_nuoc_voi_sen` — Cần sửa đường cấp nước vòi sen | USER_REPORTED | `f9ebd71d-a320-4e18-bba0-18b2b5474a53` | NEEDS_REVIEW |

### Máy lạnh / Điều hòa — `3d946ff9-d116-4d07-9f38-c175669f74ed`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_dat_may_lanh` — Cần lắp đặt máy lạnh | USER_REPORTED | `1998fead-5655-4770-b92f-b3492dce2546` | NEEDS_REVIEW |
| `request_bao_duong_may_lanh_dinh_ky` — Cần bảo dưỡng máy lạnh định kỳ | USER_REPORTED | `265289b1-fac0-4db2-b6e8-12ca45d2108a` | NEEDS_REVIEW |
| `request_sua_bo_mach_hoac_cam_bien_may_lanh` — Cần sửa bo mạch hoặc cảm biến máy lạnh | REQUIRES_TECHNICIAN_CHECK | `533b4798-55b7-499c-aa75-53b3157a536e` | NEEDS_REVIEW |
| `request_ve_sinh_may_lanh_am_tran` — Cần vệ sinh máy lạnh âm trần | USER_REPORTED | `538c4c37-07b7-4faa-beea-2b63dc30dfd6` | NEEDS_REVIEW |
| `symptom_sua_may_lanh_keu_to_hoac_rung` — Máy lạnh kêu to hoặc rung | USER_REPORTED | `6a79ff0d-3fe6-4ec4-87a2-849022e3e958` | NEEDS_REVIEW |
| `request_sua_may_lanh_co_mui_bat_thuong` — Cần sửa máy lạnh có mùi bất thường | USER_REPORTED | `6bb773ef-8672-4477-b128-ac8041c1109d` | NEEDS_REVIEW |
| `request_thao_do_di_doi_may_lanh` — Cần tháo dỡ / di dời máy lạnh | USER_REPORTED | `7949d419-60a9-4cb3-8a04-cfab8539188e` | NEEDS_REVIEW |
| `request_sua_duong_thoat_nuoc_ngung_may_lanh` — Cần sửa đường thoát nước ngưng máy lạnh | USER_REPORTED | `85f1b3f6-cf91-4af0-86c8-6d216f15b0d9` | NEEDS_REVIEW |
| `request_sua_quat_dan_nong_hoac_dan_lanh` — Cần sửa quạt dàn nóng hoặc dàn lạnh | USER_REPORTED | `905dd984-98b9-4436-ac72-5a9616002ae5` | NEEDS_REVIEW |
| `request_kiem_tra_va_nap_moi_chat_lanh_dung_ky_thuat` — Cần kiểm tra và nạp môi chất lạnh đúng kỹ thuật | REQUIRES_TECHNICIAN_CHECK | `94831775-264b-4af8-a21e-10f523f9f5fc` | NEEDS_REVIEW |
| `request_kiem_tra_may_lanh_bao_ma_loi` — Cần kiểm tra máy lạnh báo mã lỗi | USER_REPORTED | `b19b0bb7-4507-47a9-80a5-50f4d42d5138` | NEEDS_REVIEW |
| `symptom_sua_may_lanh_khong_len_nguon` — Máy lạnh không lên nguồn | USER_REPORTED | `baaab7a2-cf7e-40b6-bd25-73d84d27b0bf` | NEEDS_REVIEW |
| `symptom_kiem_tra_may_lanh_khong_lanh_hoac_lanh_yeu` — Kiểm tra máy lạnh không lạnh hoặc lạnh yếu | USER_REPORTED | `dc0091a4-0af0-429a-8add-90fca698425a` | NEEDS_REVIEW |
| `symptom_sua_may_lanh_chay_nuoc` — Máy lạnh chảy nước | VISUAL_OBSERVABLE | `e60a5f50-10a0-482e-8f68-cb52e89b9555` | NEEDS_REVIEW |
| `request_kiem_tra_va_xu_ly_ro_ri_moi_chat_lanh` — Cần kiểm tra và xử lý rò rỉ môi chất lạnh | REQUIRES_TECHNICIAN_CHECK | `e9caade5-0f99-4aa2-8c48-e288ecc39bfb` | NEEDS_REVIEW |
| `request_ve_sinh_may_lanh_treo_tuong` — Cần vệ sinh máy lạnh treo tường | USER_REPORTED | `ec3baa05-0022-4ee2-a0c5-aff4b4bfc95c` | NEEDS_REVIEW |
| `symptom_sua_may_lanh_dong_tuyet` — Máy lạnh đóng tuyết | VISUAL_OBSERVABLE | `fca64789-2dd3-433f-a8bc-a53784cabf0b` | NEEDS_REVIEW |

### Máy hút mùi — `42c03e7a-0da1-446a-ae1e-db7783716016`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_sua_bang_dieu_khien_may_hut_mui` — Cần sửa bảng điều khiển | USER_REPORTED | `561e3146-8f35-4f00-8848-e9d21d040d27` | NEEDS_REVIEW |
| `request_sua_den_may_hut_mui` — Cần sửa đèn máy hút mùi | USER_REPORTED | `6f477db2-3236-4d11-9244-7544476a6f22` | NEEDS_REVIEW |
| `request_sua_quat_dong_co` — Cần sửa quạt / động cơ | REQUIRES_TECHNICIAN_CHECK | `75243fe6-f2e7-40a4-bf6c-09526a0eaabf` | NEEDS_REVIEW |
| `request_thay_luoi_loc_loc_than` — Cần thay lưới lọc / lọc than | USER_REPORTED | `77ec0dcc-025e-4350-bbdb-b72d1af5d60a` | NEEDS_REVIEW |
| `symptom_sua_may_khong_len_nguon` — Máy không lên nguồn | USER_REPORTED | `8d9bbd62-5db7-4f31-bc83-d14732db1504` | NEEDS_REVIEW |
| `request_lap_dat_di_doi_may` — Cần lắp đặt / di dời máy | USER_REPORTED | `a4ce8ec6-145d-4e0a-a24a-8cd94431c20b` | NEEDS_REVIEW |
| `symptom_sua_may_khong_hut_hut_yeu` — Máy không hút / hút yếu | USER_REPORTED | `d1794193-eabe-4a9f-a8e5-cb936ebb99b5` | NEEDS_REVIEW |
| `request_ve_sinh_dau_mo_va_duong_hut` — Cần vệ sinh dầu mỡ và đường hút | USER_REPORTED | `e4d43f4c-ac01-42e6-a35c-3ce03118d1ec` | NEEDS_REVIEW |

### Máy rửa chén / Máy rửa bát — `44c6d84b-0c8c-44f0-855b-36aff9d8222a`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_ve_sinh_bo_loc_tay_phun` — Cần vệ sinh bộ lọc / tay phun | USER_REPORTED | `05ce7278-30a7-44ea-b9b5-fa0c2e0100b6` | NEEDS_REVIEW |
| `symptom_sua_may_ro_nuoc_may_rua_chen_may_rua_bat` — Máy rò nước | VISUAL_OBSERVABLE | `231257e0-117f-4cdd-b2a5-7dfac1b12948` | NEEDS_REVIEW |
| `symptom_sua_may_rua_khong_sach` — Máy rửa không sạch | USER_REPORTED | `278b7653-fa6a-4dbc-8a91-96bb95f5f051` | NEEDS_REVIEW |
| `symptom_sua_may_khong_say_kho` — Máy không sấy khô | USER_REPORTED | `29f45efd-2f2b-4ebb-ae78-f82f2512e1cc` | NEEDS_REVIEW |
| `symptom_sua_may_khong_cap_nuoc` — Máy không cấp nước | USER_REPORTED | `6dc5df4d-684b-4817-a37e-260f88777e1c` | NEEDS_REVIEW |
| `symptom_sua_may_bao_loi` — Máy báo lỗi | USER_REPORTED | `86dafb7d-2e27-410a-a94a-06a8363b7b10` | NEEDS_REVIEW |
| `request_lap_dat_di_doi_may_may_rua_chen_may_rua_bat` — Cần lắp đặt / di dời máy | USER_REPORTED | `8e2e9c0f-9651-4e80-8ea2-b8719dd15058` | NEEDS_REVIEW |
| `symptom_sua_may_khong_len_nguon_may_rua_chen_may_rua_bat` — Máy không lên nguồn | USER_REPORTED | `9a399375-645a-4ff3-8839-acda5c8a3644` | NEEDS_REVIEW |
| `symptom_sua_may_khong_xa_nuoc` — Máy không xả nước | USER_REPORTED | `ac74ad84-1793-414d-a1de-292e63989d47` | NEEDS_REVIEW |

### Tủ điện / Bảng điện — `470acb27-41b1-4d36-9ee3-84b9bbc857de`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_tu_dien_dan_dung` — Cần lắp tủ điện dân dụng | USER_REPORTED | `0001de42-77b3-48b1-9d05-901ab61c8314` | NEEDS_REVIEW |
| `request_sap_xep_danh_nhan_cac_nhanh` — Cần sắp xếp / đánh nhãn các nhánh | USER_REPORTED | `098ffa5e-bc48-4236-a951-5c23eed8df33` | NEEDS_REVIEW |
| `request_thay_vo_tu_dien` — Cần thay vỏ tủ điện | USER_REPORTED | `2dd6c689-fe98-49c1-bd00-f73d8423d7f3` | NEEDS_REVIEW |
| `symptom_sua_tu_dien_mat_nguon` — Tủ điện mất nguồn | USER_REPORTED | `3c6e0cd1-d127-4b54-aadb-950ec771d40a` | NEEDS_REVIEW |
| `request_bao_tri_tu_dien` — Cần bảo trì tủ điện | USER_REPORTED | `3f8a3563-ea71-4611-bc0f-65ae335dea67` | NEEDS_REVIEW |
| `request_xu_ly_diem_tiep_xuc_phat_nong` — Cần xử lý điểm tiếp xúc phát nóng | USER_REPORTED | `490ac1eb-d246-48dd-82d9-859e31a4eee2` | NEEDS_REVIEW |
| `request_thay_day_dien_trong_tu` — Cần thay dây điện trong tủ | USER_REPORTED | `7985f365-8ce3-4a30-ae62-f3dc2251c7c6` | NEEDS_REVIEW |
| `request_nang_cap_tu_dien` — Cần nâng cấp tủ điện | USER_REPORTED | `a151a47f-0bc6-4802-985f-a6cd454641fd` | NEEDS_REVIEW |
| `symptom_sua_bang_dien_hong` — Bảng điện hỏng | USER_REPORTED | `a732319c-5c9c-4642-a2d2-6b31b1b7a57e` | NEEDS_REVIEW |
| `request_thay_terminal_thanh_dau_noi` — Cần thay terminal / thanh đấu nối | USER_REPORTED | `ddc3717d-8142-463f-b789-35d69213c20e` | NEEDS_REVIEW |
| `request_lap_bang_dien` — Cần lắp bảng điện | USER_REPORTED | `e61e99c4-ec47-48b7-8d5e-4a487af18990` | NEEDS_REVIEW |

### Bồn nước / Máy bơm / Phao nước — `47c02e77-5604-49ae-8ca7-a38f619acd0d`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_bom_khong_chay` — Bơm không chạy | USER_REPORTED | `03ab8e84-6bdf-42f9-ac3a-3029f4f39e3d` | NEEDS_REVIEW |
| `request_sua_thay_phao_dien` — Cần sửa / thay phao điện | USER_REPORTED | `4c06dc7b-593e-4065-baec-22e0ebdd2005` | NEEDS_REVIEW |
| `request_thay_phao_co` — Cần thay phao cơ | USER_REPORTED | `5212f502-3924-4f2a-bfe7-b16a03f03509` | NEEDS_REVIEW |
| `request_bao_tri_he_thong_cap_nuoc` — Cần bảo trì hệ thống cấp nước | USER_REPORTED | `5293dc6a-f3f6-4dba-a638-50df9529bc33` | NEEDS_REVIEW |
| `request_ve_sinh_bon_chua_nuoc` — Cần vệ sinh bồn chứa nước | USER_REPORTED | `56c08970-3fdc-4cd4-9fa0-e584361a805f` | NEEDS_REVIEW |
| `symptom_sua_bon_nuoc_ro_ri` — Bồn nước rò rỉ | USER_REPORTED | `7cea57a6-662a-429f-8b4d-346d793b128e` | NEEDS_REVIEW |
| `request_lap_dat_thay_may_bom` — Cần lắp đặt / thay máy bơm | USER_REPORTED | `88cecc91-aff6-40e3-bb89-80c15e87da35` | NEEDS_REVIEW |
| `request_lap_dat_di_doi_bon_nuoc` — Cần lắp đặt / di dời bồn nước | USER_REPORTED | `9166c47c-a209-4208-a762-707d5b4509b2` | NEEDS_REVIEW |
| `symptom_sua_bom_keu_to` — Bơm kêu to | USER_REPORTED | `bf0ffc7a-1ea8-482a-9e67-7b393c3db8eb` | NEEDS_REVIEW |
| `symptom_sua_bom_khong_len_nuoc` — Bơm không lên nước | USER_REPORTED | `bf214603-45cc-49b4-ab82-1e6e24431fe0` | NEEDS_REVIEW |
| `request_sua_bom_chay_lien_tuc` — Cần sửa bơm chạy liên tục | USER_REPORTED | `e973c25b-0936-47d4-b778-605c16bd5f73` | NEEDS_REVIEW |
| `request_sua_ro_le_ap_suat_bo_dieu_khien` — Cần sửa rơ le áp suất / bộ điều khiển | USER_REPORTED | `f27e61e6-c1d2-4fd7-969b-4aab457dd22a` | NEEDS_REVIEW |

### Hệ thống điện toàn nhà — `481e60aa-a20b-466e-8ae0-c581284e67ee`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_kiem_tra_sut_ap` — Cần kiểm tra sụt áp | USER_REPORTED | `1d5551e0-eb43-4eae-a64d-e724f3ec68a2` | NEEDS_REVIEW |
| `symptom_kiem_tra_mat_dien_toan_nha` — Kiểm tra mất điện toàn nhà | USER_REPORTED | `3833ed30-b243-406a-acad-a96af1aba746` | NEEDS_REVIEW |
| `symptom_kiem_tra_ro_dien` — Kiểm tra rò điện | USER_REPORTED | `523a6c10-b1df-4906-8ea4-f555cb571cbb` | NEEDS_REVIEW |
| `request_kiem_tra_duong_cap_nguon_chinh` — Cần kiểm tra đường cấp nguồn chính | USER_REPORTED | `533203a3-eeef-4eaf-a53d-d7b7c3905a37` | NEEDS_REVIEW |
| `request_nghiem_thu_an_toan_dien` — Cần nghiệm thu an toàn điện | USER_REPORTED | `748f9c96-d961-4d5c-8864-fbf5034b4af1` | NEEDS_REVIEW |
| `request_kiem_tra_dien_ap_bat_thuong` — Cần kiểm tra điện áp bất thường | USER_REPORTED | `7b89ca1b-3953-4de3-84fc-70f951df4c61` | NEEDS_REVIEW |
| `symptom_kiem_tra_dien_chap_chon` — Kiểm tra điện chập chờn | USER_REPORTED | `8a422a6d-baca-4289-badc-bb7704f3ac44` | NEEDS_REVIEW |
| `request_bao_tri_he_thong_dien` — Cần bảo trì hệ thống điện | USER_REPORTED | `909e15ff-528b-42ac-bc12-c917afb150df` | NEEDS_REVIEW |
| `request_cai_tao_dien_nha_cu` — Cần cải tạo điện nhà cũ | USER_REPORTED | `a28bf440-476f-4302-98f2-a9716fbbcb54` | NEEDS_REVIEW |
| `symptom_khoanh_vung_su_co_chap_dien` — Khoanh vùng sự cố chập điện | USER_REPORTED | `bb7765b6-8005-44fa-a82b-f5680c95fc07` | NEEDS_REVIEW |
| `request_kiem_tra_nhanh_dien` — Cần kiểm tra nhánh điện | USER_REPORTED | `c03a6bd5-3c2e-4efb-837b-05e32c514a15` | NEEDS_REVIEW |
| `request_lap_dat_dien_nha_moi` — Cần lắp đặt điện nhà mới | USER_REPORTED | `cbf97e48-963f-489c-af4e-13642d24c9ec` | NEEDS_REVIEW |
| `request_kiem_tra_qua_tai` — Cần kiểm tra quá tải | USER_REPORTED | `f802e2ea-f3b9-493c-9d7c-d1f5289e9c83` | NEEDS_REVIEW |

### Aptomat / CB / MCB — `484e7b6f-469e-4b22-acd8-bae2b7ea60a1`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_danh_gia_tai_de_chon_cb_dung_thong_so` — Cần đánh giá tải để chọn CB đúng thông số | USER_REPORTED | `207f32d8-5c6a-4ffd-817f-8ef79f0223eb` | NEEDS_REVIEW |
| `request_thay_cb_nhanh` — Cần thay CB nhánh | USER_REPORTED | `34c44e97-0197-42d4-b85a-2e8db7d25dbc` | NEEDS_REVIEW |
| `symptom_thay_aptomat_hong` — Thay aptomat hỏng | USER_REPORTED | `402a81a2-dbe2-43c6-943e-601c5b20ca8f` | NEEDS_REVIEW |
| `request_kiem_tra_cb_phat_nong` — Cần kiểm tra CB phát nóng | USER_REPORTED | `5270d6fb-9206-4a60-8cef-ac51cf51ec83` | NEEDS_REVIEW |
| `request_thay_cb_tong` — Cần thay CB tổng | USER_REPORTED | `5d7e5523-1762-4c3e-8354-cd5e69f50468` | NEEDS_REVIEW |
| `request_lap_aptomat_moi` — Cần lắp aptomat mới | USER_REPORTED | `66e3095d-4bd0-4251-b6c4-7bc631a7bbf3` | NEEDS_REVIEW |
| `request_kiem_tra_loi_qua_tai_ngan_mach` — Cần kiểm tra lỗi quá tải / ngắn mạch | USER_REPORTED | `6f655f8f-32a3-4c18-8ef7-d22b4a5a38b8` | NEEDS_REVIEW |
| `symptom_kiem_tra_mat_dien_do_cb` — Kiểm tra mất điện do CB | USER_REPORTED | `9a0da019-510c-45d5-a470-2a6cf89345c2` | NEEDS_REVIEW |
| `symptom_kiem_tra_cb_khong_dong_duoc` — Kiểm tra CB không đóng được | USER_REPORTED | `b7b43b45-9471-4593-9107-90fac27eea00` | NEEDS_REVIEW |
| `request_kiem_tra_cb_nhay_lien_tuc` — Cần kiểm tra CB nhảy liên tục | USER_REPORTED | `e02de01e-6e9a-4d10-8dc4-a0626e195cde` | NEEDS_REVIEW |

### Quạt trần / Quạt treo tường — `492a7d40-96f6-4b1a-8146-34956f8a95f8`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_thao_di_doi_quat_tran` — Cần tháo / di dời quạt trần | USER_REPORTED | `0e7a4d39-310f-479a-b12e-015f2dd99494` | NEEDS_REVIEW |
| `request_thay_tu_quat` — Cần thay tụ quạt | USER_REPORTED | `19c89bcc-8add-4925-ba80-70c7e1bad342` | NEEDS_REVIEW |
| `symptom_sua_quat_rung_keu` — Quạt rung / kêu | USER_REPORTED | `3a497c8b-c132-4194-8936-ab3df946d0d5` | NEEDS_REVIEW |
| `request_lap_quat_treo_tuong` — Cần lắp quạt treo tường | USER_REPORTED | `3e740414-6221-4ca3-95aa-c00035c32ace` | NEEDS_REVIEW |
| `symptom_thay_cong_tac_quat` — Thay công tắc quạt | USER_REPORTED | `615ae02c-c728-410f-bb0a-63eea379adee` | NEEDS_REVIEW |
| `request_bao_duong_quat` — Cần bảo dưỡng quạt | USER_REPORTED | `6cd63dc0-9b8e-45e7-9a23-cfdaa8062cb4` | NEEDS_REVIEW |
| `request_sua_bo_dieu_toc` — Cần sửa bộ điều tốc | USER_REPORTED | `86ccb7fd-d202-4d41-a26a-792720a69b7a` | NEEDS_REVIEW |
| `request_sua_dieu_khien_quat` — Cần sửa điều khiển quạt | USER_REPORTED | `9c73a69c-6643-47a9-92a3-cfad2ba93fb3` | NEEDS_REVIEW |
| `symptom_sua_quat_khong_quay` — Quạt không quay | USER_REPORTED | `a9a04fc1-d402-4fd9-a550-2c0267471c1a` | NEEDS_REVIEW |
| `request_lap_quat_tran` — Cần lắp quạt trần | USER_REPORTED | `d30648d0-a1a8-4775-8557-9b70a130db83` | NEEDS_REVIEW |
| `request_sua_quat_quay_cham` — Cần sửa quạt quay chậm | USER_REPORTED | `db11acf9-cd10-4e2f-acb0-2f8e76da17f2` | NEEDS_REVIEW |

### Lavabo / Chậu rửa / Bồn rửa — `4f2dd034-f575-49b6-a913-cea3a620b618`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_sua_thoat_nuoc_cham` — Cần sửa thoát nước chậm | USER_REPORTED | `37f63a53-a794-4125-a411-264924a97138` | NEEDS_REVIEW |
| `request_lap_dat_thay_chau_rua` — Cần lắp đặt / thay chậu rửa | USER_REPORTED | `3ef41baf-8915-43bd-b6f1-7ec87c22e1b9` | NEEDS_REVIEW |
| `symptom_sua_ro_nuoc_duoi_chau` — Rò nước dưới chậu | VISUAL_OBSERVABLE | `51a54874-9c2b-414d-abe9-ddd138837263` | NEEDS_REVIEW |
| `request_thay_ong_mem_cap_nuoc` — Cần thay ống mềm cấp nước | USER_REPORTED | `5498428a-8524-410e-a8af-d802b1290896` | NEEDS_REVIEW |
| `request_thay_xi_phong_bo_xa` — Cần thay xi phông / bộ xả | USER_REPORTED | `9c40ffaa-2cfb-4269-9bb6-c34d94a4596f` | NEEDS_REVIEW |
| `request_sua_voi_chau_rua` — Cần sửa vòi chậu rửa | USER_REPORTED | `b5b9f17f-8040-4249-b1ca-38a5d71f87a5` | NEEDS_REVIEW |
| `symptom_thong_tac_lavabo_chau_rua` — Thông tắc lavabo / chậu rửa | USER_REPORTED | `e3dfe74b-78b9-40f8-8ef3-502f999df5ed` | NEEDS_REVIEW |
| `request_tram_kin_mep_chau` — Cần trám kín mép chậu | USER_REPORTED | `e7a2ca7f-6b70-415b-b4f8-78f3b8c949cf` | NEEDS_REVIEW |
| `request_xu_ly_mui_hoi_duong_thoat` — Cần xử lý mùi hôi đường thoát | USER_REPORTED | `f584643a-0fa1-4342-8d42-ec3eb97e5077` | NEEDS_REVIEW |

### Vòi nước / Vòi sen — `520cae18-9d24-4109-850f-1752f26f05ee`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_dat_voi_moi` — Cần lắp đặt vòi mới | USER_REPORTED | `07b8b03f-73cd-4a91-bb88-3408b662d940` | NEEDS_REVIEW |
| `request_thay_loi_tron_gioang` — Cần thay lõi trộn / gioăng | USER_REPORTED | `135d6be0-63c2-49f0-b569-de78bdd2656e` | NEEDS_REVIEW |
| `request_thay_voi_lavabo` — Cần thay vòi lavabo | USER_REPORTED | `1a00a573-29c0-4b5d-a5ee-c378e854edcc` | NEEDS_REVIEW |
| `symptom_sua_voi_chay_yeu` — Vòi chảy yếu | USER_REPORTED | `2db74bea-ae10-4061-8108-9d5151a6af8b` | NEEDS_REVIEW |
| `symptom_sua_voi_ro_nuoc` — Vòi rò nước | VISUAL_OBSERVABLE | `3d3c5f11-34b7-4ef9-9963-d35ebd33e840` | NEEDS_REVIEW |
| `request_sua_voi_bi_ket_kho_khoa` — Cần sửa vòi bị kẹt / khó khóa | USER_REPORTED | `5511a10d-602a-4fcb-b834-fcde0209d2b2` | NEEDS_REVIEW |
| `request_sua_thay_van_khoa_nuoc` — Cần sửa / thay van khóa nước | USER_REPORTED | `9d16552c-9f6f-47a7-9089-c5da06aaefd6` | NEEDS_REVIEW |
| `symptom_kiem_tra_ro_nuoc_tai_chan_voi` — Kiểm tra rò nước tại chân vòi | VISUAL_OBSERVABLE | `a54ee8d6-f832-4ad7-b171-cfa2905e4b9d` | NEEDS_REVIEW |
| `request_thay_voi_sen_day_sen_bat_sen` — Cần thay vòi sen / dây sen / bát sen | USER_REPORTED | `d11cc0c3-c727-4ce4-bccc-9151f5e7fe1a` | NEEDS_REVIEW |
| `request_thay_voi_rua_chen` — Cần thay vòi rửa chén | USER_REPORTED | `d5e0e8a3-af63-440e-9526-d427b11bb2f3` | NEEDS_REVIEW |

### Tủ lạnh / Tủ lạnh side-by-side — `521d7ce8-9e72-492e-b0cd-4eb88508f58d`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_dat_di_doi_tu_lanh` — Cần lắp đặt / di dời tủ lạnh | USER_REPORTED | `0f850fda-9dd7-4a6b-8900-7290bb153e7a` | NEEDS_REVIEW |
| `request_sua_quat_tu_lanh` — Cần sửa quạt tủ lạnh | USER_REPORTED | `1cf9dc93-c6a8-4be1-aa39-fba94f522249` | NEEDS_REVIEW |
| `request_kiem_tra_he_thong_lam_lanh_ro_moi_chat` — Cần kiểm tra hệ thống làm lạnh / rò môi chất | REQUIRES_TECHNICIAN_CHECK | `298a3484-650f-4b33-803d-3a9da290f05f` | NEEDS_REVIEW |
| `request_sua_ban_le_tay_nam_cua` — Cần sửa bản lề / tay nắm cửa | USER_REPORTED | `3bb8c888-befe-485a-a8e6-85347e21154b` | NEEDS_REVIEW |
| `symptom_sua_tu_lanh_khong_len_nguon` — Tủ lạnh không lên nguồn | USER_REPORTED | `3c5e4b9c-cf09-40ee-96a8-c74f99b61c45` | NEEDS_REVIEW |
| `symptom_sua_tu_lanh_ro_nuoc` — Tủ lạnh rò nước | VISUAL_OBSERVABLE | `3f40bafd-04ab-467b-9827-74d1cd275fc5` | NEEDS_REVIEW |
| `request_sua_bang_dieu_khien_hoac_ma_loi` — Cần sửa bảng điều khiển hoặc mã lỗi | USER_REPORTED | `44b91ac9-098f-4b74-b9d7-6d88d9da20be` | NEEDS_REVIEW |
| `symptom_sua_ngan_da_khong_dong` — Ngăn đá không đông | USER_REPORTED | `51926d37-2b77-40a8-90b6-c6a50153cdb5` | NEEDS_REVIEW |
| `request_ve_sinh_va_bao_duong_tu_lanh` — Cần vệ sinh và bảo dưỡng tủ lạnh | USER_REPORTED | `57c61d72-76bd-4f3f-a5a9-4eeb1e4ee416` | NEEDS_REVIEW |
| `symptom_sua_ngan_mat_dong_tuyet` — Ngăn mát đóng tuyết | VISUAL_OBSERVABLE | `64cbc5b0-7aa0-4a12-a710-67f453fb7331` | NEEDS_REVIEW |
| `request_sua_cam_bien_nhiet_do` — Cần sửa cảm biến nhiệt độ | REQUIRES_TECHNICIAN_CHECK | `6b06cd28-62ab-43c1-a7ca-76a1a8df0c07` | NEEDS_REVIEW |
| `request_thay_gioang_cua` — Cần thay gioăng cửa | USER_REPORTED | `97d3ba3e-1b95-4d8d-b908-a44f163c7078` | NEEDS_REVIEW |
| `symptom_sua_tu_lanh_khong_lanh` — Tủ lạnh không lạnh | USER_REPORTED | `a1ef621b-e16e-4083-9d66-4a04879ff133` | NEEDS_REVIEW |
| `symptom_sua_tu_lanh_keu_to` — Tủ lạnh kêu to | USER_REPORTED | `a919b199-b77c-4c4f-a463-36e8d39216f0` | NEEDS_REVIEW |
| `request_sua_den_tu_lanh` — Cần sửa đèn tủ lạnh | USER_REPORTED | `bdb1c984-6618-4cac-bf66-58a6539f2302` | NEEDS_REVIEW |
| `request_sua_bo_xa_da` — Cần sửa bộ xả đá | REQUIRES_TECHNICIAN_CHECK | `e0106684-e385-4b61-bdc4-5768e82a7949` | NEEDS_REVIEW |

### Kiểm tra / Khảo sát sự cố điện — `53a59ef2-9ffe-4206-940f-bc364951b917`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_kiem_tra_an_toan_truoc_su_dung` — Cần kiểm tra an toàn trước sử dụng | USER_REPORTED | `2667977e-e8e1-446c-bc91-a58ddefa3ed5` | NEEDS_REVIEW |
| `request_lap_phuong_an_sua_chua` — Cần lập phương án sửa chữa | USER_REPORTED | `3c5bb2bf-37d1-4c7a-ad43-593e37a22469` | NEEDS_REVIEW |
| `request_khao_sat_sua_dien_tai_nha` — Cần khảo sát sửa điện tại nhà | USER_REPORTED | `7bb1553d-2f31-4303-8316-74b69c906379` | NEEDS_REVIEW |
| `request_kiem_tra_diem_phat_nong` — Cần kiểm tra điểm phát nóng | USER_REPORTED | `7ddbc045-1506-4e15-9680-5c592149a4dd` | NEEDS_REVIEW |
| `request_danh_gia_phu_tai` — Cần đánh giá phụ tải | USER_REPORTED | `80d469f3-57be-4372-9fa0-c27ac48de326` | NEEDS_REVIEW |
| `request_kiem_tra_su_co_chua_xac_dinh` — Cần kiểm tra sự cố chưa xác định | USER_REPORTED | `9be5db29-7326-4fe9-b1da-f4d3278c8a5a` | NEEDS_REVIEW |
| `request_nghiem_thu_sau_sua_chua` — Cần nghiệm thu sau sửa chữa | USER_REPORTED | `ca2caed2-6dbb-4086-8f8c-3c2c8ecb9d91` | NEEDS_REVIEW |
| `request_khao_sat_nang_cap_dien` — Cần khảo sát nâng cấp điện | USER_REPORTED | `cd8039d7-cf74-4f8e-bbed-96deb6ea44b6` | NEEDS_REVIEW |
| `request_do_dien_ap_dong_tai` — Cần đo điện áp / dòng tải | USER_REPORTED | `d23ed354-e360-474d-970a-93b70d777703` | NEEDS_REVIEW |
| `request_kiem_tra_tinh_trang_cach_dien` — Cần kiểm tra tình trạng cách điện | USER_REPORTED | `d75190b9-c79f-4ac6-9c96-d29d7a2f808d` | NEEDS_REVIEW |

### Cảm biến / Thiết bị tự động — `56725529-2a0c-4bdf-a437-4f18d98b5939`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_sua_cam_bien_anh_sang` — Cần sửa cảm biến ánh sáng | REQUIRES_TECHNICIAN_CHECK | `60c4c460-472e-4274-a9d1-5bd296548b9f` | NEEDS_REVIEW |
| `request_lap_cam_bien_hien_dien` — Cần lắp cảm biến hiện diện | REQUIRES_TECHNICIAN_CHECK | `6504a2d9-e53e-4896-aeb9-fb157eda3425` | NEEDS_REVIEW |
| `request_sua_bo_dieu_khien_tu_dong` — Cần sửa bộ điều khiển tự động | USER_REPORTED | `6f77a03c-504a-4395-a400-d74574019324` | NEEDS_REVIEW |
| `request_lap_cam_bien_chuyen_dong` — Cần lắp cảm biến chuyển động | REQUIRES_TECHNICIAN_CHECK | `7c96aa2f-c090-4f28-b7f8-58416689bf53` | NEEDS_REVIEW |
| `request_lap_bo_dieu_khien_den_tu_dong` — Cần lắp bộ điều khiển đèn tự động | USER_REPORTED | `7f5793cb-2420-49c7-8fc8-189df675caa2` | NEEDS_REVIEW |
| `symptom_sua_cong_tac_hen_gio` — Công tắc hẹn giờ | USER_REPORTED | `9849354e-c048-4a87-9535-c4adad0c2c3b` | NEEDS_REVIEW |
| `symptom_lap_cong_tac_hen_gio` — Lắp công tắc hẹn giờ | USER_REPORTED | `9b00c65b-352b-41db-803c-4198cf572c3f` | NEEDS_REVIEW |
| `request_lap_cam_bien_anh_sang` — Cần lắp cảm biến ánh sáng | REQUIRES_TECHNICIAN_CHECK | `a05c73d2-ebf7-4dab-ade7-b27b37bfd800` | NEEDS_REVIEW |
| `request_cau_hinh_dieu_khien_thong_minh` — Cần cấu hình điều khiển thông minh | USER_REPORTED | `d7ec427a-26bc-4b1d-b2ff-c7a33264afeb` | NEEDS_REVIEW |
| `request_sua_cam_bien_chuyen_dong` — Cần sửa cảm biến chuyển động | REQUIRES_TECHNICIAN_CHECK | `e25233f4-d763-4e27-9d53-535c3dd4ae0c` | NEEDS_REVIEW |

### Hộp nối điện / Hộp kỹ thuật — `56d03ad1-b3a0-469a-bf79-ec9e83d23e08`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_xu_ly_nuoc_xam_nhap_hop_dien` — Cần xử lý nước xâm nhập hộp điện | USER_REPORTED | `01536e6d-8fc7-4090-bfbf-1761af6f983f` | NEEDS_REVIEW |
| `request_thay_hop_noi` — Cần thay hộp nối | USER_REPORTED | `1bb2ec04-09e2-4a21-b36d-14c3d64bf501` | NEEDS_REVIEW |
| `symptom_sua_hop_noi_bi_chap` — Hộp nối bị chập | USER_REPORTED | `448acc9e-87ae-4bab-b1f2-9cc30c59c64b` | NEEDS_REVIEW |
| `request_thay_dau_noi` — Cần thay đầu nối | USER_REPORTED | `4edfd6f5-f7c2-44bf-87a5-3bd4a71761fc` | NEEDS_REVIEW |
| `request_thay_nap_hop_noi` — Cần thay nắp hộp nối | USER_REPORTED | `74cf8ce1-0260-45a8-bca6-f12f5aca81db` | NEEDS_REVIEW |
| `request_sap_xep_day_trong_hop_noi` — Cần sắp xếp dây trong hộp nối | USER_REPORTED | `7fa48c20-0e16-4504-a949-64cad8b65263` | NEEDS_REVIEW |
| `request_kiem_tra_moi_noi_phat_nong` — Cần kiểm tra mối nối phát nóng | USER_REPORTED | `88f4f66b-24b3-4c20-b9a2-ffad8434a6f2` | NEEDS_REVIEW |
| `request_sua_moi_noi_long_hop_noi_dien_hop_ky_thuat` — Cần sửa mối nối lỏng | USER_REPORTED | `cd4b5119-6984-4cd0-85c1-1b22b5eab84f` | NEEDS_REVIEW |
| `request_lap_hop_noi_moi` — Cần lắp hộp nối mới | USER_REPORTED | `e8731d90-3919-4091-8815-45116393c75f` | NEEDS_REVIEW |
| `request_lap_hop_ky_thuat` — Cần lắp hộp kỹ thuật | USER_REPORTED | `ec6bf364-e610-4867-bbc3-376329a25f6a` | NEEDS_REVIEW |

### Tủ đông / Tủ mát — `5e8f3e42-a1e4-47e3-8e76-8c774d04d5ea`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_sua_cam_bien_bo_dieu_nhiet` — Cần sửa cảm biến / bộ điều nhiệt | REQUIRES_TECHNICIAN_CHECK | `07aa4ef6-426c-496d-a6ce-e36a85470b96` | NEEDS_REVIEW |
| `symptom_sua_tu_lanh_yeu` — Tủ lạnh yếu | USER_REPORTED | `13d67ca1-a9d8-434d-b1b9-f6772416b39c` | NEEDS_REVIEW |
| `request_sua_quat_va_he_thong_xa_da` — Cần sửa quạt và hệ thống xả đá | REQUIRES_TECHNICIAN_CHECK | `1ae10db2-b114-4593-8d3d-8b28132b8bd9` | NEEDS_REVIEW |
| `symptom_sua_tu_dong_tuyet_bat_thuong` — Tủ đóng tuyết bất thường | VISUAL_OBSERVABLE | `1b648eab-4c01-42da-9362-c5100ae0ce61` | NEEDS_REVIEW |
| `request_sua_tu_chay_lien_tuc` — Cần sửa tủ chạy liên tục | USER_REPORTED | `1e0a2d1d-537e-403d-b22b-96b42ed89cdb` | NEEDS_REVIEW |
| `request_lap_dat_di_doi_tu` — Cần lắp đặt / di dời tủ | USER_REPORTED | `4568d4fb-429a-407c-9830-9a811fcd0606` | NEEDS_REVIEW |
| `request_kiem_tra_he_thong_lanh` — Cần kiểm tra hệ thống lạnh | USER_REPORTED | `6e99f0fb-22cd-4d01-8be6-f79b5ad1a662` | NEEDS_REVIEW |
| `symptom_sua_tu_keu_to` — Tủ kêu to | USER_REPORTED | `8f0f7752-4ad8-41f0-a238-60175d698e82` | NEEDS_REVIEW |
| `request_ve_sinh_va_bao_duong_tu` — Cần vệ sinh và bảo dưỡng tủ | USER_REPORTED | `97881aea-9b28-4e47-ace7-84d699ff7f3f` | NEEDS_REVIEW |
| `symptom_sua_tu_khong_lanh` — Tủ không lạnh | USER_REPORTED | `bc8d23c4-d763-49d8-aa06-94d95f10be40` | NEEDS_REVIEW |
| `request_sua_cua_gioang_tu` — Cần sửa cửa / gioăng tủ | USER_REPORTED | `d3088dd4-64ed-488b-b127-3a4e67e31756` | NEEDS_REVIEW |
| `symptom_sua_tu_ro_nuoc` — Tủ rò nước | VISUAL_OBSERVABLE | `eb593767-9275-46aa-9fec-f078d75146a1` | NEEDS_REVIEW |

### Nhà vệ sinh / Phòng tắm — `5ef7b978-d4dc-4287-b119-19926b473bac`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_khu_mui_phong_tam` — Cần khử mùi phòng tắm | USER_REPORTED | `5c0e416c-5ad4-41e6-a03a-a69fdce5fb0b` | NEEDS_REVIEW |
| `request_ve_sinh_gach_ron_gach` — Cần vệ sinh gạch / ron gạch | USER_REPORTED | `7da01b28-46d7-42a3-8512-e6d5551284df` | NEEDS_REVIEW |
| `request_tong_ve_sinh_phong_tam` — Cần tổng vệ sinh phòng tắm | USER_REPORTED | `bd189569-d868-4668-bbc8-5c79e43d9acc` | NEEDS_REVIEW |
| `request_co_rua_bon_cau` — Cần cọ rửa bồn cầu | USER_REPORTED | `cc337195-5343-404e-96b9-d12789b0e44a` | NEEDS_REVIEW |
| `request_tay_can_bam_tren_be_mat_phu_hop` — Cần tẩy cặn bám trên bề mặt phù hợp | USER_REPORTED | `d3ba360a-9565-4d5d-8d24-0f51690f1cf3` | NEEDS_REVIEW |
| `request_ve_sinh_lavabo_va_voi_nuoc` — Cần vệ sinh lavabo và vòi nước | USER_REPORTED | `f89a21ac-02ea-4d43-97b7-3182830a28b7` | NEEDS_REVIEW |
| `request_lau_san_va_vach_tam` — Cần lau sàn và vách tắm | USER_REPORTED | `f91a6e66-4859-4f24-a572-6551e430e25c` | NEEDS_REVIEW |
| `request_lam_sach_kinh_phong_tam` — Cần làm sạch kính phòng tắm | USER_REPORTED | `fed55f47-c5e3-4afc-a36b-05911f4a8a6c` | NEEDS_REVIEW |

### Nồi cơm điện / Nồi áp suất điện — `65f531cd-165d-4feb-b69f-922398fde6db`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_noi_khong_len_nguon` — Nồi không lên nguồn | USER_REPORTED | `22905203-5b12-4c5f-9587-46169862a8a1` | NEEDS_REVIEW |
| `request_ve_sinh_va_bao_duong_noi` — Cần vệ sinh và bảo dưỡng nồi | USER_REPORTED | `27f3a9d1-0ee5-47aa-b22f-1fd5fbe8e4bc` | NEEDS_REVIEW |
| `symptom_sua_noi_bao_loi` — Nồi báo lỗi | USER_REPORTED | `45b0a88b-e130-471f-adaa-882db836028a` | NEEDS_REVIEW |
| `request_sua_bo_cam_bien_bo_dieu_nhiet` — Cần sửa bộ cảm biến / bộ điều nhiệt | REQUIRES_TECHNICIAN_CHECK | `a34504e0-6ba6-4310-9a37-c7cde41ae50e` | NEEDS_REVIEW |
| `request_thay_gioang_van_noi_ap_suat` — Cần thay gioăng / van nồi áp suất | USER_REPORTED | `b34f376a-e675-4b72-ab18-17c0cb7f952b` | NEEDS_REVIEW |
| `request_sua_nut_bam_bang_dieu_khien` — Cần sửa nút bấm / bảng điều khiển | USER_REPORTED | `be33d08f-2841-46a0-bb13-49437b49b2ea` | NEEDS_REVIEW |
| `request_thay_day_nguon` — Cần thay dây nguồn | USER_REPORTED | `d3ad892a-e482-47e3-a74f-66c063aeb926` | NEEDS_REVIEW |
| `request_sua_noi_nau_com_song_khe` — Cần sửa nồi nấu cơm sống / khê | USER_REPORTED | `f1b3f2bb-13f9-4d3c-b827-68e77511d2bf` | NEEDS_REVIEW |
| `symptom_sua_noi_khong_nong` — Nồi không nóng | USER_REPORTED | `fd737f92-d459-47e5-b680-19317c06e0d2` | NEEDS_REVIEW |

### Đèn trang trí / Đèn chùm — `667cd41a-d6ab-42fa-808c-08898ba947dc`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_thay_bong_dui_den_chum` — Cần thay bóng / đui đèn chùm | USER_REPORTED | `01fa941f-a076-447d-85b3-8f3c319ddf6f` | NEEDS_REVIEW |
| `request_lap_dat_den_chum` — Cần lắp đặt đèn chùm | USER_REPORTED | `26888c6e-c6b5-4178-9c2b-3b3f56e09d6b` | NEEDS_REVIEW |
| `request_lap_den_tha_tran` — Cần lắp đèn thả trần | USER_REPORTED | `36d0c403-3760-4104-a6b9-2dafcc4b58d7` | NEEDS_REVIEW |
| `request_thao_di_doi_den_chum` — Cần tháo / di dời đèn chùm | USER_REPORTED | `6d8ed0e3-9794-4f96-93bb-c5b10bf67844` | NEEDS_REVIEW |
| `request_sua_bo_dieu_khien_den_rgb` — Cần sửa bộ điều khiển đèn RGB | USER_REPORTED | `7020dbae-713b-4c74-89c0-c9a06063997e` | NEEDS_REVIEW |
| `symptom_sua_den_chum_khong_sang` — Đèn chùm không sáng | USER_REPORTED | `79383797-0aa4-4c70-969e-e0d53598026a` | NEEDS_REVIEW |
| `request_ve_sinh_bao_duong_den_trang_tri` — Cần vệ sinh / bảo dưỡng đèn trang trí | USER_REPORTED | `9518eb48-f975-4e34-8283-5d3a6ae5daf1` | NEEDS_REVIEW |
| `request_sua_den_led_day` — Cần sửa đèn LED dây | USER_REPORTED | `98890515-bf19-49c0-8133-128b9fa23655` | NEEDS_REVIEW |
| `request_lap_den_led_day` — Cần lắp đèn LED dây | USER_REPORTED | `c52d697e-3463-493b-84f5-79caa8066590` | NEEDS_REVIEW |
| `request_lap_den_hat_tran` — Cần lắp đèn hắt trần | USER_REPORTED | `d3214c67-1a39-4392-bec6-3eacdf599a21` | NEEDS_REVIEW |
| `request_thay_driver_den_trang_tri` — Cần thay driver đèn trang trí | USER_REPORTED | `dc2e46c8-f588-4fab-8f30-b4a31664971e` | NEEDS_REVIEW |

### Điện mặt trời / Inverter — `72afafec-8d91-4ed9-b153-238d314ddfdf`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_kiem_tra_tiep_dia` — Cần kiểm tra tiếp địa | USER_REPORTED | `228e8c74-dd60-4981-bf45-0bfcdfb3a881` | NEEDS_REVIEW |
| `request_bao_duong_phan_dien` — Cần bảo dưỡng phần điện | USER_REPORTED | `235c2f5a-d7de-4fc5-997f-4ac5841f2e57` | NEEDS_REVIEW |
| `symptom_kiem_tra_inverter_khong_phat_dien` — Kiểm tra inverter không phát điện | USER_REPORTED | `30c0e314-1276-4f3c-a856-a35ad4a77d55` | NEEDS_REVIEW |
| `symptom_kiem_tra_giam_sat_mat_ket_noi` — Kiểm tra giám sát mất kết nối | USER_REPORTED | `6ffffab4-0886-470c-b731-ff8ed8517ab0` | NEEDS_REVIEW |
| `symptom_kiem_tra_inverter_bao_loi` — Kiểm tra inverter báo lỗi | USER_REPORTED | `a862b5bc-8de3-406c-874e-f294f0f6579e` | NEEDS_REVIEW |
| `request_kiem_tra_bao_ve_phia_dc` — Cần kiểm tra bảo vệ phía DC | USER_REPORTED | `b839573e-cab7-4485-b0be-b6f155c669b4` | NEEDS_REVIEW |
| `request_kiem_tra_tu_dien_mat_troi` — Cần kiểm tra tủ điện mặt trời | USER_REPORTED | `bf19d10d-fc52-4b26-8116-20559b70b0e0` | NEEDS_REVIEW |
| `request_kiem_tra_day_dau_noi` — Cần kiểm tra dây / đầu nối | USER_REPORTED | `e04c5c78-5579-4de8-b4f0-4f47f9c65a92` | NEEDS_REVIEW |
| `request_kiem_tra_dong_cat_phia_ac` — Cần kiểm tra đóng cắt phía AC | USER_REPORTED | `e1df905e-f0c4-4853-828d-92fbf473bfc2` | NEEDS_REVIEW |

### Bồn cầu / Két nước — `78e95d0e-4ea5-43d1-b0fe-9b3d9be8b3c3`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_xu_ly_mui_hoi_quanh_bon_cau` — Cần xử lý mùi hôi quanh bồn cầu | USER_REPORTED | `05830f44-0177-4720-bfc8-1791c41f48c5` | NEEDS_REVIEW |
| `symptom_sua_bon_cau_xa_yeu` — Bồn cầu xả yếu | USER_REPORTED | `08fd29c6-7dbb-4084-b3fd-9a8c68392605` | NEEDS_REVIEW |
| `symptom_sua_bon_cau_ro_nuoc` — Bồn cầu rò nước | VISUAL_OBSERVABLE | `190fbbb6-fa64-46e1-a030-4339c18a791c` | NEEDS_REVIEW |
| `symptom_xu_ly_ro_nuoc_tai_chan_bon_cau` — Rò nước tại chân bồn cầu | VISUAL_OBSERVABLE | `1feda8d1-645f-467a-8399-9238834bfccf` | NEEDS_REVIEW |
| `request_thay_bo_xa_nut_nhan` — Cần thay bộ xả / nút nhấn | USER_REPORTED | `30e7e7a6-09da-4cda-afb7-911d2c2f8ca7` | NEEDS_REVIEW |
| `request_lap_dat_thay_bon_cau` — Cần lắp đặt / thay bồn cầu | USER_REPORTED | `473b567d-9a48-4f5d-a767-2ee46ce30d5b` | NEEDS_REVIEW |
| `symptom_sua_bon_cau_khong_xa` — Bồn cầu không xả | USER_REPORTED | `788f48ee-cafc-418a-a195-9503be0ba03b` | NEEDS_REVIEW |
| `request_thay_nap_be_ngoi` — Cần thay nắp / bệ ngồi | USER_REPORTED | `92afd929-508c-4f95-ad77-5c4da3ebc86b` | NEEDS_REVIEW |
| `request_thay_phao_van_cap` — Cần thay phao / van cấp | USER_REPORTED | `d1039f21-88c9-4cb1-9787-9a8e24a556da` | NEEDS_REVIEW |
| `symptom_thong_tac_bon_cau` — Thông tắc bồn cầu | USER_REPORTED | `ffc8c9d2-30f6-4201-9536-a86a685eae76` | NEEDS_REVIEW |

### Bếp từ / Bếp hồng ngoại — `79d5736c-c8e1-4514-a9ce-e01899beffa9`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_sua_quat_tan_nhiet` — Cần sửa quạt tản nhiệt | USER_REPORTED | `0c7f12c9-b08e-4595-ac1f-3e814b7a9519` | NEEDS_REVIEW |
| `symptom_sua_bep_khong_nong_nong_yeu` — Bếp không nóng / nóng yếu | USER_REPORTED | `56f6d17d-bfae-4ab1-8696-27a3b2782d3e` | NEEDS_REVIEW |
| `symptom_thay_mat_kinh_bep_nut_vo` — Thay mặt kính bếp nứt vỡ | VISUAL_OBSERVABLE | `62960ee6-e1e9-40b8-b783-616797232a3d` | NEEDS_REVIEW |
| `request_bao_duong_va_ve_sinh_bep` — Cần bảo dưỡng và vệ sinh bếp | USER_REPORTED | `74b5cabb-802c-411b-834e-ea7a8405e6b6` | NEEDS_REVIEW |
| `request_sua_bep_bao_ma_loi` — Cần sửa bếp báo mã lỗi | USER_REPORTED | `927fb3b6-1a05-45c4-a9df-6f5d80663ef4` | NEEDS_REVIEW |
| `symptom_sua_bep_khong_nhan_noi` — Bếp không nhận nồi | USER_REPORTED | `c282b2af-277f-4cb9-93bb-bb4f92c388e5` | NEEDS_REVIEW |
| `request_sua_bang_dieu_khien_cam_ung` — Cần sửa bảng điều khiển cảm ứng | USER_REPORTED | `e1eca76e-3a7e-4adb-93ec-e93051a93737` | NEEDS_REVIEW |
| `request_lap_dat_bep_am` — Cần lắp đặt bếp âm | USER_REPORTED | `ebd934de-567f-4afe-91c8-74ec08ad10be` | NEEDS_REVIEW |
| `symptom_sua_bep_khong_len_nguon` — Bếp không lên nguồn | USER_REPORTED | `f24f02c8-4aee-40d6-a423-dbc802e1847c` | NEEDS_REVIEW |
| `request_sua_mach_cong_suat` — Cần sửa mạch công suất | USER_REPORTED | `f3cc7b75-da0d-48a0-a3a6-9fce8eba9b65` | NEEDS_REVIEW |

### Máy xay / Máy ép / Máy đánh trứng — `812864e5-2682-4d13-bbd4-5c22aba656cd`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_cong_tac_nut_bam` — Công tắc / nút bấm | USER_REPORTED | `54f6cba4-fbdd-4c65-b5f7-91b32362536f` | NEEDS_REVIEW |
| `request_thay_bo_dao_khop_truyen_dong` — Cần thay bộ dao / khớp truyền động | USER_REPORTED | `6112ef98-333f-4a6d-937f-e7056e922ed0` | NEEDS_REVIEW |
| `symptom_sua_thiet_bi_quay_yeu` — Thiết bị quay yếu | USER_REPORTED | `794ad2e7-1c4e-4fb2-9572-c34f1e69a7f1` | NEEDS_REVIEW |
| `symptom_sua_thiet_bi_khong_quay` — Thiết bị không quay | USER_REPORTED | `86a75e8f-100e-45b0-b3ad-c0fadafda60a` | NEEDS_REVIEW |
| `symptom_sua_may_ro_nuoc_tu_coi` — Máy rò nước từ cối | VISUAL_OBSERVABLE | `a070412e-1c25-4b60-9f5d-2457b4a52224` | NEEDS_REVIEW |
| `symptom_sua_thiet_bi_khong_len_nguon_may_xay_may_ep_may_danh_trung` — Thiết bị không lên nguồn | USER_REPORTED | `c21817b2-56c0-48cd-9569-92d90abd3dfb` | NEEDS_REVIEW |
| `request_sua_dong_co` — Cần sửa động cơ | REQUIRES_TECHNICIAN_CHECK | `c6abaa9c-1921-4b3e-858f-3e734bb9db1b` | NEEDS_REVIEW |
| `request_ve_sinh_va_bao_duong_may_xay_may_ep_may_danh_trung` — Cần vệ sinh và bảo dưỡng | USER_REPORTED | `d6126d81-94a5-4cd5-8e61-bff82b69cb91` | NEEDS_REVIEW |

### Máy lọc nước RO / Nano — `82430f58-a332-4d4f-aa99-5c27f888a0e7`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_may_ro_nuoc` — Máy rò nước | VISUAL_OBSERVABLE | `04146c0a-8f3b-4d16-9c16-c261fad9d577` | NEEDS_REVIEW |
| `request_kiem_tra_chat_luong_nuoc_dau_ra` — Cần kiểm tra chất lượng nước đầu ra | USER_REPORTED | `0435deb7-25dc-4992-af0d-b73f0ce42816` | NEEDS_REVIEW |
| `request_sua_van_dien_tu` — Cần sửa van điện từ | REQUIRES_TECHNICIAN_CHECK | `081c04d0-7031-4e10-a18b-bc96c6434175` | NEEDS_REVIEW |
| `symptom_sua_may_khong_ngat` — Máy không ngắt | USER_REPORTED | `1ae2e300-8800-48d3-86a8-397aa69f6f64` | NEEDS_REVIEW |
| `request_ve_sinh_khu_khuan_he_thong` — Cần vệ sinh / khử khuẩn hệ thống | USER_REPORTED | `24239933-0f36-4f59-8b58-e9eb83c6bd75` | NEEDS_REVIEW |
| `symptom_sua_may_khong_ra_nuoc` — Máy không ra nước | USER_REPORTED | `49da4529-0ee8-41ae-b7f6-23690315222d` | NEEDS_REVIEW |
| `request_sua_bom_tang_ap` — Cần sửa bơm tăng áp | USER_REPORTED | `9dff741b-a0c4-4f60-ab05-6272933f65a9` | NEEDS_REVIEW |
| `request_lap_dat_di_doi_may_loc_nuoc` — Cần lắp đặt / di dời máy lọc nước | USER_REPORTED | `a85a3f67-41e2-481c-9ea1-ec8433cca60e` | NEEDS_REVIEW |
| `request_thay_loi_loc_dinh_ky` — Cần thay lõi lọc định kỳ | USER_REPORTED | `b1923127-b4bc-45b2-a975-2673eb4760be` | NEEDS_REVIEW |
| `symptom_sua_may_ra_nuoc_yeu` — Máy ra nước yếu | USER_REPORTED | `e18f52cf-0a5f-42ef-9cac-852543cadd9a` | NEEDS_REVIEW |

### Bếp gas / Bếp gas âm — `863b2a1d-05f2-4792-beaa-4073e6197141`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_sua_bep_danh_lua_lien_tuc` — Cần sửa bếp đánh lửa liên tục | USER_REPORTED | `66a0c614-840e-4c00-a5af-b9c73da23672` | NEEDS_REVIEW |
| `request_thay_day_van_dieu_ap_phu_hop` — Cần thay dây / van điều áp phù hợp | USER_REPORTED | `75c79e7e-812d-43d5-b605-4792a304f83f` | NEEDS_REVIEW |
| `request_lap_dat_thay_bep_gas` — Cần lắp đặt / thay bếp gas | REQUIRES_TECHNICIAN_CHECK | `87f6112d-ba24-45c8-9e2f-97f2729129ff` | NEEDS_REVIEW |
| `symptom_sua_bep_khong_danh_lua` — Bếp không đánh lửa | USER_REPORTED | `b7b604cd-cf86-4ae6-94d0-5af9c1d42c1d` | NEEDS_REVIEW |
| `request_kiem_tra_va_xu_ly_ro_ri_gas_boi_ky_thuat_vien_du_dieu_kien` — Cần kiểm tra và xử lý rò rỉ gas bởi kỹ thuật viên đủ điều kiện | REQUIRES_TECHNICIAN_CHECK | `b90930e9-f7c5-4d9e-ab79-13ab180c67ec` | NEEDS_REVIEW |
| `symptom_sua_bep_lua_yeu_hoac_khong_deu` — Bếp lửa yếu hoặc không đều | USER_REPORTED | `ea36c98e-1a76-48db-9c5a-840437dc30d8` | NEEDS_REVIEW |
| `request_bao_duong_bep_gas` — Cần bảo dưỡng bếp gas | REQUIRES_TECHNICIAN_CHECK | `f33d1900-297f-4a58-9d0b-6d6b2c4087de` | NEEDS_REVIEW |
| `request_ve_sinh_dau_dot_kieng_bep` — Cần vệ sinh đầu đốt / kiềng bếp | USER_REPORTED | `f7b57752-3a6a-4e30-838e-fa67984fff45` | NEEDS_REVIEW |
| `request_thay_num_van` — Cần thay núm vặn | USER_REPORTED | `faa4ec87-3f9a-4d1e-8806-8ef588efd816` | NEEDS_REVIEW |

### Bình nóng lạnh điện — `8c5b11b7-adfe-4c5d-a3b6-fd7afbf53636`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_dat_thao_do_binh` — Cần lắp đặt / tháo dỡ bình | USER_REPORTED | `05e6a200-1cb8-4233-8024-907f2d5cd10c` | NEEDS_REVIEW |
| `symptom_sua_binh_ro_nuoc` — Bình rò nước | VISUAL_OBSERVABLE | `252cc823-cbc1-41d3-ba90-b8d29a0437c8` | NEEDS_REVIEW |
| `symptom_sua_binh_nong_yeu` — Bình nóng yếu | USER_REPORTED | `27fb76ed-8102-41d7-adb2-49e85440a24b` | NEEDS_REVIEW |
| `request_ve_sinh_khu_can` — Cần vệ sinh khử cặn | USER_REPORTED | `342677f8-22f5-4c8f-80fe-3215112842ea` | NEEDS_REVIEW |
| `request_thay_thanh_dot_thanh_magie_theo_loai_binh` — Cần thay thanh đốt / thanh magie theo loại bình | USER_REPORTED | `5f7b159e-a9ab-47ce-943f-76325744f424` | NEEDS_REVIEW |
| `symptom_sua_binh_khong_nong` — Bình không nóng | USER_REPORTED | `9e75b9d1-6956-4641-82f8-6f95246ff39d` | NEEDS_REVIEW |
| `request_kiem_tra_an_toan_dien_va_tiep_dia` — Cần kiểm tra an toàn điện và tiếp địa | USER_REPORTED | `a3e271f7-9c70-4575-acd2-020db254137f` | NEEDS_REVIEW |
| `request_sua_bo_dieu_nhiet` — Cần sửa bộ điều nhiệt | USER_REPORTED | `a449dbb5-556d-4b74-ae4c-b6e4f06d4f7d` | NEEDS_REVIEW |
| `symptom_kiem_tra_binh_nhay_thiet_bi_chong_ro` — Kiểm tra bình nhảy thiết bị chống rò | USER_REPORTED | `cea4f870-b48c-4630-95cf-70e05e956f3c` | NEEDS_REVIEW |

### Máy làm mát / Quạt điều hòa — `8e1a07e4-134d-4214-8841-ad2969a584fa`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_quat_khong_quay_may_lam_mat_quat_dieu_hoa` — Quạt không quay | USER_REPORTED | `1baccd41-a2e2-4def-b01e-27c274e4d21b` | NEEDS_REVIEW |
| `symptom_sua_may_khong_len_nguon_may_lam_mat_quat_dieu_hoa` — Máy không lên nguồn | USER_REPORTED | `241f5020-c18c-4ef3-aafa-70b4503c7d47` | NEEDS_REVIEW |
| `symptom_sua_may_khong_lam_mat` — Máy không làm mát | USER_REPORTED | `623a293e-5131-4b02-b9f5-737db5e02052` | NEEDS_REVIEW |
| `request_bao_duong_may_lam_mat` — Cần bảo dưỡng máy làm mát | USER_REPORTED | `9be149d7-57bf-4e68-b72f-032b0b64275c` | NEEDS_REVIEW |
| `symptom_sua_bom_nuoc_khong_hoat_dong` — Bơm nước không hoạt động | USER_REPORTED | `a8b97798-dbcb-4472-ba53-050e06a105da` | NEEDS_REVIEW |
| `symptom_sua_may_ro_nuoc_may_lam_mat_quat_dieu_hoa` — Máy rò nước | VISUAL_OBSERVABLE | `c24c2cf8-0c3f-41a4-b2d9-5cee08b8e78a` | NEEDS_REVIEW |
| `request_ve_sinh_binh_chua_tam_lam_mat` — Cần vệ sinh bình chứa / tấm làm mát | USER_REPORTED | `df16d7f5-daf5-4e45-b2f3-7897451b2809` | NEEDS_REVIEW |
| `request_sua_bang_dieu_khien_may_lam_mat_quat_dieu_hoa` — Cần sửa bảng điều khiển | USER_REPORTED | `e93e8b8f-aec2-40a8-9692-39bf144e8a5d` | NEEDS_REVIEW |
| `request_thay_tam_lam_mat` — Cần thay tấm làm mát | USER_REPORTED | `f52677e7-dd62-420d-9715-d08a550e9630` | NEEDS_REVIEW |

### Đèn sự cố / Đèn thoát hiểm — `8e1b308f-a8cd-4de8-9a30-6db52cfdb32c`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_den_su_co_khong_sang` — Đèn sự cố không sáng | USER_REPORTED | `12ac5acb-fc19-442b-9a5b-2912ebd2405f` | NEEDS_REVIEW |
| `symptom_sua_den_khong_sac` — Đèn không sạc | USER_REPORTED | `5dac515e-3299-4baf-8135-71989fd1a094` | NEEDS_REVIEW |
| `request_lap_den_su_co` — Cần lắp đèn sự cố | USER_REPORTED | `821f476f-750e-41fc-ad84-4a0d45122525` | NEEDS_REVIEW |
| `request_thay_nguon_den_exit` — Cần thay nguồn đèn EXIT | USER_REPORTED | `8df20feb-9fa3-4aa5-a659-ad40fd8455de` | NEEDS_REVIEW |
| `request_kiem_tra_chieu_sang_du_phong` — Cần kiểm tra chiếu sáng dự phòng | USER_REPORTED | `8e91269d-0c9a-44e1-aebc-d2a998740be5` | NEEDS_REVIEW |
| `request_thay_pin_den_su_co` — Cần thay pin đèn sự cố | USER_REPORTED | `941d723e-212e-4d2f-9d7e-e3535ec0c734` | NEEDS_REVIEW |
| `request_lap_den_exit` — Cần lắp đèn EXIT | USER_REPORTED | `9e267349-173e-4b84-a7b0-741500b7d05a` | NEEDS_REVIEW |
| `request_bao_tri_den_su_co` — Cần bảo trì đèn sự cố | USER_REPORTED | `c7c32ec6-ccbf-407c-84b7-cb1526c5a055` | NEEDS_REVIEW |

### Cửa kính / Cửa sổ / Ban công — `8ea8b042-3418-4ec9-8cd7-5c71b899a183`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_ve_sinh_cua_ra_vao` — Cần vệ sinh cửa ra vào | USER_REPORTED | `1639fc9d-add0-493c-9e09-b76295e7797e` | NEEDS_REVIEW |
| `request_ve_sinh_lan_can` — Cần vệ sinh lan can | USER_REPORTED | `1b8b4da1-287f-44f6-a526-947ae44395fb` | NEEDS_REVIEW |
| `request_ve_sinh_khung_cua_va_ray_truot` — Cần vệ sinh khung cửa và ray trượt | USER_REPORTED | `25048ed3-8dcc-4bca-8438-c56502b088b9` | NEEDS_REVIEW |
| `request_lau_kinh_trong_nha` — Cần lau kính trong nhà | USER_REPORTED | `544cd861-f88b-4592-9c9b-d0d06aaed0fa` | NEEDS_REVIEW |
| `request_lam_sach_bui_ban_be_mat_ngoai_trong_pham_vi_an_toan` — Cần làm sạch bụi bẩn bề mặt ngoài trong phạm vi an toàn | USER_REPORTED | `7a95dce3-b5a9-4c81-b680-7ef78b97163b` | NEEDS_REVIEW |
| `request_ve_sinh_cua_kinh` — Cần vệ sinh cửa kính | USER_REPORTED | `a0967047-d9cb-42c1-a96d-21e2108ef902` | NEEDS_REVIEW |
| `request_lau_cua_so` — Cần lau cửa sổ | USER_REPORTED | `a44c3260-0d2e-41a8-820a-c136bc5e145b` | NEEDS_REVIEW |
| `request_ve_sinh_ban_cong` — Cần vệ sinh ban công | USER_REPORTED | `d8cf18be-6d61-4625-b9f5-957269df3f5f` | NEEDS_REVIEW |

### Thiết bị đo điện / Công tơ điện — `93797cd8-e539-456e-a38f-f76316e84107`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_kiem_tra_day_cap_cho_cong_to_phu` — Cần kiểm tra dây cấp cho công tơ phụ | USER_REPORTED | `089a863b-f579-4dc5-8725-3676f278d223` | NEEDS_REVIEW |
| `symptom_kiem_tra_cong_to_mat_hien_thi` — Kiểm tra công tơ mất hiển thị | USER_REPORTED | `4d905937-dd5e-44f7-911a-7354bf2a307a` | NEEDS_REVIEW |
| `request_lap_bo_giam_sat_tieu_thu_dien` — Cần lắp bộ giám sát tiêu thụ điện | USER_REPORTED | `52da88db-1e2a-4e3b-8bdf-82cdbc394bfa` | NEEDS_REVIEW |
| `request_chuyen_yeu_cau_lien_quan_cong_to_niem_phong_cho_don_vi_dien_lu` — Cần chuyển yêu cầu liên quan công tơ niêm phong cho đơn vị điện lực | USER_REPORTED | `60e144f9-2d9f-4e00-aaf3-815befa31db2` | NEEDS_REVIEW |
| `request_kiem_tra_ket_noi_cong_to_phu` — Cần kiểm tra kết nối công tơ phụ | USER_REPORTED | `79945a6c-3a26-4237-8c64-d86fb01197db` | NEEDS_REVIEW |
| `request_kiem_tra_bo_do_dien_nang_thong_minh` — Cần kiểm tra bộ đo điện năng thông minh | USER_REPORTED | `8f37d9c1-11c6-4717-b258-9e5d2f2f0229` | NEEDS_REVIEW |
| `request_lap_cong_to_phu_noi_bo` — Cần lắp công tơ phụ nội bộ | USER_REPORTED | `9b819ab3-67c3-4cc1-8216-ba976fadf703` | NEEDS_REVIEW |
| `symptom_thay_cong_to_phu_hong` — Thay công tơ phụ hỏng | USER_REPORTED | `a1c9bf76-d658-44a6-8fce-0030cfa7d401` | NEEDS_REVIEW |
| `request_kiem_tra_sai_lech_do_dem_so_bo` — Cần kiểm tra sai lệch đo đếm sơ bộ | USER_REPORTED | `ef5d7829-a0db-491e-aff5-0dbf47fb0186` | NEEDS_REVIEW |

### Thiết bị chống rò / Chống giật — `9a3f2d63-e61b-4d6c-8ff0-15e179c15d02`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_kiem_tra_thiet_bi_chong_ro_khong_dong_duoc` — Kiểm tra thiết bị chống rò không đóng được | USER_REPORTED | `08520d7b-b565-4088-a276-d37fc3ce523f` | NEEDS_REVIEW |
| `symptom_lap_thiet_bi_chong_ro` — Lắp thiết bị chống rò | USER_REPORTED | `1c17f055-3778-4715-8e62-cac84cf8ca06` | NEEDS_REVIEW |
| `symptom_kiem_tra_dau_noi_trung_tinh_tiep_dia` — Kiểm tra đấu nối trung tính / tiếp địa | USER_REPORTED | `35723267-320f-43cf-8f1b-82582948240d` | NEEDS_REVIEW |
| `symptom_khoanh_vung_nhanh_dien_ro` — Khoanh vùng nhánh điện rò | USER_REPORTED | `5b81cc07-b32a-4e10-b332-b49c573db867` | NEEDS_REVIEW |
| `symptom_thay_rccb_rcbo_hong` — Thay RCCB / RCBO hỏng | USER_REPORTED | `c94710d8-0f06-4b2a-bffc-8c483bd25755` | NEEDS_REVIEW |
| `request_kiem_tra_rccb_rcbo_nhay_lien_tuc` — Cần kiểm tra RCCB / RCBO nhảy liên tục | USER_REPORTED | `d0aaa77b-02e2-4952-9bad-c48af1708c5c` | NEEDS_REVIEW |
| `symptom_kiem_tra_dong_ro` — Kiểm tra dòng rò | USER_REPORTED | `d13241ea-c31d-4900-996e-ac1b179bdf5a` | NEEDS_REVIEW |
| `request_kiem_tra_nut_test` — Cần kiểm tra nút TEST | USER_REPORTED | `ec54b308-ad22-4fac-aaf1-3b911f6174f5` | NEEDS_REVIEW |

### Quạt thông gió / Quạt hút — `9b5276c6-9692-46be-a8ad-f3e1afdac569`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_quat_hut_nha_ve_sinh` — Cần lắp quạt hút nhà vệ sinh | USER_REPORTED | `1911090f-770e-48a2-8b16-457b20bc442e` | NEEDS_REVIEW |
| `request_thay_quat_hut` — Cần thay quạt hút | USER_REPORTED | `1b2cacfe-2cd3-4df4-b9c1-5732265cf84f` | NEEDS_REVIEW |
| `symptom_sua_quat_khong_chay` — Quạt không chạy | USER_REPORTED | `2932870e-1782-4557-9794-3c5066222807` | NEEDS_REVIEW |
| `symptom_thay_cong_tac` — Thay công tắc | USER_REPORTED | `2c9b8d41-ed96-4164-a84e-f31fb40b3ec1` | NEEDS_REVIEW |
| `symptom_sua_quat_hut_yeu` — Quạt hút yếu | USER_REPORTED | `4ea63891-2697-4a09-bbb4-e627f156c881` | NEEDS_REVIEW |
| `request_lap_quat_thong_gio` — Cần lắp quạt thông gió | USER_REPORTED | `70507947-fcc1-4647-bff0-ec32b323ee68` | NEEDS_REVIEW |
| `request_thay_dong_co_tu` — Cần thay động cơ / tụ | REQUIRES_TECHNICIAN_CHECK | `803df96c-ed63-4e9b-8d16-b3e3340591ec` | NEEDS_REVIEW |
| `symptom_sua_quat_rung_keu_quat_thong_gio_quat_hut` — Quạt rung / kêu | USER_REPORTED | `b961e3f3-093d-476f-adcc-6e75baaf188e` | NEEDS_REVIEW |
| `request_ve_sinh_quat` — Cần vệ sinh quạt | USER_REPORTED | `c6d4c547-e7bb-48a5-8794-56b4fb0ae832` | NEEDS_REVIEW |
| `request_lap_quat_hut_gan_tuong_tran` — Cần lắp quạt hút gắn tường / trần | USER_REPORTED | `ede5a69b-06a4-4837-8971-3ce8453d5286` | NEEDS_REVIEW |

### Nguồn cấp cho thiết bị cố định — `9e70ad4f-39e3-44f9-90d6-cb70c8ce9fbe`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_nguon_rieng_cho_bep_dien` — Cần lắp nguồn riêng cho bếp điện | USER_REPORTED | `1fad2bc9-39ad-47f5-9e66-b9ba60f4abde` | NEEDS_REVIEW |
| `request_kiem_tra_cb_nhanh_thiet_bi` — Cần kiểm tra CB nhánh thiết bị | USER_REPORTED | `1fdecb7e-ee41-48ac-8c83-3940c96eba56` | NEEDS_REVIEW |
| `symptom_lap_cong_tac_cach_ly_thiet_bi` — Lắp công tắc cách ly thiết bị | USER_REPORTED | `2eca7baf-5339-4bf4-b094-0fea5c7ecf3a` | NEEDS_REVIEW |
| `request_do_dien_ap_cap_cho_thiet_bi` — Cần đo điện áp cấp cho thiết bị | USER_REPORTED | `5e946c41-6d58-4515-8cd3-74b5226c0443` | NEEDS_REVIEW |
| `request_lap_nguon_rieng_cho_binh_nong_lanh` — Cần lắp nguồn riêng cho bình nóng lạnh | USER_REPORTED | `7332139e-05d5-4f2c-9753-1230b8aed7d0` | NEEDS_REVIEW |
| `request_lap_nguon_rieng_cho_may_giat` — Cần lắp nguồn riêng cho máy giặt | USER_REPORTED | `7c277d2a-4fa5-4522-867f-5c4348f072b7` | NEEDS_REVIEW |
| `request_lap_nguon_rieng_cho_may_lanh` — Cần lắp nguồn riêng cho máy lạnh | USER_REPORTED | `8ba5f4cf-10ea-4caa-b9cc-c19431ff4ffa` | NEEDS_REVIEW |
| `request_thay_day_cap_nguon_co_dinh` — Cần thay dây cấp nguồn cố định | USER_REPORTED | `aec0b69b-88d3-45bc-b84e-b7ea17d3d3ab` | NEEDS_REVIEW |
| `request_kiem_tra_tiep_diem_phat_nong` — Cần kiểm tra tiếp điểm phát nóng | USER_REPORTED | `f30e6e86-28f6-4b91-be80-65c575b47cef` | NEEDS_REVIEW |

### Bàn ủi / Bàn là hơi nước — `a265bdb4-3c9f-4d0a-bcba-1f0722c8b420`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_ban_ui_khong_ra_hoi` — Bàn ủi không ra hơi | USER_REPORTED | `516ec689-302a-4197-9971-48ab85e50608` | NEEDS_REVIEW |
| `request_sua_bo_dieu_nhiet_ban_ui_ban_la_hoi_nuoc` — Cần sửa bộ điều nhiệt | USER_REPORTED | `59a8c425-e92b-4dfa-be64-88edc90d0ed1` | NEEDS_REVIEW |
| `symptom_sua_ban_ui_ro_nuoc` — Bàn ủi rò nước | VISUAL_OBSERVABLE | `75fb64f2-6956-4e56-ba67-36c8e7563d4a` | NEEDS_REVIEW |
| `symptom_sua_ban_ui_khong_nong` — Bàn ủi không nóng | USER_REPORTED | `7700114b-7917-4fe9-8d49-a46dc3883034` | NEEDS_REVIEW |
| `request_khu_can_duong_hoi` — Cần khử cặn đường hơi | USER_REPORTED | `7f4eff70-a5bf-4a57-9e5a-0540829fd0a0` | NEEDS_REVIEW |
| `request_sua_day_nguon` — Cần sửa dây nguồn | USER_REPORTED | `d401b239-111f-4122-81b5-e3ec226aa0f4` | NEEDS_REVIEW |
| `request_ve_sinh_mat_de_bao_duong` — Cần vệ sinh mặt đế / bảo dưỡng | USER_REPORTED | `fe3d85ed-c1f1-4355-849f-fa4e114d331f` | NEEDS_REVIEW |

### Lò nướng / Nồi chiên không dầu — `a289a9b0-6cb9-4d94-b3a3-3ff6dd55e1f7`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_thiet_bi_khong_nong` — Thiết bị không nóng | USER_REPORTED | `22079aa2-6632-4b19-8a93-5cfbcc38a26d` | NEEDS_REVIEW |
| `request_sua_cua_tay_cam_khay` — Cần sửa cửa / tay cầm / khay | USER_REPORTED | `32d8ab97-736b-4466-af4b-2dd116aae636` | NEEDS_REVIEW |
| `symptom_sua_thiet_bi_nong_khong_deu` — Thiết bị nóng không đều | USER_REPORTED | `40563375-8937-43ef-b1e6-4854b3b836ad` | NEEDS_REVIEW |
| `request_ve_sinh_va_bao_duong` — Cần vệ sinh và bảo dưỡng | USER_REPORTED | `738ae4be-753a-4647-b1b6-ee41550667f0` | NEEDS_REVIEW |
| `request_sua_bo_hen_gio` — Cần sửa bộ hẹn giờ | USER_REPORTED | `b1168177-1822-41b5-b484-c7dff0490c27` | NEEDS_REVIEW |
| `symptom_sua_thiet_bi_khong_len_nguon` — Thiết bị không lên nguồn | USER_REPORTED | `d6636b39-a02e-4572-ba39-0d814babe50f` | NEEDS_REVIEW |
| `request_sua_quat_doi_luu` — Cần sửa quạt đối lưu | USER_REPORTED | `e9f9a799-89dd-4924-bf64-45c03bfb6849` | NEEDS_REVIEW |
| `request_sua_bang_dieu_khien_lo_nuong_noi_chien_khong_dau` — Cần sửa bảng điều khiển | USER_REPORTED | `edb5e8ce-b7fc-49af-a1fe-369ee4032559` | NEEDS_REVIEW |

### Quạt điện / Quạt đứng / Quạt bàn — `a9f91e3c-16d5-484d-92bf-68c526ac9606`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_quat_khong_quay_quat_dien_quat_dung_quat_ban` — Quạt không quay | USER_REPORTED | `021db225-7361-4333-be45-f9aad171cec4` | NEEDS_REVIEW |
| `symptom_sua_quat_khong_dao_gio` — Quạt không đảo gió | USER_REPORTED | `2a2e19fb-449a-4c8e-b5f5-bba76dd2d552` | NEEDS_REVIEW |
| `request_sua_quat_quay_cham_quat_dien_quat_dung_quat_ban` — Cần sửa quạt quay chậm | USER_REPORTED | `2fcbc650-c060-44b5-b341-264ef7927624` | NEEDS_REVIEW |
| `request_ve_sinh_bao_duong_quat_dien_quat_dung_quat_ban` — Cần vệ sinh / bảo dưỡng | USER_REPORTED | `460e348c-f29d-4caa-857a-b654cb2f3353` | NEEDS_REVIEW |
| `request_sua_bo_dieu_khien_toc_do` — Cần sửa bộ điều khiển tốc độ | USER_REPORTED | `60e563cd-cedb-42bd-8050-3342ec25e530` | NEEDS_REVIEW |
| `symptom_sua_day_nguon_cong_tac` — Dây nguồn / công tắc | USER_REPORTED | `a8173334-1456-4a0a-a24e-390a8d2c0f51` | NEEDS_REVIEW |
| `request_thay_canh_long_quat` — Cần thay cánh / lồng quạt | USER_REPORTED | `afed313b-0e2e-45b5-af41-f852821e6573` | NEEDS_REVIEW |
| `request_thay_tu_quat_quat_dien_quat_dung_quat_ban` — Cần thay tụ quạt | USER_REPORTED | `c4be7cce-dea4-42f9-8d10-721500c5509b` | NEEDS_REVIEW |
| `symptom_sua_quat_keu_to_rung` — Quạt kêu to / rung | USER_REPORTED | `f8da8c0e-41bd-40da-82ab-c3b740bf9750` | NEEDS_REVIEW |

### Tiếp địa / Chống sét — `aa15b0ce-a9e6-4faf-9c87-1d5102d339f5`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_bao_tri_chong_set` — Cần bảo trì chống sét | USER_REPORTED | `0a66e531-dd93-46a9-9613-240c13cc2745` | NEEDS_REVIEW |
| `request_sua_moi_noi_tiep_dia` — Cần sửa mối nối tiếp địa | USER_REPORTED | `1c87edda-1635-499c-b6be-dbd0e234b8ce` | NEEDS_REVIEW |
| `request_kiem_tra_spd` — Cần kiểm tra SPD | USER_REPORTED | `3c5b3172-2839-4bed-9a93-4255616ce714` | NEEDS_REVIEW |
| `request_lap_he_thong_tiep_dia` — Cần lắp hệ thống tiếp địa | USER_REPORTED | `50a7ebe7-5e85-419e-816b-bdf37e6132ca` | NEEDS_REVIEW |
| `request_do_dien_tro_tiep_dia` — Cần đo điện trở tiếp địa | USER_REPORTED | `678cafaa-d1b6-4fa5-9bd0-cea7312ea256` | NEEDS_REVIEW |
| `symptom_thay_spd_hong` — Thay SPD hỏng | USER_REPORTED | `6924f9c2-0de5-4b78-867a-265a79358968` | NEEDS_REVIEW |
| `request_bo_sung_tiep_dia_o_cam` — Cần bổ sung tiếp địa ổ cắm | USER_REPORTED | `6b906da0-9b2a-4110-abbc-3c5e36ce36f0` | NEEDS_REVIEW |
| `request_kiem_tra_day_tiep_dia_dut` — Cần kiểm tra dây tiếp địa đứt | USER_REPORTED | `9a399eff-86ff-4f39-a9c3-a6cc055f393a` | NEEDS_REVIEW |
| `request_kiem_tra_he_thong_tiep_dia` — Cần kiểm tra hệ thống tiếp địa | USER_REPORTED | `f454ceed-7d2e-4350-adf6-11d58ec7934f` | NEEDS_REVIEW |
| `request_kiem_tra_lien_ket_dang_the` — Cần kiểm tra liên kết đẳng thế | USER_REPORTED | `f800e940-7eb6-4d83-b0ba-61f0089d843b` | NEEDS_REVIEW |

### Máy hút bụi / Robot hút bụi — `ac770808-e06b-4f11-8c0d-ea2c5ca4ab55`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_may_khong_sac` — Máy không sạc | USER_REPORTED | `1906cd3f-392f-487d-b69c-b94541620877` | NEEDS_REVIEW |
| `symptom_sua_may_khong_len_nguon_may_hut_bui_robot_hut_bui` — Máy không lên nguồn | USER_REPORTED | `3192c1be-0d16-42e1-be09-ba75f069e0dc` | NEEDS_REVIEW |
| `symptom_sua_may_hut_yeu_khong_hut` — Máy hút yếu / không hút | USER_REPORTED | `472ee81a-136b-4152-82f9-ea7f345bfc52` | NEEDS_REVIEW |
| `symptom_sua_robot_mat_ket_noi` — Robot mất kết nối | USER_REPORTED | `51acae74-7365-4562-a2aa-3430a336ce3d` | NEEDS_REVIEW |
| `request_ve_sinh_bao_duong` — Cần vệ sinh / bảo dưỡng | USER_REPORTED | `553c30ad-c04b-428c-982a-f4e9a3dff7f8` | NEEDS_REVIEW |
| `request_thay_pin_bo_sac_tuong_thich` — Cần thay pin / bộ sạc tương thích | USER_REPORTED | `5d96b6d8-313c-47be-845f-805f9928b4a5` | NEEDS_REVIEW |
| `request_sua_hop_bui_duong_hut` — Cần sửa hộp bụi / đường hút | USER_REPORTED | `a1dda50d-a606-49e5-b412-c31bc3216bdf` | NEEDS_REVIEW |
| `request_sua_cam_bien_va_cham_chong_roi` — Cần sửa cảm biến va chạm / chống rơi | REQUIRES_TECHNICIAN_CHECK | `b90b7315-ee0a-4e31-8746-068f53575390` | NEEDS_REVIEW |
| `symptom_sua_robot_bao_loi` — Robot báo lỗi | USER_REPORTED | `df56d013-ad44-489c-a09b-e18aac7b17a0` | NEEDS_REVIEW |
| `request_sua_choi_banh_xe` — Cần sửa chổi / bánh xe | USER_REPORTED | `ebdf07f7-0125-406f-98e9-e46676508543` | NEEDS_REVIEW |

### Bóng đèn / Đèn LED — `b45c19d2-93d2-43ac-8330-87d223d941b4`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_den_khong_sang` — Đèn không sáng | USER_REPORTED | `2e8ef751-b27b-46cf-8413-8856befb87de` | NEEDS_REVIEW |
| `request_sua_den_nhap_nhay` — Cần sửa đèn nhấp nháy | USER_REPORTED | `3e805c10-b94d-4898-81d8-1d8adfe642fb` | NEEDS_REVIEW |
| `request_kiem_tra_den_phat_nong_bat_thuong` — Cần kiểm tra đèn phát nóng bất thường | USER_REPORTED | `3ed94135-8eb1-4ccf-abef-f09d177a1a34` | NEEDS_REVIEW |
| `request_lap_den_op_tran` — Cần lắp đèn ốp trần | USER_REPORTED | `4aa5d59e-37f2-45cb-9da2-3f0c7e516e16` | NEEDS_REVIEW |
| `request_thay_dui_den` — Cần thay đui đèn | USER_REPORTED | `722ffdee-395f-478d-aeba-7564e81a1ca9` | NEEDS_REVIEW |
| `request_thay_bong_led` — Cần thay bóng LED | USER_REPORTED | `79330001-34f0-400a-87c7-49e693204f90` | NEEDS_REVIEW |
| `request_lap_den_gan_tuong` — Cần lắp đèn gắn tường | USER_REPORTED | `7ec9770e-f6d2-4c07-8344-6cbbb5d9b6a2` | NEEDS_REVIEW |
| `request_thay_bong_tuyp` — Cần thay bóng tuýp | USER_REPORTED | `7edaf521-a33f-424b-9893-5ebcc62949a6` | NEEDS_REVIEW |
| `request_lap_den_am_tran` — Cần lắp đèn âm trần | USER_REPORTED | `800c7c6b-7a45-4d6e-a92e-fdf32386b129` | NEEDS_REVIEW |
| `symptom_sua_den_sang_yeu` — Đèn sáng yếu | USER_REPORTED | `93381b09-7b08-4572-9d82-2e7a7cb26bea` | NEEDS_REVIEW |
| `request_thay_driver_nguon_led` — Cần thay driver / nguồn LED | USER_REPORTED | `f3555302-43c5-4b95-94a2-e2f3f08287af` | NEEDS_REVIEW |

### Chuông cửa / Nút nhấn — `b5e21dc2-ed41-4aaa-9f0f-8f5f5aaf025c`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lap_chuong_thong_minh` — Cần lắp chuông thông minh | USER_REPORTED | `3da064b8-c33c-45d0-84b1-45ebec994373` | NEEDS_REVIEW |
| `request_lap_chuong_man_hinh` — Cần lắp chuông màn hình | USER_REPORTED | `63035f7f-aaa2-43ce-bbf7-184144666422` | NEEDS_REVIEW |
| `symptom_kiem_tra_mat_ket_noi_chuong` — Kiểm tra mất kết nối chuông | USER_REPORTED | `8423fa27-93b9-4c92-a330-e79bfc53ef12` | NEEDS_REVIEW |
| `request_lap_chuong_co_day` — Cần lắp chuông có dây | USER_REPORTED | `8868cad7-b8bc-40ab-be35-1bcb1d77d918` | NEEDS_REVIEW |
| `request_thay_bo_chuong` — Cần thay bộ chuông | USER_REPORTED | `954b2f37-314a-420f-b3e1-bb5d355b7282` | NEEDS_REVIEW |
| `symptom_sua_chuong_keu_lien_tuc` — Chuông kêu liên tục | USER_REPORTED | `a1b3f647-ad84-42a9-b8a8-ace0f4e7236c` | NEEDS_REVIEW |
| `symptom_lap_chuong_khong_day` — Lắp chuông không dây | USER_REPORTED | `cb79c923-d66f-4c9b-a8ff-d325498e4b07` | NEEDS_REVIEW |
| `request_sua_bo_cap_nguon_chuong` — Cần sửa bộ cấp nguồn chuông | USER_REPORTED | `d882f2b2-a52f-4c77-8426-d4b0ed2d25ae` | NEEDS_REVIEW |
| `symptom_sua_chuong_khong_keu` — Chuông không kêu | USER_REPORTED | `f2e2cbc1-d024-43fc-a6be-244f96c9a089` | NEEDS_REVIEW |
| `request_thay_nut_nhan` — Cần thay nút nhấn | USER_REPORTED | `f82dc8ee-47da-46e0-8701-8747939a2091` | NEEDS_REVIEW |

### Máy bơm nước – Phần điện — `bc70283c-4093-4574-aa3f-f5ef1fcdb353`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_kiem_tra_dong_co_qua_nhiet` — Cần kiểm tra động cơ quá nhiệt | REQUIRES_TECHNICIAN_CHECK | `18f17266-6a0f-4d37-b6a1-5dd7f27a56e6` | NEEDS_REVIEW |
| `symptom_sua_bom_khong_khoi_dong` — Bơm không khởi động | USER_REPORTED | `192e977f-2e65-4430-8f2d-14e0eb6e4fcc` | NEEDS_REVIEW |
| `request_sua_phao_dien` — Cần sửa phao điện | USER_REPORTED | `461d7dda-3438-4f6d-8e69-ff7f608979de` | NEEDS_REVIEW |
| `request_thay_tu_khoi_dong` — Cần thay tụ khởi động | USER_REPORTED | `62df43c5-be78-41c9-90c3-441d78265604` | NEEDS_REVIEW |
| `symptom_sua_bom_khong_len_nguon` — Bơm không lên nguồn | USER_REPORTED | `656b0f2e-e6a9-4888-8025-95c1c690acfc` | NEEDS_REVIEW |
| `request_lap_bao_ve_may_bom` — Cần lắp bảo vệ máy bơm | USER_REPORTED | `681c2439-0460-46f8-8ed1-68cfbec4710e` | NEEDS_REVIEW |
| `request_kiem_tra_duong_cap_dien_may_bom` — Cần kiểm tra đường cấp điện máy bơm | USER_REPORTED | `6bed7b71-fc16-413f-92af-fd3c5ba724d6` | NEEDS_REVIEW |
| `request_sua_dieu_khien_bom_tu_dong` — Cần sửa điều khiển bơm tự động | USER_REPORTED | `ceac3d5f-6d9d-4a0b-af52-03c2e9fad516` | NEEDS_REVIEW |
| `symptom_sua_cong_tac_ap_suat` — Công tắc áp suất | USER_REPORTED | `e80e5848-e2ec-4151-ac18-08a84dc6e4ed` | NEEDS_REVIEW |

### Lò vi sóng — `c3e13154-aeb8-4c3f-a6d3-6fa4f20566df`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_lo_khong_quay_dia` — Lò không quay đĩa | USER_REPORTED | `23df946c-d21e-44ea-83e0-8c7bc4826b59` | NEEDS_REVIEW |
| `request_sua_den_lo_vi_song` — Cần sửa đèn lò vi sóng | USER_REPORTED | `380bddb8-eb00-45ea-b24a-123856399b71` | NEEDS_REVIEW |
| `request_sua_lo_phat_tia_lua` — Cần sửa lò phát tia lửa | USER_REPORTED | `4aa99291-633d-43b0-aef9-75f6e699e022` | NEEDS_REVIEW |
| `request_ve_sinh_va_bao_duong_lo` — Cần vệ sinh và bảo dưỡng lò | USER_REPORTED | `9fd03350-5b26-48bd-bd77-fe7ccaabdf1c` | NEEDS_REVIEW |
| `symptom_sua_lo_khong_nong` — Lò không nóng | USER_REPORTED | `a6bdceae-33eb-4808-b1fc-2ffd653cec7b` | NEEDS_REVIEW |
| `request_sua_cua_khoa_lien_dong` — Cần sửa cửa / khóa liên động | USER_REPORTED | `a7d4298f-9979-4a13-8ff0-65ad42b8fa24` | NEEDS_REVIEW |
| `request_sua_bang_dieu_khien` — Cần sửa bảng điều khiển | USER_REPORTED | `c9379559-054a-4a89-9091-a188bf0f455e` | NEEDS_REVIEW |
| `symptom_sua_lo_khong_len_nguon` — Lò không lên nguồn | USER_REPORTED | `e74be059-895b-4c35-a5c6-5c91c3683c4f` | NEEDS_REVIEW |

### Ổ cắm điện — `ca1e389e-6302-4a19-a086-5c815a836473`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_sua_o_cam_long_tiep_xuc_kem` — Cần sửa ổ cắm lỏng / tiếp xúc kém | USER_REPORTED | `02695ade-1d71-4518-a4a3-4112f0f99055` | NEEDS_REVIEW |
| `symptom_sua_o_cam_chap_chon` — Ổ cắm chập chờn | USER_REPORTED | `20399951-fdf7-477b-ad0d-b03945e42e21` | NEEDS_REVIEW |
| `request_di_doi_o_cam` — Cần di dời ổ cắm | USER_REPORTED | `222dcb57-598c-49d5-b25d-49c3accd6bbe` | NEEDS_REVIEW |
| `symptom_thay_o_cam_chay_hong` — Thay ổ cắm cháy / hỏng | USER_REPORTED | `51bc6727-635d-4e9e-a979-090a972ea48a` | NEEDS_REVIEW |
| `symptom_sua_o_cam_khong_co_dien` — Ổ cắm không có điện | USER_REPORTED | `660c93a4-0bc0-4b90-8175-6b6b331de93c` | NEEDS_REVIEW |
| `request_lap_dat_o_cam_moi` — Cần lắp đặt ổ cắm mới | USER_REPORTED | `8476aab0-c6df-474f-9b85-2a92fbd83ca6` | NEEDS_REVIEW |
| `request_lap_o_cam_usb_usb_c` — Cần lắp ổ cắm USB / USB-C | USER_REPORTED | `c0a035df-1c69-46c0-85a7-3268df1887e6` | NEEDS_REVIEW |
| `request_kiem_tra_o_cam_phat_nong_hoac_co_mui_khet` — Cần kiểm tra ổ cắm phát nóng hoặc có mùi khét | USER_REPORTED | `d0ddcbd3-5c6e-4a2b-a3bf-ea42821acf6c` | NEEDS_REVIEW |
| `request_thay_o_cam_noi` — Cần thay ổ cắm nổi | USER_REPORTED | `d1eddfb8-da4c-42d7-b37e-37452af4d8ef` | NEEDS_REVIEW |
| `request_lap_o_cam_chong_nuoc` — Cần lắp ổ cắm chống nước | USER_REPORTED | `d4d49da5-26d1-4d18-9a85-0e7a8570f87b` | NEEDS_REVIEW |
| `request_thay_o_cam_am_tuong` — Cần thay ổ cắm âm tường | USER_REPORTED | `ef6468e6-5b5d-4ed8-a7d5-eef4eefac7c8` | NEEDS_REVIEW |

### Hệ thống tưới / Sân vườn tổng thể — `cc0ab115-0758-4fd3-a4ad-b10a68cd0cdb`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_cai_dat_lich_tuoi` — Cần cài đặt lịch tưới | USER_REPORTED | `1358e895-1765-44a5-80dc-767d1ab34ca1` | NEEDS_REVIEW |
| `request_lap_he_thong_tuoi_tu_dong` — Cần lắp hệ thống tưới tự động | USER_REPORTED | `1f7e6cd1-ad48-4fb1-bab3-a175877f8b5d` | NEEDS_REVIEW |
| `request_cai_tao_bo_tri_cay_xanh` — Cần cải tạo / bố trí cây xanh | USER_REPORTED | `22c7cb5f-fe7d-4181-ae4c-37fba94e03c8` | NEEDS_REVIEW |
| `request_khao_sat_thiet_ke_canh_quan_nho` — Cần khảo sát thiết kế cảnh quan nhỏ | USER_REPORTED | `36e2af46-5c18-48ba-ba3b-683817f7df9f` | NEEDS_REVIEW |
| `request_kiem_tra_ap_luc_he_thong_tuoi` — Cần kiểm tra áp lực hệ thống tưới | USER_REPORTED | `5be2a0aa-6e0b-4434-b36f-5732fd105513` | NEEDS_REVIEW |
| `symptom_sua_dau_tuoi_bi_nghet` — Đầu tưới bị nghẹt | USER_REPORTED | `662f4c3f-e873-4bbb-9b8b-d01880e93d51` | NEEDS_REVIEW |
| `symptom_sua_ong_tuoi_ro_nuoc` — Ống tưới rò nước | VISUAL_OBSERVABLE | `6d072a17-616e-4e07-9697-20ab792cde27` | NEEDS_REVIEW |
| `request_thu_gom_la_rac_huu_co` — Cần thu gom lá / rác hữu cơ | USER_REPORTED | `6f756585-093a-459c-86b5-dea013292d4b` | NEEDS_REVIEW |
| `request_cham_soc_san_vuon_dinh_ky` — Cần chăm sóc sân vườn định kỳ | USER_REPORTED | `8ef4de46-960a-4bfa-8c6b-056380e6acc0` | NEEDS_REVIEW |
| `request_sua_bo_hen_gio_tuoi` — Cần sửa bộ hẹn giờ tưới | USER_REPORTED | `b559e3a1-85bd-4b71-83ae-7c7c933e8eb0` | NEEDS_REVIEW |
| `request_thay_van_dau_phun_tuoi` — Cần thay van / đầu phun tưới | USER_REPORTED | `e995f4a2-4ec5-45a1-b2f3-e1ad9eb86d7a` | NEEDS_REVIEW |
| `request_don_ve_sinh_san_vuon` — Cần dọn vệ sinh sân vườn | USER_REPORTED | `ff34b9ec-ea7b-4ae9-abb3-87cfff05f2c3` | NEEDS_REVIEW |

### Hệ thống điện phòng — `cc357a32-647e-4598-9c0c-86c6d62f2427`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_kiem_tra_mat_dien_phong_khach` — Kiểm tra mất điện phòng khách | USER_REPORTED | `0d5ec79b-8b79-498d-9752-93bd48da2c9c` | NEEDS_REVIEW |
| `symptom_lap_them_o_cam_cong_tac` — Lắp thêm ổ cắm / công tắc | USER_REPORTED | `32b089de-bae4-404e-867a-d61bbb33b7de` | NEEDS_REVIEW |
| `symptom_kiem_tra_mat_dien_phong_ngu` — Kiểm tra mất điện phòng ngủ | USER_REPORTED | `6d5dd79f-b14b-490d-9cea-7111b6164173` | NEEDS_REVIEW |
| `symptom_kiem_tra_mat_dien_nha_bep` — Kiểm tra mất điện nhà bếp | USER_REPORTED | `78f58fdb-df7a-489a-8bf9-a9039ed6f214` | NEEDS_REVIEW |
| `request_bo_sung_mach_dien_khu_vuc` — Cần bổ sung mạch điện khu vực | USER_REPORTED | `7cf9ce13-e85a-47ae-9049-7a93eb3ffd45` | NEEDS_REVIEW |
| `symptom_kiem_tra_dien_chap_chon_mot_phong` — Kiểm tra điện chập chờn một phòng | USER_REPORTED | `8485abf0-ec09-4a91-a79c-2b317a12aa21` | NEEDS_REVIEW |
| `request_nang_cap_dien_mot_phong` — Cần nâng cấp điện một phòng | USER_REPORTED | `8ccf6fee-7c10-4738-b212-383afa7467c4` | NEEDS_REVIEW |
| `symptom_kiem_tra_mat_dien_phong_tam` — Kiểm tra mất điện phòng tắm | USER_REPORTED | `bd958318-a6c6-464a-afde-2411bc1c7e18` | NEEDS_REVIEW |
| `symptom_kiem_tra_mat_dien_ban_cong` — Kiểm tra mất điện ban công | USER_REPORTED | `cb1f303c-cdef-46e4-b2a2-dde5ff28f2ba` | NEEDS_REVIEW |
| `symptom_kiem_tra_mat_dien_san_vuon` — Kiểm tra mất điện sân vườn | USER_REPORTED | `d4c6b65d-86f3-4c40-b68a-bfde82bfa519` | NEEDS_REVIEW |
| `request_kiem_tra_qua_tai_khu_vuc` — Cần kiểm tra quá tải khu vực | USER_REPORTED | `de2cbbc2-cb66-420b-9a86-43645dfaba53` | NEEDS_REVIEW |

### Nhà ở / Căn hộ — `cf864eb2-ba2a-4dd8-8b8f-d13602981783`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_lau_bui_noi_that` — Cần lau bụi nội thất | USER_REPORTED | `162b8294-f2a2-4b69-8c8c-0ec71d299d1f` | NEEDS_REVIEW |
| `request_thu_gom_rac_sinh_hoat` — Cần thu gom rác sinh hoạt | USER_REPORTED | `33030944-b49c-4375-96a8-27305ed18d6a` | NEEDS_REVIEW |
| `request_tong_ve_sinh_nha_o` — Cần tổng vệ sinh nhà ở | USER_REPORTED | `72b665c1-ed21-41ac-aca5-59c68199e354` | NEEDS_REVIEW |
| `request_don_dep_truoc_sau_chuyen_nha` — Cần dọn dẹp trước / sau chuyển nhà | USER_REPORTED | `7bd1bd93-7d3d-4e67-b1e3-c6a9f7a5a16f` | NEEDS_REVIEW |
| `request_don_dep_nha_theo_gio` — Cần dọn dẹp nhà theo giờ | USER_REPORTED | `953df968-7d50-43c8-b9bf-32a916808a25` | NEEDS_REVIEW |
| `request_quet_hut_bui_lau_san` — Cần quét / hút bụi / lau sàn | USER_REPORTED | `bf67fae6-d9ab-4d48-ae09-6b7ae27c211c` | NEEDS_REVIEW |
| `request_ve_sinh_cac_khu_vuc_sinh_hoat` — Cần vệ sinh các khu vực sinh hoạt | USER_REPORTED | `c0a094cc-4d05-40c9-8c13-15e2266a5e49` | NEEDS_REVIEW |
| `request_don_dep_nha_dinh_ky` — Cần dọn dẹp nhà định kỳ | USER_REPORTED | `e452ba6d-3287-4142-81ef-0a9e4dba308f` | NEEDS_REVIEW |
| `request_ve_sinh_nha_sau_xay_dung` — Cần vệ sinh nhà sau xây dựng | USER_REPORTED | `f15560ed-ee2d-4bce-953c-ac07333636e3` | NEEDS_REVIEW |
| `request_sap_xep_do_dung_theo_yeu_cau` — Cần sắp xếp đồ dùng theo yêu cầu | USER_REPORTED | `ffcb3883-aec7-4520-85da-79ae6136d127` | NEEDS_REVIEW |

### Bể tự hoại / Hố ga / Cống thoát — `d9924692-19d1-4185-9e35-b381953c42a3`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_xu_ly_mui_hoi_ho_ga` — Cần xử lý mùi hôi hố ga | USER_REPORTED | `4304177e-a7b7-4533-93f4-e50bd8a7f13d` | NEEDS_REVIEW |
| `request_kiem_tra_sua_nap_ho_ga` — Cần kiểm tra / sửa nắp hố ga | USER_REPORTED | `55779c50-88ea-490f-862c-c94c0fbbb598` | NEEDS_REVIEW |
| `request_kiem_tra_cong_thoat_bi_trao_nguoc` — Cần kiểm tra cống thoát bị trào ngược | USER_REPORTED | `657277c9-255a-447c-afae-34a2e9bdd195` | NEEDS_REVIEW |
| `symptom_thong_tac_duong_cong` — Thông tắc đường cống | USER_REPORTED | `824ceac4-511d-426e-b47c-df1bc0a46a3b` | NEEDS_REVIEW |
| `request_hut_be_tu_hoai_qua_don_vi_chuyen_trach` — Cần hút bể tự hoại qua đơn vị chuyên trách | USER_REPORTED | `ac26e771-1a48-4ecd-80db-61277b73845f` | NEEDS_REVIEW |
| `symptom_thong_tac_ho_ga` — Thông tắc hố ga | USER_REPORTED | `b26d4038-fc06-4cb2-9ec3-3cf36c6665f4` | NEEDS_REVIEW |
| `request_nao_vet_ho_ga` — Cần nạo vét hố ga | USER_REPORTED | `f8915252-8c92-4746-b23f-998a10433dd3` | NEEDS_REVIEW |
| `request_sua_doan_ong_thoat_ngoai_nha` — Cần sửa đoạn ống thoát ngoài nhà | USER_REPORTED | `f98f3686-880f-4a34-a435-1fe3e64f11b5` | NEEDS_REVIEW |

### Cây bóng mát / Cây lớn — `e6e9a725-4058-4af4-83b7-a35fc91af354`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_thu_gom_canh_sau_cat` — Cần thu gom cành sau cắt | USER_REPORTED | `07e9e7f4-28de-41d4-9181-b8fb1fd4a9a1` | NEEDS_REVIEW |
| `request_don_canh_kho_gay` — Cần dọn cành khô / gãy | USER_REPORTED | `1ca8ca7a-de79-4167-bd58-d58ffda951c2` | NEEDS_REVIEW |
| `request_cat_tia_canh_cay` — Cần cắt tỉa cành cây | USER_REPORTED | `32691430-ce75-4078-b34b-1c499f05d3ad` | NEEDS_REVIEW |
| `request_bon_phan_cai_tao_goc` — Cần bón phân / cải tạo gốc | USER_REPORTED | `433eeeac-cb74-4fcc-9c63-f04969d044bd` | NEEDS_REVIEW |
| `request_tao_tan_cay` — Cần tạo tán cây | USER_REPORTED | `78d53f1b-9cbc-4d2f-b64e-dcefd25b3ca8` | NEEDS_REVIEW |
| `request_kiem_tra_cay_nghieng_nguy_co_do` — Cần kiểm tra cây nghiêng / nguy cơ đổ | USER_REPORTED | `b0bfbff3-296f-4b16-b2d1-cccb9189182d` | NEEDS_REVIEW |
| `request_khao_sat_xu_ly_cay_nguy_hiem_boi_doi_chuyen_mon` — Cần khảo sát xử lý cây nguy hiểm bởi đội chuyên môn | USER_REPORTED | `b8a3b67f-d181-45d8-bc72-8fed59cc96c4` | NEEDS_REVIEW |
| `request_cham_soc_cay_bong_mat` — Cần chăm sóc cây bóng mát | USER_REPORTED | `c227d4e7-3936-494b-94d1-bc806a36fa43` | NEEDS_REVIEW |
| `request_trong_thay_cay_bong_mat` — Cần trồng / thay cây bóng mát | USER_REPORTED | `cb4006fb-2ecc-453f-863a-6d7843944923` | NEEDS_REVIEW |

### Máy giặt / Máy giặt sấy — `eaa18ae1-41b8-4588-bcdb-96192e5a2da8`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_sua_cua_khoa_cua_may_giat` — Cần sửa cửa / khóa cửa máy giặt | USER_REPORTED | `249acb3c-1e2a-4f6c-9f32-267abb790a9f` | NEEDS_REVIEW |
| `symptom_sua_may_giat_khong_quay_long` — Máy giặt không quay lồng | USER_REPORTED | `2f89aec2-8460-4ed3-a4c5-5a9d5c690584` | NEEDS_REVIEW |
| `request_sua_chuc_nang_say_cua_may_giat_say` — Cần sửa chức năng sấy của máy giặt sấy | USER_REPORTED | `493a632b-7047-468c-b836-dbbe3051327d` | NEEDS_REVIEW |
| `request_sua_bom_xa` — Cần sửa bơm xả | USER_REPORTED | `4c0a9108-53d1-4867-b103-74ea9b9826ee` | NEEDS_REVIEW |
| `request_ve_sinh_long_giat_cua_tren` — Cần vệ sinh lồng giặt cửa trên | USER_REPORTED | `5d0c416f-ef63-4d3d-bd89-aacc6315ca4e` | NEEDS_REVIEW |
| `symptom_sua_may_giat_ro_nuoc` — Máy giặt rò nước | VISUAL_OBSERVABLE | `66edd4d7-5f36-4e4f-b4fd-4f6a26b27ef6` | NEEDS_REVIEW |
| `request_lap_dat_di_doi_may_giat` — Cần lắp đặt / di dời máy giặt | USER_REPORTED | `71cf0b05-5caf-468d-9c84-c8f6c7811068` | NEEDS_REVIEW |
| `symptom_sua_may_giat_khong_len_nguon` — Máy giặt không lên nguồn | USER_REPORTED | `733ec47b-5d49-449a-87eb-17c335853ce9` | NEEDS_REVIEW |
| `symptom_sua_may_giat_khong_vat` — Máy giặt không vắt | USER_REPORTED | `73af86e3-ca59-4c61-a0d9-80bee5634af8` | NEEDS_REVIEW |
| `request_sua_van_cap_nuoc` — Cần sửa van cấp nước | USER_REPORTED | `78318797-f596-42ce-ae25-cf6ecf9240c0` | NEEDS_REVIEW |
| `request_khu_mui_may_giat` — Cần khử mùi máy giặt | USER_REPORTED | `831ddae7-ba82-40c2-b121-74d751c4f20e` | NEEDS_REVIEW |
| `request_bao_duong_may_giat` — Cần bảo dưỡng máy giặt | USER_REPORTED | `8c3aaa1c-0be1-4b9a-ad34-f00728444420` | NEEDS_REVIEW |
| `request_ve_sinh_long_giat_cua_ngang` — Cần vệ sinh lồng giặt cửa ngang | USER_REPORTED | `d08ac3e6-1c95-4ee7-ba99-f42912da3043` | NEEDS_REVIEW |
| `symptom_sua_may_giat_khong_cap_nuoc` — Máy giặt không cấp nước | USER_REPORTED | `dec74387-53c0-4de0-b7c1-e0ca187e6c88` | NEEDS_REVIEW |
| `request_sua_bang_dieu_khien_bo_mach` — Cần sửa bảng điều khiển / bo mạch | REQUIRES_TECHNICIAN_CHECK | `e2439802-889c-4c78-a36f-958b2b97d2d8` | NEEDS_REVIEW |
| `symptom_sua_may_giat_rung_lac_hoac_keu_to` — Máy giặt rung lắc hoặc kêu to | USER_REPORTED | `e71c8a8a-7301-44ba-a7f2-69419f2222b2` | NEEDS_REVIEW |
| `symptom_sua_may_giat_khong_xa_nuoc` — Máy giặt không xả nước | USER_REPORTED | `eccedb1e-5c58-49e2-be69-db457d2d45a6` | NEEDS_REVIEW |
| `request_sua_day_curoa_bo_truyen_dong` — Cần sửa dây curoa / bộ truyền động | USER_REPORTED | `f32b429b-d191-48d9-bdbd-64e14a5462bf` | NEEDS_REVIEW |
| `request_kiem_tra_may_giat_bao_ma_loi` — Cần kiểm tra máy giặt báo mã lỗi | USER_REPORTED | `f8017e3d-6473-4fb7-b8cd-94fdae7fbfbc` | NEEDS_REVIEW |

### Ổn áp / UPS / Bộ lưu điện — `ec503642-d273-4742-bf35-e8b3d509e7e5`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_kiem_tra_on_ap_dau_ra_bat_thuong` — Cần kiểm tra ổn áp đầu ra bất thường | USER_REPORTED | `0217d7d2-76cd-4490-9b0c-2452e212936b` | NEEDS_REVIEW |
| `request_lap_ups` — Cần lắp UPS | USER_REPORTED | `17f5ec57-e32a-484a-a4a3-bae8f1ae2d6e` | NEEDS_REVIEW |
| `request_lap_on_ap` — Cần lắp ổn áp | USER_REPORTED | `4675f253-341a-4c94-b93f-2d0ac9ec883e` | NEEDS_REVIEW |
| `request_bao_duong_ups_on_ap` — Cần bảo dưỡng UPS / ổn áp | USER_REPORTED | `4e8bc58d-93dc-456d-b3b1-0d8bd620540c` | NEEDS_REVIEW |
| `symptom_kiem_tra_on_ap_khong_hoat_dong` — Kiểm tra ổn áp không hoạt động | USER_REPORTED | `637ee308-00de-4116-bb07-7347929c01f9` | NEEDS_REVIEW |
| `symptom_kiem_tra_ups_bao_loi` — Kiểm tra UPS báo lỗi | USER_REPORTED | `7157a1b5-666d-4afa-a7a7-1ed6c06f001b` | NEEDS_REVIEW |
| `request_thay_ac_quy_ups` — Cần thay ắc quy UPS | USER_REPORTED | `8d5d6444-e9df-4820-ad93-1bbb1f659a98` | NEEDS_REVIEW |
| `symptom_kiem_tra_ups_khong_sac` — Kiểm tra UPS không sạc | USER_REPORTED | `961d1e53-6a5a-445b-99f9-9b9a2bb22540` | NEEDS_REVIEW |
| `symptom_kiem_tra_ups_khong_cap_dien` — Kiểm tra UPS không cấp điện | USER_REPORTED | `986d3d13-08f4-4020-a7ac-cac9c8df75cc` | NEEDS_REVIEW |
| `request_kiem_tra_cap_dien_du_phong` — Cần kiểm tra cấp điện dự phòng | USER_REPORTED | `b7d58e64-d073-46f8-9c42-4b743d3495d4` | NEEDS_REVIEW |

### Sàn nhà / Tường / Trần / Nội thất — `ee850727-ccde-4173-8b16-41e7be8065ca`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_ve_sinh_chan_tuong_va_len_tuong` — Cần vệ sinh chân tường và len tường | USER_REPORTED | `00266281-fe1f-4ba4-8343-7432e856db80` | NEEDS_REVIEW |
| `request_lam_sach_vet_ban_san` — Cần làm sạch vết bẩn sàn | USER_REPORTED | `0e2a53cf-4204-4316-815b-4c16d9dbff90` | NEEDS_REVIEW |
| `request_lau_san_go_theo_vat_lieu` — Cần lau sàn gỗ theo vật liệu | USER_REPORTED | `1b7489ca-5d5d-4f78-b12b-de3bb72716f9` | NEEDS_REVIEW |
| `request_lau_san_gach` — Cần lau sàn gạch | USER_REPORTED | `250cb1c7-1f3e-455d-8c38-f9734707ed88` | NEEDS_REVIEW |
| `request_hut_bui_goc_khuat` — Cần hút bụi góc khuất | USER_REPORTED | `4c85103d-041c-49f9-b26b-62f3899a9487` | NEEDS_REVIEW |
| `request_lau_tu_ke_ban_ghe` — Cần lau tủ / kệ / bàn ghế | USER_REPORTED | `4eb3e7ba-7eea-4a5f-8e8e-6a6122829b7c` | NEEDS_REVIEW |
| `request_lam_sach_be_mat_noi_that` — Cần làm sạch bề mặt nội thất | USER_REPORTED | `72b644a2-beb4-4997-b060-a4014f02aab0` | NEEDS_REVIEW |
| `request_ve_sinh_san_da` — Cần vệ sinh sàn đá | USER_REPORTED | `77cd2aa7-fe2d-4700-a736-624486e25094` | NEEDS_REVIEW |
| `request_phui_bui_tuong_tran_tai_vi_tri_an_toan` — Cần phủi bụi tường / trần tại vị trí an toàn | USER_REPORTED | `89778bb1-6ec3-470a-ab1a-8cff9c826437` | NEEDS_REVIEW |

### Đường ống cấp / thoát nước — `f27226de-570a-4c1e-84b5-dc419fe9c32e`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_sua_moi_noi_co_te` — Cần sửa mối nối / co / tê | USER_REPORTED | `1d65af27-42a9-4049-86f0-757a95ffc298` | NEEDS_REVIEW |
| `symptom_thong_tac_ong_thoat_nuoc` — Thông tắc ống thoát nước | USER_REPORTED | `67d739f0-012e-42f0-bceb-b8e19ca44883` | NEEDS_REVIEW |
| `request_kiem_tra_ap_luc_nuoc` — Cần kiểm tra áp lực nước | USER_REPORTED | `952392a4-147d-4621-80cc-dc1c5226bf5d` | NEEDS_REVIEW |
| `request_lap_van_khoa_van_mot_chieu` — Cần lắp van khóa / van một chiều | USER_REPORTED | `99955b07-551f-4e87-8b63-46ee82d6f925` | NEEDS_REVIEW |
| `request_cai_tao_duong_ong_cap_thoat` — Cần cải tạo đường ống cấp thoát | USER_REPORTED | `a3bb76bd-09c2-4ab6-bc0c-b467c99de011` | NEEDS_REVIEW |
| `symptom_thay_doan_ong_nut_vo` — Thay đoạn ống nứt / vỡ | VISUAL_OBSERVABLE | `be17d0af-feaf-4097-b1a9-4ef1ba2130ab` | NEEDS_REVIEW |
| `request_xu_ly_thoat_nuoc_cham` — Cần xử lý thoát nước chậm | USER_REPORTED | `c3316f8e-d92a-44df-a70b-edd2c8f96758` | NEEDS_REVIEW |
| `request_sua_duong_ong_am_tuong` — Cần sửa đường ống âm tường | USER_REPORTED | `c642c18a-34ee-4381-b7ac-786c8962dac1` | NEEDS_REVIEW |
| `symptom_do_tim_vi_tri_ro_nuoc` — Dò tìm vị trí rò nước | VISUAL_OBSERVABLE | `ceec2081-0a50-4ca9-91fe-3822552c7f61` | NEEDS_REVIEW |
| `symptom_sua_ong_cap_nuoc_ro_ri` — Ống cấp nước rò rỉ | USER_REPORTED | `e00f50aa-9ec2-4dbb-bd42-180bd2dd3f29` | NEEDS_REVIEW |
| `request_lap_dat_duong_ong_nuoc_moi` — Cần lắp đặt đường ống nước mới | USER_REPORTED | `eade3f4a-ff6f-49a7-97be-8375cd337685` | NEEDS_REVIEW |
| `request_xu_ly_mui_hoi_duong_thoat_duong_ong_cap_thoat_nuoc` — Cần xử lý mùi hôi đường thoát | USER_REPORTED | `eb69000c-319c-4a70-a816-716aba9bdac5` | NEEDS_REVIEW |

### Công tắc điện — `f2b5a73e-b1e3-45c2-97c1-a09015ad18b6`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_cong_tac_khong_hoat_dong` — Công tắc không hoạt động | USER_REPORTED | `00a5f8a1-29f9-4179-adc1-556cb7bad482` | NEEDS_REVIEW |
| `symptom_lap_cong_tac_cam_ung` — Lắp công tắc cảm ứng | USER_REPORTED | `02e898fb-5380-45a4-adc1-f8f7b5e66aae` | NEEDS_REVIEW |
| `symptom_lap_cong_tac_am_tuong_noi` — Lắp công tắc âm tường / nổi | USER_REPORTED | `1d295113-19d3-4538-9377-0d5f54229c20` | NEEDS_REVIEW |
| `symptom_sua_cong_tac_ket` — Công tắc kẹt | USER_REPORTED | `2fa06fc6-773d-451d-9262-96764e95c083` | NEEDS_REVIEW |
| `symptom_thay_cong_tac_hong` — Thay công tắc hỏng | USER_REPORTED | `6a35ba37-1f7d-4a10-a0f7-0eb20f96da47` | NEEDS_REVIEW |
| `symptom_sua_cong_tac_chap_chon` — Công tắc chập chờn | USER_REPORTED | `c42aff62-2f4a-4ded-98d8-b9e1070ed6da` | NEEDS_REVIEW |
| `symptom_sua_cong_tac_dieu_chinh_do_sang` — Công tắc điều chỉnh độ sáng | USER_REPORTED | `cb1af911-52a9-4e98-b622-ede6d8eb4b1a` | NEEDS_REVIEW |
| `symptom_lap_cong_tac_dieu_chinh_do_sang` — Lắp công tắc điều chỉnh độ sáng | USER_REPORTED | `cba7ec6a-5994-499e-8360-e0acc2e36743` | NEEDS_REVIEW |
| `symptom_di_doi_cong_tac` — Di dời công tắc | USER_REPORTED | `cf2faea4-d895-439f-8963-825e2192de75` | NEEDS_REVIEW |
| `symptom_sua_cong_tac_hai_chieu_cau_thang` — Công tắc hai chiều / cầu thang | USER_REPORTED | `ec131f57-26fa-40dc-bbe8-191fb60710ee` | NEEDS_REVIEW |

### Máy pha cà phê / Ấm siêu tốc — `f37e014f-c25d-4bcf-a5de-af804d32bd40`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `symptom_sua_may_ro_nuoc_may_pha_ca_phe_am_sieu_toc` — Máy rò nước | VISUAL_OBSERVABLE | `10d77d05-4de9-4bd7-bccb-a7c61ceba034` | NEEDS_REVIEW |
| `symptom_thong_tac_duong_dan_nuoc_khu_can` — Thông tắc đường dẫn nước / khử cặn | USER_REPORTED | `2fffa268-6c94-4bff-8c65-9f336ae346e4` | NEEDS_REVIEW |
| `symptom_sua_may_khong_len_nguon_may_pha_ca_phe_am_sieu_toc` — Máy không lên nguồn | USER_REPORTED | `309c183f-7dca-430f-86e8-b7a8f5b36061` | NEEDS_REVIEW |
| `symptom_sua_may_pha_ca_phe_khong_bom_nuoc` — Máy pha cà phê không bơm nước | USER_REPORTED | `5f1f7782-c0e4-4d06-afbb-3950be7af60b` | NEEDS_REVIEW |
| `request_thay_gioang_phin_loc` — Cần thay gioăng / phin lọc | USER_REPORTED | `712efbc1-4876-4aff-ac19-4cf27aca6f8d` | NEEDS_REVIEW |
| `request_sua_cong_tac_cam_bien_nhiet` — Cần sửa công tắc / cảm biến nhiệt | REQUIRES_TECHNICIAN_CHECK | `a7ca7fa7-63ac-4df7-b494-17804f96518e` | NEEDS_REVIEW |
| `symptom_sua_thiet_bi_khong_dun_nong` — Thiết bị không đun nóng | USER_REPORTED | `bd0a3bcc-c633-4924-a2cf-64ef4bb9294b` | NEEDS_REVIEW |
| `request_ve_sinh_va_bao_duong_may_pha_ca_phe_am_sieu_toc` — Cần vệ sinh và bảo dưỡng | USER_REPORTED | `f561dd5a-a7c2-43eb-80d0-9281cc3409bf` | NEEDS_REVIEW |

### Cây cảnh / Chậu cây — `fbcd5b31-5530-43ba-b35b-a32d25479477`

| Code / triệu chứng đề xuất | Kind | Service ID | Review |
|---|---|---|---|
| `request_thay_dat_thay_chau` — Cần thay đất / thay chậu | USER_REPORTED | `01a784ff-f8aa-432a-8ebc-a2a5ac939a66` | NEEDS_REVIEW |
| `request_bon_phan_cay_canh` — Cần bón phân cây cảnh | USER_REPORTED | `073cdbd5-174c-4bce-903a-c5c056c6923b` | NEEDS_REVIEW |
| `request_di_doi_chau_cay` — Cần di dời chậu cây | USER_REPORTED | `186052ea-884e-4f5b-93c1-127f2e8af5b6` | NEEDS_REVIEW |
| `request_xu_ly_vang_la_heo_cay` — Cần xử lý vàng lá / héo cây | USER_REPORTED | `3dc13f46-15c7-4e09-abed-d5aaee470bbf` | NEEDS_REVIEW |
| `request_trong_cay_moi` — Cần trồng cây mới | USER_REPORTED | `5e5d27a9-2a0f-4af5-bfe5-a651636e8a08` | NEEDS_REVIEW |
| `request_cat_tia_cay_canh` — Cần cắt tỉa cây cảnh | USER_REPORTED | `680b3bb8-5141-4d9d-9f72-02348605f34d` | NEEDS_REVIEW |
| `request_tao_dang_cay_canh` — Cần tạo dáng cây cảnh | USER_REPORTED | `8ce26311-a2a7-4ac9-9052-70aa0c8f3c60` | NEEDS_REVIEW |
| `request_kiem_tra_sau_benh` — Cần kiểm tra sâu bệnh | USER_REPORTED | `b1aff13c-4bc0-4e60-906f-dc4a859aea05` | NEEDS_REVIEW |
| `request_tuoi_va_cham_soc_dinh_ky` — Cần tưới và chăm sóc định kỳ | USER_REPORTED | `bd0b0b82-413c-4ca9-be98-5a9cd00e7c5f` | NEEDS_REVIEW |
| `request_co_dinh_chong_do_cay` — Cần cố định / chống đỡ cây | USER_REPORTED | `dfac09df-9437-43c4-90d2-a031eb238e51` | NEEDS_REVIEW |

