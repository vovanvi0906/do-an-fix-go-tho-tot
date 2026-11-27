# Kiến trúc AI hiện tại

## Các boundary đã truy vết

| Thành phần | Implementation / đường gọi | Trạng thái và giới hạn |
|---|---|---|
| Customer native/web Expo | AiScanModal → diagnoseIssueImage → /orders/diagnose(-upload) | IMPLEMENTED; unit test adapter/UI, chưa chạy camera thật |
| Nest orders | Public diagnose/diagnose-upload; OrdersService gọi resolver read-only | VERIFIED live JSON route; upload source/unit only, không upload ra Cloudinary |
| FastAPI | main lifespan load models; V2 router default, V1 transport fallback | VERIFIED health + inference; V1 khác logic V2 |
| Catalog | Prisma category/target/service; CLIP fetch /service-targets và publish embeddings | VERIFIED 70 backend targets và DB snapshot; chất lượng embedding chưa đánh giá toàn bộ |
| Optional visual | approved object+sign model manifest, feature flags và symptom/link catalog | PARTIAL; live detector không nạp |
| Review/training | admin import/quarantine/bbox review/export + isolated trial | IMPLEMENTED; không train/export/write state trong audit |
| Worker | API diagnosis adapter tương tự Customer; face verification tách riêng | IMPLEMENTED; không chạy Worker binary |
| Web client customer demo | HomeMobileView → useHomeData.triggerAiDiagnosis | MOCK; fixture 0,94 không inference |
| Face + PAD | YuNet/SFace, optional MN3, MediaPipe browser hint | Inventory riêng; không dùng làm defect/object dataset |
| Before/After | ORB/RANSAC/SSIM/diff/brightness heuristics | RULE_BASED CV; fallback success cần xem xét riêng |

Chứng cứ source: [customer-app/src/features/home/components/AiScanModal.tsx:198 — AiScanModal image analysis](/home/vanvi/Work/do-an-fix-go-tho-tot/customer-app/src/features/home/components/AiScanModal.tsx:198) [customer-app/src/services/api/aiService.ts:76 — diagnoseIssueImage](/home/vanvi/Work/do-an-fix-go-tho-tot/customer-app/src/services/api/aiService.ts:76) [server/src/modules/orders/orders.controller.js:83 — OrdersController.diagnoseUpload](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/orders.controller.js:83) [server/src/modules/orders/orders.service.js:82 — OrdersService.diagnose](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/orders.service.js:82) [server/src/infrastructure/external/ai/fastapi-ai.client.js:30 — FastApiAiClient.diagnoseIncident](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/infrastructure/external/ai/fastapi-ai.client.js:30) [ai-service/main.py:191 — lifespan](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:191) [ai-service/clip_classifier.py:39 — fetch_targets_from_backend](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/clip_classifier.py:39) [ai-service/recommendation/visual_detector.py:26 — VisualDetector.predict/load_visual_detector](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/visual_detector.py:26) [worker-app/src/services/api/aiService.ts:24 — Worker diagnoseIssueImage](/home/vanvi/Work/do-an-fix-go-tho-tot/worker-app/src/services/api/aiService.ts:24) [client/src/routers/routes.jsx:99 — web customer route](/home/vanvi/Work/do-an-fix-go-tho-tot/client/src/routers/routes.jsx:99) [client/src/features/customer/hooks/useHomeData.ts:443 — useHomeData.triggerAiDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/client/src/features/customer/hooks/useHomeData.ts:443).

## Model, rules và external service

Model local thật: CLIP/PyTorch, YOLO classifiers/detector, checkpoint object trial; face YuNet/SFace và PAD riêng. Không tìm thấy LLM/Gemini/OpenAI hosted API được gọi trong diagnosis production đã khảo sát; chuỗi “Gemini” xuất hiện trong comment mô phỏng web, không chứng minh tích hợp LLM. Cloudinary là dịch vụ lưu ảnh, không model. DB API cấp catalog/aiPrompts; keywords hỗ trợ description là luật, không learned fault model.

YOLO detect 80 lớp được startup nạp nhưng luồng V2 chỉ đọc `yolo_cls_model`; không được gọi `yolo_model.predict`. Before/After nhận tham số yolo_model nhưng thân hàm CV không sử dụng nó để phát hiện hỏng. [ai-service/main.py:191 — lifespan](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:191) [ai-service/recommendation/router.py:35 — diagnose_v2](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/router.py:35) [ai-service/main.py:586 — analyze_before_after_opencv](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:586).

## Cấu hình/weights/runtime

[Health live](evidence/ai-audit-01-20261125/runtime-status.json) chứng minh trạng thái process khi kiểm. [Model artifacts](evidence/ai-audit-01-20261125/model-artifacts.json) ghi local file hashes/sizes/classes và config whitelist, không chứa secret. Đọc .env không thay thế đọc feature state runtime; visual response disabled là bằng chứng live nhánh này chưa bật/nạp. Không restart hoặc bật cờ để làm đẹp kết quả.

Không đồng nhất checkpoint fine-tuned có sẵn với model đang phục vụ. Thử nghiệm source-supervised không có independently approved GT và không được tự promote vào production.
