# FIXGO — Hoàn thiện FaceID One-Scan trên source hiện tại

> Cập nhật 2026-11-15: yêu cầu duyệt danh tính thủ công đã được thay bằng tự đăng ký từ lần quét đầu. Xem [SELF-ENROLLMENT-IMPLEMENTATION.md](./SELF-ENROLLMENT-IMPLEMENTATION.md). Các mô tả bắt buộc admin/reviewerId/thời hạn review bên dưới là lịch sử, không còn áp dụng cho luồng mới.


Ngày bàn giao: 15/11/2026. Phạm vi: Worker App, Face Core, Orders và BEFORE. Source là căn cứ; đã đối chiếu báo cáo hiện trạng, implementation spec và ONE-SCAN-HANDOVER. Báo cáo hiện trạng mô tả thời điểm trước implementation, không phải danh sách việc cần triển khai lại.

**IMPLEMENTED** nghĩa là đã có source, không đồng nghĩa đã chạy thành công trên hệ thống thật. **BUILD_VERIFIED** chỉ xác nhận build. **BLOCKED** là thiếu điều kiện vận hành/phê duyệt. **NOT_VERIFIED** là chưa có bằng chứng chạy thực tế. Không có kết quả REAL_VERIFIED trong lượt này.

## 1. Chức năng đã có và được giữ nguyên

| File / function | Quyết định | Hành vi giữ nguyên |
| --- | --- | --- |
| `server/src/modules/workers/workers.service.js` / `updateAvailability` | KEEP | Online không yêu cầu Daily; giữ ACTIVE, APPROVED, dịch vụ, GPS và điều kiện availability. |
| `server/src/modules/orders/order-workflow.service.js` / `transition` | KEEP phần lớn | Accept không Daily; giữ actor, ownership, khóa, chống nhận trùng. Start consume proof trong transaction, kiểm BEFORE sau ARRIVED và báo giá; không sửa FSM/payment. |
| `server/src/modules/workers/face/face-core.service.js` / `requireOrderProof`, `consumeOrder`, enrollment/capture | KEEP | Proof theo đơn, template/model/epoch/thời hạn; consume có điều kiện đúng một lần; giữ nonce, consent, review, rate limit và mã hóa template. |
| `server/src/modules/orders/order-before-media.service.js` / `authorize`, `upload`, `verify` | KEEP | Upload bytes thật qua SDK Cloudinary, xác minh resource đúng worker/order/lượt ARRIVED, kiểm proof trước/sau network; không consume. |
| `server/src/modules/orders/orders.service.js` / `uploadImage` | KEEP | BEFORE cần proof, xác minh storage rồi reauthorize khi lưu; dedupe cùng URL; không consume. ISSUE/AFTER giữ nguyên. |
| `server/src/modules/orders/order-before-media.guard.js`, `orders.controller.js`, `orders.module.js` | KEEP | JWT/role, guard trước multipart, endpoint BEFORE đã nối vào service. |
| Dashboard, FaceIdentityCard, FaceLoginPrompt | KEEP | Không ép Daily sau enrollment hoặc trước online/accept; hướng đến đăng ký khi cần. |
| `worker-app/src/services/api/orderService.js` / `uploadBeforeMedia`, `uploadImage` | KEEP | Gửi multipart bytes thật rồi JSON URL; không tạo URL/proof giả. |
| `worker-app/src/features/orders/hooks/useOrderRecovery.js` | KEEP | Refetch khi focus, foreground, reconnect/status event; chặn response cũ bằng generation. |
| AI service, Prisma schema/migrations, Customer App, recommendation, ví/payment | KEEP | Không sửa trong lượt này. |

`requireDaily` còn là khả năng tương thích Face Core; không có call site trong online/accept. `hasShiftVerification` giữ định nghĩa tương thích, không có runtime caller trong dashboard/luồng mục tiêu. Legacy order face endpoints vẫn tồn tại nhưng Worker one-scan dùng Face Core sessions/capture.

## 2. File/function thực tế sửa trong lượt hoàn thiện này

Không tạo endpoint hoặc phiên bản workflow thứ hai. Các thay đổi one-scan từ lượt trước đã có trong working tree; danh sách dưới đây chỉ là phần sửa bổ sung của lượt này.

