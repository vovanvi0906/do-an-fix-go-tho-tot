# FIXGO INTEGRATION-S04 — 2026-11-14 (Asia/Ho_Chi_Minh)

Repo phát triển/kiểm thử chính đã hợp nhất tại `/home/vanvi/Work/do-an-fix-go-tho-tot`, branch `integration/fixgo-sprint-02`. Chạy USB từ repo này; **Face ID production chưa sẵn sàng happy path**. ARC-01 đã được chạy lại và PASS trên database disposable mới, không dùng evidence S03 thay cho kết quả S04.

## Git và bảo toàn cấu hình

| Mốc | Commit |
|---|---|
| Repo chính trước S04 | `803ec3210ac56893490ee2d4e7fc8a7cb70d212e` |
| S03 trước stabilization commit | `d5d5c7bbbb21b3d5cc5026b421ba815df2dde7ec` |
| Commit riêng S03-STABILIZATION | `06b6e72` |
| Merge S03 → integration tại repo chính | `84b0d60` |
| Hoàn thiện startup/preflight tại repo chính | `f1eee52` |

HEAD bàn giao gồm commit báo cáo sau `f1eee52`; lấy SHA đầy đủ bằng `git rev-parse HEAD`. Danh sách commit nguồn đã merge: [merged-commits.txt](evidence/merged-commits.txt). Đã xác nhận HEAD S03, cả Recommendation V2 `9e77da5` và Face Core `9db1016` là ancestor của HEAD repo chính.

Review toàn bộ phần chưa commit S03: fixture ARC-01, disposable runner, runtime smoke, USB startup, port guard và evidence. Chuẩn hóa formatting hai file test, chạy ESLint hai file và Backend Jest trước commit. Fixture persist consent/review/template/proof synthetic chỉ trong disposable, inject FaceCore thật; kiểm DAILY không thay ORDER, rollback consume khi thiếu BEFORE và consume/audit đúng một lần khi start hợp lệ. Không thay production gates hoặc tạo proof trong production.

Repo chính ban đầu có 34 file untracked `docs/ai-core-audit-02/`. Chúng trùng byte với incoming S03. Git vẫn chặn merge vì untracked; đã chuyển nguyên thư mục local sang `/home/vanvi/Work/fixgo-s04-preserved-local-audit`, giữ thêm archive `/tmp/fixgo-s04-main-audit-backup.tar.gz`, rồi merge. Đã đối chiếu **34/34 checksum sau merge khớp bản local gốc**; không mất nội dung. Thư mục trong repo hiện được track bởi lịch sử S03. Manifest ở [integration-state.json](evidence/integration-state.json).

Không sửa/ghi đè local `.env`, `.env.local`, OAuth/Firebase configuration, model artifacts hoặc native Android files. Không xóa worktree Gemini/Codex/S03, không reset/clean, không merge `main`, không push remote.

## Regression sau merge

| Kiểm tra | Kết quả | Evidence |
|---|---|---|
| Backend Jest | **177 PASS**, 17 suites | `backend-jest.log` |
| Customer Jest | **115 PASS**, 20 suites | `customer-jest.log` |
| Worker Jest | **153 PASS**, 20 suites | `worker-jest.log` |
| FastAPI/Python discover | **58 PASS, 3 SKIP**, 61 tests | `fastapi-tests.log` |
| Real local YuNet/SFace + Nest transport | **6 PASS**, không còn SKIP trong nhóm này | `face-live-models.log` |
| Face Core PostgreSQL security | **64 PASS** | `arc01-face-disposable.log` |
| ARC-01 PostgreSQL + HTTP + Socket.IO | **19 PASS**, Redis pubsub không nằm trong suite | `arc01-face-disposable.log` |
| Backend Babel build | **PASS**, 156 files | `backend-build.log` |
| Backend typecheck | **N/A**: JavaScript/Babel; không có tsconfig hoặc checkJs command. Build không chứng nhận type safety | — |
| Customer TypeScript | **PASS** theo tsconfig hiện tại | `customer-typecheck.log` |
| Worker TypeScript | **FAIL: 11 lỗi route kế thừa**, xem dưới | `worker-typecheck.log` |
| Admin Vite build | **PASS**, cảnh báo bundle lớn | `admin-build.log` |
| Customer/Worker Android JS export | **PASS cả hai**, chưa phải APK/native build | `customer-export.log`, `worker-export.log` |
| ESLint các test ARC đã sửa và preflight mới | **PASS** | `changed-files-eslint.log` |
| ESLint toàn Backend, không `--fix` | **FAIL: 1.078 errors formatting, 68 warnings** | local `backend-eslint.log`; summary trong `integration-state.json` |
| Bash/Node syntax, git diff whitespace | **PASS** | kiểm tra trực tiếp |
| Chính script USB + 5 dịch vụ | **PASS**, PostgreSQL/Redis disposable, đã dừng sau smoke | `usb-runtime-disposable.log`, [runtime-smoke.json](evidence/runtime/runtime-smoke.json) |

