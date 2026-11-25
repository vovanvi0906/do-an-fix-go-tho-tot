# Studio → trial và đóng băng test

Công cụ: `scripts/ai-data-02/trial.py`, chạy offline bằng `.venv` hiện có. Không import application server, gọi DB, tải model, train hoặc kích hoạt model. Dừng Studio trước khi chạy `prepare`/`freeze` vì dùng cùng writer lock. Mỗi output là version mới ngoài repo, state, thư mục inventory/intake và dataset nguồn mặc định.

## 1. Chuẩn bị trial từ export Studio

Hoàn thành nhãn HUMAN_VERIFIED, review đầy đủ, quyền và provenance thật rồi export YOLO theo README. Tạo hồ sơ JSON `trial-review.json` theo cấu trúc sau; thay mọi placeholder bằng thông tin thật, liệt kê mọi imageId trong export:

```json
{
  "schema": "fixgo.studio.trial-review.v1",
  "exportManifestSha256": "<SHA256 của export/manifest.json>",
  "approvedForTrial": true,
  "reviewer": "<người chịu trách nhiệm review trial>",
  "evidence": "<tham chiếu hồ sơ kiểm nhãn/quyền và phạm vi thử nghiệm>",
  "images": {
    "<imageId>": {
      "reviewer": "<người kiểm nhóm>",
      "reviewedSigns": ["burn_mark", "crack", "broken_part", "wet_surface"],
      "groupKeys": ["device:<ID thực>", "scene:<ID thực>", "session:<ID thực>", "source:<nhóm nguồn có nguy cơ rò rỉ>"],
      "groupEvidence": "<bằng chứng xác định thiết bị/cảnh/lần chụp/nhóm nguồn>"
    }
  }
}
```

Dùng cùng namespace và ID cho cùng nhóm ở mọi hồ sơ. Không đặt source group bằng một tên chung vô nghĩa hoặc tự tạo ID khác để tách ảnh thực ra cùng nhóm. Các key chồng lấn được nối bắc cầu; một nhóm không được giao train/val. Coverage phải bao gồm toàn bộ dấu hiệu được chọn, kể cả ảnh âm. Hồ sơ là khai báo của người phụ trách, công cụ không xác minh danh tính hoặc tính xác thực chứng cứ.

```bash
sha256sum "$HOME/.local/share/fixgo-dataset-studio/exports/sign-review-v1/manifest.json"
ai-service/.venv/bin/python scripts/ai-data-02/trial.py prepare \
  --export "$HOME/.local/share/fixgo-dataset-studio/exports/sign-review-v1" \
  --review /path/to/trial-review.json \
  --signs burn_mark crack broken_part wet_surface \
  --out /path/to/artifacts/sign-trial-v1
```

Lệnh trả JSON chứa đường dẫn, `manifestSha256`, `sealSha256`. Ghi seal vào hồ sơ thí nghiệm bên ngoài bundle. Muốn thử ít lớp hơn, thay `--signs` và coverage tương ứng; ảnh có dấu hiệu ngoài phạm vi bị từ chối nguyên ảnh, không âm thầm bỏ box. Mọi object catalog được giữ trong class map để không biến object bị loại thành background. Đây chưa phải trial thu hẹp xuống một target.

Gate tối thiểu cho mỗi dấu hiệu: 20 ảnh train/5 val, 2 nhóm train/1 val; 5 ảnh NORMAL train/2 val cho phạm vi task. Đây là mức tối thiểu thử nghiệm tương ứng công cụ cũ, thấp hơn mục tiêu thu thập trong kế hoạch; không bảo đảm chất lượng hoặc đủ mẫu đánh giá. Box count và tiêu chí được ghi trong manifest. Adapter kiểm live revision/hash-chain, pin inventory/catalog/ontology, bytes nguồn và export, nhãn YOLO nguồn, kết quả partition, bbox/objectId, rights, coverage và nhóm. Chỉ khi toàn bộ preflight đạt mới tạo output bằng staging rồi rename.

