# UX theo trạng thái và khoảng trống hiện tại

Audit tĩnh, chưa xem giao diện trên thiết bị hoặc đo contrast/accessibility: NOT_VERIFIED. Bằng chứng: WorkerDashboardScreen, WorkerJobDetailScreen, FaceVerificationScreen, WorkerTabsLayout và 4 tab placeholder trong [01](01-codebase-audit.md).

Giữ Expo Router và navigation hiện tại trước; không đổi 5 tabs thành 4 chỉ theo đề xuất. Một nguồn server-state cho active order, banner mở lại công việc từ mọi tab. React Query đã có dependency nhưng không mặc định provider/cache worker đã được cấu hình cho luồng này.

| Trạng thái | UI/CTA mục tiêu | Gap source / tiêu chí UX |
|---|---|---|
| Auth đang restore | Loading rõ rồi đúng route | WorkerLayout hiện return null khi loading; cold start/error cần kiểm thử |
| Offline / online pending | Toggle disabled/spinner, chờ API | Home có pending/alert nhưng isOnline khởi tạo false, không hydrate |
| Check-in hết hạn | Hiển thị expiry server, selfie camera, retry/manual status | Hai flow selfie; không tin faceVerified route param; gallery không chứng minh liveness |
| Online idle | Vị trí/quyền và stats thật; lỗi GPS có retry | Home ghi 5km/GPS active cố định; backend GPS mới lấy 1 lần khi online |
| Offer | Dịch vụ/đối tượng/ảnh ISSUE/note/schedule/distance/gross-net/expiresAt | Popup thiếu ảnh/lịch/net, địa chỉ đọc pickupAddress thay addressText; không dùng 1.2km/180k fallback |
| Accept pending/conflict/expired | Lock nút, kết quả từ API, refetch active khi mất response | Có spinner và message; error phải dựa status/code, không includes('409') |
| Assigned / MATCHED | Snapshot tải bằng ID, CTA di chuyển | Hiện ASSIGNED local + giá/khách/address giả; không dùng params làm dữ liệu chuẩn |
| En route | CTA “Đã đến nơi”, chỉ đường/gọi khách/report | API persist trước xác nhận; GPS permissions/errors visible |
| ARRIVED / khảo sát | BEFORE camera, scope/quote | Không tự coi ARRIVED là IN_PROGRESS |
| Quote pending/rejected | Chờ khách, xem quote version; sửa/hủy có lý do | Chưa có worker UI, phải hydrate từ API sau reload |
| IN_PROGRESS / PAUSED | Timer server, finish hoặc resume; CTA phù hợp | Chưa timer/pause; không tính tiền fixed theo thời gian |
| Work finished / AFTER | Camera sau, preview/chụp lại/upload progress/report | Hiện route Face ID; không mất media khi back/error |
| Chờ nghiệm thu / rework | Pending rõ, feedback khách, retry/hỗ trợ | Socket chỉ trigger refetch, không nhảy màn hình đột ngột |
| Chờ thanh toán | Trạng thái phương thức/sandbox/pending, chưa thu nhập khả dụng | Không ghi “hoàn tất/đã thanh toán” từ thao tác nghiệm thu |
| Completed / cancelled / disputed | Biên nhận/timeline/reason/resolution; hỗ trợ | Không tiếp tục tracking, không còn CTA sửa đơn; dispute policy khác terminal |
| Earnings/history/notifications/profile | Data thật, empty/error/retry, phân trang/deep link | Bốn tab placeholder, chưa thể coi hoàn thiện |

## Interaction và accessibility acceptance

- Một CTA chính theo allowedActions; server vẫn kiểm tra lại. Vùng chạm tối thiểu đề xuất 48dp, khoảng cách tránh chạm nhầm, label đọc màn hình, font scaling/text dài không cắt thông tin quan trọng. Chưa đo đạt trên thiết bị.
- Camera hiển thị ảnh local “Chưa tải lên”; uploading/failed/uploaded phân biệt. Xóa/chụp lại không xóa ảnh đã dùng cho quyết định mà không policy/audit. BEFORE của khách không được gắn nhãn ảnh thợ.
- Loading có skeleton/disabled; empty khác error; retry giữ form/ảnh. Mutation timeout thông báo chưa xác nhận, refetch trước gửi lại. Không toast thành công khi socket emit bị drop.
- Timer là phép tính từ server timestamp/session, tick UI chỉ để render. Deadline offer từ expiresAt/server clock, app background không kéo dài deadline.
- Check-in không lặp khi backend còn hạn; manual review không hiển thị verified. AI uncertain/unavailable hiển thị limitations, không ảnh demo/94% mặc định.
- Gọi khách/chỉ đường chỉ khi được phân quyền; không hardcode số điện thoại/địa chỉ. Summary tài chính ghi rõ dự kiến/đã xác nhận, gross/net/commission, sandbox nếu có.
- Foreground/reconnect/focus phải refetch; banner “mất kết nối” không tự báo order đổi thành công. Không queue mù accept/payment/completion.

Kiểm thử mobile: Android/iOS theo phạm vi thực hỗ trợ, camera denied, GPS denied/timeout, keyboard, one-hand reach, màn hình nhỏ/font lớn, screen reader, airplane mode, background, force-close. Kết quả hiện NOT_VERIFIED, tiêu chí ở 08.
