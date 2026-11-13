# S03-STABILIZATION — 2026-11-14, Asia/Ho_Chi_Minh

## Kết luận nghiệm thu

Chưa thể nghiệm thu toàn bộ happy path Android/Face ID. Evidence có sẵn khi bắt đầu phiên ghi nhận ARC-01 **19/19 PASS** và Face PostgreSQL **64/64 PASS** (`evidence/arc01-face-regression.log`). Đây là kết quả fixture trạng thái xác thực synthetic, không phải chứng nhận nhận diện mặt/PAD thật. Phiên này **không chạy lại** ARC-01/PostgreSQL: runner `server/test/face/run-isolated.cjs` áp dụng/rollback migration, trái giới hạn không chạy migration. Không dùng DB FixGo hoặc container test đang phục vụ runtime để ghi thêm fixture. Cần môi trường disposable đã chuẩn bị schema và dành riêng cho ARC-01 để tái xác nhận mà không chạy migration.

Không chạy migration, seed/reset, không thay đổi DB FixGo, không push/merge/commit trong phiên này. Các listener và container có sẵn được giữ nguyên.

## Git và tích hợp

- Worktree: `/home/vanvi/Work/fixgo-integration-s03`; branch `test/integration-s03-full-ai`; HEAD `d5d5c7b`.
- Merge S03 `01ec893` có hai phía Recommendation V2 (`9e77da5`) và Face Core (`9db1016`). Chi tiết conflict/schema: [báo cáo tích hợp](../README.md).
- Khi bắt đầu đã có sửa chưa commit ở `dev-local-usb.sh`, `server/test/arc01.e2e-spec.js`, `server/test/face/run-isolated.cjs`; file mới gồm port preflight, persisted fixture, runtime smoke và thư mục báo cáo này. Những sửa đó được review, không nhận là thay đổi mới của phiên này.
- Phiên này bổ sung báo cáo và các evidence có hậu tố `-new`; không thay production Face gates.

## Phân tích ba ARC-01 FAIL và bản sửa hiện có

| Lỗi gốc | Nguyên nhân | Cách xử lý trong fixture hiện tại |
|---|---|---|
| Hai worker accept một đơn: 400/400 thay vì 201/409 | Chỉ có timestamp legacy, không DAILY proof; workflow test thiếu FaceCore wiring | Inject FaceCore thật, tạo consent/review/template và DAILY proof synthetic trên disposable |
| BEFORE/quote/AFTER/settlement trả FACE_CHECKIN_EXPIRED | Face gate chặn trước khi đến precondition FSM | ORDER proof đúng worker/order; kiểm thiếu BEFORE rollback việc consume; start hợp lệ consume đúng một lần và có audit |
| Một worker accept hai đơn: 400/400 | Thiếu DAILY proof như lỗi đầu | DAILY proof trước race; giữ nguyên khóa/transaction và assertion một winner |

`arc01-persisted-fixture.js` chỉ tạo trạng thái đã persist cho kiểm thử FSM, không gọi inference và không phê duyệt capture/PAD. Fixture yêu cầu URL ARC01 bằng URL FACE_TEST, loopback, cổng explicit và database tên `fixgo_face_test`, rồi xác nhận tên database bằng SQL. Test bổ sung từ chối timestamp legacy, thiếu wiring, DAILY thay ORDER và capture chưa được duyệt. Production source không thay đổi. Không coi persisted proof synthetic là evidence Face ID thành công.

## Regression chạy mới

| Phạm vi | Kết quả | Evidence |
|---|---|---|
| Backend Jest | 17 suites / 177 PASS | `backend-regression-new.log` |
| Customer Jest | 20 suites / 115 PASS | `customer-regression-new.log` |
| Worker Jest | 20 suites / 153 PASS | `worker-regression-new.log` |
| Python discover | 61 tests: 58 PASS, 3 SKIP | `python-regression-new.log` |
| Backend Babel build | PASS, 156 files | `backend-build-new.log` |
| Bash syntax + git diff whitespace | PASS | `bash -n dev-local-usb.sh scripts/dev-usb-connect.sh`; `git diff --check` |
| ARC-01 + Face PostgreSQL | Không chạy mới; evidence kế thừa 19 + 64 PASS | `arc01-face-regression.log` |

Python SKIP thuộc live Face bridge và hai model smoke cần explicit `FACE_TEST_MODEL_DIR`. Discover có chạy Recommendation inference thật với YOLO/CLIP local, OOD/unreadable và production router smoke. Không chứng nhận độ chính xác trên tập ảnh người thật. Không chạy build APK hoặc thao tác UI thiết bị trong phiên này.

## USB source và security gates

`dev-local-usb.sh` đổi cwd theo chính vị trí script, dùng `server/src/main.js` qua Babel/nodemon, `ai-service/main.py` qua `.venv` tại S03; Customer/Worker có cổng cố định 8081/8082 và `--localhost`. Port preflight chặn listener cũ; CI/strictPort chặn tự chuyển cổng. Prisma chỉ validate/generate, không migrate/db push/seed. Docker tái sử dụng stack đang chạy; không chạy script bootstrap `dev-local.sh`.

