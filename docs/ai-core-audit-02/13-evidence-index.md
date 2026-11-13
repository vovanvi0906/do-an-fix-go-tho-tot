# Evidence index, phương pháp và blockers

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

## Phạm vi và cách đọc

Audit02 chỉ thêm thư mục tài liệu này. Các lệnh kiểm tra dùng dữ liệu synthetic có sẵn hoặc in-memory stubs; không khởi động lifespan/model, không download/train, không gửi ảnh người, không đọc .env/JWT/biometric rows. GET catalog chỉ whitelist dữ liệu nghiệp vụ, không lưu URL mặt/ảnh CCCD. Không thay USB/config Android. Không chạy database integration tests, seed/migration/reset. Khác biệt code với audit01 được đối chiếu bằng hash, không mặc định tin báo cáo cũ.

**VERIFIED:** Baseline/worktrees được kiểm tra; không checkout/reset/rebase/merge/push. Các worktree khác tồn tại nhưng không sửa. Snapshot catalog do GET local API cung cấp, không phải SQL transaction snapshot; các request tree/targets có thể khác thời điểm. Không gọi sync-targets vì sẽ thay state embeddings RAM.

## Evidence artifacts và tái lập

| Artifact / lệnh | Kết quả và giới hạn |
|---|---|
| [baseline.json](evidence/baseline.json) | HEAD/branch/ancestor, working tree trước audit sạch |
| [source-manifest.json](evidence/source-manifest.json) | Hash/line-count 409 file trong phạm vi; là inventory fingerprint, không khẳng định mỗi dòng vendor/UI đều manual review |
| [prior-audit-reconciliation.json](evidence/prior-audit-reconciliation.json) | 23 entries audit01 không đổi content; tài liệu cũ vẫn phải xét lại diễn giải |
| [weights-manifest.json](evidence/weights-manifest.json) | Bytes/SHA256 bốn checkpoint local; không deserialize pickle/download |
| [python-env.json](evidence/python-env.json), [clip-cache-config.json](evidence/clip-cache-config.json) | Phiên bản .venv/config cache; identity interpreter/revision live NOT VERIFIED |
| [catalog-snapshot.json](evidence/catalog-snapshot.json), [targets-snapshot.json](evidence/targets-snapshot.json) | GET read-only xác nhận6/70/693, whitelist IDs/names/prices/prompts; không biometric/PII |
| [static-vs-db-catalog.json](evidence/static-vs-db-catalog.json) | 25 static slugs đều có trong active snapshot; không bảo đảm future sync hoặc inactive DB |
| `python3 -B ai-service/eval/audit_dataset.py` | Exit1 đúng kỳ vọng phát hiện dataset invalid; [exact-leakage.json](evidence/exact-leakage.json) |
| `ai-service/.venv/bin/python -I -B docs/ai-core-audit-02/evidence/audit-near-duplicates.py` | dHash64/Hamming≤4 cross-split, exclude exact SHA; [near-duplicate-audit.json](evidence/near-duplicate-audit.json); candidate không ground truth |
| `python3 -I -B docs/ai-core-audit-02/evidence/check-python-branches.py` | 11 checks AST bodies, no startup/model/images/network; [python-branches.json](evidence/python-branches.json) |
| `node docs/ai-core-audit-02/evidence/check-js-branches.cjs` | 8 checks method bodies, fake DB/transport only; [js-branches.json](evidence/js-branches.json) |
| `node docs/ai-core-audit-02/evidence/check-catalog-flow.cjs` | Resolver thật với snapshot DB và AI stub; [catalog-flow.json](evidence/catalog-flow.json), không model accuracy hay order submit |
| `python3 -I -B -m unittest discover -s ai-service/eval -p 'test_*.py'` | PASS5 contract tests AST/deterministic, không nạp weights |
| `adb devices` | Không có thiết bị; toàn bộ Android E2E/PAD thực nghiệm PENDING |

