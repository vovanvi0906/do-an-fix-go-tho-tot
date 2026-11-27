# Tóm tắt điều hành — AI-AUDIT-01

**FixGo đã có model AI thật và đã nhận diện category/target bằng CLIP trong request local. Không cần mặc định làm lại object recognition hoặc train YOLO từ đầu.** Tuy nhiên chưa có bằng chứng accuracy cho 70 target; nhánh phát hiện dấu hiệu hiện chưa được nạp, và DB chưa có symptom/service mapping được duyệt.

## Bằng chứng quan trọng

1. Health live port 8000: CLIP=true, YOLO classification=true, COCO detector=true, **visual_service=false**; catalog source backend, targetCount=70. Đã chạy 9 ca V2 ảnh/biến thể, 4 ca backend resolver, 9 ca strict trial, 3 ca COCO offline và 2 ca API failure/fallback. Tổng 27 phép gọi; đây là smoke/observability, không phải benchmark có GT. [Runtime](evidence/ai-audit-01-20261125/runtime-status.json), [inference](inference-results.json), [COCO cases](evidence/ai-audit-01-20261125/model-artifacts.json).
2. V2 thực thi CLIP trước rồi YOLO **classification**, fusion, CLIP target matching; không gọi COCO detect/crop. [ai-service/recommendation/router.py:35 — diagnose_v2](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/router.py:35) [ai-service/recommendation/target_matcher.py:8 — match_targets](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/target_matcher.py:8). CLIP có 70 static/DB target prompts, không phải 70 detector classes.
3. Tồn tại thử nghiệm YOLO **5 object classes**, weights/log thật, đã chạy CPU offline; chưa được đưa vào V2 production. Có trial 7 lớp cũ nữa, không tự coi chúng tương đương model fault đã được duyệt. [Artifact inventory](model-inventory.csv).
4. DB read-only: **6 danh mục, 70 đối tượng, 693 dịch vụ, 0 symptoms, 0 symptom-service links**. Automatic visual-service catalog path chưa đủ điều kiện; chọn thủ công và 13 legacy rules là các đường khác. [server/src/modules/orders/diagnosis/diagnosis-resolver.js:106 — resolveDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:106) [server/src/modules/symptoms/symptom-catalog.js:94 — recommendServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/symptoms/symptom-catalog.js:94) [DB snapshot](evidence/ai-audit-01-20261125/catalog-snapshot.json).
5. Dataset classification thật trên đĩa: 1.200 ảnh dạng procedural fixtures, 6 classes, **210 nhóm trùng xuyên split** theo SHA/pixel; log 5 epochs từng báo top1=1 nhưng không có giá trị chứng minh accuracy ảnh thật độc lập. [ai-service/training/prepare_dataset.py:70 — generate_class_images](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/training/prepare_dataset.py:70) [Quét dataset](evidence/ai-audit-01-20261125/dataset-inventory.json).
6. Raw bên ngoài repo: **21.437 ảnh**, đã kiểm SHA/decode 21.437/21.437 khớp prepared, 0 lỗi ảnh lần này. Toàn bộ metadata nguồn còn unverified; chưa xác định được bao nhiêu ảnh chụp thật/synthetic có căn cứ. Có annotations và near/duplicate/leakage cần kiểm, không cần thu lại toàn bộ từ đầu.
7. Web client có một đường UI **MOCK** trả cố định 0,94 và chẩn đoán máy lạnh; không nhầm với Customer mobile gọi API thật. [client/src/features/customer/hooks/useHomeData.ts:443 — useHomeData.triggerAiDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/client/src/features/customer/hooks/useHomeData.ts:443) [client/src/features/customer/views/HomeMobileView.tsx:198 — HomeMobileView → mock hook](/home/vanvi/Work/do-an-fix-go-tho-tot/client/src/features/customer/views/HomeMobileView.tsx:198) [customer-app/src/services/api/aiService.ts:76 — diagnoseIssueImage](/home/vanvi/Work/do-an-fix-go-tho-tot/customer-app/src/services/api/aiService.ts:76).
8. Before/After là CV/rules, không model xác minh sửa chữa; fallback trả pass 0,92 ngay cả ảnh không đọc được đã được tái hiện qua API direct. Tách khỏi diagnosis dataset và ưu tiên xem xét trước khi dùng làm gate nghiệp vụ. [ai-service/main.py:810 — compare_before_after heuristic fallback](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:810) [server/src/infrastructure/external/ai/aiFallbackHelper.js:10 — getFallbackCompare](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/infrastructure/external/ai/aiFallbackHelper.js:10).

