# Worker guide and Android QA — ANDROID PENDING

## Current user flow

Worker Home → bật nhận đơn → Kiểm tra xác thực khuôn mặt → màn Check-in đầu ca.
Direct route /(worker)/verification/face?orderId=... displays per-order context.
Đăng ký lần đầu opens enrollment; Cần cấp lại đăng ký opens reset preflight.
Status comes from GET /workers/me/face/status; consent checkbox is required for
preflight. accepted=false is shown as not submitted, never enrollment success.
Không chọn ảnh thư viện. Không chụp/tải ảnh khi tính năng đang bị khóa.
Kiểm tra lại trạng thái retries network/status; Quay lại cancels/aborts pending work.
Foreground restoration refetches status; no image, local verified flag or proof is
persisted to AsyncStorage. Home never trusts a legacy faceVerifiedAt timestamp.

There is deliberately no enrollment/check-in/start success path in this release.
Neither worker approval nor a manually added FaceProfile can enable it. Support must
explain prerequisites rather than advise using an avatar or bypassing the gate.

## Device checklist (not executed)

- [ ] Isolated Android debug build, test accounts; no production worker data.
- [ ] TalkBack announces heading, pending/error and checkbox; large font/scroll supported.
- [ ] Home/daily/order/enrollment/reset show correct context; order not switched by retry.
- [ ] Offline/reconnect, cancellation, app background/kill/relaunch do not restore success.
- [ ] Account switch cannot show previous account image/proof; no biometric data in logs.
- [ ] Back button/dismiss modal leaves retry available; no stuck spinner.
- [ ] Camera does not open while capture blocked; no cloud upload occurs.
- [ ] After separately approved feature enablement: permission denied/permanent denial,
      camera cancellation, low light/blur/crop/multiple faces/occlusion and retry feedback.
- [ ] Approved consented genuine/impostor and print/screen/video PAD protocol, separately
      report device/attack errors and camera injection limitations.
- [ ] After database implementation: simultaneous start requests, duplicate requests,
      reset during inference, old nonce, stale proof, other worker/order and proof reuse.
- [ ] Explicit expiry and support path; manual review never grants live proof automatically.

Jest tests are not Android device validation. No Android or biometric security PASS.
