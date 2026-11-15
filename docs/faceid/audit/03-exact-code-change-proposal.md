# 03 — Exact code change proposal

**Chỉ là code đề xuất trong Markdown; chưa áp dụng source.** Snapshot: 47d2387. CURRENT CODE trích trực tiếp theo dòng từ source. Các method/helper mới dưới đây được ghi rõ ADD, không gọi là code hiện có. API contract ở báo cáo 04 phải được chốt trước hai agent triển khai.

Quy ước: giữ model/threshold, disabled-core fail closed, JWT/roles/consent/PAD guards. Network AI/storage chạy ngoài transaction DB 10s; không await capability HTTP trong workerTx. Metadata BEFORE lưu `OrderImage.description` do backend tạo, không nhận từ JSON client. Không thêm Prisma field.


## G01/G02 — Enrollment gate thay Daily (MODIFY)

**File:** `server/src/modules/workers/face/face-core.service.js:1024`

**CURRENT CODE:**

```js
  async requireDaily(tx, workerId) {
    this.policy();
    await this.eligibleWorker(tx, workerId);
    const state = await tx.biometricState.findUnique({ where: { workerId } }),
      now = await this.now(tx);
    const template = await this.current(tx, workerId);
    if (!this.consentValid(state) || !template) fail('DAILY_PROOF_REQUIRED');
    const proof = await tx.biometricProof.findFirst({
      where: {
        workerId,
        templateId: template.id,
        templateVersion: template.version,
        modelVersion: template.modelVersion,
        epoch: state.epoch,
        purpose: 'DAILY',
        orderId: null,
        revokedAt: null,
        consumedAt: null,
        issuedAt: { lte: now },
        expiresAt: { gt: now },
      },
    });
    if (!proof) fail('DAILY_PROOF_REQUIRED');
    return metaProof(proof);
```


**PROPOSED REPLACEMENT / ADDITIONS:**

```js
// ADD trước requireDaily; giữ requireDaily cho legacy API/tests, bỏ caller target.
async enrollmentCapabilities() {
  this.policy();
  const caps = await this.gateway.capabilities();
  if (!caps?.identityModelReady || !text(caps.modelVersion, 256))
    fail('IDENTITY_MODEL_NOT_READY');
  return caps;
}
enrollmentBlockers(state, template, review, caps) {
  return [
    ...(!this.consentValid(state) ? ['CONSENT_REQUIRED'] : []),
    ...(!template || !template.encrypted || !this.options.keys[template.keyId]
      ? ['TRUSTED_TEMPLATE_REQUIRED'] : []),
    ...(!review ? ['IDENTITY_REVIEW_REQUIRED'] : []),
    ...(!caps?.identityModelReady || !text(caps.modelVersion, 256)
      ? ['IDENTITY_MODEL_NOT_READY'] : []),
    ...(template && template.modelVersion !== caps?.modelVersion
      ? ['TEMPLATE_MODEL_CHANGED'] : []),
  ];
}
async requireEnrollment(tx, workerId, caps) {
  this.policy();
  await this.eligibleWorker(tx, workerId);
  const state = await tx.biometricState.findUnique({ where: { workerId } });
  const template = await this.current(tx, workerId);
  const now = await this.now(tx);
  const review = await this.identityReview(tx, workerId, state, template, now);
  const blockers = this.enrollmentBlockers(state, template, review, caps);
  if (blockers.length) fail(blockers[0]);
  return metaTemplate(template);
}
// status(): sau khi có state/template/review/caps, trước return:
const receiveBlockers = [
  ...(worker.approvalStatus !== 'APPROVED' ? ['WORKER_APPROVAL_REQUIRED'] : []),
  ...this.enrollmentBlockers(state, template, review, caps),
];
// ADD vào response return của status(), không xóa field cũ:
// canReceiveOrders: receiveBlockers.length === 0,
// receiveBlockers,
// dailyRequired: false,
```

**File:** `server/src/modules/workers/workers.service.js:243`

**CURRENT CODE:**

```js
    const data = { isOnline, ...(isOnline ? { currentLat: lat, currentLng: lng } : {}) };
    const updated = this.faceCore?.enabled()
      ? await this.faceCore.workerTx(userId, async (tx, current) => {
          if (isOnline) {
            if (current.approvalStatus !== 'APPROVED' || !await tx.workerService.count({ where: { workerId: current.id } })) throw new BadRequestException('WORKER_NOT_AVAILABLE');
            await this.faceCore.requireDaily(tx, current.id);
          }
          return tx.workerProfile.update({ where: { id: current.id }, data });
        })
      : await this.prisma.workerProfile.update({ where: { id: worker.id }, data });
```


**PROPOSED REPLACEMENT / ADDITIONS:**

```js
// Thay block const updated; GPS/ACTIVE/APPROVED/services trước đó giữ nguyên.
const enrollmentCaps = isOnline && this.faceCore?.enabled()
  ? await this.faceCore.enrollmentCapabilities() : null;
const updated = this.faceCore?.enabled()
  ? await this.faceCore.workerTx(userId, async (tx, current) => {
      if (isOnline) {
        if (current.approvalStatus !== 'APPROVED' ||
            !await tx.workerService.count({ where: { workerId: current.id } }))
          throw new BadRequestException('WORKER_NOT_AVAILABLE');
        await this.faceCore.requireEnrollment(tx, current.id, enrollmentCaps);
      }
      return tx.workerProfile.update({ where: { id: current.id }, data });
    })
  : await this.prisma.workerProfile.update({ where: { id: worker.id }, data });
```

**File:** `server/src/modules/orders/order-workflow.service.js:184`

**CURRENT CODE:**

```js
      const data = { status: target };
      let cancellationFee;
      if (accepting) {
        const worker = await tx.workerProfile.findUnique({
          where: { id: actor.workerProfile.id },
        });
        if (this.faceCore?.enabled()) await this.faceCore.requireDaily(tx, worker.id);
        else this.requireFace(worker);
        if (!worker.isOnline || worker.approvalStatus !== 'APPROVED')
          throw new BadRequestException('WORKER_NOT_AVAILABLE');
        const busy = await tx.order.findFirst({
          where: { workerId: worker.id, status: { in: ACTIVE_STATUSES } },
        });
        if (busy) throw new ConflictException('WORKER_HAS_ACTIVE_ORDER');
        data.workerId = worker.id;
      }
```


