# Duplicate và data leakage

## Phép kiểm mới

SHA-256 byte file, pixel SHA sau EXIF transpose/BGR, pHash63bit theo DCT32×32 top8×8 bỏ DC/median. BK-tree tìm **đúng toàn bộ giá trị pHash trong radius6**, không ANN; mỗi unique hash chỉ query một lần, các ảnh cùng hash được nối vào cùng nhóm. Audit ghi3.375 cạnh giữa các giá trị hash khác nhau; không được gọi số này là mọi cặp ảnh. [near-hash-edges.csv.gz](evidence/near-hash-edges.csv.gz) có representative IDs, Hamming pHash, dHash và RMSE thumbnail32×32 làm bằng chứng phụ, không score đồng nhất ngữ nghĩa.

Connected component có thể có hai thành viên cách nhau >6 qua chuỗi; pHash/cosine/thumbnail giống không chứng minh cùng thiết bị/cảnh. Không xóa/gán nhãn theo pHash. Black-and-white templates/background giống nhau có false positives; cần người xem. Ngưỡng6 là queue grouping, không được dùng như tiêu chí ảnh thực/giấy phép.

| Kiểu nhóm | Số nhóm | Entries tham gia | Lớn nhất |
|---|---|---|---|
| sha256 | 288 | 878 | 11 |
| pixels | 288 | 878 | 11 |
| phash_component | 1269 | 4196 | 200 |

Một ảnh trong nhiều group types, không cộng membership rows. CSV group conflict là dấu hiệu cần xem annotation khác nhau trên ảnh giống nhau, không tự sửa label.

## Leakage theo corpus và split gốc

| Corpus | Exact cross split groups | pHash candidate cross split groups | Combined-source cross split groups |
|---|---|---|---|
| admin_upload | 0 | 0 | 0 |
| classification_fixture | 210 | 87 | 87 |
| raw_source | 5 | 418 | 1035 |
| user_synthetic_zip | 0 | 0 | 0 |

Raw theo corpus có5 exact groups đi qua original splits; classification210 groups /703 entries exact. Số pHash cross-split thấp hơn số exact group có thể do nhiều exact groups được nối thành một near component, không phải ít ảnh leakage hơn. ZIP original split đều unassigned nên số cross-split0 không chứng minh độc lập. [leakage-by-source.csv](evidence/leakage-by-source.csv) tách thêm từng dataset; không đánh đồng train của hai nguồn khác nhau với cùng một test set.

## Prepared development split

So lại nhóm mới trên raw với prepared developmentSplit:

| Khóa nhóm mới | Nhóm giao prepared train/val |
|---|---|
| sha256 | 0 |
| pixel_sha256 | 0 |
| phash_component_id | 0 |
| proposed_source_component | 0 |

Kết quả0 theo khóa/hash đã kiểm (nếu0 trong bảng) chỉ xác nhận metadata split/group nhất quán ở ngưỡng này; không xác minh physical device/session hoặc independent benchmark. Việc raw original test chuyển thành development không biến nó thành independent test.

## Exposure và chia tập đề xuất

Đọc selection.jsonl của cả hai object experiments và hash ảnh classification: `direct_experiment_exposure_json` ghi actual selected SHA và train/val role; `component_exposure_json` lan qua nhóm exact/pHash/source-family/priorgroup để tránh crop/biến thể của ảnh train lọt test. `prepared_ai_exposed_declaration=true` được giữ riêng: đó là tuyên bố nguồn, không giả là log inference từng ảnh. Các experiment không có log đầy đủ vẫn có exposure UNKNOWN, không mặc định safe.

`proposed_source_component` nối exact bytes, normalized pixels, near candidates, source family/nhóm prior. Nhóm filename/source-family là giả thuyết bảo thủ cần đối chiếu nguồn, không chứng nhận các cảnh độc lập. Chia mới giữ toàn component ở một tập, augmentation chỉ sau split. Nếu near edge false positive cần người duyệt bằng chứng rồi tạo revision mới, không âm thầm đổi group để đủ quota.

- Đã train hoặc biến thể cùng nhóm: legacy_model_train_exposed, giữ cho development/regression hoặc training sau gate; không làm independent test hiện tại.
- Đã validation/tuning: legacy_model_validation_exposed; không gọi blind test của model đã dùng nó.
- Chưa thấy selection log: quarantine_source_and_exposure_review; không phải test sạch. Còn cần nguồn, quyền, semantic labels và clearance exposure.
- Khi có dữ liệu mới/được xác minh chưa dùng: chốt group source/site/device/session trước; phân bổ development train/val theo group có stratification target/sign (ví dụ80/20 là lựa chọn cần duyệt, không tỷ lệ đã thực hiện). Test thật độc lập khóa riêng từ nguồn chưa train/tune/model-exposed, không lấy phần ngẫu nhiên raw cũ.

Không đổi train/val/test folders hoặc chuẩn bị training dataset mới trong audit. Large component có thể làm quota không đạt; phải bổ sung nguồn/cảnh thật sau review, không tách ngẫu nhiên ảnh trong nhóm. 0 independent test được cấp từ ledger này.
