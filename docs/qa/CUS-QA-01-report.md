# CUS-QA-01 — AI Scan 2.0: điều tra upload và giới hạn xác minh

Ngày báo cáo: 13/11/2026, Asia/Ho_Chi_Minh. Baseline HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

**Trạng thái: PARTIAL — chưa đóng lỗi ERR_NETWORK Android.** VERIFIED: xác nhận bằng code/phép thử cụ thể; INFERRED: giả thuyết; NOT VERIFIED: thiếu bằng chứng; RECOMMENDED: bước tiếp theo.

## Bảng nguyên nhân trước sửa

| Điểm kiểm tra | Bằng chứng thực tế | Kết luận |
|---|---|---|
| `fetch(imageUri).blob()` native | `customer-app/src/services/api/aiService.ts:diagnoseIssueImage`: chỉ blob URI dùng fetch; file/content dùng `{uri,name,type}` | VERIFIED: không đúng với giả thuyết native luôn fetch blob |
| FormData field | App append `image`; controller FileInterceptor `image` | VERIFIED: khớp contract |
| Header/boundary | App override JSON bằng multipart; Axios cài tại workspace `lib/helpers/resolveConfig.js` xóa content type khi nhận RN FormData để native đặt boundary | VERIFIED: chưa đủ cơ sở kết luận header multipart là root cause |
| URI/MIME/name | Tên lấy từ segment cuối; content URI có thể chỉ là số, MIME mặc định JPEG; không kiểm URI input | VERIFIED: thiếu validation; sửa input và filename không có đuôi. NOT VERIFIED: đây gây lỗi trên ảnh V2536A |
| Retry/timeout | Upload 45s; URL JSON 30s; Backend AI 15s, tải ảnh 5s. Refresh token một lần khi 401 | VERIFIED: không retry network vô hạn; không tăng timeout |
| Storage | FileInterceptor lưu Cloudinary trước handler; handler nhận imageUrl, không nhận bytes trực tiếp sang AI | VERIFIED: lỗi storage có thể trước handler; chưa thấy handler log không đủ chứng minh server chưa nhận |
| Validation size/MIME | incidentStorage allowed formats jpg/jpeg/png/webp; route không có limits fileSize/fileFilter riêng | VERIFIED: khoảng trống còn lại; không bỏ validation đang có |
| Request logging | Middleware chỉ log `res.finish` có request ID, path/status/duration | VERIFIED: request native hỏng/chưa finish cần logcat và trace bổ sung |
| Backend→AI | `FastApiAiClient.diagnoseIncident` POST JSON /ai/diagnose; AI đọc JSON imageUrl nhưng không description | VERIFIED: lỗi contract description riêng, không giải thích ERR_NETWORK upload |

## Phép thử thật

**VERIFIED:** `/api/health` trả ok; AI `/health` báo model/6 cờ sẵn sàng. Request curl multipart field image + description + answers gửi ảnh tổng hợp có sẵn `ai-service/dataset/test/sua_dien/sua_dien_0001.jpg` tới Backend thật. Kết quả HTTP **201**, **5,163095 giây**, `status=needs_more_info`, `source=model`, `suggestedServiceId=null`. Ảnh được lưu qua storage Cloudinary hiện có. Xem [evidence/multipart-live.json](evidence/multipart-live.json).

Đây là phép thử transport/backend/storage/inference với ảnh tổng hợp, không phải Android E2E và không là benchmark accuracy. Không gọi ảnh tổng hợp này là ảnh sự cố thật.

**NOT VERIFIED:** Root cause lần ERR_NETWORK được báo; logcat, quyền đọc content URI, bytes ảnh lỗi, MIME/kích thước ảnh từ thiết bị và request ID tương ứng chưa có. `adb devices` không có thiết bị. Không khẳng định lỗi Android đã được sửa.

## Thay đổi có bằng chứng và tests

- VERIFIED: Reject URI rỗng/scheme không hỗ trợ trước network bằng `IMAGE_URI_INVALID`; content URI không có tên ảnh được đặt `incident.jpg`; giữ native URI upload và timeout hữu hạn. Không đổi URL production.
- VERIFIED: Test multipart dùng FormData React Native thật trong Jest (mock API transport), kiểm field image/description/answers và URI file/content. Đây không kiểm boundary over-the-wire native; curl kiểm multipart thực từ host.
- VERIFIED: Tests 400/409/422/500/503, timeout, unavailable, invalid contract và URI invalid không sinh chẩn đoán thay thế. Error mapping giữ status/code của apiClient.

## Retest Android cần thực hiện

1. Kết nối V2536A, kiểm `adb devices`, reverse 3000/8081/8082 theo dev-local hiện có; ghi build SHA và API base URL (không ghi token).
2. Chụp JPEG, chọn PNG/WebP từ thư viện và chọn từ content provider; ghi loại URI, MIME và kích thước, không đưa ảnh riêng tư/token vào log.
3. Bấm scan, thu request ID app và middleware server. Đối chiếu thời điểm logcat ReactNativeJS/OkHttp với storage/AI response. Nếu không có HTTP finish, kiểm request abort thay vì chỉ xem handler.
4. Thử file không đọc được, quyền bị thu hồi, file lớn, mạng ngắt, timeout, backend 4xx/5xx và AI tắt trong môi trường thử riêng. Không tắt dịch vụ dùng chung chỉ để thử.
5. Xác nhận low confidence/unavailable cho chọn tay; chưa chọn service thì không cho tạo đơn; đổi dịch vụ vẫn giữ ghi chú/ảnh/địa chỉ.
6. Đóng P0 chỉ sau khi tái hiện lỗi cũ, xác định nguyên nhân có trace và chứng minh bản sửa xử lý đúng trên thiết bị. Hiện **manual test pending**.
