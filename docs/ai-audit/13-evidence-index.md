# Evidence index — AI-AUDIT-01

## Phạm vi và cách đọc bằng chứng

Ngày25/11/2026, timezone Asia/Ho_Chi_Minh; DB snapshot có timestampUTC chính xác. Nguồn chính là implementation/source, artifact bytes và calls đã chạy; tài liệu cũ chỉ dùng chỉ dẫn tìm file, không thay kiểm chứng. Code references bên dưới có path/function/line thật và hash revision trong source-evidence.json.

Không tuyên bố đã đọc mọi file của toàn monorepo; đã truy vết các boundary và implementation trực tiếp của diagnosis/recommendation, model loaders, catalog, dataset/training/eval và inventory Face/BeforeAfter. Không audit sâu auth/payment/biometric enrollment hoặc mọi ảnh cá nhân. Quan trọng: source có implementation != đang bật runtime != measured quality.

## Artifacts mới

| File | Loại bằng chứng | Giới hạn |
|---|---|---|
| catalog-snapshot.json | Prisma transaction READ ONLY / RepeatableRead:6/70/693,0symptom/0links, aiPrompts | Không chỉnh DB; source DB tại lúc đọc |
| runtime-status.json | GET health/catalogstatus local8000 | Load/flag snapshot; không pin in-memory bytes toàn process |
| model-artifacts.json |16 file hashes/stat,9 PT offline loads,3COCO predictions, whitelist config | File/cached revision không tự chứng minh process đang dùng đúng bytes |
| dataset-inventory.json | Hash/decode22.637 ảnh, counts/splits/duplicates/logs/sourceYAML | Pixel hash ngoại corpus dựa prepared; không exhaustive near-pairs mới hoặc rights approval |
| ../../inference-results.json |24 cases (9V2+2failure+4backend+9strict) thực sự chạy | Không independent GT/accuracy; thêm3COCO trong model artifact tổng27 |
| python-tests.log |28 testsPASS | Mock/fault-injection/rules và isolated gates, không model benchmark |
| backend-tests.log |54 testsPASS | Mock Prisma/HTTP/upload storage, không write live DB |
| customer-tests.log |35 testsPASS | Mock ReactNative/HTTP, không camera/Cloudinary E2E |
| previous-executive-summary.md |Bản executive trước audit này | Lịch sử, không kết luận mới |

Các artifact trong bảng nằm tại `evidence/ai-audit-01-20261125/` trừ inference-results tại root docs/ai-audit. Không lưu request images/base64, credentials, accounts hoặc embeddings face; ảnh input được tham chiếu path/hash khi có.

## Source evidence (symbol và số dòng)

