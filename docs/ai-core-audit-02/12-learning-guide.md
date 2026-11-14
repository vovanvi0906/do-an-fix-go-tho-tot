# Giải thích thuật toán và thực nghiệm cho sinh viên

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

Đây là phần học thuật và **RECOMMENDED** về cách thực nghiệm. Những gì nói “FixGo đang làm” có evidence; ví dụ toán học không phải accuracy/model output đã đo.

## 1. YOLO classification khác YOLO detection thế nào?

Classification nhận toàn ảnh và trả vector score cho class. Với FixGo, nhãn train là category như sua_dien, không phải70 đối tượng. Detection trả tập box (x,y,w,h), class, score cho từng vùng; có thể hỗ trợ hai thiết bị trong một ảnh. Có weights detector không có nghĩa pipeline gọi detector: diagnose hiện gọi classifier, detector chỉ được nạp. [E01](13-evidence-index.md#e01) [E22](13-evidence-index.md#e22) [E17](13-evidence-index.md#e17)

Ví dụ ảnh có công tắc và ổ cắm: category classifier có thể gợi Sửa điện nhưng không cho biết khách cần sửa thứ nào. Object candidates/khách chọn target giải quyết câu hỏi đó; detection chỉ cần khi spatial grounding giúp nghiệp vụ và có box labels để đánh giá.

## 2. CLIP embedding và cosine similarity

Embedding là vector mô tả ảnh/văn bản trong cùng không gian. Với v=f_image(I), t=f_text(prompt), chuẩn hóa z=v/||v||, u=t/||t|| thì cosine=z·u. FixGo tính trung bình vectors nhiều prompt rồi chuẩn hóa lại; logits=exp(logit_scale)×cosine, p_i=exp(logit_i)/Σ_j exp(logit_j). [E02](13-evidence-index.md#e02) [E03](13-evidence-index.md#e03)

CLIP học liên hệ ảnh–văn bản và hỗ trợ zero-shot bằng mô tả class; không tự chứng minh nguyên nhân sự cố. [Bài báo CLIP gốc](https://arxiv.org/abs/2103.00020).

Thêm hoặc bỏ candidate làm mẫu số softmax đổi, nên score .8 không tự có nghĩa80% chẩn đoán đúng. Prompt “công tắc không hoạt động” có thể giống ảnh công tắc bình thường vì tình trạng mất điện không thấy trong pixel.

## 3. Nhận ra đối tượng không đồng nghĩa nhận ra hư hỏng

Ảnh có thể cho thấy một ổ cắm, vết cháy quan sát được hoặc nước trên sàn. Ảnh không đo được điện áp, nhiệt bên trong, gas, continuity của dây hay nguyên nhân nước rò. Một model học category/ngoại hình không có nhãn fault-specific không được gọi là đã chẩn đoán lỗi đó. FixGo chưa có head lỗi riêng được truy ra; static service similarity/first-service fallback không thay chứng cứ triệu chứng. [E01](13-evidence-index.md#e01) [E03](13-evidence-index.md#e03) [E04](13-evidence-index.md#e04)

## 4. Vì sao dùng category → target → symptom → service?

Category thu hẹp ngành; target xác định thiết bị; symptom xác định nhu cầu; service là hành động thương mại có ID/giá/unit đang active. Ví dụ thật từ snapshot: Sửa điện→Công tắc điện→khách xác nhận không hoạt động→Sửa công tắc không hoạt động. Lựa chọn triệu chứng do khách khai khác phát hiện bằng ảnh và phải ghi rõ source=rules/manual. Resolver hiện làm category+symptom→service, chưa có target contract. [E05](13-evidence-index.md#e05)

Một biểu thức thiết kế có thể là rank(s | image,target,symptom,context), với tập ứng viên S={s: s.active ∧ category.active ∧ target.active ∧ s.targetId=chosenTarget}. Đây là công thức đề xuất, **không phải thuật toán hiện triển khai**.

## 5. Xây dựng dataset sạch

Lưu ảnh gốc+license/consent/source/device/session; gán nhãn theo guideline, hai người review; dedup exact hash và perceptual candidates rồi chia group trước augmentation. Train dùng học trọng số; validation dùng chọn prompt/threshold/hyperparameters; test khóa dùng đánh giá cuối. Không để cùng phiên chụp/video vào cả train và test. FixGo hiện exact split overlap đã chứng minh nên metrics cũ không độc lập. [E17](13-evidence-index.md#e17) [E20](13-evidence-index.md#e20)

Ảnh synthetic dùng smoke/contract tests hoặc nghiên cứu domain có ghi rõ; không tráo thành ảnh thực địa. Nếu dataset chưa có symptom labels, không thể tính độ đúng chẩn đoán bằng category labels.

## 6. Face detection, alignment, embedding, verification

Detection tìm vị trí mặt/landmarks; alignment biến đổi crop theo landmarks để giảm khác biệt góc/khung; embedding biến crop thành vector danh tính; verification so probe với reference đã enrollment. FixGo dùng YuNet→SFace alignCrop/feature→cosine≥.60 nếu cả hai ảnh có mặt. Nếu chỉ detect một ảnh mà trả verified thì mới chứng minh đã thấy mặt, chưa chứng minh đúng người. [E23](13-evidence-index.md#e23)

[Tài liệu OpenCV](https://docs.opencv.org/4.13.0/d0/dd4/tutorial_dnn_face.html) trình bày detect, alignCrop, feature, match như các bước riêng. Kết quả benchmark công bố trong tài liệu không phải kết quả FixGo; threshold phụ thuộc protocol, không chép số để bảo đảm chất lượng.

## 7. Verification1:1 khác identification1:N

1:1 hỏi “probe có phải người sở hữu template của worker hiện tại không?”. 1:N hỏi “trong N người đã đăng ký, probe giống ai nhất?”. Daily/per-order nên bind worker từ JWT rồi lấy template của chính worker, không tìm người giống nhất toàn DB. Khi N tăng, xác suất có một impostor score cao cũng thay đổi; metric/policy1:1 không tự suy ra1:N. FastAPI workerId chỉ echo nên binding phải ở Backend. [E23](13-evidence-index.md#e23) [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26)

## 8. Liveness và presentation attack detection

PAD đánh giá presentation có phải bona fide hay ảnh/màn hình/video giả mạo theo phạm vi đã test; active liveness dùng hành động/challenge, passive PAD dùng tín hiệu ảnh/frame mà không bắt tương tác. Các từ này liên quan nhưng không nên dùng lẫn với “face detected”. FixGo chưa có PAD/challenge trong call chain. [E23](13-evidence-index.md#e23) [E39](13-evidence-index.md#e39)

Phải nêu threat model và protocol thay vì một từ “anti-spoof”. [NIST FATE PAD](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based) là nguồn tham khảo đánh giá riêng cho PAD, không là chứng nhận FixGo.

## 9. Vì sao ảnh in/video qua mặt matching đơn thuần?

Matcher tối ưu similarity danh tính. Ảnh in/video của đúng người giữ nhiều đặc điểm danh tính, nên score cao không chứng minh người sống đang có mặt. Đây là giải thích về threat model, **không phải kết quả attack experiment FixGo**. PAD xử lý dấu hiệu trình diện; session/nonce xử lý replay request; injection/camera hook cần lớp bảo vệ khác. Blink/quay đầu có thể có trong video phát lại, nên challenge đơn giản không đủ chứng minh chống replay/deepfake.

## 10. FAR, FRR, TAR, EER, APCER/BPCER

Với ngưỡng τ trên score, theo protocol1:1 đã cố định:

- FMR(τ)=impostor pairs có score≥τ / tổng impostor pairs hợp lệ; FNMR(τ)=genuine pairs score<τ / tổng genuine pairs hợp lệ.
- FAR/FRR theo transaction phải nói rõ acquisition/retry/PAD policy; không tự đồng nhất mọi failure với lỗi matcher. Khi cùng mẫu/quy tắc quyết định nhị phân và không bỏ acquisition, TAR=1−FRR.
- EER là điểm FAR≈FRR khi quét ngưỡng; là cách tóm tắt trade-off, không phải operating point bắt buộc.
- APCER=attack presentations bị chấp nhận bona fide / attack presentations được đánh giá (báo từng attack species). BPCER=bona fide bị từ chối như attack / bona fide được đánh giá. ACER=(APCER+BPCER)/2 theo protocol nêu rõ; vẫn cần worst-attack breakdown và non-response/failure counts.

Ví dụ công thức `k/N` là định nghĩa tỉ lệ, không gán k hoặc N giả cho chất lượng FixGo. Zero errors trong test nhỏ không chứng minh xác suất sai bằng0. Đọc confidence intervals và số mẫu; bootstrap nên theo subject/session thay vì coi mọi frame độc lập.

## 11. Vì sao hiệu chuẩn threshold?

Tăng τ thường giảm false accepts nhưng tăng false rejects; camera/ánh sáng/reference quality và population làm score distribution thay đổi. Chọn τ trên validation cho FAR/coverage mục tiêu rồi báo test; không chỉnh bằng test. PAD cũng cần operating point phù hợp attack species/device. Reliability calibration khác threshold selection: probability calibration hỏi score khớp tần suất đúng không; cosine tự nó không là probability. Code clamp .4–.98 không phải calibration. [E23](13-evidence-index.md#e23)

## 12. Khi nào fine-tune YOLO/CLIP/SFace/PAD?

Sửa contract, trust và dataset trước. YOLO category/object train khi có nhãn đúng task và domain gap; CLIP thử prompts/retrieval trước contrastive fine-tune; SFace giữ pretrained/quality/threshold baseline trước khi cân nhắc train bằng dữ liệu sinh trắc có quyền; PAD có dataset/threat protocol riêng và đánh giá cross-device. Không dùng huấn luyện làm cách sửa fail-open hoặc sai reference ownership.

## 13. Thực nghiệm tái lập

Mỗi run lưu commit/hash model, dataset manifest/split/group, label guideline, prompt/catalog version, dependency lock, hardware/threads, seed, hyperparameters thật, threshold-selection protocol và raw aggregate results không PII. Test không chứa training identities/captures theo split đã chốt. Run mới không overwrite best checkpoint im lặng; report cả failure/abstain, warm/cold latency, giới hạn và CI. Source/checkpoint hash chứng minh bytes, không tự chứng minh license hay dataset lineage.

## 14. Chỉ số đáng đưa vào khóa luận

Category/object macroF1 và confusion matrix; target/service Recall@k; đúng target sai service; abstention/coverage-risk; calibration; CPU p50/p95+timeout/failure; verification ROC/DET/TAR@FAR + FRR; PAD APCER theo species/BPCER/ACER+cross-device. Bổ sung số mẫu/CI, ablation và error cases. Detection mAP chỉ khi detection thật sự được dùng và có box ground truth; không lẫn mAP với classification accuracy.

## 15. Những tuyên bố không nên đưa ra

Không nói “accuracy95%” từ fallback .95; “chống ảnh giả” từ SFace; “liveness” từ YuNet; “70 đối tượng→693 dịch vụ đã học” từ một log sync; “chẩn đoán nguyên nhân điện” từ category label; “đã production-ready” từ health200/6 engine; “PASS Android” từ curl/Jest. Thay bằng phát biểu có giới hạn: “đã truy được đường model/rules này”, “metric trên split độc lập này”, “kiểu attack/device được đánh giá này”, “manual retest còn pending”.
