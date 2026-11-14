# Chỉ mục bằng chứng và giới hạn xác minh

Ngày lập: 13/11/2026 (Asia/Ho_Chi_Minh). Baseline: `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

Quy ước: **VERIFIED** = xác nhận bằng code/artifact hoặc phép thử được nêu; **INFERRED** = suy luận còn cần kiểm chứng; **NOT VERIFIED** = chưa đủ bằng chứng; **RECOMMENDED** = đề xuất, chưa triển khai. VERIFIED về code không đồng nghĩa PASS E2E hoặc độ chính xác thực địa.

## Bằng chứng tái kiểm tra

| Artifact | Ý nghĩa/giới hạn |
|---|---|
| [source-inventory.json](evidence/source-inventory.json) | Danh sách nguồn/config/notebook/result CSV với SHA-256, số dòng, symbol Python |
| [weights.json](evidence/weights.json) | Kích thước/hash weights; không chứng minh license/lineage đầy đủ |
| [python-environment.json](evidence/python-environment.json) | Metadata interpreter .venv; không khẳng định process live cùng env |
| [dataset-counts.json](evidence/dataset-counts.json) | Đếm ảnh mỗi class/split từ filesystem |
| [dataset-leakage.json](evidence/dataset-leakage.json) | Exact hash overlap; không là near-duplicate audit |
| [live-synthetic-cases.json](evidence/live-synthetic-cases.json) | Output thật model live trên ảnh tổng hợp có sẵn; không là independent benchmark |
| [multipart-live.json](../qa/evidence/multipart-live.json) | Multipart host→Backend HTTP 201; chưa Android |

**VERIFIED:** Audit không thay ai-service source, weights/dataset và không chạy training/downloader/build Docker. Có gọi inference live và đọc health; ảnh multipart thử Backend được lưu qua Cloudinary theo pipeline hiện có. Source inventory ghi artifact lịch sử; không dùng thời gian host để suy ngày thực nghiệm, ngày báo cáo dùng client timezone.

## Symbol và dòng code

Link dạng `#L` dùng khi xem repository; số dòng tại working tree sau sửa, baseline HEAD ở đầu tài liệu. Các symbol Python có phạm vi end trong JSON inventory.

