# So sánh phương án và roadmap

Các chi phí là mức tương đối từ architecture/data requirements, không báo giá cloud/hardware hoặc chi phí tiền đã đo.

| Phương án | Dữ liệu cần | Độ phức tạp / compute / chi phí | Rủi ro | Khả năng mở rộng / khóa luận / thực nghiệm |
|---|---|---|---|---|
| Giữ pretrained + evaluation | Real heldout425 pilot, không train | Thấp; CPU local đã inference thật | Chưa giải quyết gap nếu baseline kém | Ưu tiên nhất; chứng minh baseline khách quan |
| Cải thiện CLIP labels/prompts | Reviewed target/subtype examples; cùng holdout | Thấp; text embeddings CPU, không tải model mới | Prompt leakage/test tuning; tên có không nghĩa nhìn đúng | Ablation trước/sau prompt trên dev, test niêm phong riêng |
| Catalog mapping + questions | Expert symptom-service cases và DB review task riêng | Thấp–vừa; chủ yếu nghiệp vụ, không GPU | Mapping sai có thể gây gợi ý nguy hiểm dù object đúng | Bao phủ693 logic, unit/E2E và expert validation |
| Fine-tune YOLO hiện có | Reuse bbox có quyền; bổ sung khoảng100+30/class nếu cần | Vừa; GPU hữu ích, CPU inference hiện có; chưa benchmark trainingcost | Nguồn unverified, family leakage, overfit domain | Pilot target rõ, so pretrained/trial5/new trên cùng holdout |
| Transfer Learning khác backbone | Cùng annotation và evaluation, tùy architecture | Vừa–cao; cần budget đo riêng | Thay model che lấp thiếu dữ liệu/logic | Chỉ khi baseline cho thấy lý do cụ thể |
| Fine-tune CLIP | Paired image-text có quyền và contrastive negatives | Cao hơn prompt tuning; GPU/curation; không cần ngay | Ít dữ liệu làm mất pretrained generality | Ưu tiên thấp, cần chứng minh cải thiện chưa có hiện nay |
| Detector dấu hiệu riêng | Object+sign bbox/evidence, true negatives, sources/groups | Vừa; tận dụng optional loader/schema/gates | Nhầm sign thành cause; water object association | Có giá trị khóa luận nếu scope nhỏ và test thật độc lập |
| Hybrid AI + rules + questionnaire | Image GT + confirmed symptoms + services expert | Vừa; reuse hiện trạng, không cần model693 class | UI/source provenance và mapping phải rõ | Phù hợp nhất với service catalog và lỗi vô hình |

## Trình tự đề xuất

1. **P0 — chốt baseline/evidence**: freeze weights/prompt/catalog hashes, tái sử dụng metrics/annotation runner có sẵn, review425 ảnh pilot thật với nhóm độc lập; không cần train để bắt đầu. Tách log synthetic accuracy1 khỏi bằng chứng chất lượng thật.
2. **P0 — catalog/integration correctness**: task riêng cho approved symptom links, UI web mock, V1 fallback/candidate propagation và Before/After success fallback. Các lỗi này không giải quyết bằng tạo thêm dataset.
3. **P1 — empirical comparison**: CLIP-only, YOLOcategory-only, fusion, existing strict5 detection trên cùng holdout; đo OOS/confusion, hỏi thêm và service correctness bằng expert labels. Giữ threshold fixed trên test, không suy confidence thành accuracy.
4. **P1 — gap-directed data/training**: chỉ bổ sung lớp không đạt, ưu tiên sign burn_mark/crack ổ cắm; review raw/labels/rights trước khi synth. Fine-tune riêng artifact thử nghiệm trong task được yêu cầu, không thay deployed weights tự động.
5. **P2 — mở rộng**: sau scope/ontology/subtype review mở các target khác, group-aware splits và evaluation; giới hạn runtime manifest100classes và packagev1 khác nhau cần thiết kế rõ.

Tận dụng code đã có: [ai-service/recommendation/router.py:35 — diagnose_v2](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/router.py:35) [ai-service/recommendation/target_matcher.py:8 — match_targets](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/target_matcher.py:8) [server/src/modules/orders/diagnosis/diagnosis-resolver.js:106 — resolveDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/orders/diagnosis/diagnosis-resolver.js:106) [server/scripts/ai01/quality_review.py:68 — QualityReview.blockers/export](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/quality_review.py:68) [ai-service/training/visual_service_training.py:38 — audit/prepare_trial](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/training/visual_service_training.py:38) [ai-service/eval/ai01/metrics.py:33 — summarize](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/metrics.py:33) [ai-service/eval/ai01/runner.py:44 — Resolver/run_case/setup_models](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/runner.py:44). Không làm lại encoder, importer hoặc catalog từ đầu. Audit dừng tại tài liệu; không khởi tạo các task sửa code, seed, training hay deploy.
