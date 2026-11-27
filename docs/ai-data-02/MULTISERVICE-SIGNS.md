# Phạm vi dấu hiệu theo nhiều dịch vụ

## Cập nhật: rà nhãn ưu tiên và bật từng dấu hiệu (26/11/2026)

Mặc định mới: **`fixgo-multiservice-observer-v2-gated`**. Cùng weights,
ngưỡng và chính sách ngữ cảnh với `v2-tested`; chỉ đổi lớp nào được bật.

**Rà nhãn (AI duyệt, không phải chuyên gia).** Đã duyệt hết 216 ảnh của ba
nhóm ưu tiên, ghi vào sổ sự kiện có chuỗi hash, không sửa nhãn gốc.

| Nhóm | Đạt | Cách ly | Lý do cách ly chính |
| --- | ---: | ---: | --- |
| Gãy/vỡ | 24 | 6 | Watermark, gạch bị nhấc chưa chắc là vỡ; 1 ảnh chuyển sang nứt |
| Ổ cắm hư/lệch | 4 | 24 | Watermark, trùng cảnh, đang tháo lắp |
| Lõi dây lộ | 21 | 137 | 94 watermark; đầu dây tuốt sẵn, đầu cáp cắt, công trình đang đi dây; chỉ rách vỏ ngoài mà không thấy kim loại; trùng cảnh giữa train/val |

Bộ xuất theo dấu hiệu: `02-curated/fixgo-priority-scopes-v2`. **Chưa train
lại**: không nhóm nào đạt mức tối thiểu (≥20 dương train, ≥5 dương val,
có ảnh âm theo phạm vi). Train trên số lượng này không cho so sánh đáng tin.
Ảnh “rách vỏ ngoài, chưa thấy lõi” được tách riêng để sau này làm nhóm hỏng
vỏ cách điện, không gộp vào lõi dây lộ.

**Bật theo dấu hiệu.** Một dấu hiệu chỉ bật khi một bộ kiểm giữ riêng không
watermark đã chạy có ≥20 ảnh dương và precision, recall đều ≥0.6. Chỉ **nứt**
đạt (59 ảnh: P 69%, R 85%). Gãy/vỡ, lõi dây, bong tróc, ổ cắm, ố/đổi màu
không đủ ảnh dương kiểm tra nên bị tắt. Cháy, nước, bụi/bẩn, nấm/rêu vẫn tắt
và tiếp tục thu thập dữ liệu. Lớp tắt được trả trong `unavailableSigns`; app
hiển thị “chưa nhận diện đủ tin cậy” và nói rõ không phát hiện ≠ thiết bị
bình thường. Ngưỡng cổng chọn sau khi đã thấy kết quả test cũ, nhưng chỉ
dùng để tắt lớp, không chỉnh ngưỡng/weights. Bộ test đó vẫn là đã sử dụng.

Luồng app: người dùng xác nhận/sửa thiết bị (có tìm không dấu), bỏ gợi ý AI
sai, tự chọn dấu hiệu nhìn thấy hoặc “chưa xác định”, trả lời triệu chứng,
rồi mới chọn dịch vụ từ catalog.

Evidence: [rà nhãn](evidence/priority-scope-review-v1.json),
[cổng bật lớp](evidence/multiservice-sign-gate-v1.json). Mã:
`prepare_priority_review.py`, `label_review_store.py`,
`build_reviewed_scope_packs.py`, `package_gated_observer.py`.
Cần restart AI service để nạp release mới.

## Cập nhật sau thử nghiệm chất lượng (26/11/2026)

Mặc định hiện tại: **`fixgo-multiservice-observer-v2-tested`**. Giữ nguyên
weights, lớp bật/tắt, ngưỡng và chính sách ngữ cảnh của v2. Đây là cập nhật
kết quả đánh giá và thông tin hiển thị; **không phải train thêm hoặc tuyên
bố model đã đạt chất lượng production**. V3 không được kích hoạt vì không
đạt quy tắc so sánh đã chốt trước khi chạy bộ kiểm tra mới.

