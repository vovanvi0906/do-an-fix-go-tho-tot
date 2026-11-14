# DEV-LOCAL-FACEID-01: chạy Worker FaceID Lab bằng `dev-local.sh`

- Branch `feature/worker-faceid-lab` · 2026-11-14 · **chưa commit**.
- Kết quả: `./dev-local.sh faceid` khởi động FaceID Lab cô lập trong khoảng 8–10 giây, có health check thật. `./dev-local.sh` không tham số giữ nguyên hành vi cũ (đã chứng minh bằng test so sánh với `HEAD`).

## 1. Audit launcher cũ

`dev-local.sh` (62 dòng) không parse tham số. Luồng của nó:

1. Nạp NVM, tạo `logs/`.
2. Copy `server/.env` từ `.env.example` nếu thiếu.
3. `docker compose up -d postgres redis` (container `ondemand_postgres` :5432, `ondemand_redis`).
4. Tạo `ai-service/.venv` nếu thiếu; tải YOLO.
5. **`npx prisma db push` vào DB chính** (`server/.env`).
6. `scripts/update-ip.js`.
7. `concurrently` ở foreground: Server :3000 (`npm run dev`), AI :8000 (`uvicorn main:app`), Admin :5173 (`client`).

`customer-app` và `worker-app` được chạy tay bằng Expo. `dev-local-usb.sh` là luồng Android USB riêng, không đụng tới.

Hệ quả: FaceID **không thể** đi theo luồng mặc định (db push vào DB chính, cổng cố định), nên phải rẽ nhánh **trước** bước 2.

Tài nguyên FaceID có sẵn và được tái sử dụng: `server/scripts/face-lab/lab-stack.cjs` (từ LAB-02), `prepare.cjs` và `start.cjs` của research harness, `ai-faceid-lab` (Vite).

Model YuNet/SFace **không có** trong `ai-service/weights` của worktree này, nên đường dẫn model phải cấu hình được.

## 2. CLI

```bash
./dev-local.sh                   # hành vi cũ, không đổi
./dev-local.sh --help            # danh sách lệnh, không side effect
./dev-local.sh faceid            # khởi động FaceID Lab (chạy nền), in URL thật
./dev-local.sh faceid --status   # process, port, container, health, PAD/proof policy
./dev-local.sh faceid --stop     # dừng đúng những gì launcher đã tạo
./dev-local.sh faceid --help     # cấu hình FaceID Lab
./dev-local.sh all               # FaceID Lab (nền) rồi luồng mặc định; khi luồng mặc định thoát (Ctrl+C) → faceid --stop
```

Thay đổi tương thích: trước đây mọi tham số đều bị bỏ qua. Giờ **tham số lạ trả exit 2** kèm hướng dẫn, thay vì âm thầm chạy luồng mặc định (gồm `db push`). Không tham số thì không đổi gì.

`all`: FaceID Lab khởi động trước. Nếu lỗi, `all` dừng và **không** chạy tiếp luồng mặc định. Không có xung đột cổng (3107/3118/5199 so với 3000/8000/5173) hay DB (DB tạm riêng so với `ondemand_db`).

## 3. Files changed

| File | Thay đổi |
|---|---|
| `dev-local.sh` | +32 dòng: khối `case` ngay sau NVM; không sửa hay xóa dòng cũ nào |
| `scripts/faceid-lab/faceid-lab.sh` (mới) | Lifecycle: preflight, start, status, stop, rollback |
| `scripts/faceid-lab/health.cjs` (mới) | Health probe; đọc token từ file 0600 và không in token |
| `scripts/faceid-lab/test-launcher.sh` (mới) | 27 test không phá hủy (regression, CLI, config, port, model, isolation) |
| `server/scripts/face-lab/lab-stack.cjs` | Bắt SIGINT/SIGTERM **từ lúc khởi động** (không rò container); dòng ready có danh tính DB (tên, host, container; không mật khẩu) sau khi query `current_database()` và marker `face_research.environment` |
| `ai-faceid-lab/playwright.config.ts`, `e2e/faceid-lab.spec.ts` | `FACEID_LAB_BASE_URL`: test đúng URL do launcher phục vụ |
| `ai-faceid-lab/README.md` | Hướng dẫn launcher |
| `docs/ai-labs/faceid-dev-launcher-report.md` | Báo cáo này |

