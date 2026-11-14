# Trust boundaries, fail-open và điều kiện nghiệp vụ

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

## Kết quả chính — CRITICAL SECURITY FINDING

**VERIFIED:** Technical error/inconclusive đang có đường biến thành success ở FastAPI face và Nest per-order fallback; downstream ghi timestamp là tín hiệu authorization. Phép kiểm offline [python-branches.json](evidence/python-branches.json) và [js-branches.json](evidence/js-branches.json) dùng code body thật + stubs, không network/DB/ảnh sinh trắc. PASS các assertion xác nhận hành vi hiện tại, **không phải security PASS**. [E23](13-evidence-index.md#e23) [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26) [E07](13-evidence-index.md#e07)

## Ma trận nhánh: phân loại đúng và hành vi đang có

| Nhánh | Phân loại đúng | Hành vi hiện tại có bằng chứng |
|---|---|---|
| Model chưa load | Technical error | FastAPI heuristic verified=true/.95; daily nhận JSON vẫn có thể ghi timestamp [E23](13-evidence-index.md#e23) [E25](13-evidence-index.md#e25) |
| AI không phản hồi/mạng lỗi/HTTP lỗi | Technical error | Nest daily allowFallback=false→false; per-order default→getFallbackFaceVerify thường true/.95; no server fetch timeout [E07](13-evidence-index.md#e07) [E33](13-evidence-index.md#e33) |
| Không mặt | Inconclusive | faces empty→heuristic success [E23](13-evidence-index.md#e23) |
| Nhiều mặt | Inconclusive nếu policy yêu cầu một người | Code chọn first face và có thể match; không kiểm single face [E23](13-evidence-index.md#e23) |
| Decode selfie lỗi | Technical error/inconclusive theo reason | heuristic success, không fail [E23](13-evidence-index.md#e23) [E45](13-evidence-index.md#e45) |
| Không reference/template | Inconclusive, cần enrollment | Daily reject nếu thiếu URL; per-order dùng avatar hoặc empty; AI face detected-only verified=true [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26) [E23](13-evidence-index.md#e23) |
| Reference URL có nhưng decode/face lỗi | Technical error/inconclusive | Nhảy qua compare, detector-only verified=true min .80; engine=model cũng không đảm bảo identity match [E23](13-evidence-index.md#e23) |
| Embedding dimension/feature/match lỗi | Technical error | Exception→heuristic true/.95; offline test stub feature raise, không đo tensor lỗi model thật [E23](13-evidence-index.md#e23) |
| Similarity thấp khi compare xong | Verified failure (non-match) | AI false; daily reject; per-order trả success=true/verified=false/manualReview và chỉ kycStatus=PENDING [E23](13-evidence-index.md#e23) [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26) |
| Similarity cao + đủ evidence | Verified success về identity match | AI true, Nest lưu timestamp; PAD/capture freshness vẫn chưa chứng minh nên không gọi “xác thực sống” [E23](13-evidence-index.md#e23) [E25](13-evidence-index.md#e25) |
| Score không finite/invalid | Technical error | Daily check finite; per-order parseFloat thiếu finite check, NaN với verified=true có thể pass. Stub xác nhận, không client-supplied score trực tiếp [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26) |
| Retry/request cũ | Inconclusive nếu thiếu freshness | Chưa challenge/session; timestamp mới chỉ ghi thời điểm xử lý; client locks không chống server replay [E39](13-evidence-index.md#e39) [E25](13-evidence-index.md#e25) |
| Frontend bỏ UI | Authorization phải ở server | Worker UI per-order fail-closed, nhưng API gate chỉ timestamp24h; daily/per-order không tách [E41](13-evidence-index.md#e41) [E29](13-evidence-index.md#e29) |
| Client khai verified=true | Không đáng tin | Daily/upload không đọc boolean này; backend gọi AI. Generic /api/ai/verify-face lệch contract, không có proof side effect chắc chắn [E24](13-evidence-index.md#e24) [E27](13-evidence-index.md#e27) [E32](13-evidence-index.md#e32) |

**Đính chính quan trọng:** Comment OrdersService:477 nói “cấp mốc faceVerifiedAt”, nhưng code failure branch 478–483 chỉ set kycStatus=PENDING. Không được báo failure branch tự tạo timestamp mới. Tuy nhiên không revoke timestamp cũ, và requireFace/availability không kiểm kycStatus; mốc daily cũ còn hạn có thể tiếp tục đáp ứng gate. [E26](13-evidence-index.md#e26) [E29](13-evidence-index.md#e29) [E30](13-evidence-index.md#e30)

## Endpoint và quyền chuyển trạng thái

| Endpoint | Guard thực | Có write/gate nghiệp vụ? | Kết luận |
|---|---|---|---|
| `/api/workers/verify-face-daily` | JWT current ACTIVE user, role WORKER; service lookup userId | Ghi WorkerProfile.faceVerifiedAt; online gate còn ACTIVE/APPROVED/services/GPS | Có thể cấp timestamp sai provenance; không nói mọi worker chưa duyệt sẽ tự online [E24](13-evidence-index.md#e24) [E25](13-evidence-index.md#e25) [E30](13-evidence-index.md#e30) [E48](13-evidence-index.md#e48) |
| `/api/orders/:id/face-verify` | JWT+WORKER, service access assigned order/stage | Pass cập nhật timestamp chung+kycStatus APPROVED | CRITICAL với fallback; không đổi order status ngay trong verifyFace [E26](13-evidence-index.md#e26) [E27](13-evidence-index.md#e27) [E29](13-evidence-index.md#e29) |
| `/api/orders/:id/face-verify-upload` | Như JSON + OrderAccessGuard trước FileInterceptor | Cùng OrdersService.verifyFace | Ownership/stage có thật; không order-scoped proof; upload không limits5MB riêng như daily [E27](13-evidence-index.md#e27) [E28](13-evidence-index.md#e28) |
| `/api/ai/verify-face` | JWT only, không role WORKER riêng | AiService dùng `.matched` mới update idCardVerified; real response là verified, args thiếu workerId | Contract bug, không tự kết luận có daily/order bypass từ response [E31](13-evidence-index.md#e31) [E32](13-evidence-index.md#e32) [E07](13-evidence-index.md#e07) |
| `MATCHED` transition | ACTIVE actor, worker lock/order lock, fresh timestamp, online+approval, no busy | Gán workerId | Daily timestamp được dùng; không per-order face proof [E29](13-evidence-index.md#e29) |
| `IN_PROGRESS` transition | Assigned worker, fresh timestamp, BEFORE sau ARRIVED và quote constraints | Đổi status | Có thể đạt khi chỉ daily timestamp và các prerequisite khác; UI start disabled không thay server gate [E29](13-evidence-index.md#e29) [E41](13-evidence-index.md#e41) |

Daily timestamp không chứng minh xác minh tại chính đơn; FaceVerification có orderId trong schema nhưng không writer/consumer gate. `updateAvailability` kiểm expired mà không loại future/invalid datetime như requireFace/hasShiftVerification; đây là inconsistency code, chưa có bằng chứng client có quyền ghi timestamp tùy ý. [E29](13-evidence-index.md#e29) [E30](13-evidence-index.md#e30) [E42](13-evidence-index.md#e42) [E34](13-evidence-index.md#e34)

## Trust boundaries và dữ liệu

- **Client→Nest:** token hiện tại lấy role từ DB tốt; body photoUrl và bytes vẫn là untrusted data; DTO JS với @Bind không tự có metatype, phải xác minh validation thực thay vì thấy DTO là đủ. [E48](13-evidence-index.md#e48) [E54](13-evidence-index.md#e54) [E60](13-evidence-index.md#e60)
- **Nest→AI:** Face/compare thiếu AbortSignal; không engine/method/provenance check ở consumer; response `engine=model` không đủ vì detector-only cũng dùng nhãn đó. [E07](13-evidence-index.md#e07) [E25](13-evidence-index.md#e25) [E26](13-evidence-index.md#e26) [E23](13-evidence-index.md#e23)
- **AI→URL/filesystem:** decode hỗ trợ remote URL không allowlist/local path; nguy cơ SSRF/local data interpretation **INFERRED** từ reachability, không có chứng cứ đọc file nhạy cảm hay network exploitation. Không thử payload khai thác. [E45](13-evidence-index.md#e45)
- **Network:** FastAPI routes không có auth, compose publish8000; **NOT VERIFIED** firewall/reverse-proxy protection hiện thực. CORS không phải auth. [E52](13-evidence-index.md#e52) [E01](13-evidence-index.md#e01) [E23](13-evidence-index.md#e23)
- **Template/object store:** URL ở DB và Cloudinary worker-faces; block storage không có explicit private delivery. Không truy cập URL mặt thật. Encryption/IAM/retention ngoài source NOT VERIFIED. [E34](13-evidence-index.md#e34) [E38](13-evidence-index.md#e38)
- **Logs:** Request logging metadata không body là hướng tốt; face failure log có worker name/ID, upload-avatar log URL; không xuất các giá trị đó trong audit. Không thấy FaceVerification/audit writer cung cấp trail template/proof. [E51](13-evidence-index.md#e51) [E26](13-evidence-index.md#e26) [E50](13-evidence-index.md#e50) [E34](13-evidence-index.md#e34)

## Hotfix riêng được đề xuất, chưa triển khai

**RECOMMENDED — P0:** Mọi heuristic/detection-only/technical_error/inconclusive phải không cấp proof; finite score + explicit identityMatch method + reference version; server face fetch có timeout, response schema check. Giữ fail-closed UI, bổ sung backend per-order proof độc lập. Xác định policy revoke mốc cũ không có provenance, manual review không tự grant và không làm sai FSM/wallet. Cần phê duyệt nghiệp vụ, plan rollout/rollback và tests mocks + authorized Android, không sửa ngay trong audit.
