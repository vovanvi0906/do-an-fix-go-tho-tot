# FixGo AI-01 — Master Dataset Generation Plan

Ngày lập: 25/11/2026. Phạm vi: kế hoạch và cấu hình; chưa sinh ảnh, chưa gán bbox, chưa tạo ZIP, không train/deploy hoặc thay DB/model/raw.

## Kết quả đối chiếu thực tế

- DB PostgreSQL local đọc bằng transaction READ ONLY / RepeatableRead lúc `2026-11-25T01:39:28.908Z`: **6 danh mục, 70 đối tượng, 693 dịch vụ**. Mapping đủ **693/693**, theo service ID, không suy dịch vụ từ tên đối tượng.
- DB hiện có **0 symptom** và **0 symptom-service link**. Vì vậy **693 dịch vụ chưa có liên kết được duyệt**; mapping trong CSV là đề xuất biên tập để người phụ trách duyệt sau, không có hiệu lực routing. Tạo ảnh không khắc phục thiếu catalog triệu chứng. Điều này chặn đường approved visual/symptom catalog; không khẳng định đường chọn thủ công hoặc legacy rules cũng bị tắt.
- Ontology bbox thực tế: 10 code, so khớp snapshot tài liệu. Danh sách cấp ảnh/display rộng hơn KHÔNG phải quyền thêm class bbox.
- Manifest: **474 kịch bản**, **13,340 ảnh mục tiêu**; Sửa điện **7,892** (gồm đối chứng OOS), ưu tiên P0 ổ cắm rồi P1 phần điện còn lại. Đây là gross quota đề xuất, chưa trừ ảnh ứng viên chưa xác minh.
- **11,040 ảnh thuộc nhóm có thể đóng gói v1 sau khi hoàn tất provenance/QA**; **2,156 ảnh giữ chờ định nghĩa bbox khu vực/hệ thống**; **144 ảnh ngoài phạm vi** chỉ ở kho đối chứng development riêng. Hiện tại **0 ảnh mới được tạo, 0 ZIP mới import-ready**.
- 10 loại khoảng trống ontology đề xuất; 43 dịch vụ có ít nhất một khoảng trống. Không ghi các code đề xuất vào YAML/metadata. Lỗi vận hành vô hình là khoảng trống modality/triệu chứng, không giải quyết bằng bịa class bbox.

## Các file và ý nghĩa

| File | Khóa / mức chi tiết | Cách sử dụng |
|---|---|---|
| service_ai_mapping.csv | service_id, đúng một dòng mỗi dịch vụ | Xem khả năng ảnh, dấu hiệu đề xuất, câu hỏi, điều kiện gợi ý và khảo sát |
| dataset_manifest.csv | manifest_id, một đối tượng × bucket × dấu hiệu | Quota, ưu tiên, số ứng viên cũ, trạng thái hold và đường đóng gói |
| generation_plan.csv | generation_id, manifest × biến thể bối cảnh | Prompt đã viết riêng cho từng kịch bản; số lượt tạo; ô dữ kiện thực tế còn trống |
| ontology_gap_report.md | loại nhãn đề xuất / modality / scope | Không có thay đổi ontology hoặc DB |
| quality_acceptance_criteria.md | các gate và tiêu chí đề xuất | Tách import-ready, training-eligible và đánh giá mô hình |
| execution_tracker.md | công việc / bằng chứng / trạng thái | Theo dõi các bước chưa thực hiện, không đánh dấu hoàn tất giả |

CSV UTF-8 dùng quote chuẩn; các ô danh sách là JSON array. CSV kế hoạch KHÔNG phải metadata.csv import. `sign_label` trống nghĩa là chưa đề xuất dấu hiệu, không phải chứng nhận ảnh âm. `related_service_ids` chỉ liên quan để rà soát; không là label training hay liên kết routing được duyệt.

## 1. Luồng bằng chứng và giới hạn nhận diện

Ảnh → nhận diện category/target và bbox đối tượng → quan sát dấu hiệu bbox → triệu chứng đã được duyệt đúng target → liên kết dịch vụ được duyệt → người dùng xác nhận → thợ/người thực hiện kiểm tra trước khi quyết định. Không train 693 dịch vụ như 693 class ảnh, không suy bệnh/linh kiện cần thay từ một vết bẩn hoặc dấu xém.

