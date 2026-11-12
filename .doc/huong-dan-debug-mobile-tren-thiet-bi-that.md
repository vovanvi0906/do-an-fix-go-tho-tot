# HƯỚNG DẪN PHÁT TRIỂN & DEBUG MOBILE TRÊN THIẾT BỊ THẬT (EXPO DEV CLIENT)

> **Mục tiêu tài liệu:** Hướng dẫn toàn diện từ A-Z quy trình thiết lập lần đầu trên máy tính mới (Linux & Windows), quy trình build APK qua cáp USB vào điện thoại thật, và cách debug, test, fix bug hàng ngày siêu tốc mà không cần build lại Native.

---

## 🎯 1. NGUYÊN LÝ HOẠT ĐỘNG (BẮT BUỘC HIỂU)

Ứng dụng của bạn chạy ở chế độ **Expo Development Client (`expo-dev-client`)**:

```
┌────────────────────────────────────────────────────────┐
│             CÀI 1 LẦN DUY NHẤT VÀO MÁY                 │
│      Native App C++ / Java / SDK (File APK Debug)      │
│   (Chỉ build lại khi cài thêm thư viện Native mới)     │
└──────────────────────────┬─────────────────────────────┘
                           │ Kết nối qua Cáp USB / Cùng Wi-Fi
┌──────────────────────────▼─────────────────────────────┐
│          QUY TRÌNH FIX BUG & CODE HÀNG NGÀY            │
│       Metro Bundler (JavaScript / React JSX)           │
│     Hot Reload / Fast Refresh cập nhật trong 1 giây    │
└────────────────────────────────────────────────────────┘
```

* **File APK cài trên máy:** Là "vỏ chứa" (Shell) bao gồm Camera, GPS, Bản đồ, Bluetooth, Native modules.
* **Mã nguồn JSX/TSX trong máy tính:** Là "ruột ứng dụng". Metro Bundler truyền mã này sang điện thoại theo thời gian thực qua socket.

---

## 🚀 2. QUY TRÌNH LẦN ĐẦU CHẠY TRÊN MÁY TÍNH MỚI (FIRST-TIME SETUP)

Khi bạn clone dự án sang một máy tính mới (hoặc máy đồng đội), làm theo các bước chuẩn sau:

### Bước 2.1: Cài đặt công cụ môi trường (Linux & Windows)

#### 🐧 Dành cho Linux (Ubuntu / Debian / Mint):
1. **Node.js**: Phiên bản 18 hoặc 20 LTS (khuyến nghị dùng `nvm`).
2. **Cài đặt JDK 17 & ADB**:
   ```bash
   sudo apt update
   sudo apt install -y openjdk-17-jdk android-tools-adb
   ```
3. **Cấu hình biến môi trường (`~/.bashrc` hoặc `~/.zshrc`)**:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   ```
   Chạy `source ~/.bashrc` để áp dụng.

#### 🪟 Dành cho Windows:
1. **Node.js**: Cài bản 18 hoặc 20 LTS từ trang chủ Node.js.
2. **Java JDK 17**: Cài OpenJDK 17 (Microsoft Build of OpenJDK hoặc Eclipse Temurin).
3. **Android Studio**:
   * Tải và cài đặt Android Studio.
   * Mở **Tools $\rightarrow$ SDK Manager**: Tích chọn `Android SDK Platform 34`, `Android SDK Build-Tools`, `Android SDK Platform-Tools`.
4. **Cấu hình Environment Variables (System Properties)**:
   * Tạo biến hệ thống `ANDROID_HOME`: `C:\Users\<Tên_User>\AppData\Local\Android\Sdk`
   * Thêm vào biến `Path`:
     * `%ANDROID_HOME%\platform-tools`
     * `%ANDROID_HOME%\cmdline-tools\latest\bin`
   * Mở CMD/PowerShell mới gõ `adb version` kiểm tra xem đã nhận chưa.

---

### Bước 2.2: Thiết lập trên Điện Thoại Thật (Android / Vivo / Xiaomi / Samsung)
1. **Bật Tùy chọn nhà phát triển (Developer Options)**:
   * Vào **Cài đặt** $\rightarrow$ **Thông tin thiết bị** $\rightarrow$ Gõ liên tục 7 lần vào **Số bản dựng (Build Number)**.
2. **Bật các quyền Debug quan trọng**:
   * Vào **Cài đặt bổ sung / Hệ thống** $\rightarrow$ **Tùy chọn nhà phát triển**:
     * Bật **Gỡ lỗi qua USB (USB Debugging)**.
     * *(Đặc biệt với Vivo/iQOO, Xiaomi, Oppo)*: Bật **Cài đặt qua USB (Install via USB)** và **Gỡ lỗi USB - Cài đặt bảo mật**.
3. Cắm cáp USB vào máy tính:
   * Trên điện thoại chọn chế độ: **Truyền tệp (File Transfer / MTP)**.
   * Khi hiện popup *"Cho phép gỡ lỗi USB từ máy tính này?"* $\rightarrow$ Tích chọn **"Luôn cho phép"** và bấm **OK**.

---

### Bước 2.3: Chuẩn bị mã nguồn & Cấu hình IP Backend
Mở terminal tại thư mục ứng dụng (ví dụ: `customer-app` hoặc `worker-app`):

1. **Cài đặt package**:
   ```bash
   npm install
   ```

2. **Lấy IP mạng nội bộ của máy tính**:
   * **Linux:** Chạy `ip a | grep 192.168` hoặc `hostname -I` (VD: `192.168.1.15`).
   * **Windows:** Mở CMD gõ `ipconfig` $\rightarrow$ Xem dòng `IPv4 Address` của Wi-Fi hoặc Ethernet.

3. **Tạo / Sửa file `.env`**:
   > ⚠️ **Lưu ý:** Điện thoại thật không gọi được `localhost:3000` của máy tính. Phải điền IP LAN:
   ```env
   EXPO_PUBLIC_API_URL=http://<IP_MÁY_TÍNH>:3000
   EXPO_PUBLIC_SOCKET_URL=http://<IP_MÁY_TÍNH>:3000
   ```

---

### Bước 2.4: Kiểm tra kết nối ADB & Build APK cài vào điện thoại
1. Kiểm tra máy tính đã nhận diện điện thoại:
   ```bash
   adb devices
   ```
   * *Kết quả đúng:* Hiện mã thiết bị kèm chữ `device` (VD: `123456789ABCDEF   device`).
   * *Nếu báo `unauthorized`:* Mở khóa màn hình điện thoại và bấm Đồng ý.

2. **Chạy lệnh build Native APK trực tiếp vào điện thoại**:
   ```bash
   npx expo run:android --device
   ```
   > 🔴 **CỰC KỲ QUAN TRỌNG KHI BUILD:**
   > * Giữ màn hình điện thoại **luôn sáng**.
   > * Khi quá trình build đạt ~95-100%, điện thoại sẽ hiển thị popup xác nhận: **"Cho phép cài đặt ứng dụng qua USB?"**.
   > * Phải bấm **Cài đặt / Cho phép (Install)** ngay lập tức (quá 10s sẽ bị lỗi `INSTALL_FAILED_ABORTED`).

3. **Chuyển tiếp cổng (Port Forwarding)** sau khi app mở lên lần đầu:
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```

