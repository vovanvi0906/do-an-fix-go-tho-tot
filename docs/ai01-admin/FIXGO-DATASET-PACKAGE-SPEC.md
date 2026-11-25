# FixGo AI-01 — Dataset Package v1

Chuẩn chính thức cho ZIP ảnh **AI tạo**, phục vụ quy trình kiểm tra và development training. Phiên bản `fixgo.dataset.v1`. Metadata chính và duy nhất: **metadata.csv**. `data.yaml` chỉ mô tả phiên bản, layout và thứ tự class; YOLO TXT chỉ chứa hình học đề xuất. Không tạo metadata.jsonl, không lặp metadata nguồn/quyền trong YAML.

Gửi nguyên tài liệu này cho ChatGPT, kèm ID/slug và ontology ở phụ lục. Nếu không biết dữ kiện nguồn, prompt hay quyền sử dụng, phải báo thiếu; không tạo dữ kiện thay thế. Gói thiếu thông tin chưa được gọi là sẵn sàng import. Nội dung khai báo trong ZIP chưa phải xác minh của FixGo.

## 1. ZIP và đường dẫn

```text
fixgo_suadien_outlet_burnmark_20.zip
├── metadata.csv
├── data.yaml
├── README.md                    # tùy chọn, chỉ hướng dẫn; không phải nguồn metadata
├── evidence/                    # tùy chọn, bằng chứng thật dạng .txt/.md
│   └── generation-record.md
├── images/
│   ├── outlet_burn_001.jpg
│   └── outlet_burn_002.png
└── labels/                      # chỉ khi có bbox đã đo, còn là đề xuất
    └── outlet_burn_002.txt
```

Không bọc thêm thư mục ngoài. `filename` luôn là `images/<tên>.<đuôi>`, phân biệt hoa/thường; một dòng cho mỗi ảnh, không thiếu/trùng dòng. Ảnh ở ngay dưới `images/`, không có thư mục con. Dùng basename duy nhất, kể cả stem giữa các đuôi ảnh để tránh mơ hồ nhãn. Không có TXT nhãn mồ côi. TXT phải ở `labels/<cùng stem>.txt`. Không ZIP lồng, symlink, đường dẫn tuyệt đối, `..`, file mã hóa hoặc đường dẫn trùng không phân biệt hoa/thường.

Mặc định backend: 200 ảnh, 64 MiB upload, 256 MiB giải nén, 10 MiB mỗi file/ảnh, 2.000 entry, tỷ lệ nén tối đa 100. Backend có thể cấu hình giới hạn thấp hơn/cao hơn trong trần hiện hành; xem giới hạn trong modal. Giữ tối thiểu 2 GiB đĩa trống. Ảnh tĩnh JPEG/PNG/WebP đúng MIME, mỗi cạnh 32–8192 px, tối đa 25 megapixel; bản PNG chuẩn hóa tối đa 20 MiB. Không dùng EXIF xoay khi có bbox; chuẩn hóa ảnh và tọa độ đồng bộ trước.

## 2. metadata.csv — UTF-8, header chính xác

CSV theo quy tắc dấu phẩy, quote chuỗi có dấu phẩy/xuống dòng bằng `"`, escape quote bằng `""`. Đúng các cột theo thứ tự sau, không alias/cột phụ:

```csv
filename,category_id,target_id,object_label,sign_label,source_type,source_reference,rights_type,rights_evidence,rights_status,generator_tool,generated_at,prompt,group_key,review_status,bbox_status,split,sha256
```

