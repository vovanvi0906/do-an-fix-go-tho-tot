# Kiểm chứng các giả thuyết AI nhận sai đối tượng

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

Mỗi dòng tách nguyên nhân quan sát được khỏi tác động chưa benchmark. Không gán một root cause duy nhất cho mọi ảnh nhận sai.

| Giả thuyết | Trạng thái và bằng chứng | Tái hiện / kiểm chứng an toàn | Tác động / giải pháp RECOMMENDED |
|---|---|---|---|
| 1. YOLO chỉ sáu nhãn | VERIFIED: dataset/run6 category, không target labels; CLIP có7 nhãn gồm giúp việc [E17](13-evidence-index.md#e17) [E19](13-evidence-index.md#e19) [E04](13-evidence-index.md#e04) | Đối chiếu dirs/args/names trong môi trường offline, không dùng filename dự đoán | Không thể kỳ vọng head category xuất70 target; thêm target baseline/eval riêng |
| 2. Prompt quá chung | VERIFIED: generator Admin có generic name/slug fallback; snapshot70 targets đều có aiPrompts, không thiếu prompts [E13](13-evidence-index.md#e13) [E02](13-evidence-index.md#e02) | Prompt ablation trên ảnh có nhãn object; so prompts đã curate/generic | INFERRED ảnh hưởng ranking; không khẳng định tất cả prompts hiện quá chung |
| 3. Embeddings không đại diện thực tế | VERIFIED: zero-shot pretrained+mean prompt embeddings [E02](13-evidence-index.md#e02) [E03](13-evidence-index.md#e03) | Test object retrieval theo camera/pose/nhà; visualize error groups | Chất lượng domain NOT VERIFIED; curate prompts/negatives trước fine-tune |
| 4. Domain gap ảnh điện thoại | VERIFIED: script vẽ synthetic, không manifest phone photos [E17](13-evidence-index.md#e17) | Test độc lập ảnh thật có consent, tách device/session | Domain gap INFERRED mạnh; cần ảnh thực và đa dạng ánh sáng |
| 5. Crop/preprocessing mất tín hiệu | VERIFIED: BGR→RGB processor; cache config center crop224 [E03](13-evidence-index.md#e03) [E45](13-evidence-index.md#e45) | So ảnh gốc/crop trên dữ liệu thử hợp lệ, test vật thể ở mép | Tác động thực NOT VERIFIED; ROI detection chỉ khi cần và benchmark chứng minh |
| 6. Fusion/threshold không phù hợp | VERIFIED: square weighting, bỏ OOD YOLO, threshold nhiều hằng, score+.35 [E01](13-evidence-index.md#e01) | Ablation YOLO/CLIP/ensemble cùng test, chọn ngưỡng trên validation | INFERRED calibration/false positive; dùng ECE/coverage-risk, không lấy softmax làm certainty |
| 7. Nhiều vật thể toàn ảnh | VERIFIED: không call detector; một target argmax và một service [E01](13-evidence-index.md#e01) [E03](13-evidence-index.md#e03) [E22](13-evidence-index.md#e22) | Ảnh nhiều thiết bị có object labels, so target set Recall@k | Không xác định thiết bị khách cần; candidate list + câu hỏi, crop khi hợp lý |
| 8. Mapping sai/thiếu | VERIFIED: no composite FK, target fallback global, service không filter target [E03](13-evidence-index.md#e03) [E16](13-evidence-index.md#e16) | Snapshot membership + fixture category-target conflict, không ghi DB | Sai quan hệ có thể xảy ra; enforce invariant cả Admin và retrieval |
| 9. Backend bỏ model output | VERIFIED: chỉ category/score được dùng [E05](13-evidence-index.md#e05) | check-catalog-flow.cjs xác nhận ignored target/service | Customer không hưởng70 target prediction; bổ sung contract DB IDs có provenance |
| 10. Fallback có vẻ inference | VERIFIED: first service static score*.92; eval path conf=.92 [E01](13-evidence-index.md#e01) [E21](13-evidence-index.md#e21) | Offline nhánh thiếu CLIP subservice; kiểm raw source/decision_source | Phải phân biệt heuristic vs model; không hiển thị confidence giả |

**VERIFIED:** Backend JSON description bị mất ở FastAPI parse, nên symptom text người dùng không đi vào phần keyword boost trong đường Backend→AI. Symptom answers vẫn được Backend xử lý, không nói cả hệ thống bỏ mọi input triệu chứng. [E07](13-evidence-index.md#e07) [E01](13-evidence-index.md#e01) [E05](13-evidence-index.md#e05)

**VERIFIED:** Exact hash leakage tái xác nhận 210/109/109. dHash64 grayscale9×8 Hamming≤4 loại trừ cùng SHA256 cho candidate pairs: train/val18.701; train/test9.447; val/test2.670. Đây là cặp gần nhau theo descriptor, **không phải ảnh duplicate đã reviewer xác nhận**, có thể do templates synthetic đơn giản. Không có cross-class candidate trong phép dò này; không chứng minh nhãn đều đúng. [near-duplicate-audit.json](evidence/near-duplicate-audit.json).

**NOT VERIFIED:** Accuracy object70, serviceRecall@k693, tỉ lệ đúng target sai symptom, confidence reliability thực tế. Output12 ảnh synthetic audit01 chỉ là artifact lịch sử; không rerun/khẳng định đó là runtime HEAD hay benchmark độc lập.