**PROPOSED REPLACEMENT / ADDITIONS:**

```js
// transition(): sau const target, trước $transaction:
const faceCaps = this.faceCore?.enabled() && target === 'MATCHED'
  ? await this.faceCore.enrollmentCapabilities() : null;
// Thay đúng requireDaily caller trong accepting, giữ availability/busy/data:
if (this.faceCore?.enabled())
  await this.faceCore.requireEnrollment(tx, worker.id, faceCaps);
else this.requireFace(worker);
```


Callers: dashboard PATCH status, POST accept và generic PATCH MATCHED/alias ASSIGNED. Không thay consent/enrollment issuer, không Daily proof giả. Online/accept dùng enrollment/model, không yêu cầu evaluated PAD lại; template chỉ được enroll qua PAD thật trước đó. Nếu identity capabilities unavailable thì fail closed. API chỉ thêm fields; không migration. Giữ core-disabled branch ở workers:214 và workflow.requireFace. Tests: approved/enrolled+no Daily online/accept thành công; missing/revoked/changed template fail; inactive/approval/services/GPS/busy/ownership giữ chặn.


## G03 — Shared authorization cho proof, chưa consume ở BEFORE (MODIFY)

**File:** `server/src/modules/workers/face/face-core.service.js:1049`

**CURRENT CODE:**

```js
  async consumeOrder(tx, workerId, orderId, actorId) {
    this.policy();
    const worker = await this.eligibleWorker(tx, workerId);
    const state = await tx.biometricState.findUnique({ where: { workerId } }),
      now = await this.now(tx);
    const template = await this.current(tx, workerId);
    if (!this.consentValid(state) || !template)
      fail('ORDER_FACE_PROOF_REQUIRED');
    const proof = await tx.biometricProof.findFirst({
      where: {
        workerId,
        orderId,
        templateId: template.id,
        templateVersion: template.version,
        modelVersion: template.modelVersion,
        epoch: state.epoch,
        purpose: 'ORDER',
        revokedAt: null,
        consumedAt: null,
        issuedAt: { lte: now },
        expiresAt: { gt: now },
      },
      orderBy: { issuedAt: 'desc' },
    });
    if (!proof) fail('ORDER_FACE_PROOF_REQUIRED');
    // Keep historical order lineage, but never consume for a changed current assignee/stage.
    await this.orderAccess(tx, worker, 'ORDER', orderId);
```


**PROPOSED REPLACEMENT / ADDITIONS:**

```js
// ADD helper. `caps` phải lấy ready() ngoài transaction.
async requireOrderProof(tx, workerId, orderId, caps) {
  this.policy();
  if (!caps?.padEvaluated || !text(caps.padModelVersion, 256) ||
      !caps.identityModelReady || !text(caps.modelVersion, 256))
    fail('PAD_NOT_EVALUATED');
  const worker = await this.eligibleWorker(tx, workerId);
  await this.orderAccess(tx, worker, 'ORDER', orderId);
  const state = await tx.biometricState.findUnique({ where: { workerId } });
  const now = await this.now(tx);
  const template = await this.current(tx, workerId);
  const review = await this.identityReview(tx, workerId, state, template, now);
  if (!this.consentValid(state) || !template || !review ||
      template.modelVersion !== caps.modelVersion)
    fail('ORDER_FACE_PROOF_REQUIRED');
  const proof = await tx.biometricProof.findFirst({
    where: { workerId, orderId, templateId: template.id,
      templateVersion: template.version, modelVersion: template.modelVersion,
      epoch: state.epoch, purpose: 'ORDER', revokedAt: null, consumedAt: null,
      padModelVersion: caps.padModelVersion,
      issuedAt: { lte: now }, expiresAt: { gt: now } },
    orderBy: { issuedAt: 'desc' },
  });
  if (!proof) fail('ORDER_FACE_PROOF_REQUIRED');
  return { proof, now };
}
// REPLACE consumeOrder signature và phần đầu 1049–1075 bằng:
async consumeOrder(tx, workerId, orderId, actorId, caps) {
  const { proof, now } = await this.requireOrderProof(tx, workerId, orderId, caps);
  // KEEP original lines 1076–1103: updateMany count===1, audit, return.
}
```


Đoạn KEEP trong consumeOrder là anchor source:1076, không bỏ conditional update/audit. `ready()` gọi trước transaction, trả caps snapshot; worker/epoch/order/proof được recheck dưới lock sau đó. Model/PAD registry thay đổi sau snapshot không thể được bảo đảm tuyến tính qua hai service; deployment đổi model phải revoke/epoch-fence templates/proofs và drain in-flight requests. Không tuyên bố HTTP capabilities là distributed lock.

Trong `transition()` phải giữ early same-state idempotency **trước mọi yêu cầu proof/ready**: gọi ready trước transaction sẽ làm retry IN_PROGRESS thất bại khi PAD outage. Cách cụ thể: preflight đọc order status chỉ để quyết định có fetch caps, sau đó transaction recheck; nếu preflight thấy IN_PROGRESS mà dưới lock lại ARRIVED thì reject conflict, không skip proof.


**PROPOSED REPLACEMENT / ADDITIONS:**

```js
// transition(): sau faceCaps, trước $transaction:
let startCaps = null;
if (this.faceCore?.enabled() && target === 'IN_PROGRESS') {
  const snapshot = await this.prisma.order.findUnique({
    where: { id: orderId }, select: { status: true },
  });
  if (normalizeOrderStatus(snapshot?.status) !== 'IN_PROGRESS')
    startCaps = await this.faceCore.ready();
}
// existing current===target early return giữ nguyên.
// Trong target===IN_PROGRESS block, trước consume:
if (this.faceCore?.enabled()) {
  if (!startCaps) throw new ConflictException('ORDER_STATE_CONFLICT');
  if (!worker) throw new BadRequestException('ORDER_FACE_PROOF_REQUIRED');
  await this.faceCore.consumeOrder(tx, worker.id, orderId, actor.id, startCaps);
} else this.requireFace(worker);
```


