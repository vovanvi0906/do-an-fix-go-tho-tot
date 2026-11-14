# AI-FACE-LAB-02: Worker FaceID — báo cáo cuối

- Branch `feature/worker-faceid-lab` · baseline `f6534d6` · 2026-11-14 · **chưa commit**, không push/merge/reset.
- Kế thừa: [faceid-lab-report.md](faceid-lab-report.md) (AI-FACE-LAB-01). Protocol: [faceid-pad-evaluation-protocol.md](faceid-pad-evaluation-protocol.md).

## Kết luận

| Phạm vi | Trạng thái |
|---|---|
| **FaceID Lab (development tooling)** | **`READY_WITH_DOCUMENTED_LIMITATIONS`**. Chạy trên Chromium thật (desktop + mobile), backend thật, 0 regression, mọi gate vẫn fail closed |
| **FaceID production** (enrollment → daily → order proof) | **`NOT_READY`**: **BLOCKED_DATA + BLOCKED_APPROVAL**. Chưa có đánh giá PAD (print/screen/replay), chưa calibration SFace, chưa phê duyệt data policy |
| `READY_TO_MERGE` cho FaceID đầy đủ | **Không đạt.** Thiếu 4/14 điều kiện Definition of Done (§14) |

Không có PASS giả, không cờ bypass, không hạ ngưỡng, không đổi quyền, không đụng DB dự án.

## 1. Kiến trúc và pipeline FaceID

```
Browser (ai-faceid-lab :5199, Vite proxy, loopback)
 ├─ /face-research ─► Research Nest :3107 ─► FastAPI (container --network internal, read-only)
 │                     JWT research riêng       decode → YuNet → quality → crop128 → MN3 → PadDecisionGate
 │                     PG tạm (face_research)   SFace align/feature/cosine (embedding không rời process)
 └─ /api ──────────► Face Core Nest :3118 (lab-stack) hoặc main server
                       JwtStrategy THẬT → RolesGuard(WORKER) → FaceCoreService → FaceEvidenceGateway
                       ready(): data policy → keys → PAD (padEvaluated=false ⇒ dừng)
                       session/nonce(HMAC)/attempts → evidence binding → proof → consume (Order FSM)
```

Debug Timeline có **10 stage**: Auth → Session → Camera → Image validation → Detection → Quality → PAD → Matching → Policy → Proof. Mỗi stage có status, mã lỗi, lý do, latency, `ref` (8 ký tự đầu của session id hoặc HTTP status), model version rút gọn và policy (ngưỡng, `evaluated=false`, policy version). Khi Face Core từ chối ở gate đầu tiên, các blocker khác từ `status` cũng được hiển thị, ví dụ PAD vẫn `NOT_EVALUATED`.

**Mới ở LAB-02:** `server/scripts/face-lab/lab-stack.cjs` dựng toàn bộ stack cô lập do một PID sở hữu: FastAPI với YuNet/SFace/MN3 thật, PostgreSQL tạm, research Nest :3107 và Face Core Nest :3118. Face Core dùng **`JwtStrategy` production** (secret ngẫu nhiên trong tiến trình), `RolesGuard`, `FaceCoreService` và `FaceEvidenceGateway` thật. Fixture tổng hợp gồm 2 worker, đơn ARRIVED, đơn của worker khác và đơn chưa ARRIVED. Cổng được kiểm tra trước khi bind.

## 2. Hiện trạng và yêu cầu production

