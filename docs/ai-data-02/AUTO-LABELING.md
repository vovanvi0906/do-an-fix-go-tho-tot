# Tự động gán nhãn — dữ liệu AI chưa kiểm chứng

## Grounding DINO đã tích hợp

Đã cài Grounding DINO Tiny, cấu hình tìm dấu hiệu theo **sáu nhóm dịch vụ**; xem [MULTISERVICE-SIGNS.md](MULTISERVICE-SIGNS.md). Sau khi khởi động lại server, mở ảnh chưa duyệt sẽ tự chạy nhận diện (có ô bật/tắt). Luồng dùng detector YOLO strict-v2 sẵn có để nhận diện thiết bị rồi Grounding DINO tìm dấu hiệu theo thiết bị; DINO tìm đối tượng khi YOLO chưa có kết quả và scope đủ hẹp. Có thể chạy lại bằng nút **AI nhận diện dấu hiệu bất thường**, hoặc chạy batch trong hộp tự động. Không tìm thấy dấu hiệu giữ trạng thái chưa rõ, không tự kết luận bình thường. Xem [GROUNDING-DINO.md](GROUNDING-DINO.md) cho cài đặt, smoke thật và giới hạn. Phần checkpoint YOLO riêng bên dưới vẫn được hỗ trợ.

## Dùng nhanh

1. Lưu bản đang chỉnh rồi khởi động lại Studio bằng `ai-service/.venv/bin/python scripts/ai-data-02/studio.py` nếu server cũ đang chạy. Tính năng này thêm endpoint/worker Python nên chỉ reload HTML là chưa đủ.
2. Trong thư viện, chọn bộ lọc phù hợp; bỏ Pilot 50 nếu muốn toàn tập. Bấm **Tự động gán nhãn**.
3. Chọn **Toàn bộ ảnh đang lọc (mọi trang)** hoặc **Ảnh đã chọn**, rồi **Chạy tự động**. Không cần mở và xác nhận từng ảnh. Những ảnh đã có revision người dùng, kể cả bản nháp, được bỏ qua.
4. Xem số đề xuất, ảnh cần kiểm tra, lỗi và nhóm/gần trùng. Có thể lọc hàng đợi, mở một số ảnh để kiểm mẫu. Nhãn vẫn AI_PROPOSED; không sinh HUMAN_VERIFIED.
5. Khi hoàn tất, đặt version và bấm **Xuất YOLO nhãn AI**. Không có bước phê duyệt từng nhãn. Hồ sơ nguồn/quyền của dataset phải được xác nhận một lần từ trước để copy ảnh; ảnh lỗi, mâu thuẫn, có revision người dùng hoặc thiếu hồ sơ quyền sẽ được liệt kê trong `excluded` và không copy.

Nút **Dừng sau ảnh hiện tại** dừng ở ranh giới ảnh; **Tiếp tục từ cache** chạy lại cùng request. Source hash và model profile vẫn được kiểm. Đóng popup không dừng worker. Tắt server sẽ kết thúc worker do server tạo; lần mở tiếp theo có thể tiếp tục. Lỗi đọc/inference của một ảnh không làm dừng toàn tập; lỗi nạp model hoặc vượt RAM sẽ dừng để xử lý/tiếp tục.

## Khả năng thực tế

Chế độ **CLIP/YOLO hiện có** tái sử dụng CLIP ViT-B/32, YOLO classifier và detector strict-v2. Khi DINO đã được cài, UI ưu tiên engine DINO theo thiết bị/danh mục; không nạp chung bộ model nền. Các checkpoint này nhận diện nhóm/thiết bị, **không phát hiện vết cháy/nứt**. Vì vậy:

- Có thể tự tạo nhãn/vùng thiết bị trong khả năng detector.
- Không lấy tên file, nhãn nguồn `burn_mark` candidate hay tình trạng mặc định NORMAL của UI để chế tạo vùng dấu hiệu.
- Không phát hiện dấu hiệu không có nghĩa bình thường. `outcome` của nhãn tự động luôn UNKNOWN.
- Chế độ **Thiết bị + dấu hiệu** chỉ bật khi request có checkpoint dấu hiệu local hợp lệ. Nếu chưa có, export chỉ chứa class object, tránh biến thiếu nhãn dấu hiệu thành ảnh âm.

