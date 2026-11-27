# AI-DATA-01 — Audit và chuẩn hóa metadata dataset hiện có

Ngày25/11/2026. Đã đọc 25 báo cáo Markdown trong docs/ai-audit/ (gồm lịch sử); dùng báo cáo mới và đối chiếu ảnh/annotation thật thay cho tin số liệu cũ. Hash các báo cáo đầu vào: [input-reports.json](evidence/input-reports.json).

## Kết quả

- **21.437/21.437 ảnh nguồn** được kiểm kê từng dòng; thêm1.200 classification fixtures,40 ZIP entries thuộc hai bản gói20 ảnh và3 admin-upload records: **22.680 stored entries**, **22.090 SHA ảnh khác nhau**. Không cộng bản sao prepared/trial vào ảnh độc lập mới.
- Hash/decode và TXT annotation đọc lại trực tiếp. Raw0 lỗi decode,0 lệch SHA ảnh/label,0 lệch pixel hash/pHash so prepared; **148 TXT rỗng chưa được coi ảnh âm**,21.289 có annotation parse được. Quyền/nguồn và nhãn đều còn cần review.
- **288 exact SHA groups** (878 stored entries); **1.269 pHash connected candidate groups** (4.196 entries). Nhóm pHash không phải kết luận cùng ảnh; không xóa hay tự gộp GT.
- Classification xác nhận **210 exact groups xuyên split**, liên quan703 stored entries; đây là số nhóm/cá thể tham gia, không phải accuracy hoặc chỉ210 ảnh.
- **14/70 target có source candidate tags**, **5/70 có bbox whole-object candidate sau policy bảo thủ**;56 target chưa có tag trong raw metadata đã quét. Không có nghĩa56 target chắc chắn không xuất hiện trong pixel của mọi thư mục.
- Pilot **50 ảnh để kiểm duyệt/regression development**, không phải independent test. **0 independent test images được phát hành**; chưa có quyền/GT/exposure clearance đầy đủ.

## Các file

- [image-inventory.csv](image-inventory.csv): một dòng/một stored image; đường dẫn, nguồn/license khai báo, kích thước/hash, nhãn/annotation gốc và candidate task/target/sign, exposure, nhóm và blocker.
- [duplicate-groups.csv](duplicate-groups.csv): một dòng/member/type; một ảnh có thể xuất hiện trong nhóm SHA, pixels và pHash, không cộng các dòng thành ảnh độc lập.
- [dataset-leakage-report.md](dataset-leakage-report.md): các split gốc, prepared và đề xuất group-aware.
- [object-coverage.csv](object-coverage.csv): đủ70target, tổng693dịch vụ, tách weak/direct mapping/whole-object candidates và verified.
- [reusable-dataset-report.md](reusable-dataset-report.md): vai trò dữ liệu, phạm vi tái sử dụng và điều kiện.
- [missing-data-report.md](missing-data-report.md):56target chưa có tag và10sign ontology theo bằng chứng hiện có.
- [pilot-dataset-plan.md](pilot-dataset-plan.md): queue50 và điều kiện test thật độc lập.

## Công cụ local

Scripts riêng tại [scripts/ai-data-01](../../scripts/ai-data-01/README.md), không thay production scripts. Dùng Python .venv hiện có (Pillow/OpenCV/NumPy/PyYAML), không tải model/dataset. Reviewer chạy:

```bash
ai-service/.venv/bin/python -B scripts/ai-data-01/review.py --inventory docs/ai-data-audit/image-inventory.csv --state /tmp/fixgo-ai-data-review --port 8766
```

Mở http://127.0.0.1:8766: lọc theo target/source/group, xem ảnh/annotation nguồn nét đứt, đánh dấu nhiều ảnh, vẽ bbox riêng từng ảnh. Chỉ lưu append-only proposals tại state riêng; không sửa ảnh/TXT, không tự xác minh quyền/groundtruth/independent test. Không nhập nhật ký này vào production như approved export. Dừng Ctrl+C.

## Phạm vi phát hiện dữ liệu

Tìm toàn bộ thư mục ảnh và manifest/annotation trong workspace và ~/Work/datasetai, bỏ dependency/build/cache/symlink. **185 thư mục liên quan** ở [discovered-directories.csv](evidence/discovered-directories.csv). Prepared copies, train/val trial copies, screenshots, evidence và Face có inventory thư mục riêng, không tự làm ảnh incident độc lập. Hai ZIP cũ ở Downloads được đọc tại chỗ, không giải nén/sửa. Không quét toàn bộ ổ đĩa cá nhân hoặc tải cloud URLs; ảnh chỉ ở Cloudinary chưa có local không thể audit pixel trong lượt này.

Không thay DB/schema/app/model/raw; không train/download hàng loạt/commit/push. CSV này là ledger phân tích, không metadata.csv18cột import; không chạy model hoặc dùng dự đoán mới làm nhãn. Labels source luôn là ứng viên; việc technically parsed không đồng nghĩa đúng về ngữ nghĩa hay có quyền.

## Cách đọc schema và bằng chứng kiểm thử

- `annotations_json`: annotation nguồn, bbox theo `[x_center,y_center,width,height]`, polygon theo chuỗi cặp x/y, chuẩn hóa theo ảnh nguồn. Không ghi đè chúng bằng proposal.
- `object_box_reuse_candidates_json`: source_annotation_index và target candidate; `candidate_enclosing_xyxy` lấy từ bbox có sẵn hoặc min/max polygon đã có, geometry_transform nêu rõ. Đây không phải bbox do người kiểm duyệt xác nhận; không xuất train tự động.
- `existing_admin_boxes_json/status`: snapshot annotation đã lưu trong app, tách nguồn TXT gốc; kiểm SHA ảnh khớp, không tự tin quyền hoặc independent GT từ status confirmed.
- `practical_object_bbox_candidate`: whole-image policy bảo thủ; source polygon cần chuyển hình học trên copy/metadata sau review, không giả là TXT bbox gốc. `partial_source_object_box_*` cho phép cứu vùng object hợp lệ trong ảnh còn vùng lỗi/label khác chưa xem.
- Các bucket overlap và số inventory lặp theo target/group; không cộng thành số ảnh unique. Không có nhãn Normal/Negative được tự suy từ TXT rỗng.

[10 unit/integration tests](evidence/tool-tests.log) đạt; [browser smoke](evidence/browser-smoke.json) kiểm grid, vẽ/lưu/xuất bbox nháp trên fixture /tmp, không ảnh raw thật. [Ảnh chụp QA fixture](evidence/reviewer-fixture.png) chỉ chứng minh giao diện công cụ, không review dữ liệu thực tế. Server QA đã dừng.

[final-validation.json](evidence/final-validation.json) ghi kiểm tra21437raw IDs duy nhất,70target/693service, hash nguồn/annotation,12030hình học ứng viên bám tọa độ nguồn và50component pilot không lặp. [SHA256SUMS.json](evidence/SHA256SUMS.json) pin các báo cáo/evidence của lần audit này.