`visual_detector.py` yêu cầu manifest model có evaluation được duyệt, checksum weights/report và object+sign classes; không dùng CLIP/tên file để bịa fault box. `visual-service-resolver.js` chỉ dùng bằng chứng của ảnh hiện tại, cần sign nằm trong đúng một object với containment ≥0,8, cùng category/target, confidence đạt cấu hình (mặc định 0,75), modelVersion và weights hash hợp lệ. Triệu chứng phải `VISUAL_OBSERVABLE`, active/APPROVED và có code trùng dấu hiệu; liên kết active/APPROVED đúng target. Tối đa 3 gợi ý; luôn cần người dùng xác nhận và kiểm tra.

Không kiểm tra trạng thái tiến trình đang chạy hoặc bật flag trong lượt này. Các flag detector/suggestions/symptom-catalog và model/evaluation manifest phải được đối chiếu ở môi trường triển khai về sau; CSV không tự bật tính năng. Các ngưỡng trên là mã hiện hành, không phải kết quả hiệu năng đã đạt.

### Phân loại 693 dịch vụ trong kế hoạch

| Nhóm đánh giá đề xuất | Số dịch vụ |
|---|---:|
| CONTEXT_ONLY_SCOPE_REVIEW | 125 |
| ONTOLOGY_GAP_OR_OTHER_MODALITY | 36 |
| USER_REPORT_OR_TECHNICIAN_MEASUREMENT | 299 |
| USER_REQUEST_AND_COMPATIBILITY | 176 |
| VISIBLE_CANDIDATE_NEEDS_CONFIRMATION | 57 |

Mọi dấu hiệu/câu hỏi trong mapping là đề xuất của kế hoạch từ tên và phạm vi dịch vụ, cần chuyên gia rà soát từng dòng. Không có liên kết DB hiện hữu để mượn làm ground truth. Câu hỏi đề xuất chưa phải symptom code chính thức; không ghi chúng vào bảng runtime. CSV có legacy_symptom_rules cho các service code khớp chính xác SYMPTOM_RULES hiện hành; nhánh legacy chỉ dùng khi catalog flag tắt và người dùng đã xác nhận triệu chứng. Người dùng vẫn có thể chọn dịch vụ thủ công đúng target. Các nhánh đó không chứng minh visual-service mapping đã được duyệt. Có 13 dịch vụ khớp legacy rules trong snapshot; không mở rộng các rule đó bằng suy luận.

## 2. Dữ liệu đã có và cách tính quota

Đọc 21437 record prepared; SHA records và normalized-mapping khớp manifest pin. Có 14 target xuất hiện trong objectCandidates. Số `existing_prepared_candidate_records` đếm mỗi image ID một lần mỗi target; `existing_candidate_distinct_pixels` là đếm pixel hash, không phải số thiết bị độc lập. `existing_candidate_groups` là leakageGroup đã có, chưa chứng minh độc lập thực tế. `existing_ambiguous_candidate_records` ghi candidate cùng row có nhiều target. Các số này lặp ở nhiều kịch bản của cùng target và **không được cộng dồn** như ảnh mới.

`existing_sign_candidate_records` đếm tag nguồn có code khớp, không chứng minh dấu hiệu thật hoặc bbox cùng object. Số 0 nghĩa là không tìm thấy tag trong nguồn đã quét, không khẳng định kho không có ảnh phù hợp bằng mắt. `existing_uploaded_records` đọc metadata journal riêng, kiểm hash chain; không cộng vào prepared rồi coi là tập rời nhau. Không xác minh lại toàn bộ byte ảnh raw, quyền, review hoặc export trong lượt lập kế hoạch; training-eligible ghi `NOT_ASSESSED`, không ghi 0/đủ từ candidate.

Giữ `reuse_credit_applied=0`: mục tiêu là số ảnh mới tối đa dự kiến, chưa trừ ứng viên cũ. Sau khi người xem xác nhận ảnh/rights/scope/leakage, lập revision quota có căn cứ để giảm lượng tạo; không tự tuyên bố thiếu chính xác bao nhiêu ảnh chỉ từ nguồn candidate. Bộ 20 ảnh cũ vẫn cần bổ sung provenance như báo cáo trước, không tự cộng là 20 ảnh đã duyệt.

## 3. Ưu tiên và lịch thực hiện theo gate