## 4. Cổng

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `FACE_LAB_RESEARCH_PORT` | 3107 | Research API (AI qua proxy nội bộ) |
| `FACE_LAB_CORE_PORT` | 3118 | Face Core API `/api` |
| `FACE_LAB_WEB_PORT` | 5199 | Vite, `--strictPort`, chỉ 127.0.0.1 |

- Kiểm tra trước khi chạy bằng `ss -ltnp`. Nếu cổng bận: **exit 3**, nêu tên và PID của tiến trình đang giữ cổng, gợi ý đổi cổng; **không bao giờ kill**.
- Cổng phải nằm trong 1024–65535 và khác nhau.
- Cổng Recommendation (3108/8108/5178) không hardcode. Nếu bận, launcher từ chối và PID chủ cổng vẫn sống (đã test khi Codex chạy, §8).
- Cấu hình bằng biến môi trường, hoặc file `.faceid-lab.local.env` (bị gitignore qua `*.env`). File này chỉ nhận 6 khóa `FACE_LAB_*` theo whitelist; khóa lạ như `DATABASE_URL` bị từ chối.

## 5. Cô lập database

- Mỗi lần start tạo **một container PostgreSQL mới** (`postgis/postgis:16-3.4`, cổng ngẫu nhiên trên 127.0.0.1) qua `prepare.cjs` đã được kiểm thử. DB `fixgo_face_research_<hex>` có bảng marker `face_research.environment`.
- Launcher **xóa** `DATABASE_URL`, `FACE_TEST_DATABASE_URL`, `DIRECT_URL` khỏi môi trường của stack. Đã kiểm `/proc/<pid>/environ`: có 0 biến `DATABASE_URL`, dù test cố tình export một URL trỏ `ondemand_db`.
- Không đọc hay ghi `server/.env`; không chạy compose, `db push` hay migrate trên DB chính.
- Bằng chứng cô lập phải đạt trước khi chạy Vite. `lab-stack` query `current_database()` và marker; launcher kiểm `verify_db_isolation`: tên khớp `^fixgo_face_research_[a-f0-9]+$`, host `127.0.0.1`, `isolated=true`, container khớp `^fixgo-face-research-[a-f0-9]+$` và tồn tại, khác `ondemand_postgres` / `ondemand_db`. Không chứng minh được thì dừng và rollback.
- Cleanup chỉ xóa đúng các container và network đã ghi trong state (tên ngẫu nhiên của phiên đó).

## 6. Luồng khởi động và dừng

**Start:**

1. Nếu state cho thấy lab đang chạy (PID, start time và cmdline đều khớp) → báo "already running" kèm status.
2. Nạp cấu hình, rồi preflight:
   - Node ≥ 20, `ss`, Docker daemon, image `python:3.11-slim` và `postgis/postgis:16-3.4`
   - Dependencies của server (Prisma client, `@babel/register`) và của `ai-faceid-lab` (vite)
   - **SHA-256** của YuNet, SFace và MN3; venv của runtime PAD
   - Cổng trống
3. `setsid node lab-stack.cjs` chạy trong session riêng, log ở `logs/faceid-lab/lab-stack.log`. Chờ dòng `ready`; **PID do script tự báo phải bằng PID launcher đã spawn** (không có wrapper ở giữa). Ghi PID, start time trong kernel (`/proc/pid/stat` trường 22) và cmdline.
4. Kiểm tra cô lập DB (§5) và quyền 600 của file fixture.
5. `setsid node node_modules/vite/bin/vite.js --strictPort`; URL đọc từ dòng `Local:` của Vite.
6. Health thật (`health.cjs`):
   - Research capabilities có token: model `yunet-sface:<sha>:<sha>` và `padReady`
   - Face Core: 401 khi không có token, 200 khi có token
   - Web: HTML của Lab và proxy `/face-research`

   Chỉ in RUNNING khi health đạt.
7. Lỗi ở bất kỳ bước nào, `exit`/`die`, hoặc SIGINT/SIGTERM → EXIT trap dừng đúng những gì phiên đó đã tạo (Vite group, stack bằng SIGINT để stack tự xóa container), rồi xóa state.

**Stop:** chỉ gửi tín hiệu khi `owned()` khớp đủ PID, start time và cmdline.
- Vite: SIGTERM tới process group riêng (gồm esbuild).
- Stack: SIGINT; nếu quá 60 giây thì SIGTERM.
- Sau đó xóa các container/network còn sót **theo đúng tên đã ghi**, rồi xóa state.
- State stale (PID đã chết hoặc đã bị tái sử dụng) → không gửi tín hiệu nào.