Ba SKIP discover yêu cầu `FACE_TEST_MODEL_DIR`; đã chạy lại nhóm tương ứng với weights local repo chính: 6/6 PASS. Real-model smoke dùng ảnh blank/synthetic, không phải positive identity/PAD accuracy test. Gateway fake/persisted fixture của test không phải Face ID thực nghiệm trên người thật.

Worker typecheck: `src/features/home/screens/HomeScreen.tsx`, `src/features/services/hooks/useSelectServiceWizard.ts`, `src/features/services/screens/PriceEstimateScreen.tsx` còn chứa Customer routes (`/(user)/...`, `register-customer`) không có trong Worker router. Cả ba file không thay đổi so với `803ec32`. Các file vẫn nằm trong phạm vi `tsconfig`; không loại chúng, không thêm cast hay sửa generated routes để làm xanh. Android JS export Worker thành công nhưng không phủ nhận FAIL typecheck. Cần công việc tách/dọn module Customer kế thừa khỏi Worker; S03 typecheck PASS trước đó không bảo đảm bắt được lỗi với generated route types hiện tại.

## Database và Face ID blockers

Local `server/.env` vẫn trỏ `localhost:5432/ondemand_db` (container hiện có `ondemand_postgres`). Redis mặc định là stack local, không phải disposable được dùng trong smoke. Không đưa credentials vào báo cáo.

Đã xác minh actual database/role/port trong transaction READ ONLY và so sánh catalog. Snapshot private ngoài repo `/tmp/fixgo-s04-db-{before,after}.json`, mode 0600; không đọc hàng dữ liệu ứng dụng. Snapshot trước/sau byte-identical, SHA-256 `185831ca2e38c15e313ce4eb0a641195e6fc616090359ad73f6cd0b51c335097`. Điều này chứng nhận metadata không đổi, không phải kiểm toán dữ liệu ứng dụng. Phiên này không chạy backend dùng DB FixGo và không thực hiện SQL ghi lên DB đó.

Kết quả mới [schema-summary.json](evidence/schema-summary.json): DB khớp baseline Gemini `9e77da5` về columns/enums/constraints/indexes/triggers/functions. So với schema tích hợp còn thiếu **72 columns, 28 constraints, 21 indexes, 7 triggers, 7 functions Face Core**. Không có `_prisma_migrations`. Không tự tạo baseline/migration history hoặc biến timestamp legacy thành proof.

Migration/schema DDL, truncate, fixtures và rollback của regression **chỉ chạy trên container disposable mới do runner tạo, cổng loopback ngẫu nhiên, DB `fixgo_face_test`**, rồi container được dọn. Không chạy Prisma migrate/db push/reset/seed trên DB FixGo. Prisma validate/generate chỉ kiểm schema và sinh client local.

Face Core/capture mặc định false trong cấu hình hiện tại; gateway production vẫn `padEvaluated=false`. Còn các blocker:

- Schema/historical lineage/migration baseline chưa được xử lý trên DB FixGo.
- Chưa phê duyệt biometric capture, consent/retention/deletion policy và key custody.
- PAD experimental có trong source nhưng chưa evaluated/calibrated/approved để cấp quyền production.
- Chưa nghiệm thu Face ID/PAD, camera/native lifecycle và UI trên điện thoại thật trong S04.

Hướng xử lý: chuẩn bị bản clone QA độc lập; xác định migration baseline và kiểm lineage/backup/restore ở đó; hoàn tất policy/keys và đánh giá PAD trước khi xem xét rollout. Không bật flags đơn thuần để bỏ qua blocker. Nhận đơn/start/online vẫn bị chặn khi thiếu proof hợp lệ.

## USB runtime và nguồn code

`dev-local-usb.sh` chạy từ vị trí script, preflight tất cả cổng trước side effects, tái sử dụng stack Docker đang chạy, chỉ Prisma validate/generate. Preflight mới đọc metadata trong transaction READ ONLY, in database đã kết nối, chặn thiếu application columns hoặc bật FaceCore khi thiếu Face columns; không tự sửa schema. Đây là kiểm tra tên columns tối thiểu, không thay full migration/security audit. Đã thử negative control trên DB hiện tại: `FACE_SCHEMA_INCOMPATIBLE_NO_AUTOMATIC_MIGRATION` khi yêu cầu enabled, không khởi động ứng dụng hoặc cấp proof.

| Dịch vụ | Source đã xác minh từ `/proc/<PID>/cwd` + cmdline | Cổng |
|---|---|---|
| Backend | repo chính `server/src/main.js`, Babel/nodemon | 3000 |
| FastAPI | repo chính `ai-service/main.py`, `.venv/bin/python`; launcher chỉ nạp thêm AI token/model path từ server env | 8000 |
| Admin | repo chính `client`, Vite strictPort | 5173 |
| Customer | repo chính `customer-app`, dev-client localhost | 8081 |
| Worker | repo chính `worker-app`, dev-client localhost, `FACE_RESEARCH_APP=false` | 8082 |

