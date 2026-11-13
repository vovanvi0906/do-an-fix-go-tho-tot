# FACE-RESEARCH-E2E — kết quả triển khai 2026-11-13

**Đã có lab nghiên cứu chạy thực qua HTTP và PostgreSQL cô lập. Chưa có kiểm thử trên điện thoại gắn thật hoặc dữ liệu người tình nguyện; chưa có enrollment/proof thành công.** Không thay code production YuNet/SFace, Face Core v2/v3, FSM, Recommendation hoặc DB dự án.

| Yêu cầu | Trạng thái | Kết quả / giới hạn |
|---|---|---|
| YuNet → SFace → MN3 | DONE về code pipeline; PARTIAL về kiểm chứng | Crop bbox riêng cho PAD, resize128, identity/PAD/quality/version/latency độc lập; model thật chạy negative chain và component texture, chưa có positive face trial |
| API nghiên cứu xác thực | DONE | Nest/FastAPI app riêng; JWT nghiên cứu + service token, chỉ lab loopback/internal network; luôn measurement-only |
| Camera Enrollment/Daily/Order | PARTIAL | Flow và tests đã viết, session/nonce Backend thật; camera còn khóa chờ consent/protocol, chưa chạy trên máy thật |
| Chuỗi request và lỗi | DONE cho TCP/client module + tests; PARTIAL cho Android vật lý | 24 checks thực qua DB/HTTP, lỗi timeout/network/expiry/worker/nonce, concurrency và idempotency; chưa kiểm camera OS/network mobile thật |
| PostgreSQL nghiên cứu v2/v3 | DONE | Runner tự tạo DB random, baseline + đúng SQL v2/v3, schema diff rỗng trước research schema; teardown tự động |
| Consent và lưu/xóa | DONE về draft/code lab; PARTIAL về vận hành | Mẫu tiếng Việt + phụ lục research, xóa cache/measurements; chưa có tên đơn vị/contact/dates/phê duyệt, chưa tuyển người hoặc có kho media mã hóa |
| Kế hoạch accuracy | DONE về protocol; MISSING dữ liệu/metric | Có split, ground truth, calibration/frozen thresholds và outcome mapping; FMR/FNMR/TAR/APCER/BPCER chưa đo |

## Những gì thực sự chạy

1. Runner tạo PostgreSQL/PostGIS riêng và hai Worker fixture, Admin/review và Order tổng hợp; không dùng danh tính có thật. Áp v2/v3 và kiểm schema bằng Prisma diff, không ghi migration history DB dự án.
2. Nạp checkpoint YuNet/SFace đã pin và MN3 đã duyệt, đều từ mount read-only. Không tải thêm weights. FastAPI chạy container CPU2/1GiB, internal network không egress; Nest qua proxy loopback.
3. Dùng chính module HTTP client mới của Android gọi capabilities, POST session và POST synthetic với nonce do Backend cấp. Nest kiểm binding và gọi FastAPI qua TCP; real YuNet từ chối ảnh trống NO_FACE. Identity/PAD score null là kết quả đúng, không bịa PASS hay gọi SFace khi không có mặt.
4. Bài component riêng chạy real SFace alignCrop/128-dimensional feature/cosine và real MN3 trên texture ngẫu nhiên. Landmark là fixture chủ động, không phải YuNet tìm được mặt. Không báo score đó như FMR/PAD accuracy.
5. Tests positive pipeline dùng mocks để kiểm resize/crop/branch và sự độc lập identity/PAD. Không phải thử nghiệm sinh trắc.

Xem [kết quả 24 checks](research-e2e-results.json), [runbook/API contract](research-e2e-runbook.md), [PAD CPU benchmark trước đó](pad-technical-experiment.md).

## Kiểm thử đã chạy

| Kiểm thử | Kết quả |
|---|---|
| Research TCP + PostgreSQL v2/v3 + real models | 24 checks PASS; tự xóa tài nguyên |
| Backend research contract + existing Face transport/security/template suites | 59 tests /4 suites PASS |
| Worker research flow + existing FaceCoreFlow/FaceScreen | 27 tests /4 suites PASS, trong đó15 flow +2 config research tests; camera dùng mocks |
| Python `test_face*.py` | 32 discovered:29 PASS,3 SKIP có chủ đích (local-model/live tests cần opt-in riêng) |
| Python `test_pad*.py` | 11 PASS |
| Real model component smoke | PASS, synthetic texture, không cấp quyền |
| Nest Babel build | 147 files compiled PASS |
| Expo Android JS/Hermes export | PASS; artifact ngoài Git `/tmp/fixgo-face-research-android-verified`; không phải APK hoặc device test |
| `adb devices` | Không có thiết bị kết nối |

Không chạy lại toàn bộ PostgreSQL Face Core suite64 tests trong phase này vì không sửa core/schema v2/v3; 24 checks riêng ở trên dùng PostgreSQL thật. Không cộng mock tests thành trial accuracy. CPU benchmark MN3 trước đó không phải latency của whole Android chain; E2E JSON hiện chỉ có timings của lượt synthetic NO_FACE.

## Hành vi an toàn và dữ liệu