Có model dấu hiệu: mở phần nâng cao, nhập đường dẫn manifest. Ví dụ cấu trúc, **chỉ điền hash và tên class đúng checkpoint thực tế**, không đổi tên class COCO để giả thành detector cháy:

```json
{
  "schema": "fixgo.studio.pseudo-detector.v1",
  "task": "detect",
  "weights": "burn-detector.pt",
  "weightsSha256": "<SHA256 checkpoint local>",
  "threshold": 0.5,
  "classes": [
    {"name": "object:o-cam-dien", "kind": "object", "targetId": "<ID thật trong catalog>"},
    {"name": "sign:burn_mark", "kind": "sign", "code": "burn_mark", "targetId": "<ID thật trong catalog>"}
  ]
}
```

Class index theo thứ tự array và phải khớp `model.names`; task phải detect. `targetId` của sign có thể bỏ trống nếu model không chuyên thiết bị; khi đó cần một object bao quanh rõ ràng. Model sign-only dùng object geometry từ detector nền. Model object+sign dùng object geometry của chính nó để tránh tạo object trùng với detector nền. Sign phải có một object tương thích bao ít nhất 80% diện tích; mơ hồ/không có parent thì đưa vào hàng đợi, không chế bbox hoặc gắn bừa. Confidence chưa được hiệu chỉnh, threshold không phải cam kết độ chính xác.

Tool không tải dependency/weights, không train model dấu hiệu và không tạo phê duyệt production. Quy trình chỉ tự động được những nhãn mà model thực tế hỗ trợ.

## Cache, nhóm và trạng thái

- Một worker tuần tự, 2 CPU threads; giới hạn queue 50.000 ID. Nút AI cũ vẫn giới hạn 500, không thay contract cũ.
- Source bytes được rehash trước dùng cache. Ảnh trùng **đúng SHA bytes** có thể dùng lại kết quả của ảnh trước trong cùng queue, với ID/path/hash cache mới và trường `reusedFromImageId`. Không sao chép nhãn giữa ảnh chỉ gần giống.
- Nhóm bảo thủ nối toàn inventory theo source component, SHA/pixel hash/pHash component, kể cả bridge ngoài selection. Report ghi representative và nhóm/gần trùng; không tự xóa ảnh nguồn hoặc giả định cùng nhóm là cùng thiết bị thật.
- Chia train/val development tái lập, giữ exposure trước đây theo `exporter.partition`. Không có test độc lập. Sau khi loại ảnh, một tập có thể rỗng; manifest ghi `hasTrainAndValidation`.
- Ảnh không có geometry, category/target không chắc, classifier–detector hoặc nguồn–model mâu thuẫn được tách NEEDS_REVIEW. Lỗi ảnh/cache là ERROR. PROPOSED chỉ có nghĩa chưa gặp các cờ kiểm tra đã định nghĩa, **không có nghĩa nhãn đúng**.
- Source/sign/score/model version đến từ inference thật; thông tin nguồn chỉ dùng đối chiếu, không mặc định là ground truth.
- RSS guard lấy mẫu 250 ms, 3.072 MiB, bao cả profile/inference/report của auto worker; không phải hard cgroup cap. Report lớn vẫn có thể chạm guard và cần thu nhỏ scope. Model load/hash thời gian đầu khác thời gian inference timer.

## File và export riêng

State chứa `auto-runs/<runId>/request.json`, `progress.json`, `report.json`, `report-seal.json`, `worker.log`; cache vẫn trong `ai-cache`. Request pin inventory/catalog/ontology và manifest dấu hiệu; report pin model/code/source hashes. Báo cáo/queue có phân trang 24 ảnh trên UI.

Output ở `state/pseudo-exports/<version>/`: ảnh giữ bytes, YOLO TXT, data.yaml, manifest, attribution và SHA256SUMS. Schema **`fixgo.studio.pseudo.v1`**, `labelStatus=AI_UNVERIFIED`, `humanVerified=false`, `independentTest=false`, `automaticallyApproved=false`. Không phải ZIP importer production, không được adapter trial hiện tại nhận như dataset đã duyệt. Luồng export chính thức và gate rights/human của trial giữ nguyên.

