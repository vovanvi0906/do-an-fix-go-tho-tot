# Audit dataset, annotations, duplicate và training evidence

## Phạm vi kiểm thực tế

Đọc ảnh classification trong repo, toàn raw ngoài repo theo prepared manifest và artifact model/training logs. Không download/sửa ảnh hoặc label. Đã hash/decode 21437/21.437 raw + 1.200 classification, không lỗi decode lần này. Không làm exhaustive pairwise pHash mới, không tự xác minh license/nguồn từ pixel.

## A. Dataset classification đang được checkpoint dùng

`ai-service/dataset`: **1.200 ảnh**, 6 category classes. Mỗi class 140 train /40 val /20 test. Annotation = thư mục class, không bbox/segmentation. `training/prepare_dataset.py` vẽ OpenCV synthetic minh họa class; dataset_info.json ghi corpus names nhưng không phải bằng chứng ảnh được thu từ chúng. Mẫu procedural và source tạo ảnh phù hợp, chưa có provenance cá thể đủ để gọi ảnh thật. [ai-service/training/prepare_dataset.py:70 — generate_class_images](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/training/prepare_dataset.py:70).

| Class | Train | Val | Test |
|---|---|---|---|
| dien_lanh | 140 | 40 | 20 |
| lam_vuon | 140 | 40 | 20 |
| other_unclear | 140 | 40 | 20 |
| sua_dien | 140 | 40 | 20 |
| sua_nuoc | 140 | 40 | 20 |
| thiet_bi | 140 | 40 | 20 |

SHA: **244 nhóm duplicate**, **210 nhóm trùng xuyên split**; pixel duplicate cross-split cũng210. Đây là số nhóm, không phải210 ảnh hoặc tỉ lệ leakage. Không sử dụng validation/test bộ này làm bằng chứng hiệu quả thực tế. File run args train5epochs, results top1=1 ở mọi epoch; inference weights runtime hash bằng best run. Fine-tuning có thật, nhưng metric bị giới hạn dữ liệu synthetic/trùng, không là “AI chính xác100%”. [ai-service/training/train.py:27 — train_model](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/training/train.py:27) [Dataset checks](evidence/ai-audit-01-20261125/dataset-inventory.json).

## B. Raw/prepared bên ngoài repository

`/home/vanvi/Work/datasetai/01-raw`: **21.437 ảnh trên đĩa**, tất cả có prepared record; hash image khớp record, decode0 lỗi. Prepared record/mapping pinSHA khớp. Phân bố ảnh nguồn:

| Thư mục nguồn | Số ảnh |
|---|---|
| dienlanh | 254 |
| giupviec | 1155 |
| lamvuon | 4950 |
| suadien | 11204 |
| suanuoc | 2815 |
| thietbigiadinh | 1059 |

**54 source class IDs theo dataset**, không phải target classes/model quality. Annotations parsed: **35.199 bbox** + **1.444 polygon** theo prepared records; chi tiết annotation count từng source class ở JSON. Source class semantics có loại disease/fault-region không được đổi thành bbox toàn vật thể. [server/scripts/ai01/prepare_dataset.py:23 — prepared dataset pipeline](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/prepare_dataset.py:23).

Source metadata **21.437 unverified**, không khai synthetic flag: **số ảnh chụp thật xác minh = KHÔNG XÁC ĐỊNH**, số synthetic thực tế cũng KHÔNG XÁC ĐỊNH. Không gọi toàn bộ Roboflow là ảnh thật/licensed verified. Các license dưới đây chỉ khai trong source YAML, cần bằng chứng/attribution/điều kiện thật trước export:

