# Hướng Dẫn Đóng Góp (Contributing Guidelines) - Frontend Admin Web

Chào mừng bạn đến với dự án Admin Web! Để đảm bảo mã nguồn (codebase) luôn sạch sẽ, dễ bảo trì và thống nhất giữa tất cả các thành viên (bao gồm cả con người và AI), vui lòng đọc kỹ và tuân thủ tuyệt đối các quy tắc dưới đây trước khi bắt tay vào viết code.

---

## 1. Kiến Trúc Thư Mục (Core Architecture)

Dự án áp dụng cấu trúc thư mục phân tách rõ ràng giữa UI (Giao diện) và Logic. Mọi thay đổi phải tuân theo cấu trúc tổ chức của thư mục `src/`:

### 🌟 Quy tắc quan trọng nhất: Thư mục `pages/`
Đây là nơi chứa các tính năng/trang chính của ứng dụng. **KHÔNG** viết tất cả code của một trang vào một file duy nhất. Khi làm một chức năng mới, bắt buộc tuân theo cấu trúc sau:
1. Tạo một thư mục mang tên chức năng (VD: `UserManagement/`).
2. Trong thư mục đó, tạo một thư mục con `components/` để chứa các UI Component dùng **riêng** cho chức năng này (VD: `UserTable.jsx`, `UserForm.jsx`).
3. Tạo một file `.jsx` chính đóng vai trò là **Container/Smart Component** (VD: `UserManagement.jsx`). File này chỉ dùng để:
   - Quản lý state cục bộ.
   - Gọi API (thông qua `services/`).
   - Xử lý logic nghiệp vụ.
   - Truyền dữ liệu (props) xuống cho các component con.

### 🌟 Quy tắc quan trọng thứ hai: Thư mục `routers/`
Quản lý điều hướng được chia làm 2 phần tách biệt:
1. **File cấu hình Menu (`menuConfig.js` hoặc tương đương):** Chỉ chứa một mảng (array) các object định nghĩa cấu trúc menu (Tên hiển thị, Icon, Đường dẫn, Quyền truy cập) để render ra thanh Sidebar/Navbar.
2. **File cấu hình Routes (`routes.jsx`):** Nơi khai báo React Router, gắn các component từ `pages/` vào các URL tương ứng và xử lý logic bảo vệ route (Protected Routes).

### Các thư mục hỗ trợ khác:
- **`components/`:** Chỉ chứa các "Dumb Components" dùng chung cho toàn bộ dự án (VD: `Button`, `Modal`, `Table`). Không gọi API ở đây.
- **`services/`:** Nơi duy nhất khai báo các hàm gọi API (sử dụng axios/fetch). Các file chia theo đối tượng (VD: `auth.service.js`, `user.service.js`).
- **`layouts/`:** Chứa các bộ khung giao diện tổng thể (VD: `AdminLayout`, `AuthLayout`).
- **`constants/`:** Chứa các hằng số, thông báo lỗi, mã cấu hình cố định. KHÔNG hardcode text trong component.
- **`utils/`:** Chứa các hàm hỗ trợ độc lập (VD: format tiền tệ, ngày tháng, validate dữ liệu).
- **`store/`:** Cấu hình Global State Management.
- **`hooks/`:** Các custom hooks dùng chung (`useAuth`, `useDebounce`, v.v.).

---

## 2. Quy Chuẩn Đặt Tên (Naming Conventions)

Sự nhất quán trong cách đặt tên giúp code dễ đọc và dễ tìm kiếm hơn.

| Loại tệp/Thành phần | Quy tắc áp dụng | Ví dụ minh họa |
| :--- | :--- | :--- |
| **Thư mục (Directories)** | `kebab-case` hoặc `camelCase` | `user-management`, `auth`, `services` |
| **Component Files (.jsx)** | `PascalCase` (Bắt buộc) | `UserTable.jsx`, `AdminLayout.jsx` |
| **Logic/Util Files (.js)** | `camelCase` (Bắt buộc) | `userService.js`, `formatDate.js` |
| **Tên Biến & Hàm** | `camelCase` (Bắt buộc) | `const isModalOpen`, `handleLogin()` |
| **Hằng số (Constants)** | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`, `API_ENDPOINTS` |
| **Custom Hooks** | Bắt đầu bằng chữ `use` | `useFetch()`, `usePagination()` |

---

## 3. Quy Tắc Viết Code (Coding Rules)

1. **Thứ tự Import (Import Order):**
   - React và các thư viện bên thứ 3 (VD: `react`, `react-router-dom`, `axios`).
   - Các Component dùng chung từ `src/components/`.
   - Các Component nội bộ của tính năng hiện tại.
   - Services, Utils, Constants, Hooks.
   - Các file CSS/Assets.

2. **Xử Lý Lỗi (Error Handling):**
   - Bất kỳ lời gọi API nào trong thư mục `pages/` đều phải được xử lý lỗi đầy đủ bằng khối `try...catch`.
   - Luôn có thông báo phản hồi (Toast/Snackbar) cho người dùng khi một thao tác thành công hoặc thất bại.

3. **Không Hardcode URL:**
   - Tuyệt đối không gõ trực tiếp URL API vào trong file giao diện. Khai báo endpoint trong `services/` hoặc `constants/`.

---

## 4. Quy Trình Làm Việc Với Git (Git Workflow)

Chúng tôi sử dụng quy chuẩn **Conventional Commits** để giữ cho lịch sử Git rõ ràng và tự động hóa việc tạo changelog.

### Cú pháp Commit:
```text
<type>(<scope>): <subject>