| Yêu cầu | Hiện trạng | Bằng chứng |
|---|---|---|
| Browser UI thật | **PASS** | Playwright 22/22, Chromium 1255 |
| YuNet/SFace inference thật | **PASS** (synthetic: NO_FACE, feature 128-d, cosine) | Smoke, E2E |
| PAD inference thật | **PASS (chỉ đo)** | MN3 smoke, benchmark |
| PAD evaluated/approved | **BLOCKED_DATA** | Registry rỗng, `padEvaluationStatus=PAD_BLOCKED_DATA` |
| Enrollment thành công thật | **BLOCKED** | `BIOMETRIC_DATA_POLICY_NOT_APPROVED`, rồi `PAD_NOT_EVALUATED`; `/ai/face-enroll` không trả embedding |
| Daily/Order proof thật | **BLOCKED** | Như trên. Logic proof chỉ được kiểm bằng evidence stub trong integration test |
| Replay / sai worker / sai order bị từ chối | **PASS** | §10 |
| Spoof bị từ chối | **NOT_RUN** (cần dữ liệu) | Protocol §2 |
| Calibration ngưỡng matching | **BLOCKED_DATA** | Giữ 0.60 PROVISIONAL |

## 3. PAD model và provider

| Mục | Giá trị (đã kiểm) |
|---|---|
| Artifact | OMZ `public/2022.1/anti-spoof-mn3/anti-spoof-mn3.onnx`, 12.270.179 byte |
| SHA-256 | `c4c99af04603b62d7e44f6f4daeb33e0daeccc696008c0b1d62f6f5cebbb3262` (kiểm khi load, parse từ chính bytes đã kiểm) |
| Version | `experimental:anti-spoof-mn3:<sha256>` |
| Input | 1×3×128×128 float32 NCHW; nhận crop BGR uint8 128×128 → RGB → (x − mean[151.24, 119.60, 107.84]) / scale[63.01, 56.46, 55.00] (`bgr-u8-128-to-rgb-nchw-normalized-v1`) |
| Crop | bbox YuNet sát mặt, floor/ceil, clamp, resize linear 128 (`yunet-tight-bbox-…-v1`). **Chưa xác minh khớp crop lúc train upstream**, rủi ro lệch domain |
| Output | [1,2] softmax; **0 = real, 1 = spoof** (hợp đồng nguồn); kiểm finite, khoảng [0,1], tổng ≈ 1 |
| Latency (synthetic, 2 thread) | p50 2,25 ms / p95 3,86 ms; load + compile ≈ 244 ms (benchmark 2026-11-13, OpenVINO 2026.4.1, parity với ONNX Runtime ≤ 5,4e-7) |
| Failure | missing/checksum/preprocess/output/timeout (provider bị khóa sau timeout)/busy → INCONCLUSIVE |
| Phân tách | **Model output** (real/spoof) ≠ **threshold decision** (chỉ khi có record) ≠ **policy approval** (`approval_reference` + role) |
| Gate (`pad_policy.py`) | Không có record → `PAD_BLOCKED_DATA`. Evidence đạt nhưng thiếu phê duyệt → `PAD_BLOCKED_APPROVAL`. Evidence kém → `PAD_EVALUATION_REJECTED:<lý do>`. Lệch artifact/version → `PAD_EVALUATION_VERSION_MISMATCH` |
| Ràng buộc capture | Camera trước, không gallery/upload file; `getUserMedia` cần origin an toàn; frame JPEG trong bộ nhớ |

## 4. Protocol đánh giá PAD

Xem [faceid-pad-evaluation-protocol.md](faceid-pad-evaluation-protocol.md):

- 12 kịch bản: G1–G5 bona fide theo ánh sáng/blur/che mặt; A1 print, A2 screen, A3 video replay; N1–N4 nhiều mặt, không mặt, camera, timeout.
- Manifest không chứa PII ([template](faceid-dataset-manifest.template.json)); split calibration/evaluation không trùng subject.
- Mục tiêu và mức tối thiểu đề xuất, đang chờ phê duyệt.
- Công cụ `ai-service/eval/face_evaluation.py`: validator manifest; APCER theo loại, BPCER, ACER (max APCER), FTA, technical failure tách riêng, Wilson CI, breakdown theo device/condition, chọn ngưỡng chỉ trên calibration, `BLOCKED_DATA` khi thiếu dữ liệu.
- `PadEvaluationRecord` mở rộng: thêm artifact hash, manifest hash, procedure, cờ subject-disjoint, số subject, FTA, limitations, approval.

## 5. APCER/BPCER và giới hạn

