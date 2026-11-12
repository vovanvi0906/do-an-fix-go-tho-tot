# Phân tích gap và xung đột

Bằng chứng file/hàm: [01-codebase-audit](01-codebase-audit.md). Các phát hiện BUG dưới đây được xác định từ source; chưa có exploit/runtime E2E được thực hiện.

| Gap | Mức | Phát hiện và ảnh hưởng | Bằng chứng | Cách kiểm chứng sau khi được triển khai |
|---|---|---|---|---|
| G01 | P0 | `updateStatus` ghi mọi trạng thái DTO cho phép, không kiểm tra state nguồn/BEFORE/quote/face; có thể finish trước start | B1 OrdersService.updateStatus; DTO UpdateOrderStatusDto | Gọi mutation sai thứ tự, expect reject và DB/history không đổi |
| G02 | P0 | Customer accept ghi COMPLETED trước thanh toán; pay ghi PAID. WorkflowService dùng AWAITING_PAYMENT→COMPLETED | B1 acceptCompletion/processPayment, B2, C1 | Accept chưa trả tiền: nonterminal; wallet chưa tăng |
| G03 | P0 | Pay không kiểm tra customer sở hữu đơn, state nguồn hay settlement; repeat request tạo ledger mới và cộng ví lần nữa | B1 processPayment; D1 WalletTransaction | Cross-user/parallel retry phải reject hoặc trả cùng kết quả, 1 ledger |
| G04 | P0 | Socket không auth; tự join order/admin room và GPS bằng ID tự gửi; global broadcast bỏ qua workers list | B4 handleConnection/handleJoinOrder/handleAdminJoinOrders/handleWorkerUpdateLocation/broadcastNewOrderToWorkers | Không token/khác owner bị reject; worker ngoài vùng không nhận offer |
| G05 | P0 | Upload image/verify completion chỉ kiểm tra order/ảnh, không actor; schedule không kiểm tra customer chủ đơn | B1 uploadImage/verifyCompletion/scheduleOrder, controller bỏ user | Cross-user không upload/đánh giá/schedule; không orphan upload công khai |
| G06 | P0 | Orders.verifyFace cấp faceVerifiedAt cả khi verified=false; fallback Node và FastAPI trả success giả | B1 verifyFace; AI1 getFallbackFaceVerify; AI2 face_verify | AI down/không mặt/khác mặt/không đọc reference không cấp phiên |
| G07 | P0 | Daily Node allowFallback=false chỉ loại fallback phía Node, không loại engine=heuristic hoặc face detection-only từ FastAPI | B5 verifyFaceDaily; AI1 verifyFace; AI2 face_verify | Chặn heuristic và detection-only khi yêu cầu đối chiếu danh tính |
| G08 | P0 | Before-after fallback theo URL trả 0.92; Customer thiếu response vẫn hiển thị 94%/ảnh Unsplash | AI1/2; C1 AcceptanceScreen | Unavailable/uncertain hiển thị thật, human review, không điểm đạt mặc định |
| G09 | P0 | Active API filter không có MATCHED/WORKER_EN_ROUTE/AWAITING_ACCEPTANCE; include customer.user sai vì customer là User | B3 findCurrentOrderForWorker/findById; D1 Order.customer; B8 getOrderById | Query với Prisma thực và mọi state active, owner boundary |
| G10 | P0 | Worker detail ASSIGNED cục bộ, params chứa PII/giá, status emit không handler; Face route về không cấp flag/refetch; AFTER sai route | W2/W3/W6 | Mở bằng ID, reload/foreground, di chuyển/đến nơi/AFTER qua API |
| G11 | P0 | Chống hai thợ nhận cùng đơn có order row lock; chưa chống một thợ nhận hai đơn, chưa hạn offer/availability/approval/skill/geofence tại accept | B1 acceptOrder; D1 không Offer/active unique | Hai order khác nhau cùng worker chỉ 1 active; quá hạn/ngoài offer reject |
| G12 | P0 | Ảnh khách createOrder lưu BEFORE, không ISSUE; chưa metadata/uploader/checksum/size | B1 createOrder/uploadImage; D1 OrderImage | Ảnh ISSUE không đủ điều kiện start; owner upload BEFORE riêng |
| G13 | P0 | Quote chỉ history note + socket, ACCEPT cộng additionalPrice do client gửi, repeat tăng tiếp, không khóa start | B1 adjustPrice; C1 TrackingScreen | Accept quoteId/version, reload proposal, từ chối/sửa giá client không tác động |
| G14 | P0 | Thiếu version/CAS mutation, events có timestamp phát chứ không order version; mất kết nối không refetch worker | B1 updateStatus; B4 emitStatusChanged; W1/W2/W6 | Duplicate/out-of-order/reconnect giữ snapshot mới nhất |
| G15 | P0 | Chỉ startedAt/completedAt, chưa workFinished/pause intervals, worker chưa timer | D1; B1 updateStatus; W2 | Kill app/tạm dừng vẫn tính đúng từ server |
| G16 | P0 | Schema/migrations lệch; Wallet và WorkerWallet song song; category thiếu commissionPercent nhưng code đọc; legacy payment fields sai | D1/D2; B1 createOrder/processPayment; B5 getProfile; B7 | Tạo DB sạch bằng migrations trên DB test, so schema; đối soát ví |
| G17 | P0 | Queue mở rộng gọi method gateway không có; không tìm lại eligible worker cho radius mới | B6 processJob; B4 | Advance queue trên Redis test, đúng vùng/recipient; timer không nhầm offer expiry |
| G18 | P1/core P0 | Admin cập nhật status bypass FSM, detail relation sai, API lỗi trả mock; delete xóa audit tài chính | B8; A1 | Admin actions cùng policy; lỗi hiển thị thật; giữ evidence/ledger |
| G19 | P1 | 4 tab worker placeholder, stats home hardcode, thiếu media queue/notifications/rework resolution | W1/W7; D1 | Dữ liệu API thật, empty/error/retry, deep link, đối soát |
| G20 | P1 | GPS hook truyền user.id trong khi gateway cập nhật profile.id; unmount dừng, mất reconnect không restore tracking | W2 useWorkerLocationTracker(id,user.id); W6; B4 | Profile coords đúng, tracking đúng stage và consent |