PASS branch assertions xác nhận hành vi code hiện tại, kể cả hành vi không an toàn; không gọi đó là security PASS. Script branches là kiểm chứng unit nội bộ với fixture constants, không là công cụ gọi/tấn công endpoint và không đụng tài khoản người thật.

**Kiểm tra artifact cuối:** [validation.json](evidence/validation.json) ghi đủ14 tài liệu, links/evidence IDs/JSON hợp lệ, 409 source hashes giữ nguyên; Mermaid đã review tĩnh, chưa render tự động.

## Negative search scope và những điều không thể chứng minh bằng rg

Tìm `faceProfile.create/upsert`, `faceVerification.create`, `faceEmbedding`, `isRegistered`, `faceId`, `enroll`, `nonce/challenge/liveness/spoof` trong server/src, Prisma schema/migrations/scripts, worker-app/src/app, các phần liên quan Customer/Admin và ai-service (loại .venv/node_modules). Không tìm writer runtime enrollment/embedding/verification record, PAD inference hay challenge session. GPS throttling không phải face rate limiting. Kết luận “không thấy triển khai trong repo/phạm vi call chain” không phủ nhận một dịch vụ ngoài repo chưa được cung cấp.

Tìm storage deletion `destroy/delete_resources`, encryption/retention/policy trong đường face; không có cơ chế cụ thể được xác nhận. Không truy cloud dashboard/objects sinh trắc để lấp khoảng trống. Không ghi actual usernames/tokens/phone/avatar URL vào evidence.

## File, function và dòng code tại baseline

### E01