| ID | Source / symbol |
|---|---|
| mobile | [customer-app/src/services/api/aiService.ts:76 — diagnoseIssueImage](/home/vanvi/Work/do-an-fix-go-tho-tot/customer-app/src/services/api/aiService.ts:76) |
| scan | [customer-app/src/features/home/components/AiScanModal.tsx:198 — AiScanModal image analysis](/home/vanvi/Work/do-an-fix-go-tho-tot/customer-app/src/features/home/components/AiScanModal.tsx:198) |
| choices | [customer-app/src/components/diagnosis/DiagnosisChoices.jsx:10 — DiagnosisChoices](/home/vanvi/Work/do-an-fix-go-tho-tot/customer-app/src/components/diagnosis/DiagnosisChoices.jsx:10) |
| upload | [server/src/modules/orders/diagnosis/diagnosis-upload.interceptor.js:64 — DiagnosisImageStorage](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-upload.interceptor.js:64) |
| controller | [server/src/modules/orders/orders.controller.js:83 — OrdersController.diagnoseUpload](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/orders.controller.js:83) |
| order | [server/src/modules/orders/orders.service.js:82 — OrdersService.diagnose](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/orders.service.js:82) |
| transport | [server/src/infrastructure/external/ai/fastapi-ai.client.js:30 — FastApiAiClient.diagnoseIncident](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/infrastructure/external/ai/fastapi-ai.client.js:30) |
| startup | [ai-service/main.py:191 — lifespan](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:191) |
| v2 | [ai-service/recommendation/router.py:35 — diagnose_v2](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/router.py:35) |
| decode | [ai-service/recommendation/image_utils.py:12 — decode_image_to_cv2](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/image_utils.py:12) |
| clip | [ai-service/clip_classifier.py:92 — load_clip](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/clip_classifier.py:92) |
| imagefeat | [ai-service/clip_classifier.py:132 — _encode_image](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/clip_classifier.py:132) |
| clipfull | [ai-service/clip_classifier.py:251 — predict_clip_full](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/clip_classifier.py:251) |
| dyn | [ai-service/clip_classifier.py:39 — fetch_targets_from_backend](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/clip_classifier.py:39) |
| fusion | [ai-service/recommendation/category_classifier.py:17 — fuse_category_scores/evaluate_categories](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/category_classifier.py:17) |
| target | [ai-service/recommendation/target_matcher.py:8 — match_targets](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/target_matcher.py:8) |
| catalog | [ai-service/recommendation/catalog_manager.py:87 — publish_catalog_snapshot](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/catalog_manager.py:87) |
| visual | [ai-service/recommendation/visual_detector.py:26 — VisualDetector.predict/load_visual_detector](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/visual_detector.py:26) |
| resolver | [server/src/modules/orders/diagnosis/diagnosis-resolver.js:19 — resolveCategory](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:19) |
| resolve | [server/src/modules/orders/diagnosis/diagnosis-resolver.js:106 — resolveDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:106) |
| service | [server/src/modules/orders/diagnosis/diagnosis-resolver.js:70 — resolveService](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:70) |
| vr | [server/src/modules/orders/diagnosis/visual-service-resolver.js:10 — resolveVisualServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/visual-service-resolver.js:10) |
| symptoms | [server/src/modules/symptoms/symptom-catalog.js:94 — recommendServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/symptoms/symptom-catalog.js:94) |
| legacyrules | [server/src/modules/orders/diagnosis/symptom-taxonomy.js:2 — SYMPTOM_RULES/buildSymptomOptions](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/symptom-taxonomy.js:2) |
| ranking | [server/src/modules/orders/diagnosis/service-ranker.js:18 — rankServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/service-ranker.js:18) |
| legacy | [ai-service/main.py:392 — diagnose (V1)](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:392) |
| hardscore | [ai-service/main.py:536 — V1 keyword target confidence constant](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:536) |
| firstservice | [ai-service/main.py:543 — V1 first-service fallback](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:543) |
| compare | [ai-service/main.py:586 — analyze_before_after_opencv](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:586) |
| comparefallback | [ai-service/main.py:810 — compare_before_after heuristic fallback](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:810) |
| backendfallback | [server/src/infrastructure/external/ai/aiFallbackHelper.js:10 — getFallbackCompare](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/infrastructure/external/ai/aiFallbackHelper.js:10) |
| webmock | [client/src/features/customer/hooks/useHomeData.ts:443 — useHomeData.triggerAiDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/client/src/features/customer/hooks/useHomeData.ts:443) |
| webcall | [client/src/features/customer/views/HomeMobileView.tsx:198 — HomeMobileView → mock hook](/home/vanvi/Work/do-an-fix-go-tho-tot/client/src/features/customer/views/HomeMobileView.tsx:198) |
| webroute | [client/src/routers/routes.jsx:99 — web customer route](/home/vanvi/Work/do-an-fix-go-tho-tot/client/src/routers/routes.jsx:99) |
| worker | [worker-app/src/services/api/aiService.ts:24 — Worker diagnoseIssueImage](/home/vanvi/Work/do-an-fix-go-tho-tot/worker-app/src/services/api/aiService.ts:24) |
| prepare | [ai-service/training/prepare_dataset.py:70 — generate_class_images](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/training/prepare_dataset.py:70) |
| train | [ai-service/training/train.py:27 — train_model](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/training/train.py:27) |
| trial | [ai-service/training/visual_service_training.py:38 — audit/prepare_trial](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/training/visual_service_training.py:38) |
| quality | [server/scripts/ai01/quality_review.py:68 — QualityReview.blockers/export](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/quality_review.py:68) |
| prepared | [server/scripts/ai01/prepare_dataset.py:23 — prepared dataset pipeline](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/prepare_dataset.py:23) |
| annotate | [ai-service/eval/ai01/annotation.py:10 — Labels/Provenance/Review/Sample](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/annotation.py:10) |
| metrics | [ai-service/eval/ai01/metrics.py:33 — summarize](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/metrics.py:33) |
| runner | [ai-service/eval/ai01/runner.py:44 — Resolver/run_case/setup_models](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/runner.py:44) |
| fakebench | [ai-service/eval/benchmark_recommendation.py:42 — run_benchmark: fixture ranks and simulated latency](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/benchmark_recommendation.py:42) |
| schema | [server/prisma/schema.prisma:151 — Service → categoryId/targetId](/home/vanvi/Work/do-an-fix-go-tho-tot/server/prisma/schema.prisma:151) |
| symptomschema | [server/prisma/schema.prisma:681 — Symptom/SymptomService review gate](/home/vanvi/Work/do-an-fix-go-tho-tot/server/prisma/schema.prisma:681) |
| dbapi | [server/src/modules/services/services.service.js:43 — ServicesService.getTargets](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/services/services.service.js:43) |
| face | [ai-service/face_models.py:20 — load_face_models](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/face_models.py:20) |
| facecore | [ai-service/face_core.py:18 — FacePolicy/extract_embedding](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/face_core.py:18) |
| pad | [ai-service/face_pad.py:72 — configured_pad](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/face_pad.py:72) |
| mn3 | [ai-service/pad_mn3.py:40 — ExperimentalMn3Pad](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/pad_mn3.py:40) |
| blaze | [worker-app/src/features/face-verification/components/LiveFaceCamera.web.jsx:88 — LiveFaceCamera.web local BlazeFace](/home/vanvi/Work/do-an-fix-go-tho-tot/worker-app/src/features/face-verification/components/LiveFaceCamera.web.jsx:88) |
| faceplay | [ai-service/face_test_app.py:38 — Face test-only app](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/face_test_app.py:38) |
| package | [server/scripts/ai01/dataset_package.py:8 — fixgo.dataset.v1 rules](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/dataset_package.py:8) |
| import | [server/scripts/ai01/uploaded_dataset.py:166 — UploadedDataset synthetic train-only policy](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/uploaded_dataset.py:166) |
| cloud | [server/src/config/cloudinary.config.js:29 — incidentStorage: Cloudinary limit 1200px](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/config/cloudinary.config.js:29) |

