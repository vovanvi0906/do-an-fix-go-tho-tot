# AI-DATA-02 — FixGo Dataset Studio

Studio local đã chạy được với inventory **22.680 entry**, trong đó **21.437 ảnh nguồn**. Tái sử dụng IO ảnh/ZIP, inventory, pin catalog/ontology, khóa writer và proposal cũ từ `scripts/ai-data-01/`; giữ annotation Studio, cache AI, session và export trong state riêng. Không thay production application, DB, raw dataset hoặc weights; không train/deploy.

Dashboard đếm 36.643 annotation nguồn trên toàn inventory; 12.030 vùng tái sử dụng ưu tiên trong AI-DATA-01 là tập con đã qua mapping object bảo thủ.

## Khởi động trên Ubuntu

Trong repository, dùng môi trường hiện có (không cần tải model hoặc cài model mới):

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot
ai-service/.venv/bin/python scripts/ai-data-02/studio.py
```

Mở **http://127.0.0.1:8767** bằng Chromium/Chrome. Ctrl+C ở terminal để dừng Studio và worker do chính Studio tạo. Công cụ chỉ bind loopback, có kiểm Host/Origin và CSRF token. Không dùng thay máy chủ nhiều người dùng.

State mặc định: `/home/vanvi/.local/share/fixgo-dataset-studio/`. Pilot 50 ảnh đã có cache inference thật ở đây; mở Studio là xem được, không cần inference lại. State ngoài repository/dataset được bảo vệ bằng writer lock; không mở đồng thời hai Studio cùng state. Có thể dùng `--port 8769 --state /tmp/fixgo-studio-new-review` cho phiên riêng; state mới không kế thừa review/cache. Đổi inventory/catalog/ontology phải dùng state mới, không sửa pin để ép nhận.

Ảnh nguồn phải còn ở đường dẫn của inventory. Nếu đổi máy, phục hồi đúng nguồn hoặc kiểm kê lại vào inventory/state mới. Bản chứng cứ inference có tại [pilot-ai-proposals.json](evidence/pilot-ai-proposals.json), không phải nguồn ground truth.

## Gán nhãn tự động toàn tập

Bấm **Tự động gán nhãn** để chạy toàn bộ ảnh đang lọc (mọi trang) hoặc ảnh đã chọn, tối đa 50.000 ID; không đụng bản duyệt/bản nháp. Có cache/resume, nhóm trùng và hàng đợi lỗi/mâu thuẫn, export YOLO nhãn AI riêng. Đã cấu hình Grounding DINO Tiny tìm dấu hiệu theo sáu nhóm dịch vụ; xem [MULTISERVICE-SIGNS.md](MULTISERVICE-SIGNS.md); có nút AI khoanh ngay trong editor. Bộ CLIP/YOLO cũ chỉ nhận thiết bị. Xem [GROUNDING-DINO.md](GROUNDING-DINO.md). Xem [AUTO-LABELING.md](AUTO-LABELING.md). Backend mới cần khởi động lại Studio sau khi lưu tiến độ.

## Luồng duyệt nhanh

1. Mở ảnh. Nếu chỉ có một thiết bị trong gợi ý, tên thiết bị được điền sẵn; sửa nếu chưa đúng. Việc mở ảnh không tự xác minh nhãn.
2. Với ảnh chưa có kết luận đã lưu, giao diện mặc định “Không thấy dấu hiệu bất thường” (NORMAL) theo lựa chọn của người dùng. Kiểm tra và đổi tình trạng khi cần; ảnh đã lưu giữ nguyên kết luận trước đó. Giá trị mặc định không tự lưu hoặc xác minh ảnh.
3. Bấm **Đã kiểm tra, lưu & tiếp**: một hành động xác nhận rõ ràng thay cho checklist lặp lại. Bạn xác nhận đã xem ảnh, kiểm đúng thiết bị/khung, đầy đủ dấu hiệu và liên kết. Nếu chưa chỉnh vùng, khung gợi ý đang hiển thị được nhận khi xác nhận; các trường geometry ngoài schema được bỏ, không bịa bbox. Sửa khung nếu gợi ý chưa đúng.
4. Ảnh chưa rõ hoặc chưa kiểm xong: **Để xem lại** lưu NEEDS_REVIEW rồi chuyển tiếp; không tự nhận khung gợi ý hoặc xác minh nhãn. Có thể mở lại để sửa tiếp.

Ghi chú không bắt buộc trong luồng UI: khi bỏ trống, lịch sử ghi một tóm tắt thao tác có nội dung rõ ràng, không tạo kết luận quan sát mới. Công cụ chỉnh vùng và ghi chú nằm trong mục thu gọn. Với một object, thay “Thiết bị chính” cũng sửa nhãn vùng đó; với nhiều object, từng vùng được sửa riêng trong công cụ. ABNORMAL vẫn cần sign bbox liên kết; OOS không được chứa vùng đã gán và không nhận gợi ý. Một bản chỉnh đã xóa không tự được nhận lại trong cùng phiên. Tại ảnh cuối, lưu xong vẫn ở ảnh đó và hiện thông báo.

**A**: xác nhận, lưu và tiếp. **S**: để xem lại và tiếp. Checklist kỹ thuật vẫn được lưu trong audit như nội dung của lần xác nhận duy nhất; backend mới ghi `reviewAction=confirm_visible_labels`. Client cũng hỗ trợ backend cũ qua contract reviewChecks hiện có, nên thay đổi luồng UI có thể dùng sau khi reload trang. Không tự xác minh quyền/nguồn, không thay gate export/trial.

## Kéo thả và phân biệt thiết bị/dấu hiệu

Thanh công cụ trên ảnh có **Chọn/kéo (V)**, **Thiết bị (B)**, **Dấu hiệu (D)**. Dùng B khoanh thiết bị; nhãn lấy từ thiết bị chính đã chọn, không lấy thiết bị đầu tiên của catalog. D dùng nhãn dấu hiệu đang chọn (ghi nhớ trong phiên, ưu tiên burn_mark nếu có). Nếu chưa có vùng chỉnh và đang có gợi ý thật, chọn D sẽ đưa gợi ý vào bản chỉnh để bạn kiểm và vẽ dấu hiệu bên trong. Không tự tạo khung thiết bị từ toàn ảnh.

Khung thiết bị màu xanh, dấu hiệu màu tím. Kéo vùng để di chuyển, kéo một trong bốn góc để resize; V chỉ chọn/kéo. Trong chế độ D, kéo trên khung thiết bị để tạo dấu hiệu, kéo một vùng dấu hiệu đã có để di chuyển; Shift+kéo để tạo vùng mới chồng lên vùng cũ. Tool tự gắn dấu hiệu khi tìm được thiết bị bao quanh phù hợp, hoặc dùng thiết bị liên kết đã chọn nếu phù hợp; thiếu liên kết sẽ báo để xử lý, không tự tạo object giả. Vẽ dấu hiệu đặt tình trạng ABNORMAL. Tọa độ vẫn chuẩn hóa theo ảnh, không sửa bytes nguồn.

Nếu vùng nhỏ bị vẽ nhầm là thiết bị: chọn vùng đó, bấm **Đổi vùng này thành dấu hiệu** trong bảng bên phải. Giữ vị trí/ID, lấy nhãn dấu hiệu đang dùng và liên kết với khung thiết bị bao quanh. Không đổi khung thiết bị đang có dấu hiệu con; thiếu thiết bị cha thì dừng và hướng dẫn. Có thể đổi ngược thành thiết bị, Delete xóa, Ctrl+Z/Ctrl+Shift+Z hoàn tác/làm lại. Không sửa ngầm những annotation đã lưu trước đây; cần kiểm và lưu revision mới.

```bash
ai-service/.venv/bin/python scripts/ai-data-02/test_canvas.py
```

Chromium fixture kiểm draw/link, drag không sinh box thừa, resize bốn góc, đổi loại giữ geometry/ID, undo/redo, phím tắt và save ABNORMAL đúng object/sign. Không gán lại nhãn ảnh thật trong quá trình test.

## Tìm thiết bị nhanh

Ô **Thiết bị chính trong ảnh** cho phép gõ tên có dấu/không dấu hoặc slug, ví dụ `tu lanh`, `o cam`, `dieu hoa`. Dùng chuột hoặc ↑/↓ rồi Enter để chọn. Escape/Tab hoặc bấm ra ngoài giữ lại thiết bị đã chọn; từ khóa đang gõ không được lưu thành nhãn. Nếu không có kết quả, đổi từ khóa. Mục “Chưa chọn thiết bị” xuất hiện khi mở danh sách không có từ khóa. Chữ trong bảng kiểm duyệt đã tăng lên 15–17px. Tìm kiếm không thay nhãn cho đến khi chọn một kết quả; nhãn vẫn chỉ được ghi sau thao tác lưu.

## Giao diện kiểm duyệt

Studio dùng workspace toàn màn hình: ảnh tự căn vừa vùng xem, nút − / + để zoom và Vừa khung để đặt lại. Bảng bên phải cuộn độc lập, chia ba tab **Gán nhãn**, **Nguồn & quyền**, **Chi tiết**; nút lưu/xác nhận luôn ở cuối. Có thể nhập tên reviewer ngay trong editor. Tab Chi tiết chứa JSON, provenance và lịch sử; nguồn và AI vẫn là lớp chỉ đọc.

Khi có thay đổi chưa lưu, chuyển ảnh hoặc đóng editor sẽ hỏi trước khi bỏ thay đổi; reload/đóng tab cũng cảnh báo. Bản nháp chưa lưu vẫn chưa có chức năng khôi phục tự động. Chép gợi ý vào bản đã có vùng cần xác nhận thay thế và có thể undo. Ở chế độ Chọn/chỉnh, bấm nền bỏ chọn thay vì tạo bbox mới. Nút `?` mở hướng dẫn phím tắt. Thao tác hàng loạt nằm trong mục thu gọn dưới bộ lọc thư viện.

Kiểm thử riêng giao diện mới bằng fixture, không chạy inference hoặc ghi review vào ảnh thật:

```bash
ai-service/.venv/bin/python scripts/ai-data-02/test_redesign.py
```

Chromium đã kiểm tra thư viện, canvas, draw/undo/redo, zoom, cảnh báo chưa lưu, duyệt một hành động/tự chuyển ảnh, gate UNKNOWN/ABNORMAL/OOS và các tab; bốn viewport 1920/1024/768/390 px không tràn ngang editor, 0 page error. 11 kiểm thử domain Studio hiện có vẫn pass. Pilot thật được xem chỉ để kiểm bố cục, không xác nhận nhãn/quyền.

## Nguồn/quyền theo dataset

Bấm **Nguồn dataset** để khai báo một lần cho cả project/phiên bản Roboflow. Bốn URL người dùng cung cấp đã có thông tin nguồn và giấy phép công bố điền sẵn; bạn xác nhận hồ sơ một lần, ảnh đúng nguồn kế thừa khi lưu. Không tự xác minh nhãn ảnh. Xem [ROBOFLOW-SOURCES.md](ROBOFLOW-SOURCES.md). Tính năng backend mới cần lưu tiến độ và khởi động lại Studio nếu đang dùng tiến trình cũ.

## Quy trình kiểm duyệt cụ thể

1. Dashboard hiển thị số ảnh, annotation nguồn và sáu trạng thái. Mặc định lọc pilot 50; bỏ **Pilot 50** rồi bấm **Lọc** để xem toàn bộ 22.680 entry. Grid chỉ trả 24 record/trang, ảnh thumbnail lazy load. Dùng Category → Target, nguồn corpus, nhóm nguồn/trùng, dấu hiệu, trạng thái hoặc ID/đường dẫn để lọc. Nhãn ở bộ lọc gồm nhãn nguồn/AI/review, chưa hàm ý đã xác minh.
2. Điền tên người kiểm duyệt rồi mở ảnh. Xám: annotation nguồn/polygon và bbox admin đã lưu; cam: detector AI; xanh: bản đang chỉnh. Source fault label chỉ là lời khai nguồn, không phải dấu hiệu đã quan sát. Mục chi tiết lưu đầy đủ source labels, provenance, model hash và score AI.
3. Chọn **Chép bbox nguồn để sửa** hoặc **Chép AI để sửa** nếu phù hợp. Đây là sao chép proposal vào bản chỉnh; không tự xác nhận. Chỉ các vùng nguồn có mapping object bảo thủ được chép. Bbox admin cũ/polygon vẫn xem được ở lớp nguồn và phần chi tiết, không được tự nâng thành nhãn đã duyệt.
4. Chọn **Vẽ bbox mới**, loại Object và target thực trong catalog; kéo trên ảnh. Có thể vẽ nhiều instance. Đổi sang **Chọn / di chuyển / resize** để chọn, kéo hoặc kéo góc dưới phải. Nhãn từng box sửa ở danh sách; xóa object sẽ xóa các dấu hiệu liên kết để tránh orphan.
5. Vẽ dấu hiệu: chọn loại **Dấu hiệu quan sát**, đọc evidence rule/negative example, chọn object instance liên kết rồi kéo vùng dấu hiệu. Có thể vẽ nhiều dấu hiệu trên một object, nhiều object trên một ảnh. Không vẽ bbox cho lỗi vận hành suy ra, nguyên nhân ẩn hay tên lỗi chưa có trong ontology. UI không tự dự đoán defect bằng checkpoint chỉ nhận diện object.
6. Chọn tình trạng bằng ngôn ngữ giao diện (tương ứng NORMAL / ABNORMAL / UNKNOWN / OUT_OF_SCOPE / NEEDS_REVIEW). Classification target là nhãn ảnh, hữu ích khi chưa có bbox; nhiều object vẫn cần người dùng chọn rõ target classification. NORMAL không tự suy từ TXT rỗng. ABNORMAL cần dấu hiệu nhìn thấy có bbox, object liên kết và kiểm tương thích target. OUT_OF_SCOPE không được chứa supported target/bbox.
7. Ghi chú khi cần. **Để xem lại** lưu tiến độ NEEDS_REVIEW và chuyển tiếp; **Đã kiểm tra, lưu & tiếp** ghi xác nhận HUMAN_VERIFIED chỉ khi tình trạng/nhãn đủ điều kiện, không cần tick từng checkbox. Trường quyền/nguồn có thể để UNVERIFIED trong lúc gán nhãn. Muốn export chính thức phải bổ sung bằng chứng thật, loại quyền và xác nhận đã kiểm tra quyền. Công cụ không xác minh danh tính reviewer hay tính xác thực pháp lý của tài liệu thay tổ chức.
8. Undo/redo áp dụng cho chỉnh bbox trong phiên. Lịch sử lưu append-only và hash-chain; khôi phục revision tạo revision mới **NEEDS_REVIEW**, bỏ xác nhận quyền, giữ nguyên lịch sử. Reload khôi phục ảnh đang xem, filter, trang, reviewer và annotation đã lưu. Nét vẽ/ghi chú **chưa bấm lưu** không được phục hồi.
9. Ở grid, chọn nhiều ảnh rồi ghi chú và bấm **Đánh dấu cần xem lại** / **Loại ảnh đã chọn**. Bulk tối đa 100 ảnh, không clone bbox, không HUMAN_VERIFIED, không cấp quyền. Mỗi ảnh có audit event riêng; lỗi giữa chừng có thể để lại các event đã fsync, cần reload kiểm tra trước khi thao tác lại.
10. Chọn ảnh ở grid → **Xuất dataset** → định dạng + version mới + seed. Kết quả hiện đường dẫn thư mục local trong state/exports. Không tự tải lên production hoặc chạy train.

Phím tắt khi đang xem ảnh và không focus input/select/button: J/→ tiếp; K/← trước; Space bỏ qua; S lưu NEEDS_REVIEW và tiếp; A xác nhận HUMAN_VERIFIED bằng một hành động rồi tiếp; X loại; E focus vùng công cụ; Ctrl+Z / Ctrl+Shift+Z undo/redo bbox.

## Inference offline

Bấm **AI ảnh đã chọn / pilot**: nếu không chọn ảnh, chạy pilot 50. Một worker tuần tự, CPU 2 threads, RSS guard 3.072 MiB. CLI cho phép 1–4 threads, batch 1–500 ID. Cache hit vẫn rehash ảnh nguồn; chỉ tái sử dụng nếu source hash, model/code/catalog profile và cache hash phù hợp. Việc xác minh của người dùng không bị worker AI hạ trạng thái.

```bash
# Tạo danh sách đúng 50 ID từ pilot, không phụ thuộc /tmp của lần kiểm thử.
ai-service/.venv/bin/python -c 'import csv,json; from pathlib import Path; p=Path.home()/".local/share/fixgo-dataset-studio/pilot-ids.json"; p.write_text(json.dumps([r["image_id"] for r in csv.DictReader(open("docs/ai-data-audit/evidence/pilot-review-queue.csv"))]))'
ai-service/.venv/bin/python scripts/ai-data-02/batch.py \
  --inventory docs/ai-data-audit/image-inventory.csv \
  --state "$HOME/.local/share/fixgo-dataset-studio" \
  --ids "$HOME/.local/share/fixgo-dataset-studio/pilot-ids.json" \
  --threads 2 --ram-mb 3072