| File | Function / phần sửa | Lỗi trước → hành vi sau | Trạng thái |
| --- | --- | --- | --- |
| `server/src/modules/workers/face/face-core.service.js` | `status`, `createSession` | Thêm `canUseOrderProof` cho proof đã cấp còn hợp lệ, tách khỏi readiness tạo inference mới. Review quá hạn trả blocker/error `IDENTITY_REVIEW_EXPIRED` trước insert thay vì thường rơi xuống SQL trigger. | IMPLEMENTED |
| `server/src/modules/workers/face/face-identity.service.js` | fallback status | Core tắt trả `canUseOrderProof:false`, giữ fail closed. | IMPLEMENTED |
| `server/src/modules/orders/order-workflow.service.js` | `transition` nhánh accept | Kiểm lại có dịch vụ đăng ký lúc accept; trước đó có thể mất dịch vụ sau online mà vẫn accept. Không thêm Daily hoặc FaceID gate vào accept. | IMPLEMENTED |
| `worker-app/src/features/orders/jobReadiness.js` | `jobReadiness` | Dùng cờ backend `canUseOrderProof` + scope/expiry để hiển thị BEFORE/Start, thay cho `canVerifyOrder` vốn là readiness tạo phiên mới. | IMPLEMENTED |
| `worker-app/src/features/face-verification/utils/faceStatus.js` | `FACE_BLOCKERS` | Hiển thị rõ review tạo phiên đã hết hạn, cần hỗ trợ; không yêu cầu tự enrollment lại mỗi đơn. | IMPLEMENTED |
| `worker-app/src/features/face-verification/utils/faceErrors.js` | `faceErrorMessage` | Bổ sung thông báo PAD, policy, review, consent/template, proof/stage/ownership, BEFORE và báo giá. | IMPLEMENTED |
| `worker-app/src/features/face-verification/hooks/useFaceVerification.js` | `takeSelfie` | Khi status backend có proof đúng đơn còn hiệu lực thì tiếp tục, không mở camera/tạo phiên mới; lỗi capture dùng thông báo nghiệp vụ. | IMPLEMENTED |
| `worker-app/src/features/orders/components/BeforePhotoCapture.jsx` | capture/save/lifecycle | Giữ URI/URL scene draft trong RAM do Job sở hữu; retry tái dùng URL đã upload; abort/fence kết quả trễ; kiểm ACK đúng order/type/URL; quyền camera/settings; refetch khi bị backend từ chối. | IMPLEMENTED |
| `worker-app/app/(worker)/job/[id].jsx` | Job detail, `changeStage`, recovery | Draft theo tài khoản/đơn sống qua refetch/remount panel và hết proof; xóa khi rời Job/đổi scope/đã có BEFORE/đổi stage. Bỏ refetch focus trùng; giữ room membership. Lock đồng bộ, kiểm ACK trạng thái và scope trước update; lỗi và blocker rõ ràng. | IMPLEMENTED |
| `worker-app/app/(worker)/verification/face.jsx` | `finishFlow`, proof UI | Quay về Job đang mounted nếu đúng route/id, fallback về đúng Job. Có proof hợp lệ thì tiếp tục, không bắt quét lại. Enrollment không bị điều hướng Daily. | IMPLEMENTED |

Không thêm test/fixture/mock trong lượt này. Các file test đang modified/untracked trong working tree đã có từ lượt implementation trước; không dùng kết quả cũ để xác nhận các thay đổi mới.

## 3. Luồng nghiệp vụ sau khi hoàn thiện

