# Pipeline và taxonomy có nguồn

`customer-app/src/features/home/components/AiScanModal.tsx:startAiScanProcess` gọi `src/services/api/aiService.ts:diagnoseIssueImage`. Ảnh local gửi multipart `/orders/diagnose-upload`, ảnh HTTP gửi `/orders/diagnose`. Modal gọi lần đầu không có description, có tối thiểu 2,2 giây animation: không tính animation này là inference latency.

`server/src/modules/orders/orders.controller.js` → `orders.service.js:diagnose` → `diagnosis/diagnosis-resolver.js:resolveDiagnosis` → `server/src/infrastructure/external/ai/fastapi-ai.client.js:diagnoseIncident`: thử `/ai/v2/diagnose`, rồi `/ai/diagnose` legacy, cuối cùng unavailable. Runner task này dùng **v2 thật**, không kiểm transport fallback legacy/upload/Cloudinary/mobile.

`ai-service/recommendation/router.py:diagnose_v2` decode pixel → `clip_classifier.predict_clip_full` (CLIP ViT-B/32 image embedding + prompt category) và `app.state.yolo_cls_model.predict` (YOLO classifier toàn ảnh, không khoanh vùng fault). `category_classifier.evaluate_categories` phối hợp 0,6 CLIP + 0,4 YOLO; YOLO other_unclear ưu tiên CLIP. Keyword mô tả boost ×1,8, normalize; category gate confidence 0,48 và margin 0,10. Target qua `target_matcher.match_targets`: cosine similarity trong category, threshold 0,20, Top-3. `(sim+1)/2` không phải xác suất đúng đã calibration.

Resolver gate mặc định 0,6 riêng (khác gate v2). Chỉ `engine=model` được nhận là kết quả AI. Category/target phải map slug hoặc ID vào catalog active. `aiTarget` chỉ là **suggestion**; `target` thực sự được chọn từ `answers.targetId`. Không tự lấy suggestedTarget làm confirmed target. Không có triệu chứng thì thường `needs_more_info`; dưới ngưỡng là `manual_selection`, unavailable tách riêng.

Service không được chọn bằng fault detector: `resolveService`, `symptom-taxonomy.js`, `service-ranker.js` dùng manual/rules; nếu `SYMPTOM_CATALOG_ENABLED=true`, `server/src/modules/symptoms/symptom-catalog.js:recommendServices` dùng symptom + liên kết approved/active. Giá từ Service catalog, booking kiểm lại. Không dùng availableServices như ranking; không dùng serviceId do người dùng chọn làm model prediction. Legacy Python còn static sub-service/keyword score; benchmark này không lấy kết quả đó.

## Các lớp taxonomy

| Nguồn | Số lượng | Danh tính và mức tin cậy |
|---|---:|---|
| `docs/ai-core-audit-02/evidence/catalog-snapshot.json` | 6 category / 70 target / 693 service | UUID thật từng quan sát qua API theo báo cáo lịch sử `VERIFIED_LOCAL_API_GET_NOT_DIRECT_SQL`; không xác minh DB hiện tại |
| `ai-service/target_catalog.py:TARGET_PROMPTS` | 70 | Key là slug fallback; không phải DB UUID |
| `ai-service/service_catalog.py:SUB_SERVICES_CATALOG` | 25 | Static ví dụ, không thay 693 service, giá static không authoritative |
| `service_catalog.py:CLASSES` | 7 | 6 nhóm hỗ trợ + other_unclear |
| `dataset/dataset_info.json` / YOLO artifact | 6 | sua_dien, sua_nuoc, dien_lanh, thiet_bi, lam_vuon, other_unclear; thiếu giup_viec |

Category nghiệp vụ: `sua-dien`, `sua-nuoc`, `dien-lanh`, `thiet-bi`, `lam-vuon`, `giup-viec`. `other_unclear` là lớp từ chối/OOD, không phải dịch vụ để booking.

[taxonomy.json](artifacts/taxonomy.json) chứa hàng mapping categoryId → targetId → serviceId, slug/name tương ứng, static fallback riêng và hash nguồn. Đường dẫn trường: `categories[]`, `targets[].categoryId`, `services[].categoryId/targetId`. `staticCrosswalk` chỉ rõ 70/70 static target và 25/25 static service tìm được slug tương ứng trong snapshot lịch sử; không suy ra trạng thái active hiện tại hoặc tính đúng của giá. Ground truth dùng slug ổn định hoặc UUID snapshot; metric normalize UUID về slug. Không gộp tên giống nhau thành cùng service.

`isActive=true`, `sortOrder=0` trong adapter là giả định tái dựng của snapshot phẳng, **không phải trạng thái DB mới xác nhận**. Snapshot không chứa đầy đủ `maxPrice`, prompt DB, symptom hay symptom-service. Runner baseline khóa symptom catalog v3 tắt; đánh giá rules legacy và phiên đầu AI. V3 cần export approved symptoms/links có nguồn và adapter/kiểm tra riêng; runner từ chối protocol bật v3. Không dựng symptom ID hay DB UUID còn thiếu.

CLIP trong benchmark dùng đúng **static target fallback** của source bằng cách đặt backend URL về loopback port không phục vụ. Không GET database hay dịch vụ dự án. Metadata lưu source fallback và catalog version; resolver dùng UUID snapshot. Đây là đánh giá pipeline offline có giới hạn catalog, không tuyên bố deployment đồng bộ DB.

Xuất lại (chỉ đọc local files):

```bash
ai-service/.venv/bin/python ai-service/eval/ai01/taxonomy.py \
  --snapshot docs/ai-core-audit-02/evidence/catalog-snapshot.json \
  --out /tmp/ai01-taxonomy.json
```