[ai-service/main.py:404](../../ai-service/main.py#L404) — `diagnose — JSON parse, CLIP→YOLO, ensemble, thresholds, static fallback; phạm vi 404–595`.

### E02

[ai-service/clip_classifier.py:31](../../ai-service/clip_classifier.py#L31) — `_embed_prompts; fetch_targets_from_backend/reload_targets/load_clip, phạm vi 31–115`.

### E03

[ai-service/clip_classifier.py:123](../../ai-service/clip_classifier.py#L123) — `_encode_image / predict_target_from_feat / predict_sub_service_from_feat / predict_clip_full, 123–248`.

### E04

[ai-service/service_catalog.py:26](../../ai-service/service_catalog.py#L26) — `CLASS_PROMPTS; CLASSES:91; SUB_SERVICES_CATALOG:93–436`.

### E05

[server/src/modules/orders/diagnosis/diagnosis-resolver.js:27](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L27) — `resolveDiagnosis; SYMPTOM_RULES:5–25; decision/result:27–114`.

### E06

[server/src/modules/orders/orders.controller.js:54](../../server/src/modules/orders/orders.controller.js#L54) — `diagnose / diagnoseUpload, Public routes:54–106; class guards:46`.

### E07

[server/src/infrastructure/external/ai/fastapi-ai.client.js:29](../../server/src/infrastructure/external/ai/fastapi-ai.client.js#L29) — `diagnoseIncident JSON 15s; compareBeforeAfter:53; verifyFace:72–84`.

### E08

[customer-app/src/services/api/aiService.ts:24](../../customer-app/src/services/api/aiService.ts#L24) — `diagnoseIssueImage, multipart image / URI / contract:24–66`.

### E09

[customer-app/src/components/diagnosis/DiagnosisChoices.jsx:5](../../customer-app/src/components/diagnosis/DiagnosisChoices.jsx#L5) — `DiagnosisChoices, description + structured answers:5–48`.

### E10

[customer-app/src/features/home/screens/HomeScreen.tsx:222](../../customer-app/src/features/home/screens/HomeScreen.tsx#L222) — `handleConfirmAiBooking:222–240`.

### E11

[customer-app/src/features/booking/hooks/useBooking.js:54](../../customer-app/src/features/booking/hooks/useBooking.js#L54) — `detail + scoped services:54–74; submitOrder:180–210`.

### E12

[server/src/modules/orders/orders.service.js:83](../../server/src/modules/orders/orders.service.js#L83) — `createOrder active service/category + server price:83–148`.

### E13

[server/src/modules/admin/admin.service.js:924](../../server/src/modules/admin/admin.service.js#L924) — `createServiceTarget aiPrompts:924–958; notifyAiServiceSync:968–970; update/toggle/delete:973–1069`.

### E14

[client/src/features/services/components/TargetModal.tsx:153](../../client/src/features/services/components/TargetModal.tsx#L153) — `TargetModal aiPrompts editor:153–162`.

### E15

[server/src/modules/services/services.service.js:23](../../server/src/modules/services/services.service.js#L23) — `getCategoryTree active relations:23–39; getTargets:42; getServices:57; getServiceById:74`.

### E16

[server/prisma/schema.prisma:103](../../server/prisma/schema.prisma#L103) — `ServiceCategory, ServiceTarget, Service relations/active fields:103–163`.

### E17

[ai-service/training/prepare_dataset.py:70](../../ai-service/training/prepare_dataset.py#L70) — `generate_class_images:70–143; build_dataset:146–183; seed:76`.

### E18

[ai-service/training/train.py:27](../../ai-service/training/train.py#L27) — `train_model pretrained/model.train/copy best:27–80`.

### E19

[ai-service/runs/classify/fixgo_cls_v1/args.yaml:1](../../ai-service/runs/classify/fixgo_cls_v1/args.yaml#L1) — `Recorded train args; results.csv và matrices cùng thư mục`.

### E20

[ai-service/eval/audit_dataset.py:7](../../ai-service/eval/audit_dataset.py#L7) — `audit_dataset SHA256 split overlap`.

### E21

[ai-service/eval/classify_dataset.py:34](../../ai-service/eval/classify_dataset.py#L34) — `evaluate_single_image path hint/confidence .92:34–74; không dùng làm pixel benchmark`.

### E22

[ai-service/main.py:189](../../ai-service/main.py#L189) — `lifespan weights / detector / face / CLIP:189–292`.

### E23

[ai-service/main.py:844](../../ai-service/main.py#L844) — `face_verify:844–944; face compare:906–921; detection-only:924–932; heuristic:937–944`.

### E24

[server/src/modules/workers/workers.controller.js:99](../../server/src/modules/workers/workers.controller.js#L99) — `verifyFaceDaily JWT/WORKER/multipart/5MB:99–109`.

### E25

[server/src/modules/workers/workers.service.js:263](../../server/src/modules/workers/workers.service.js#L263) — `verifyFaceDaily reference/binding/persist:263–277`.

### E26

[server/src/modules/orders/orders.service.js:437](../../server/src/modules/orders/orders.service.js#L437) — `verifyFace auth/stage/reference/decision:437–512; failure write:478–483; success:495–501`.

### E27

[server/src/modules/orders/orders.controller.js:269](../../server/src/modules/orders/orders.controller.js#L269) — `per-order face JSON/upload routes:269–309`.

### E28

[server/src/modules/orders/order-access.guard.js:10](../../server/src/modules/orders/order-access.guard.js#L10) — `canActivate, assigned worker/stage guard:10–28`.

### E29

[server/src/modules/orders/order-workflow.service.js:25](../../server/src/modules/orders/order-workflow.service.js#L25) — `actor/access/authorize:25–62; requireFace:65–74; MATCHED gate:181–192; IN_PROGRESS gate:194–211`.

### E30

[server/src/modules/workers/workers.service.js:193](../../server/src/modules/workers/workers.service.js#L193) — `updateAvailability face age:211; ACTIVE/APPROVED/services:215–237`.

### E31

[server/src/modules/ai/ai.controller.js:17](../../server/src/modules/ai/ai.controller.js#L17) — `AiController JWT-only; generic verify-face:27–35`.

### E32

[server/src/modules/ai/ai.service.js:13](../../server/src/modules/ai/ai.service.js#L13) — `verifyFace 2-argument call, matched vs verified:13–26; analyzeBeforeAfter:29–47`.

### E33

[server/src/infrastructure/external/ai/aiFallbackHelper.js:10](../../server/src/infrastructure/external/ai/aiFallbackHelper.js#L10) — `getFallbackCompare:10–17; getFallbackFaceVerify:20–29`.

### E34

[server/prisma/schema.prisma:265](../../server/prisma/schema.prisma#L265) — `FaceProfile, FaceVerification:265–290; WorkerProfile faceVerifiedAt:51`.

### E35

[server/src/modules/auth/auth.service.js:144](../../server/src/modules/auth/auth.service.js#L144) — `registerWorker creates WorkerProfile DRAFT without FaceProfile:144–187`.

### E36

[server/src/modules/workers/workers.service.js:54](../../server/src/modules/workers/workers.service.js#L54) — `updateProfile allowlist incl avatarUrl:54–85; submitApproval:144–190`.

### E37

[server/src/modules/admin/admin.service.js:412](../../server/src/modules/admin/admin.service.js#L412) — `delete user face rows:412–420; không thấy template enrollment write trong search scope`.

### E38

[server/src/config/cloudinary.config.js:20](../../server/src/config/cloudinary.config.js#L20) — `Chỉ đoạn workerFaceStorage:20–27 được trích xét; không xuất phần credentials`.

### E39

[worker-app/src/features/face-verification/hooks/useFaceVerification.js:13](../../worker-app/src/features/face-verification/hooks/useFaceVerification.js#L13) — `camera/gallery:13–39; verify daily/lock/refetch, reject orderId:42–75`.

### E40

[worker-app/app/(worker)/(tabs)/index.jsx:92](../../worker-app/app/(worker)/(tabs)/index.jsx#L92) — `dailyCheckIn camera/post/refetch:92–119`.

### E41

[worker-app/app/(worker)/job/[id].jsx:27](../../worker-app/app/(worker)/job/[id].jsx#L27) — `isFaceChecked=false; per-order navigation:117; start disabled:142–145`.

### E42

[worker-app/src/features/auth/services/workerEligibility.js:1](../../worker-app/src/features/auth/services/workerEligibility.js#L1) — `hasShiftVerification finite/nonfuture/<24h:1–3`.

### E43

[worker-app/src/services/api/faceService.js:12](../../worker-app/src/services/api/faceService.js#L12) — `verifyWorkerFace / verifyFaceByUrl, per-order wrappers:12–38`.

### E44

[customer-app/src/features/face-verification/hooks/useFaceVerification.js:40](../../customer-app/src/features/face-verification/hooks/useFaceVerification.js#L40) — `Legacy Customer bundle Worker hook still calls per-order face service`.

### E45

[ai-service/main.py:88](../../ai-service/main.py#L88) — `decode_image_to_cv2 bytes/base64/remote URL/local path:88–129`.

### E46

[ai-service/main.py:768](../../ai-service/main.py#L768) — `compare_before_after:768–835; CV fallback True + matchScore .92:821–835`.

### E47

[server/src/modules/orders/orders.service.js:545](../../server/src/modules/orders/orders.service.js#L545) — `verifyCompletion guard, fallback score and persistence:545–595`.

### E48

[server/src/modules/auth/strategies/jwt.strategy.js:18](../../server/src/modules/auth/strategies/jwt.strategy.js#L18) — `validate current active user+role:18–26; không xuất key cấu hình`.

### E49

[server/src/modules/orders/orders.controller.js:44](../../server/src/modules/orders/orders.controller.js#L44) — `Orders class guards JWT+Roles; Public bypass cho diagnose`.

### E50

[server/src/modules/users/users.controller.js:55](../../server/src/modules/users/users.controller.js#L55) — `uploadAvatar auth + updateAvatar; đoạn 66 ghi URL vào log`.

### E51

[server/src/common/middleware/request-logging.js:3](../../server/src/common/middleware/request-logging.js#L3) — `requestLogging logs requestId/method/path/status/duration, không body`.

### E52

[docker-compose.yml:63](../../docker-compose.yml#L63) — `AI deployment service; host mapping 8000:8000 tại 73–74`.

### E53

[ai-service/Dockerfile:1](../../ai-service/Dockerfile#L1) — `Python 3.10-slim, CPU torch và CLIP prefetch tại build; Uvicorn CMD`.

### E54

[server/src/main.js:26](../../server/src/main.js#L26) — `ValidationPipe global; JavaScript @Bind thiếu DTO metatype không tự bảo đảm validation`.

### E55

[server/prisma/migrations/20260827130333_init/migration.sql:173](../../server/prisma/migrations/20260827130333_init/migration.sql#L173) — `FaceProfile/FaceVerification columns, FKs khoảng 350–355`.

### E56

[ai-service/eval/eval_cls.py:38](../../ai-service/eval/eval_cls.py#L38) — `evaluate_test_set chặn dataset leakage trước inference`.

### E57

[server/prisma/seed.js:898](../../server/prisma/seed.js#L898) — `Seed gán faceVerifiedAt; dòng 917 tương tự; không chạy và không xuất dữ liệu seed`.

### E58

[ai-service/requirements.txt:1](../../ai-service/requirements.txt#L1) — `Dependency lower bounds, không lock; httpx/torch import trực tiếp không có khai báo trực tiếp ở file này`.

### E59

[ai-service/scripts/download_models.py:26](../../ai-service/scripts/download_models.py#L26) — `MODELS source URLs và minimum size; không gọi download trong audit`.

### E60

[server/src/modules/ai/dto/verify-face.dto.js:3](../../server/src/modules/ai/dto/verify-face.dto.js#L3) — `VerifyFaceDto fields; Orders FaceVerifyDto cùng loại String không challenge`.

### E61

[customer-app/src/features/home/components/AiScanModal.tsx:135](../../customer-app/src/features/home/components/AiScanModal.tsx#L135) — `handleLaunchCamera:135; handleLaunchLibrary:160; startAiScanProcess:185–215`.

### E62

[worker-app/app/(worker)/verification/face.jsx:11](../../worker-app/app/(worker)/verification/face.jsx#L11) — `FaceVerificationScreen; camera/gallery và orderId disabled contract`.

### E63

[worker-app/app/(auth)/register-worker.jsx:395](../../worker-app/app/(auth)/register-worker.jsx#L395) — `Registration screen gọi registerWorker; không enrollment API`.

## Tài liệu kỹ thuật ngoài repo

- [OpenCV DNN face detection/recognition](https://docs.opencv.org/4.13.0/d0/dd4/tutorial_dnn_face.html): phân biệt detect/align/feature/match và threshold theo benchmark; không mang metrics đó sang FixGo.
- [CLIP paper, Radford et al.](https://arxiv.org/abs/2103.00020): nền tảng image–text zero-shot, không là chứng cứ nhận lỗi FixGo.
- [NIST FATE passive PAD evaluation](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based): tham chiếu PAD evaluation riêng. Trang publication đã đọc; PDF đầy đủ không fetch được bằng web tool do giới hạn kích thước. Không trích các bảng/số liệu chưa đọc.

Các nguồn ngoài chỉ phục vụ học thuật/đề xuất; findings FixGo dựa trên code/artifacts baseline ở trên. Không dùng bài blog/nguồn thứ cấp để suy khả năng hệ thống.

## Blockers và phương pháp khép

**NOT VERIFIED:** Runtime deployed commit/config, actual model tensor output từ checkpoint, dataset lineage/source licenses, real worker template presence/ownership review, cloud encryption/access/retention, accuracy/calibration/security metrics, remote network exposure, PAD/device/injection behavior, Android E2E. Cách khép: environment/version attestation và isolated test có quyền dữ liệu; review storage policy/admin enrollment; clean test set; genuine/impostor/PAD protocols; authorized negative tests; device logs an toàn. Không lấy code tồn tại làm chứng minh đã triển khai/hoạt động đúng.