Output: ảnh giữ bytes, labels YOLO remap liên tục, `data.yaml` trỏ output tuyệt đối, manifest có records/audit/review, snapshot catalog/ontology, `SHA256SUMS.json`. Có thể dùng làm đầu vào YOLO trial sau khi kiểm seal và xét điều kiện thí nghiệm. Không truyền bundle này vào CLI `visual_service_training.py`: CLI đó vẫn chỉ nhận bbox-quality-v1. Gate cũ giữ nguyên.

## 2. Nhập test mới, người duyệt không xem proposal

Tạo thư mục intake riêng, ảnh mới và `packet.json`. Không lấy ảnh Studio/pilot rồi đổi ID. Nhãn phải được người duyệt đọc ảnh độc lập; custodian và reviewer là hai người khác nhau. Dùng ID target/sign trong snapshot đã pin. Mẫu dưới mô tả một ảnh NORMAL; packet thật cần cả ảnh dương cho mọi dấu hiệu trong task và ảnh NORMAL:

```json
{
  "schema": "fixgo.independent-test-intake.v1",
  "developmentSealSha256": "<sealSha256 trial đã chuẩn bị>",
  "ontologySha256": "<inventoryPins.ontology_sha256 trong trial manifest>",
  "custodian": "<người giữ test>",
  "evidence": "<hồ sơ thu nhận mới và cách bảo vệ test khỏi quá trình phát triển>",
  "newCollection": true,
  "noDevelopmentUse": true,
  "reviewedWithoutModelProposals": true,
  "groupSeparationReviewed": true,
  "records": [{
    "imageId": "new-test-0001",
    "imageFile": "images/new-test-0001.png",
    "contentHash": "<SHA256 ảnh>",
    "split": "test",
    "priorExposure": "none",
    "realOrSynthetic": "real",
    "reviewStatus": "HUMAN_VERIFIED",
    "reviewer": "<người duyệt khác custodian>",
    "reviewedAt": "<thời điểm ISO 8601>",
    "outcome": "NORMAL",
    "targetIds": ["<target ID từ catalog>"],
    "boundingBoxes": [{
      "id": "object1", "kind": "object", "label": "<target ID>",
      "xyxy": [0.1, 0.1, 0.9, 0.9], "objectId": null
    }],
    "reviewChecks": {
      "imageSeen": true, "objectExtent": true,
      "allSigns": true, "objectAssociation": true
    },
    "licenseStatus": "VERIFIED",
    "licenseConfirmed": true,
    "licenseType": "owned",
    "licenseEvidence": "<bằng chứng quyền thực tế, tối thiểu 20 ký tự>",
    "sourceEvidence": "<bằng chứng nguồn thực tế>",
    "independenceEvidence": "<bằng chứng chưa dùng phát triển, thiết bị/cảnh/nguồn tách biệt>",
    "humanGrouping": {
      "reviewer": "<người kiểm nhóm>",
      "reviewedSigns": ["burn_mark", "crack", "broken_part", "wet_surface"],
      "groupKeys": ["device:<ID>", "scene:<ID>", "session:<ID>", "source:<nhóm nguồn>"],
      "groupEvidence": "<hồ sơ nhóm thực và cách đối chiếu với development>"
    }
  }]
}
```

**Tọa độ ví dụ không phải nhãn dùng được**: thay bằng bbox người duyệt vẽ trên ảnh thật. Ảnh ABNORMAL cần thêm sign box có `objectId` trỏ object cùng ảnh và `signTargetCompatibility: true` trong reviewChecks. OOS phải không có target/box. UNKNOWN/NEEDS_REVIEW không được đóng băng. Không có bulk auto-label.

