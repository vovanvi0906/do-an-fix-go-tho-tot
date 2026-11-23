# 05 — AI-03: Face Verification

**PARTIAL.** Có identity matching 1:1 thật trong source; không còn căn cứ nói chỉ detection rồi verified=true. Load artifact đã kiểm, nhưng matching người thật, PAD quality, enrollment/proof trên DB và camera E2E chưa được xác nhận trong audit này.

## Truy vết và trust boundary

Worker camera → authenticated Face Core session → multipart capture/nonce → gateway/backend-selected template → FastAPI internal token → YuNet detection/quality → SFace 128-D cosine matching → PAD MN3 → structured evidence → backend `finish` kiểm binding/TTL/epoch/template/quality/PAD → lưu proof → consume proof khi Start.

| ID | Source / symbol | Kết luận |
|---|---|---|
| F01 | [useFaceVerification.takeSelfie/verify:73–156](../../worker-app/src/features/face-verification/hooks/useFaceVerification.js#L73), [LiveFaceCamera.jsx:20](../../worker-app/src/features/face-verification/components/LiveFaceCamera.jsx#L20) | Session trước camera, capture inline; client detection chỉ guidance, không được quyết verified |
| F02 | [FaceCoreService.submit:443](../../server/src/modules/workers/face/face-core.service.js#L443), [finish:667–717](../../server/src/modules/workers/face/face-core.service.js#L667) | ENROLLMENT có consent/approved worker, quality/PAD; encrypted versioned template gắn worker; `reviewId:null`, self-enrollment, không tự đối chiếu CCCD |
| F03 | [face_core.extract_embedding:73](../../ai-service/face_core.py#L73) | Bắt đúng một mặt, detection threshold .6, ≥80px, kiểm crop/sáng/mờ, alignCrop và feature 128-D |
| F04 | [compare_capture:103–128](../../ai-service/face_core.py#L103) | So mẫu 1:1 bằng `FaceRecognizerSF_FR_COSINE`; threshold `.60` là provisional, chưa calibration. Detection không thay matching |
| F05 | [load_face_models:20](../../ai-service/face_models.py#L20) | Pinned SHA256 YuNet/SFace, không tải tự động; lỗi hash/load không model-ready |
| F06 | [require_face_auth:31](../../ai-service/face_router.py#L31), [FastApiAiClient.verifyFaceTemplate:89](../../server/src/infrastructure/external/ai/fastapi-ai.client.js#L89), [validTemplateFaceResult](../../server/src/infrastructure/external/ai/face-result.js) | Internal token và result validation: worker/session/template/model, finite score. Backend chọn reference, không tin template do mobile đưa |
| F07 | [FaceCoreService.finish:635–766](../../server/src/modules/workers/face/face-core.service.js#L635) | Chỉ proof sau session/binding/quality/PAD/match; enrollment trả enrolled true nhưng verified false; model không trực tiếp cấp authorization |
| F08 | [requireOrderProof/consumeOrder:807–865](../../server/src/modules/workers/face/face-core.service.js#L807), [workflow.transition:203](../../server/src/modules/orders/order-workflow.service.js#L203) | Đúng worker/order/epoch/template, chưa revoked/consumed, thời gian DB; consume conditional count 1 trong transaction Start |
| F09 | [now:74](../../server/src/modules/workers/face/face-core.service.js#L74), [faceCoreConfig:13](../../server/src/modules/workers/face/face-core.config.js#L13) | DB `clock_timestamp()` authoritative; default session 2 phút, DAILY proof 8h, ORDER 5 phút; có cấu hình, chưa đọc runtime backend để xác nhận TTL triển khai |
| F10 | [OrdersService.verifyFace:443–459](../../server/src/modules/orders/orders.service.js#L443), [WorkersService.verifyFaceDaily:268–280](../../server/src/modules/workers/workers.service.js#L268) | Legacy routes luôn kết thúc fail nếu không có proof core; không ghi `faceVerifiedAt` khi failed hoặc match. Tìm production `server/src` không thấy assignment timestamp mới |
| F11 | [hasTrustedFaceProof:17](../../server/src/infrastructure/external/ai/face-result.js#L17), [requireFace](../../server/src/modules/orders/order-workflow.service.js#L68) | Legacy proof predicate luôn false: core tắt không âm thầm dựa faceVerifiedAt 24h để Start |
| F12 | [accept branch:186–198](../../server/src/modules/orders/order-workflow.service.js#L186), [Worker job face CTA:163](../../worker-app/app/(worker)/job/[id].jsx#L163) | Accept không yêu cầu Daily/Order; khi ARRIVED mới Face ORDER. Cần thống nhất “trước nhận ca” hay “trước bắt đầu làm” theo T |

## Liveness/PAD: có triển khai, chưa được đánh giá

[pad_mn3.ExperimentalMn3Pad:40](../../ai-service/pad_mn3.py#L40) load OpenVINO model pinned hash, kiểm input/output/crop. [ThresholdMn3Pad:49](../../ai-service/face_pad.py#L49) dùng real_score ≥ threshold experimental (mặc định .85), không tự ghi `padEvaluated=true`. [configured_pad:72](../../ai-service/face_pad.py#L72) cấm experimental nếu NODE_ENV/APP_ENV production. [FaceCoreService.ready:144](../../server/src/modules/workers/face/face-core.service.js#L144) chấp nhận evaluated hoặc opt-in experimental với readiness.

[pad_policy.py:33](../../ai-service/pad_policy.py#L33) registry evaluated chưa có record. Do đó không được nói không có PAD, cũng không được nói PAD đã bảo đảm chống ảnh in/màn hình. Đang có **passive PAD thử nghiệm bằng model thật**, chưa có nghiên cứu APCER/BPCER trên dữ liệu FixGo. Không thấy active liveness challenge như quay đầu/chuỗi chớp mắt được dùng làm security proof trong call chain này. Pose/stability phía camera không thay PAD. Nonce/session chống replay protocol không bảo đảm mọi camera injection/deepfake đều bị phát hiện.

Audit probe chỉ kiểm provider capabilities local: experimental ready, evaluated false, threshold .85. Một cảnh báo child process khi chạy probe từ stdin được ghi ở [09](09-test-matrix.md); chưa đo score PAD hay xác nhận happy path. Cần chạy bằng module/file thật để xác minh worker/process và timeout trước khi kết luận runtime ổn định.

## Đăng ký mẫu không bằng xác minh danh tính pháp lý

Self-enrollment lưu khuôn mặt đầu tiên đủ quality/PAD cho tài khoản đã approved nghề nghiệp. Nó đối chiếu người quay lại với mẫu đăng ký, không tự chứng minh mẫu đó khớp ảnh CCCD hoặc danh tính đã duyệt ngoài hệ thống. Không dùng avatar fallback cho Face Core. Manual review endpoint cũ bị removed theo [requestReview:266](../../server/src/modules/workers/face/face-core.service.js#L266).

Đề tài yêu cầu “đảm bảo chính chủ”: cần mô tả nguồn danh tính ban đầu, cách duyệt hồ sơ/account và quy trình mất tài khoản/reset mẫu. T không bắt buộc CCCD hay admin review cụ thể; không tự áp đặt chúng, nhưng cũng không nhận self-enrollment là KYC pháp lý đã hoàn tất.

## Negative cases và bằng chứng hiện có

| Case | Source xử lý | Mức xác minh |
|---|---|---|
| Không mặt/nhiều mặt | `extract_embedding`, NO_FACE/MULTIPLE_FACES | Fixture `sample_face.jpg` chạy detector thật trả NO_FACE; chưa có nhiều mặt thật |
| Người khác | Cosine NON_MATCH + backend reject | Source có; genuine/impostor thực tế NOT_VERIFIED |
| Ảnh in/màn hình | MN3 passive PAD experimental | Chưa có bộ tấn công được gán nhãn/đo trên máy thật |
| Model missing/hash mismatch/transport lỗi | Technical/inconclusive, fallback face false; proof không được cấp | Source fail-closed; không gán PASS biometric từ unit mocks |
| Score/model/template/session sai | Validation + finish binding | Unit sources có fixtures, chưa rerun ở task này |
| Replay/expiry/revoke/wrong order | Session/epoch, proof consumed conditional, DB clock | Source có; DB concurrency thực NOT_VERIFIED |

`eval/test_face_security.py` dùng fake Detector/Recognizer, patch decode; `eval/test_face_models.py` trộn unit giả và smoke model có `FACE_TEST_MODEL_DIR`; `test_face_live_bridge.py` là transport smoke không chứng minh identity accuracy. Các kết quả cũ được phân loại theo phạm vi, không lấy số test pass làm FMR/FNMR.

## Đánh giá check-in 24h và trùng lặp

Daily 24h là thiết kế lịch sử, không phải yêu cầu của T và không còn gate accept hiện tại. Core vẫn hỗ trợ DAILY (default 8h) và ORDER (5 phút), nhưng app job dùng ORDER, tái sử dụng proof còn hiệu lực thay quét lại. Không thể nói hai luồng bắt buộc lặp nhau. Nếu bật policy yêu cầu cả hai sau này phải đánh giá UX và rủi ro riêng. Core disabled vẫn fail-closed ở Start thay vì cấp timestamp tin cậy giả.

Kết luận: primitive nhận diện phù hợp AI-03; cần dataset genuine/impostor và spoof độc lập, calibration ngưỡng, kiểm source-to-DB-to-device, chứng minh lineage mẫu ban đầu và xác nhận mốc nghiệp vụ với người hướng dẫn trước khi tuyên bố hoàn thành.