- Production gate giữ nguyên. Research result luôn `verified=false`, `enrolled=false`, `proof=null`; Backend whitelist số đo và từ chối sai provenance/worker/session/nonfinite score/authority fields.
- Research sessions nằm schema riêng, có HMAC nonce/TTL120s, claim row lock, retries3, idempotency payload digest. Timeout/mất mạng không tạo template/proof; retry cùng nonce có thể đọc lại measurement đã lưu khi response trước bị mất.
- Không lưu ảnh/embedding trong DB nghiên cứu. Enrollment research đo feature rồi bỏ; Daily/Order dùng hai camera capture trong cùng session để so cặp. Đây chưa phải luồng dùng template enrollment đã lưu bền vững. Luồng đó vẫn bị chặn vì PAD chưa được đánh giá, đúng phạm vi đã duyệt.
- Camera khóa ở cả hai dịch vụ. Sau phê duyệt collection riêng còn cần participant consent reference/version/expiry, review record Admin có binding đúng epoch và consent state chưa rút. Không có public API tự approve. Không bật flags trong thử nghiệm này.
- Xóa server session/result theo Worker; xóa camera cache sau submit/cancel/background/unmount. Nếu cache xóa lỗi, UI báo dừng và xử lý dữ liệu ứng dụng; physical Android validation vẫn cần làm. Không có raw media storage/backup workflow tự động trong lab.
- Client riêng không dùng project token, refresh, logging hoặc success callback check-in. Biến thể độc lập `com.fixgo.faceresearch`/`fixgoresearch` dùng `expo-router/entry` với root `research-app/`, route `/face-research`. Source map thực được kiểm tra không có production `app/`, AuthProvider/account storage, socket.io, Firebase, client API hoặc remote logger của Worker. Không cần đăng nhập DB dự án; root ứng dụng Worker hiện có không bị thay đổi.

## Những phần tiếp theo cần phê duyệt / thiết bị

1. Hoàn tất thông tin chủ nhiệm/đơn vị/contact, thời hạn consent và quyền truy cập/key/deletion; duyệt [consent và pilot](consent-and-android-pilot-draft.md). Chưa tuyển hoặc thu ảnh thật trước quyết định này.
2. Gắn Android thật, chạy lab qua adb reverse; trước mắt chỉ bấm synthetic, kiểm route/config và HTTP. Sau consent mới thử camera, orientation, permission, session expiry khi camera mở, airplane mode, retry, cache cleanup và withdraw.
3. Calibration riêng theo người, freeze cosine/PAD/crop/quality policy; held-out ground truth có consent cả người tham chiếu lẫn probe. Đo FMR/FNMR/TAR, APCER từng print/screen/video và BPCER, outcome/no-face và operational rejection, CPU + Android p50/p95, confidence intervals theo người/phiên. Không tự gán nhãn từ model score.
4. Chỉ sau kết quả được duyệt mới đề xuất provider PAD có decision/evaluation provenance, template enrollment mã hóa và chuỗi daily/order proof trên DB cô lập. Việc bật thành công và mọi migration production vẫn cần phê duyệt riêng; không tự mở gate sau benchmark.

Không push/merge. Không tạo migration mới cho DB dự án; `schema.sql` mới chỉ dùng trong DB research random do runner sở hữu.

## Kiểm tra tiếp tục sau phiên bị ngắt

Khôi phục từ HEAD `7ae16c7`, giữ nguyên thay đổi chưa commit; không triển khai lại hoặc reset/clean/rebase.
Đã chạy lại24 HTTP/PG checks,59 Backend tests,27 Worker tests, Python29 PASS/3 SKIP
và11 PAD tests, real-model component smoke và Nest build. Không có FAIL ở các lượt cuối.
Ba SKIP là local-model/live tests chưa bật opt-in trong unittest discovery; component smoke
và HTTP runner thực riêng đã dùng weights thật. Không cộng các lượt chạy lại thành số test mới.

Expo config introspection xác nhận **native manifest package** `com.fixgo.faceresearch`;
Hermes export + source-map verifier PASS,916 sources, không có Worker modules bị cấm.
[Manifest bundle/hash](research-android-export.json) là bằng chứng cấu hình/dependency graph,
không thay thế APK build hoặc Android physical-device E2E. Docs khởi chạy trước đây dùng scheme
Worker đã được sửa sang research variant riêng.

Teardown: không còn container/network nghiên cứu, Node/FastAPI/Metro lab hoặc config/fixture
private còn sót sau kiểm thử. Chỉ kiểm tra trạng thái các container FixGo có sẵn; không dừng/xóa
chúng. Weights/venv cache ngoài Git và bundle export `/tmp` là artifacts chủ động giữ lại,
không phải database/tiến trình rác. Không xóa tài nguyên ngoài namespace lab do runner sở hữu.

Metro development server cũng đã khởi động trên loopback8087 và trả manifest Android HTTP200 với application ID/root đúng; đã dừng bằng SIGINT. Đây là server startup/manifest test, không phải khởi chạy native Activity trên điện thoại.

Danh sách đầy đủ file trong các commit: [change inventory](research-change-inventory.md).