Để UI không unlock bằng proof meta khi blockers hiện có: job phải yêu cầu `face.canVerifyOrder===true` cùng proof predicate. Quyền upload/start vẫn do requireOrderProof, không tin boolean client. Source status canVerifyOrder phản ánh ARRIVED/owner/template/blockers:core:293. Tests phải cập nhật mọi direct consumeOrder call để cấp caps fixture; đó là fixture protocol, không proof thật.


## G04 — Endpoint BEFORE multipart và storage (ADD methods, MODIFY 3 files)

**File:** `server/src/modules/orders/orders.controller.js:340`

**CURRENT CODE:**

```js
   */
  @Post(':id/images')
  @ApiOperation({
    summary:
      'Upload và lưu trữ ảnh minh chứng (ISSUE, BEFORE, AFTER) vào OrderImage',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: UploadOrderImageDto })
  @ApiResponse({ status: 201, description: 'Lưu ảnh minh chứng thành công' })
  @ApiResponse({ status: 400, description: 'Loại ảnh không hợp lệ' })
  @Bind(Req(), Param('id'), Body())
  async uploadImage(req, id, uploadDto) {
    return this.ordersService.uploadImage(id, uploadDto, req.user.userId);
  }
```

**File:** `server/src/modules/orders/orders.service.js:465`

**CURRENT CODE:**

```js
  async uploadImage(orderId, uploadDto, userId) {
    const image = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const actor = await this.orderWorkflowService.actor(tx, userId);
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
      this.orderWorkflowService.authorize(order, actor);
      const permitted = actor.role === 'WORKER'
        ? (uploadDto.type === 'BEFORE' && order.status === 'ARRIVED') || (uploadDto.type === 'AFTER' && order.status === 'IN_PROGRESS')
        : actor.role === 'CUSTOMER' && uploadDto.type === 'ISSUE' && ['CREATED', 'SEARCHING', 'SEARCHING_WORKER'].includes(order.status);
      if (!permitted) throw new ForbiddenException('PHOTO_ACTION_NOT_ALLOWED');
      if (!/^https?:\/\//i.test(uploadDto.url)) throw new BadRequestException('INVALID_PHOTO_URL');
      const existing = await tx.orderImage.findFirst({ where: { orderId, type: uploadDto.type, url: uploadDto.url } });
      if (existing) return existing;
      return tx.orderImage.create({ data: { orderId, type: uploadDto.type, url: uploadDto.url,
        imageUrl: uploadDto.url, imageType: uploadDto.type, uploadedAt: new Date() } });
    });
    return { success: true, image };
  }
```


Tận dụng `cloudinary` export (`server/src/config/cloudinary.config.js:38`) và validation/mapping từ diagnosis (`server/src/modules/orders/diagnosis/diagnosis-upload.interceptor.js:13`, :38). Không dùng workerFaceStorage (sai folder và persistence trước auth). Không gọi API public diagnosis để upload BEFORE. Thêm method vào OrdersService và inject FaceCoreService trực tiếp: ADD import, thêm FaceCoreService cuối @Dependencies/constructor và `this.faceCore=faceCore`; OrdersModule đã import FaceCoreModule nên không cần module/provider mới.


**PROPOSED REPLACEMENT / ADDITIONS:**

```js
// orders.controller.js: ADD import { memoryStorage } from 'multer';
// ADD route trước/near :id/images; JWT/RolesGuard class-level giữ nguyên.
@Post(':id/before-photo')
@Roles('WORKER')
@UseGuards(OrderAccessGuard)
@UseInterceptors(FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
}))
@ApiBody({ schema: { type: 'object', required: ['image'], properties: {
  image: { type: 'string', format: 'binary' },
} } })
@Bind(Req(), Param('id'), UploadedFile())
async beforePhoto(req, id, file) {
  return this.ordersService.uploadBeforePhoto(id, req.user.userId, file);
}
// ADD ApiConsumes import và @ApiConsumes('multipart/form-data') trên route.
```


**PROPOSED REPLACEMENT / ADDITIONS:**

```js
// orders.service.js ADD imports:
import { createHash } from 'crypto';
import { FaceCoreService } from '../workers/face/face-core.service';
import { cloudinary } from '../../config/cloudinary.config';
import { validateDiagnosisImage, mapDiagnosisUploadError }
  from './diagnosis/diagnosis-upload.interceptor';

// ADD method: authorization transaction trước và sau external storage.
async beforeContext(userId, orderId, caps, save) {
  return this.faceCore.workerTx(userId, async (tx, worker) => {
    await this.faceCore.requireOrderProof(tx, worker.id, orderId, caps);
    const arrival = await tx.orderStatusHistory.findFirst({
      where: { orderId, status: 'ARRIVED' }, orderBy: { createdAt: 'asc' },
    });
    if (!arrival) throw new BadRequestException('ARRIVAL_HISTORY_REQUIRED');
    return save ? save(tx, worker, arrival) : { workerId: worker.id, arrivalId: arrival.id };
  });
}
async uploadBeforePhoto(orderId, userId, file) {
  if (!file?.buffer || file.buffer.length > 5 * 1024 * 1024 ||
      !['image/jpeg', 'image/png'].includes(file.mimetype))
    throw new BadRequestException('JPEG_OR_PNG_REQUIRED');
  validateDiagnosisImage(file.buffer, file.mimetype);
  const caps = await this.faceCore.ready(); // no HTTP inside DB tx
  const context = await this.beforeContext(userId, orderId, caps);
  const digest = createHash('sha256').update(file.buffer).digest('hex');
  const metadata = JSON.stringify({ v: 1, kind: 'WORKER_BEFORE',
    workerId: context.workerId, orderId, arrivalId: context.arrivalId, digest });
  // Stable ID: same bytes + worker/order/arrival reuse one stored object.
  const assetId = createHash('sha256').update(metadata).digest('hex');
  const publicId = `fixgo/order-before/${assetId}`;
  let stored;
  try {
    stored = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        public_id: publicId, resource_type: 'image', overwrite: false,
        unique_filename: false, timeout: 15000,
        allowed_formats: ['jpg', 'jpeg', 'png'],
      }, (error, result) => error ? reject(error) : resolve(result));
      stream.on('error', reject);
      stream.end(file.buffer);
    });
  } catch (error) { throw mapDiagnosisUploadError(error); }
  if (stored?.public_id !== publicId || typeof stored.secure_url !== 'string' ||
      !stored.secure_url.startsWith('https://'))
    throw new BadRequestException('STORAGE_RESULT_INVALID');
  const freshCaps = await this.faceCore.ready();
  const image = await this.beforeContext(userId, orderId, freshCaps,
    async (tx, worker, arrival) => {
      if (worker.id !== context.workerId || arrival.id !== context.arrivalId)
        throw new ConflictException('ORDER_STATE_CONFLICT');
      const existing = await tx.orderImage.findFirst({
        where: { orderId, type: 'BEFORE', description: metadata },
      });
      if (existing) return existing;
      return tx.orderImage.create({ data: { orderId, type: 'BEFORE',
        url: stored.secure_url, imageUrl: stored.secure_url, imageType: 'BEFORE',
        description: metadata, uploadedAt: await this.faceCore.now(tx) } });
    });
  return { success: true, image };
}
```