1. Worker xem trạng thái → consent/review hợp lệ → enrollment Face Core khi toàn bộ readiness được phê duyệt. Template gắn worker và mã hóa theo cơ chế hiện có; không đăng ký lại từng đơn.
2. Online/accept không Daily. Backend vẫn kiểm điều kiện nghề nghiệp, tài khoản, vị trí, availability và cạnh tranh nhận đơn.
3. Đến nơi bằng transition backend → `ARRIVED`. Job tải chi tiết, history/images và Face status với `orderId`.
4. Thiếu proof: mở Order FaceID. Chỉ worker được phân công và đúng ARRIVED mới được tạo phiên. Một ảnh capture cho một lượt xác thực, không dùng Daily thay ORDER. Phiên hết hạn/thất bại vẫn xử lý theo policy.
5. Có proof backend còn hiệu lực: không tạo phiên quét mới. Job mở camera sau chụp hiện trạng BEFORE.
6. Upload bytes → Cloudinary ACK được backend kiểm → POST images → backend kiểm scoped proof và resource rồi lưu OrderImage.
7. Chỉ snapshot backend có BEFORE đúng thời điểm mới mở Start. Nếu mutation lỗi/ACK mất, refetch quyết định trạng thái; không tự đánh dấu thành công.
8. Start kiểm và consume proof trong cùng transaction với điều kiện BEFORE/báo giá và chuyển `IN_PROGRESS`; lỗi thì rollback cả consumption. Event sau commit. Khi IN_PROGRESS không còn yêu cầu quét lại cho công việc đó.

UI timer kiểm expiry tại Job; backend luôn kiểm lại thời gian DB, revoke/epoch/assignment ở thao tác thực tế. Draft cảnh chụp chỉ nằm RAM/cache file của app, không chứa embedding/nonce/proof. Draft sống qua refetch hoặc quay lại Job còn mounted; không hứa giữ qua process kill/full unmount. Khi mở lại, proof/BEFORE đã lưu được khôi phục từ backend.

## 4. API và contract

Các đường dẫn dưới có prefix `/api` trên backend; Worker apiClient đã có base URL đó.

| API | Request / response sử dụng | Thay đổi lượt này |
| --- | --- | --- |
| `GET /workers/me/face/status?orderId=...` | `{success:true,data:{...orderProof,canVerifyOrder,canUseOrderProof,blockers}}` | Thêm cờ `canUseOrderProof`; blocker review expiry. Giữ field cũ. |
| `GET /workers/me/face/capabilities` | Khả năng/readiness Face Core | Giữ nguyên. |
| `POST /workers/me/face/enrollment/preflight`, `/reset/preflight` | Kiểm điều kiện, không tự cấp proof | Giữ nguyên. |
| `POST /workers/me/face/consent`, `/review-requests` | Consent version/yêu cầu review theo DTO hiện có | Giữ nguyên. |
| `POST /workers/me/face/sessions` | DTO purpose/orderId/clientRequestId hiện có; session/nonce từ backend | Review hết hạn bị từ chối rõ `IDENTITY_REVIEW_EXPIRED` khi tạo mới; không nới SQL. |
| `POST /workers/me/face/sessions/:id/capture` | Multipart capture và trường session theo contract hiện có | Giữ nguyên: Worker không gửi reference template để tự xác nhận. |
| `PATCH /workers/status` và alias hiện có | availability/GPS | Không Daily; contract giữ nguyên. |
| `POST /orders/:id/accept`, `PATCH /orders/:id/accept` | Accept qua workflow chung | Recheck dịch vụ đăng ký; không Daily. |
| `GET /orders/worker/current`, `GET /orders/:id` | Chi tiết/history/images authoritative | Giữ nguyên. |
| `PATCH /orders/:id/status` | `{status}` → `{success:true,order,changed}` | Contract giữ nguyên; Worker kiểm đúng order/status ACK. |
| `PATCH /orders/:id/arriving`, `/arrived`, `/start` | Alias transition có sẵn | Giữ nguyên; Job dùng `/status`. |
| `POST /orders/:id/before-media` | Multipart duy nhất `image`, JPEG/PNG ≤5 MiB → `{success:true,data:{url}}` | Giữ implementation hiện có; app retry/recovery tốt hơn. Chưa lưu OrderImage, chưa consume. |
| `POST /orders/:id/images` | `{type:'BEFORE',url}` → `{success:true,image}` | Giữ verification/reauthorization/dedupe hiện có; chưa consume. |

`canVerifyOrder` trả lời có thể **tạo phiên xác thực mới** không; `canUseOrderProof` mô tả **proof đã cấp** theo điều kiện sử dụng hiện hành. Cờ mới không cấp proof và không thay PAD/readiness. Backend/app nên triển khai cùng phiên bản: app yêu cầu cờ rõ `true`, backend cũ thiếu cờ sẽ đóng thao tác an toàn.

## 5. Worker App kết nối backend