| Cột | Quy tắc |
|---|---|
| filename | Đường dẫn chính xác từ gốc ZIP, khớp duy nhất một ảnh |
| category_id | ID danh mục đang hoạt động trong DB; không phải tên/slug |
| target_id | ID đối tượng đang hoạt động và thuộc category_id |
| object_label | Slug chính xác của target_id, ví dụ `o-cam-dien` |
| sign_label | Code ontology bbox, ví dụ `burn_mark`; được rỗng nếu chưa đề xuất dấu hiệu. Rỗng không đồng nghĩa ảnh âm |
| source_type | Bắt buộc `synthetic_ai` cho phiên bản gói AI này |
| source_reference | Bằng chứng nguồn thật: tham chiếu cuộc hội thoại/lượt tạo/ảnh gốc hoặc file bằng chứng trong ZIP; 3–3000 ký tự. Không dùng một câu chung làm bằng chứng đã xác minh |
| rights_type | `owned`, `licensed`, hoặc `permission`, chỉ chọn khi có căn cứ thật về quyền dùng đầu ra |
| rights_evidence | Tham chiếu và mô tả căn cứ quyền thực tế, điều kiện/attribution nếu có; 3–3000 ký tự. Không tự tuyên bố CC0, public domain, hoặc “đã được OpenAI cấp quyền” |
| rights_status | Chính xác `declared_unverified`. Không chấp nhận `verified`; người kiểm trong FixGo xác minh riêng |
| generator_tool | Tên công cụ/model thực tế, phiên bản nếu biết; bắt buộc, tối đa 200 ký tự. Không đoán phiên bản |
| generated_at | Ngày ISO `YYYY-MM-DD` hoặc datetime ISO; không ở tương lai |
| prompt | Prompt thực tế đã dùng, bắt buộc; tối đa 10.000 ký tự. Không tái dựng rồi gọi là prompt gốc |
| group_key | Mã nhóm cảnh/ảnh gốc thật, 3–200 ký tự, ổn định giữa các ZIP; xem mục 5 |
| review_status | Chính xác `unreviewed`; nhãn ChatGPT chưa xác minh |
| bbox_status | `not_annotated` (không kèm TXT, kể cả TXT rỗng) hoặc `proposed` (TXT có bbox đề xuất hợp lệ) |
| split | Chính xác `unassigned`; không yêu cầu người tạo ZIP tự chia split |
| sha256 | 64 ký tự hex thường, SHA-256 **byte file ảnh cuối cùng trong ZIP**, không phải pixel hash |

Mọi ô bắt buộc có giá trị trừ `sign_label`. Giới hạn dòng metadata 20.000 ký tự theo kiểm tra JSON nội bộ; mỗi ô CSV tối đa 10.000 ký tự. Không cắt prompt để vượt giới hạn mà làm sai lịch sử nguồn.

Không đủ quyền để khai một trong ba `rights_type`, không có bằng chứng nguồn hoặc không còn prompt gốc: báo thiếu và yêu cầu chủ dữ liệu bổ sung căn cứ thật; không ghi placeholder vào gói upload. Import lưu khai báo quyền, không biến khai báo thành `rightsVerified=true`. File bằng chứng cũng cần người đối chiếu nội dung, không coi chỉ sự tồn tại của file là chứng minh quyền.

## 3. data.yaml và YOLO

```yaml
fixgo_package_version: fixgo.dataset.v1
path: .
train: images
nc: 2
names:
  0: o-cam-dien
  1: burn_mark
```

Không khai `val`, `test` hoặc metadata nguồn trong YAML. Đây là YAML **gói import chờ review**, không phải cấu hình chạy training trực tiếp. Export có audit của FixGo mới tạo YAML train/validation riêng cho vật thể và dấu hiệu.

Class ID liên tục từ 0, `nc` bằng số class; tên không trùng, tối đa 200 class. Tên class phải là slug đối tượng đang hoạt động hoặc code dấu hiệu bbox hiện hành. Backend đối chiếu slug → target ID và code → sign, không tự biến `burn_mark` thành vật thể. Gói v1 không nhận tên nguồn mơ hồ như `OUTLET`; tên đó cần chuẩn hóa thành `o-cam-dien`. Không sửa class của dữ liệu raw hiện có.

Mỗi dòng TXT:

```text
<class_id> <x_center> <y_center> <width> <height>
```

Tọa độ chuẩn hóa theo chiều rộng/cao ảnh cuối cùng; hữu hạn, box nằm hoàn toàn trong ảnh, chiều rộng/cao tối thiểu 2 px; tối đa 100 box/ảnh. Không segmentation, polygon, confidence hoặc bbox trùng class/vị trí. Box vật thể khớp `target_id`; box dấu hiệu khớp `sign_label` của ảnh. Phiên bản này mô tả một loại đối tượng và tối đa một loại dấu hiệu trên mỗi ảnh, có thể nhiều instance; chưa hỗ trợ nhiều code dấu hiệu trong một ô CSV.

Nếu ảnh giả định 1000×1000 có box vật thể đo được `(100,100)-(900,900)` và vết cháy `(400,300)-(600,500)`, TXT minh họa là:

```text
0 0.5 0.5 0.8 0.8
1 0.5 0.4 0.2 0.2
```

