# 04 — AI-02: Before/After Validation

**FAIL đối với kết quả nghiệm thu đáng tin cậy; PARTIAL đối với chức năng so sánh ảnh cơ bản.** Đã có CV thật và backend guards, nhưng ba tầng vẫn có điểm/pass giả khi thiếu bằng chứng; Worker job chưa nối AFTER.

## Media và nghiệp vụ

| ID | Phát hiện | Source / symbol | Runtime / trạng thái |
|---|---|---|---|
| B01 | BEFORE dùng camera sau tại ARRIVED, có proof đúng đơn; upload resource, rồi persist OrderImage | [BeforePhotoCapture:35](../../worker-app/src/features/orders/components/BeforePhotoCapture.jsx#L35), [OrderBeforeMediaService.authorize/upload:13,65](../../server/src/modules/orders/order-before-media.service.js#L13), [OrdersService.uploadImage:469](../../server/src/modules/orders/orders.service.js#L469) | Source có thật; upload/thiết bị/DB NOT_VERIFIED |
| B02 | BEFORE không chỉ nhận URL tùy ý: kiểm HTTPS đúng cloud, namespace worker/order/arrival/digest và Cloudinary resource bytes>0 | [publicId/verify:36–61](../../server/src/modules/orders/order-before-media.service.js#L36) | Mạnh hơn AFTER; chưa thử storage live |
| B03 | Start cần BEFORE sau ARRIVED; finish cần AFTER sau startedAt | [OrderWorkflowService.transition:199–245](../../server/src/modules/orders/order-workflow.service.js#L199) | Guard source có; timestamp upload không chứng minh thời gian chụp camera |
| B04 | AFTER API cho assigned worker ở IN_PROGRESS nhưng chỉ kiểm URL HTTP(S); chưa verify resource như BEFORE | [OrdersService.uploadImage:483–497](../../server/src/modules/orders/orders.service.js#L483) | URL không tải được vẫn có thể được ghi theo source; không thực thi ghi DB trong audit |
| B05 | Worker job tại IN_PROGRESS chỉ hiển thị đang làm, chưa có capture AFTER/submit finish | [WorkerJobDetailScreen:204–206](../../worker-app/app/(worker)/job/[id].jsx#L204) | NOT_IMPLEMENTED trong route nghiệp vụ khảo sát; không coi endpoint là mobile flow hoàn chỉnh |
| B06 | verifyCompletion kiểm quyền đơn và có cả BEFORE/AFTER, chọn ảnh mới nhất từng loại | [OrdersService.verifyCompletion:505–529](../../server/src/modules/orders/orders.service.js#L505) | Không có ảnh thì reject; tồn tại bản ghi URL khác với ảnh decode thành công |
| B07 | Khách có quyền nghiệm thu/tranh chấp; AI pass không tự chuyển COMPLETED | [AcceptanceScreen.acceptMutation/disputeMutation:85,113](../../customer-app/src/screens/order/AcceptanceScreen.jsx#L85), [workflow:121](../../server/src/modules/orders/order-workflow.service.js#L121) | Customer quyết định; E2E chưa chạy. Guard settlement vẫn riêng |

## Thuật toán đang kiểm tra gì?

[main.analyze_before_after_opencv:581](../../ai-service/main.py#L581): resize 400×400 → ORB descriptors → Lowe ratio `.75` → homography RANSAC → warp AFTER về BEFORE; yêu cầu ≥10 inlier. Sau đó SSIM, absdiff threshold 35, tỷ lệ vùng đổi, Canny edge density/độ sáng và histogram. Điểm tổng `.35*alignment + .35*change + .30*cleanliness`; pass dùng các ngưỡng ở dòng 720–725.

Đây là **hình học/tương đồng/thay đổi bề mặt**, không có model hiểu nguyên nhân sửa chữa hoặc kiểm vận hành thiết bị. ORB/RANSAC có thể hỗ trợ góc khác nếu đủ texture/cùng bề mặt gần phẳng; không bảo đảm nhận đúng thiết bị dưới mọi góc, thiếu sáng, che khuất, bề mặt nhẵn hoặc vật thể 3D. Ít inlier chỉ cho biết không đủ đối chiếu, không đủ chứng minh khác thiết bị.

Nhánh SSIM ≥.96 hoặc diff <.02 trả fail cố định `.42` (dòng 671–680); một sửa chữa bên trong có thể không đổi hình ngoài. Đổi ánh sáng/bố cục có thể làm diff tăng dù chưa sửa. `cleanliness_score` khởi đầu `.85`, cộng theo cạnh/độ sáng (dòng 705–711), không phải model đo vệ sinh. Histogram tương tự màu, không chứng minh đã sửa. `yolo_model` được truyền nhưng không được gọi trong hàm này.

Các câu “xử lý triệt để”, “an toàn kỹ thuật”, “đấu nối chuẩn xác” vượt quá dữ liệu thuật toán đo. T §1 là **hỗ trợ khách nghiệm thu**; nên trình bày dấu hiệu thay đổi và giới hạn, để khách/thợ xác nhận kiểm vận hành.

## Các nhánh kết quả giả có bằng chứng

| ID / mức | Vị trí | Hành vi / bằng chứng |
|---|---|---|
| B08 / P0 | [main.compare_before_after:804–818](../../ai-service/main.py#L804) | Decode lỗi/thiếu ảnh/CV exception → mặc định `.92`, `passed=true`, chỉ `dirty/chua_xong` trong URL đổi `.55/false`; ghi `engine=heuristic` |
| B09 / P0 | [getFallbackCompare:10](../../server/src/infrastructure/external/ai/aiFallbackHelper.js#L10), [FastApiAiClient.compareBeforeAfter:56–67](../../server/src/infrastructure/external/ai/fastapi-ai.client.js#L56) | AI HTTP lỗi/offline → cùng URL keyword và `.92/true`, không provenance engine trong fallback Node; call không có timeout riêng |
| B10 / P0 | [OrdersService.verifyCompletion:531–549](../../server/src/modules/orders/orders.service.js#L531) | Thiếu matchScore mặc định `.9`; thiếu passed suy từ ≥.8. Lưu aiMatchScore vào AFTER; response không chuyển tiếp engine/uncertainty, dễ che fallback |
| B11 / P0 | [AcceptanceScreen:35–83](../../customer-app/src/screens/order/AcceptanceScreen.jsx#L35) | Thiếu đơn dùng demo-order-id; thiếu ảnh dùng Unsplash; thiếu kết quả dùng 94%, suy passed và ghi mô tả đạt an toàn mặc định. Có loading/error UI nhưng dữ liệu mặc định này vẫn không phải bằng chứng AI |
| B12 / P1 | [compute_ssim_opencv:163–165](../../ai-service/main.py#L163), [compute_hist_correlation:182–184](../../ai-service/main.py#L182) | Nội bộ exception trả `.75`/`.8` thay vì unavailable; có thể làm score mất ý nghĩa |

B08 **đã tái hiện** bằng gọi hàm endpoint thật với `CompareBeforeAfterRequest(beforeImageUrl='', afterImageUrl='')`, không mock model/network: `.92`, `true`, `engine=heuristic`. Đây là function-level probe, chưa phải HTTP route vì chưa kiểm binding Body/Form cho JSON trên phiên bản triển khai. B09–B12 là source-proven, chưa gọi DB hoặc app để khai thác.

Probe CV thật: cùng `sample_before.jpg` → SSIM 1, inliers 1000, diff 0, score .42, fail; cặp fixture before/after → inliers 689, SSIM .953, diff .036, score .98, pass. **Không có ground truth chất lượng sửa** nên không gọi hai kết quả này là model quality verified.

## Manual review và kết luận phạm vi

Khách có accept/dispute và có thể xem ảnh theo source. Chưa có contract uncertainty/manual-review rõ ràng xuyên compare → Node → app; fallback hiện che mất tình trạng không thể đánh giá. Không đồng nhất quyền khách quyết định với hệ thống hàng đợi manual review đã triển khai.

Backend ngăn **thiếu bản ghi ảnh** khi start/finish, nhưng AFTER URL chưa được chứng minh là ảnh hợp lệ; cần kiểm storage/decode. AI score không phải điều kiện duy nhất để thanh toán/hoàn tất. Không có bằng chứng fallback này tự ghi payment hoặc cộng ví.

Để đáp ứng AI-02: nối AFTER thật; bỏ điểm và ảnh demo khi thiếu dữ liệu; trả unavailable/inconclusive kèm lý do; giữ xác nhận của khách; đánh giá các cặp cùng/khác thiết bị, khác góc/ánh sáng, sửa bên trong, không sửa, làm hỏng thêm theo nhãn người. Chưa sửa trong audit.