1. P0: ổ cắm điện — kiểm lại 20 ảnh cũ, nhóm collage/crop; pilot tối đa 20 ảnh/lô, bắt đầu bình thường/dễ nhầm và burn_mark; sau pilot mới crack/broken_part/bụi. Không tạo lại ảnh có thể tái sử dụng hợp lệ.
2. P1: các target Sửa điện có vật thể cụ thể; mỗi lần một target và một dấu hiệu, review từng lô trước lô tiếp. Các hệ thống/phòng/khảo sát có `HOLD_BBOX_SCOPE`: chỉ lập prompt dự kiến, không thực thi cho đến khi người phụ trách chốt phạm vi bbox.
3. P2: các danh mục còn lại theo dữ liệu thiếu đã xác minh; không tạo ảnh biểu diễn điện áp, tiếng ồn, mùi, áp lực, mất mạng hoặc lỗi vô hình.
4. Đối chứng normal_visible/hard_negative/operational_lookalike đi cùng ảnh lỗi. Không coi ngoại hình nguyên vẹn là hoạt động tốt. OOS không có target hợp lệ được giữ ngoài importer v1.
5. Mỗi lô được đo thực tế byte/entry/ratio, QA ảnh → đo bbox hoặc chờ gán → provenance → validator → backend preview → review/gate; trạng thái chỉ tiến khi có bằng chứng.

Không đặt ngày bắt đầu giả. Phụ thuộc hoàn thành ở execution_tracker.md; chưa có model/generator thực tế, quyền hoặc người kiểm được chỉ định cho lượt sinh mới.

## 4. Generation protocol và nguồn/cảnh

Mỗi dòng generation_plan có prompt cụ thể cho đối tượng/dấu hiệu/góc/nền và quota. Gửi **một ảnh mỗi request** rồi lặp theo requested_images; nếu cần sửa prompt, lưu chính xác prompt cuối cùng đã gửi và lịch sử sửa. `prompt_template` là kế hoạch, không được chép sang metadata như prompt thực tế khi đã thay đổi.

Sau từng output tạo một record nhật ký ngoài ZIP: generation_id, output ID/path, prompt thực tế đầy đủ, công cụ/model thực tế, thời điểm có căn cứ, seed/reference IDs nếu biết, đường dẫn hội thoại/lượt tạo, scene/source family, quyền và bằng chứng thực, quyết định QA và người kiểm. Các ô `actual_*`, generator/date/rights đang trống có chủ ý; một dòng kế hoạch có nhiều output phải tách thành nhiều record nhật ký, không nhét nhiều ảnh vào một metadata row. Khi đóng gói, metadata.csv là nguồn chính duy nhất; nhật ký là bằng chứng lịch sử riêng, không thêm metadata JSONL vào ZIP.

Không tạo group_key từ generation_id/filename đơn thuần. Xây liên thông nguồn: cùng ảnh tham chiếu, collage, crop, edit, góc/biến thể cùng thiết bị/cảnh → chung group xuyên ZIP; nếu chưa chắc giữ chung nhóm bảo thủ và chờ kiểm. Mã nhóm chỉ cấp sau khi biết nguồn/cảnh thực tế, có namespace ổn định. Số `minimum_planned_independent_scenes` là mục tiêu đa dạng, **không phải cam kết đã độc lập**. Không chia cùng nguồn sang val/test để đủ chỉ tiêu.

## 5. Quy trình bbox và đóng gói v1

Người gán nhãn xem ảnh cuối sau QA, xác định target/scope rồi vẽ bbox phần vật thể nhìn thấy, vẽ riêng vùng dấu hiệu có bằng chứng. Không dùng bbox mẫu cố định hoặc suy tọa độ từ prompt. Chưa đo được thì `not_annotated` và bỏ TXT; đã đo thì `proposed` và YOLO TXT, vẫn `unreviewed`. Reviewer FixGo kiểm cả box, quan sát, quyền, nguồn và nhóm.

Mỗi ZIP gốc gồm metadata.csv + data.yaml + images/ + labels/ nếu có. Đúng **18 cột**:

```csv
filename,category_id,target_id,object_label,sign_label,source_type,source_reference,rights_type,rights_evidence,rights_status,generator_tool,generated_at,prompt,group_key,review_status,bbox_status,split,sha256
```