Đây là **ví dụ toán học**, không phải tọa độ của bộ 20 ảnh cũ. Không sao chép những số này cho ảnh chưa đo. Không có bbox đáng tin thì `bbox_status=not_annotated` và bỏ TXT; ảnh được nhập vào quarantine/pending để người gán nhãn. TXT rỗng không xác nhận ảnh âm. Không dùng nhãn `healthy`, `electrical_short`, `exposed_wire` nếu chưa có trong ontology bbox hiện hành.

## 4. Ví dụ Sửa điện → Ổ cắm điện → burn_mark

ID đã đọc trực tiếp từ PostgreSQL local bằng transaction READ ONLY ngày 25/11/2026:

- Sửa điện: `4d397d29-ec22-4eae-88ea-8e411e04bdb3`, slug `sua-dien`.
- Ổ cắm điện: `ca1e389e-6302-4a19-a086-5c815a836473`, slug `o-cam-dien`.
- Dấu hiệu bbox: `burn_mark` — Vết cháy/xém. Thấy vùng cháy/xém trong ảnh; không suy chập điện/nguyên nhân. Phân biệt bụi, vết bẩn tối, màu vật liệu.

Dùng layout và YAML ở trên. Ví dụ CSV đầy đủ cấu trúc cho ảnh chưa bbox (các phần `<...>` là dữ kiện phải lấy từ lượt tạo thật; **mẫu này chưa được upload nguyên trạng**):

```csv
filename,category_id,target_id,object_label,sign_label,source_type,source_reference,rights_type,rights_evidence,rights_status,generator_tool,generated_at,prompt,group_key,review_status,bbox_status,split,sha256
images/outlet_burn_001.jpg,4d397d29-ec22-4eae-88ea-8e411e04bdb3,ca1e389e-6302-4a19-a086-5c815a836473,o-cam-dien,burn_mark,synthetic_ai,<tham chiếu lượt tạo thật>,<owned hoặc licensed hoặc permission có căn cứ>,<bằng chứng quyền thật>,declared_unverified,<công cụ thực tế>,<ngày tạo ISO>,"<prompt gốc đầy đủ>",<mã nhóm cảnh thật>,unreviewed,not_annotated,unassigned,<sha256 file cuối cùng>
```

Sau khi đo bbox trên ảnh: đổi `bbox_status` thành `proposed`, thêm `labels/outlet_burn_001.txt`, dùng class 0/1 như YAML. Không sửa `review_status`/`rights_status` thành đã duyệt. Nếu chỉ có box vật thể, có thể để đề xuất dấu hiệu trong CSV nhưng người kiểm phải gán bbox dấu hiệu cần thiết trước khi training tác vụ dấu hiệu.

Nếu tạo 20 ảnh: 20 file độc lập và 20 dòng CSV. Không dùng tên ảnh hoặc số thứ tự để khẳng định có 20 cảnh độc lập. Prompt có thể yêu cầu ảnh điện thoại, ổ cắm đúng hình học, vùng xém nhìn thấy và đa dạng góc; CSV phải lưu prompt thực sự đã gửi chứ không phải prompt mẫu trong tài liệu.

## 5. Nhóm cùng nguồn/cảnh và split

Các crop từ cùng collage, các góc/biến thể của cùng cảnh, cùng ảnh tham chiếu, cùng thiết bị/phiên phải dùng chung `group_key`. Không đặt mỗi crop một group riêng; đổi prompt không chứng minh cảnh độc lập. Nếu nhiều cảnh cùng nguồn có quan hệ chưa rõ, giữ nhóm chung bảo thủ rồi ghi bằng chứng để người kiểm quyết định. Dùng namespace ổn định của dự án/nguồn để tránh hai lô vô tình tái sử dụng mã nhóm cho cảnh khác. Không tạo mã mới chỉ để tăng số nhóm hoặc vượt gate.

Backend hiện đưa `synthetic_ai` vào **development train**, `benchmarkEligible=false`, `independentlyReviewed=false`, `approvedGroundTruth=false`. Validation phải được bổ sung từ các nhóm phát triển độc lập, đủ quyền và đã kiểm tra theo gate hiện hành; gói 20 ảnh AI riêng lẻ không tự đủ train/val. Nhóm đã tồn tại ở validation gây lỗi cần đối chiếu, không bị chuyển âm thầm sang train. Test/benchmark/reference khai trong nguồn bất kỳ bị chặn. Ảnh trùng/gần trùng tập tham chiếu được bảo vệ cũng bị chặn.