---

## ⚡ 3. QUY TRÌNH HÀNG NGÀY: SỬA CODE, TEST & DEBUG (KHÔNG BUILD LẠI)

Khi phát triển tính năng, sửa giao diện, sửa API logic: **TUYỆT ĐỐI KHÔNG** chạy lại `npx expo run:android`. Hãy làm như sau:

1. Cắm cáp USB kết nối điện thoại và máy tính.
2. Đảm bảo port đã được forward (chạy 1 lần sau khi cắm cáp):
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```
3. Mở terminal tại thư mục app và khởi động Metro:
   ```bash
   npx expo start
   ```
4. Mở app trên điện thoại:
   * Bấm phím **`a`** trên bàn phím máy tính $\rightarrow$ Ứng dụng trên điện thoại tự khởi động và nạp code.
5. **Code & Test:**
   * Sửa code trong VS Code / IDE và nhấn **`Ctrl + S`**.
   * App trên điện thoại tự động **Hot Reload** trong **1 giây**, giữ nguyên vị trí màn hình và dữ liệu đang test.

---

## 🔄 4. CÁC PHÍM TẮT DEBUG TIỆN LỢI

Khi terminal Metro (`npx expo start`) đang mở:
* Bấm **`r`**: Tải lại toàn bộ ứng dụng (Reload/Clear state).
* Bấm **`j`**: Mở Chrome DevTools / Debugger để xem Network request, console log, inspect elements.
* Bấm **`m`**: Bật Dev Menu trên điện thoại (Toggle Inspector, Performance Monitor).
* **Lắc nhẹ điện thoại:** Mở trực tiếp Dev Menu trên màn hình thiết bị thật.

---

## 🛠️ 5. KHI NÀO MỚI CẦN BUILD LẠI FILE NATIVE APK?

Chỉ build lại (`npx expo run:android --device`) khi:
1. Cài thêm thư viện Native mới qua npm (VD: camera native, ble, nfc, map sdk).
2. Sửa file cấu hình native: `app.json`, `android/`, thêm quyền trong `AndroidManifest.xml`.
3. Đổi sang một chiếc điện thoại mới chưa có app.

---

## ⚠️ 6. BẢNG XỬ LÝ LỖI NHANH (TROUBLESHOOTING)

| Triệu chứng lỗi | Nguyên nhân | Cách khắc phục ngay lập tức |
|---|---|---|
| `INSTALL_FAILED_ABORTED: User rejected permissions` | Màn hình tắt hoặc không bấm kịp nút "Cho phép cài qua USB" | Mở sáng màn hình điện thoại, chạy lại lệnh cài APK đã build xong: <br>`adb install -r android/app/build/outputs/apk/debug/app-debug.apk` |
| `Could not connect to development server` | Điện thoại không thông cổng 8081 với máy tính | Chạy lệnh: `adb reverse tcp:8081 tcp:8081`<br>Sau đó lắc điện thoại chọn **Reload**. |
| `adb: command not found` | Chưa khai báo PATH của Android SDK Platform-Tools | Kiểm tra lại biến môi trường `ANDROID_HOME` và thêm `%ANDROID_HOME%\platform-tools` (Windows) hoặc `$ANDROID_HOME/platform-tools` (Linux) vào PATH. |
| Không gọi được API Backend (`Network request failed`) | Cấu hình `.env` vẫn đang để `localhost` hoặc sai IP | Đổi `localhost` thành IP LAN máy tính trong `.env`. Chạy `ip a` (Linux) hoặc `ipconfig` (Windows) để lấy đúng IP. |
| Metro báo lỗi cache hoặc bundle cũ | Bộ nhớ đệm Metro bị kẹt | Chạy lệnh xóa cache: `npx expo start -c` |
| Điện thoại báo `device unauthorized` khi gõ `adb devices` | Chưa cấp quyền tin cậy máy tính | Rút cáp cắm lại, mở sáng màn hình điện thoại và bấm **Luôn cho phép** gỡ lỗi USB. |
