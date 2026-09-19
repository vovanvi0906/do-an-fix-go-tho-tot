✨ PROMPT/KỊCH BẢN TẠO UI CHUẨN LINEAR (VIBE-UI SCRIPT)
Dùng để tái sử dụng khi yêu cầu AI agent tạo màn hình/component mới cho Admin Web hoặc Mobile

File này là kịch bản prompt mẫu để copy-paste khi cần sinh UI mới, đảm bảo mọi màn hình tuân thủ đúng frontned.md (web) hoặc mobile.md mà không phải giải thích lại từ đầu mỗi lần.

1. KỊCH BẢN PROMPT CHUẨN (WEB — ADMIN DASHBOARD)
Tạo component/màn hình: <TÊN MÀN HÌNH>

Bối cảnh:
- Phong cách: Linear/Vercel — tối giản, viền mỏng sắc nét, backdrop-blur-xl, ambient glow nhẹ, KHÔNG đổ bóng lố.
- Grid: bắt buộc 8pt grid system cho mọi spacing (p-3/p-4/p-6, gap-3.5, space-y-4...).
- Stack: React 19 + Vite + Tailwind CSS v4 + Radix UI/Shadcn patterns + Framer Motion (nếu có transition).

Yêu cầu bắt buộc theo `frontned.md`:
1. Loading state: Skeleton Loader mô phỏng đúng khung xương layout thật — cấm spinner đơn thuần.
2. Empty state: icon + tiêu đề hướng dẫn + CTA rõ ràng.
3. Error state: Toast Glassmorphism (đỏ = lỗi hệ thống/401/403, xanh ngọc = thành công).
4. Micro-interaction: transition-all duration-200, hover:-translate-y-0.5, active:scale-95, cursor-pointer cho mọi phần tử bấm được.
5. Responsive: kiểm tra tối thiểu breakpoint mobile (< 640px) và desktop.
6. Dark/Light mode qua ThemeProvider — không hardcode màu, dùng token trong theme.

Dữ liệu/API:
- Endpoint sử dụng: <dán endpoint từ api-specs.md, ví dụ GET /admin/workers?status=PENDING>
- Response shape: <dán JSON response mẫu từ api-specs.md>
- Toggle mock/real qua VITE_USE_MOCK_API nếu API backend chưa sẵn sàng.

Vị trí file: theo cấu trúc src/features/<domain>/{components,pages,services,hooks}/ trong frontned.md.

Không làm:
- Không tự ý đổi màu/token ngoài theme đã định nghĩa.
- Không thêm thư viện UI mới ngoài Radix/Shadcn nếu không có lý do.
- Không viết logic gọi API trực tiếp trong component — qua services/ + hook riêng.
2. KỊCH BẢN PROMPT CHUẨN (MOBILE — CUSTOMER/WORKER APP)
Tạo màn hình: <TÊN MÀN HÌNH> — thuộc nhóm (user)/ hoặc (worker)/

Bối cảnh:
- Stack: React Native + Expo Router, điều hướng theo cấu trúc file trong app/.
- Phải xử lý SafeAreaView, KeyboardAvoidingView đúng theo mobile.md.
- Logging debug dùng prefix emoji chuẩn (🔑 [AuthService], 📡 [Socket.IO], 🚀 [OrderService]...).

Yêu cầu:
1. Nếu màn hình cần realtime (theo dõi thợ, chat, trạng thái đơn): tích hợp socketService, tự join room theo profileId.
2. Nếu màn hình cần auth: qua authService + tokenStorage (AsyncStorage), không tự lưu token thủ công.
3. Ảnh chụp (face check-in, ảnh sự cố, ảnh nghiệm thu): dùng expo-image-picker/expo-camera, resize/compress trước khi upload.

Dữ liệu/API:
- Endpoint: <dán từ api-specs.md>
- Response shape: <dán JSON mẫu>

Vị trí file: app/(user)/... hoặc app/(worker)/... theo mobile.md, logic tách vào src/features/<domain>/.
3. QUY TẮC KHAI BÁO TYPESCRIPT INTERFACE (DÙNG CHUNG WEB + MOBILE)
Mọi response từ API phải có interface riêng đặt tại types/ hoặc <feature>/types.ts, đặt tên khớp domain: Order, Worker, WalletTransaction.
Interface khớp chính xác field trong api-specs.md — không tự thêm field suy đoán, không đặt optional (?) cho field mà backend luôn trả về.
Enum trạng thái (order status, KYC status...) định nghĩa bằng TypeScript enum hoặc union type literal, dùng chung giữa các component thay vì so sánh string rời rạc:
typescript
export type OrderStatus =
  | "SEARCHING_WORKER"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED_PENDING_CONFIRMATION"
  | "SETTLED"
  | "CANCELLED"
  | "REJECTED";

export interface Order {
  orderId: string;
  status: OrderStatus;
  estimatedCost: number;
  createdAt: string;
}
4. GHI CHÚ SỬ DỤNG

Khi giao task cho AI agent tạo UI mới, dán nguyên khối kịch bản mục 1 hoặc mục 2 (tuỳ web/mobile), điền các phần <...>, rồi mới gửi. Việc này thay thế cho giải thích lại toàn bộ style guide mỗi lần — giữ output đồng nhất qua nhiều session làm việc khác nhau.