Trong export **objects-and-signs**, chỉ giữ ảnh có ít nhất một sign proposal hợp lệ và không có cờ lỗi/mâu thuẫn. Ảnh không phát hiện sign không được xuất thành negative đã xác minh. Đây vẫn là pseudo-labels có sai số; có thể thiếu các dấu hiệu thật ngoài khả năng model hoặc dưới threshold. Không dùng dataset này làm ground truth để báo accuracy của chính model đã tạo nhãn.

Export kiểm lại report seal, profile hiện hành, source/cache, revision người dùng và hồ sơ quyền hiện hành; không chạy đồng thời với inference. Không cập nhật hoặc ghi đè annotation, model, raw dataset hay DB. Không sửa export version đã tồn tại. Seal local phát hiện thay đổi thông thường, không chống người có toàn quyền sửa cả dữ liệu lẫn seal.

Có thể chạy tiếp một request đã tạo bằng UI, khi Studio đã dừng hoặc không có batch khác:

```bash
ai-service/.venv/bin/python scripts/ai-data-02/autolabel.py \
  --inventory docs/ai-data-audit/image-inventory.csv \
  --state "$HOME/.local/share/fixgo-dataset-studio" \
  --run-id '<runId từ UI>'
```

Dùng nút Tiếp tục để bỏ marker STOP đúng luồng. CLI giữ nguyên marker để không tự hủy yêu cầu dừng trước đó.

## Kiểm chứng

```bash
ai-service/.venv/bin/python scripts/ai-data-02/test_autolabel.py
ai-service/.venv/bin/python scripts/ai-data-02/test_auto_ui.py
```

Unit/browser tests dùng ảnh fixture và prediction stub được khai báo, không tạo quyền hoặc nhãn verified cho ảnh thật. Bao gồm queue 501 ảnh vượt giới hạn cũ, exact-duplicate cache reuse, cache/resume, lỗi một ảnh, lỗi load model, nhóm bắc cầu/exposure, mâu thuẫn, thiếu model dấu hiệu, optional sign linkage, rights, schema/export và CSRF.

Smoke thật chạy 3 ảnh pilot development trong state `/tmp` riêng bằng model offline hiện có; không tải weights, không sửa nhãn thật. Cả 3 inference thành công nhưng đều vào hàng đợi cần kiểm: 2 classifier/detector mâu thuẫn, 1 model uncertain. Không có model dấu hiệu; không kết luận độ chính xác. Xem [evidence/auto-label-real-smoke.json](evidence/auto-label-real-smoke.json). Chưa chạy toàn bộ 22.680 entry hoặc train/deploy.

Kết quả kiểm chứng local ngày 25/11/2026: **41 kiểm thử backend pass** (11 automation + 30 hồi quy), ba suite Chromium auto/manual/canvas pass, 0 page error. Lượt smoke thật cuối: 3/3 inference thành công, cache 0, worker timer 7,461 giây; peak RSS toàn worker 1.856,52 MiB. Lượt tiếp tục: 3/3 cache hit, 0 lỗi, loop timer 0,001 giây; peak RSS toàn worker 407,06 MiB. Loop timer không gồm hash/profile/khởi động/report. Hash 3 artifact model và adapter được đối chiếu sau smoke. Đây là bằng chứng vận hành, không phải độ chính xác nhãn.

### Khi thấy ô tự động nhưng không có khung

Giao diện HTML được đọc lại từ đĩa, còn backend Python chỉ đổi sau khi khởi động lại tiến trình. Vì vậy HTML mới có thể chạy cùng backend cũ. `/api/config` của bản hiện tại có `runtimeVersion: studio-hybrid-auto-v1` và `groundingDino.autoInspect: true`. Giao diện hiện báo rõ nếu backend cũ/thiếu model, giữ UNKNOWN khi chưa chạy AI thay vì âm thầm coi là NORMAL.

Đã cập nhật tiến trình tại 8767 và chạy trực tiếp ảnh `zip-35238263b8d8ad54` bằng API thật (run `auto-ecab4839341b4969`): hoàn thành 16,276 giây; UI hiển thị Ổ cắm điện, ABNORMAL, 1 vùng thiết bị và 2 đề xuất dấu hiệu (cháy/xém, gãy/vỡ trùng vùng cần kiểm tra). Không thay revision người dùng. Browser regression kiểm thêm backend cũ phải hiện lỗi thay vì bỏ qua im lặng.


### Lượt dữ liệu nhiều dịch vụ từ ZIP ngày 26/11/2026

