# HƯỚNG DẪN PHÁT TRIỂN & DEBUG MOBILE TRÊN THIẾT BỊ THẬT (EXPO DEV CLIENT)

> **Mục tiêu tài liệu:** Hướng dẫn quy trình chuẩn khi lập trình, sửa lỗi (fix bug), thêm tính năng cho `customer-app` và `worker-app` chạy trực tiếp trên điện thoại thật (đặc biệt dòng máy OriginOS / Vivo / Android) mà không cần phải tốn thời gian build lại Native APK.

---

## 🎯 1. NGUYÊN LÝ HOẠT ĐỘNG (QUAN TRỌNG CẦN HIỂU)

Ứng dụng của bạn đang chạy ở chế độ **Expo Development Client (`expo-dev-client`)**. 
Nó được chia thành 2 phần tách biệt:

```
┌──────────────────────────────────────────────┐
│        CÀI 1 LẦN DUY NHẤT VÀO MÁY             │
│   Native App C++ / Java / SDK (File APK)     │
│   (Chỉ build lại khi cài thêm thư viện mới)  │
└──────────────────────┬───────────────────────┘
                       │ Kết nối qua cáp USB / Wi-Fi
┌──────────────────────▼───────────────────────┐
│        SỬA CODE VÀ FIX BUG HÀNG NGÀY         │
│     Metro Bundler (JavaScript / React JSX)   │
│      Hot Reload cập nhật trong 1 giây        │
└──────────────────────────────────────────────┘
```

* **File APK cài trên máy:** Đóng vai trò là cái "vỏ chứa" (Shell) bao gồm Camera, GPS, Bluetooth, SQLite, Native modules.
* **Mã nguồn JSX/JS trong máy tính:** Là "ruột ứng dụng". Metro Bundler sẽ truyền mã này sang điện thoại theo thời gian thực.

---

## ⚡ 2. QUY TRÌNH HÀNG NGÀY: SỬA CODE & FIX BUG (KHÔNG CẦN BUILD LẠI)

Khi bạn code tính năng mới, sửa lỗi UI, chỉnh logic gọi API... bạn **TUYỆT ĐỐI KHÔNG** chạy lại lệnh `npx expo run:android` (sẽ mất 2-8 phút vô ích).

### Các bước thực hiện:
1. Cắm cáp điện thoại vào máy tính (hoặc đảm bảo điện thoại và máy tính cùng bắt 1 mạng Wi-Fi).
2. Mở terminal tại thư mục app cần sửa (ví dụ: `customer-app` hoặc `worker-app`):
   ```bash
   npx expo start
   ```
3. Mở ứng dụng FixGo trên điện thoại:
   * Nếu cắm cáp USB: Bấm phím **`a`** trên terminal máy tính $\rightarrow$ App trên điện thoại tự động mở và nạp code mới nhất.
   * Nếu dùng Wi-Fi: Mở app trên điện thoại, quét mã QR hiển thị ở terminal (hoặc app sẽ tự động tìm thấy máy tính trên cùng mạng LAN).
4. **Sửa code trên VS Code / Cursor $\rightarrow$ Nhấn `Ctrl + S`:**
   * Màn hình điện thoại sẽ tự động **Fast Refresh / Hot Reload** trong **1 giây**.
   * Dữ liệu và trạng thái form vẫn được giữ nguyên.

---

## 🔄 3. CÁC PHÍM TẮT HỮU ÍCH TRÊN TERMINAL METRO

Khi terminal `npx expo start` đang chạy:
* Bấm **`r`**: Reload lại toàn bộ app (tiện khi bạn muốn reset sạch state/bộ nhớ đệm).
* Bấm **`j`**: Mở React Native Debugger / Chrome DevTools để soi `console.log` và Network request.
* Bấm **`m`**: Bật/Tắt Menu Dev Tools trên điện thoại (để xem Inspector, Performance Monitor).
* Lắc nhẹ điện thoại thật: Menu tùy chọn Dev cũng sẽ tự động bật lên.

---

## 🛠️ 4. KHI NÀO MỚI CẦN BUILD LẠI NATIVE APK?

Bạn chỉ cần chạy lại lệnh build native khi thuộc **1 trong 3 trường hợp sau**:
1. **Cài thêm thư viện Native mới** qua npm (ví dụ: vừa cài thêm thư viện NFC, Bluetooth, hoặc SDK bản đồ mới).
2. **Chỉnh sửa cấu hình native:** Sửa file `app.json`, `AndroidManifest.xml`, thêm Permissions mới (quyền Micro, quyền đọc file...).
3. **Đổi sang một chiếc điện thoại thật khác** chưa từng được cài app.

### Cách build lại nhanh nhất (Chỉ 1-2 phút):
```bash
# Đối với máy Vivo Z11 / iQOO / Android chip đời mới:
npx expo run:android --device
```
*Lưu ý khi build xong:* Giữ màn hình điện thoại luôn sáng để bấm **"Cho phép / Install"** ngay khi có popup xác nhận cài đặt.

---

## ⚠️ 5. XỬ LÝ LỖI PHỔ BIẾN TRÊN ĐIỆN THOẠI VIVO / ANDROID THẬT

### Lỗi 1: `INSTALL_FAILED_ABORTED: User rejected permissions`
* **Nguyên nhân:** Màn hình điện thoại bị tắt hoặc không kịp bấm nút "Cho phép" cài app qua USB.
* **Cách sửa:** Mở sáng màn hình điện thoại, chạy lệnh cài trực tiếp không cần build lại:
  ```bash
  adb install -r android/app/build/outputs/apk/debug/app-debug.apk
  ```

### Lỗi 2: App trên điện thoại báo `Could not connect to development server`
* **Nguyên nhân:** Điện thoại không tìm thấy IP của máy tính (do khác mạng Wi-Fi hoặc tường lửa máy tính chặn cổng 8081).
* **Cách sửa (Cực kỳ hiệu quả qua cáp USB):** Chạy lệnh chuyển tiếp cổng:
  ```bash
  adb reverse tcp:8081 tcp:8081
  ```
  Sau đó lắc điện thoại chọn **Reload** là vào mượt mà ngay.

### Lỗi 3: Không kết nối được Backend NestJS (`localhost:3000` / `localhost:5000`)
* **Lưu ý quan trọng:** Trên điện thoại thật, `localhost` chính là bản thân chiếc điện thoại chứ không phải máy tính của bạn.
* **Cách sửa:** Trong file `.env` của `customer-app` hoặc `worker-app`, hãy đổi `localhost` thành địa chỉ IP mạng nội bộ của máy tính:
  * Kiểm tra IP máy tính: `ip a | grep 192.168` (ví dụ: `192.168.0.107`).
  * Sửa lại `.env`:
    ```env
    EXPO_PUBLIC_API_URL=http://192.168.0.107:3000
    EXPO_PUBLIC_SOCKET_URL=http://192.168.0.107:3000
    ```