**APCER / BPCER / ACER / FTA: NOT_MEASURED.** Chưa có participant, consent hay vật liệu tấn công được duyệt. 11 test của `face_evaluation.py` chỉ kiểm công thức, mẫu số và cách chia split trên số tổng hợp; **không phải kết quả sinh trắc**.

Giới hạn: PAD thụ động một khung hình; không chống injection, virtual camera, deepfake hay mặt nạ 3D; nonce không chống replay trước camera; crop chưa xác minh với upstream; kết quả chỉ áp dụng cho thiết bị đã đo.

## 6. Calibration SFace và quality

- Score: `FaceRecognizerSF.match(…, FR_COSINE)` trên feature 128-d sau `alignCrop` với 5 landmark YuNet; kiểm finite, khoảng [−1, 1].
- Ngưỡng **0.60** và quality (độ sáng 40–220, sharpness ≥ 60, mặt ≥ 80px, detection ≥ 0.6): **PROVISIONAL_UNCALIBRATED**, giữ nguyên.
- FMR/FNMR/phân phối điểm/quality rejection/latency: công cụ đã sẵn (`identity_metrics`, `select_threshold`), **dữ liệu NOT_MEASURED**. Cặp genuine/impostor phải nằm cùng split; genuine cùng subject, impostor khác subject (validator kiểm).

## 7. Kết quả test với model thật

| Test | Loại | Kết quả |
|---|---|---|
| `smoke_research_components.py` | Real-model: YuNet NO_FACE trên ảnh trống; SFace feature (landmark fixture); MN3 output | **PASS** (`biometricAccuracyMeasured:false`) |
| `test_face_models` (`FACE_TEST_MODEL_DIR`) | Real-model load, hash, router/enroll fail closed | **PASS** |
| `test_face_live_bridge` | Nest → FastAPI → model thật | **PASS** (host). Trong container: ERROR môi trường (không có Node/server) |
| `test-e2e.cjs` | Real HTTP + model thật + PG tạm | **24/24 PASS** ([report](evidence/faceid-lab-02/research-e2e-report.json)) |
| Browser qua Lab | Real models, ảnh trống do server tạo → `NO_FACE`, PAD không chạy | **PASS** |
| Khuôn mặt thật (đúng người / người khác / spoof) | Real PAD evaluation | **NOT_RUN** (BLOCKED_DATA) |

## 8. Browser QA

Playwright 1.65.1 + Chromium 1255, camera giả của Chromium (pattern tổng hợp, không có người), trace và video **tắt** (để tránh ghi token).

**22/22 PASS** (11 kịch bản × desktop 1366×900 và mobile Pixel 7). Kết quả: [playwright-results.json](evidence/faceid-lab-02/playwright-results.json); 30 screenshot trong `evidence/faceid-lab-02/`.

| # | Kịch bản | Nguồn backend | Kết quả |
|---|---|---|---|
| 01 | Kết nối: capabilities, `PAD_BLOCKED_DATA`, blockers, token bị che | Thật | PASS |
| 02 | Enrollment Face Core: consent VALID → session BLOCKED (data policy) + PAD NOT_EVALUATED + proof BLOCKED; chưa có template; withdraw → CONSENT_REQUIRED | Thật (JwtStrategy, PG) | PASS |
| 03 | Bật camera, preview, chụp, **không upload** khi capture chưa duyệt (không có request `/capture`); xóa ảnh, tắt camera | Thật | PASS |
| 04–06 | Synthetic → Image PASS, Detection FAIL `NO_FACE`, Quality SKIPPED, PAD NOT_EVALUATED; PAD và Identity Inspector | Thật (model) | PASS |
| 07–08 | Daily: retry idempotent cùng session id, nonce giả, worker khác, gửi trùng trả cùng kết quả, **hết hạn thật sau TTL 20s** | Thật | PASS |
| 09–10 | Order: worker khác, order lạ, order của worker khác, order chưa ARRIVED; inspector đơn của mình / đơn người khác `ORDER_ACCESS_DENIED` | Thật | PASS |
| 11 | Camera bị từ chối (Chromium fake-UI "deny" → `NotAllowedError`) | — | PASS |
| 12 | Không có camera API | Mô phỏng (initScript) | PASS |
| 13 | Offline → `NETWORK_UNAVAILABLE` → online lại thì thành công | Thật | PASS |
| 14 | Model timeout → ERROR, PROOF BLOCKED; retry cùng nonce thành công live | **Stub 504** (timeout thật nằm ở E2E §7) | PASS |
| 15 | Mọi tab không tràn ngang; không có token trong DOM; storage và cookie rỗng | — | PASS |