## Các lệnh kiểm đã chạy

- `ai-service/.venv/bin/python -B /tmp/fixgo_audit_runtime.py`: GET runtime và 11 pure inference/failure calls, source inputs có sẵn.
- `ai-service/.venv/bin/python -B /tmp/fixgo_audit_models.py`: local weight load/hash +3COCO cases; HF_HUB_OFFLINE/TRANSFORMERS_OFFLINE, YOLO_CONFIG_DIR trong /tmp.
- `ai-service/.venv/bin/python -B /tmp/fixgo_audit_extra_inference.py`:4 strict +4 live backend read-only resolver.
- `ai-service/.venv/bin/python -B /tmp/fixgo_audit_source_smoke.py`:5 source-member strict smoke, không metricGT.
- `ai-service/.venv/bin/python -B /tmp/fixgo_audit_dataset.py`:hash/decode existing images, không sửa raw/labels.
- Python: `-m unittest eval.test_recommendation_pipeline eval.test_visual_detector eval.test_visual_training eval.test_diagnose_contract`.
- Backend Jest: diagnosis-resolver, diagnosis-target-service, visual-service-resolver và diagnosis-upload spec với `--runInBand --runTestsByPath`.
- Customer Jest: aiService, DiagnosisChoices, VisualServiceSuggestions, VisualAnalysisSummary với test:ci.
- Read-only catalog script là biến thể snapshot_catalog.cjs chỉ thêm select service/symptom/link/aiPrompts; không migration/seed/write.

Không chạy download_models/train_model/model.train, không gọi sync/catalog mutation/face enrollment hoặc tạo đơn. Test fixture state chỉ /tmp. Không chạy benchmark fixture rồi gọi đó là measured inference; output cũ được đánh MOCK nếu simulated ranks/latency.

## Phần chưa kiểm chứng

Accuracy/mAP/Recall@K/FAR/FRR; nhận đúng đủ70target; GPU/SLA/concurrency; quyền/license từng ảnh/weights; original real/synthetic composition raw; Cloudinary/photo camera E2E; whole raw TXT reparse/checksum; exhaustive new near-duplicate search; live deployed fault model/face PAD approval; real hardware-model failure. Ghi NOT_VERIFIED/BLOCKED, không điền số giả.

## Script thu thập và kiểm tra cuối

Các script read-only đã chạy từ /tmp được giữ bản sao tại thư mục evidence cùng tên `audit_runtime.py`, `audit_models.py`, `audit_dataset.py`, `audit_extra_inference.py`, `audit_source_smoke.py`, `snapshot-catalog-readonly.cjs`. Chúng chỉ ghi evidence/temporary settings và không phải application code; không tự chạy lại nếu chỉ muốn đọc báo cáo. Các path là workspace local của lần audit. Runtime collection tạo kết quả nền, extra/source smoke append sau đó; không đảo thứ tự nếu tái lập.

[final-validation.json](evidence/ai-audit-01-20261125/final-validation.json) xác nhận catalog snapshot trước–sau không đổi, 16 artifact weight hashes và 56 trích dẫn thuộc 45 source files (hash) không đổi, coverage70 target tổng693 service và đủ15 báo cáo theo task. Điều này không xác nhận toàn bộ database nghiệp vụ trên máy không có tác nhân khác thay đổi.
