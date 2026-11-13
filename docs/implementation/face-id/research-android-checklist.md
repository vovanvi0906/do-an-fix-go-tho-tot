# Android Face Research checklist

## Đã kiểm bằng code, HTTP và export

- [x] Research package `com.fixgo.faceresearch`; scheme `fixgoresearch`; router root `research-app/`.
- [x] Expo native-manifest introspection đúng package; normal Worker config regression PASS.
- [x] Android Hermes bundle/source map không chứa production app root, AuthProvider/account storage, API client, Firebase, socket.io hoặc remote logger.
- [x] Research JWT/service token độc lập, client chỉ loopback/emulator; không refresh token project.
- [x] Session/nonce lưu PostgreSQL; ENROLLMENT/DAILY/ORDER; scope/ownership/TTL/idempotency kiểm thật qua HTTP.
- [x] Camera khóa trước multipart khi consent/protocol chưa được duyệt; synthetic endpoint không nhận ảnh client.
- [x] Identity/PAD/quality/version/latency riêng; authority fields luôn false/null, production template/proof count bằng0.
- [x] Retry, mất mạng, timeout và duplicate/concurrency kiểm HTTP; camera lifecycle kiểm Jest với mocks.
- [x] Lab container/network/private config tự dọn; không chạm database FixGo.

## Cần Android vật lý, có thể làm trước consent bằng synthetic mode

- [ ] Dùng native build/workspace riêng; kiểm APK application ID trước cài, không thay APK Worker thật.
- [ ] Khởi động `fixgoresearch` độc lập, không yêu cầu tài khoản FixGo; xác nhận không có traffic tới API/socket/logging production.
- [ ] adb reverse, research token, ba purpose và đúng Order fixture; synthetic trả NO_FACE và false/null.
- [ ] Offline/airplane mode, reconnect, retry đúng nonce, token hết hạn, session hết hạn; không hiển thị success giả.
- [ ] Không có ảnh thật được chụp; camera vẫn disabled. Ghi OS/API, thiết bị, app/build/hash, network và timestamp.

## Chỉ sau khi consent/protocol được phê duyệt riêng

- [ ] Điền đơn vị/chủ nhiệm/contact, thời hạn, review/consent references, vai trò/key custody và quyền xóa.
- [ ] Consent của mọi người xuất hiện trong ảnh/pair, bao gồm cặp impostor; không coi một tài khoản là quyền chụp người khác.
- [ ] Camera trước, permission deny/revoke, orientation/EXIF, một/multiple/no-face, ánh sáng/blur.
- [ ] Enrollment một ảnh đo acquisition; Daily/Order hai ảnh reference/probe cùng session, chưa coi là stored trusted template.
- [ ] Chuyển nền, force-stop, session expiry trong native camera; xác minh cache thực xóa, kể cả lỗi/xóa thất bại.
- [ ] Xóa measurement/withdraw, thu hồi quyền, không sử dụng dữ liệu đã rút; kiểm kê mọi bản export/backup/attack media.
- [ ] Calibration/held-out độc lập theo người; freeze threshold/crop/quality, đo FMR/FNMR/TAR/APCER/BPCER và uncertainty.
- [ ] Không mở production proof gate. Stored enrollment và evaluated-PAD decision/proof cần review/phê duyệt mới.