| Source YAML | Names/classes | Khai báo nguồn |
|---|---|---|
| dienlanh | ["CASSETTE TYPE", "CELLING TYPE", "ROOM AIR"] | {"workspace": "sut-nzvsb", "project": "air-conditioner-q7pxp", "version": 1, "license": "CC BY 4.0", "url": "https://universe.roboflow.com/sut-nzvsb/air-conditioner-q7pxp/dataset/1"} |
| giupviec | ["Birdpoop", "Dirt", "Leaf"] | {"workspace": "marius-lee", "project": "dirty", "version": 1, "license": "CC BY 4.0", "url": "https://universe.roboflow.com/marius-lee/dirty/dataset/1"} |
| lamvuon | ["12", "Apple Scab Leaf", "Apple leaf", "Apple rust leaf", "Bell_pepper leaf spot", "Bell_pepper leaf", "Blueberry leaf", "Cherry leaf", "Corn Gray leaf spot", "Corn leaf blight", "Corn rust leaf", "Peach leaf", "Potato leaf early blight", "Potato leaf late blight", "Potato leaf", "Raspberry leaf", "Soyabean leaf", "Soybean leaf", "Squash Powdery mildew leaf", "Strawberry leaf", "Tomato Early blight leaf", "Tomato Septoria leaf spot", "Tomato leaf bacterial spot", "Tomato leaf late blight", "Tomato leaf mosaic virus", "Tomato leaf yellow virus", "Tomato leaf", "Tomato mold leaf", "Tomato two spotted spider mites leaf", "grape leaf black rot", "grape leaf"] | {"workspace": "annie-niu-icloud-com", "project": "plant-disease-w0ogb", "version": 1, "license": "CC BY 4.0", "url": "https://universe.roboflow.com/annie-niu-icloud-com/plant-disease-w0ogb/dataset/1"} |
| suadien | ["OUTLET"] | {"workspace": "outletv2", "project": "outlet-4xvv4", "version": 1, "license": "CC BY 4.0", "url": "https://universe.roboflow.com/outletv2/outlet-4xvv4/dataset/1"} |
| suanuoc | ["broken_shower_head", "ceiling_leak", "clogged_sink", "faucet", "leaking_faucet", "leaking_pipe", "pipe_burst", "toilet_issue", "water_damage", "water_leak"] | {"workspace": "yess-workspace-jjb25", "project": "smart-estate-plumbing", "version": 3, "license": "CC BY 4.0", "url": "https://universe.roboflow.com/yess-workspace-jjb25/smart-estate-plumbing/dataset/3"} |
| thietbigiadinh | ["bed", "chair", "refrigerator", "table", "tv", "washing_machine"] | {"workspace": "furniture-pp9ke", "project": "appliance-hnlxr", "version": 1, "license": "CC BY 4.0", "url": "https://universe.roboflow.com/furniture-pp9ke/appliance-hnlxr/dataset/1"} |

Prepared split17.106 train /4.331 val (development only); original directory test không mặc định independent test. Có24 exact duplicate groups;5 nhóm trùng qua **original** splits,0 qua development splits sau grouping. Prepared pixel hash cross-development0 và leakageGroup cross-development0, nhưng pixel hash toàn corpus không được tính lại và chưa xác minh độc lập thiết bị/cảnh. Summary lịch sử ghi2.757 near pairs/3.131 near images, 148 technical/empty-label images,246 geometry-warning images; đây là metadata nguồn pinned/summary, không phải phép pairwise mới. **0 decode lỗi không đồng nghĩa0 lỗi nhãn**.

Số ảnh ổ cắm nguồn11.204 áp đảo một số nguồn nhỏ; annotation imbalance và family augmentation cần sampling theo group/class, không chỉ random filename. Raw preparation giữ labels immutable; human review/gate chưa thể thay bằng prepared eligibility source-supervised.

## C. Dữ liệu/quy trình khác

- Quality packet có4.203 candidate images, nhiều scope-ambiguous, không tự thành GT. Source counts là baseline packet, journal review mới có thể khác, không gộp lịch sử revisions thành ảnh mới. [server/scripts/ai01/quality_review.py:68 — QualityReview.blockers/export](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/quality_review.py:68).
- Admin uploads có3 record khai own_photo; chưa xác minh đây là3 ảnh thực có quyền độc lập trong audit. Hai ZIP20 ảnh ChatGPT có20 outputs chung, không đếm40; metadata/rights/prompt vẫn cần sửa như báo cáo package.
- Benchmark pilot-proposal có150 items; exploratory summary60 images; prior smoke manifest3 record đều unverified. Có artifact nhưng **không chứng minh independent test đủ GT**; không tính metric từ model outputs làm nhãn.
- Face/PAD captures/biometric datasets tách riêng; không copy vào incident training. Mẫu face repo chỉ được dùng kiểm đường OOS, không dùng để fine-tune nhận diện sự cố.

## D. Đã train hay chỉ dữ liệu chuẩn bị?

Runtime classification có checkpoint+run5epochs thật. Object experiments task04a-v1/strict-v2 có weights best/last, args và results5epochs thật; training source-supervised, chưa deploy detector dấu hiệu. Prepared summary status prepared_not_trained chỉ mô tả artifact đó ở lúc tạo, không phủ nhận experiment training sau này. Logs cuối mỗi run và SHA trong JSON mới; **không train thêm**.

## Nguồn/giấy phép và giới hạn kiểm

Không tìm thấy hồ sơ independent reviewed GT/rights đầy đủ cho tập mới được phép chấm trong audit. License/source claims của metadata không tự chứng minh quyền. Không chạy lại mọi raw-label checksum và parse hình học từ TXT; annotations và issue counts lấy prepared snapshot có pin, đã đối chiếu byte ảnh độc lập. Không quét mọi ảnh face cá nhân trong máy, không đọc hoặc xuất biometric embeddings. Các bản sao prepared/trial không cộng thành số ảnh độc lập mới.

