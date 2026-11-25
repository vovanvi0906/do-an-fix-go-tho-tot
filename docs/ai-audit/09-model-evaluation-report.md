# Kết quả kiểm thử model và pipeline

## Những gì thực sự đã chạy

- 9 ảnh/biến thể qua **live FastAPI V2**: fixture thiết bị/vườn/before/after/face, thiếu sáng, blur, một output synthetic từ ZIP cũ và raw có nhiều annotation nguồn.
- 2 failure/fallback API calls: ảnh invalid trên V2, ảnh invalid trên Before/After.
- 4 live Nest JSON diagnosis calls: garden/before pixels-only, manual service UUID thật, service sai scope bị400. Không tạo đơn/storage upload.
- 9 CPU inference bằng strict-v2 best weights: 4 fixture/synthetic và5 source members. Source members đã nằm trong train/val gốc và labels unverified, không blind test.
- 3 CPU COCO inference bằng pretrained weights, cả3 không trả bbox ở conf.25. Lưu tại model-artifacts.json.
- **28 Python tests, 54 backend Jest tests, 35 Customer Jest tests đều PASS**. Nhiều test dùng mock/synthetic tensors/DB/HTTP fixtures, là test logic/gates, không model accuracy. Python catalog-manager sync test chỉ gọi GET read-only backend trong process test, không gọi sync endpoint dùng chung.

[Inference JSON](inference-results.json), [model/COCO](evidence/ai-audit-01-20261125/model-artifacts.json), [Python log](evidence/ai-audit-01-20261125/python-tests.log), [backend log](evidence/ai-audit-01-20261125/backend-tests.log), [Customer log](evidence/ai-audit-01-20261125/customer-tests.log).

## Kết quả từng ca

Elapsed là thời gian đo local đơn lẻ, không p95/SLA và không so sánh công bằng cold/warm, HTTP với model-only. JSON lưu đầy đủ paths, hashes input nếu có, predictions, scores và boxes của các calls; bảng rút gọn:

| Case | Nhóm | Ảnh/endpoint | Category dự đoán | Target dự đoán | Service dự đoán | Score | Box count | Elapsed ms | Đúng/sai |
|---|---|---|---|---|---|---|---|---|---|
| AUD-01 | appliance_fixture | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_appliance.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 831.553 | NOT_VERIFIED (no independent GT) |
| AUD-02 | garden_fixture | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_garden.jpg | lam-vuon | 32acffd8-6255-49b1-8035-eb34a5dff180 | NOT_VERIFIED | 0.6909 | 0 | 120.343 | NOT_VERIFIED (no independent GT) |
| AUD-03 | before_fixture | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_before.jpg | thiet-bi | 812864e5-2682-4d13-bbd4-5c22aba656cd | NOT_VERIFIED | 0.6195 | 0 | 77.697 | NOT_VERIFIED (no independent GT) |
| AUD-04 | after_fixture | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_after.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 78.172 | NOT_VERIFIED (no independent GT) |
| AUD-05 | ood_fixture | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_face.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 72.753 | NOT_VERIFIED (no independent GT) |
| AUD-06 | low_light | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_appliance.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 76.384 | NOT_VERIFIED (no independent GT) |
| AUD-07 | blur | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_appliance.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 76.131 | NOT_VERIFIED (no independent GT) |
| AUD-08 | synthetic_burn_candidate | /home/vanvi/Downloads/fixgo_suadien_outlet_burnmark_20.zip!/fixgo_suadien_outlet_burnmark_20/images/outlet_burn_001.jpg | sua-dien | b45c19d2-93d2-43ac-8330-87d223d941b4 | NOT_VERIFIED | 0.5506 | 0 | 108.192 | NOT_VERIFIED (no independent GT) |
| AUD-09 | multiple_source_annotations | /home/vanvi/Work/datasetai/01-raw/dienlanh/test/images/-500x400_png.rf.a8a3c97c658367c7c9daa4a6309d6626.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 78.194 | NOT_VERIFIED (no independent GT) |
| FAIL-10 | invalid_image_handling | {'imageUrl': '/no-such-audit-image.jpg', 'description': 'ổ cắm cháy'} | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 1.322 | NOT_VERIFIED (no independent GT) |
| FAIL-11 | invalid_image_handling | {'beforeImageUrl': '/no-such-before.jpg', 'afterImageUrl': '/no-such-after.jpg'} | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 1.389 | NOT_VERIFIED (no independent GT) |
| STRICT-1 | offline_source_supervised_object_trial | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_appliance.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 728.987 | NOT_VERIFIED (no independent GT) |
| STRICT-2 | offline_source_supervised_object_trial | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_garden.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 31.584 | NOT_VERIFIED (no independent GT) |
| STRICT-3 | offline_source_supervised_object_trial | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_before.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 28.661 | NOT_VERIFIED (no independent GT) |
| STRICT-4 | offline_source_supervised_object_trial | /home/vanvi/Downloads/fixgo_suadien_outlet_burnmark_20.zip!/fixgo_suadien_outlet_burnmark_20/images/outlet_burn_001.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 40.757 | NOT_VERIFIED (no independent GT) |
| BACKEND-1 | garden_pixels | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_garden.jpg | ef9682ad-e5dc-494e-a22f-45df72b68f9e | 32acffd8-6255-49b1-8035-eb34a5dff180 | NOT_VERIFIED | 0.6909 | 0 | 187.817 | NOT_VERIFIED (no independent GT) |
| BACKEND-2 | before_pixels | /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/images/sample_before.jpg | 0666ad90-ac9d-4d34-b04a-8925e7d1605d | 812864e5-2682-4d13-bbd4-5c22aba656cd | NOT_VERIFIED | 0.6195 | 0 | 97.606 | NOT_VERIFIED (no independent GT) |
| BACKEND-3 | manual_existing_service | /api/orders/diagnose | 4d397d29-ec22-4eae-88ea-8e411e04bdb3 | ca1e389e-6302-4a19-a086-5c815a836473 | 02695ade-1d71-4518-a4a3-4112f0f99055 | NOT_VERIFIED | 0 | 16.028 | NOT_VERIFIED (no independent GT) |
| BACKEND-4 | wrong_target_service | /api/orders/diagnose | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 0 | 10.884 | NOT_VERIFIED (no independent GT) |
| SOURCE-1 | source_member_smoke_NOT_INDEPENDENT | /home/vanvi/Work/datasetai/01-raw/dienlanh/test/images/-500x400_png.rf.a8a3c97c658367c7c9daa4a6309d6626.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 2 | 754.099 | NOT_VERIFIED (no independent GT) |
| SOURCE-2 | source_member_smoke_NOT_INDEPENDENT | /home/vanvi/Work/datasetai/01-raw/suadien/test/images/1597ntltrla-wall_jpg.rf.c0fc66464263260d32df63d1d1370e9d.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 1 | 25.373 | NOT_VERIFIED (no independent GT) |
| SOURCE-3 | source_member_smoke_NOT_INDEPENDENT | /home/vanvi/Work/datasetai/01-raw/suanuoc/test/images/clogged_sink13_jpg.rf.69f513439533cea1a574fb7f63cba18c.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 1 | 26.567 | NOT_VERIFIED (no independent GT) |
| SOURCE-4 | source_member_smoke_NOT_INDEPENDENT | /home/vanvi/Work/datasetai/01-raw/thietbigiadinh/test/images/refrigerator-png101_jpg.rf.86fff4645d3739d62bafe9ab490daaa4.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 1 | 21.216 | NOT_VERIFIED (no independent GT) |
| SOURCE-5 | source_member_smoke_NOT_INDEPENDENT | /home/vanvi/Work/datasetai/01-raw/thietbigiadinh/test/images/washing-machine-png107_jpg.rf.cbcdb8ec35334598bf9966b5140e910e.jpg | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | NOT_VERIFIED | 3 | 20.761 | NOT_VERIFIED (no independent GT) |

## Diễn giải có giới hạn

