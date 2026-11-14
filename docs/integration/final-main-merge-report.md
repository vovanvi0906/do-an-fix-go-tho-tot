# Final Git integration — merge gate report

Ngày 14/11/2026, Asia/Ho_Chi_Minh. Repository `/home/vanvi/Work/do-an-fix-go-tho-tot`.

## 1. Quyết định cuối

**Đã tạo commits và nhánh `integration/fixgo-final-main`, đã chạy regression. CHƯA MERGE VÀO MAIN.**

Gate bảo mật trong yêu cầu người dùng yêu cầu dừng trước cập nhật main khi phát hiện secrets/lỗi bảo mật nghiêm trọng. Audit phát hiện credentials Cloudinary, SMTP/eSMS và database password có mặt trong source/template/history. Snapshot tích hợp hiện đã được làm sạch, nhưng **chưa có bằng chứng các credentials từng bị lộ đã được thu hồi/rotate**. Lịch sử cũ được giữ nguyên theo yêu cầu không rewrite; xóa literal ở commit mới không thu hồi quyền của credential đã lộ. Không tự thử credentials với nhà cung cấp, không rotate external account khi chưa có phạm vi/quyền truy cập tương ứng.

Local `main` và local tracking ref `origin/main` đều giữ nguyên `c307e34a051e811ed4a6f5adf09a26732e344905`. Không push, fetch, deploy, rewrite main hoặc migration/seed/reset database dự án. Không có merge conflict vì gate chưa cho phép cập nhật main; không dùng ours/theirs.

Evidence đầy đủ SHAs/counts: [final-main-merge-results.json](final-main-merge-results.json). Source checkpoint đã kiểm thử: **`a94b87e330796f716ff0fe8e5c335c85b7f6b541`**. Report commit tạo sau checkpoint này, chỉ bổ sung báo cáo/evidence; tra SHA bằng `git log -1 --format=%H -- docs/integration/final-main-merge-report.md`.

## 2. Git audit trước và sau

Đã chạy status thường/ignored, branch -avv, worktree list, graph log --all, unstaged/cached diff stats/check, untracked inventory, merge-base/is-ancestor/left-right history và audit index.

Trước thao tác:

- Branch `feat/ai-recommendation-v3-phase-c`, HEAD `b50075f56787cbeed41f1615a8ff86e590e1ea5c`.
- 27 tracked files modified, staging trống; có source/tests/docs/CSV/migration/QA scripts chưa track. Các nhóm thay đổi A/B/C phụ thuộc lẫn nhau, không tách commit A/B độc lập bằng cách làm mất ngữ cảnh C.
- Private `.android-qa/`, `.env` thật, node_modules, native build folders, caches, logs/model downloads được ignored. Phát hiện riêng `client/.env.local` và hai standalone APK đã tracked từ lịch sử cũ dù là runtime artifacts.
- Đã lưu checkpoint private gồm tar 68 files modified/untracked, binary unstaged/staged patches, refs và worktree statuses tại `/home/vanvi/.codex/backups/fixgo-final-20261114-170346-b99659/`, quyền private. Không đưa checkpoint vào Git.

| Ref | SHA trước | SHA sau source integration |
|---|---|---|
| main / origin/main | c307e34 | c307e34 — không đổi |
| integration/fixgo-sprint-02 | b50075f | b50075f — giữ nguyên |
| feat/ai-recommendation-v3-phase-c | b50075f | 8aadfc7 |
| integration/fixgo-final-main | Chưa tồn tại | a94b87e + report commit |
| backup/main-before-final-20261114-1703 | Chưa tồn tại | c307e34 |
| agent/backend-auth | 90ea0bb | 90ea0bb |
| agent/codex-worker | 9db1016 | 9db1016 |
| agent/gemini-customer | 804aaaf | 804aaaf |
| test/integration-s02-ai-rec | 9e77da5 | 9e77da5 |
| test/integration-s03-full-ai | 06b6e72 | 06b6e72 |

