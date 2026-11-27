# Object Detection / Recognition audit

## Trả lời trực tiếp

**Có object recognition thật**: CLIP zero-shot image embeddings so với target prompts, V2 trả canonical target candidates. Live lần này phát ra target candidates cho Thảm cỏ/Bãi cỏ, Máy xay/Máy ép/Máy đánh trứng, Bóng đèn/LED; backend chấp nhận hai target đầu trong request pixels-only. Đây là VERIFIED về thực thi/phát candidate, **không phải ba target đã được chứng minh nhận đúng**; không có GT độc lập cho các ảnh đó. [ai-service/recommendation/target_matcher.py:8 — match_targets](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/target_matcher.py:8) [Kết quả](inference-results.json).

Có object detection model thật: COCO80 hiện loaded và strict-v2 trial5 có sẵn. Trial5 đã chạy 9 ảnh offline, có bbox trên 5 source-member images nhưng có thể lệch nhãn; không tính accuracy từ source labels/model-exposed images. Không có bbox COCO trên 3 fixture đã chạy ở conf.25. Kết quả không phát bbox ở một vài ảnh không chứng minh model không bao giờ detect được hoặc cần train lại từ đầu.

## Khả năng theo source và kiểm thử

| Khả năng | Source thực tế | Bằng chứng runtime / giới hạn |
|---|---|---|
| Tên thiết bị | CLIP 70 prompt targets; cosine/category filter | V2 outputs thật; quality/coverage70 NOT_VERIFIED |
| BBox thiết bị | COCO80 và trial5 local | Offline thử thật; primary V2 không gọi COCO |
| Nhiều thiết bị | CLIP chỉ xếp hạng whole-image; optional visual detector nhiều bbox | Trial source-member có nhiều bbox; user UI/multiobject E2E chưa xác minh |
| Phân biệt lookalike | prompts/embeddings + pretrained visual features | Không có heldout tương tự/khác subtype đủ GT; NOT_VERIFIED |
| Thiết bị ngoài class | closed prompt list + other_unclear/threshold | Không có open-world detector guarantee; không tự nhận label mới |
| Từ chối ảnh không liên quan | other_unclear + confidence/margin/target gate | Một face fixture và ảnh mờ/thiếu sáng abstain; FAR/FRR chưa đo |
| Dấu hiệu/lỗi | COCO và classifier không có sign classes | optional fault detector chưa nạp; không coi learned object như fault model |

Nguồn: [ai-service/main.py:191 — lifespan](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:191) [ai-service/recommendation/router.py:35 — diagnose_v2](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/router.py:35) [ai-service/recommendation/category_classifier.py:17 — fuse_category_scores/evaluate_categories](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/category_classifier.py:17) [ai-service/recommendation/target_matcher.py:8 — match_targets](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/target_matcher.py:8) [ai-service/recommendation/visual_detector.py:26 — VisualDetector.predict/load_visual_detector](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/visual_detector.py:26).

## COCO không phủ mọi thiết bị điện

`COCO_TO_CATEGORY` trong main có power_outlet/wire/faucet nhưng **không phải class của checkpoint COCO80**; sự tồn tại mapping giả định không tạo khả năng detect những class đó. Có bảy target FixGo có phần tương đương semantics COCO (microwave, oven, refrigerator, sink, toilet, potted plant, couch), không đồng nghĩa bảy target runtime đã đúng, không bao phủ mọi subtype của target ghép. Current V2 không dùng bảng COCO đó.

Strict-v2 có class chuẩn cho 5 target: may-giat-may-giat-say, may-lanh-dieu-hoa, o-cam-dien, tu-lanh-tu-lanh-side-by-side, voi-nuoc-voi-sen. Đây là nguồn tái sử dụng cho pilot detector, đã fine-tune trước đây, không phải model mới cần train từ zero. Trial7 cũ thêm toilet/pipe nhưng có provenance/mapping semantics cần xem lại; không tự chọn checkpoint vì class count lớn hơn.

## Category classification

Sáu category DB đều có CLIP prompts. YOLO classification có năm category + other_unclear, thiếu giup_viec; không suy pretrained classifier trực tiếp nhận 70 target hoặc 693 service. AI label/category slug được backend resolve thành active UUID, không lấy label cố định làm DB ID. Class labels là coverage thiết kế, không accuracy. [server/src/modules/orders/diagnosis/diagnosis-resolver.js:19 — resolveCategory](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:19) [ai-service/clip_classifier.py:39 — fetch_targets_from_backend](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/clip_classifier.py:39).