## 6. Điều kiện import và training khác nhau

**Import:** đúng cấu trúc, CSV/ID/ontology/hash, ảnh giải mã hợp lệ, khai báo nguồn/quyền/cảnh/công cụ/ngày/prompt đầy đủ; không giả xác minh. Có thể không bbox. Nhãn YOLO nếu có phải hợp lệ; lỗi báo theo tên ảnh và trường. Ảnh giống hệt không tạo mẫu mới; gần trùng cần người đối chiếu nhóm. Mọi ảnh mới vẫn ở quarantine/pending. Metadata và nhãn nguồn lưu trong provenance có audit, không tự biến thành nhãn đã lưu của người kiểm.

**Development training:** kiểm ảnh, quyền sử dụng và bằng chứng nguồn/cảnh; giải quyết trùng/gần trùng, xác nhận bbox và nhãn cần thiết; review vật thể đầy đủ và dấu hiệu positive/none_visible; kiểm phạm vi vật thể, nhóm không giao split; export qua gate có hash/audit, đúng người kiểm và revision mới nhất. Không sửa raw hoặc dùng ZIP này làm training folder trực tiếp.

Các minimum kỹ thuật đang có trong `quality_review.py` và `visual_service_training.py`: mỗi lớp ≥20 ảnh train, ≥5 val, ≥2 nhóm train và ≥1 nhóm val; ≥5 ảnh âm train, ≥2 val (none_visible phải do người xem xác nhận). Đây là minimum, không bảo đảm chất lượng. Bộ 20 ảnh cháy/xém không có val và ảnh âm chưa đáp ứng. Không bỏ gate, không train/deploy chỉ vì ZIP hợp lệ; không đưa AI vào benchmark/test ảnh thực độc lập.

## 7. Validator dùng chung backend

Từ gốc repository, dùng Python môi trường ai-service (Pillow, PyYAML, OpenCV, NumPy):

```bash
ai-service/.venv/bin/python -B server/scripts/ai01/validate_fixgo_dataset.py dataset.zip --report /tmp/fixgo-report.json
```

Script gọi chính `DatasetImport.preview`, `decode_image`, kiểm ZIP, mapping và `dataset_package.py` mà backend dùng. Chỉ tạo staging tạm rồi xóa, không commit/import vào thư viện, không sửa ZIP. Exit 0 khi preflight v1 đạt; exit 1 khi có lỗi. JSON có lỗi toàn gói và `items[].filename/errors/missingInfo/warnings/proposedBoxes`; luôn `trainingEligible=false` vì cần review/export riêng.

Runtime cần artifact `review_core.py` của backend tại `~/Work/datasetai/06-benchmarks/ai01-pilot-v1`; có thể đặt `AI01_PILOT_DIR` tới artifact đã cài. Không tự tải/cài thư viện hoặc tạo artifact thay thế. Snapshot mặc định: `dataset-package/catalog.json` (6 danh mục, 70 đối tượng) và `dataset-package/sign-ontology.json` (10 dấu hiệu), kèm tài liệu này. Cập nhật catalog bằng lệnh đọc DB có sẵn, rồi truyền `--catalog`:

```bash
node server/scripts/ai01/snapshot_catalog.cjs /tmp/fixgo-catalog-current.json
ai-service/.venv/bin/python -B server/scripts/ai01/validate_fixgo_dataset.py dataset.zip --catalog /tmp/fixgo-catalog-current.json
```

Có thể truyền `--ontology`, `--inventory`, `--references` bằng snapshot JSON/JSONL tin cậy của môi trường hiện tại. Không có inventory và reference thì `crossInventoryChecked=false`: chỉ kiểm trùng nội bộ ZIP, chưa đối chiếu toàn kho và tập bảo vệ. Khi upload, backend luôn kiểm catalog DB hiện tại, inventory/tập bảo vệ và gate hiện tại; kết quả offline không cấp quyền import/training. Giới hạn tùy cấu hình server phải được đối chiếu với modal.

Backend vẫn đọc gói legacy CSV/JSONL/YAML qua quy trình cũ, không nới validation; **chỉ gói v1 ở tài liệu này là chuẩn ChatGPT mới**. Không thêm version vào ZIP cũ rồi kỳ vọng bỏ qua lỗi. Legacy không đủ chuẩn sẽ được CLI báo cần sửa.