OrderAccessGuard hiện chỉ owner/worker và stage rộng; method beforeContext mới siết ARRIVED/proof. Memory-only multipart nhận bytes sau JWT+OrderAccessGuard; **không persist external storage trước proof auth**. Không gọi guard FaceReadyGuard của session cho order route. Chưa cấp quyền thì có thể nhận tối đa 5MB trong RAM, không lưu cloud. Nếu yêu cầu chặn cả RAM trước body parse thì ADD riêng BeforePhotoReadyGuard (không cần cho policy này).

Storage không cùng ACID transaction với DB: DB failure/expiry sau upload có thể để orphan; không xóa object ngay vì concurrent request có thể đã tham chiếu. ID deterministic cho retry, không duplicate DB rows dưới worker/order lock. Cần verify Cloudinary `overwrite:false` trả existing asset cùng public_id/secure_url khi request trùng; nếu provider báo conflict thay vì trả asset, cần lookup publicId trong adapter dưới credentials server, kiểm exact ID/resource_type rồi dùng URL trả về. **NEEDS_VERIFICATION storage integration**; không tuyên bố upload thực đã chạy. Cleanup retention ngoài luồng request theo orphan reference check; không kéo cleanup thành P0 mới.

API mới chỉ BEFORE; không sửa storage config hoặc AFTER. Security/API change: không nhận URL/worker/order/proof token do body chọn, actor từ JWT, order từ route, proof từ DB. Tests pre-storage reject wrong owner/stage/PAD/no proof; concurrent same bytes one OrderImage; MIME spoof, overlimit, storage timeout; post-storage revocation không ghi ảnh/start.


## G05/G06 — Chặn JSON BEFORE và kiểm provenance trước start (MODIFY)


**PROPOSED REPLACEMENT / ADDITIONS:**

```js
// orders.service.uploadImage(): ADD trước transaction; ISSUE/AFTER phần còn lại KEEP.
if (uploadDto.type === 'BEFORE')
  throw new BadRequestException('BEFORE_MULTIPART_REQUIRED');
```

**File:** `server/src/modules/orders/order-workflow.service.js:209`

**CURRENT CODE:**

```js
        // Legacy customer uploads lack trustworthy worker provenance: require a BEFORE recorded after arrival.
        const arrival = await tx.orderStatusHistory.findFirst({
          where: { orderId, status: 'ARRIVED' },
          orderBy: { createdAt: 'asc' },
        });
        if (
          !arrival ||
          !order.images.some(
            (image) =>
              image.type === 'BEFORE' && image.uploadedAt >= arrival.createdAt,
          )
        ) {
          throw new BadRequestException('MISSING_BEFORE_PHOTO');
        }
        const quote = await tx.orderStatusHistory.findFirst({
```


**PROPOSED REPLACEMENT / ADDITIONS:**

```js
// REPLACE current arrival/BEFORE block. Với đề xuất mới chuyển block này
// lên ngay trước consumeOrder trong target IN_PROGRESS; vẫn cùng transaction.
const arrival = await tx.orderStatusHistory.findFirst({
  where: { orderId, status: 'ARRIVED' }, orderBy: { createdAt: 'asc' },
});
const hasBefore = arrival && order.images.some(image => {
  if (image.type !== 'BEFORE' || image.uploadedAt < arrival.createdAt) return false;
  try {
    const m = JSON.parse(image.description || 'null');
    return m?.v === 1 && m.kind === 'WORKER_BEFORE' &&
      m.workerId === order.workerId && m.orderId === orderId &&
      m.arrivalId === arrival.id && /^[a-f0-9]{64}$/.test(m.digest);
  } catch (_) { return false; }
});
if (!hasBefore) throw new BadRequestException('MISSING_BEFORE_PHOTO');
// Sau đó consumeOrder(..., startCaps), quote checks, startedAt, update/history KEEP.
```


Ảnh legacy chỉ timestamp không được tính trusted BEFORE; cần upload lại ở ARRIVED với proof. Không migration/backfill giả provenance. metadata không nhận từ upload DTO; generic JSON endpoint bị chặn BEFORE. Quyền direct SQL của admin/DB ngoài threat model API; không gọi description là tamper-proof FK. IN_PROGRESS early same-state return trước check này giữ retry không scan/consume lần hai. Test rollback quote/DB conflict vẫn phải undo consumedAt/audit/history.

## G07 — Bỏ Daily UI gate và điều hướng enrollment (MODIFY)

Callers dashboard/profile/login/job giữ cùng route; route không order mặc định quản lý enrollment. Giữ hook default daily cho compatibility caller/test cũ, nhưng target screen luôn truyền explicit mode. Không còn target UI tạo DAILY session. Enrollment là registration, không unlock BEFORE khi chưa ORDER proof.

**File:** `worker-app/app/(worker)/(tabs)/index.jsx:31`

**CURRENT CODE:**

