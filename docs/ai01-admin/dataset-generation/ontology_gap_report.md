# Khoảng trống ontology và điều kiện ánh xạ

Đối chiếu ontology bbox đang dùng: **`water_dripping`, `wet_surface`, `crack`, `burn_mark`, `water_spray`, `stain_or_discoloration`, `broken_part`, `surface_soiling`, `bird_droppings`, `leaf_debris`**. Không thêm/sửa ontology, YAML, DB hoặc model.

## Nhãn quan sát đề xuất chưa được phép dùng

**10 loại đề xuất**, liên quan **43 dịch vụ** (một dịch vụ có thể nhiều gap, không cộng các dòng thành tổng dịch vụ duy nhất). `ontology_gaps_proposed` trong service CSV chỉ là mã kế hoạch, không phải sign_label.

| Mã đề xuất nội bộ | Quan sát | Giới hạn cần duyệt | Số dịch vụ liên quan |
|---|---|---|---:|
| `exposed_conductor` | Lõi dẫn lộ ở đoạn lẽ ra phải có cách điện | Phân biệt đầu nối đúng thiết kế, dây tiếp địa trần và ảnh không rõ lớp vỏ; không thay bằng crack. | 1 |
| `loose_or_misaligned_part` | Chi tiết lệch hoặc lỏng nhìn thấy | Độ lỏng cơ học thực sự thường cần thao tác; ảnh chỉ chứng minh lệch/khe hở, không chứng minh tiếp xúc điện kém. | 5 |
| `standing_water` | Vũng nước đọng | wet_surface chỉ mô tả bề mặt ướt; ảnh đơn không chứng minh tắc hoặc tốc độ thoát. | 2 |
| `frost_or_ice` | Lớp băng/tuyết nhìn thấy | Không suy thiếu gas/hỏng bộ xả đá; cần hỏi chế độ và vị trí. | 3 |
| `display_error_code` | Mã lỗi trên màn hình | Cần OCR + hãng/model + tài liệu kỹ thuật; ảnh synthetic chữ sai phải loại, không làm GT OCR. | 12 |
| `plant_discoloration_or_wilting` | Lá vàng/héo nhìn thấy | Không suy sâu bệnh hoặc thiếu dinh dưỡng từ một ảnh. | 1 |
| `overgrown_vegetation` | Cỏ/cành phát triển quá phạm vi | Cần chuẩn đo mức độ và nhu cầu chủ nhà; không tự coi cây khỏe là lỗi. | 7 |
| `waste_or_clutter` | Rác hoặc đồ cần thu gom/sắp xếp | Phân biệt đồ dùng còn sử dụng; cần xác nhận chủ sở hữu. | 5 |
| `scale_deposit` | Cặn bám quan sát được | Phân biệt màu vật liệu/bọt/phản sáng; surface_soiling không tự phân loại cặn hóa học. | 5 |
| `leaning_tree` | Cây nghiêng nhìn thấy | Góc chụp không xác nhận nguy cơ đổ; đội chuyên môn khảo sát kết cấu/rễ/đất. | 2 |

Không thay các nhãn này bằng class gần nghĩa để vượt validator. Ảnh có quan sát chưa hỗ trợ giữ ngoài lô positive v1 cho nhãn đó; có thể chỉ dùng bbox object trong một quy trình đã duyệt khi mọi sign chưa gán được ghi nhận và không được tính negative/none_visible. Không tạo những ảnh đó ở quota positive hiện tại.

## Lỗi không giải quyết bằng bbox mới

Mất điện, dòng rò, ngắn mạch, quá tải, điện áp, điện trở tiếp địa, mất kết nối, thời gian sạc, lạnh/nóng yếu, không chạy/không vắt, áp lực nước, mùi hôi/gas, tiếng kêu, lỗi cảm biến/bo mạch không có quan sát ảnh chắc chắn. Cần hỏi người dùng, video/audio/đo lường hoặc thợ khảo sát phù hợp. Không thêm class `no_power`, `electrical_short`, `gas_leak`, `needs_replacement` từ ảnh để thay xác minh. Khói/lửa synthetic cũng không làm bằng chứng nguyên nhân.

## Khoảng trống catalog triệu chứng