Đã chạy 91 ảnh: 27 ảnh kiểm tra nhiều dấu hiệu đã rà nhãn, 5 ảnh có watermark
chỉ dùng đánh giá phụ và 59 ảnh nứt nguồn-mask đã giữ riêng trước training.
Đã xem 48 ứng viên trước inference, chọn 32 và tách 16 trường hợp mơ hồ,
ảnh minh họa/quảng cáo hoặc nghi cùng cảnh với dữ liệu cũ. Nhãn vẫn là
AI/nguồn, không phải ground truth được chuyên gia xác nhận. Các ảnh cùng
nguồn và sàng lọc CLIP trước đó khiến bộ 27 ảnh không phải test thu thập
độc lập ngoài thực tế. Chấm theo phạm vi lớp đã rà và IoU 0.5; lớp chưa
được gán nhãn không tự trở thành âm.

| Phạm vi | Bản | TP | FP | FN | Precision | Recall |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 59 ảnh nứt giữ riêng, bbox từ mask nguồn | v2 | 50 | 22 | 9 | 69.44% | 84.75% |
| Cùng 59 ảnh | v3 | 41 | 16 | 18 | 71.93% | 69.49% |
| 27 ảnh nhiều dấu hiệu, tổng các phạm vi đã rà | v2 | 3 | 4 | 19 | 42.86% | 13.64% |

Số liệu là **vùng dấu hiệu**, không phải số thiết bị đã chẩn đoán đúng.
Tập 59 ảnh chỉ có ảnh dương, không đo được cảnh báo nhầm trên ảnh bình
thường độc lập. Một số lớp có rất ít hoặc không có ảnh dương sạch trong
challenge, nên chưa thể kết luận độ nhạy của các lớp đó. V3 giảm FP nhưng
làm giảm F0.5 trên phạm vi chung từ 0.6777 xuống 0.6647; theo quy tắc đã
đóng băng trước test, không được thay v2. Các nhóm ngoài nứt còn bỏ sót
nhiều, vì vậy không nâng trạng thái thành model dùng rộng cho mọi dịch vụ.

API bổ sung `evaluationStatus=limited_scope_evaluated` và
`evaluationSampleCount=91`; loader kiểm tra checksum báo cáo/protocol
trong bundle. Giao diện nhắc AI còn có thể bỏ sót và cần người dùng kiểm
tra ảnh. Không biến kết quả thử nghiệm thành xác nhận lỗi/dịch vụ.
AI service đã được restart và xác nhận trả đúng version mới. Backend/app
chưa chạy trực tiếp; backend replay response thật và kiểm thử UI đã qua.

Đã dùng test 59 ảnh một lần cho thí nghiệm này. Dữ liệu gốc vẫn nguyên
hash, nhưng tập này **đã lộ kết quả**, không được gọi là test chưa sử dụng
ở vòng sau. Giữ nguyên protocol, nhật ký 91 lượt inference và mọi bản
weights trước đó. Lỗi tổng hợp khi một lớp có bộ đếm bằng 0 được sửa bằng
cách tính lại từ nhật ký; không chạy lại inference hay đổi tiêu chí sau test.

Evidence: [kết quả và phiên bản đang dùng](evidence/multiservice-quality-test-v1.json).
Báo cáo chi tiết, CSV từng lớp và biểu đồ nằm trong
`/home/vanvi/Work/datasetai/04-training/multiservice-challenge-v1/`.
Mã: `prepare_observer_challenge.py`, `freeze_observer_challenge.py`,
`evaluate_observer_challenge.py`, `package_tested_observer.py` và
`test_observer_quality.py`. `--summarize` chỉ tính từ predictions đã ghi;
script từ chối ghi đè báo cáo hoàn tất.

Kiểm tra code: 5 test chấm điểm, 37 test AI service, 72 test backend,
14 test UI qua; backend build 194 file. Smoke 5 ảnh phát triển qua ASGI,
5 ảnh qua service thực và backend replay qua. Các smoke này không được
đếm thêm vào 91 ảnh thử chất lượng.

Grounding DINO trong Studio đã chuyển từ thử nghiệm ổ cắm/cháy sang **cấu hình tìm dấu hiệu quan sát theo catalog**. Đây là mở rộng phạm vi tìm kiếm bằng prompt, không phải một detector đã được huấn luyện/đánh giá đầy đủ cho mọi lỗi của đồ án.

## Dùng

Lưu tiến độ rồi khởi động lại Studio để nạp cấu hình backend mới. Ảnh chưa duyệt/chưa có kết quả dấu hiệu tự chạy khi mở. Có thể tắt ô **Nhận diện tự động khi mở ảnh**, hoặc bấm **AI nhận diện dấu hiệu bất thường** để thử lại. Ảnh có revision người dùng không tự chạy; thao tác chạy lại giữ nguyên bản chỉnh. Trong hộp tự động, chọn **Grounding DINO · dấu hiệu theo dịch vụ**.