```jsx
  const loadProfile = useCallback(async () => {
    const response = await apiClient.get('/workers/me');
    const profile = response.data || response;
    try {
      const statusResponse = await apiClient.get('/workers/me/face/status');
      const status = statusResponse.data || statusResponse;
      return { ...profile, dailyProof: status.dailyProof || null };
    } catch (_) { return { ...profile, dailyProof: null }; }
  }, []);
```

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
// loadProfile(): REPLACE return/catch bên trong try:
return { ...profile, face: status };
// catch: fail closed UI availability, không cấp quyền nếu status lỗi.
// return { ...profile, face: null };
// import: thay hasShiftVerification bằng hasEnrollmentReadiness.
// workerEligibility.js ADD (giữ legacy helper cho compatibility):
export function hasEnrollmentReadiness(profile) {
  return profile?.face?.canReceiveOrders === true;
}
```

**File:** `worker-app/app/(worker)/(tabs)/index.jsx:63`

**CURRENT CODE:**

```jsx
      if (online) {
        if (activeLoading || activeError || activeOrder) throw new Error('Cần hoàn tất hoặc kiểm tra công việc hiện tại trước khi nhận đơn mới');
        const profile = await loadProfile();
        const restriction = profileRestriction(profile);
        if (restriction) throw new Error(restriction);
        if (!hasShiftVerification(profile)) {
          setShowDailyCheckIn(true);
          return;
        }
      }
```

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
// REPLACE inner hasShiftVerification block, mọi restriction/GPS/ACK giữ:
if (!hasEnrollmentReadiness(profile)) {
  setShowDailyCheckIn(true); // rename state + setters toàn file thành showFaceSetup
  return;
}
// REPLACE dailyCheckIn body (rename function openFaceSetup, update caller):
const openFaceSetup = () => {
  setShowFaceSetup(false);
  router.push({ pathname: '/(worker)/verification/face',
    params: { mode: 'enrollment' } });
};
// Modal title: 'Cần hoàn tất đăng ký khuôn mặt'
// Modal message: 'Đăng ký một lần trước khi bật nhận đơn. Xác thực từng đơn khi đã đến nơi.'
// Banner line 227: hasEnrollmentReadiness(profile), text:
// 'Đăng ký khuôn mặt đã sẵn sàng. Bật công tắc để nhận đơn.'
// Remove target import/calls hasShiftVerification. Rename state in ALL JSX handlers.
```

**File:** `worker-app/app/(worker)/verification/face.jsx:10`

**CURRENT CODE:**

```jsx
  const { orderId, mode: requestedMode } = useLocalSearchParams();
  const mode = ['enrollment', 'reset'].includes(requestedMode) ? requestedMode : 'daily';
  const [consent, setConsent] = useState(false);
  const flow = useFaceVerification(orderId, undefined, mode, { embeddedCamera: true });
  const registration = mode !== 'daily';
  const canCapture = mode === 'enrollment' ? flow.status?.canEnroll : mode === 'reset' ? false : orderId ? flow.status?.canVerifyOrder : flow.status?.canVerifyDaily;
  const title = mode === 'reset' ? 'Cấp lại đăng ký khuôn mặt' : mode === 'enrollment' ? 'Đăng ký khuôn mặt' : orderId ? 'Xác thực trước công việc' : 'Check-in đầu ca';
  const leave = () => { flow.cancel(); router.back(); };
  const navigate = next => { flow.cancel(); setConsent(false); router.replace({ pathname: '/(worker)/verification/face', params: { mode: next } }); };
  return (
    <ScrollView nativeID="face-screen-container" contentContainerStyle={styles.container}>
```

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
const routerParams = useLocalSearchParams();
const orderId = typeof routerParams.orderId === 'string' && routerParams.orderId
  ? routerParams.orderId : undefined;
const requestedMode = typeof routerParams.mode === 'string' ? routerParams.mode : undefined;
// order context chỉ ORDER khi mode không enrollment/reset.
const mode = requestedMode === 'reset' ? 'reset'
  : requestedMode === 'enrollment' ? 'enrollment'
  : orderId ? 'order' : 'enrollment';
const [consent, setConsent] = useState(false);
const flow = useFaceVerification(orderId, undefined, mode, { embeddedCamera: true });
const registration = mode === 'enrollment' || mode === 'reset';
const canCapture = mode === 'enrollment' ? flow.status?.canEnroll
  : mode === 'order' ? flow.status?.canVerifyOrder : false;
const title = mode === 'reset' ? 'Cấp lại đăng ký khuôn mặt'
  : mode === 'order' ? 'Xác thực trước công việc' : 'Đăng ký khuôn mặt';
const leave = () => { flow.cancel(); router.back(); };
const navigate = next => {
  flow.cancel(); setConsent(false);
  router.replace({ pathname: '/(worker)/verification/face',
    params: { mode: next, ...(orderId ? { orderId } : {}) } });
};
const finishFlow = () => {
  flow.cancel();
  if (orderId) router.replace({ pathname: '/(worker)/job/[id]', params: { id: orderId } });
  else router.replace('/(worker)/(tabs)');
};
```

**File:** `worker-app/app/(worker)/verification/face.jsx:60`

**CURRENT CODE:**

```jsx
      <VerificationResultModal visible={flow.showModal} result={flow.result} onClose={flow.result?.enrolled ? () => navigate('daily') : flow.result?.verified ? leave : flow.reset} onRetry={flow.reset} successLabel={flow.result?.enrolled ? 'Tiếp tục xác thực đầu ca' : 'Hoàn tất'} />
```

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
<VerificationResultModal visible={flow.showModal} result={flow.result}
  onClose={flow.result?.enrolled || flow.result?.verified ? finishFlow : flow.reset}
  onRetry={flow.reset}
  successLabel={flow.result?.enrolled ? 'Tiếp tục' : 'Về công việc'} />
// hook useFaceVerification.js:130 replace ONLY result.message:
// 'Đã lưu đăng ký khuôn mặt. Bạn xác thực riêng cho từng đơn khi đã đến nơi.'
```

Hook đang chọn purpose theo enrollment/orderId, nên explicit mode order không cần sửa issuer. Enrollment với orderId vẫn GET status scoped, create ENROLLMENT không gửi orderId. Reset/review/consent vẫn original protocol; finish enrollment về job chưa tự tạo ORDER proof. Nếu deep link ARRIVED đã có proof hợp lệ, job hiển thị BEFORE và không ép scan lại.