```

Dùng CLIP ViT-B/32 đã cache, `ai-service/weights/yolov8n-cls-fixgo.pt`, detector strict-v2 5 object đã có. Không import app server, không gọi backend DB/API. Thay provider catalog **trong worker riêng** bằng snapshot catalog thật; inference vẫn chạy model thật. `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`; thiếu CLIP/classifier cache thì báo lỗi, không download. Detector thiếu thì không có proposal bbox; không bịa geometry. Các checkpoint hiện có **không phân loại defect**.

Tối đa 3 target/ảnh; category/target dùng ID snapshot thật. Category gate hiện hành confidence ≥0,48 và margin ≥0,10; target cosine tối thiểu 0,20. Score CLIP affine/cosine và confidence YOLO **không phải xác suất đã hiệu chỉnh**. Category không qua gate được giữ unknown; nếu detector có target vẫn hiển thị target và đánh dấu không chắc chắn. Không tự kết luận OOS từ confidence thấp.

Cache `ai-cache/<imageId>.json`, `active-model-profile.json`, `batch-progress.json`, log `batch-worker.log`. Bị ngắt thì chạy lại cùng batch; cache từng ảnh hoàn tất được giữ atomic. CLI và UI chia sẻ batch lock. RSS guard kiểm mỗi 250 ms và dừng worker khi vượt ngưỡng; đây là giới hạn quan sát, có thể vượt ngắn hạn trước khi bị dừng, **không phải cgroup hard limit**. Phần hash profile chạy trước giai đoạn guard và dùng streaming để tránh giữ weight bytes trong RAM. Muốn giới hạn cứng toàn tiến trình có thể bọc CLI bằng `systemd-run --user --scope -p MemoryMax=3G -p CPUQuota=200% ...` trên Ubuntu có user systemd; cách bọc này chưa được kiểm thử trong task.

## Trạng thái và audit trail

- UNREVIEWED: chưa có annotation nguồn có cấu trúc, AI hay review.
- SOURCE_ANNOTATED: có annotation nguồn hoặc bbox admin cũ; không mặc định đúng/quyền hợp lệ.
- AI_PROPOSED: có cache model hiện hành; không phải ground truth.
- NEEDS_REVIEW: người dùng lưu draft cần kiểm tra.
- HUMAN_VERIFIED: người dùng kiểm từng ảnh và xác nhận tường minh; quyền được kiểm riêng.
- REJECTED: người dùng loại; giữ lịch sử.

Audit `studio-events.jsonl`: imageId, sourcePath, contentHash, duplicateGroupId, targetId/targetIds, objectLabel, defectLabels, boundingBoxes (objectId link), annotationSource, modelVersion, reviewStatus, reviewedAt, reviewer, licenseStatus và bằng chứng. Mỗi revision có parentRevision, previousHash, eventHash. Pin snapshot + SHA ảnh + optimistic revision chống lưu bản cũ/ảnh đổi. Đây là integrity cục bộ, không chữ ký chống người có toàn quyền sửa đồng thời log/pin. `approvedGroundTruth=false`, `independentlyReviewed=false`, `independentTestEligible=false`; không tự phê duyệt production.

## Export và chia tập

- **YOLO Detection**: ảnh giữ bytes, `images/train|val`, `labels/train|val`, `data.yaml`, metadata CSV và manifest JSON. Class index liên tục: 70 `object:<slug>` theo slug, tiếp 10 `sign:<code>` theo code; có mapping trong manifest. Object/sign là các class riêng; liên kết sign→object lưu trong JSON vì TXT YOLO không biểu diễn quan hệ. Empty TXT chỉ cho OUT_OF_SCOPE đã xác minh, không coi thiếu bbox là negative.
- **Image Classification**: `train|val/<target-slug>/...`, hoặc `other_unclear` cho OOS đã xác minh. Nhiều target phải chọn rõ classificationTargetId. Manifest giữ quan hệ đối tượng/dấu hiệu.
- **CSV/JSON metadata**: chỉ nhãn đã duyệt và đủ quyền/nguồn; không copy ảnh.
- **Annotation review manifest**: cho phép proposal chưa duyệt, không copy ảnh hay tạo training labels; ghi rõ NON-GT và từng trạng thái. Không được dùng như dataset huấn luyện chính thức.

Ba định dạng đầu kiểm HUMAN_VERIFIED, SHA ảnh không đổi, quyền VERIFIED + xác nhận + loại quyền + bằng chứng, provenance có nội dung; YOLO kiểm bbox, classification kiểm target. Báo rõ imageId và các trường thiếu; preflight thất bại không tạo dataset version. Version mới, temp staging và rename, không ghi đè thư mục tồn tại hoặc ảnh nguồn.

Grouping kết hợp toàn bộ inventory (kể cả ảnh không được chọn) theo source component, SHA, pixel hash, pHash component và duplicate-group IDs. Group bridge ngoài selection vẫn được nối. Seed cố định + thứ tự group ổn định tạo split tái lập; nhóm từng train luôn ở train; nhóm từng val/test chỉ là val development; nhóm synthetic ở train. Không có split test. Near-duplicate/source component là heuristic bảo thủ; chưa chứng minh độc lập về thiết bị/cảnh thực. Khi chưa đủ hồ sơ nguồn/cảnh, việc không có overlap hash **không chứng minh không có semantic leakage**.

Export schema `fixgo.studio.development.v1`, **khác** ZIP `fixgo.dataset.v1` 18 cột của importer production. Đây là dataset nghiên cứu có quan hệ multi-instance/sign; không sửa hoặc nới importer/export gate hiện hành. Manifest ghi `trainingEligibility.automaticallyApproved=false`, kiểm có cả train/val; export một group có thể thiếu validation và chưa đủ điều kiện training. Quyền, review độc lập, coverage, balance, nguồn/cảnh và gate training hiện hành vẫn cần được xét. Không train/deploy trong tool.

CLI export (dừng Studio trước vì dùng cùng writer lock):

```bash
ai-service/.venv/bin/python scripts/ai-data-02/exporter.py \
  --state "$HOME/.local/share/fixgo-dataset-studio" \
  --ids "$HOME/.local/share/fixgo-dataset-studio/pilot-ids.json" \
  --format review-manifest --version pilot-review-v1 --seed 42