Các ZIP trong `/home/vanvi/Work/datasetai` được kiểm kê bằng `multiservice_data.py`. Bộ kiểm kê ghi checksum archive/ảnh, tọa độ, bbox/polygon và split nguồn. ZIP có nhiều `data.yaml` giống hệt nhau được đọc nhất quán; member trùng nhưng khác nội dung bị chặn. 27 ảnh có tọa độ không hợp lệ được tách khỏi 2.579 ảnh đọc được.

`multiservice-taxonomy.json` là cấu hình nhãn **thử nghiệm**, không sửa danh mục dịch vụ hoặc DB production. Các nhãn mới giữ ngữ nghĩa hình học: `scorched_outlet` bao ổ cắm có dấu cháy, không giả làm bbox vết cháy nhỏ; `visible_water` chỉ mô tả vùng nước; `exposed_conductor` không tự kết luận nguy hiểm hoặc hỏng. Bộ đang có không chứa dữ liệu làm vườn.

`build_multiservice_trial.py` ánh xạ các lớp nguồn được chọn, chuyển polygon thành enclosing bbox, dùng CLIP cục bộ đối chiếu crop với mô tả dấu hiệu/counterexample và tách ảnh không rõ. Đây là lọc ngữ nghĩa heuristic, không kiểm chứng chính xác vùng lỗi. Có xem mẫu trực quan 69 trường hợp, không tuyên bố đã xem từng ảnh độ phân giải gốc trong toàn bộ ZIP. Ảnh mẫu thấy watermark stock được tách; không khẳng định quyền của mọi ảnh còn lại đã được xác minh riêng.

Bản đầu tạo **728 ảnh: 589 train / 139 validation**, gồm 106 ảnh âm theo nhãn nguồn và bộ lọc AI. Nhãn vẫn `AI_UNVERIFIED`; không phải test độc lập hay ground truth được chuyên gia phê duyệt. Giữ nguyên các ảnh/nhãn đã duyệt trước đó, bổ sung 22 đề xuất bụi/bẩn có mức chắc chắn trực quan cao từ báo cáo AI riêng. Lý do loại và nhóm ảnh được lưu trong manifest.

Đường dẫn:

- Audit: `/home/vanvi/Work/datasetai/02-curated/multiservice-source-audit-v1/audit.json`.
- Dữ liệu: `/home/vanvi/Work/datasetai/02-curated/fixgo-multiservice-ai-v1/data.yaml`.
- Train và đánh giá: `/home/vanvi/Work/datasetai/04-training/fixgo-multiservice-v1/`.
- Bundle chạy thử: `/home/vanvi/Work/datasetai/05-models/fixgo-observable-v1/` (chỉ tồn tại sau bước đánh giá/đóng gói).

Các script dừng nếu đầu ra dữ liệu đã tồn tại. Để tái lập trên dữ liệu mới, chọn một version mới trong cấu hình, không ghi đè version cũ.

```bash
ai-service/.venv/bin/python scripts/ai-data-02/multiservice_data.py
ai-service/.venv/bin/python scripts/ai-data-02/build_multiservice_trial.py
ai-service/.venv/bin/python scripts/ai-data-02/train_multiservice_trial.py --stage head
ai-service/.venv/bin/python scripts/ai-data-02/train_multiservice_trial.py --stage finetune
ai-service/.venv/bin/python scripts/ai-data-02/evaluate_multiservice_trial.py
```

Model được chọn theo development validation, rồi chọn kích thước ảnh/ngưỡng trên chính validation đó; không trình bày các số này như độ chính xác trên người dùng thật. Model bundle giữ taxonomy, ontology thử nghiệm, checksum, attribution và evaluation; không tự triển khai vào Studio hay ai-service chính.

Chạy thử bundle sau khi đóng gói:

```bash
ai-service/.venv/bin/python scripts/ai-data-02/predict_observable_trial.py \
  --image '/đường/dẫn/ảnh.jpg' \
  --output '/home/vanvi/Work/datasetai/04-training/du-doan-anh-001'
```

Chọn thư mục output chưa tồn tại. Script ghi `prediction.jpg` có khung và `prediction.json` có tên tiếng Việt, vùng ảnh và score. Không phát hiện không có nghĩa thiết bị bình thường. Model này tìm dấu hiệu; không tự gắn dấu hiệu sang một thiết bị khi có nhiều thiết bị, không chẩn đoán nguyên nhân. Checksum weights và thứ tự class được đối chiếu trước inference.