| Hàm/đoạn | File:dòng |
|---|---|
| `handleLaunchCamera` | [customer-app/src/features/home/components/AiScanModal.tsx:135](../../customer-app/src/features/home/components/AiScanModal.tsx#L135) |
| `handleLaunchLibrary` | [customer-app/src/features/home/components/AiScanModal.tsx:160](../../customer-app/src/features/home/components/AiScanModal.tsx#L160) |
| `startAiScanProcess` | [customer-app/src/features/home/components/AiScanModal.tsx:152](../../customer-app/src/features/home/components/AiScanModal.tsx#L152) |
| `diagnoseIssueImage` | [customer-app/src/services/api/aiService.ts:24](../../customer-app/src/services/api/aiService.ts#L24) |
| `interceptors.request` | [customer-app/src/services/api/apiClient.js:26](../../customer-app/src/services/api/apiClient.js#L26) |
| `interceptors.response` | [customer-app/src/services/api/apiClient.js:51](../../customer-app/src/services/api/apiClient.js#L51) |
| `async diagnose(` | [server/src/modules/orders/orders.controller.js:70](../../server/src/modules/orders/orders.controller.js#L70) |
| `async diagnoseUpload` | [server/src/modules/orders/orders.controller.js:84](../../server/src/modules/orders/orders.controller.js#L84) |
| `export const incidentStorage` | [server/src/config/cloudinary.config.js:29](../../server/src/config/cloudinary.config.js#L29) |
| `async diagnose(` | [server/src/modules/orders/orders.service.js:76](../../server/src/modules/orders/orders.service.js#L76) |
| `resolveDiagnosis` | [server/src/modules/orders/diagnosis/diagnosis-resolver.js:27](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L27) |
| `const services` | [server/src/modules/orders/diagnosis/diagnosis-resolver.js:76](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L76) |
| `SYMPTOM_RULES` | [server/src/modules/orders/diagnosis/diagnosis-resolver.js:5](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L5) |
| `async diagnoseIncident` | [server/src/infrastructure/external/ai/fastapi-ai.client.js:29](../../server/src/infrastructure/external/ai/fastapi-ai.client.js#L29) |
| `export` | [customer-app/src/components/diagnosis/DiagnosisChoices.jsx:6](../../customer-app/src/components/diagnosis/DiagnosisChoices.jsx#L6) |
| `availableServices` | [customer-app/src/components/diagnosis/DiagnosisChoices.jsx:43](../../customer-app/src/components/diagnosis/DiagnosisChoices.jsx#L43) |
| `handleConfirmAiBooking` | [customer-app/src/features/home/screens/HomeScreen.tsx:222](../../customer-app/src/features/home/screens/HomeScreen.tsx#L222) |
| `aiPrompts = []` | [server/src/modules/admin/admin.service.js:924](../../server/src/modules/admin/admin.service.js#L924) |
| `ai/sync-targets` | [server/src/modules/admin/admin.service.js:970](../../server/src/modules/admin/admin.service.js#L970) |
| `aiPrompts` | [client/src/features/services/components/TargetModal.tsx:33](../../client/src/features/services/components/TargetModal.tsx#L33) |
| `diagnoseImage` | [client/src/features/customer/components/AiDiagnosticCard.jsx:17](../../client/src/features/customer/components/AiDiagnosticCard.jsx#L17) |
| `export function useBooking` | [customer-app/src/features/booking/hooks/useBooking.js:17](../../customer-app/src/features/booking/hooks/useBooking.js#L17) |
| `TTL_SECONDS` | [server/src/modules/auth/registration-proof.service.js:7](../../server/src/modules/auth/registration-proof.service.js#L7) |
| `async createCustomer` | [server/src/modules/auth/registration-proof.service.js:47](../../server/src/modules/auth/registration-proof.service.js#L47) |
| `async registerCustomer` | [server/src/modules/auth/auth.service.js:97](../../server/src/modules/auth/auth.service.js#L97) |
| `strip_accents` | [ai-service/category_helper.py:29](../../ai-service/category_helper.py#L29) |
| `normalize_category_key` | [ai-service/category_helper.py:38](../../ai-service/category_helper.py#L38) |
| `extract_category_from_path` | [ai-service/category_helper.py:49](../../ai-service/category_helper.py#L49) |
| `match_category_by_keywords` | [ai-service/category_helper.py:75](../../ai-service/category_helper.py#L75) |
| `_to_tensor` | [ai-service/clip_classifier.py:23](../../ai-service/clip_classifier.py#L23) |
| `_embed_prompts` | [ai-service/clip_classifier.py:31](../../ai-service/clip_classifier.py#L31) |
| `fetch_targets_from_backend` | [ai-service/clip_classifier.py:39](../../ai-service/clip_classifier.py#L39) |
| `reload_targets` | [ai-service/clip_classifier.py:73](../../ai-service/clip_classifier.py#L73) |
| `load_clip` | [ai-service/clip_classifier.py:87](../../ai-service/clip_classifier.py#L87) |
| `is_ready` | [ai-service/clip_classifier.py:119](../../ai-service/clip_classifier.py#L119) |
| `_encode_image` | [ai-service/clip_classifier.py:123](../../ai-service/clip_classifier.py#L123) |
| `predict_target_from_feat` | [ai-service/clip_classifier.py:138](../../ai-service/clip_classifier.py#L138) |
| `predict_sub_service_from_feat` | [ai-service/clip_classifier.py:174](../../ai-service/clip_classifier.py#L174) |
| `predict_clip_full` | [ai-service/clip_classifier.py:211](../../ai-service/clip_classifier.py#L211) |
| `predict_clip` | [ai-service/clip_classifier.py:251](../../ai-service/clip_classifier.py#L251) |
| `audit_dataset` | [ai-service/eval/audit_dataset.py:7](../../ai-service/eval/audit_dataset.py#L7) |
| `create_sample_images` | [ai-service/eval/benchmark.py:38](../../ai-service/eval/benchmark.py#L38) |
| `run_benchmark` | [ai-service/eval/benchmark.py:100](../../ai-service/eval/benchmark.py#L100) |
| `run_tests_with_client` | [ai-service/eval/benchmark.py:121](../../ai-service/eval/benchmark.py#L121) |
| `do_get` | [ai-service/eval/benchmark.py:122](../../ai-service/eval/benchmark.py#L122) |
| `do_post` | [ai-service/eval/benchmark.py:127](../../ai-service/eval/benchmark.py#L127) |
| `evaluate_single_image` | [ai-service/eval/classify_dataset.py:34](../../ai-service/eval/classify_dataset.py#L34) |
| `print_summary_table` | [ai-service/eval/classify_dataset.py:86](../../ai-service/eval/classify_dataset.py#L86) |
| `run_batch_classification` | [ai-service/eval/classify_dataset.py:101](../../ai-service/eval/classify_dataset.py#L101) |
| `evaluate_test_set` | [ai-service/eval/eval_cls.py:33](../../ai-service/eval/eval_cls.py#L33) |
| `endpoint_namespace` | [ai-service/eval/test_diagnose_contract.py:8](../../ai-service/eval/test_diagnose_contract.py#L8) |
| `DiagnosisContractTests` | [ai-service/eval/test_diagnose_contract.py:35](../../ai-service/eval/test_diagnose_contract.py#L35) |
| `call` | [ai-service/eval/test_diagnose_contract.py:36](../../ai-service/eval/test_diagnose_contract.py#L36) |
| `test_unreadable_image_has_no_confidence_or_fake_diagnosis` | [ai-service/eval/test_diagnose_contract.py:43](../../ai-service/eval/test_diagnose_contract.py#L43) |
| `test_filename_and_description_do_not_replace_missing_models` | [ai-service/eval/test_diagnose_contract.py:51](../../ai-service/eval/test_diagnose_contract.py#L51) |
| `test_clip_classifies_group_without_claiming_specific_damage` | [ai-service/eval/test_diagnose_contract.py:56](../../ai-service/eval/test_diagnose_contract.py#L56) |
| `test_ambiguous_and_out_of_scope_images_abstain` | [ai-service/eval/test_diagnose_contract.py:64](../../ai-service/eval/test_diagnose_contract.py#L64) |
| `test_ensemble_scores_determine_category` | [ai-service/eval/test_diagnose_contract.py:71](../../ai-service/eval/test_diagnose_contract.py#L71) |
| `body` | [ai-service/eval/test_diagnose_contract.py:37](../../ai-service/eval/test_diagnose_contract.py#L37) |
| `decode_image_to_cv2` | [ai-service/main.py:88](../../ai-service/main.py#L88) |
| `compute_ssim_opencv` | [ai-service/main.py:132](../../ai-service/main.py#L132) |
| `compute_hist_correlation` | [ai-service/main.py:166](../../ai-service/main.py#L166) |
| `lifespan` | [ai-service/main.py:189](../../ai-service/main.py#L189) |
| `CompareBeforeAfterRequest` | [ai-service/main.py:310](../../ai-service/main.py#L310) |
| `BoundingBox` | [ai-service/main.py:315](../../ai-service/main.py#L315) |
| `PriceRange` | [ai-service/main.py:321](../../ai-service/main.py#L321) |
| `DiagnoseResponse` | [ai-service/main.py:328](../../ai-service/main.py#L328) |
| `CompareBeforeAfterResponse` | [ai-service/main.py:353](../../ai-service/main.py#L353) |
| `FaceVerifyResponse` | [ai-service/main.py:367](../../ai-service/main.py#L367) |
| `diagnose` | [ai-service/main.py:404](../../ai-service/main.py#L404) |
| `analyze_before_after_opencv` | [ai-service/main.py:598](../../ai-service/main.py#L598) |
| `compare_before_after` | [ai-service/main.py:770](../../ai-service/main.py#L770) |
| `face_verify` | [ai-service/main.py:844](../../ai-service/main.py#L844) |
| `sync_targets` | [ai-service/main.py:952](../../ai-service/main.py#L952) |
| `health_check` | [ai-service/main.py:973](../../ai-service/main.py#L973) |
| `download_file` | [ai-service/scripts/download_models.py:44](../../ai-service/scripts/download_models.py#L44) |
| `main` | [ai-service/scripts/download_models.py:90](../../ai-service/scripts/download_models.py#L90) |
| `format_vnd` | [ai-service/service_catalog.py:439](../../ai-service/service_catalog.py#L439) |
| `get_services_by_category` | [ai-service/service_catalog.py:444](../../ai-service/service_catalog.py#L444) |
| `match_target_by_keywords` | [ai-service/target_helper.py:37](../../ai-service/target_helper.py#L37) |
| `generate_class_images` | [ai-service/training/prepare_dataset.py:70](../../ai-service/training/prepare_dataset.py#L70) |
| `build_dataset` | [ai-service/training/prepare_dataset.py:146](../../ai-service/training/prepare_dataset.py#L146) |
| `train_model` | [ai-service/training/train.py:27](../../ai-service/training/train.py#L27) |

## Giới hạn còn lại

**NOT VERIFIED:** Android E2E, ảnh thật có quyền dùng đủ 10 tình huống, accuracy độc lập, detector mAP, prompt calibration, license manifest, exact runtime Hugging Face revision, CPU load/concurrency và lineage huấn luyện đầy đủ. Các mục này được giữ riêng với kết quả code inspection/smoke tests.