Mọi test assert **0 console error/pageerror**. Lỗi tài nguyên 4xx/5xx được loại trừ vì đó là kết quả mong đợi của kiểm thử âm. Trạng thái success thật **không thể tạo** (gate đóng), nên UI hiện BLOCKED rõ ràng chứ không giả success.

**Lỗi tìm thấy nhờ browser QA và đã sửa:**

1. Chromium headless ném `NotSupportedError` khi không hỏi được quyền camera. Lab trước đây báo sai thành `CAMERA_CAPTURE_FAILED`; giờ là `CAMERA_UNSUPPORTED`.
2. Stage AUTH hiện SKIPPED dù server đã chấp nhận JWT. Giờ là PASS khi lỗi xảy ra ở bước nghiệp vụ sau xác thực.
3. File test chưa được typecheck. Đã thêm `tsconfig.test.json`.

## 9. PostgreSQL integration

`node server/test/face/run-isolated.cjs`: **64/64 PASS**. Migration apply → rollback phá hủy giữ dữ liệu legacy → reapply PASS; Prisma diff rỗng (drift guard vẫn nghiêm).

Harness áp nguyên văn `symptom_catalog_v3` **chỉ** trên container `fixgo_face_test` / `fixgo_face_research_*` (URL và `current_database` được kiểm), không sửa migration production. Sau khi chạy không còn container, network hay tiến trình nào (đã kiểm).

## 10. Kiểm thử âm (security-negative)

Loại test: U = unit/policy · PG = PostgreSQL integration · E2E = HTTP thật + model · B = browser · M = thủ công / thiết bị thật.

| Kịch bản | Kết quả | Loại / bằng chứng |
|---|---|---|
| Sai worker | PASS | PG ("session owned by another worker"), E2E, B07/B09 |
| Sai order | PASS | PG ("wrong-order", "one order proof … second order"), E2E, B09, inspector `ORDER_ACCESS_DENIED` |
| Session expired | PASS | PG (thời gian PG), E2E, **B08 hết hạn thật** |
| Nonce mismatch | PASS | PG, E2E, B07 |
| Nonce replay / payload đổi | PASS | PG ("other nonce rejected", "changed payload"), E2E |
| Duplicate submission | PASS | PG, E2E ("concurrent submit … one attempt"), B07 |
| Consent revoked | PASS | PG ("withdrawal …", "withdraw during inference"), B02 |
| Template revoked | PASS | PG ("epoch fence", "wrong template version") |
| Face mismatch | PASS (logic) | PG/U với evidence stub. **Khuôn mặt thật: NOT_RUN** |
| Low quality | PASS | U (pixel thật: dark/bright/blur), PG ("qualityDecision FAIL") |
| PAD FAIL / NOT_EVALUATED / INCONCLUSIVE | PASS | PG ("PAD %s cannot create template"), U (gate), B02 |
| Model unavailable | PASS | U (`MODEL_NOT_READY`), E2E (network disconnect 503) |
| Camera denied | PASS | B11 (Chromium thật), U |
| Network timeout | PASS | E2E (504 thật), PG (timeout tiêu attempt), B14 (stub) |
| Concurrent requests | PASS | PG (race tạo session, consume đúng 1 lần, quota qua nhiều instance), E2E |
| Print / screen / video replay | **NOT_RUN** | Real PAD evaluation, BLOCKED_DATA |
| Thiết bị Android thật | **NOT_RUN** | M |