## 8. Checklist trước upload

- [ ] Không wrapper folder; ảnh/labels đúng đường dẫn, ảnh không lỗi/collage ngoài ý muốn.
- [ ] Chỉ một metadata.csv; header chính xác; đủ một dòng mỗi ảnh.
- [ ] ID/slug còn hoạt động, dấu hiệu thuộc ontology bbox ở phụ lục.
- [ ] Hash tính sau khi hoàn tất file ảnh, không đổi ảnh sau đó.
- [ ] Công cụ, ngày, prompt, nguồn thật đã lưu; không điền đoán/placeholder.
- [ ] Quyền dùng đầu ra có căn cứ, giữ bằng chứng thật và ghi declared_unverified.
- [ ] review_status=unreviewed, split=unassigned, source_type=synthetic_ai.
- [ ] Cùng ảnh gốc/collage/cảnh/cùng nguồn phụ thuộc giữ chung group_key.
- [ ] Chưa đo bbox: not_annotated, bỏ TXT; có bbox: proposed và TXT đúng class/tọa độ.
- [ ] Chạy validator; đọc cả warning, sửa từng lỗi theo ảnh; upload rồi đọc preview backend.
- [ ] Người kiểm xác minh riêng trước export/training; không tự đổi cờ duyệt trong ZIP.

## 9. Catalog và ontology tại thời điểm ban hành

Snapshot đọc DB READ ONLY ngày 25/11/2026; backend là nguồn quyết định cuối nếu DB đã thay đổi. Các ID dưới đây là ID thực tế, không lấy UUID từ seed hoặc tự tạo.

### Thiết bị gia dụng

Category ID: `0666ad90-ac9d-4d34-b04a-8925e7d1605d`; slug: `thiet-bi`.

| Đối tượng | target_id | object_label |
|---|---|---|
| Máy lọc không khí / Máy hút ẩm | `31a46f93-b19d-46e0-89ec-de97705944e4` | `may-loc-khong-khi-may-hut-am` |
| Máy hút mùi | `42c03e7a-0da1-446a-ae1e-db7783716016` | `may-hut-mui` |
| Máy rửa chén / Máy rửa bát | `44c6d84b-0c8c-44f0-855b-36aff9d8222a` | `may-rua-chen-may-rua-bat` |
| Nồi cơm điện / Nồi áp suất điện | `65f531cd-165d-4feb-b69f-922398fde6db` | `noi-com-dien-noi-ap-suat-dien` |
| Bếp từ / Bếp hồng ngoại | `79d5736c-c8e1-4514-a9ce-e01899beffa9` | `bep-tu-bep-hong-ngoai` |
| Máy xay / Máy ép / Máy đánh trứng | `812864e5-2682-4d13-bbd4-5c22aba656cd` | `may-xay-may-ep-may-danh-trung` |
| Máy lọc nước RO / Nano | `82430f58-a332-4d4f-aa99-5c27f888a0e7` | `may-loc-nuoc-ro-nano` |
| Bếp gas / Bếp gas âm | `863b2a1d-05f2-4792-beaa-4073e6197141` | `bep-gas-bep-gas-am` |
| Bình nóng lạnh điện | `8c5b11b7-adfe-4c5d-a3b6-fd7afbf53636` | `binh-nong-lanh-dien` |
| Bàn ủi / Bàn là hơi nước | `a265bdb4-3c9f-4d0a-bcba-1f0722c8b420` | `ban-ui-ban-la-hoi-nuoc` |
| Lò nướng / Nồi chiên không dầu | `a289a9b0-6cb9-4d94-b3a3-3ff6dd55e1f7` | `lo-nuong-noi-chien-khong-dau` |
| Quạt điện / Quạt đứng / Quạt bàn | `a9f91e3c-16d5-484d-92bf-68c526ac9606` | `quat-dien-quat-dung-quat-ban` |
| Máy hút bụi / Robot hút bụi | `ac770808-e06b-4f11-8c0d-ea2c5ca4ab55` | `may-hut-bui-robot-hut-bui` |
| Lò vi sóng | `c3e13154-aeb8-4c3f-a6d3-6fa4f20566df` | `lo-vi-song` |
| Máy pha cà phê / Ấm siêu tốc | `f37e014f-c25d-4bcf-a5de-af804d32bd40` | `may-pha-ca-phe-am-sieu-toc` |