Bốn worktree khác đều clean ở đầu lượt audit; không có patch chưa commit cần lấy hoặc ghi đè. Giữ nguyên cả năm worktree, không xóa/đổi tên branch/worktree nào. Chỉ tạo final integration branch và backup ref mới.

## 3. Ancestry và thứ tự tích hợp

Git xác nhận trước khi tạo commit mới:

| Branch | Ancestor của b50075f? | Commits chỉ có bên branch, còn thiếu trong b50075f |
|---|---|---:|
| main / origin/main | Có; merge-base c307e34 | 0 |
| integration/fixgo-sprint-02 | Cùng HEAD b50075f | 0 |
| agent/backend-auth (90ea0bb) | Có | 0 |
| agent/codex-worker (9db1016) | Có | 0 |
| agent/gemini-customer (804aaaf) | Có | 0 |
| test/integration-s02-ai-rec (9e77da5) | Có | 0 |
| test/integration-s03-full-ai (06b6e72) | Có | 0 |

Main → b50075f: left/right `0 / 65`. S03 được merge bằng 84b0d60, S04 preflight/handoff ở f1eee52 và b50075f. `90ea0bb` đã ở lịch sử qua merge d0ba8ca. Các ref local còn lại cũng không có tip độc lập nằm ngoài history hiện tại ở thời điểm audit.

Vì vậy không merge lại agent branches và không cherry-pick commit đã có. Chỉ lưu các thay đổi working tree A/B/C/QA thành commits rồi tạo final integration branch từ tip đó. Main là ancestor nên **sau khi gate bảo mật được đóng**, có thể fast-forward mà không làm mất commit main; hiện chưa thực hiện.

## 4. Commit mới đã lưu

| SHA | Nội dung |
|---|---|
| 552111b | `fix(security): remove embedded credentials and untrack private artifacts` |
| 7a0652d | `feat(ai): integrate V3 diagnosis UX and symptom catalog` |
| 8a265a7 | `chore(android-qa): add isolated Android QA environment` |
| 8aadfc7 | `docs(ai): record V3 proposals rollout and QA validation` |
| d83c757 | `chore(integration): normalize catalog proposal line endings` |
| c64511a | `fix(security): require private Compose credentials and redact handover examples` |
| a94b87e | `style(backend): format reviewed integration changes` |

SHA đầy đủ nằm trong JSON evidence. Có thêm report commit sau các commits trên. Không squash/rebase hoặc sửa lại lịch sử main/integration cũ.

Nội dung đã được bảo toàn trong final integration:

- AI Recommendation V2/FastAPI router, category/target matching, abstain/OOD và catalog sync từ Gemini/S02/S03.
- Phase A: canonical target slug → DB ID, category-target validation, reset downstream/race guards.
- Phase B: xác nhận thiết bị/triệu chứng, tối đa 3 services, target-scoped manual browse/search/paging, retry/empty/error và copy không đưa confidence % chưa calibration.
- Phase C: Symptom/SymptomService/audit schema, composite FK/review/active constraints, migrations/rollback, public/admin APIs/RBAC, Admin UI và Customer symptom IDs/explicit service confirmation.
- Catalog audit/proposals đủ 70 targets, 693 symptom candidates và 693 mappings, tất cả NEEDS_REVIEW/inactive, chưa import.
- QA containers/config isolation, preflight, start/status/stop/verify, Vivo reverse và safe build/install commands; DTO Swagger bootstrap fix và regression.
- Worker auth, scoped Face Core proof/session/consent/lineage guards, ARC-01 và payment integrity rules đã có trong ancestor history được giữ nguyên.

Không tách riêng commit A/B bằng partial patch vì resolver, DTO, UI và C integration đang dùng chung implementation cuối. Commit 7a0652d mô tả rõ toàn bộ phạm vi phụ thuộc.

CSV CRLF và Markdown hard-break whitespace được chuẩn hóa trong commit follow-up, cập nhật generator/hash evidence; dữ liệu CSV được validate lại, không đổi catalog IDs/mappings. Chỉ format các Backend JS files đã thay đổi, không auto-fix toàn bộ module cũ.