Rà soát §8: JWT (`JwtStrategy` thật trong lab stack, 401 khi không token), role WORKER, ownership (từ JWT; query `workerId` bị bỏ qua), nonce HMAC theo session (chỉ lưu hash), TTL theo giờ PG, giới hạn attempt/cửa sổ, consume trong transaction, revocation theo epoch. Inspector: 404 khi tắt hoặc ở production (trả trước auth), cần JWT và WORKER, không trả nonce, ciphertext hay ảnh. Đường đi face chỉ log chuỗi cố định. **Không tìm thấy lỗ hổng mới.**

## 11. API / DB changes

- **DB / Prisma / migration: không đổi.**
- Endpoint mới từ LAB-01 (không đổi): `GET /api/workers/me/face/lab/inspect`.
- Research response additive: thêm diagnostics; `padPolicy.reason` có thêm `PAD_BLOCKED_DATA` / `PAD_BLOCKED_APPROVAL`.
- Không đổi contract của Face Core production.

## 12. Files changed

**Mới (LAB-02):** `server/scripts/face-lab/lab-stack.cjs`, `ai-service/eval/face_evaluation.py`, `ai-service/eval/test_face_evaluation.py`, `ai-faceid-lab/{playwright.config.ts, e2e/faceid-lab.spec.ts, tsconfig.test.json}`, `docs/ai-labs/{faceid-lab-final-report.md, faceid-pad-evaluation-protocol.md, faceid-dataset-manifest.template.json}`, `docs/ai-labs/evidence/faceid-lab-02/*` (30 PNG + 2 JSON, khoảng 17 MB).

**Sửa (LAB-02):** `ai-service/pad_policy.py` (record mở rộng, BLOCKED_DATA/APPROVAL), `face_research.py` và `face_research_app.py` (thêm artifact hash vào gate), `eval/test_pad_policy.py`, `eval/test_face_research.py`. Trong Lab: `src/lib/{codes,timeline,camera,trials,fixtures}.ts`, `src/components/{FlowPanel,TimelineView,Trials}.tsx`, `src/App.tsx`, `styles.css`, các test, `package.json` (devDeps exact: `@playwright/test@1.65.1`, `@types/node@20.17.6`), `tsconfig.json`, `.gitignore`, `README.md`.

**Từ LAB-01 (vẫn chưa commit):** xem [faceid-lab-report.md §4](faceid-lab-report.md).

## 13. Known blockers

1. **BLOCKED_DATA (PAD):** cần protocol, consent, participant và vật liệu tấn công được duyệt, sau đó chạy calibration và evaluation độc lập.
2. **BLOCKED_APPROVAL:** data policy (`FACE_BIOMETRIC_CAPTURE_APPROVED`), KMS, retention, cùng phê duyệt `PadEvaluationRecord`.
3. **BLOCKED_DATA (SFace):** chưa có cặp genuine/impostor; ngưỡng 0.60 chưa hiệu chỉnh.
4. Chưa có đường nối gate PAD vào `face_router` / `FaceEvidenceGateway` production; `/ai/face-enroll` không trả embedding (cần proposal, sửa AI entrypoint).
5. Crop PAD chưa xác minh với upstream.
6. Chưa test Android thật.
7. Ghi chú vận hành: lấy PID dừng stack từ dòng `"pid"` script in ra, **không** dùng `$!` của `nohup` (đó là shell bọc ngoài).

## 14. Merge readiness

| Điều kiện Definition of Done | Trạng thái |
|---|---|
| Web UI trên browser thật | ✅ |
| YuNet/SFace inference thật | ✅ (synthetic) |
| PAD inference + policy đã đánh giá/phê duyệt | ❌ inference ✅, policy BLOCKED |
| PAD đạt tiêu chí thực nghiệm | ❌ NOT_RUN |
| Enrollment / Daily / Order thành công thật | ❌ BLOCKED đúng thiết kế |
| Replay / sai worker / sai order bị từ chối | ✅ |
| Spoofing bị từ chối | ❌ NOT_RUN |
| Proof ràng buộc session/worker/order | ✅ (PG, kể cả constraint ở DB) |
| Calibration ngưỡng matching | ❌ |
| Không regression | ✅ |
| Không bypass | ✅ |
| Không đổi DB chính | ✅ |
| Hướng dẫn và bằng chứng | ✅ |