Tests G07: enroll success không POST Daily; direct screen không order không Daily; array params không được dùng làm orderId; reset/enrollment preserve order; back sau verification về đúng id và job refetch; dashboard chưa load status không online.

## G08/G09 — BEFORE camera, API method và job recovery (ADD/MODIFY)

**File:** `worker-app/src/services/api/orderService.js:76`

**CURRENT CODE:**

```jsx
   * 7. Upload ảnh BEFORE / AFTER (POST /orders/:id/images)
   */
  async uploadImage(orderId, payload) {
    return apiClient.post(`/orders/${orderId}/images`, payload);
  },
```

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
// ADD sibling method; giữ uploadImage cho ISSUE/AFTER.
async uploadBeforePhoto(orderId, uri, signal) {
  const body = new FormData();
  if (uri.startsWith('blob:') || uri.startsWith('data:'))
    body.append('image', await (await fetch(uri)).blob(), 'before.jpg');
  else if (/^(file|content):/.test(uri))
    body.append('image', { uri, name: 'before.jpg', type: 'image/jpeg' });
  else throw new Error('LOCAL_CAPTURE_REQUIRED');
  return apiClient.post(`/orders/${encodeURIComponent(orderId)}/before-photo`, body,
    { signal, timeout: 30000, headers: { 'Content-Type': 'multipart/form-data' } });
},
```

**ADD file:** `worker-app/src/features/orders/components/BeforePhotoCapture.jsx` (chưa có file hiện tại). Dùng camera hiện trường phía sau, không áp ML Kit face gating cho đồ vật. CameraView embedded tránh AppState foreground của external ImagePicker làm recovery unmount màn khi camera ngoài còn mở. Cho retry upload cùng URI, không chuyển IN_PROGRESS trong component.

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { orderService } from '../../../services/api/orderService';
import { deleteCaptureFile } from '../../face-verification/utils/captureFiles';

export function BeforePhotoCapture({ orderId, enabled, onSaved }) {
  const camera = useRef(null), uriRef = useRef(null), lock = useRef(false);
  const alive = useRef(true), request = useRef(null);
  const [permission, askPermission] = useCameraPermissions();
  const [open, setOpen] = useState(false), [ready, setReady] = useState(false);
  const [uri, setUri] = useState(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { alive.current = true; return () => {
    alive.current = false; request.current?.abort();
    void deleteCaptureFile(uriRef.current);
  }; }, []);
  const capture = async () => {
    if (!enabled || !ready || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const photo = await camera.current.takePictureAsync({ quality: .85, skipProcessing: false });
      if (!alive.current) { await deleteCaptureFile(photo.uri); return; }
      await deleteCaptureFile(uriRef.current);
      uriRef.current = photo.uri; setUri(photo.uri); setOpen(false); setReady(false);
    } catch (_) { if (alive.current) setError('Chưa chụp được ảnh. Vui lòng thử lại.'); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const upload = async () => {
    if (!enabled || !uriRef.current || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await orderService.uploadBeforePhoto(orderId, uriRef.current, controller.signal);
      if (!alive.current) return;
      const image = response.image;
      if (!response.success || image?.orderId !== orderId || image.type !== 'BEFORE')
        throw new Error('Máy chủ chưa xác nhận ảnh BEFORE');
      await deleteCaptureFile(uriRef.current); uriRef.current = null; setUri(null);
      await onSaved(); // parent refetch order+proof; không local flag hasBefore=true
    } catch (error) {
      if (alive.current && !controller.signal.aborted)
        setError(error.message || 'Upload chưa thành công. Thử lại hoặc tải lại trạng thái.');
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  return <View>
    <TouchableOpacity disabled={!enabled || busy} onPress={() => {
      setReady(false); setOpen(true); setError('');
    }}><Text>{uri ? 'Chụp lại ảnh BEFORE' : 'Chụp ảnh BEFORE'}</Text></TouchableOpacity>
    {uri ? <><Image source={{ uri }} style={{ width: 200, height: 160 }} />
      <TouchableOpacity disabled={!enabled || busy} onPress={upload}><Text>Lưu ảnh BEFORE</Text></TouchableOpacity></> : null}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    <Modal visible={open && enabled} onRequestClose={() => setOpen(false)}>
      <TouchableOpacity onPress={() => setOpen(false)}><Text>Đóng</Text></TouchableOpacity>
      {!permission?.granted ? <TouchableOpacity onPress={async () => {
        try {
          if (permission?.canAskAgain === false) await Linking.openSettings();
          else await askPermission();
        } catch (_) { setError('Chưa cấp được quyền camera.'); }
      }}><Text>Cho phép camera</Text></TouchableOpacity> : open && enabled ?
        <CameraView ref={camera} facing="back" mode="picture" style={{ flex: 1 }}
          onCameraReady={() => setReady(true)}
          onMountError={() => { setReady(false); setError('Không mở được camera.'); }} /> : null}
      <TouchableOpacity disabled={!ready || !enabled || busy} onPress={capture}><Text>Chụp BEFORE</Text></TouchableOpacity>
      {error ? <Text>{error}</Text> : null}
    </Modal>
  </View>;
}
```

Component là baseline functional, không đổi design system. Android development build và Expo web CameraView bytes phải kiểm trên runtime thật; nếu platform web không xuất capture URI theo contract thì `NEEDS_VERIFICATION` tại expo-camera implementation, tách .web component sau khi kiểm. Không giả lập lưu ảnh bằng file:// URL vào JSON API. Không đưa runtime test đó thành điều kiện sửa model.

**File:** `worker-app/app/(worker)/job/[id].jsx:20`

**CURRENT CODE:**