## 5. Bảo mật và những phần không đưa vào snapshot

Đã review source/tests/docs/migration/scripts và các file untracked trước khi stage có chọn lọc; không dùng git add -A hoặc -f. Sau mỗi nhóm đã kiểm cached name-status/stat, whitespace và secret gate; quét toàn bộ index sau tích hợp không còn findings theo pattern/local-private-credential-overlap checks.

Remediations:

- Cloudinary và eSMS chỉ lấy credentials từ environment, không còn fallback key/secret literal trong source.
- Database config không chứa URL/password fallback. Hai Compose manifests yêu cầu POSTGRES_PASSWORD qua private environment, không còn password mặc định.
- `.env.example` chỉ có placeholders và security flags đóng; sửa tên JWT_SECRET đúng runtime config. Không thay `.env` thật.
- Redact database credential trong LOGIN_HANDOVER, không in lại giá trị nhạy cảm trong report.
- Bổ sung `credential-boundary.spec.js`, hai tests PASS, và `audit-staged-secrets.cjs` dùng staged/index snapshot, chỉ in paths/rules.
- Một giá trị SMTP đã lọt qua mask trong bước audit template; không lặp lại trong report. Nó cũng thuộc credentials đã exposed cần xử lý, không xem output tool là chứng cứ credential an toàn.

Loại khỏi tracked snapshot nhưng **giữ file local nguyên vẹn**, nay được ignore:

- `client/.env.local` (chỉ endpoints nhưng vẫn là local config).
- `customer-app/build-1794394567703.apk`.
- `worker-app/build-1794395071058.apk`.

Không stage `.android-qa/`, `.env` thật, APK/AAB mới, face template/private key/service account hoặc QA runtime credentials/logs/PID files. Disposable fixtures chỉ tồn tại trong DB/container test riêng; mật khẩu QA runtime được sinh ngẫu nhiên và giữ private.

**Giới hạn bảo mật còn chặn main:** credentials thật từng có trong commits cũ, gồm nội dung đã tồn tại ngay trên main cũ dưới đường dẫn backend trước khi tách repo. Không rewrite/purge Git history vì bị cấm. Không có quyền/xác nhận thu hồi Cloudinary/SMTP/eSMS/database credentials tương ứng. Snapshot clean không phải chứng cứ rotation. Cần chủ hệ thống rotate/revoke và xác nhận quyền cũ hết hiệu lực trước khi cập nhật main theo gate của yêu cầu này.

## 6. Regression trên final integration branch

| Bộ kiểm tra | Kết quả | Evidence/phạm vi |
|---|---|---|
| Backend full Jest | PASS | 19 suites, **184 tests**, gồm JWT/RBAC, diagnosis, Swagger DTO và credential boundaries |
| Backend build | PASS | Babel compile 163 files |
| Customer full Jest | PASS | 21 suites, **121 tests**; V3 flow/manual/retry/race/empty |
| Customer TypeScript | PASS | npx tsc --noEmit |
| Worker full Jest | PASS | 20 suites, **153 tests**, gồm fail-closed gates |
| Worker TypeScript | **FAIL — legacy** | **11** route errors, xem dưới |
| Admin RTL | PASS | **4 tests**, CRUD/mapping/priority/preview/filter/reset; authority kiểm thêm bằng real HTTP tests |
| Admin production build | PASS | Vite build |
| AI contracts/pipeline | PASS | **29 tests**: recommendation, diagnose contracts, S03 routes, Face security, PAD contract |
| Prisma validate/generate | PASS | Chỉ metadata/client local, không migrate DB dự án |
| Symptom real PostgreSQL/HTTP/JWT | PASS | **11 tests**, max-3, cross-target reject, inactive/approved, DTO, audit, legacy/manual |
| Phase C migration/rollback/reapply | PASS | Own disposable port 55439; old metadata/Service/Order preserved; manual resolver sau rollback khi không có symptom tables |
| Existing Face Core PostgreSQL guards | PASS | **64 tests** sau symptom migration; existing triggers/FKs giữ nguyên |
| Existing ARC-01 HTTP/Socket/PostgreSQL | PASS | **19 tests**, không test Redis pubsub trong suite này |
| Android JS export Customer | PASS | /tmp/fixgo-final-customer-android |
| Android JS export Worker | PASS | /tmp/fixgo-final-worker-android |
| Backend lint, non-mutating | **FAIL — legacy formatting** | Baseline b50075f: 1078 errors/68 warnings; final: 1009 errors/68 warnings. Changed backend files: 0 errors/warnings, non-format errors: 0 |
| CSV proposals | PASS | 693 candidates/mappings; stable IDs, same-target/category, NEEDS_REVIEW/inactive |
| Compose config | PASS | Config validation với disposable placeholder qua process env, không compose up vào stack dự án |
| Entire index security snapshot | PASS có giới hạn | Không thấy secrets mới theo checks; **không thay thế credential rotation** |
| Project DB preservation | PASS | Read-only catalog snapshot vẫn 6/70/693 và deep-equal trước Phase C; symptoms/symptom_services vẫn chưa có |
| Native Android acceptance | SKIP | Không thao tác thiết bị, không cài lại APK, không clear data |
| Device/reverse cuối lượt | SKIP | adb devices không còn Vivo; verify dừng ở device check |