V2 phát3 target candidates từ các ảnh, backend pixels-only nhận2. Những tên fixture/source claim không được coi là nhãn GT độc lập. Synthetic file đặt tên ổ cắm cháy được V2 gợi ý Bóng đèn/LED với score0,5506; ghi đây là mismatch với **claim của gói**, không tự công bố error rate có ground truth. Bốn fixture của trial5 không có box, source smoke có bbox nhưng faucet-source có thể ra AC; domain gap/label association cần người xem và independent evaluation, không đo accuracy từ chính model.

Thiếu test ảnh thật được xác minh: nhiều góc **cùng thiết bị thực**, unseen target thiết bị cụ thể và failure model thật ở runtime production. Những nhóm đó ghi **NOT_VERIFIED**; unit tests mock không đổi thành real-world success. Không làm crash/drop model của server dùng chung để thử lỗi.

V2 invalid image trả unavailable/null, dù description có từ khóa; Before/After invalid ảnh trả heuristic pass0,92 — **đã tái hiện** hành vi cần lưu ý, không xác nhận sửa chữa. Web 0,94 mock chỉ chứng minh source path; chưa bấm UI browser trong audit.

## Metrics được phép kết luận

Không có independent reviewed GT đủ điều kiện cho các ca mới: classification Accuracy/Precision/Recall/MacroF1/confusion, detection Precision/Recall/mAP50/mAP50:95, service Top1/Top3/Recall@K/wrong-category/invalid-service rates, OOS FAR/FRR **NOT_VERIFIED / không tính**. Không thay confidence .69 bằng accuracy69%, không dùng số lượng class làm coverage accuracy.

Metrics utilities thật đã có: [ai-service/eval/ai01/metrics.py:33 — summarize](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/metrics.py:33), runner và strict annotation schema [ai-service/eval/ai01/runner.py:44 — Resolver/run_case/setup_models](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/runner.py:44) [ai-service/eval/ai01/annotation.py:10 — Labels/Provenance/Review/Sample](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/annotation.py:10). `benchmark_recommendation.py` dùng predicted_cat/target_rank/service_rank và simulated_latency_ms từ fixture; output loại đó là **MOCK**, không measured benchmark. [ai-service/eval/benchmark_recommendation.py:42 — run_benchmark: fixture ranks and simulated latency](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/benchmark_recommendation.py:42).

## Test plan bổ sung

Lập independent reviewed holdout theo category/target/sign và real source groups; loại source train/val model-exposed. Chạy image-only, image+text và text-only trên cùng ca, khóa prompts/threshold trước test; giữ lỗi trong mẫu số. Test normal/fault/lookalike, nhiều góc cùng group, blur/lowlight, multi-object, OOS và thiếu triệu chứng. Service đáp án chuyên gia dựa symptoms/context, không lấy selected serviceId input làm “model đúng”. Khi thiếu label giữ null, không đổi [] thành negative đã review.

## Metric lịch sử trong training logs — không phải benchmark mới

| Run | Epoch ghi log | Top1 / Precision | Recall | mAP50 | mAP50:95 | Phạm vi |
|---|---:|---|---|---|---|---|
| fixgo_cls_v1 | 5 | 1 | N/A | N/A | N/A | Synthetic classification có leakage |
| ai01-task04a-strict-v2 | 5 | 0.64954 | 0.55499 | 0.53367 | 0.34295 | Source-supervised validation, chưa phải independent reviewed GT |
| ai01-task04a-v1 | 5 | 0.57411 | 0.46754 | 0.46438 | 0.28273 | Source-supervised validation, chưa phải independent reviewed GT |

Đây là **dòng epoch cuối trong file results.csv có sẵn**, không nhất thiết metric của checkpoint best hoặc full evaluation protocol. Audit chỉ đọc lại log, không tính hoặc xác nhận các metric này bằng chạy validation mới. Các số không đại diện accuracy phát hiện hỏng hoặc đề xuất dịch vụ production. Đường dẫn và hash từng log trong dataset-inventory.json.

Lưu ý: Review schema có status/annotatorIds nhưng chưa tự bảo đảm hai người kiểm thực sự độc lập; runner scorable dựa status. Metric chỉ nên công bố sau kiểm bằng chứng review thật, không dựa riêng string double_reviewed. Vì vậy audit này giữ toàn bộ correctness/metrics mới null. Xem gap analysis.