```bash
ai-service/.venv/bin/python scripts/ai-data-02/trial.py freeze \
  --packet /path/to/new-test-intake/packet.json \
  --development /path/to/artifacts/sign-trial-v1 \
  --development-seal '<seal đã lưu bên ngoài trial>' \
  --out /path/to/artifacts/sign-test-v1
```

Công cụ kiểm trial seal, ontology, khai báo và từng annotation; đối chiếu SHA, pixel RGB và dHash64 với **toàn inventory development** bằng đọc ảnh thật. dHash khoảng cách ≤6 là ứng viên gần trùng và bị chặn bảo thủ; có thể có false positive. Không có bypass để tự coi độc lập. Đọc toàn inventory có thể lâu; lỗi nguồn/checksum/EXIF sẽ dừng. Không nạp model. Bộ nhớ giữ fingerprints và dữ liệu output, vì vậy nên chia collection phù hợp RAM; đây chưa phải pipeline streaming cho test rất lớn.

Group key test không được giao nhóm của trial. Những quan hệ ngữ nghĩa với phần inventory không có hồ sơ nhóm thật vẫn phải được người phụ trách rà soát theo khai báo `groupSeparationReviewed`. Không có overlap hash không chứng minh độc lập cảnh/nguồn. Các ảnh cùng nhóm trong test vẫn phải giữ group để bootstrap/đánh giá theo nhóm.

Output test chỉ có `images/test`, `labels/test`, data.yaml và hồ sơ niêm phong. Trạng thái `frozen_pending_organizational_review`, `independenceDeclared=true`, **`independentTest=false`, `benchmarkApproved=false`**. Công cụ chuẩn bị ứng viên test có khai báo và bằng chứng; chưa cấp chứng nhận độc lập. Việc thẩm định/phê duyệt tổ chức và chạy evaluation chưa được tự động hóa.

## 3. Kiểm seal và quản lý test

```bash
ai-service/.venv/bin/python scripts/ai-data-02/trial.py verify \
  --bundle /path/to/artifacts/sign-test-v1 \
  --seal '<sealSha256 lưu bên ngoài bundle>'
```

Kiểm mọi file, phát hiện file thêm/mất/thay đổi và path/symlink không an toàn. Seal phải được giữ ngoài bundle trong hồ sơ kiểm soát truy cập; sửa cả bundle và seal local không phải chữ ký chống giả mạo. Thư mục đã tồn tại không bị ghi đè. Thay nhãn/scope cần version mới và review lại, không sửa checksum để hợp thức hóa version cũ.

Custodian hạn chế truy cập nhãn test; filesystem local không cung cấp cơ chế phân quyền độc lập cho team. Ghi model/config/threshold đã chốt bằng validation trước khi mở test. Nếu dùng lỗi test để tinh chỉnh, ghi tập đó đã trở thành development và thu nhận test mới. Công cụ freeze chưa có sổ theo dõi lần mở/evaluation hoặc tự phát hiện test đã bị xem.

## Kiểm thử

```bash
ai-service/.venv/bin/python scripts/ai-data-02/test_trial.py
ai-service/.venv/bin/python scripts/ai-data-02/test_studio.py
```

Toàn bộ quyền, nhãn và khai báo độc lập trong test tự động chỉ thuộc ảnh fixture tạo trong thư mục tạm. Không gán xác minh cho ảnh nguồn thật.

Kết quả kiểm thử local ngày 25/11/2026: **11/11 kiểm thử trial/workflow PASS**, **11/11 kiểm thử Studio PASS**; CLI `--help` hoạt động. Có round-trip prepare → verify và freeze → verify bằng fixture, kiểm nhãn bị sửa, revision cũ, quyền/coverage/outcome chưa đủ, liên kết object mơ hồ, nhóm giao split, ảnh test đã biết, exposure, path traversal và seal/file bị sửa. Chưa chạy prepare/freeze trên dữ liệu thật; chưa đo tốc độ audit toàn inventory hoặc đánh giá model.
