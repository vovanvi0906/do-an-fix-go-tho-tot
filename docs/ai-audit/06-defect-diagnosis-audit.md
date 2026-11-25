# Phát hiện dấu hiệu và chẩn đoán sự cố

## Phân biệt ba tầng

1. **Quan sát nhìn thấy:** xém, nứt, chi tiết vỡ, bề mặt ướt/bẩn. Cần bbox và bằng chứng pixel; không chứng minh nguyên nhân.
2. **Triệu chứng vận hành:** không lên nguồn, lạnh yếu, tiếng kêu, nhảy CB, nước thoát chậm. Cần người dùng xác nhận, một ảnh chưa đủ.
3. **Nguyên nhân/biện pháp:** chập mạch, tụ/bo hỏng, rò điện, thiếu môi chất, phải thay linh kiện. Cần kiểm tra/đo của thợ; không được suy từ tên object hoặc vết xém đơn lẻ.

COCO80 và YOLO category classifier không có defect labels tương ứng; CLIP category prompts có mô tả hỏng nhưng điểm similarity của category không là fault prediction. V2 observableSigns chủ yếu ghi “Nhận diện danh mục/đối tượng”, không chứng minh dấu hiệu vật lý. [ai-service/clip_classifier.py:251 — predict_clip_full](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/clip_classifier.py:251) [ai-service/recommendation/router.py:35 — diagnose_v2](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/router.py:35).

## Ontology hiện tại và capability

| Dấu hiệu yêu cầu | Ontology bbox tương ứng | Hiện trạng model runtime |
|---|---|---|
| Cháy/xém | burn_mark | PARTIAL optional visual detector; không load trong request |
| Nứt/vỡ | crack / broken_part | Không có production weights đã nạp cho sign |
| Rỉ sét | Không có rust/corrosion code chuẩn | Không thay tự động bằng stain_or_discoloration để nhận nguyên nhân |
| Rò nước | wet_surface / water_dripping / water_spray là quan sát | Không chứng minh ống nào rò/nguyên nhân; sign ngoài object có thể fail containment |
| Đứt dây/lộ lõi | Không có class exposed_wire chuẩn trong bbox ontology | broken_part chỉ khi đúng quan sát được duyệt, không thay mọi lỗi dây |
| Biến dạng | Không có deformation code riêng | Cần guideline/ontology review, không bịa class |
| Bám bẩn | surface_soiling, bird_droppings, leaf_debris | Có ontology; không có model runtime đang xác minh |
| Ố/ẩm | stain_or_discoloration / wet_surface | Chỉ mô tả màu/bề mặt, không suy nguyên nhân |
| Mất điện, mùi, nhiệt/áp suất, sai điện áp | Không phải nhãn bbox đơn ảnh | Questionnaire/inspection, không thêm class để lách modality |

Ontology chuẩn 10 codes ở `docs/ai01-admin/dataset-package/sign-ontology.json` so khớp artifact quality. Các mã display/legacy trong fast_review/label_browser không tự là lớp bbox được duyệt. [server/scripts/ai01/quality_review.py:68 — QualityReview.blockers/export](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/quality_review.py:68) [server/scripts/ai01/dataset_package.py:8 — fixgo.dataset.v1 rules](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/dataset_package.py:8).

## Learned detector dấu hiệu tồn tại ở đâu?

Implementation `VisualDetector` cho object/sign boxes, per-class threshold, spatial attachment; loader yêu cầu manifest fixgo.visual-detector.v1, evaluated approval, report/weights hashes và class names đúng. Nhưng live `visual_service=false`, responses visualAnalysis disabled. Trial5/7 chỉ object labels, không thay thế sign model. **Không tìm thấy model sign đang phục vụ**; source implementation không là bằng chứng học defect feature thành công. [ai-service/recommendation/visual_detector.py:26 — VisualDetector.predict/load_visual_detector](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/visual_detector.py:26) [server/src/modules/orders/diagnosis/visual-service-resolver.js:10 — resolveVisualServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/visual-service-resolver.js:10) [Runtime](evidence/ai-audit-01-20261125/runtime-status.json).

## Diagnosis thực tế

Description ảnh hưởng category qua keyword boost V2; `SYMPTOM_RULES` có 13 mapping service slug legacy, chỉ dùng sau xác nhận người dùng; catalog triệu chứng mới yêu cầu review active/APPROVED (DB hiện0). Không tìm thấy root-cause diagnostic model trong luồng khảo sát. V1 keyword target cố định0,95 và fallback dịch vụ đầu tiên không phải chẩn đoán đã học. [ai-service/recommendation/category_classifier.py:17 — fuse_category_scores/evaluate_categories](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/category_classifier.py:17) [server/src/modules/orders/diagnosis/symptom-taxonomy.js:2 — SYMPTOM_RULES/buildSymptomOptions](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/symptom-taxonomy.js:2) [server/src/modules/orders/diagnosis/diagnosis-resolver.js:70 — resolveService](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:70) [server/src/modules/symptoms/symptom-catalog.js:94 — recommendServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/symptoms/symptom-catalog.js:94) [ai-service/main.py:536 — V1 keyword target confidence constant](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:536) [ai-service/main.py:543 — V1 first-service fallback](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:543).

Cần dataset quan sát và dataset triệu chứng/service expert riêng; không gán ảnh cháy thành electrical_short/needs_replacement. Các câu hỏi và 693 service mappings trong master generation là đề xuất cần review, không GT hiện hữu.
