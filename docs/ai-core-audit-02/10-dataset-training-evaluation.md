# Dataset, training và evaluation hai hệ thống

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

## Kết quả read-only hiện tại

**VERIFIED:** [exact-leakage.json](evidence/exact-leakage.json): train840/unique646, validation240/unique213, test120/unique114. Giao **hash distinct** train/val210, train/test109, val/test109. Không diễn giải là 210 cặp hoặc số ảnh duy nhất toàn dataset. Mỗi sáu class có140/40/20 ảnh, cân bằng số lượng, không chứng minh cân bằng nội dung/thực địa. [E20](13-evidence-index.md#e20) [E17](13-evidence-index.md#e17)

**VERIFIED:** [near-duplicate-audit.json](evidence/near-duplicate-audit.json): dHash64/Hamming≤4 giữa split, bỏ cùng SHA256, candidate pairs train/val18701, train/test9447, val/test2670; số cặp không cùng đơn vị với distinct hash ở trên. Không có candidate cross-class; exact hash multi-class count=0. **NOT VERIFIED:** Near duplicate thật, nhãn sai theo chuyên gia, cùng vật thể/session thật, chất lượng/domain phone. Template synthetic có thể khiến dHash gần dù bytes khác.

**VERIFIED:** prepare_dataset vẽ synthetic bằng OpenCV, split directories được generator gọi độc lập nhưng lặp chỉ số i/seed theo class; không group theo scene/person/device. NumPy seed đặt sau random nền và dùng Python hash(class) phụ thuộc process, nên khó tái lập. Không phải chứng cứ đã lấy dataset Kaggle/Roboflow dù metadata tự ghi nguồn. Augmentation train run có randaugment/erasing/fliplr; không chạy pipeline để đo chính xác augmentation nào active. Ảnh tổng hợp đã được tạo trong mỗi split; không có manifest ảnh gốc→augment giúp chứng minh split trước/sau mọi biến thể. [E17](13-evidence-index.md#e17) [E19](13-evidence-index.md#e19)

**VERIFIED:** Recorded run epochs5/batch16/imgsz224/pretrained=true/optimizer=auto/lr0=.01/seed0; default hàm15 và CLI10 khác recorded5. results.csv lưu top1/top5=1 tại epoch5; không là accuracy thực địa do leakage. Best.pt/deploy hash audit trước bằng nhau; manifests chỉ chứng minh file bytes, không dataset lineage. [E18](13-evidence-index.md#e18) [E19](13-evidence-index.md#e19)

**VERIFIED:** Không tìm thấy dataset train/fine-tune YuNet/SFace/PAD riêng, PAD checkpoint hay matching evaluation artifacts trong phạm vi nguồn đọc. Không đọc ảnh thật/template DB. **NOT VERIFIED:** FAR/FRR/TAR/EER/APCER/BPCER/ACER hiện tại; không lấy .95 constants làm metric. [E23](13-evidence-index.md#e23) [E34](13-evidence-index.md#e34) [E59](13-evidence-index.md#e59)

**Giới hạn provenance:** generator và cấu trúc/template synthetic được xác nhận bằng code; không có manifest chứng minh nguồn gốc từng file hiện tại hoặc có/không ảnh điện thoại được thêm ngoài script. Không coi comment nguồn dữ liệu là bằng chứng import ảnh thật.

## Thiết kế dataset sạch — RECOMMENDED

| Thành phần | Nhãn và đơn vị dữ liệu | Split chống leakage |
|---|---|---|
| Category/object | Category ID, nhiều target IDs/boxes khi cần, ảnh healthy/unknown/blur, device/session/source ID | Household/device/session/source-group split, dedup SHA256/perceptual, augmentation chỉ train sau split |
| Recommendation | Catalog version, category/target, observable symptom và customer-reported symptom riêng, tập service ID chấp nhận được/relevance nhiều mức | Tách case/device; không dùng tên file/thư mục làm feature; không lấy AI output làm ground truth |
| Face detector | Face boxes/landmarks/quality; chỉ thu thập riêng nếu baseline không đủ | Subject + device/capture session disjoint; không public ảnh sinh trắc |
| SFace verification | Genuine/impostor pairs, identity pseudo-ID, reference/enrollment version, camera/session/pose/lighting | Người validation/test không trộn khi chọn model; enrollment/probe khác session; kiểm look-alike và nhóm điều kiện |
| PAD | Bona fide / attack, attack species(print/display/video...), presentation instrument, sensor/source/session, quality | Subject-disjoint, device/instrument-disjoint; có cross-dataset/domain test; không cùng video cắt frame cả train/test |

Thu ảnh với consent/license có thể kiểm, source manifest, quyền rút/xóa và data minimization. Nếu dùng public PAD pretrained/dataset, kiểm license research/commercial, demographic coverage và annotation protocol trước khi tải; không mặc định có quyền vì công khai. Không đề xuất gửi mặt thật tới API ngoài khi chưa được phép.

## Benchmark image/recommendation

Phải gồm: đúng category+target; đúng category nhưng target khác; nhiều thiết bị; thiết bị lành/triệu chứng ẩn; blur/tối/che; ảnh không liên quan; thiết bị mới chưa catalog; dấu hiệu có thể nguy hiểm điện/nước. Khóa ảnh/prompt/catalog versions và labels chuyên gia, case-level split.

| Chỉ số | Protocol |
|---|---|
| Category/target Accuracy + macro/micro F1 | Báo mỗi class, confusion matrix, accepted coverage; target cả conditional và end-to-end |
| Detection mAP/precision/recall | Chỉ khi dùng detection trong sản phẩm; cần box labels/IoU protocol |
| Service Recall@1/3/5, ranking quality | Top-k giao tập relevance ground truth, nhiều service đúng; không gán đúng vì tên giống prompt |
| Đúng target sai service | Báo conditional và tổng; tách symptom không thấy và khách khai |
| Abstain/manual/unavailable | Coverage-risk curve, không bỏ abstained samples khỏi báo cáo tổng |
| Latency/errors | p50/p95 trên CPU kiểm soát, warm/cold, concurrency; tách upload/decode/encode/DB/UI delay; timeout/HTTP/contract failure rate |
| Calibration/catalog updates | ECE/Brier/reliability khi score có nghĩa; thêm target/service rồi chạy test cũ+mới, không dùng softmax gap làm certainty |

## Face/PAD metrics và protocol

**RECOMMENDED:** Genuine/impostor verification: FMR/FNMR trên score-only protocol; FAR/FRR toàn transaction phải nêu cả acquisition/retry/PAD policy. TAR tại FAR mục tiêu, EER nếu đủ pairs, ROC/DET + confidence intervals, subgroup/device/lighting breakdown. Chọn threshold validation, test khóa. Không báo 0 false accepts như FAR=0 bảo đảm khi số impostor nhỏ.

PAD: APCER theo từng attack species = attack được coi bona fide / attack hợp lệ được đánh giá; BPCER = bona fide bị coi attack / bona fide hợp lệ; ACER=(APCER+BPCER)/2 trong protocol đã nêu. Báo attack non-response, bona fide non-response và failures riêng, không loại khó khỏi mẫu rồi làm đẹp metric. Macro average không thay worst attack species hoặc cross-device test. [Nguồn thuật ngữ/evaluation PAD: NIST FATE](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based).

## Train gì, khi nào?

1. **Giữ pretrained trước:** CLIP/YuNet/SFace; thiết lập retrieval/quality/threshold baseline và sửa fail-open trước đo. Không train vào dữ liệu leakage để tối ưu score demo.
2. **YOLO category/object:** Chỉ fine-tune sau khi có ảnh thật sạch và gap được error analysis; category/object labels riêng. Ghi epochs/batch/imgsz/optimizer thực/lr/augmentation/seed và code hash, không coi default là tối ưu.
3. **CLIP:** Prompt/negative candidate ablation trước; contrastive fine-tune cần ảnh-text pairs và relevance labels có quyền dùng, tách test/prompt tuning.
4. **SFace:** Không fine-tune chỉ vì một lần mismatch; sửa enrollment/alignment/quality và calibrate trước. Nếu vẫn domain gap, cần protocol privacy/subject split và chứng cứ baseline.
5. **PAD:** Có thể chọn pretrained có license phù hợp và test độc lập. Train/fine-tune chỉ khi đủ attacks/bona fide/device coverage; tránh học shortcut background/display/camera nguồn.
6. **Version/deploy:** Dataset immutable manifest, weights SHA, prompt/catalog/config/threshold versions, regression report; shadow/canary sau phê duyệt, rollback cùng response contract và template compatibility. Không thay checkpoint/template âm thầm.

**ANDROID E2E PENDING:** capture chất lượng/camera thật, enrollment/daily/per-order riêng, authorized print/display/video tests, mất mạng/retry/recovery và hiệu năng p95. Toàn bộ bảng trên là plan; không có metrics tự tạo.