DB snapshot có 0 symptom và 0 liên kết symptom-service. Tất cả 693 dịch vụ vẫn cần quy trình xây/duyệt triệu chứng và mapping thực tế trước gợi ý qua approved visual/symptom catalog. Nhánh lựa chọn thủ công và legacy SYMPTOM_RULES (khi catalog flag tắt, người dùng xác nhận) là các luồng khác, không bị tuyên bố đã tắt. Câu hỏi trong CSV chỉ là nội dung đề xuất, không phải symptom ID hay quyền khởi tạo DB. Không suy VISUAL_OBSERVABLE hoặc APPROVED từ tên dịch vụ. Quan sát thuộc ontology cũng chưa tự có liên kết được duyệt cho mọi target.

## Khoảng trống phạm vi object và package

Các target hệ thống/khu vực chưa có định nghĩa một bbox vật thể thống nhất trong kế hoạch, nên HOLD_BBOX_SCOPE:

- `khu-vuc-bep-thiet-bi-bep-ben-ngoai` — Khu vực bếp / Thiết bị bếp bên ngoài.
- `van-phong-cua-hang` — Văn phòng / Cửa hàng.
- `he-thong-dien-toan-nha` — Hệ thống điện toàn nhà.
- `kiem-tra-khao-sat-su-co-dien` — Kiểm tra / Khảo sát sự cố điện.
- `nha-ve-sinh-phong-tam` — Nhà vệ sinh / Phòng tắm.
- `cua-kinh-cua-so-ban-cong` — Cửa kính / Cửa sổ / Ban công.
- `nguon-cap-cho-thiet-bi-co-dinh` — Nguồn cấp cho thiết bị cố định.
- `tiep-dia-chong-set` — Tiếp địa / Chống sét.
- `he-thong-tuoi-san-vuon-tong-the` — Hệ thống tưới / Sân vườn tổng thể.
- `he-thong-dien-phong` — Hệ thống điện phòng.
- `nha-o-can-ho` — Nhà ở / Căn hộ.
- `be-tu-hoai-ho-ga-cong-thoat` — Bể tự hoại / Hố ga / Cống thoát.
- `san-nha-tuong-tran-noi-that` — Sàn nhà / Tường / Trần / Nội thất.

Cần người phụ trách quyết định: giữ nhận diện ngữ cảnh cấp ảnh, chọn đối tượng vật lý đại diện có phạm vi rõ, hoặc thiết kế ontology/phân cấp mới qua task riêng. Không gán bbox cả ngôi nhà thành hệ thống điện. Một số target gộp nhiều subtype (ví dụ adapter/bộ nguồn) cần guideline bao phần vật thể tương ứng trước khi chạy lô.

V1 bắt buộc target_id và một loại sign_label mỗi ảnh, chưa có đường import trung lập cho ảnh hoàn toàn OOS/đa dấu hiệu. Manifest đánh route riêng, không tạo target giả hoặc làm mất nhãn. Các khoảng trống này không tự được giải quyết bằng generation.

## Khoảng trống liên kết không gian giữa nước và vật thể

water_dripping/water_spray có thể nằm ngoài bbox vật thể nguồn, trong khi detector/resolver hiện yêu cầu containment ≥0,8 vào đúng một object. Các scenario này ghi REQUIRES_SPATIAL_REVIEW_WATER_OUTSIDE_OBJECT. Có thể tạo quan sát hợp lệ cho review, nhưng chưa mặc định dùng được cho service suggestions. Không nới hoặc bóp bbox để ép containment; cần review chính sách liên kết không gian trong task riêng nếu không tương thích.

## Quy trình xử lý đề xuất sau này

1. Chuyên gia xem ví dụ thật, định nghĩa quan sát, ranh giới, negative/dễ nhầm và phạm vi object.
2. Kiểm thử độ nhất quán giữa người gán nhãn; chốt semantics và khả năng hỏi người dùng.
3. Trong task được cho phép riêng: cập nhật ontology/catalog/mapping, review API/export/training/runtime compatibility và version.
4. Chỉ sau đó mới thêm code được duyệt vào names/sign_label; lưu revision và làm lại manifest. Lượt này không thực hiện các thay đổi đó.