`src/config/connection.js` ưu tiên cấu hình hiện hữu `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL`. Fallback lấy Metro host cổng 3000; Android emulator dùng `10.0.2.2:3000`, web localhost; API suffix `/api`, socket bỏ suffix đó.

`src/services/api/apiClient.js` lấy Bearer từ tokenStorage, giữ sessionEpoch/refresh token, trả `response.data` của Axios. Vì vậy Face/media response còn envelope `data`, còn Order transition/image đọc `order`/`image` tại root. Các màn đã đối chiếu đúng hai dạng này. App chỉ hiển thị proof metadata và refetch; không tự cấp proof hay lưu embedding.

## 6. Face Core, AI và database

Nest Face Core quyết định quyền: JWT/role/ACTIVE, worker ownership, consent/review, session/nonce, request idempotency/rate limit, template/version/model/epoch và transaction. `FastApiAiClient` gọi AI service bằng internal service token hiện có; ảnh/template cần xử lý được truyền trong phạm vi request. AI chỉ suy luận, không ghi Order Proof hoặc quyết định nhận đơn/Start.

Giữ YuNet, SFace, MN3 ở AI, ML Kit Android và BlazeFace web; không sửa threshold, model registry/version, dimension, preprocessing. Giữ mã hóa template và key handling. Không ghi secret, embedding hoặc ảnh mặt vào báo cáo.

Prisma dùng các model template/state/review/session/proof/audit, Order/OrderImage/history đã có. Không sửa schema/migration, không kết nối để kiểm chứng DB triển khai, không đọc/ghi dữ liệu nghiệp vụ trong lượt này. Vì vậy **schema/trigger thực sự đã áp dụng trên DB hiện tại: NOT_VERIFIED**.

## 7. BEFORE và Cloudinary

`BeforePhotoCapture.save` → `orderService.uploadBeforeMedia` gửi bytes camera → JWT/WORKER/OrderBeforeMediaGuard → `OrderBeforeMediaService.upload`. Backend kiểm file/magic, proof và ARRIVED; SDK `upload_stream` dùng cấu hình Cloudinary có sẵn. Public ID có namespace `fixgo/order-before/{workerId}/{orderId}/{arrivalId}/{sha256-bytes}` và `overwrite:false`.

Backend kiểm HTTPS đúng cloud, resource type `image/upload`, versioned URL, namespace/digest; gọi `cloudinary.api.resource` đối chiếu public_id, secure_url và bytes dương. Network ngoài transaction; sau đó reauthorize trước ACK và trước persist OrderImage. URL tùy ý/ảnh đơn khác bị từ chối. Sau ACK ảnh khớp order/type/url, app refetch thay vì tự bật Start.

URI và URL upload giữ trong draft để retry khi chưa persist. Backend dedupe cùng order/type/url. Storage thành công nhưng auth/persist thất bại có thể để resource mồ côi; không tự xóa tài nguyên hoặc thêm cleanup job ngoài phạm vi. Tài khoản Cloudinary/credentials/quota/network/resource thực: **NOT_VERIFIED**; không có upload thật ở lượt này.

## 8. Cấp, kiểm tra và tiêu thụ proof

Chỉ pipeline session/capture Face Core hiện có được cấp proof sau AI và mọi security gate. Không thêm stub hoặc đường cấp proof mới.

`requireOrderProof` kiểm policy, eligible worker, consent và template hiện hành; query theo workerId/orderId/templateId/templateVersion/modelVersion/epoch/purpose ORDER, chưa consumed/revoked, issuedAt ≤ DB now < expiresAt; kiểm lại ownership và ARRIVED. BEFORE gọi helper nhưng không consume.

`consumeOrder` dùng helper, conditional update đúng một proof, count phải bằng 1 và ghi audit trong transaction Start đang có. Nếu thiếu BEFORE sau arrival hoặc quote chưa duyệt, transaction rollback. Khóa/idempotency workflow và lock UI vẫn bảo vệ double tap. Chưa chạy concurrency thực tế trong lượt này.

Status mới phản ánh predicate proof đã lưu; không phụ thuộc việc AI có sẵn để làm inference mới. Đây là cách hiển thị khớp consumer đang có, không thay chính sách cấp proof: PAD chưa phê duyệt vẫn không thể enrollment/xác thực/cấp proof mới. Revoke hoặc expiry vẫn làm backend từ chối thao tác.