Kết quả thực chạy: head 20 epoch, finetune dừng sớm sau 14 epoch (giới hạn 15). So sánh hai checkpoint ở 320/480 chọn finetune 320: **mAP50 0,4807; mAP50–95 0,3179**. Ngưỡng 0,15 chọn theo micro-F1 validation cho precision 0,4479, recall 0,5290; 2/24 ảnh âm có cảnh báo. 24 ảnh âm này thuộc nhóm ổ cắm, không đại diện mọi dịch vụ. Các số này dựa trên nhãn nguồn/AI và cùng validation dùng chọn cấu hình, không phải độ chính xác thực tế độc lập.

Đã kiểm tra bundle bằng loader và chạy script dự đoán thật trên bốn ảnh validation chọn trước inference. `demos/comparison.jpg` và `demos/visual-smoke-review.json` giữ cả lỗi: bỏ sót ổ cắm cháy, nhầm nứt thành bẩn, nhiều bbox nước chồng nhau và bao cả bồn cầu; ảnh thảm bẩn có đề xuất tương ứng. Không thay detector chính bằng bản này. Kết quả từng lớp ở `per-class-metrics.csv`, báo cáo đầy đủ ở `report.json` trong thư mục train; bundle có bản sao `evaluation.json`.

### Test nguồn ngoài cho riêng lớp nứt