```jsx
  const load = useCallback(async () => {
    if (typeof id !== 'string' || !id) throw new Error('Thiếu mã đơn hàng');
    const [order, profile, statusResponse] = await Promise.all([orderService.getOrderById(id), apiClient.get('/workers/me'), apiClient.get('/workers/me/face/status', { params: { orderId: id } }).catch(() => null)]);
    return { order, profile, face: statusResponse?.data || statusResponse };
  }, [id]);
  const { data, loading, error: loadError, reload } = useOrderRecovery(load, `${user?.id}:${id}`);
  const order = data?.order;
  const jobStatus = order?.status;
  const isFaceChecked = isCurrentFaceProof(data?.face?.orderProof, 'ORDER', id);
```

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
// ADD useEffect import và BeforePhotoCapture import.
const load = useCallback(async () => {
  if (typeof id !== 'string' || !id) throw new Error('Thiếu mã đơn hàng');
  const order = await orderService.getOrderById(id);
  if (order.status !== 'ARRIVED') return { order, face: null, faceError: '' };
  try {
    const response = await apiClient.get('/workers/me/face/status', { params: { orderId: id } });
    return { order, face: response.data || response, faceError: '' };
  } catch (_) { return { order, face: null, faceError: 'Chưa tải được FaceID. Tải lại trước khi tiếp tục.' }; }
}, [id]);
// useOrderRecovery giữ original, rồi replace isFaceChecked:
const [now, setNow] = useState(Date.now());
useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(timer); }, []);
const isFaceChecked = data?.face?.canVerifyOrder === true &&
  isCurrentFaceProof(data.face.orderProof, 'ORDER', id, now);
const arrival = order?.statusHistory?.filter(h => h.status === 'ARRIVED')
  .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))[0];
const hasBefore = !!arrival && !!order?.images?.some(image => {
  if (image.type !== 'BEFORE' || Date.parse(image.uploadedAt) < Date.parse(arrival.createdAt)) return false;
  try { const m = JSON.parse(image.description || 'null');
    return m?.v === 1 && m.kind === 'WORKER_BEFORE' && m.orderId === id &&
      m.workerId === order.workerId && m.arrivalId === arrival.id && /^[a-f0-9]{64}$/.test(m.digest);
  } catch (_) { return false; }
});
// ADD synchronous lock; changeStage first line replaces pending check:
const mutationLock = useRef(false);
// inside changeStage:
// if (mutationLock.current) return false;
// mutationLock.current = true; setPending(true);
// finally { mutationLock.current = false; setPending(false); }
```

**File:** `worker-app/app/(worker)/job/[id].jsx:144`

**CURRENT CODE:**

```jsx

        {jobStatus === 'ARRIVED' && (
          <TouchableOpacity nativeID="worker-job-start-button" accessibilityRole="button" style={styles.btnPrimary} disabled={pending || !isFaceChecked} onPress={() => changeStage('IN_PROGRESS')}>
            <Text style={styles.btnText}>{isFaceChecked ? 'BẮT ĐẦU CÔNG VIỆC' : 'CHỜ XÁC THỰC THEO ĐƠN'}</Text>
          </TouchableOpacity>
        )}
```

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
{jobStatus === 'ARRIVED' ? <View>
  {data?.faceError ? <Text accessibilityRole="alert">{data.faceError}</Text> : null}
  <TouchableOpacity onPress={reload} disabled={pending}><Text>Tải lại trạng thái</Text></TouchableOpacity>
  {!hasBefore && isFaceChecked ? <BeforePhotoCapture key={`${user?.id}:${id}`}
    orderId={id} enabled={isFaceChecked && !pending} onSaved={reload} /> : null}
  {hasBefore ? <Text>Máy chủ đã lưu ảnh BEFORE.</Text> : null}
  <TouchableOpacity nativeID="worker-job-start-button" accessibilityRole="button"
    style={styles.btnPrimary} disabled={pending || !isFaceChecked || !hasBefore}
    onPress={() => changeStage('IN_PROGRESS')}>
    <Text style={styles.btnText}>{!isFaceChecked ? 'CHỜ XÁC THỰC THEO ĐƠN'
      : !hasBefore ? 'CHỜ ẢNH BEFORE' : 'BẮT ĐẦU CÔNG VIỆC'}</Text>
  </TouchableOpacity>
</View> : null}
// KEEP existing ARRIVED scan button, thêm params mode:'order'.
// KEEP IN_PROGRESS branch không scan. changeStage catch đã reload server.
```

Recovery: focus/foreground/reconnect dùng useOrderRecovery hiện có. Khi upload thành công mà ACK mất, bấm tải lại để thấy ảnh trong order; không tự set local hasBefore. Khi start ACK mất, refetch IN_PROGRESS và không scan lại. Khi proof expiry trong lúc không render, timer vô hiệu hóa BEFORE/start, backend vẫn quyết định nếu tap đua timer. Có thể upload lại cùng bytes an toàn; DB không unique URL nhưng serialized row locks + metadata lookup chống duplicate.

Không tự refetch mỗi giây (timer chỉ cập nhật clock). Khi app background, session/capture có thể bị bỏ; proof và ảnh lưu trên backend còn nguyên. Không persist biometric nonce/URI/proof vào AsyncStorage. Đây là tradeoff recovery an toàn; không hứa resume ảnh local sau process kill.

Tests: proof còn hạn không scan lại; missing proof/capability không camera/upload/start; proof expire timer chặn; BEFORE ACK rồi refetch; start quote lỗi giữ ảnh/proof chưa consume; start retry chỉ một history/event; status offline hiển thị retry, IN_PROGRESS không gọi FaceID gate.

## G10 — Summary/Card/Prompt bỏ Daily wording (MODIFY)

**File:** `worker-app/src/features/face-verification/utils/faceStatus.js:39`

**CURRENT CODE:**