Có **585 automated tests PASS** ở các suites nêu trên. Không gọi toàn bộ gate PASS vì Worker TSC, lint legacy và credential-rotation blocker còn mở.

### Worker TypeScript legacy

11 lỗi TS2322/TS2345/TS2820 liên quan route Customer cũ trong Worker:

- `src/features/home/screens/HomeScreen.tsx`: register-customer, booking/create-booking, price-list, notifications.
- `src/features/services/hooks/useSelectServiceWizard.ts`: booking/create-booking.
- `src/features/services/screens/PriceEstimateScreen.tsx`: booking.

`git diff --quiet b50075f HEAD -- worker-app/src worker-app/app worker-app/tsconfig.json` trả 0: tracked source/config này giống hệt baseline trước các commits mới. Không nới router types hoặc thêm cast để che lỗi. Worker export/Jest PASS không thay thế TypeScript PASS.

### Lint legacy

Đã chạy ESLint không --fix để không sửa hàng loạt code cũ. So baseline bằng export private của b50075f với **cùng .babelrc/eslint/prettier config và dependencies**, không checkout hoặc sửa worktree khác. Lỗi hiện còn đều prettier/prettier ở các file cũ không thay đổi; warnings no-unused-vars vẫn 68 như baseline. Không báo lint PASS.

Logs chi tiết ở `.android-qa/final-*.log` và JSON lint/index audit, không commit logs có thể chứa runtime data. Tests DB chỉ dùng runner-owned disposable, đã dừng container final-regression sau test; không reuse QA DB hay ondemand_db cho test reset/fixtures.

## 7. Database, security flags và Android QA

- Không chạy migrate/db push/seed/reset hoặc ghi business rows trên `ondemand_db`.
- Audit metadata/catalog dùng SET TRANSACTION READ ONLY. Phase C tables vẫn absent trên DB dự án; 6 categories/70 targets/693 services không đổi so với snapshot đầu Phase C.
- `.env` thật của Backend và hai app `.env.local` giữ cùng hashes. Container IDs ondemand_postgres/ondemand_redis không đổi. Không restart hoặc sửa cấu hình các container dự án.
- QA PostgreSQL 55440 / Redis 56381 vẫn tách biệt. Không import proposals. Symptom flag trong QA vẫn false, Face Core/capture flags vẫn false; không cấp proof giả cho runtime QA.
- Backend 3000, FastAPI 8000, Admin 5173, Metros 8081/8082 vẫn là process groups QA cũ, cùng PIDs; không tự restart/kill các service này trong lượt merge audit.
- Host health/catalog/login/schema/Redis/Metro probes hoàn tất trước bước kiểm tra ADB. ADB hiện không còn thiết bị nên verify cuối không thể PASS toàn bộ. Cần cắm lại Vivo 10HF8GFBU200050 để kiểm reverse/native; không dùng kết quả device từ lượt QA trước làm kết quả hiện tại.
- Cloud upload QA chưa được cấu hình authorized sandbox credentials; giữ disabled. AI route/contract không phải evidence frost detection.
- PAD vẫn NOT_EVALUATED, identity model readiness không thay approval/PAD evidence. Không thay Face Core/PAD/FSM/payment/wallet source để vượt gate.

