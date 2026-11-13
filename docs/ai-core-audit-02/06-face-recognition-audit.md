# Face matching: YuNet, SFace và quyết định Backend

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

## Thuật toán thực thi

**VERIFIED:** FastAPI `face_verify` nhận workerId/selfie/reference URL hoặc file; workerId chỉ echo trong response, không query DB template. NestJS phải là nơi bind đúng reference. YuNet `detect` trên selfie, chọn `faces[0]`; nếu reference decode được và detector thấy face thứ nhất, SFace `alignCrop` cả hai → `feature` → `match(...FR_COSINE)`. Không đọc/stash embedding từ FaceProfile. [E23](13-evidence-index.md#e23) [E34](13-evidence-index.md#e34)

Với embeddings x,y: cosine(x,y)=(x·y)/(||x|| ||y||). Quyết định trong code `cosine_score >= .60`; confidence bị chặn vào [.40,.98] và làm tròn hai số, **không phải xác suất nhận đúng danh tính**. YuNet detection-only dùng clamp [.80,.97]; fallback=.95. Threshold Backend là `AI_CONFIDENCE_THRESHOLD` mặc định .6 còn dùng cho incident category, không phải threshold biometric được đánh giá riêng. [E23](13-evidence-index.md#e23) [E07](13-evidence-index.md#e07)

**VERIFIED:** Tài liệu [OpenCV DNN face tutorial](https://docs.opencv.org/4.13.0/d0/dd4/tutorial_dnn_face.html) minh họa detector/recognizer tách biệt và các threshold khác nhau theo benchmark; LFW cosine .363 là ví dụ của benchmark đó. **RECOMMENDED:** Không thay .60 bằng .363 theo cảm tính; phải chọn threshold trên validation cùng miền thu ảnh, FAR mục tiêu và quality/PAD policy.

## Binding từ tài khoản đến reference

| Endpoint | worker hiện tại | reference | Persist và điểm yếu |
|---|---|---|---|
| Daily | JWT strategy tra User ACTIVE+role DB; controller WORKER, service findUnique userId | Chỉ FaceProfile.facePhotoUrl từ worker đó | Check boolean/finite score rồi ghi faceVerifiedAt; không check engine/method/PAD/template version [E48](13-evidence-index.md#e48) [E24](13-evidence-index.md#e24) [E25](13-evidence-index.md#e25) |
| Per-order | Service access orderId/userId, actor ACTIVE WORKER, assigned-worker và stage | FaceProfile rồi worker.avatar rồi user.avatar | Allow fallback mặc định, confidence parseFloat default .95; pass→timestamp+kyc APPROVED, không order proof [E26](13-evidence-index.md#e26) [E29](13-evidence-index.md#e29) |
| Generic `/api/ai/verify-face` | JWT bất kỳ role; pass req userId vào AiService | Body idCardImageUrl do client đưa; gọi client sai chữ ký hai args | `.matched` thay `.verified`; response thực thường không vào branch update idCardVerified. Không ghi faceVerifiedAt; không chứng minh endpoint này cho phép check-in [E31](13-evidence-index.md#e31) [E32](13-evidence-index.md#e32) [E07](13-evidence-index.md#e07) |
| FastAPI trực tiếp | workerId input không authenticated ở route | Cả hai ảnh do caller đưa | Matcher service không tự bảo đảm account/reference ownership; network exposure cần kiểm riêng [E23](13-evidence-index.md#e23) [E52](13-evidence-index.md#e52) |

**VERIFIED:** Auth ownership tồn tại ở daily/per-order; không mô tả chúng như API chấp nhận bất kỳ workerId frontend. Nhưng một reference lấy đúng row mà có thể là avatar tự sửa vẫn chưa là enrollment đáng tin.

## Các trường hợp và quality

- VERIFIED: nhiều face → chọn face đầu cả hai ảnh, không fail; không có quality blur/pose/occlusion/brightness gates ngoài detector score .6/NMS .3. Không thấy thử nhiều samples/reference aggregation. [E22](13-evidence-index.md#e22) [E23](13-evidence-index.md#e23)
- VERIFIED: SFace similarity dưới .6 → `verified=false`, không fallback nếu nhánh compare chạy xong. Nếu feature/match ném exception (cả lỗi dimension), rơi heuristic success; không có explicit embedding dimension/finite checks trước/đằng sau. Daily có finite check confidence, per-order không có. Offline mock score chuỗi không phải số được per-order cho pass khi verified=true; đây là contract robustness flaw, không chứng minh Pydantic live thường tạo NaN/chuỗi như vậy. [E23](13-evidence-index.md#e23) [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26)
- VERIFIED: transport Face API Nest không có AbortSignal timeout; mobile timeout60s/15s tùy wrapper không đồng nghĩa server hủy fetch. Daily allowFallback=false trả false khi fetch throw/HTTP không OK; per-order default true trả heuristic. [E07](13-evidence-index.md#e07) [E39](13-evidence-index.md#e39) [E43](13-evidence-index.md#e43)
- VERIFIED: chỉ frontend lock chống double-submit, chưa thấy rate limit chuyên biệt cho biometric routes; GPS throttling là mục khác. Không có FaceVerification writer để kiểm bất thường/retry count lâu dài. [E24](13-evidence-index.md#e24) [E27](13-evidence-index.md#e27) [E34](13-evidence-index.md#e34) [E39](13-evidence-index.md#e39)

## Metrics chưa được đo

**NOT VERIFIED:** FAR/FMR, FRR/FNMR, TAR tại FAR mục tiêu, EER, impostor look-alike, genuine thay ánh sáng/góc/camera, nhóm người/điều kiện đa dạng. Các .95/.98 trong response là constants/clamps, không được đưa vào khóa luận như accuracy95/98%.

**RECOMMENDED:** Test genuine/impostor pairs có consent, subject-disjoint và device/session-disjoint khi chọn model/ngưỡng; threshold chọn bằng validation, report test ROC/DET và CI. Tách failure-to-acquire, inconclusive, technical error khỏi match/mismatch. Không để thiếu face/template/timeout thành verified success.