## Bảng kết luận

| Chức năng | Đã triển khai? | Đã chạy thật? | Chất lượng đã đo? | Cần cải thiện? | Cần dataset? |
|---|---|---|---|---|---|
| Object Detection | IMPLEMENTED: COCO + offline trial | VERIFIED offline; not V2 bbox path | NOT_VERIFIED independent mAP | Nối/evaluate checkpoint phù hợp, không train lại mặc định | BBox evaluation trước; training có điều kiện |
| Object Recognition | IMPLEMENTED CLIP 70 prompt targets | VERIFIED candidate output; chưa chứng minh đúng 70 | NOT_VERIFIED accuracy | Đánh giá subtype/OOS và target propagation | Ảnh thật có target GT |
| Category Classification | IMPLEMENTED CLIP + YOLO 6 classes | VERIFIED live V2 + backend | Chỉ log synthetic/leaky; không independent | Kiểm lại dataset, threshold/calibration | Real held-out 6 categories + OOS |
| Defect Detection | PARTIAL optional object/sign detector | Runtime visual_service=false | NOT_VERIFIED | Cần weights/eval/catalog phù hợp và nhãn sign | Có, bbox quan sát thật + negatives |
| Fault Diagnosis | PARTIAL questionnaire/rules; không root-cause model | Manual/rules source + unit tests; không root-cause inference | NOT_VERIFIED | Triệu chứng/đo lường/thợ kiểm | Triệu chứng/decision cases, không chỉ ảnh |
| Service Recommendation | IMPLEMENTED DB/manual/legacy; visual gated | VERIFIED manual DB service và reject sai target | Không có service GT metrics | 0 symptoms/0 links approved; review catalog | Expert-labeled recommendation cases |
| Unknown Image Handling | IMPLEMENTED abstention/unavailable | VERIFIED vài ảnh OOS/mờ/lỗi decode | NOT_VERIFIED FAR/FRR tổng thể | Mở OOS/low-light evaluation | Real OOS + valid hard cases |

## Trả lời trực tiếp

- **Làm được:** suy luận category/target zero-shot + classifier thật, abstain/yêu cầu thêm thông tin, trả DB service sau chọn thủ công/legacy symptom và kiểm scope; quản lý dataset/review/export/training gate đã có implementation.
- **Thiếu:** đánh giá GT độc lập, valid fault model manifest ở runtime, catalog triệu chứng/link được duyệt, calibration và chứng cứ nguồn/nhãn cho dữ liệu. Root-cause từ ảnh đơn không được giải quyết chỉ bằng thêm ảnh.
- **Không cần làm lại:** CLIP encoder/prompt embeddings, V2 inference, DB ID resolver, các gate/manual flow, import/review/annotation/evaluation scripts và các checkpoint object trial có sẵn.
- **Dataset cần trước:** evaluation ảnh thật có target/category GT + OOS/hard cases; review/tái sử dụng raw đã có; sign bbox/negative và symptoms-service case set có chuyên gia. Fine-tune chỉ sau đo gap.
- **Nhanh nhất cho khóa luận:** chốt pilot ổ cắm + một vài target có sẵn weights/dữ liệu, baseline pretrained/strict5/CLIP trên cùng holdout thật, cải thiện mapping/questionnaire, chỉ fine-tune object/sign khi baseline không đủ. Không thực thi quota 13.340 ảnh generation như một yêu cầu bắt buộc.

## Giới hạn audit

Không có tập GT độc lập đủ điều kiện trong các ca mới, nên **không tính accuracy/mAP/service precision**. Timings là wall-clock các lượt local, không SLA. Không có GUI/camera/mobile binary E2E hoặc Cloudinary upload thật. Runtime load không pin toàn bộ build/revision qua health; hashes artifact trên đĩa không tự chứng minh bytes đang nằm trong process. Không face identity inference hoặc enrollment trong audit này.