### Sửa nước

Category ID: `2a367f64-e8b2-4b94-8227-f5058c842af8`; slug: `sua-nuoc`.

| Đối tượng | target_id | object_label |
|---|---|---|
| Phễu thoát sàn / Khu vực phòng tắm | `3a9061ae-55b0-4130-b48c-7b6f1c281247` | `pheu-thoat-san-khu-vuc-phong-tam` |
| Bồn nước / Máy bơm / Phao nước | `47c02e77-5604-49ae-8ca7-a38f619acd0d` | `bon-nuoc-may-bom-phao-nuoc` |
| Lavabo / Chậu rửa / Bồn rửa | `4f2dd034-f575-49b6-a913-cea3a620b618` | `lavabo-chau-rua-bon-rua` |
| Vòi nước / Vòi sen | `520cae18-9d24-4109-850f-1752f26f05ee` | `voi-nuoc-voi-sen` |
| Bồn cầu / Két nước | `78e95d0e-4ea5-43d1-b0fe-9b3d9be8b3c3` | `bon-cau-ket-nuoc` |
| Bể tự hoại / Hố ga / Cống thoát | `d9924692-19d1-4185-9e35-b381953c42a3` | `be-tu-hoai-ho-ga-cong-thoat` |
| Đường ống cấp / thoát nước | `f27226de-570a-4c1e-84b5-dc419fe9c32e` | `duong-ong-cap-thoat-nuoc` |

### Sửa điện

Category ID: `4d397d29-ec22-4eae-88ea-8e411e04bdb3`; slug: `sua-dien`.

| Đối tượng | target_id | object_label |
|---|---|---|
| Nguồn điện / Adapter / Bộ nguồn | `199c79fa-7e5d-424f-bb45-f2fd9242024f` | `nguon-dien-adapter-bo-nguon` |
| Công tắc thông minh / Relay | `1c1b61c3-be55-4d27-8a32-46410e2a2017` | `cong-tac-thong-minh-relay` |
| Ổ cắm thông minh / Hẹn giờ | `215bc4ef-6d9d-49ec-841f-4a9fb91868f5` | `o-cam-thong-minh-hen-gio` |
| Đèn ngoài trời / Sân vườn | `2f246a0e-3617-4083-83da-2713460741cb` | `den-ngoai-troi-san-vuon` |
| Điện cửa cuốn / Cổng tự động | `2fe406ed-6aae-4f00-b90f-b262e69645e5` | `dien-cua-cuon-cong-tu-dong` |
| Bộ sạc xe điện / Ổ cắm sạc | `34f7d2f7-e63f-4081-b968-2b8275cab527` | `bo-sac-xe-dien-o-cam-sac` |
| Dây điện / Cáp điện | `36d41107-3c4a-4a4e-9aa1-22cba07aed57` | `day-dien-cap-dien` |
| Tủ điện / Bảng điện | `470acb27-41b1-4d36-9ee3-84b9bbc857de` | `tu-dien-bang-dien` |
| Hệ thống điện toàn nhà | `481e60aa-a20b-466e-8ae0-c581284e67ee` | `he-thong-dien-toan-nha` |
| Aptomat / CB / MCB | `484e7b6f-469e-4b22-acd8-bae2b7ea60a1` | `aptomat-cb-mcb` |
| Quạt trần / Quạt treo tường | `492a7d40-96f6-4b1a-8146-34956f8a95f8` | `quat-tran-quat-treo-tuong` |
| Kiểm tra / Khảo sát sự cố điện | `53a59ef2-9ffe-4206-940f-bc364951b917` | `kiem-tra-khao-sat-su-co-dien` |
| Cảm biến / Thiết bị tự động | `56725529-2a0c-4bdf-a437-4f18d98b5939` | `cam-bien-thiet-bi-tu-dong` |
| Hộp nối điện / Hộp kỹ thuật | `56d03ad1-b3a0-469a-bf79-ec9e83d23e08` | `hop-noi-dien-hop-ky-thuat` |
| Đèn trang trí / Đèn chùm | `667cd41a-d6ab-42fa-808c-08898ba947dc` | `den-trang-tri-den-chum` |
| Điện mặt trời / Inverter | `72afafec-8d91-4ed9-b153-238d314ddfdf` | `dien-mat-troi-inverter` |
| Đèn sự cố / Đèn thoát hiểm | `8e1b308f-a8cd-4de8-9a30-6db52cfdb32c` | `den-su-co-den-thoat-hiem` |
| Thiết bị đo điện / Công tơ điện | `93797cd8-e539-456e-a38f-f76316e84107` | `thiet-bi-do-dien-cong-to-dien` |
| Thiết bị chống rò / Chống giật | `9a3f2d63-e61b-4d6c-8ff0-15e179c15d02` | `thiet-bi-chong-ro-chong-giat` |
| Quạt thông gió / Quạt hút | `9b5276c6-9692-46be-a8ad-f3e1afdac569` | `quat-thong-gio-quat-hut` |
| Nguồn cấp cho thiết bị cố định | `9e70ad4f-39e3-44f9-90d6-cb70c8ce9fbe` | `nguon-cap-cho-thiet-bi-co-dinh` |
| Tiếp địa / Chống sét | `aa15b0ce-a9e6-4faf-9c87-1d5102d339f5` | `tiep-dia-chong-set` |
| Bóng đèn / Đèn LED | `b45c19d2-93d2-43ac-8330-87d223d941b4` | `bong-den-den-led` |
| Chuông cửa / Nút nhấn | `b5e21dc2-ed41-4aaa-9f0f-8f5f5aaf025c` | `chuong-cua-nut-nhan` |
| Máy bơm nước – Phần điện | `bc70283c-4093-4574-aa3f-f5ef1fcdb353` | `may-bom-nuoc-phan-dien` |
| Ổ cắm điện | `ca1e389e-6302-4a19-a086-5c815a836473` | `o-cam-dien` |
| Hệ thống điện phòng | `cc357a32-647e-4598-9c0c-86c6d62f2427` | `he-thong-dien-phong` |
| Ổn áp / UPS / Bộ lưu điện | `ec503642-d273-4742-bf35-e8b3d509e7e5` | `on-ap-ups-bo-luu-dien` |
| Công tắc điện | `f2b5a73e-b1e3-45c2-97c1-a09015ad18b6` | `cong-tac-dien` |