## Xung đột cần quyết định

1. Giữ nguyên enum đang tồn tại trong giai đoạn đầu; chốt adapter MATCHED↔ASSIGNED, WORKER_EN_ROUTE↔WORKER_ARRIVING, AWAITING_ACCEPTANCE↔AWAITING_CONFIRMATION. `COMPLETED` hiện có nghĩa “nghiệm thu xong” ở luồng chính, không thể tự đổi nghĩa cho mọi bản ghi cũ. Backfill phải phân biệt payment thực đã settled, không tự suy PAID=đã thu thật.
2. `ASSESSING`, `AWAITING_QUOTE_APPROVAL`, `PAUSED`, `WORK_FINISHED`, `REWORK_REQUESTED` chưa có trong enum; ưu tiên substate/entities có persistence, hoặc migration additive sau khi đánh giá clients. Không thêm enum hàng loạt theo tài liệu.
3. `ISSUE` đã tồn tại: map CUSTOMER_ISSUE→ISSUE. Không coi toàn bộ BEFORE cũ là ảnh thợ; thiếu uploader thì phải đánh dấu nguồn chưa xác minh, không tự backfill sai.
4. Giữ Expo Router, 5 tabs và API hiện hữu. Không chuyển cấu trúc thư mục hàng loạt; React Query/Zustand đã có dependency nhưng luồng worker hiện đang useState; chọn một cache server-state cho active job.
5. PaymentsModule không được import bởi AppModule hiện tại. Lỗ hổng mock webhook của legacy là rủi ro khi mount, không khẳng định endpoint đang public trên server thực. Luồng `/orders/:id/pay` mới là route active trong source.
6. Match hiện là Haversine SQL; có PostGIS schema không chứng minh matching đang dùng ST_DWithin. ServiceCategoryIds và WorkerService chưa đồng bộ tiêu chí matching.

## Policy còn NOT_VERIFIED / đề xuất mặc định để review

| Quyết định từ đặc tả §13 | Hiện trạng / đề xuất |
|---|---|
| Enum / active count | D1 hai bộ enum; đề xuất một active/thợ, khóa tại server |
| Check-in 24h | Có faceVerifiedAt, online dùng >=24h, accept >24h; thống nhất biên expiry và chỉ verified thật |
| Step-up theo đơn | UI ép mỗi đơn, server không có risk policy; đề xuất dùng check-in còn hạn, step-up do server yêu cầu |
| Pricing | Giá catalog lúc tạo, phát sinh chưa bền vững; hourly/minimum/rounding/phí khảo sát NOT_VERIFIED |
| Ảnh bắt buộc | Đề xuất BEFORE/AFTER riêng thợ; per-service policy chưa có |
| Khách không phản hồi | Không thấy timeout acceptance; không tự nghiệm thu |
| Provider / tiền mặt | PaymentClient example.com, pay ghi PAID nội bộ; provider thật NOT_VERIFIED, dùng sandbox minh bạch |
| Wallet / withdrawal | Có hai wallet models, không thấy worker withdrawal flow; chưa gọi là rút tiền thật |
| AI contract | Có matchScore/passed/notes/engine và verified/confidence/engine; human-review/limitations chưa thống nhất |
| Ảnh khách | Hiện BEFORE; dùng ISSUE theo schema |
| Hủy / rework | Hủy hardcode 20%, dispute state+history; chính sách khách vắng/phí/khắc phục cần chốt |
| GPS background/retention | Foreground hook 3s/10m; background consent/retention NOT_VERIFIED |
| Admin | Có profile approval/status CRUD; resolution tranh chấp/commission policy audit chưa đủ |
| Test/staging | Jest mock có; live DB/Redis/provider/mobile staging NOT_VERIFIED; không dùng race script cũ làm proof |