```

Đổi `--format yolo|classification|metadata` sau khi người dùng hoàn thành review/quyền. Pilot hiện tại sẽ bị chặn đúng gate.

## Adapter trial và test đóng băng

Đã có CLI `scripts/ai-data-02/trial.py` với `prepare`, `freeze`, `verify`. Xem [TRIAL-WORKFLOW.md](TRIAL-WORKFLOW.md) để tạo hồ sơ review, chuẩn bị YOLO trial từ export Studio và tiếp nhận ảnh test mới. Bộ test đóng băng vẫn chờ thẩm định độc lập; không nâng pilot thành test, không train/activate.

## Pilot và phần còn cần người dùng

Lộ trình bổ sung detector dấu hiệu: [SIGN-DETECTION-PLAN.md](SIGN-DETECTION-PLAN.md). Phạm vi đề xuất gồm 4 dấu hiệu đã có trong ontology; ghi rõ điều kiện dữ liệu, test độc lập và adapter còn thiếu giữa Studio export với công cụ train hiện tại.

Dùng đúng [50 ID AI-DATA-01](../ai-data-audit/evidence/pilot-review-queue.csv), 10 ảnh mỗi target, **50 source component khác nhau**, không thay selection. Inference thật hoàn tất; **0 HUMAN_VERIFIED**, quyền chưa xác minh. [Queue vai trò](evidence/pilot-review-roles.csv) gồm 9 ứng viên lỗi theo source fault claim, 3 ứng viên bề ngoài bình thường do xem ảnh để phân luồng, 16 ứng viên khó/scope; có overlap, không cộng thành tổng ảnh. Ví dụ `img-19564` có source claim `leaking_faucet`; phải phân biệt nước đang chảy bình thường với rò thật trước khi gán dấu hiệu. `img-11219` là ứng viên xem normal, `img-10576` ảnh ổ cắm tối/khó. Đây **không phải nhãn đã xác minh** và không bảo đảm ảnh có lỗi vận hành. Không có GT độc lập nên không báo accuracy/mAP.

Chưa có `docs/ai-knowledge/`: adapter trả `NO_AI_KNOWLEDGE_TAXONOMY_INSTALLED`, `targetDefectRules=null`. Chỉ hỗ trợ 10 observable signs đã pin; không tạo defect taxonomy, không có danh sách defect được duyệt riêng theo target. AI-KNOWLEDGE-01 cần cung cấp taxonomy, mapping target và version thực trước khi bổ sung adapter; hiện vẫn yêu cầu reviewer xác nhận sign-target compatibility.

Các điều kiện còn thiếu để dùng pilot chính thức: review trực tiếp và xác nhận normal/abnormal/OOS, bbox/sign cần thiết, provenance và quyền có bằng chứng, kiểm tra nhóm cảnh/source thực và đủ train/val theo nhiệm vụ, xét gate hiện hành. Không có independent real test được tạo. Tool không tự thu thập thêm ảnh, tạo chứng cứ quyền, gán bbox giả hay sửa nguồn.

## Kiểm thử

```bash
ai-service/.venv/bin/python scripts/ai-data-02/test_studio.py
# Trong khi Studio thật có cache pilot đang chạy ở 8767, để trống port 8768:
ai-service/.venv/bin/python scripts/ai-data-02/test_ui.py
```

UI test dùng Playwright/Chromium đã cài của repository, tự tạo rồi hủy state fixture riêng ở `/tmp`; chỉ fixture mới có nhãn HUMAN_VERIFIED/bằng chứng quyền giả lập để kiểm gate. Không xác minh ảnh nguồn thật. Xem [TEST-REPORT.md](TEST-REPORT.md) và [evidence](evidence/).