Launcher AI dùng cùng effective `AI_FACE_SERVICE_TOKEN` với Backend mà không in token, không nạp template keys từ `server/.env`; thiếu token vẫn fail-closed. Catalog backend URL cho FastAPI là `http://127.0.0.1:3000/api`. Không mount research vào production để tiện chạy.

Smoke chạy nguyên script với disposable database/Redis qua process env, giữ nguyên các local config files. Đã xác nhận V2 model response, Face thiếu auth trả 401, trusted request vẫn `verified=false`, `padDecision=NOT_EVALUATED`, không proof/embedding; production Nest/FastAPI không có research routes. Source luôn là repo chính. Smoke đã dừng; không để runtime QA nối DB tạm đã bị xóa.

S03 USB process group `458130` được xác minh cwd/cmdline rồi SIGTERM để giải phóng cổng. Các cổng 3000/8000/5173/8081/8082 rảnh khi bàn giao. Không dừng container DB/Redis đang hoạt động hoặc xóa các worktree cũ.

## Chạy Android trên Ubuntu

```bash
cd ~/Work/do-an-fix-go-tho-tot
./dev-local-usb.sh
```

Đã có dependencies, `.venv`, local weights, app `.env.local` tại repo chính. Script executable. Nếu shell đang export DATABASE_URL/Redis/Face flags từ phiên khác, kiểm tra lại chúng trước khi chạy: process env có ưu tiên hơn `.env`. Đọc dòng database preflight; đích mặc định hiện là **DB FixGo `ondemand_db`**, khác database disposable của regression. Phiên S04 không tự login/tạo đơn/ghi dữ liệu ở DB này. Các thao tác Android ghi dữ liệu cần môi trường QA được điều phối nếu muốn giữ nguyên DB hiện tại.

1. Cắm cáp dữ liệu, bật USB debugging, mở khóa điện thoại và chấp nhận RSA. Dùng platform-tools tại `$HOME/Android/Sdk/platform-tools`; tránh `sudo adb`. Đã thấy máy `V2536A`, serial `10AG3G1KS800336`, trạng thái `device`.
2. Script tự reverse 3000/8081/8082. Nhiều thiết bị: `./dev-local-usb.sh --device SERIAL`. Sau khi cắm lại cáp: `bash scripts/dev-usb-connect.sh --device SERIAL`, rồi `adb -s SERIAL reverse --list`. Không cần reverse 8000 vì app gọi Backend, Backend gọi AI trên Ubuntu.
3. Hai app giữ `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api`, `EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:3000`. Backend AI URL hiện `http://localhost:8000`.
4. Dùng development APK build từ **repo chính** với package tương ứng, không dùng Expo Go hay APK cũ để chứng nhận native source mới. Khi cần build/cài mới, mở terminal trong từng app:

```bash
# Terminal Customer; script tổng đã chạy Metro 8081
cd ~/Work/do-an-fix-go-tho-tot/customer-app
npx expo run:android --device --port 8081 --no-bundler

# Terminal Worker; script tổng đã chạy Metro 8082
cd ~/Work/do-an-fix-go-tho-tot/worker-app
FACE_RESEARCH_APP=false npx expo run:android --device --port 8082 --no-bundler
```

5. Dev client kết nối `http://127.0.0.1:8081` (Customer) hoặc `http://127.0.0.1:8082` (Worker). Kiểm Customer: ảnh → category → target → symptom → DB service; OOD/ảnh hỏng → abstain/manual; back/reload/mất mạng/background. Kiểm Worker: preflight/daily/order hiển thị blocker; không cho timestamp legacy thay proof, không tự bật camera/cấp proof. Happy path Face chưa phải tiêu chí PASS ở cấu hình hiện tại.
6. Ghi HEAD, Android version/model, APK build/package, Metro URL, bước thực hiện/kỳ vọng/thực tế và logcat. Login/booking/payment/camera/OAuth/native UI trên máy thật chưa được thực hiện trong S04. Hai JS exports PASS không phải APK/native build PASS.

Regression tái chạy: Backend `npm test -- --runInBand`, `npm run build`; mỗi app `npm run test:ci`, `npx tsc --noEmit`; FastAPI `PYTHONDONTWRITEBYTECODE=1 ULTRALYTICS_AUTOINSTALL=false HF_HUB_OFFLINE=1 .venv/bin/python -m unittest discover -s eval -p 'test_*.py'`. ARC/Face: trong `server`, `node test/face/run-isolated.cjs --arc01` chỉ dành cho disposable container; không trỏ test fixture vào DB FixGo.
