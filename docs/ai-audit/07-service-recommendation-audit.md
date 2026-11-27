# Audit đề xuất dịch vụ

## Các đường hiện có

| Đường | Evidence → kết quả | Implementation / kiểm thử |
|---|---|---|
| Manual | category + target + service người dùng chọn → active DB ID | VERIFIED live BACKEND-3; không inference khi category đã xác nhận |
| Legacy symptom | câu trả lời symptom → service slug rule đúng category/target | IMPLEMENTED/RULE_BASED, unit tests; 13 rule khớp service hiện tại |
| Approved symptom catalog | symptom IDs reviewed → links → services top≤3 | IMPLEMENTED, MOCK unit tests; DB thực0 symptoms/links |
| Visual approved catalog | object+sign pixel evidence → VISUAL_OBSERVABLE symptom → links | PARTIAL, MOCK fixture tests; detector runtime disabled, catalog thiếu |
| CLIP static subservice V1 | similarity/static slug/prices hoặc first-service fallback | Không coi là DB final recommendation; backend yêu cầu xác nhận |

Nguồn: [server/src/modules/orders/diagnosis/diagnosis-resolver.js:70 — resolveService](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:70) [server/src/modules/orders/diagnosis/symptom-taxonomy.js:2 — SYMPTOM_RULES/buildSymptomOptions](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/symptom-taxonomy.js:2) [server/src/modules/symptoms/symptom-catalog.js:94 — recommendServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/symptoms/symptom-catalog.js:94) [server/src/modules/orders/diagnosis/visual-service-resolver.js:10 — resolveVisualServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/visual-service-resolver.js:10) [ai-service/main.py:543 — V1 first-service fallback](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:543).

## ID, inactive, scope, ranking, uncertainty

Final suggestedServiceId là UUID bản ghi DB, scopedServices lọc active/category/target. User cung cấp target sai category hoặc service không thuộc target bị từ chối; actual BACKEND-4 trả400, không fallback sang service khác. Không thể từ một test chứng minh mọi lỗi scope không tồn tại, nhưng có nguồn và unit coverage cho các nhánh này. [server/src/modules/orders/diagnosis/diagnosis-resolver.js:106 — resolveDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:106) [server/src/modules/orders/diagnosis/diagnosis-resolver.js:70 — resolveService](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:70).

Catalog ranking dùng số symptom matched, priority và tie-break ID; tối đa3. Legacy/manual ranker là RULE_BASED: base50, exact slug100, keyword +15/token cap90, confidence=null. `rankingScore` không phải xác suất model hay độ chính xác. Người chọn service cuối có thể được gắn reason “symptom_match” do truyền service.slug vào ranker; không coi reason này là triệu chứng đã được model phát hiện. [server/src/modules/orders/diagnosis/service-ranker.js:18 — rankServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/service-ranker.js:18) [server/src/modules/symptoms/symptom-catalog.js:94 — recommendServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/symptoms/symptom-catalog.js:94) [server/src/modules/orders/diagnosis/diagnosis-resolver.js:106 — resolveDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:106).

Ảnh không chắc/engine unavailable → manual_selection/unavailable/needs_more_info; AI service ID từ raw model không được resolve làm final service tự động. V2 0,48 vs backend0,6 có thể khiến model trả candidate rồi backend abstain; đã thấy synthetic image raw score0,5506. Cần evaluation/calibration, không nới threshold chỉ để có kết quả. [server/src/modules/orders/diagnosis/diagnosis-resolver.js:19 — resolveCategory](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:19).

## Điều kiện visual gợi ý và giới hạn

Feature flags phải bật, modelVersion + weights hash hợp lệ, object/sign cùng target/category, sign nằm ≥80% trong đúng một object, confidence đạt min .75; symptom VISUAL_OBSERVABLE active/APPROVED code trùng sign và approved link đúng target. Luôn requiresUserConfirmation/requiresInspection. Có nhiều object mơ hồ thì không gán bằng chứng; water drip/spray ngoài vật thể có thể không qua containment, cần đánh giá association chứ không bóp bbox. [server/src/modules/orders/diagnosis/visual-service-resolver.js:10 — resolveVisualServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/visual-service-resolver.js:10) [ai-service/recommendation/visual_detector.py:26 — VisualDetector.predict/load_visual_detector](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/visual_detector.py:26).

DB thực hiện tại không có triệu chứng/link nào: **0 dịch vụ có approved visual/symptom link**, không phải 693 dịch vụ biến mất. Manual selection hoạt động và legacy rules khác vẫn có thể dùng khi catalog flag tắt. Không tự seed/approve để tạo hình ảnh chức năng hoàn chỉnh.

## UI và tích hợp

Customer DiagnosisChoices hỗ trợ xem ảnh/sign evidence, chọn target, hỏi symptoms, manual services, API errors hiển thị; onConfirmBooking chỉ khi suggested/serviceId. Unit tests mock HTTP, chưa camera/network/Cloudinary E2E. Worker adapter có source tương tự nhưng visual preview UI không đồng nhất Customer; không tuyên bố parity UI chưa kiểm. Web client HomeMobileView mock là một vấn đề tích hợp riêng, không sửa bằng dataset. [customer-app/src/components/diagnosis/DiagnosisChoices.jsx:10 — DiagnosisChoices](/home/vanvi/Work/do-an-fix-go-tho-tot/customer-app/src/components/diagnosis/DiagnosisChoices.jsx:10) [customer-app/src/features/home/components/AiScanModal.tsx:198 — AiScanModal image analysis](/home/vanvi/Work/do-an-fix-go-tho-tot/customer-app/src/features/home/components/AiScanModal.tsx:198) [worker-app/src/services/api/aiService.ts:24 — Worker diagnoseIssueImage](/home/vanvi/Work/do-an-fix-go-tho-tot/worker-app/src/services/api/aiService.ts:24) [client/src/features/customer/hooks/useHomeData.ts:443 — useHomeData.triggerAiDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/client/src/features/customer/hooks/useHomeData.ts:443).

Không tính Top-1/Top-3/Recall@K hoặc wrong-category rate trên danh sách đáp án tự lấy từ mapping; cần chuyên gia chốt nhiều service phù hợp theo symptoms/context trên holdout rồi mới đo.
