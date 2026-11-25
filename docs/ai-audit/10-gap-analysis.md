# Gap analysis

| Bài toán | Hiện trạng | Gap | Cần dataset không | Annotation | Ưu tiên | Giải pháp |
|---|---|---|---|---|---|---|
| Object recognition | CLIP70 + fine-tuned trial5 thật | Chưa independent accuracy, lookalikes/OOS | Có, evaluation trước | target/category và group; bbox nếu detection | P0 | Baseline model đang có, không train từzero |
| Category | CLIP7 prompts + YOLO6 classes | Giúp việc thiếu classifier class; synthetic leakage | Có, real holdout | category, unknown flag, provenance | P0 | Đo fusion/model riêng/ablation |
| Object localization | COCO load nhưng không V2; strict5 offline | Chưa integration và target-scope guidelines | Có, bbox eval; train nếu gap | bbox object + extent | P1 | Reuse checkpoint rồi đánh giá/integrate task riêng |
| Defect signs | Optional detector/ontology10 source có | Runtime chưa model/eval approved; sign GT thiếu | Có | sign bbox, object link, hardnegative | P1 | Pilot burn/crack trên ổ cắm, không suy rootcause |
| Fault diagnosis | Questionnaire/legacy rules | Vô hình cần symptoms/measurement | Không chỉ ảnh | reported symptoms + expert inspection decision | P0 | Hỏi thêm, map catalog thay model cho mọi lỗi |
| Service recommendation | DB693 + scope/gates/ranker | DB0 symptoms/0 approved links | Có, expert case set | service set đúng + confirmed symptoms | P0 | Duyệt mapping qua task riêng; manual vẫn dùng |
| Unknown handling | Abstain/gates có thật | Chưa FAR/FRR/calibration | Có | real OOS và valid hard cases | P0 | Đo threshold fixed holdout |
| Web client UI | Mock hook0.94 | Integration khác Customer mobile | Không sửa bằng dataset | N/A | P0 | Task riêng nối API hoặc ghi rõ demo |
| Before/After | CV + fallbackpass0.92 | Technical image failure có thể thành success | Dataset pair chỉ hỗ trợ phần CV | pair same scene + repair outcome độc lập | P0 riêng | Task riêng fail-closed và field evaluation |
| Face/PAD | Pretrained + policy gates | Identity/PAD đánh giá riêng, experimental mode | Dataset identity/PAD riêng nếu cần | consent/subject/session/attack labels | Ngoài incident | Không trộn corpus; không suy approved từ health |

Chứng cứ tương ứng: [ai-service/recommendation/target_matcher.py:8 — match_targets](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/target_matcher.py:8) [ai-service/recommendation/router.py:35 — diagnose_v2](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/router.py:35) [ai-service/recommendation/visual_detector.py:26 — VisualDetector.predict/load_visual_detector](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/visual_detector.py:26) [server/src/modules/symptoms/symptom-catalog.js:94 — recommendServices](/home/vanvi/Work/do-an-fix-go-tho-tot/server/src/modules/symptoms/symptom-catalog.js:94) [client/src/features/customer/hooks/useHomeData.ts:443 — useHomeData.triggerAiDiagnosis](/home/vanvi/Work/do-an-fix-go-tho-tot/client/src/features/customer/hooks/useHomeData.ts:443) [ai-service/main.py:810 — compare_before_after heuristic fallback](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:810) [ai-service/face_core.py:18 — FacePolicy/extract_embedding](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/face_core.py:18).

## Rủi ro và thứ tự xử lý

- P0 dữ liệu/evaluation: bỏ kết luận từ validation synthetic trùng, thiết lập independent holdout; không kết luận cả hệ thống100% hoặc chưa nhận diện được gì.
- P0 routing/catalog: approved mapping chưa có, không seed fake để demo. 13 legacy rules không đủ693 dịch vụ và không tự thành visual mapping.
- P0 integration/presentation: web mock, V1 hardcoded targetconfidence/fallback static service, Before/After fallback success. Nêu rõ đường nào tạo score và có đến khách không; không nhầm V1 output raw với DB final recommendation.
- P1 semantic/geometry: sign bbox vs whole object, water containment, target khu vực/hệ thống, subtype cùng label; cần guidelines trước train.
- Scope kiểm chưa có: Cloudinary upload thật, mobile camera binary, tất cả70 target trên GT, GPU performance, load/throughput, actual model crash, license approval. Không báo đã pass những phần đó.

Không có thay đổi application code/DB/weights để khắc phục trong audit này. Đây là danh sách task riêng được ưu tiên nếu người dùng yêu cầu tiếp.

## Giới hạn kiểm chứng review trong evaluation contract

[ai-service/eval/ai01/annotation.py:45 — Review](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/annotation.py:45) khai kiểu status và annotatorIds nhưng không yêu cầu hai annotator thực sự khác nhau; [runner.py:98 — run_case.scorable](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/runner.py:98) quyết định scorable từ double_reviewed/adjudicated. Hash/path/group checks có thật, nhưng một chuỗi status do người tạo manifest khai không tự chứng minh review độc lập. Cần người phụ trách kiểm bằng chứng review/rights thực trước metric; không dùng schema hợp lệ làm chứng nhận GT. Đây là gap kiểm soát đánh giá, chưa sửa code trong audit.