### Giúp việc

Category ID: `76c09b08-3231-4abd-be79-c2da76e06495`; slug: `giup-viec`.

| Đối tượng | target_id | object_label |
|---|---|---|
| Khu vực bếp / Thiết bị bếp bên ngoài | `07174301-9fd2-4a3e-b3da-2b43303663e6` | `khu-vuc-bep-thiet-bi-bep-ben-ngoai` |
| Sofa / Nệm / Thảm / Rèm | `2e1b524a-80c8-409d-aa30-e4c8ca71bfbd` | `sofa-nem-tham-rem` |
| Văn phòng / Cửa hàng | `349b1f3b-5664-4ba4-a3c4-567c16c58ca0` | `van-phong-cua-hang` |
| Nhà vệ sinh / Phòng tắm | `5ef7b978-d4dc-4287-b119-19926b473bac` | `nha-ve-sinh-phong-tam` |
| Cửa kính / Cửa sổ / Ban công | `8ea8b042-3418-4ec9-8cd7-5c71b899a183` | `cua-kinh-cua-so-ban-cong` |
| Nhà ở / Căn hộ | `cf864eb2-ba2a-4dd8-8b8f-d13602981783` | `nha-o-can-ho` |
| Sàn nhà / Tường / Trần / Nội thất | `ee850727-ccde-4173-8b16-41e7be8065ca` | `san-nha-tuong-tran-noi-that` |

### Điện lạnh

Category ID: `8ba77998-c7aa-4b53-875f-b14b8fba78f7`; slug: `dien-lanh`.

| Đối tượng | target_id | object_label |
|---|---|---|
| Máy nước uống nóng lạnh | `043e30bc-6493-4f96-82b6-e6a2f26e4bf2` | `may-nuoc-uong-nong-lanh` |
| Máy sấy quần áo | `1746c918-2fb7-41ac-a111-5c3e807616bf` | `may-say-quan-ao` |
| Máy lạnh / Điều hòa | `3d946ff9-d116-4d07-9f38-c175669f74ed` | `may-lanh-dieu-hoa` |
| Tủ lạnh / Tủ lạnh side-by-side | `521d7ce8-9e72-492e-b0cd-4eb88508f58d` | `tu-lanh-tu-lanh-side-by-side` |
| Tủ đông / Tủ mát | `5e8f3e42-a1e4-47e3-8e76-8c774d04d5ea` | `tu-dong-tu-mat` |
| Máy làm mát / Quạt điều hòa | `8e1a07e4-134d-4214-8841-ad2969a584fa` | `may-lam-mat-quat-dieu-hoa` |
| Máy giặt / Máy giặt sấy | `eaa18ae1-41b8-4588-bcdb-96192e5a2da8` | `may-giat-may-giat-say` |