- Bộ lọc target/danh mục trong thư viện giới hạn phạm vi batch.
- Khi kiểm một ảnh, thiết bị bạn trực tiếp chọn trong ô tìm kiếm có ưu tiên cao hơn bộ lọc cũ. Việc một model trước đó tự điền target không được coi là lựa chọn thủ công mới của bạn.
- Khi chưa chọn target cụ thể, nhãn nguồn/candidate của inventory chỉ là gợi ý để giảm số đối tượng cần tìm, không là nhãn đúng hoặc bằng chứng hỏng. Geometry vẫn phải đến từ DINO trên pixel ảnh.
- Nếu không có gợi ý và phạm vi lớn hơn 8 đối tượng, tool đưa vào hàng đợi `TARGET_SCOPE_REQUIRED`, yêu cầu thu hẹp target/danh mục. Không âm thầm chọn ổ cắm, không quét 69 prompt đối tượng mỗi ảnh trên CPU rồi gọi là nhanh.

## Sáu nhóm dịch vụ

| Nhóm | Dấu hiệu được dùng làm gợi ý tìm kiếm mặc định |
|---|---|
| Sửa điện | Cháy/xém, nứt, chi tiết gãy/vỡ |
| Sửa nước | Nhỏ giọt, bề mặt ướt, tia nước, nứt, gãy/vỡ |
| Điện lạnh | Bề mặt ướt, cháy/xém, gãy/vỡ, bụi/bẩn |
| Thiết bị gia đình | Cháy/xém, nứt, gãy/vỡ, bề mặt ướt, bụi/bẩn |
| Giúp việc | Bụi/bẩn, ố/đổi màu, bề mặt ướt, vết giống phân chim, lá/rác lá |
| Làm vườn | Lá/rác lá, ố/đổi màu, chi tiết gãy/vỡ, bụi/bẩn |

Chỉ dùng 10 mã observable sign đã có trong ontology. Không thêm các nhãn suy ra từ ảnh đơn như “hết gas”, “hỏng máy nén”, “chập điện”, “tắc ống” hoặc bệnh cây cụ thể. Nước đang chảy có thể là vận hành bình thường; lá trong nền không đồng nghĩa rác lá. Ngay cả khi model đề xuất các vùng này, chúng vẫn chưa phải chẩn đoán lỗi hoặc chỉ định dịch vụ.

`observable-prompts.json` có mô tả đối tượng bằng tiếng Anh cho **69 target vật lý/khu vực** trong catalog hiện tại. Target còn lại “Kiểm tra / Khảo sát sự cố điện” là tác vụ dịch vụ, không được tạo prompt bbox giả; chọn thiết bị cụ thể. Target hệ thống/khu vực rộng chỉ tìm thành phần/bằng chứng nhìn thấy và có warning, không kết luận toàn hệ thống.

Các nhóm dấu hiệu trong bảng là **search hints chưa phê duyệt**, không thay taxonomy AI-KNOWLEDGE, không chứng minh mọi sign phù hợp mọi target cùng category. Coverage cấu hình 70 target không có nghĩa model nhận diện chính xác 70 target.

## Liên kết, cache và ghi nhãn

Detector YOLO strict-v2 sẵn có tìm thiết bị trước, pin checkpoint/hash trong manifest. Kết quả pixel của YOLO thu hẹp sign pass và giữ geometry/model provenance thật; không cần người dùng chọn thiết bị trước. Chỉ dùng các target thuộc bộ lọc hiện hành. Nếu YOLO không có kết quả, DINO tìm object trong scope đủ hẹp rồi tìm sign. Tool chỉ chạy object/sign pass thuộc scope của ảnh. Mỗi sign được giới hạn những target tương thích trong cấu hình tìm kiếm; vẫn cần một object bao quanh rõ ràng theo guard hiện hành. Nước phun/nhỏ bên ngoài bbox vòi có thể không qua guard containment và được giữ ở diagnostics/hàng đợi; không gắn bừa hoặc suy rằng vòi gây rò. Các quan hệ ngoài object cần quy trình geometry riêng trước khi nới gate.

