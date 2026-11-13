# PAD, liveness, replay và camera injection

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

## Kết luận hiện tại

**VERIFIED trong phạm vi source:** Không có PAD model/checkpoint/inference, random challenge server-side, nhiều frame/temporal validation, nonce/session bound capture trong Face ID call chain. Một ảnh tĩnh ImagePicker là input duy nhất; hook còn cho chọn gallery ở màn verification. Comment “Liveness / Face Detected” chỉ trả YuNet face detected, không là PAD. [E23](13-evidence-index.md#e23) [E39](13-evidence-index.md#e39) [E40](13-evidence-index.md#e40) [E60](13-evidence-index.md#e60)

Phải phân biệt **không thấy triển khai trong repo** với kết luận đã thử tấn công thành công trên điện thoại. Audit không thực hiện attack live, không tải ảnh thợ, không gửi dữ liệu sinh trắc ra ngoài. **NOT VERIFIED:** Một reverse proxy/provider/hạ tầng ngoài repo có PAD hay rate limits riêng; không có bằng chứng để gán năng lực đó cho code hiện tại.

## Hai lớp khác nhau

| Lớp / tình huống | Bảo vệ quan sát được | Kết luận và test cần làm |
|---|---|---|
| PAD: ảnh in | YuNet+SFace kiểm khuôn mặt/tương đồng | Không có detector presentation attack; khả năng chặn NOT VERIFIED |
| PAD: ảnh trên màn hình | Tương tự, không moiré/texture/PAD decision | Không được tuyên bố chống ảnh màn hình |
| PAD: video phát lại | Một frame, không challenge temporal | Không được tuyên bố chống replay video |
| Replay request ảnh cũ | Auth JWT hiện tại; server gán timestamp mới sau pass | Không nonce/challenge/capture age; có thể xử lý ảnh cũ như input mới theo code; chưa live replay [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26) |
| Replay kết quả cũ | Backend không nhận verified/score từ client ở daily/per-order; tự gọi AI | Đây là guard tốt. Nhưng timestamp chung không proof single-use/order-specific [E24](13-evidence-index.md#e24) [E27](13-evidence-index.md#e27) [E29](13-evidence-index.md#e29) |
| Gửi ảnh qua API không qua camera | Multipart bytes hoặc photoUrl; provenance camera không có attestation | Frontend camera-only ở Home không tạo server guarantee [E40](13-evidence-index.md#e40) [E27](13-evidence-index.md#e27) |
| Hook/emulated camera feed | Không thấy attestation/binding capture origin | NOT VERIFIED chống injection/deepfake; PAD không tự ngăn digital injection |
| Challenge blink/head-turn | Chưa có trong repo | Nếu bổ sung, random sequence+TTL+server validation vẫn cần; video/deepfake có thể bắt chước, không bảo vệ đầy đủ |

**Nguồn học thuật:** [NIST FATE PAD evaluation](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based) xem PAD là nhiệm vụ đánh giá riêng. Kết quả face similarity không thay thế bằng chứng PAD. Không dùng accuracy của một model trên dataset khác để gán cho FixGo.

## Contract khuyến nghị — chưa triển khai

**RECOMMENDED:** Backend phát fresh verification session bind userId+workerId+purpose(daily/order)+orderId+templateVersion+expiry+nonce; challenge ngẫu nhiên nếu chọn active liveness. Client capture theo session, server kiểm response belongs-to-session, deadline, consumption một lần và evidence quality/PAD. AI trả method/model/version, identityScore và padDecision riêng; Nest đưa ra authorization cuối. Score không hợp lệ, session dùng rồi hoặc timeout phải fail/retry/manual đúng policy.

Kết quả nên gồm `decision = matched | non_match | inconclusive | technical_error`, `identityDecision`, `padDecision`, reasonCode và provenance; chỉ authorization service có quyền chuyển proof hợp lệ thành check-in/start. Không coi field result.workerId echo là chứng cứ binding reference.

**RECOMMENDED:** Injection defense riêng: authenticated service channel, origin/integrity controls phù hợp Android, challenge-bound stream, reject stale/duplicate payload/results và risk monitoring. Device attestation là tín hiệu hỗ trợ, không tự chứng minh camera frame là người thật. Chưa hứa chống deepfake.

**ANDROID E2E PENDING:** Được phê duyệt trước, dùng người tham gia có consent và môi trường cô lập: genuine, ảnh in nhiều chất liệu, màn hình nhiều độ sáng, video nhiều thiết bị, ảnh thiếu sáng, request retry/offline. Không tạo công cụ tấn công hoặc thử dữ liệu thợ thật trong hệ thống dùng chung.