## Phân bố ảnh và annotation từng source class

Một ảnh có thể có nhiều class nên không cộng cột ảnh thành số ảnh độc lập. Đếm class ID từ annotation record đã pin, không lấy dự đoán model để gán class.

| Source class | Label nguồn | Số ảnh chứa class | Số annotation |
|---|---|---:|---:|
| dienlanh:0 | CASSETTE TYPE | 59 | 59 |
| dienlanh:1 | CELLING TYPE | 75 | 78 |
| dienlanh:2 | ROOM AIR | 127 | 127 |
| giupviec:0 | Birdpoop | 358 | 1175 |
| giupviec:1 | Dirt | 169 | 733 |
| giupviec:2 | Leaf | 492 | 953 |
| lamvuon:0 | 12 | 1 | 18 |
| lamvuon:1 | Apple Scab Leaf | 183 | 316 |
| lamvuon:10 | Corn rust leaf | 215 | 236 |
| lamvuon:11 | Peach leaf | 213 | 1184 |
| lamvuon:12 | Potato leaf early blight | 191 | 443 |
| lamvuon:13 | Potato leaf late blight | 5 | 21 |
| lamvuon:14 | Potato leaf | 213 | 553 |
| lamvuon:15 | Raspberry leaf | 233 | 1051 |
| lamvuon:16 | Soyabean leaf | 131 | 512 |
| lamvuon:17 | Soybean leaf | 2 | 30 |
| lamvuon:18 | Squash Powdery mildew leaf | 267 | 496 |
| lamvuon:19 | Strawberry leaf | 174 | 856 |
| lamvuon:2 | Apple leaf | 171 | 454 |
| lamvuon:20 | Tomato Early blight leaf | 171 | 416 |
| lamvuon:21 | Tomato Septoria leaf spot | 294 | 829 |
| lamvuon:22 | Tomato leaf bacterial spot | 146 | 1612 |
| lamvuon:23 | Tomato leaf late blight | 142 | 784 |
| lamvuon:24 | Tomato leaf mosaic virus | 229 | 579 |
| lamvuon:25 | Tomato leaf yellow virus | 215 | 421 |
| lamvuon:26 | Tomato leaf | 108 | 510 |
| lamvuon:27 | Tomato mold leaf | 178 | 587 |
| lamvuon:28 | Tomato two spotted spider mites leaf | 5 | 5 |
| lamvuon:29 | grape leaf black rot | 123 | 242 |
| lamvuon:3 | Apple rust leaf | 173 | 347 |
| lamvuon:30 | grape leaf | 140 | 464 |
| lamvuon:4 | Bell_pepper leaf spot | 141 | 527 |
| lamvuon:5 | Bell_pepper leaf | 122 | 623 |
| lamvuon:6 | Blueberry leaf | 205 | 1572 |
| lamvuon:7 | Cherry leaf | 105 | 441 |
| lamvuon:8 | Corn Gray leaf spot | 135 | 148 |
| lamvuon:9 | Corn leaf blight | 363 | 723 |
| suadien:0 | OUTLET | 11204 | 11206 |
| suanuoc:0 | broken_shower_head | 200 | 200 |
| suanuoc:1 | ceiling_leak | 500 | 847 |
| suanuoc:2 | clogged_sink | 34 | 36 |
| suanuoc:3 | faucet | 154 | 157 |
| suanuoc:4 | leaking_faucet | 95 | 99 |
| suanuoc:5 | leaking_pipe | 338 | 338 |
| suanuoc:6 | pipe_burst | 739 | 970 |
| suanuoc:7 | toilet_issue | 73 | 75 |
| suanuoc:8 | water_damage | 110 | 124 |
| suanuoc:9 | water_leak | 694 | 1273 |
| thietbigiadinh:0 | bed | 264 | 282 |
| thietbigiadinh:1 | chair | 277 | 324 |
| thietbigiadinh:2 | refrigerator | 264 | 314 |
| thietbigiadinh:3 | table | 95 | 98 |
| thietbigiadinh:4 | tv | 85 | 86 |
| thietbigiadinh:5 | washing_machine | 86 | 89 |

Journal pilot có1 register event; quality journal có6 revision events (5draft,1confirmed event), không có bbox_export event trong log đã đọc. Một confirmed event không chứng minh independent GT hoặc export-eligible toàn tập. [Inventory journal](evidence/ai-audit-01-20261125/review-journal-inventory.json) chỉ lưu counts/hash, không định danh tài khoản.