Cấu hình theo scope được lưu bất biến trong `state/grounding-scopes/<sha>.json`, pin artifact model, catalog prompt hash và code builder. Profile pin thêm code routing. Cache và exact-duplicate reuse có **scopeHash**: hai entry cùng bytes nhưng scope tìm kiếm khác nhau không dùng chung nhãn.

Đổi giữa các scope dịch vụ tương thích vẫn giữ các đề xuất trước đó hiển thị. Tool kiểm compatibility key, hash profile và manifest scope bất biến; cache bị sửa hoặc thuộc runtime khác không được dùng lại.

Công cụ vẽ Dấu hiệu ưu tiên nhãn theo object liên kết/thiết bị chính/danh mục, ghi nhớ lựa chọn theo nhóm dịch vụ. Ví dụ đổi sang vòi nước sẽ ưu tiên nhóm nước, không giữ mặc định burn_mark từ phiên ổ cắm. Chỉ tác động nhãn vẽ mới; không tự sửa các sign đã lưu.

Mọi đề xuất vẫn AI_PROPOSED. Không tự tạo HUMAN_VERIFIED, NORMAL, ground truth hay test độc lập. Chuyển scope/model không sửa revision người dùng. Export chính thức/trial giữ nguyên gate; pseudo export vẫn là AI_UNVERIFIED và lưu phạm vi đã tìm theo từng ảnh.

## Kiểm chứng

```bash
ai-service/.venv/bin/python scripts/ai-data-02/test_grounding_catalog.py
ai-service/.venv/bin/python scripts/ai-data-02/test_grounding_ui.py
```

Fixture kiểm sáu nhóm, toàn bộ slug catalog, ontology, non-visual target, scope theo metadata, key cache khác nhau dù cùng pixel, immutability và sign-parent compatibility. Browser kiểm nhận diện một ảnh và đổi mặc định dấu hiệu theo ngữ cảnh nước; các prediction fixture là stub, không phải bằng chứng chất lượng DINO.

Smoke inference thật bổ sung dùng ảnh máy giặt `img-21436` và vòi nước `img-19564`, state `/tmp` riêng, scope chọn rõ target tương ứng. Có geometry thiết bị và các sign pass đúng dịch vụ, nhưng cả hai vào hàng đợi liên kết dấu hiệu chưa chắc chắn. Model còn đề xuất cháy/gãy/ướt trên ảnh máy giặt, chưa có GT độc lập xác nhận; không coi các đề xuất đó là lỗi thật. Đây là kiểm vận hành/routing, không là đánh giá độ chính xác. Không train hoặc sửa nhãn nguồn thật. Xem `evidence/grounding-multiservice-smoke.json`.

## Kiểm vận hành luồng YOLO → dấu hiệu

Đã chạy model thật trên `zip-35238263b8d8ad54` không chọn target/category, state riêng `/tmp/fixgo-hybrid-smoke-nyxittyx`. YOLO tìm được ổ cắm; DINO tạo vùng `burn_mark` và thêm đề xuất `broken_part` trên vùng dưới. Có candidate khác không liên kết được nên report vẫn NEEDS_REVIEW. Chạy mất 16,264 giây, peak RSS 2.560,43 MiB. Một ảnh không chứng minh precision/recall; cần kiểm nhãn trùng hoặc sai. Xem `evidence/grounding-hybrid-smoke.json`.

## Lịch sử: pilot multiservice-observer-v2

Luồng `/ai/v2/diagnose` hiện nạp `multiservice-observer-v2` mặc định từ
`ai-service/weights/multiservice-observer-v2/release.json`. Đây là bản
**thử nghiệm nghiên cứu, AI chưa xác minh**, không phải model đã đạt kiểm
định production. Nhận diện danh mục/thiết bị bằng YOLO classifier + CLIP
vẫn giữ chức năng riêng. Luồng dấu hiệu mới dùng general expert nhiều lớp
và thay lớp crack bằng specialist `fixgo-crack-reviewed-v5`.

Sáu dấu hiệu đang bật: phần gãy/vỡ, lõi dây nhìn thấy, bong/tróc bề mặt,
ổ cắm hư hại/lệch, vết ố/đổi màu và vết nứt. Các nhóm có thể liên quan:
sửa điện, sửa nước, điện lạnh, thiết bị gia dụng, giúp việc. Liên quan tới
nhóm dịch vụ không có nghĩa đã có chẩn đoán hay ánh xạ dịch vụ được duyệt.
Không có dữ liệu dấu hiệu làm vườn; khi nhận diện nhóm đó, luồng dấu hiệu
trả trạng thái ngữ cảnh chưa hỗ trợ.