```jsx
  const enrolled = status.enrollmentStatus === "ENROLLED";
  if (
    enrolled &&
    status.canVerifyDaily &&
    isCurrentFaceProof(status.dailyProof, "DAILY", null, now)
  )
    return {
      title: "Đã xác thực đầu ca",
      message:
        "Bằng chứng xác thực còn hiệu lực. Không cần quét lại khi mở app.",
      action: "Quản lý FaceID",
      mode: "daily",
      tone: "success",
      valid: true,
    };
```

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
// REPLACE faceSummary() toàn thân; FACE_BLOCKERS và faceExpiry export KEEP.
export function faceSummary(status, profile) {
  if (!status) return { title: 'Chưa tải được FaceID', message: 'Kiểm tra kết nối và thử lại.',
    action: 'Kiểm tra lại', mode: null, tone: 'warning' };
  if (profile && profile.approvalStatus !== 'APPROVED')
    return { title: 'Hoàn thiện hồ sơ', message: 'Hồ sơ cần được duyệt trước khi đăng ký khuôn mặt.',
      action: 'Xem điều kiện FaceID', mode: 'enrollment', tone: 'warning' };
  if (status.canReceiveOrders === true)
    return { title: 'Đã đăng ký khuôn mặt', message: 'Xác thực riêng cho từng đơn khi đã đến nơi.',
      action: 'Quản lý FaceID', mode: 'enrollment', tone: 'success', valid: true };
  if (status.reviewRequestSubmitted)
    return { title: 'Đang chờ kiểm tra danh tính', message: 'Yêu cầu kiểm tra đã được gửi.',
      action: 'Xem FaceID', mode: 'enrollment', tone: 'warning' };
  const codes = status.receiveBlockers || status.blockers || [];
  return { title: status.enrollmentStatus === 'ENROLLED' ? 'Cần kiểm tra đăng ký khuôn mặt'
      : status.enrollmentStatus === 'WITHDRAWN' ? 'Cần đăng ký lại khuôn mặt' : 'Chưa đăng ký khuôn mặt',
    message: codes.map(code => FACE_BLOCKERS[code]).filter(Boolean).join('\n')
      || 'Mở FaceID để xem điều kiện đăng ký.',
    action: status.canEnroll ? 'Đăng ký khuôn mặt' : 'Thiết lập FaceID',
    mode: 'enrollment', tone: 'warning' };
}
// facePrompt(): KEEP; summary.valid (enrolled eligibility) không prompt lại.
// ADD FACE_BLOCKERS:
// TRUSTED_TEMPLATE_REQUIRED: 'Cần đăng ký mẫu khuôn mặt hợp lệ.',
// IDENTITY_REVIEW_WINDOW_EXPIRED: 'Cần hỗ trợ kiểm tra lại quyền xác thực khuôn mặt.',
```

**File:** `worker-app/src/features/face-verification/components/FaceIdentityCard.jsx:39`

**CURRENT CODE:**

```jsx
          <View style={s.skeleton} />
```

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
// FaceIdentityCard: thay subtitle bằng:
<Text style={s.subtitle}>Đăng ký một lần · xác thực từng đơn</Text>
// REMOVE UI block {valid && (... faceExpiry(status.dailyProof) ...)}.
// Remove faceExpiry import, keep faceSummary; timer có thể KEEP (không security risk).
// FaceLoginPrompt note replace text:
// 'Đăng ký khuôn mặt trước khi bật nhận đơn. Xác thực riêng cho từng công việc khi đã đến nơi.'
// Không đổi sessionEpoch/abort/navigation suppression.
```

API/DB: summary dùng additive fields mới, không schema. Backward server thiếu canReceiveOrders thì UI fail closed; không dùng legacy Daily để suy ra eligibility. Tests faceStatus/LoginPrompt/Card cập nhật expected copy, assert enrolled không prompt Daily.

## B01/B02 — Không bịa replacement cho policy chưa được phê duyệt

**B01 KEEP** `ai-service/pad_policy.py:36`, `server/src/modules/workers/face/face-evidence.gateway.js:5`: registry rỗng là blocker thật. Không thêm test reference/synthetic PASS vào runtime registry. Để triển khai thật cần evaluated dataset/protocol/report/hash/approval, same version/reference ở Python/Nest, storage/consent approval và keys. Không đủ dữ liệu để viết approval entry: **NEEDS_VERIFICATION** external evidence.

**B02 NEEDS_VERIFICATION**, KEEP SQL. Để phản ánh DB restrictive policy hiện hữu trước khi quyết định đổi lifetime, thêm precheck cụ thể sau `if (!review)` ở core.createSession:613:

**PROPOSED REPLACEMENT / ADDITIONS:**

```jsx
if (review.expiresAt <= now) fail('IDENTITY_REVIEW_WINDOW_EXPIRED');
// status(): khi template/review đã có, trước return:
if (review && review.expiresAt <= now)
  blockers.push('IDENTITY_REVIEW_WINDOW_EXPIRED');
// receiveBlockers không cần expiry cho mẫu tồn tại: không scan khi online/accept.
// canVerifyOrder/canVerifyDaily trở false vì blockers; DB session insert rule KEEP.
```

Đây là guard conservative phù hợp trigger, không tự thay consent/review/template. Chưa giải quyết khả năng tiếp tục xác thực sau review expiry mà không re-enroll: cần Product/Security xác định expiry là cửa sổ enroll hay verification authorization. Nếu chỉ enroll window, sửa trigger bằng migration mới (không sửa migration lịch sử); chưa có code SQL đề xuất/không tính vào no-migration implementation baseline. Cần đọc tiếp `biometric_validate_session_insert` và test với review hết hạn trên DB isolated. Không báo generic SQL error như FACE_PASS.

## Hành động file và tính khả thi

MODIFY tối thiểu: core service; workers service; workflow; orders service/controller; dashboard; face screen; face hook (message); workerEligibility; job; orderService; faceStatus; FaceIdentityCard; FaceLoginPrompt. ADD: BeforePhotoCapture component, tests mới nếu tách suites. KEEP schema/SQL/model/threshold/crypto/gateway/controller Face Core/guards/camera/recovery/hooks còn lại. REMOVE file: **không có**; chỉ bỏ Daily call sites/copy trên target path, giữ legacy APIs fail closed.

Cần **1 API mới** POST /api/orders/:id/before-photo; status fields additive, JSON BEFORE behavior intentionally tightened. Không cần migration cho baseline; B02 policy nếu đổi trigger là nhánh riêng chưa chốt. Cần đổi mobile navigation và thêm BEFORE camera; không cần sửa Customer/Admin, FSM enum hoặc payment. Không phụ thuộc agent khác ngoài shared contract G02/G04/provenance phải chốt trước. Backward compatibility: old Worker Daily UX không đủ dùng với new BEFORE contract; rollout phối hợp, không fallback bypass.

Đề xuất chưa compile/test như code triển khai. Storage conflict handling, web CameraView/runtime và review lifetime là verification items cụ thể, không được ghi là đã hoàn tất. Backend owner phải chạy protocol/concurrency tests trước handoff; mock PASS chỉ nằm fixture isolated.
