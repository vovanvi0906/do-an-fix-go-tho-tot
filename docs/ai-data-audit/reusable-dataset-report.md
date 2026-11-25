# Khả năng tái sử dụng dataset

## Kiểm kê chuẩn hóa trên nguồn hiện có

21.437 raw,1.200 classification,40ZIPentries(20uniqueSHA) và3uploads; CSV có22.680dòng. Raw kiểm lại tất cả file SHA, dimensions, decoder, pixel/pHash và TXT. Source có cả bbox lẫn polygon; không gọi toàn bộ là bbox gốc. BBox/Polygon giữ raw normalized coordinates, không chuyển bbox vùng lỗi thành toàn thiết bị. Định dạng thống nhất JSON trong ô CSV giúp local reviewer sử dụng nhưng không ghi lại TXT/raw.

| Nguồn raw | Ảnh | Source/license claim |
|---|---|---|
| dienlanh | 254 | Roboflow YAML khai CC BY4.0; UNVERIFIED rights/attribution |
| giupviec | 1155 | Roboflow YAML khai CC BY4.0; UNVERIFIED rights/attribution |
| lamvuon | 4950 | Roboflow YAML khai CC BY4.0; UNVERIFIED rights/attribution |
| suadien | 11204 | Roboflow YAML khai CC BY4.0; UNVERIFIED rights/attribution |
| suanuoc | 2815 | Roboflow YAML khai CC BY4.0; UNVERIFIED rights/attribution |
| thietbigiadinh | 1059 | Roboflow YAML khai CC BY4.0; UNVERIFIED rights/attribution |

Cả6source YAML đều khai CC BY4.0, nhưng chưa có xác minh hồ sơ quyền/attribution từng ảnh, contributor và điều kiện nguồn. Không báo license approved. `source_claim_json` giữ workspace/project/version/url và declaration; image-level captured date, generator/prompt và consent không được bịa.

Raw21.437 chưa xác định ảnh thực/synthetic theo bằng chứng cá thể; classification1.200 có evidence generator OpenCV và đặc trưng fixture nhưng không khẳng định full lineage một run cụ thể. ZIP20unique khai synthetic;3uploads khai own_photo chưa xác minh capture/rights. TXT nguồn empty.txt được kiểm riêng; một ảnh có latest admin review confirmed2boxes, rightsVerified=false. CSV giữ existing_admin_boxes_json/status và SHA match tách khỏi annotation gốc; không phủ nhận annotation đã lưu hoặc tự nâng nó thành independent GT. Không dùng tên file hoặc model để phân biệt real/synthetic.

## Vai trò ứng viên (có thể overlap)

| Nhóm | Entries tất cả | Raw source | Ý nghĩa |
|---|---|---|---|
| Object Recognition | 22246 | 21203 | candidate target/category, chưa GT |
| Object Detection | 11666 | 11665 | whole-object bbox candidate sau semantic policy, chưa extent/rights verified |
| Defect Classification | 1017 | 1016 | có tag sign nguồn trực tiếp, không suy lỗi vận hành |
| Defect Detection | 1017 | 1016 | box/polygon vùng sign nguồn cần đối chiếu pixel/target |
| Normal/Negative | 0 | 0 | chưa có ảnh được xác minh quan sát âm; không dùng TXT rỗng |
| Out-of-scope | 716 | 516 | claim/static mapping/layout candidate, cần người xem |
| Unknown/Needs Review | 22680 | 21437 | mọi source còn thiếu rights/semantic review |
| Duplicate | 4196 | 3157 | phash/exact candidate membership; không tự xóa |
| Unusable | 0 | 0 | decoder/policy lỗi kỹ thuật được ghi rõ |

**11665 raw whole-object region candidate images (bbox hoặc polygon)** sau policy, trải trên5target; chưa phải số verified training-eligible. Prepared từng đánh ObjectDetection13.086 nguồn, nhưng vùng lỗi plumbing non-faucet bị giữ review trong audit mới thay vì tự dùng làm bbox cả vòi/chậu/ống/bồn cầu. `prepared_tasks_json` giữ quyết định cũ để đối chiếu, `practical_object_bbox_candidate` ghi policy audit mới.

Ngoài full-image policy, có **11955 ảnh với 12030 vùng nguồn riêng lẻ có thể cứu để người kiểm xem**. Cột object_box_reuse_candidates_json ghi đúng source_annotation_index và target ứng viên cho OUTLET, AC subtype, refrigerator, washing_machine hoặc faucet. Ảnh có cả faucet và leaking_pipe không bị bỏ toàn ảnh: giữ vùng faucet như candidate riêng; vùng leaking_pipe không tự trở thành cả ống. Nếu nguồn là polygon, candidate_enclosing_xyxy chỉ là min/max từ tọa độ polygon đã có, ghi geometry_transform rõ ràng; không bịa tọa độ hoặc sửa polygon gốc, không coi là bbox đã được người kiểm xác nhận. Không tự xuất tập object-only bỏ qua vật thể khác chưa xem hoặc tính negative từ các nhãn không lấy.

Leaf annotations không là bbox toàn cây; Dirt/Birdpoop/Leaf trên bề mặt chưa chốt target inverter/panel hay sàn. Caption/source class disease không đủ xác nhận nguyên nhân hay bệnh. Ngoại hình thiết bị không chứng minh lỗi chức năng. 148emptyTXT không tự là normal.

## Điều kiện trước tái sử dụng

1. Kiểm nguồn/quyền/attribution thật và ghi bằng chứng; không xác nhận theo YAML hoặc dự đoán AI.
2. Người xem pixel chốt target/extent, sign quan sát được, normal/OOS; sửa label ở proposal/copy mới, giữ source immutable.
3. Review exact/near/conflicting labels/source-family groups; không xóa ảnh để giải quyết leakage.
4. Kiểm actual training/tuning exposure; giữ development và independent test riêng. Không phát hành test từ nhóm model đã dùng.
5. Muốn vào training vẫn qua FixGo review/export gates hiện hành, đúng audit/hash/revision/owner; local proposals không thay gate. Synthetic không vào real benchmark/test.

## Phạm vi tìm kiếm và các bản sao

Đã tìm185data-related directories trong repo và ~/Work/datasetai; ledger thư mục ghi số ảnh/annotation/manifests. Prepared/trial/benchmark copies và training plots không làm tăng số source độc lập. Screenshots/UI assets không tự thành dữ liệu gán nhãn; Face/PAD giữ riêng, không duyệt danh tính hoặc dùng ảnh mặt làm incident training. Hai ZIP đọc tại chỗ từ Downloads, không rewrite archive. Cloud-only assets không tải hàng loạt.

Không tìm thấy cơ sở để ghi một con số “đã verified usable/normal/defect” toàn kho; các cột đó NOT_ASSESSED/NOT_ESTABLISHED. Con số candidate không được dùng thay cho chất lượng hoặc quyền. Catalog snapshot6categories/70targets/693services giữ riêng ở evidence.