Dùng ID/slug từ mapping hiện hành, code chỉ thuộc ontology hiện tại; YAML chỉ có fixgo_package_version/path/train/nc/names. Class liên tục 0-based, target slug và code sign, không service code hoặc nhãn gap. Mỗi ảnh tối đa một loại target và một loại sign theo v1; nếu nhiều loại dấu hiệu cần đưa vào hold/đề xuất phiên bản sau, không xóa dấu hiệu thật để tạo ảnh âm giả. Không gán target_id cho đồ ngoài phạm vi. Không xuất CSV kế hoạch thành metadata upload.

SHA-256 chỉ tính từ byte ảnh cuối sau mọi crop/edit/transcode; chưa có ảnh nên chưa có hash, filename, ngày, tool hoặc rights thực. `source_type=synthetic_ai`, `rights_status=declared_unverified`, `review_status=unreviewed`, `split=unassigned`. Không tự xác minh quyền hoặc công nhận bbox của ChatGPT.

Backend mặc định: 200 ảnh/ZIP, upload 64 MiB, expanded 256 MiB, 10 MiB/file, 2.000 entries, ratio≤100; cạnh 32–8192 px, ≤25 MP, giữ 2 GiB đĩa trống. Planner chọn **≤20 ảnh/lô**; đây là cap vận hành đề xuất, không bảo đảm byte hợp lệ. Trước thực thi phải đọc `/api/admin/ai01/dataset/limits` theo route controller và giá trị modal/env thực tế; dùng min(cap kế hoạch, giới hạn server), chia tiếp nếu ZIP vượt byte/expanded/entry. Không giảm chất lượng ảnh để ép vượt gate. Chưa xác nhận giới hạn runtime của tiến trình live trong lượt này.

Trước bàn giao **mỗi ZIP có ảnh thật được tạo**, bắt buộc chạy:

```bash
ai-service/.venv/bin/python -B server/scripts/ai01/validate_fixgo_dataset.py /path/to/batch.zip --catalog /path/to/current-catalog.json --ontology /path/to/current-ontology.json --report /path/to/validation-report.json
```

Truyền thêm `--inventory` và `--references` bằng snapshot tin cậy nếu có; nếu không, kết quả crossInventoryChecked=false và phải chờ backend kiểm toàn kho/tập bảo vệ. Exit 0 chỉ preflight, chưa đủ training. Ghi lại lệnh/exit code/report hash/ZIP hash thật; không tự ghi PASS. Hiện không có ZIP mới nên validator **NOT_RUN_NO_ZIP**, không tạo ảnh giả để kiểm thử thay thế nhiệm vụ chỉ lập kế hoạch.

## 6. Training/evaluation

Synthetic hiện được importer đưa vào development **train**; không tự tạo val/test trong YAML gói. Validation cần nguồn phát triển độc lập đã kiểm, không cùng source component; synthetic không được trộn vào test thực tế độc lập. Min code hiện tại mỗi class ≥20 train, ≥5 val, ≥2 nhóm train/≥1 val, ≥5 ảnh âm train/≥2 val; không thay ngưỡng. Quota ảnh không thay thế nguồn val có quyền, confirmed review và export có audit đúng revision.

Pipeline trial hiện có CLI tập trung một `--target-slug` (mặc định ổ cắm) và `--signs` mặc định burn_mark/crack. Chạy nhiều target cần kế hoạch trial riêng theo scope/classes, không coi manifest 70 target là dataset đã được pipeline train trực tiếp. Runtime detector manifest giới hạn 2–100 class, khác giới hạn import 200; không gộp toàn kế hoạch thành một model mặc định, không tự sửa exporter/model config trong lượt này.

Đánh giá đối tượng, dấu hiệu và gợi ý dịch vụ tách riêng; đo trên ảnh thật độc lập và tập câu hỏi được duyệt theo quality_acceptance_criteria.md. Các mục tiêu hiệu năng trong tài liệu là đề xuất để duyệt, không là số đã đo hoặc gate code được thay đổi.

## Nguồn và dấu vết đối chiếu

Các file dưới đây đã đọc; hash phục vụ nhận diện revision, không chứng nhận toàn bộ hệ thống/model:

| Nguồn | SHA-256 |
|---|---|
| `docs/ai01-admin/FIXGO-DATASET-PACKAGE-SPEC.md` | `a9da0c64c4917b6ab324742db3da50180c8810aec89cafc904becad898b9a5ea` |
| `doi-tuong-dich-vu.md` | `fd4717f6101a1a21ed0475fe43077f02519d87a110c05e3e59c4711b9b30e0c8` |
| `server/scripts/ai01/dataset_package.py` | `6684fc243bb44197a6ab76eca16edc7fb8ac2106fde011671d4ac4d4344482d1` |
| `server/scripts/ai01/validate_fixgo_dataset.py` | `2101845b99a6cb37710267e899e51ba4c652d6a692faa0e9fe1622011635fb45` |
| `server/scripts/ai01/uploaded_dataset.py` | `06f58afb08865192ba318be10644a08bd5b5aba1ce8ced4bfe927561f6ac5f6d` |
| `server/src/modules/ai01-review/dataset-upload.js` | `bbd23c54c957e8a4cd0a9c8eb7df3e6e6867d35aa594f472bf7dc10fb3c9e78e` |
| `server/src/modules/symptoms/symptom-catalog.js` | `c71c84c3b265596583a997d23f795d8ec910af28523e730eccb1b3687cab48c3` |
| `server/src/modules/orders/diagnosis/visual-service-resolver.js` | `012afb27b899d40c297c154f16ff59b27477bc1fc8fb4e8a19d1c264169f0877` |
| `server/src/modules/orders/diagnosis/symptom-taxonomy.js` | `b81664d89075366ccea24259c2af8ac87afa58938eff3ed2596b16c193f18799` |
| `ai-service/recommendation/visual_detector.py` | `52ddf11a03c8b3952ca4b007e803894679f7f8c7fc07a93b067bdfdf854ba734` |
| `ai-service/training/visual_service_training.py` | `b91a9c2f7c06be3a3fcffc36206afa7b09809fbe68d16ad5a07d3a7fc7f590bc` |
| `prepared/records.jsonl` | `406999f0d9b3cd82e5eb37f7f1abac7be73140c8584ef6d46b5b50446f269f2d` |
| `prepared/normalized-mapping.json` | `b9fe0f68bcb282ab6b6a04469ee1d068adbcc50842dbc1c129b13c03ad7c53b4` |
| `quality/sign-ontology.json` | `9d4aed0568bd06264b20307a8fe60abe54f8ba4f189691b040d025f398def05c` |
| `DB read-only snapshot (temporary /tmp/fixgo-generation-source.json)` | `a8504f59f0031a63b9dadd9cce019355b9b1b8805a2cbcc582419944db3e9df2` |

DB snapshot chỉ ở /tmp để đọc; dữ liệu service/category/target cần lập kế hoạch đã thể hiện trong CSV. Không đưa thông tin tài khoản/credentials vào báo cáo. Snapshot và quota cần làm mới nếu catalog/ontology đổi.

## Quota theo danh mục và bucket

| Danh mục | Dịch vụ mapping | Kịch bản | Ảnh mục tiêu | Trong đó hold scope | Trong đó OOS |
|---|---:|---:|---:|---:|---:|
| Sửa điện | 289 | 206 | 7892 | 1340 | 24 |
| Giúp việc | 62 | 36 | 696 | 576 | 24 |
| Làm vườn | 50 | 24 | 456 | 96 | 24 |
| Sửa nước | 70 | 52 | 1080 | 144 | 24 |
| Thiết bị gia dụng | 130 | 106 | 2184 | 0 | 24 |
| Điện lạnh | 92 | 50 | 1032 | 0 | 24 |

| Bucket | Ảnh mục tiêu | Ý nghĩa |
|---|---:|---|
| normal_visible | 2144 | Không thấy dấu hiệu; chưa kết luận hoạt động tốt |
| visible_abnormal | 9024 | Quan sát thuộc ontology bbox, không xác nhận nguyên nhân |
| hard_negative | 1188 | Bề mặt/bóng/mối ghép dễ nhầm, cần kiểm âm thật |
| operational_lookalike | 840 | Ngoại hình không chứng minh triệu chứng vận hành |
| out_of_scope | 144 | Đối chứng development ngoài importer v1 |

Mỗi prompt còn chỉ rõ subtype/phạm vi dự kiến; với target gộp tên bằng dấu /, phân bổ lần lượt các biến thể trong sáu góc. Đây là biến thể generation, không tạo class subtype mới; người kiểm phải xác nhận biến thể vẫn thuộc đúng target. Trước pilot rà soát lại những tên ghép là đồng nghĩa hoặc phân loại vật lý khác nhau.