## 8. Chạy tiếp và điều kiện merge main

Hiện hãy dùng branch **integration/fixgo-final-main** để tiếp tục công việc. `main` vẫn là phiên bản cũ, chưa có V3 working-tree integration này.

Các việc bắt buộc trước lần merge tiếp:

1. Chủ hệ thống thu hồi/rotate credentials đã exposed và xác nhận giá trị cũ không còn quyền; không dán credential mới vào chat/report/source. Chỉ cập nhật private environment tương ứng bằng quy trình quản trị phù hợp.
2. Review Worker legacy TSC/lint debt; không ghi PASS cho các mục chưa sửa. Không có bằng chứng đây là regression mới của V3, nhưng chúng vẫn là hạn chế đã biết.
3. Re-run staged/index audit và các checks liên quan sau bất kỳ fix mới nào. Xác minh main vẫn ancestor final branch, kiểm backup ref, working tree và các worktree khác.
4. Khi gate được đóng, merge **local** bằng fast-forward, không force update/rebase hoặc push.

Lệnh mẫu **chưa thực hiện**, chỉ sau các điều kiện trên:

```bash
cd ~/Work/do-an-fix-go-tho-tot
git merge-base --is-ancestor main integration/fixgo-final-main
git status --short
# Nếu chuyển working tree cần dừng QA trước, chỉ dùng stop của runner-owned processes.
# Có thể dùng worktree main riêng để tránh đổi source của services đang chạy.
git switch main
git merge --ff-only integration/fixgo-final-main
git status --short
git log --graph --oneline --decorate -20
# Không push.
```

Sau merge, QA config private vẫn tồn tại và ignored. Khi Vivo được cắm lại:

```bash
adb -s 10HF8GFBU200050 get-state
bash scripts/dev-usb-connect.sh --device 10HF8GFBU200050
./dev-android-qa.sh status
# Nếu services đã chạy đúng instance thì không start/restart trùng.
./dev-android-qa.sh verify
```

Nếu cần khởi động QA lại sau khi đã dừng các process cũ:

```bash
./dev-android-qa.sh prepare
./dev-android-qa.sh start --device 10HF8GFBU200050
./dev-android-qa.sh verify
```

Không sửa server/.env để trỏ DB dự án, không dùng dev-local.sh có db push để sửa preflight, không tự bật symptom flag khi dữ liệu chưa approved/active, không cài/uninstall APK tự động.

## 9. Trạng thái chốt

- Mã nguồn có giá trị đã commit trên feature/final integration branches; không bỏ untracked source hoặc code của Codex/Gemini.
- Không có branch chức năng độc lập còn thiếu trong candidate history; không merge lại branches đã là ancestor.
- Không có conflict cần giải quyết; main fast-forward khả thi về Git nhưng **chưa được phép qua security gate**.
- Working tree/index trên integration candidate được làm sạch trước report commit. Các ignored private/runtime files vẫn giữ nguyên tại chỗ.
- Main chưa checkout/cập nhật trong lượt này; “Git status của main sau merge” là N/A vì merge chưa diễn ra, không báo giả main đã sạch/sẵn sàng.
- Blocker chính: thu hồi/rotate credentials đã exposed chưa được chứng minh. Hạn chế khác: 11 Worker legacy type errors, lint legacy, Vivo disconnected, Cloudinary QA chưa cấp, native/AI-frost/PAD production acceptance chưa được nghiệm thu.
