# FaceID với ngưỡng PAD thử nghiệm

Luồng: đăng nhập → lưu đồng ý → camera → quality PASS → model PAD thật đạt
ngưỡng → lưu mẫu mã hóa lần đầu. Lần sau camera → quality/PAD → so khớp mẫu đã
lưu; không ghi đè mẫu. Không cần hồ sơ duyệt danh tính hoặc hồ sơ đánh giá PAD
nội bộ để chạy thử chế độ này.

## Cấu hình

Cả `server/.env` và `ai-service/.env` dùng:

```env
FACE_PAD_MODE=experimental
FACE_PAD_THRESHOLD=0.85
AI_FACE_SERVICE_TOKEN=<cùng một secret riêng>
```

AI còn cần `FACE_MODEL_DIR` và `FACE_PAD_MODEL_PATH` trỏ artifact đã kiểm checksum.
Backend cần Face Core/capture bật và khóa mã hóa, nonce key (đã thiết lập local).
`0.85` là ngưỡng thử nghiệm ban đầu, không phải ngưỡng đã hiệu chỉnh cho FixGo.
Production (`NODE_ENV` hoặc `APP_ENV` là `production`) không cho bật chế độ này.
Chế độ mặc định `evaluated` giữ cơ chế đánh giá/allowlist cũ. Không thêm record
phê duyệt giả, không chuyển `padEvaluated` thành true.

## Chạy local

AI FaceID-only, dùng chung router và loader với main.py:

```bash
cd ai-service
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn face_app:app --host 127.0.0.1 --port 8000
```

Entry point này chỉ cung cấp API FaceID; nếu cần các API AI khác, chạy `main:app`
thay thế trên cùng cổng. Không chạy hai entry point cùng lúc. Cả hai đọc
`ai-service/.env`; biến môi trường process được ưu tiên. `.env` không được commit.

Backend đọc server/.env: khởi động lại bằng lệnh đang sử dụng (`npm run dev`
hoặc build rồi `npm start`). Không khởi động thêm backend trùng cổng 3000.
Đảm bảo `AI_SERVICE_URL`/`FASTAPI_AI_URL` trỏ dịch vụ AI local.

Trên điện thoại reload app → đăng ký → tích đồng ý → lưu đồng ý → chụp → gửi mẫu.
Chỉ camera trực tiếp, không dùng thư viện ảnh. Nếu thiếu native ExpoCamera phải
build lại ứng dụng Android. Sau khi đã có mẫu, dùng xác thực theo đơn ở ARRIVED.

## Kiểm soát và nhận diện trạng thái

- AI: `padExperimentalReady=true`, `padEvaluated=false`, mode và threshold rõ ràng.
- Backend chỉ nhận đúng MN3 artifact đã pin, mode opt-in và ngưỡng trùng nhau.
- Sai/mất model, lỗi inference, nhiều mặt, crop sai, điểm lỗi/không đạt → không PASS.
- UI hiển thị PAD chưa được kiểm chứng riêng trên FixGo.
- Proof mới ghi policyVersion có `pad-threshold-experimental:<ngưỡng>`.
- Khi đổi ngưỡng phải khởi động lại cả hai dịch vụ. Không sửa ngưỡng để ép một
  lượt thử thành công rồi coi đó là kết quả đánh giá độc lập.

## Xác minh

Backend unit gồm kiểm tra opt-in/mismatch. Python test_pad_threshold kiểm score
PASS/FAIL, dữ liệu lỗi, runtime lỗi và production guard. PostgreSQL integration
kiểm đăng ký/so khớp dùng threshold-mode, giữ mẫu cũ, label proof và không tự nhận
đã evaluated. Test fixtures không phải dữ liệu đánh giá PAD thật.

Dịch vụ AI local đã được chạy và kiểm tra capabilities HTTP 200 với model identity
thật và MN3 đã pin. Chưa kiểm thử lượt quét trên điện thoại thực.

Kết quả thực hiện: 263 backend unit tests, 70 PostgreSQL integration tests,
20 Python PAD/security tests, 15 mobile flow tests đạt; backend build đạt.
Đọc trạng thái bằng service backend với cấu hình local mới cho `tho1@fixgo.vn`:
`NOT_ENROLLED`, `padMode=experimental`, ngưỡng 0.85, blocker duy nhất
`CONSENT_REQUIRED`. Đây là lần gọi service kiểm tra cấu hình, không phải bằng
chứng backend process cũ đã được restart hoặc thiết bị đã cấp quyền camera.
