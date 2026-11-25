# Nguồn Roboflow và hồ sơ dùng chung

Đối chiếu ngày 25/11/2026 từ bốn URL người dùng cung cấp. Các trang được đọc công khai đều hiển thị CC BY 4.0. Đây là ghi nhận giấy phép công bố, chưa phải xác nhận nhãn, quyền ở cấp từng ảnh hoặc phê duyệt production.

| Dataset / tác giả công bố | Phiên bản người dùng cung cấp | Trang đối chiếu giấy phép | Ảnh raw khớp inventory local |
|---|---|---|---:|
| AIR CONDITIONER / sut | [v1](https://universe.roboflow.com/sut-nzvsb/air-conditioner-q7pxp/dataset/1) | Trang phiên bản v1 | 254 |
| dirty / MARIUS LEE | [v1](https://universe.roboflow.com/marius-lee/dirty/dataset/1) | [Trang project](https://universe.roboflow.com/marius-lee/dirty) | 1.155 |
| plant disease / annie.niu@icloud.com | [v1](https://universe.roboflow.com/annie-niu-icloud-com/plant-disease-w0ogb/dataset/1) | [Trang project](https://universe.roboflow.com/annie-niu-icloud-com/plant-disease-w0ogb) | 4.950 |
| OUTLET / OUTLETv2 | [v1](https://universe.roboflow.com/outletv2/outlet-4xvv4/dataset/1) | [Trang project](https://universe.roboflow.com/outletv2/outlet-4xvv4) | 11.204 |

Ba trang phiên bản cuối không đọc được bằng công cụ web trong phiên này; giấy phép được đối chiếu trên đúng trang project. Project/license công bố hiện tại không chứng minh toàn bộ lịch sử giấy phép từng ảnh/phiên bản. Số ảnh trong bảng là inventory local gồm ảnh đã augmentation, không phải số ảnh gốc hiện hiển thị trên Universe. Dataset nước/thiết bị gia đình, ảnh tổng hợp và admin upload không nằm trong bốn nguồn đã đối chiếu.

Theo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), cần ghi công phù hợp, dẫn giấy phép và ghi nhận thay đổi khi sử dụng/chia sẻ theo giấy phép. Studio điền sẵn tác giả, nguồn, URL phiên bản, link giấy phép; export có kế thừa hồ sơ sẽ giữ thông tin trong manifest và `ATTRIBUTION.txt`. Người dùng cần giữ thông tin nguồn đi kèm khi phân phối output.

## Dùng trong Studio

Tính năng có thêm endpoint Python, vì vậy cần **lưu tiến độ rồi khởi động lại Studio** nếu tiến trình cũ vẫn đang chạy. Không chỉ reload HTML.

1. Trong thư viện bấm **Nguồn dataset**, hoặc tab **Nguồn & quyền → Thiết lập một lần cho dataset**.
2. Chọn project/phiên bản. Bốn nguồn trên có thông tin công khai điền sẵn; nguồn khác cần hồ sơ thực tế riêng. Nhập tên và kiểm nội dung.
3. Tích xác nhận ở cấp dataset và bấm **Lưu hồ sơ cho dataset**. Làm một lần cho mỗi nguồn; không điền lại trên hàng nghìn ảnh.
4. Ảnh raw thuộc đúng nguồn/phiên bản sẽ có **Dùng hồ sơ chung của dataset**. Khi lưu nhãn, backend sao chép hồ sơ nguồn/quyền và pin revision vào event ảnh. Không cần tick lại quyền từng ảnh kế thừa. Nếu ảnh có ngoại lệ, bỏ kế thừa và khai báo riêng; checkbox quyền riêng phải được xác nhận lại.

Hồ sơ được ghi append-only trong `source-profiles.jsonl` của state, có hash-chain, reviewer và revision. Chỉ khớp `corpus=raw_source` + workspace/project/version/URL chính xác từ inventory, không suy nguồn theo tên file hoặc category. Profile có thể sửa trạng thái về hạn chế/chưa xác minh; annotation đã pin profile cũ bị chặn export/trial cho đến khi được xử lý và lưu lại. Export cũ đã tạo không tự bị xóa hoặc thu hồi; kiểm hồ sơ hiện hành trước lần sử dụng tiếp theo.

Hồ sơ không tự sửa annotation đã lưu, không HUMAN_VERIFIED hàng loạt và không cấp trạng thái test độc lập. Ảnh chưa review vẫn phải kiểm đối tượng/dấu hiệu. Restore annotation tạo NEEDS_REVIEW và bỏ pin kế thừa/xác nhận quyền; người dùng có thể chọn lại profile khi review/lưu revision mới.

## Kiểm thử

```bash
ai-service/.venv/bin/python scripts/ai-data-02/test_source_profiles.py
ai-service/.venv/bin/python scripts/ai-data-02/test_redesign.py
```

Test quyền/kế thừa chỉ chạy bằng ảnh fixture tự tạo trong state tạm. Không tạo hồ sơ VERIFIED cho dataset thật trong phiên triển khai này. Chromium kiểm cả popup hồ sơ, bắt xác nhận một lần, kế thừa vào ảnh và ngoại lệ thủ công. Các test Studio/trial hiện có được chạy hồi quy; chưa chạy train hoặc export dataset thật.