## 9. Lỗi thực sự đã sửa

- Panel BEFORE bị unmount bởi refetch làm mất URI/URL đang retry: chuyển quyền sở hữu draft lên Job theo scope tài khoản/đơn.
- Quay về Job bằng replace có thể tạo màn mới mất draft: ưu tiên back về đúng Job đang mounted.
- Dùng readiness tạo phiên làm điều kiện sử dụng proof đã cấp: thêm contract riêng, dùng scope/TTL và refetch backend.
- Review hết hạn có thể hiển thị sẵn sàng nhưng SQL từ chối insert session: blocker và precheck rõ ràng, không thay trigger.
- Accept chưa kiểm lại trường hợp worker đã xóa hết dịch vụ sau online: thêm count trong transaction.
- Capture/upload trả chậm sau background/unmount: abort và generation fence, xóa capture đến muộn.
- UI transition chưa kiểm đủ ACK và lỗi nghiệp vụ chưa rõ: kiểm order/status/scope, giữ actionError và tải lại authoritative state.

Đây là kết luận từ đọc source và build; các tình huống runtime trên chưa được tuyên bố đã tái hiện/xác nhận trên thiết bị thật.

## 10. Kết quả kiểm tra lượt này

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| `server: npm run build` | BUILD_VERIFIED — Babel 176 files, exit 0 | Không boot service, không chứng minh DI/DB/API runtime. |
| Worker Android: `EXPO_NO_DOTENV=1 EXPO_NO_TELEMETRY=1 npx expo export --platform android --output-dir /tmp/fixgo-one-scan-final-android` | BUILD_VERIFIED — 1156 modules, export thành công | JS/Hermes bundle, chưa native APK/ML Kit/camera trên máy thật. |
| Worker web: cùng lệnh với `--platform web --output-dir /tmp/fixgo-one-scan-final-web` | BUILD_VERIFIED — export thành công | Chưa browser permission/camera/BlazeFace runtime. |
| Python AST cho 10 file `face*.py`/`pad*.py` | Kiểm tra cú pháp thành công | Không import model, inference, readiness hoặc API thật. |
| Caller/callee/contracts và Daily call site | Đã đối chiếu source | Không thay cho kiểm chứng end-to-end. |
| Unit/integration/E2E | NOT_VERIFIED trong lượt này — không chạy | Tuân thủ yêu cầu không mocks/fixtures/test DB. Số PASS trong handover trước là lịch sử, không phải kết quả source mới. |
| AC-01 đến AC-15 chạy trên hệ thống thật | NOT_VERIFIED | Chưa có thực nghiệm từ người dùng; các AC cần cấp proof mới còn BLOCKED bởi PAD. |

Không tạo môi trường test/database, không tạo dữ liệu giả, không chạy API ghi dữ liệu, không migration/seed/reset/db push, không sửa `.env`/DATABASE_URL, không commit/push/merge hay dừng service. Build chỉ tạo artifact build/cache, không thay dữ liệu vận hành.

## 11. Blocker và phần cần xác nhận thật

- **BLOCKED — PAD:** chưa đánh giá/phê duyệt. Giữ `PAD_NOT_EVALUATED` và registry hiện tại. Không tuyên bố enrollment hoặc Order FaceID thật thành công. Full happy path không thể được bảo đảm chỉ bằng chạy app hiện tại.
- **BLOCKED — quyết định review expiry:** helper review có template xem expiry như cửa sổ enrollment, nhưng SQL `biometric_validate_session_insert` yêu cầu review chưa hết hạn cho mọi session mới. Lượt này phản ánh restriction SQL bằng precheck/status, không nới/đổi policy. Cần chủ policy quyết định semantics và xử lý vận hành qua quy trình được phê duyệt; không auto-renew, không ép re-enroll mỗi đơn.
- **NOT_VERIFIED — DB triển khai:** chưa xác nhận schema/trigger/khóa hiện hữu đồng nhất source. Precheck giảm lỗi review hết hạn thông thường nhưng không thay thế SQL hoặc loại trừ race hết hạn sát insert.
- **NOT_VERIFIED — môi trường:** credentials Cloudinary, internal AI token, crypto/consent config, model readiness, kết nối LAN/socket/JWT thực tế.
- **NOT_VERIFIED — thiết bị:** rear/front camera, Android ML Kit/native build, permission từ chối vĩnh viễn, web secure context/BlazeFace, background/foreground và network retry.
- **NOT_VERIFIED — nghiệp vụ thật:** upload bytes/resource/persist, proof expiry/revoke, cạnh tranh Start/accept, history/event một lần, rollback quote/BEFORE. Không sửa logic payment/AFTER nhưng chưa regression runtime trong lượt này.
- Ảnh BEFORE lịch sử vẫn dùng predicate timestamp sau ARRIVED của Start để tương thích dữ liệu; không tuyên bố đã xác minh lại mọi resource lịch sử trên Cloudinary.

