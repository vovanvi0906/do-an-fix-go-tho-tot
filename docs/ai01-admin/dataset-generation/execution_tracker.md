# Theo dõi thực thi kế hoạch tạo dataset

Cập nhật 25/11/2026. Tài liệu kế hoạch, chưa khởi chạy generator, không tạo ảnh/ZIP, không train/deploy, không đổi DB hoặc gate.

## Bằng chứng đã có

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Catalog và dịch vụ DB | READ_ONLY_SNAPSHOT_DONE | 6 categories / 70 targets / 693 services; thời điểm trong MASTER |
| Coverage mapping | CONFIG_CHECKED | 693/693 service ID xuất hiện đúng một lần, ID/slug/quan hệ khớp DB |
| Symptom/links runtime catalog | BLOCKED_EMPTY_CATALOG | 0 symptoms / 0 links; chưa thể auto suggest |
| Ontology bbox | READ_AND_MATCHED | 10 code; snapshot tài liệu khớp artifact quality |
| Candidate inventory | METADATA_SCAN_DONE | 21437 prepared rows, SHA pin records/mapping khớp; chưa xác minh nguồn/quyền/ảnh đầy đủ |
| Manifest/prompt | CONFIG_CHECKED | 474 scenario rows / 2844 prompt rows / 13340 ảnh mục tiêu |
| Sinh ảnh mới | NOT_STARTED | 0 output, chưa có prompt thực tế/tool/date/source/rights/sha256 mới |
| Bbox mới | NOT_STARTED | Không tạo tọa độ mẫu hoặc claim confirmed |
| ZIP mới / validator | NOT_RUN_NO_ZIP | Không có ZIP mới để chạy validate_fixgo_dataset.py; không ghi PASS giả |
| Backend preview/import | NOT_STARTED | Không nhập vào state thực |
| Training/evaluation/deploy | NOT_STARTED | Không chạy hoặc bật tính năng |

## Các bước phải hoàn tất theo thứ tự

| Bước | Công việc | Ưu tiên | Điều kiện chuyển tiếp | Trạng thái | Người phụ trách thực tế |
|---|---|---|---|---|---|
| 1 | Chuyên gia duyệt assessment/questions từng service; tách điều kiện kỹ thuật khỏi ảnh | P0 | 693 dòng được review với nguồn quyết định, xử lý bất đồng | PENDING | Chưa chỉ định |
| 2 | Rà ảnh ổ cắm đã có và 20 ảnh cũ, provenance/crop/collage và quyền/prompt gốc | P0 | Danh sách tái sử dụng hợp lệ và quota revision được duyệt | PENDING | Chưa chỉ định |
| 3 | Chốt công cụ/model tạo thực tế, quyền đầu ra và lưu bằng chứng nguồn | P0 | Có căn cứ thật, không điền tool/date/rights phỏng đoán | PENDING | Chưa chỉ định |
| 4 | Chốt bbox scope cho 13 target hệ thống/khu vực, subtype guidelines | P1/P2 | Hướng dẫn annotation có người chịu trách nhiệm; còn hold thì chưa chạy | BLOCKED_SCOPE | Chưa chỉ định |
| 5 | Chỉ định người gán/kiểm, nơi lưu nhật ký và scene/reference registry | P0 | Có luồng actual prompt/output/source/group và QA | PENDING | Chưa chỉ định |
| 6 | Tạo pilot ổ cắm ≤20 ảnh mỗi lô, normal/hard-negative/burn_mark trước | P0 | Bước 2,3,5 hoàn tất; mỗi ảnh qua visual QA | NOT_STARTED | Chưa chỉ định |
| 7 | Đo bbox object/sign hoặc chuyển not_annotated; giữ unreviewed | P0 | Không dùng tọa độ đoán; label đúng ontology | NOT_STARTED | Chưa chỉ định |
| 8 | Đóng ZIP đúng 18 cột, hash byte ảnh, cap thực tế; chạy validator | P0 | Exit 0 + report/ZIP hashes thật; backend duplicate/reference check | NOT_STARTED | Chưa chỉ định |
| 9 | Import quarantine và review từng ảnh trước export | P0 | Rights/source/group và object/sign qua gate hiện tại | NOT_STARTED | Chưa chỉ định |
| 10 | Mở rộng P1 phần điện, sau đó P2 theo review pilot | P1/P2 | Không tăng số ảnh để né chất lượng hoặc nhóm | NOT_STARTED | Chưa chỉ định |
| 11 | Task riêng xây/duyệt symptom-service catalog, giải quyết ontology gaps | P0 cho routing | Có yêu cầu riêng cho thay đổi DB/code/ontology, không thực hiện trong kế hoạch này | BLOCKED_ROUTING | Chưa chỉ định |
| 12 | Thu validation/test thật độc lập, quyền, nhãn và scene split | Trước training/eval | Không synthetic trong test; không source overlap | PENDING_REAL_DATA | Chưa chỉ định |

## Cách cập nhật trạng thái khi thực hiện thật

Mỗi output cần nhật ký riêng với generation_id, actual prompt, source/output/reference IDs, actual tool/model/date, rights/evidence, QA/reviewer, source component/group, final filename/sha256 và lý do loại nếu có. Không đặt người duyệt, ngày sinh ảnh hoặc quyền trước khi xảy ra. Một dòng kế hoạch lặp nhiều lượt phải có nhiều record output riêng.

Mỗi ZIP sau này cần: ZIP hash, số ảnh/byte/expanded/entries, catalog+ontology revisions, lệnh validator/exit code/report hash, crossInventoryChecked và backend preview evidence; số imported/duplicate/rejected thật. Import-ready và training-eligible ghi riêng theo từng ảnh/export. Không ghi completed dựa trên target quota.

## Tổng quota và cách đọc

- Tổng 13340 ảnh, gồm 7892 thuộc Sửa điện (kể cả OOS); số có thể tiến tới v1 sau các gate 11040, số hold scope 2156, OOS ngoài v1 144.
- Quota chưa trừ ảnh cũ chưa xác minh; không cộng số inventory lặp theo scenario/variant.
- generation_plan chia 6 góc/bối cảnh cho mỗi manifest, tổng requested_images khớp target_images; không cam kết đó là 6 nhóm cảnh độc lập.
- Không dùng CSV kế hoạch để upload; các trường dữ kiện runtime trống là chủ ý.
