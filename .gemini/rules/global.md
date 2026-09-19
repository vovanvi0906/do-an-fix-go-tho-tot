# 🌐 QUY TẮC CHUNG (GLOBAL RULES)
## DỰ ÁN: ON-DEMAND HOME SERVICE PLATFORM WITH AI/CV

Áp dụng cho **mọi** codebase trong hệ thống: `backend/`, `ai-service/`, `admin-web/`, `mobile-customer/`, `mobile-worker/`.

---

## 1. NGUYÊN TẮC KIỂM TRA TRƯỚC KHI SỬA (BẮT BUỘC)

* **Đọc trước khi viết:** Trước khi tạo/sửa bất kỳ file nào, phải đọc toàn bộ file hiện tại (nếu đã tồn tại) và các file liên quan trực tiếp (ví dụ: sửa `orders.service.js` thì phải đọc kèm `orders.controller.js`, DTO liên quan, và `order-status.constant.js`). Tuyệt đối không ghi đè mù (blind overwrite) dựa trên suy đoán nội dung cũ.
* **Không tự ý đổi kiến trúc đã chốt:** Tech stack, cấu trúc thư mục, response format chuẩn đã quy định trong `backend.md`, `frontned.md`, `mobile.md`, `ai-service.md` là **cố định**. Nếu phát hiện cách làm khác "tốt hơn", phải dừng lại và hỏi người dùng trước, không tự động refactor toàn bộ.
* **Kiểm tra trùng lặp trước khi tạo mới:** Trước khi tạo constant, DTO, hook, service function mới — grep/search trong codebase xem đã có chưa. Không tạo `formatCurrency` ở 3 nơi khác nhau.
* **Không tạo file thừa:** Không tự động sinh file test, file doc, file example ngoài phạm vi được yêu cầu, trừ khi được yêu cầu rõ ràng.
* **Giới hạn phạm vi thay đổi:** Mỗi lần chỉnh sửa chỉ động vào các file thực sự cần thiết cho task đang làm. Không "tiện tay" sửa style, rename biến, hay refactor các đoạn code không liên quan trong cùng lần commit.

---

## 2. QUY ƯỚC GIT COMMIT

### 2.1 Định dạng commit message (Conventional Commits)
```
<type>(<scope>): <mô tả ngắn gọn bằng tiếng Việt>
```

| Type | Ý nghĩa |
| :--- | :--- |
| `feat` | Thêm tính năng mới |
| `fix` | Sửa lỗi |
| `refactor` | Tái cấu trúc code, không đổi hành vi |
| `chore` | Cập nhật cấu hình, dependency, tooling |
| `docs` | Thay đổi tài liệu |
| `test` | Thêm/sửa test |
| `perf` | Cải thiện hiệu năng |

**Scope** là tên module: `auth`, `orders`, `wallet`, `ai-face`, `ai-incident`, `admin`, `mobile-customer`, `mobile-worker`.

Ví dụ:
```
feat(orders): thêm atomic update khi thợ nhận đơn
fix(wallet): sửa lỗi tính sai commission rate theo category override
refactor(ai-service): tách incident_service khỏi endpoint layer
```

### 2.2 Quy tắc branch
```
<type>/<scope>-<mô-tả-ngắn>
```
Ví dụ: `feat/orders-dispatch-engine`, `fix/wallet-double-withdraw`

### 2.3 Cấm tuyệt đối
* Không commit file `.env`, credentials, API keys, file weight model (`.pt`, `.onnx`) nếu vượt quá giới hạn kích thước repo — dùng `.gitignore` và lưu ở object storage/LFS.
* Không commit code chưa chạy được (build fail, lỗi cú pháp).
* Không squash/force-push lên nhánh chia sẻ chung mà không thông báo.

---

## 3. FORMAT CODE

* **JavaScript/TypeScript (backend, admin-web, mobile):** Prettier + ESLint. Chạy `npm run lint:fix` và `npm run format` trước khi commit. Không tắt rule ESLint bằng comment (`eslint-disable`) trừ khi có lý do rõ ràng ghi chú ngay tại dòng đó.
* **Python (ai-service):** Black + Ruff. Format 100% trước khi commit, tuân thủ type hint đầy đủ cho public function.
* **Indentation:** 2 spaces cho JS/TS, 4 spaces cho Python.
* **Import order:** Thư viện ngoài → thư viện nội bộ (alias `@/`) → file tương đối (`./`), phân cách bằng dòng trống.

---

## 4. NGUYÊN TẮC LÀM VIỆC VỚI AI AGENT

* **Một task, một mục tiêu:** Không gộp nhiều task không liên quan (ví dụ: vừa sửa bug thanh toán vừa đổi màu UI) trong cùng một lần thực thi.
* **Xác nhận trước hành động phá hủy:** Bất kỳ thao tác xóa file, xóa bảng, xóa dữ liệu, hoặc chạy migration đều phải liệt kê rõ hậu quả trước và chờ xác nhận (xem thêm `db-migration.md`).
* **Báo cáo thay đổi:** Sau khi hoàn thành, liệt kê ngắn gọn danh sách file đã tạo/sửa và lý do — không chỉ nói "đã xong".