Kiểm tra mới trực tiếp `/proc/<PID>/cwd` và cmdline xác nhận **3000, 8000, 8081, 8082, 5173 đều thuộc S03**: `listeners-new.json`. Đã có một phiên `bash dev-local-usb.sh` chạy khi kiểm tra; không khởi động thêm hoặc dừng phiên đó. Runtime đang nối **database disposable**, không phải DB FixGo (`runtime-gates-new.json`).

OpenAPI runtime có `/ai/v2/diagnose`, `/ai/face-verify`, `/api/v1/ai/verify-face`, `/ai/face-enroll`, `/ai/face-capabilities`; không có research route. Test production router xác nhận thiếu service token trả 503, trusted request vẫn `verified=false`, PAD `NOT_EVALUATED`, không embedding/proof. Evidence runtime cũ cũng ghi nhận token không hợp lệ trả 401.

FaceCore/capture/research flags của runtime đều false. `requireDaily` kiểm consent, current template, version/model/epoch, purpose DAILY, TTL và revoke; `consumeOrder` thêm order binding, assignment, atomic consume và audit trong cùng transaction FSM. Gateway vẫn `padEvaluated=false`; `ready()` chặn capture chưa duyệt/PAD chưa evaluated. Không bật flags để làm test xanh.

Blocker happy path: báo cáo schema kế thừa cho biết DB FixGo còn thiếu Face Core objects; phiên này không kiểm lại hay sửa DB. Ngoài schema còn cần policy capture/consent/key custody và PAD được đánh giá/phê duyệt. Bật `FACE_CORE_ENABLED` đơn thuần không giải quyết các blocker này.

## Ubuntu + Android thật + ADB Reverse

1. Mở terminal tại S03. Dùng Node/dependencies và `ai-service/.venv` riêng S03; chuẩn bị model local. Không dùng bootstrap có migrate/seed. Kiểm tra `git branch --show-current` trước khi build APK.
2. Bật Developer options/USB debugging; cắm cáp dữ liệu, mở khóa và chấp nhận RSA. Nếu Linux không thấy thiết bị, kiểm tra udev/platform-tools; tránh chạy ADB bằng sudo.

```bash
cd /home/vanvi/Work/fixgo-integration-s03
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
adb devices -l
bash scripts/dev-usb-connect.sh --device 10AG3G1KS800336
adb -s 10AG3G1KS800336 reverse --list
```

Thay serial khi đổi máy. Kiểm tra mới thấy máy `V2536A` ở trạng thái `device`, reverse 3000/8081/8082 đúng. Cắm lại USB cần chạy lại reverse. FastAPI 8000 là kết nối backend → AI trên Ubuntu, không cần reverse cho app.

3. Hai file `customer-app/.env.local` và `worker-app/.env.local` phải có:

```dotenv
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api
EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:3000
```

Backend dùng `AI_SERVICE_URL=http://127.0.0.1:8000`; token Face chỉ ở server/AI. Giữ các Face approval flags false. Chọn DB QA đã điều phối; không dùng DB FixGo để tạo đơn trong phạm vi nhiệm vụ không thay database này.

4. Nếu chưa có runtime và các cổng đã rảnh: `bash dev-local-usb.sh`. Nếu runtime hiện tại vẫn chạy đúng S03 thì dùng phiên đó, không chạy thêm. Khi có nhiều thiết bị, chạy connector với `--device` riêng; script tổng sẽ yêu cầu chọn thiết bị nếu terminal tương tác.
5. Dùng development APK được build từ S03, không Expo Go. Khi cần native build mới, trong từng thư mục app chạy `npx expo run:android --device --port 8081` (Customer) hoặc `FACE_RESEARCH_APP=false npx expo run:android --device --port 8082` (Worker); dùng `--no-bundler` nếu Metro tương ứng đã chạy. Build APK có thể cần Android SDK/JDK và tải Gradle dependencies. Mở dev client kết nối `http://127.0.0.1:8081` hoặc `http://127.0.0.1:8082`. APK/export cũ không chứng minh native code S03 đã kiểm thử.
6. Customer: login; ảnh → category → target → symptom → service; thử OOD, ảnh hỏng, chọn thủ công; kiểm reload/back/background và mất mạng. Booking/history/socket ghi dữ liệu chỉ chạy ở QA disposable đã điều phối.
7. Worker: login, preflight/daily/order; xác nhận hiển thị blocker rõ, không tự mở camera/cấp proof; timestamp legacy không cho online/accept/start. Không kỳ vọng happy path khi Face gates đang khóa. Kiểm retry/background/mất mạng/USB reconnect.
8. Ghi serial, model/Android version, Git HEAD, package/build APK, URL Metro, bước thực hiện/kỳ vọng/thực tế/logcat cho từng case. Chưa có kết quả camera/native lifecycle, OAuth trên máy thật hoặc real Face/PAD trong báo cáo này.