Bốn lớp chưa đủ chất lượng phát triển được tắt mặc định: mảng nghi nấm/rêu,
ổ cắm nghi cháy/xém, bụi/bẩn và vùng nước. Mức lọc precision 0.5 trên
validation tái sử dụng chỉ dành cho pilot; **không phải tiêu chuẩn chất
lượng production**. Không khẳng định sáu lớp đang bật đã được đánh giá
độc lập đầy đủ. Chưa phát hiện dấu hiệu không đồng nghĩa thiết bị bình
thường; API trả cả danh sách lớp chưa đủ hỗ trợ.

Đã thử train thêm ba expert trên nhãn sửa: burn_mark (16 dương train,
2 dương val), surface_soiling (19 dương train, 1 dương val), water_spray
(19 dương train, 5 dương val), kèm ảnh âm có phạm vi xác nhận riêng.
Các bản này còn nhiều FP/FN nên không được đưa vào release. Kết quả và
quyết định không kích hoạt nằm trong evidence JSON kèm theo. Không dùng
59 ảnh test DeepCrack để chọn những bản này.

API `observableAnalysis` có modelVersion, checksum các expert, vùng ảnh,
định nghĩa dấu hiệu, trạng thái lớp và giới hạn phạm vi. Backend chỉ lấy
phần này từ AI response của chính request; không đọc lại từ input/answers.
Ứng dụng khách hàng hiển thị khung với nhãn “Nghi: …”, tách khỏi dịch vụ
đã ánh xạ qua catalog. Không tạo triệu chứng người dùng xác nhận, không
chọn dịch vụ hoặc gắn dấu hiệu vào một thiết bị chưa có bằng chứng.
`device_context` được ghi rõ nếu khung bao cả thiết bị thay vì vùng hỏng.

Có lọc ngữ cảnh để hạn chế nhầm chéo dịch vụ; khi chưa xác định được danh
mục, yêu cầu score cao hơn. Model score không phải xác suất đã hiệu chuẩn.
Class yếu bị tắt được báo trong `unavailableSigns`; lỗi từng expert được
báo trong `degradedModels`.

Kiểm tra: 36 test Python, 71 test backend, 13 test UI qua; build backend
194 file thành công. Smoke 5 ảnh phát triển với model thật qua ASGI và
5 ảnh qua AI service chạy đầy đủ lifespan/CLIP đều HTTP 200. Backend
replay 5 response thật giữ được khung và không tự chọn dịch vụ. Đây là
kiểm tra tích hợp, không phải đo độ chính xác độc lập. Backend/DB và app
không chạy trong live smoke; CLIP dùng catalog tĩnh 70 thiết bị.

Evidence: `evidence/multiservice-observer-v2-activation.json`.
Weights ở thư mục local bị gitignore; để tái tạo bundle trên máy này:
`ai-service/.venv/bin/python scripts/ai-data-02/package_multiservice_observer.py --version v2`.
Script từ chối ghi đè release đã tồn tại. Nó cần các bundle/evaluation
nguồn trong `/home/vanvi/Work/datasetai`; không tải model qua mạng.

Cấu hình:
- `MULTISERVICE_OBSERVER_ENABLED=false`: tắt luồng dấu hiệu mới.
- `MULTISERVICE_OBSERVER_MANIFEST=/absolute/path/release.json`: chọn release khác.
- Mặc định nạp release v2 local; thiếu file hoặc sai checksum sẽ trả unavailable.
- Khởi động AI bằng `cd ai-service` rồi `.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000`.
- Restart backend và reload app để nhận schema/giao diện mới. Không cần migration DB.

Weights classifier/COCO gốc và các file test giữ riêng đã được kiểm tra
hash, giữ nguyên. Chưa cấp trạng thái duyệt model hoặc duyệt nhãn chuyên gia.

RAM đo sau live smoke (đủ classifier, COCO, face models, CLIP và hai sign
expert) khoảng 1.60 GiB RSS. Đã tăng cả `deploy.resources.limits.memory`
và `mem_limit` của ai-service trong compose từ 1200m lên 2300m để có
khoảng trống chạy. Container chưa được build/chạy trong bước này; số đo
là tiến trình local. Backend replay thêm 5 response từ live AI cũng qua.