State nằm ở `$XDG_RUNTIME_DIR/fixgo-faceid-lab-<uid>-<hash repo>/state` (thư mục 0700, file 0600, ngoài Git), riêng cho từng worktree. File chỉ được đọc lại theo whitelist khóa.

## 7. Bảo đảm bảo mật

- Không đổi bất kỳ gate nào: data policy vẫn `false`, gateway vẫn `padEvaluated=false`, ngưỡng 0.60 giữ nguyên, Face Core dùng `JwtStrategy`/`RolesGuard` production, không có mock success.
- Launcher chỉ **báo** trạng thái policy, ví dụ `PAD policy: NOT_EVALUATED (PAD_BLOCKED_DATA)`, `FaceID proof: BLOCKED BY POLICY`, `Camera upload: BLOCKED`.
- Không in JWT, mật khẩu, URL DB hay token. Chỉ in **đường dẫn** file fixture (0600, nằm trong thư mục tạm 0700, bị xóa khi stop). Tên DB và container là định danh ngẫu nhiên, không phải secret.
- Không dùng `pkill` hay kill theo pattern. Cleanup docker chỉ nhắm tên đã ghi trong state.

## 8. Kết quả kiểm thử (2026-11-14)

| Kiểm thử | Loại | Kết quả |
|---|---|---|
| `bash -n` (`dev-local.sh`, `faceid-lab.sh`), `node --check` | Tĩnh | PASS |
| shellcheck v0.10.0 (container) | Tĩnh | `faceid-lab.sh`, `test-launcher.sh`: **sạch**. `dev-local.sh`: 2 cảnh báo SC2164 ở dòng **có sẵn** (`cd` dòng 4 và 69 tương ứng dòng 4 và 37 ở `HEAD`); phần thêm mới sạch |
| `scripts/faceid-lab/test-launcher.sh` | Tự động, không phá hủy | **27/27 PASS** khi Codex đang chạy (gồm 2 case cổng Codex 3108/5178; PID 131703 và 94406 không bị đụng). Lần chạy cuối 25/25, vì Codex đã tắt dịch vụ nên 2 case đó không được sinh |
| ↳ Regression mặc định | Sandbox, stub ghi lệnh | Chuỗi lệnh và output **giống hệt** `HEAD:dev-local.sh`; vẫn gồm `compose up`, `prisma db push`, `concurrently` |
| ↳ `faceid` không đụng compose/prisma; `--help`/lệnh lạ/`all extra` không side effect; `all` dừng khi FaceID lỗi | Sandbox | PASS |
| ↳ Thiếu model / model bị sửa (SHA) / thiếu runtime PAD / thiếu dependencies / cổng sai / cổng trùng / TTL sai / khóa config lạ | Thật (preflight) | PASS, thông báo rõ ràng |
| ↳ Xung đột cổng (listener của test) → exit 3, nêu `python3 (pid …)`, chủ cổng vẫn sống | Thật | PASS |
| ↳ `verify_db_isolation`: chấp nhận DB tạm; từ chối `ondemand_db`, host không phải loopback, marker chưa chứng minh, container lạ | Unit | PASS |
| Start thật (`DATABASE_URL` trỏ `ondemand_db` được export) | Runtime thật | **PASS**, khoảng 8,5 giây; 4 thành phần RUNNING; `DATABASE_URL` có 0 lần trong env của stack; session/pgid riêng |
| `--status` | Runtime | PASS (health, PID, 2 container running) |
| Start lần hai khi đang chạy | Runtime | PASS: "already running", không tạo bản sao |
| **Browser** Playwright vào URL launcher in ra (`http://127.0.0.1:5199/`) | Chromium thật | **22/22 PASS**. UI hiển thị `PAD_BLOCKED_DATA`, `NOT_EVALUATED` và proof BLOCKED đúng |
| `--stop` | Runtime | PASS: 0 container, 0 network, cổng được giải phóng, fixture riêng tư bị xóa, PID Codex không đổi |
| Stack lỗi (runtime PAD hỏng, container AI không chạy) | Runtime | PASS: `LAB_STACK_FAILED`, rc 1, cleanup sạch |
| Vite lỗi sau khi stack đã sẵn sàng (cổng bị socket bind giữ) | Runtime | PASS: rollback dừng stack, 0 container |
| SIGINT giữa lúc khởi động (container đã tạo dở) | Runtime | PASS: rc 130, cleanup sạch |
| State stale trỏ tới PID sống không liên quan | Runtime | PASS: không gửi tín hiệu, process đó vẫn sống |
| `./dev-local.sh all` chạy thật | — | **NOT_RUN**: chạy thật sẽ `db push` vào DB chính và khởi động server/AI/admin. Chỉ kiểm bằng sandbox (dispatch, abort khi lỗi, từ chối tham số) |