### Làm vườn

Category ID: `ef9682ad-e5dc-494e-a22f-45df72b68f9e`; slug: `lam-vuon`.

| Đối tượng | target_id | object_label |
|---|---|---|
| Hàng rào cây / Bồn hoa / Vườn rau | `059da690-c6be-46a8-83d5-d96e250cbe4f` | `hang-rao-cay-bon-hoa-vuon-rau` |
| Thảm cỏ / Bãi cỏ | `32acffd8-6255-49b1-8035-eb34a5dff180` | `tham-co-bai-co` |
| Hệ thống tưới / Sân vườn tổng thể | `cc0ab115-0758-4fd3-a4ad-b10a68cd0cdb` | `he-thong-tuoi-san-vuon-tong-the` |
| Cây bóng mát / Cây lớn | `e6e9a725-4058-4af4-83b7-a35fc91af354` | `cay-bong-mat-cay-lon` |
| Cây cảnh / Chậu cây | `fbcd5b31-5530-43ba-b35b-a32d25479477` | `cay-canh-chau-cay` |

### Ontology bbox hiện hành

Không nhầm danh sách dấu hiệu cấp ảnh/display với ontology bbox này. Alias `water_drip` chỉ để hiển thị legacy, code chuẩn là `water_dripping`.

| sign_label | Tên | Điều kiện quan sát |
|---|---|---|
| `water_dripping` | Nước nhỏ giọt | Thấy giọt/tia ngắt quãng rõ vị trí; không coi vòi xả bình thường là lỗi rò. |
| `wet_surface` | Bề mặt ướt | Thấy vùng ẩm/nước trên bề mặt; không suy nguồn nước hay nguyên nhân. |
| `crack` | Vết nứt | Thấy đường đứt/nứt vật liệu; không nhầm mối nối hoặc bóng. |
| `burn_mark` | Vết cháy/xém | Thấy vùng cháy/xém có bằng chứng ảnh; không suy chập điện hoặc nguyên nhân. |
| `water_spray` | Tia nước nhìn thấy | Thấy tia nước; ghi vị trí và bối cảnh, không tự kết luận ống vỡ. |
| `stain_or_discoloration` | Vết ố/đổi màu | Vùng đổi màu nhìn thấy, không suy là ướt hoặc do rò nước. |
| `broken_part` | Chi tiết gãy/vỡ | Thấy phần gãy/vỡ thật, không dùng tên lỗi nguồn làm bằng chứng. |
| `surface_soiling` | Bụi/bẩn bám | Thấy chất bẩn bám trên bề mặt. |
| `bird_droppings` | Vết giống phân chim | Thấy vết phù hợp, chưa kết luận nguyên nhân/vệ sinh nếu chưa rõ. |
| `leaf_debris` | Lá/rác lá bám | Thấy lá/rác lá trên bề mặt, không suy bệnh cây. |

## 10. Kết quả kiểm bộ 20 ảnh trước đây

Đã đọc đủ 20 ảnh trong từng bản `fixgo_suadien_outlet_burnmark_20.zip` và `fixgo_suadien_outlet_burnmark_20_import_ready.zip`, giữ nguyên hash ZIP. Cả hai chưa đạt v1: cần chuẩn hóa layout/header, ID thực tế, bổ sung nguồn/quyền/công cụ/ngày/prompt theo bằng chứng thật; bản gốc cần bỏ nguồn JSONL thứ hai. Không có bbox không bắt buộc phải tạo bbox để import.

Xem [các trường cần sửa](dataset-package/PREVIOUS-20-IMAGES-RESULTS.txt) và [báo cáo từng ảnh](dataset-package/previous-20-images-validation.json). Không tự sửa hoặc nhập hai ZIP vào state thật. Nhãn đề xuất và lời khai quyền trong gói cũ chưa phải kết quả xác minh.
