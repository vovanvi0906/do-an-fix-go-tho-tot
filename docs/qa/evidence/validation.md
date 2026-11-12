# Kết quả kiểm tra — 13/11/2026

**VERIFIED** trên working tree sửa QA; không phải E2E thiết bị.

| Lệnh / kiểm tra | Kết quả |
|---|---|
| `customer-app: npm run test:ci` | PASS 19 suites, 112 tests |
| `customer-app: npx tsc --noEmit` | PASS, không diagnostics |
| `customer-app: npm run check:build` | PASS; development local endpoint fallback enabled |
| `customer-app: npx expo export --platform android --output-dir /tmp/fixgo-customer-qa-export` | PASS; Hermes Android bundle 4,11 MB + metadata/assets |
| `server: npm run build` | PASS, 125 file Babel |
| `server: npm test -- --runInBand` | PASS 8 suites, 57 tests |
| `python3 -m unittest discover -s ai-service/eval -p 'test_*.py'` | PASS 5 deterministic contract tests; không nạp weights |
| `python3 ai-service/eval/audit_dataset.py` | DETECTED INVALID DATASET (exit 1): cross-split hashes 210/109/109; đây là finding, không ghi PASS chất lượng model |
| Host multipart tới Backend live | HTTP 201, needs_more_info; xem multipart-live.json |
| 12 request inference AI live | HTTP 200; output thật trên synthetic có sẵn; một ảnh other_unclear bị nhận thành dien-lanh |
| `git diff --check` | PASS |
| `git diff --name-only -- ai-service` | Rỗng: không sửa nguồn/model/data AI |
| `adb devices` | Không có thiết bị; Android manual/E2E PENDING |

Expo export là compile/bundle check, không tạo/cài APK và không chứng minh camera/URI/network trên Android. Auth DB e2e không chạy vì có tác động tài khoản/OTP; các test được chạy dùng mock DB/transport khi ghi rõ. Log cục bộ ở `/tmp/fixgo-*.log` chỉ phục vụ phiên này; bảng này là snapshot kết quả đưa vào repo, không đóng gói log có thể chứa dữ liệu nhạy cảm.