**Lưu ý về các tiến trình Codex:** lúc bắt đầu, Codex nghe trên 3108, 8108 và 5178. Ngay sau `--stop` thật, PID của Codex không đổi. Cuối phiên, các tiến trình Codex đã tắt và container `fixgo-rec-lab03-postgres` dừng với **Exit 0** (dừng có kiểm soát), trong khi worktree Codex vẫn đang được sửa. Launcher không có lệnh nào có thể chạm vào chúng (kill chỉ sau `owned()`; `docker rm` chỉ cho tên `fixgo-face-*` đã ghi), và test không gửi tín hiệu nào ngoài tới tiến trình chính nó tạo.

Sự cố nhỏ trong lúc test: một thư mục cache `@babel/register` (do các lần chạy stack trước tạo trong `server/node_modules` của worktree) đã chặn symlink `node_modules` tạm. Đã dọn; không ảnh hưởng tới repo.

## 9. Giới hạn đã biết

- Preflight **không tự cài** (`npm ci`, `docker pull`, model) mà chỉ báo lệnh cần chạy. Model YuNet/SFace phải cấu hình qua `FACE_LAB_MODEL_DIR` nếu worktree không có.
- Worktree cần `server/node_modules` có Prisma client đã generate (`cd server && npm ci && npx prisma generate`).
- Lab chạy nền; không có chế độ foreground.
- `all` chưa chạy thật (lý do ở §8). Khi luồng mặc định kết thúc, trap gọi `faceid --stop`.
- Cổng có thể bị chiếm giữa preflight và lúc bind (race). Khi đó Vite hoặc Nest lỗi, launcher rollback (đã test).
- Đóng terminal **không** dừng lab (session riêng). Dùng `--stop`.
- Mọi giới hạn FaceID của LAB-02 vẫn áp dụng: PAD BLOCKED_DATA, không có luồng thành công thật.

## 10. Hướng dẫn trên Ubuntu

```bash
# Một lần
sudo apt install -y iproute2                       # ss
docker pull python:3.11-slim && docker pull postgis/postgis:16-3.4
(cd server && npm ci && npx prisma generate)
(cd ai-faceid-lab && npm ci)
cat > .faceid-lab.local.env <<'EOF'                # git-ignored
FACE_LAB_MODEL_DIR=/đường/dẫn/tới/weights            # chứa face_detection_yunet_2023mar.onnx + face_recognition_sface_2021dec.onnx
FACE_LAB_PAD_RUNTIME_DIR=~/.cache/fixgo-pad-mn3      # anti-spoof-mn3.onnx + venv/
EOF

# Hằng ngày
./dev-local.sh faceid              # mở URL được in ra; dán token từ file fixture (đường dẫn được in)
./dev-local.sh faceid --status
./dev-local.sh faceid --stop

# Đổi cổng nếu bận
FACE_LAB_WEB_PORT=5299 FACE_LAB_CORE_PORT=3128 ./dev-local.sh faceid

# Kiểm thử
FACE_LAB_MODEL_DIR=… bash scripts/faceid-lab/test-launcher.sh
FACEID_LAB_BASE_URL=<URL> FACEID_LAB_FIXTURES=<fixture> npx --prefix ai-faceid-lab playwright test   # chạy trong ai-faceid-lab/
```

## 11. Lưu ý khi merge

- `dev-local.sh` là file dùng chung. Thay đổi là **một khối thêm vào**, không sửa dòng cũ, nên ít rủi ro conflict. Nếu nhánh khác cũng sửa phần đầu file, chỉ cần giữ khối `case` ngay sau phần nạp NVM.
- Hành vi mới: tham số lạ trả exit 2 (trước đây bị bỏ qua). Cần thông báo cho team.
- `lab-stack.cjs` đổi định dạng dòng ready theo kiểu additive (thêm `database`, `containers`, `network`).
- Không có thay đổi nào với `.gitignore`, `.env`, compose, migration hay Recommendation.
- Test lại sau merge: `bash scripts/faceid-lab/test-launcher.sh`, rồi `./dev-local.sh faceid` → `--status` → Playwright → `--stop`.