## 12. Khởi động bằng môi trường hiện có

Các lệnh sau dành cho người dùng thực hiện; agent chưa khởi động các service này trong lượt sửa. Nếu đã có service chạy, dùng terminal/process manager hiện có; tránh chạy bản trùng và không dừng tiến trình của người khác. Giữ dependencies/cấu hình/data hiện tại; không chạy migration/seed/reset.

AI, khi virtualenv hiện có đã đầy đủ:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot/ai-service
./.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Backend:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot/server
npm run dev
```

Backend mặc định cổng 3000, prefix `/api`. Giữ cấu hình hiện có `AI_SERVICE_URL`, `AI_FACE_SERVICE_TOKEN`, Cloudinary `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` và Face Core crypto/consent/policy. Không in giá trị ra log; không đổi PAD/approval để demo.

Worker với Android development client đã cài:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot/worker-app
npm run start:debug
```

Lệnh dùng Metro cổng 8082. ML Kit cần native development build, không dùng Expo Go thuần. Nếu cần build/cài client và đã có Android SDK/thiết bị, người dùng có thể chạy `npm run android`. Điện thoại thật phải truy cập được host LAN hoặc endpoint hiện có; `localhost` trên điện thoại không phải máy backend. Không chạy `sync-ip` nếu muốn giữ nguyên `.env`.

Web:

```bash
cd /home/vanvi/Work/do-an-fix-go-tho-tot/worker-app
npm run web
```

Camera web cần localhost hoặc HTTPS cùng quyền trình duyệt. Web export thành công không xác nhận inference camera.

## 13. Checklist người dùng chạy thực tế

Dùng tài khoản/dữ liệu và quyền hợp lệ hiện có. Không chèn proof/template/approval giả để đi qua blocker.

1. Kiểm tra online/accept không mở Daily, vẫn từ chối khi thiếu điều kiện nghề nghiệp/GPS/availability; kiểm lại dịch vụ khi accept.
2. Xem trạng thái enrollment/review/PAD. Khi PAD chưa phê duyệt, xác nhận UI giải thích và backend từ chối an toàn; dừng happy path tại đây nếu không đủ điều kiện.
3. Sau khi các điều kiện vận hành được phê duyệt hợp lệ: enrollment một lần, về màn chính; không Daily, không đăng ký lại từng đơn.
4. Đơn đúng worker đến ARRIVED mới được Order FaceID; đơn khác/worker khác bị chặn. Có proof còn hiệu lực thì quay về Job, không quét lại.
5. Chụp camera sau, từ chối/cấp lại quyền, upload lỗi/retry, refresh/reconnect/background. Kiểm URI/URL pending được giữ trong cùng Job; kiểm Cloudinary resource và OrderImage bằng hệ thống quản trị có quyền.
6. Proof hết hạn/thu hồi trước persist hoặc Start phải bị chặn; xác thực lại theo policy. AFTER/Start không được dùng Daily proof thay ORDER.
7. BEFORE được backend lưu mới mở Start; double tap/mất response/refetch phải cho trạng thái backend cuối cùng. Kiểm consumption/history/event, IN_PROGRESS không đòi quét lại; quote chưa duyệt phải giữ rollback.
8. Tự chạy luồng AFTER/nghiệm thu/payment hiện hữu để regression. Không suy ra hoạt động từ build hoặc báo cáo này.