Ngày 26/11/2026 dùng [CrackForest gốc](https://github.com/cuilimeng/CrackForest-dataset), commit `ed57c2d96754e6c7d105805cd29aeeb3a799f267`, chỉ dành nghiên cứu phi thương mại theo README nguồn. Không nhập vào train. Script `external_crack_test.py prepare` đối chiếu toàn bộ 118 cặp ảnh/seg với các ảnh audit và development trước đó. 71 ảnh bị heuristic đánh dấu nghi gần trùng được loại thận trọng; có thể gồm false match do nền mặt đường tương tự. Đây là tập con đã lọc, không phải benchmark CFD chuẩn đủ 118 ảnh. Còn 47 ảnh, tất cả có nứt. Mask ASCII được đối chiếu với `groundTruth/*.mat` cho cả 118 ảnh, giữ mọi vùng foreground (có trường hợp nhiều hơn hai segment).

Đóng băng `/home/vanvi/Work/datasetai/03-tests/crackforest-external-v1/protocol.json` và checksum ảnh, nhãn, mask trước inference. Giữ nguyên weights SHA, kích thước 320 và threshold 0,15 đã chọn trên development validation; không thử ngưỡng/model khác sau test. Không chạy lại test để chọn cấu hình. `data.yaml` phục vụ loader đánh giá, tuyệt đối không dùng làm input train; script chỉ có `prepare` và `evaluate`.

Kết quả: 15/47 ảnh có ít nhất một dự đoán crack (image recall 31,9%, không phải accuracy). Dùng một enclosing bbox của toàn bộ foreground mỗi ảnh làm **proxy localization**: 12 TP, 9 FP, 35 FN ở IoU 0,5; precision 57,1%, recall 25,5%; AP50 0,2653, AP50–95 0,1060. Mask pixel coverage bằng các hình chữ nhật dự đoán là 31,0%, không phải segmentation IoU. Khung bao lớn có thể làm coverage tăng giả tạo.

Đây là test **nguồn ngoài cho vết nứt mặt đường**, khác miền ảnh tường/thiết bị gia dụng. Không có ảnh âm nên chưa đo được cảnh báo nhầm trên cảnh không nứt. Không đánh giá chín lớp còn lại và không chứng minh toàn bộ FixGo đã qua test độc lập. Không thể loại trừ trùng dữ liệu pretraining ban đầu của weights. Giữ nguyên báo cáo train lịch sử `independentTest=false`; báo cáo test mới nằm riêng ở `03-tests/crackforest-external-v1/results/report.json`, ảnh mẫu cố định tám ID đầu ở `results/first-eight.jpg`. Model chưa được triển khai production.

### Candidate v2 và tích hợp đề xuất dấu hiệu vào API

`prepare_observable_v2.py` giữ nguyên 589 train/139 validation của v1, bổ sung 99 train/15 validation từ mask gốc [DeepCrack](https://github.com/yhlleo/DeepCrack). Đây là dữ liệu nứt, không bổ sung coverage cho mọi dịch vụ. Tập mới chỉ dùng các family tên camera đã chọn, sau khi mẫu family ảnh web đánh số có watermark stock; quy tắc tên file không chứng minh quyền từng ảnh. Bộ số hóa ban đầu chưa lọc nằm riêng `fixgo-multiservice-ai-v2` và **không dùng train**; lượt train sử dụng `fixgo-multiservice-ai-v2-clean` (688 train/154 validation).

59 ảnh official-test sau lọc được giữ riêng trong `03-tests/deepcrack-reserved-v2-clean`, loại nhóm tên nguồn giao test/train và ảnh giống bằng pixel/SSIM. Mọi ảnh CFD được đối chiếu chống trùng, không chỉ 47 ảnh test v1. CFD đã được xem kết quả nên không phải test mới cho vòng cải thiện này. DeepCrack có điều kiện chỉ nghiên cứu/giáo dục phi thương mại; không tự phê duyệt dùng thương mại cho FixGo.

`train_observable_v2.py` tinh chỉnh từ weights v1, 416 px, tối đa 20 epoch, early stopping patience 5, 4 CPU threads. `evaluate_observable_v2.py` so sánh trên cùng 154 validation và tách riêng chỉ số trên 139 ảnh validation gốc. Chỉ dùng test 59 ảnh một lần nếu mAP50–95 tăng và micro-F1 trên validation gốc không giảm; nếu không, giữ test chưa dùng. Thống kê test chỉ áp dụng lớp nứt và bbox suy từ mask.

API `/ai/v2/diagnose` có thêm `observableAnalysis`, mặc định `disabled`. Luồng candidate **không đổi** category/target/service, không ghi `HUMAN_VERIFIED`, không biến không phát hiện thành bình thường, không gán bừa parent object. Không thay classifier, YOLO COCO, CLIP hoặc detector object+sign đã qua manifest gate. Tên và định nghĩa dấu hiệu lấy từ taxonomy bundle, checksum weights và class-map được kiểm khi load. Nếu lỗi, trạng thái `unavailable`, quyết định chính giữ nguyên.

Để kiểm tra candidate ở một tiến trình local riêng (không ghi vào `.env` mặc định):

```bash
cd ai-service
OBSERVABLE_CANDIDATE_ENABLED=true \
OBSERVABLE_CANDIDATE_MANIFEST=/home/vanvi/Work/datasetai/05-models/fixgo-observable-v2/model-manifest.json \
  .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8011
```

Bundle v2 chỉ tồn tại khi train/đánh giá hoàn tất. `observableAnalysis.proposals` là đề xuất chưa kiểm chứng, confidence không phải xác suất hỏng. Chưa nối các đề xuất này vào chọn dịch vụ hoặc giao diện khách hàng; đó là công việc tiếp theo khi model đủ chất lượng. Khởi động main bình thường không tự bật candidate. `activation-readiness.json` ghi rõ điều kiện chưa đạt, không tạo `approvedForPilot=true` giả để qua gate detector chính. Checkpoint `03-experiments/ai01-task04a-strict-v2/training/weights/best.pt` không còn trên đĩa tại lần kiểm này; candidate dấu hiệu không thay thế được checkpoint thiết bị đã mất.

Kết quả thực chạy vòng bổ sung: v2 dừng sớm sau 10 epoch. Sau khi thấy hồi quy, thử thêm `train_observable_stable.py`: 320 px, freeze 10 lớp đầu, giữ BatchNorm backbone ở eval trong từng batch, learning rate 0,0001, khởi đầu từ v1; dừng sớm sau 5 epoch. Không dùng weights v2 làm khởi đầu. So sánh trên **cùng 154 validation**:

| Bản | mAP50 | mAP50–95 | Micro-F1 trên 139 validation gốc, threshold 0,15 |
|---|---:|---:|---:|
| v1 | 0,4804 | 0,3086 | 0,4850 |
| v2, 416 px | 0,4697 | 0,2966 | 0,4177 |
| v3-stable, 320 px | 0,4813 | 0,3084 | 0,4610 |

Đây vẫn là nhãn nguồn/AI, không phải accuracy trên người dùng thật. V3 có AP50 tăng rất nhỏ nhưng không cải thiện đồng thời AP50–95 và F1 cũ. Kiểm thêm ngưỡng trên validation gốc không đổi bundle: F1 tốt nhất v2 là 0,4509, v3 là 0,4809, đều ở 0,25 và chưa hơn v1. Không dùng 59 ảnh test để chọn ngưỡng; cả hai báo cáo ghi `reserved_not_used` và `final-protocol.json` chưa được tạo. Giữ v1 làm baseline dấu hiệu thử nghiệm; **không thay bất cứ weights chính nào**.

Kết quả ở `04-training/fixgo-observable-v3-stable/enhancement-summary.json`; hình bốn ảnh validation cố định so ba bản ở `prediction-comparison.jpg`. Vẫn bỏ sót ảnh ổ cắm cháy; ảnh nứt mẫu đổi từ nhầm bẩn ở v1 sang crack ở v2, nhưng kết quả tổng không tốt hơn. Hai lượt ASGI smoke dùng ảnh thật, YOLO category thật và candidate thật đều HTTP 200; CLIP không khởi tạo trong tiến trình smoke riêng này. Đó là bằng chứng vận hành, không phải chứng nhận độ chính xác hay kiểm toàn bộ server/client. 29 kiểm thử unit/hồi quy API pass; weights chính đối chiếu SHA không đổi.

`service-coverage.json` trong thư mục train v2 liệt kê snapshot sáu nhóm/70 target và thiếu đánh giá theo cặp thiết bị–dấu hiệu. Tập test cho chín lớp còn lại, ảnh âm đa dịch vụ, liên kết geometry và dữ liệu làm vườn vẫn thiếu. Các target P/R 0,8 trong readiness là đề xuất kỹ thuật, không phải specification đã thống nhất hay một gate sản phẩm mới. Chưa kích hoạt candidate trên API mặc định hoặc giao diện khách hàng.

### Rà nhãn theo dấu hiệu, phiên bản review v4

Đã xem trực quan 267 ảnh thuộc bốn nhóm ưu tiên: 60 ảnh cháy/xém,
98 ảnh nước, 50 ảnh bụi/bẩn và 59 ảnh nứt. Có 138 quyết định giữ/sửa
vùng dấu hiệu, 129 ảnh tách riêng. 461 ảnh khác trong bộ 728 ảnh chưa được
rà trực quan ở đợt này. Đây là đánh giá bằng AI, không phải xác nhận chuyên gia.

Nhật ký nối tiếp có kiểm tra hash và lịch sử sửa nằm tại
`/home/vanvi/Work/datasetai/02-curated/observable-label-review-v1/visual-review-events.jsonl`.
Bộ xuất phát triển mới nằm tại
`/home/vanvi/Work/datasetai/02-curated/fixgo-sign-review-v4/`.
Xem `review-report.json` để biết số ảnh từng lớp và
`geometry-preview/index.html` để xem khung đề xuất màu xanh.

Các thay đổi ngữ nghĩa: `scorched_outlet` toàn thiết bị được thay bằng
`burn_mark` cục bộ; `visible_water` được tách thành `water_spray` và
`surface_water`; một số nhãn bẩn được chuyển sang ố/đổi màu, bong tróc
hoặc bộ phận vỡ. Không suy ra nguyên nhân hỏng hay thiết bị bình thường.
Mỗi lớp có một bộ riêng; chỉ tạo nhãn âm khi nhật ký ghi rõ đã quan sát
không có dấu hiệu đó. Không biến ảnh thiếu nhãn thành ảnh âm mặc định.
Giữ split/group cũ; các validation này đã dùng trong phát triển nên không
phải test độc lập. Không dùng lại tập test CFD hoặc mở 59 ảnh test DeepCrack.

Chưa train trên bộ này. Chưa lớp nào đủ mức tối thiểu phát triển đã đặt
(20 ảnh dương train, 5 ảnh dương val, 5 ảnh âm train, 2 ảnh âm val);
mức tối thiểu này cũng không phải tiêu chuẩn đạt chất lượng sản phẩm.
Đối chiếu khung còn phát hiện W004 thiếu phần trên tia nước, W019 thiếu
tia nước thứ hai, W045 cần tách dòng chảy khỏi vùng nước dưới đất.
`geometry-qa.json` ghi rõ các vấn đề chưa hoàn tất; không dùng bộ này làm
nhãn chuẩn hay tự động thay model chính.

Mã xuất: `build_reviewed_scope_packs.py`; dựng ảnh đối chiếu:
`render_reviewed_regions.py`; kiểm thử hash-chain, lịch sử sửa và tọa độ:
`test_reviewed_scope_packs.py` (2 kiểm thử đã qua).

### Bổ sung dữ liệu và train crack-reviewed-v5

Đã sửa tiếp sáu trường hợp hình học: W004, W019, W045, W048, W075 và
B059. Bản dữ liệu mới nhất là
`/home/vanvi/Work/datasetai/02-curated/fixgo-sign-review-v6/`;
`class-support.csv` ghi số ảnh dương/âm theo lớp, `geometry-qa.json`
ghi rõ phạm vi đã đối chiếu và phần chưa hoàn tất. Các bản v4/v5 vẫn giữ
nguyên để truy vết. Chưa khẳng định toàn bộ bộ nhãn đã được kiểm chứng.

Lớp nứt được bổ sung 99 ảnh train và 15 ảnh validation từ phần phát triển
DeepCrack đã chuẩn bị trước đó, với khung bao suy ra từ mask nguồn.
Không đưa 59 ảnh test giữ riêng vào train. Thêm 26 quyết định âm theo
phạm vi nứt (23 train, 3 val) sau khi xem lại ảnh lưới lọc, bụi, vết ố,
thảm và đường ghép. Bộ train cuối có 161 ảnh (138 dương, 23 âm), validation
27 ảnh (24 dương, 3 âm). Kiểm tra group/hash và ảnh xoay/lật gần trùng
không tìm được cặp chéo train/val trong bộ này; kiểm tra bảo thủ không
bảo đảm phát hiện mọi quan hệ cùng cảnh.

Train YOLOv8n từ weights COCO local: 25 epoch khóa 10 lớp đầu, sau đó
8 epoch tinh chỉnh toàn mạng. Chọn bản refinement và ngưỡng 0.3 bằng
validation. Trên cùng 27 ảnh validation, cùng IoU 0.5:

| Bản | TP | FP | FN | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Multiservice-v1, chỉ lấy crack, ngưỡng val tốt nhất 0.3 | 11 | 5 | 15 | 68.75% | 42.31% | 52.38% |
| Crack-reviewed-v5 refinement, ngưỡng 0.3 | 20 | 9 | 6 | 68.97% | 76.92% | 72.73% |

Đây là số liệu phát triển trên nhãn AI/nguồn, không phải độ chính xác
độc lập cho toàn bộ FixGo. Không có cảnh báo trên 3 ảnh âm validation;
số mẫu quá nhỏ để kết luận tỷ lệ cảnh báo nhầm ngoài thực tế. Candidate
chưa đạt đồng thời P/R 0.8 đề xuất, nên chưa dùng test 59 ảnh và chưa
thay model chính. Model một lớp nứt cũng không thay thế được nhận diện
thiết bị, phân loại dịch vụ và các dấu hiệu khác. Dữ liệu DeepCrack có
điều kiện nghiên cứu/giáo dục phi thương mại; thông tin nguồn được giữ
trong bundle.

Artifact:
- Dataset train: `02-curated/fixgo-crack-reviewed-v5/`.
- Báo cáo: `04-training/fixgo-crack-reviewed-v5/comparison.json` và
  `enhancement-summary.json` dưới `/home/vanvi/Work/datasetai/`.
- Bundle: `05-models/fixgo-crack-reviewed-v5/model-manifest.json`, chỉ thử nghiệm.
- API smoke thực: `04-training/fixgo-crack-reviewed-v5/api-smoke.json`:
  HTTP 200, candidate trả một đề xuất. Không phải kiểm định chất lượng.
- 5 kiểm thử qua: hash-chain, revision, tọa độ, lọc đúng class crack khi
  so với baseline nhiều lớp, phạm vi âm/split và điều kiện giữ test.
- Weights chính và các file test đã được kiểm tra hash, giữ nguyên.

Mã: `prepare_crack_specialist.py`, `train_crack_specialist.py`,
`refine_crack_specialist.py`, `evaluate_crack_specialist.py`.
Không chạy lại vào cùng thư mục phiên bản; các script từ chối ghi đè.
