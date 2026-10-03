---
trigger: always_on
---

# Quy tắc kích thước file và tổ chức code

Áp dụng bắt buộc cho mọi code do AI tạo hoặc sửa. Mục tiêu: file ngắn, một trách nhiệm, dễ đọc và dễ mở rộng.

## 1. Giới hạn cứng

| Loại file | Tối đa (dòng) |
|---|---|
| Component (UI) | 150 |
| Custom hook | 100 |
| Service / API | 120 |
| Types / interfaces | 150 |
| Constants / config | 100 |
| Helper / util | 100 |
| Page / screen (chỉ ghép component) | 120 |
| Test | 200 |
| Hàm đơn lẻ | 40 |

- Dòng trống và comment không được dùng để "lách" giới hạn.
- Vượt giới hạn là lỗi. Phải tách file trước khi kết thúc, không để lại "sẽ tách sau".

## 2. Một file, một trách nhiệm

- Mỗi file chỉ làm **một** việc: render UI, hoặc quản lý state, hoặc gọi API, hoặc chứa type/constant/helper.
- Component **không** gọi API trực tiếp. Gọi qua service.
- Component **không** chứa logic nghiệp vụ phức tạp. Đưa vào custom hook.
- Một component chính mỗi file. Component phụ chỉ dùng nội bộ được để cùng file nếu dưới 30 dòng.
- Không tạo file kiểu `utils.ts`, `helpers.ts`, `common.ts` chứa lẫn lộn. Đặt tên theo chức năng: `formatDate.ts`, `validateEmail.ts`.

## 3. Cách tách khi file sắp vượt giới hạn

Thực hiện theo thứ tự:

1. Tách types và constants ra file riêng.
2. Tách hàm thuần (không phụ thuộc React) sang helper.
3. Tách gọi API sang service.
4. Tách `useState` / `useEffect` / handler sang custom hook.
5. Tách JSX thành các component con.

## 4. Cấu trúc thư mục

Gom theo feature, không gom theo loại cho toàn dự án:

```
features/<ten-feature>/
  components/
  hooks/
  services/
  types.ts
  constants.ts
  index.ts      # chỉ export API công khai của feature
shared/
  components/
  hooks/
  utils/
```

- `shared` không được import từ `features`.
- Feature không import sâu vào file nội bộ của feature khác, chỉ import qua `index.ts`.
- Tránh circular import.

## 5. Phạm vi thay đổi

- Chỉ sửa các file được yêu cầu hoặc bắt buộc phải sửa để tính năng chạy.
- Không tạo thêm file ngoài những file cần thiết cho việc tách theo quy tắc trên.
- Không refactor code không liên quan đến yêu cầu.
- Giữ nguyên convention đặt tên và style của dự án hiện tại.

## 6. Checklist trước khi kết thúc

- [ ] Không file nào vượt giới hạn ở mục 1
- [ ] Mỗi file chỉ có một trách nhiệm
- [ ] Không có API call hoặc logic nghiệp vụ nằm trong component
- [ ] Không có file tên chung chung (`utils`, `helpers`, `common`)
- [ ] Không import sai chiều (`shared` → `features`)
- [ ] Không tạo file thừa ngoài phạm vi yêu cầu
- [ ] Code chạy được sau khi tách

## 7. Khi không thể tuân thủ

Nếu một file buộc phải vượt giới hạn (ví dụ file dữ liệu tĩnh lớn, file sinh tự động), phải ghi rõ lý do ở đầu file bằng một dòng comment và báo lại trong phần tóm tắt cuối cùng.