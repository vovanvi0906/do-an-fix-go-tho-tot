# 02 — Gap analysis

10 nhóm thay đổi: **6 P0 / 3 P1 / 1 P2**. Thêm B01/B02 blocker/verification: tổng 12 gap **7 P0 / 4 P1 / 1 P2**. Không đếm hunk như một thay đổi nghiệp vụ.

| ID | Mức độ | Phân loại | Chức năng | Hiện tại | Mong muốn | File:line | Hàm | Giải pháp |
|---|---|---|---|---|---|---|---|---|
| G01 | P0 | NEEDS_MODIFICATION | Daily online/accept | 2 requireDaily callers | Enrollment gate, không Daily | server/src/modules/workers/workers.service.js:248; server/src/modules/orders/order-workflow.service.js:190 | updateStatus/transition | Đổi cả hai callers, giữ guard khác |
| G02 | P0 | NEEDS_MODIFICATION | Enrollment eligibility | status không canReceiveOrders | Backend predicate rõ | server/src/modules/workers/face/face-core.service.js:189 | status/requireEnrollment | Additive field, trusted model/consent/review |
| G03 | P0 | NEEDS_MODIFICATION | Order proof auth | upload không proof; consume chưa current capabilities | Shared predicate BEFORE/start | server/src/modules/workers/face/face-core.service.js:1049 | requireOrderProof/consumeOrder | Owner,ARRIVED,epoch,model,PAD,review,TTL |
| G04 | P0 | MISSING | Binary BEFORE upload | Chỉ JSON URL | Camera→storage→OrderImage | server/src/modules/orders/orders.controller.js:340; server/src/modules/orders/orders.service.js:465 | beforePhoto/uploadBeforePhoto | Thêm multipart endpoint, pre/post storage auth |
| G05 | P0 | NEEDS_MODIFICATION | URL BEFORE bypass | Ghi BEFORE không proof/provenance | Server upload only | server/src/modules/orders/orders.service.js:465 | uploadImage | Reject JSON BEFORE; KEEP ISSUE/AFTER |
| G06 | P0 | NEEDS_MODIFICATION | start BEFORE provenance | Type + timestamp | Server worker/order/arrival provenance | server/src/modules/orders/order-workflow.service.js:209 | transition | Description metadata versioned; tx consume giữ nguyên |
| G07 | P1 | NEEDS_MODIFICATION | Enrollment/Daily navigation | Dashboard và enroll success ép Daily | Enroll rồi về job/home | worker-app/app/(worker)/verification/face.jsx:12; worker-app/app/(worker)/(tabs)/index.jsx:68 | screen/changeAvailability | Explicit mode, preserve order context |
| G08 | P1 | MISSING | BEFORE UX | Start ngay không ảnh | Capture/upload/refetch/start | worker-app/app/(worker)/job/[id].jsx:144 | WorkerJobDetailScreen | Add BEFORE component/API method |
| G09 | P1 | NEEDS_MODIFICATION | TTL/retry/recovery | No timer; pending React only | Expiry render, sync lock, backend recovery | worker-app/app/(worker)/job/[id].jsx:28 | changeStage/loader | Refetch ACK/errors/foreground, no local proof |
| G10 | P2 | NEEDS_MODIFICATION | Copy | Theo ca, daily expiry | Enrollment + order copy | worker-app/src/features/face-verification/utils/faceStatus.js:22 | faceSummary/Card/Prompt | Bỏ Daily wording, giữ diagnostics riêng |
| B01 | P0 | BLOCKED_BY_POLICY | PAD | 2 registries rỗng | Evaluation thật được duyệt | ai-service/pad_policy.py:36; server/src/modules/workers/face/face-evidence.gateway.js:5 | PadDecisionGate/capabilities | KEEP fail closed, không fake PASS |
| B02 | P1 | NOT_VERIFIED | Review lifetime | Service vs DB khác expiry policy | Thống nhất policy | server/src/modules/workers/face/face-core.service.js:133 | identityReview/SQL session trigger | NEEDS_VERIFICATION; conservative precheck, không sửa SQL |

## ALREADY_IMPLEMENTED

| Chức năng | Source | Hành động |
|---|---|---|
| JWT→worker, consent, nonce/ownership/order ARRIVED | `server/src/modules/workers/face/face-core.service.js:77`, :561, :678 | KEEP workerTx/orderAccess/guards |
| Review, AES enrollment, không proof khi enroll | core:412, :425, :909; `template-crypto.js:23` | KEEP protocol/storage |
| Durable scoped proof + epoch/template/model + TTL | core:978, :1049 | KEEP, bổ sung shared auth |
| Atomic consume/FSM/history, event sau commit | `server/src/modules/orders/order-workflow.service.js:85`, :302 | KEEP, không quét lại IN_PROGRESS |
| BEFORE@ARRIVED, AFTER@IN_PROGRESS | `server/src/modules/orders/orders.service.js:472` | KEEP stage/role, harden BEFORE |
| Backend recovery và camera guidance | `worker-app/src/features/orders/hooks/useOrderRecovery.js:7`; LiveFaceCamera native/web | KEEP model/hooks |

## Quyết định proposal và tác động

- **Đề xuất** enrollment hợp lệ trước online/accept: active/approved worker, consent hiện hành, trusted template/model và review hợp lệ. Hiện có Daily proof gate, chưa có requireEnrollment riêng. Không chỉ xóa gate.
- Online/accept không scan hoặc chạy lại PAD. Có thể kiểm capabilities để xác nhận current identity model; PAD outage không tạo enrollment hay unlock BEFORE. ORDER session/capture/BEFORE/start fail closed theo evaluated PAD.
- B01 khóa enrollment và ORDER thật. Mock chỉ chứng minh protocol, không chứng minh PAD/biometric thực tế.
- Không cần thêm bảng/Order enum. Dùng OrderImage.description làm server-only versioned provenance, API không nhận field này từ client. Đây không phải FK; nếu yêu cầu uploader FK/asset registry độc lập thì là schema expansion ngoài phương án tối thiểu.
- BEFORE đã lưu được giữ qua upload/start lỗi; proof chỉ consume khi start commit. Hết hạn thì verify lại cùng order, không phải chụp lại BEFORE có provenance trừ đổi worker/arrival. IN_PROGRESS không scan lại.
- JSON BEFORE cũ bị reject có chủ đích; ISSUE/AFTER không đổi. Rollout backend + Worker App đồng bộ. Không cần sửa Customer/Admin cho target.
- Không cần migration cho G01–G10 nếu DB đã có hai migration Face Core. B02 nếu quyết định đổi trigger thay vì conservative check sẽ cần migration riêng; chưa được tự kết luận/chạy.
