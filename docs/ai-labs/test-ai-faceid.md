# FaceID tại `/test-ai` — local playground

Mở **http://localhost:5173/test-ai** khi Vite `client` đang chạy. Không cần đăng nhập tài khoản thợ.

## Cách thử

1. Chờ trạng thái **AI sẵn sàng**, tích đồng ý dùng camera cho phiên test.
2. Bấm **Bật camera**, cho phép camera. Giữ một mặt ở giữa, đủ sáng và đủ nét; tiến trình ổn định 1,3 giây sẽ tự chụp. Có thể tắt tự chụp và bấm chụp thủ công khi đủ điều kiện.
3. Bấm **Đăng ký mẫu test**. Server kiểm quality, PAD rồi giữ embedding tạm nếu đạt điều kiện thử nghiệm.
4. Bấm **Tiếp tục đối chiếu**, chụp lại và bấm **Đối chiếu khuôn mặt**. Thử cùng người, khác người, ảnh in/màn hình và điều kiện ánh sáng khác nhau.
5. Xem quality server, cosine, PAD real score, lý do không đạt, thời gian và phiên bản pipeline. **Xuất JSON** lưu tối đa 20 lượt gần nhất, không chứa ảnh/embedding/token.
6. **Xóa phiên & mẫu** trước khi đổi người đăng ký. Phiên tạm tự hết hạn sau 30 phút không hoạt động (dọn bộ nhớ định kỳ), xóa khi rời trang bình thường hoặc dừng Vite. Khi đóng trang đột ngột, TTL là cơ chế dọn cuối cùng.

Tự chụp chỉ chuẩn bị ảnh, không tự gửi. Camera dừng khi chuyển tab, rời trang, thu hồi checkbox đồng ý hoặc xóa phiên. Ảnh preview giữ trong bộ nhớ trình duyệt tới khi chụp lại/xóa/rời trang. Checkbox đồng ý không thay thế quy trình consent/review của Face Core nghiệp vụ.

## Phạm vi và model

- Client: MediaPipe BlazeFace `@mediapipe/tasks-vision@0.10.32`, WASM/model phục vụ local, GPU với CPU fallback. Kiểm một mặt, xa/gần, căn giữa, roll/yaw heuristic, sáng và Laplacian sharpness. Các ngưỡng client chỉ hướng dẫn, không đảm bảo server chấp nhận.
- Server: **YuNet + SFace 128D + MN3 PAD hiện có**. Không đổi sang UltraFace/MobileFaceNet/MiniFASNetV2 trong thay đổi này.
- Dùng `face_research.acquire` để cùng preprocessing/quality/crop với research hiện tại. Backend vẫn tính lại quality trên ảnh gốc, không tin số client.
- Ngưỡng test cố định: cosine **0,60**, MN3 real score **0,85**. Đây là ngưỡng **tạm, chưa hiệu chỉnh**, có thể từ chối người thật; kết quả không phải xác suất chính xác. Chưa có benchmark người thật/ảnh tấn công để kết luận hiệu quả.
- Enrollment test chỉ lưu mẫu khi quality đạt, feature hợp lệ và PAD vượt ngưỡng thử. Verify test thêm điều kiện cosine đạt. Thiếu model, sai ảnh, lỗi PAD không tạo kết quả đạt.
- Kết quả có `testAccepted`, `testPadDecision`; luôn `verified=false`, `proof=null`, `padDecision=NOT_EVALUATED`. Không gọi Face Core, không ghi database, không duyệt danh tính hoặc cấp quyền làm việc.
- Mỗi workspace/session dùng token ngẫu nhiên trong RAM; session 120 giây, một lần, gắn đúng workspace và phiên bản mẫu. Chỉ giữ một session mới nhất. Tối đa 16 workspace, inference tuần tự do trạng thái OpenCV dùng chung.
- Đây là kiểm tra local trên camera RGB; không tuyên bố bảo vệ injection, deepfake hay liveness đã được đánh giá.

## Chạy lại trên máy phát triển

Cần Node 20+, Docker, image `python:3.11-slim`, weights YuNet/SFace và runtime MN3 được chuẩn bị theo [PAD technical experiment](../implementation/face-id/pad-technical-experiment.md). Runtime cache mặc định `~/.cache/fixgo-pad-mn3` phải có `anti-spoof-mn3.onnx` và `venv` chạy được trong image Python 3.11 (đây không nhất thiết là venv chạy được trực tiếp trên host).

```bash
cd client
npm ci
npm run face:setup
npm run dev -- --host 127.0.0.1 --port 5173
```

`face:setup` tải BlazeFace chính thức, kiểm SHA-256 và lưu trong `ai-service/weights` đã git-ignore. WASM dùng từ package được khóa phiên bản. AI weights/runtime có sẵn được mount read-only; script không tự tải YuNet/SFace/MN3.

Vite dev plugin khởi động một container riêng khi trang gọi AI lần đầu, chọn cổng loopback còn trống, không đụng container/port/database hiện có. Container giới hạn 2 CPU/1 GB, filesystem read-only, không mount credentials của backend. Token AI riêng mỗi Vite process chỉ ở phía server, không trả cho trình duyệt. Đổi `FACE_TEST_RUNTIME_DIR` hoặc `FACE_TEST_MODEL_DIR` trong môi trường Vite nếu cần đường dẫn khác. Asset BlazeFace mặc định vẫn tại `ai-service/weights`.

Chỉ Vite dev phục vụ API/model asset và route `/test-ai`; production build không chứa playground. Proxy yêu cầu host/origin localhost và header client riêng; trình duyệt gọi cùng origin, không thay cấu hình CORS các service khác. Container được xóa khi Vite đóng bình thường/restart. Nếu process bị SIGKILL/mất điện, kiểm tra `docker ps --filter name=fixgo-face-test-` và xóa đúng container còn sót của phiên này.

Nếu AI chưa sẵn sàng: kiểm Docker, runtime/weights, sau đó bấm **Kết nối lại**. Khi session/workspace hết hạn hoặc mất kết quả enrollment do timeout, xóa phiên và đăng ký lại.

## Kiểm chứng

```bash
cd client
npm test
npm run build
# Vite cổng 5173 đang chạy; lần đầu cần: npx playwright install chromium
npm run test:face:e2e
```

Test Python (dùng runtime tương thích Python 3.11 đã cài cv2/OpenVINO/FastAPI/httpx):

```bash
cd ai-service
python -m unittest eval.test_face_test_app -v
```

Đã kiểm: 7 Python unit tests với pixel/model stub; frontend 7 tests gồm 3 quality/stability tests mới và 4 regression hiện có; 4 browser tests gồm WASM thật trên camera giả lập không có mặt, từ chối quyền camera, API model thật trên ảnh tổng hợp không có mặt/replay/xóa, và UI đầy đủ với detector/API mô phỏng. Chưa kiểm camera/khuôn mặt thật, độ chính xác biometric hoặc PAD. Không dùng dữ liệu người thật trong các kiểm tra này.