→ **Lab: `READY_WITH_DOCUMENTED_LIMITATIONS`** (đề xuất merge riêng vào nhánh development như tooling; PAD production vẫn fail closed). **FaceID production: `NOT_READY`.**

## 15. Tích hợp Worker App sau này

Giữ nguyên 8 điều kiện ở [faceid-lab-report.md §9](faceid-lab-report.md), bổ sung:

1. Có `PadEvaluationRecord` đã phê duyệt, khớp artifact hash, crop và preprocessing **của đường chạy production**.
2. Có report `face_evaluation.py` với `status=EVALUATED_NOT_APPROVED` đạt mục tiêu, kèm phê duyệt; ngưỡng SFace được chọn trên calibration.
3. Worker App ánh xạ lỗi theo `ai-faceid-lab/src/lib/codes.ts` (10 stage); xử lý `NotAllowedError` / `NotSupportedError` / `NotFoundError`; không giả success; không lưu ảnh hay token.
4. Chạy lại bộ Playwright đối với thiết bị thật (Android WebView hoặc native: checklist thủ công).

## Git, test và merge checklist

**Git status (chưa commit):**

```
 M ai-service/eval/test_face_research.py      M server/scripts/face-research/prepare.cjs
 M ai-service/face_research.py                 M server/src/face-research/research.service.js
 M ai-service/face_research_app.py             M server/src/face-research/research.spec.js
 M server/src/modules/workers/face/face-core.module.js
 M server/test/face/run-isolated.cjs
?? ai-faceid-lab/  ai-service/pad_policy.py  ai-service/eval/{face_evaluation,test_face_evaluation,test_pad_policy}.py
?? docs/ai-labs/  server/scripts/face-lab/  server/src/modules/workers/face/face-lab*.js (5 file)
```

**Diff tracked:** 8 file, +217 / −17. Phần còn lại là file mới (untracked).

**Lệnh test:**

```sh
# Frontend
cd ai-faceid-lab && npx tsc -b && npx vitest run && npx vite build                          # 70/70
FACEID_LAB_FIXTURES=<lab-fixtures.json> npx playwright test                                  # 22/22, cần lab-stack
# Backend (cần server/node_modules)
cd server && npx jest                                                                         # 216/216
node test/face/run-isolated.cjs                                                               # 64/64, PG tạm
FACE_RESEARCH_SOURCE_MODEL_DIR=… FACE_RESEARCH_RUNTIME_DIR=… node scripts/face-research/test-e2e.cjs   # 24/24
# Python (venv nghiên cứu trong container python:3.11-slim)
python -m unittest discover -s eval -p 'test_[fp][a]*.py'      # 77 chạy; 1 ERROR môi trường (live bridge) → chạy trên host: PASS
python eval/smoke_research_components.py                         # real YuNet/SFace/MN3
```

**Merge checklist:**

- [ ] Review code; đặc biệt `pad_policy.py` (registry phải rỗng) và `face-lab.guard.js` (404 ở production).
- [ ] Quyết định có commit 17 MB screenshot hay chỉ giữ như artifact CI.
- [ ] Xác nhận `FACE_LAB_DEBUG_ENABLED` không được set ở production/staging công khai.
- [ ] Xác nhận việc áp `symptom_catalog_v3` trong harness test với owner của Recommendation (chỉ áp trên DB tạm).
- [ ] Commit riêng Lab vào nhánh development với nhãn `READY_WITH_DOCUMENTED_LIMITATIONS`. **Không** bật FaceID production.
- [ ] Mở ticket: phê duyệt protocol PAD/SFace, data policy và proposal nối gate vào AI entrypoint.
