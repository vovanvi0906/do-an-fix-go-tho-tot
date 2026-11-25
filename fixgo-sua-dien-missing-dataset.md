# FixGo — Dữ liệu còn thiếu của danh mục Sửa điện

Ngày kiểm tra: **24/11/2026**. Taxonomy lấy trực tiếp PostgreSQL bằng transaction **READ ONLY / RepeatableRead**, snapshot lúc `2026-11-24T10:30:26.473Z`. Không sửa dataset, nhãn, DB hoặc model; không train, không tạo ảnh, không commit/push. Chỉ tạo báo cáo này; script và snapshot phân tích nằm ở `/tmp`.

## 1. Kết luận và cách đọc số liệu

- DB có **29 đối tượng Sửa điện**, đều đang hoạt động. **Ổ cắm điện** có nhãn vật thể nguồn trực tiếp; **Điện mặt trời / Inverter** chỉ có ứng viên bối cảnh từ nhóm chất bẩn trong thư mục `giupviec`; **27 đối tượng còn lại không có nhãn/mapping nguồn hoặc bbox Admin tìm thấy**. Không có nhãn không chứng minh vật thể không xuất hiện trong nền ảnh: việc đó **Chưa xác minh**.
- Ổ cắm: **11.204 ảnh Roboflow + 3 ảnh Admin nhập**, không cộng bản sao prepared/quality/experiment thành ảnh mới. Trong 3 ảnh nhập: **2 chưa có bbox, 1 đã xác nhận bản sửa với 1 box vật thể + 1 box `burn_mark`**; **0 ảnh nhập đủ điều kiện xuất** tại thời điểm kiểm tra.
- Không có số đếm ảnh ổ cắm bình thường/cháy/nứt/hở dây đã được kiểm tra đầy đủ. Nhãn `OUTLET` chỉ chứng minh có nhãn nguồn về đối tượng, không chứng minh bình thường hoặc có lỗi.
- **Nguồn Roboflow, ảnh chụp thật và ảnh AI tạo là các thuộc tính khác nhau**. Không xác định thật/AI chỉ từ tên file hay kích thước ảnh. Ba ảnh nhập khai `own_photo`, nhưng đây là khai báo chưa được kiểm chứng; chưa tìm thấy metadata xác minh ảnh AI tạo. **Số ảnh AI thực có: Chưa xác minh**, không ghi là 0.
- Đề xuất tạo tối đa **2,960 ảnh AI theo 3 đợt**: P0 **480**, P1 **880**, P2 **1600**. Không cần tạo tất cả ngay: bắt đầu 20 ảnh/mỗi trường hợp P0, kiểm tra chất lượng rồi mới mở rộng. Các con số là **mục tiêu phát triển do báo cáo đề xuất, không phải ngưỡng bảo đảm độ chính xác**.

## 2. Dữ liệu đã đếm và kiểm tra thực tế

| Nhóm | Ảnh / nhãn hiện có | Bbox và mức xác minh |
|---|---:|---|
| Ổ cắm — raw Roboflow | 11.204 ảnh; tất cả có nhãn nguồn `OUTLET` | 11.191 bbox trên 11.189 ảnh hợp lệ về cấu trúc/tọa độ; thêm 15 ảnh có 15 polygon hợp lệ, không phải bbox YOLO 5 trường trực tiếp |
| Ổ cắm — checksum/ảnh | 11.204/11.204 ảnh giải mã được; hash ảnh và nhãn đều khớp inventory | 0 ảnh đã xác nhận chất lượng bbox nguồn bởi người trong journal hiện tại; không diễn giải “đúng tọa độ” thành “đúng vật thể/đủ vật thể” |
| Ổ cắm — trùng/nhóm | 11.202 pixel hash khác nhau; 2 bản redundant; 1.342 leakage group | 1.730 source-family candidate; đây không phải số thiết bị/phiên độc lập đã kiểm chứng |
| Ổ cắm — cần kiểm tra | 70 ảnh bị loại khỏi prepared object task | 65 ứng viên ảnh ghép, 3 ứng viên quảng cáo; các tập có thể chồng nhau. 1.723 ảnh có cờ near-duplicate. Cờ chỉ là ứng viên |
| Ổ cắm — prepared object | 8.803 train + 2.331 development-val = 11.134 ảnh | Đếm trực tiếp nhãn: 8.805 + 2.331 box; source-supervised chưa người xác nhận |
| Ổ cắm — strict-v2 đã dùng | 300 train / 100 balanced-val / 2.331 full-val | 302 / 100 / 2.331 box. Balanced-val là tập con full-val, không cộng; class-map cũ còn support trước lấy mẫu |
| Ổ cắm — 3 ảnh nhập | `img-22637`, `img-22638`, `img-22639` | Cùng 1 leakage group, tất cả train. Chỉ `img-22639` có bản sửa confirmed; chưa đủ nhóm/split/ảnh âm để train lỗi |
| Solar — nguồn cần đối chiếu | `giupviec`: 1.155 ảnh; 1.016 có nhãn chất bẩn, 139 nhãn rỗng | 2.861 box dấu hiệu nguồn hợp lệ về hình học; **0 box toàn panel/inverter**. Không mặc định 139 ảnh rỗng là bình thường |
| Solar — mapping có điều kiện | 1.016 ảnh có candidate solar; 964 được prepared sign-task giữ | Mapping `pending_context`, đồng thời có candidate bề mặt Giúp việc; không xác nhận tất cả thuộc Sửa điện, không suy cần sửa điện từ chất bẩn |

**Phân chia nguồn ổ cắm:** train 9.804 ảnh, valid 934, test 466. Prepared hiện gộp lại thành development: trong đó **361 ảnh mang sourceSplit=test nằm ở development-train, 103 ở development-val**. Đây là trạng thái lịch sử đang có, không thay đổi trong lượt kiểm tra; không coi development-val là test độc lập và không tiếp tục lấy tập test làm dữ liệu train mới. Cần đối chiếu mục đích split trước lần train sau.

### Dấu hiệu có dữ liệu, khác với lỗi đã được chứng minh

| Dấu hiệu | Ảnh có nhãn đã tìm thấy | Box | Đánh giá |
|---|---:|---:|---|
| Cháy/xém ở ổ cắm — `burn_mark` | 1 ảnh Admin đã lưu nhãn | 1 box dấu hiệu | Hợp lệ về hình học nhưng box rộng gần toàn cụm; chưa đủ nhãn chất lượng, thiếu quyền/nguồn/nhóm ở bản sửa |
| Nứt — `crack` / gãy vỡ — `broken_part` ở ổ cắm | 0 ảnh lưu nhãn tương ứng | 0 | Nhìn thấy dấu hiệu tương tự khi xem 3 ảnh nhập nhưng chưa có box nhãn này; số ảnh raw thực sự có dấu hiệu: **Chưa xác minh** |
| Lộ dây — `exposed_wire` | 0 ảnh có nhãn tìm thấy | 0 | **Chưa có trong sign-ontology của bbox editor hiện hành**; hằng số nhãn ảnh có tên này không đồng nghĩa pipeline bbox đã hỗ trợ |
| “Ổ cắm hỏng”, mất điện, tiếp xúc kém, chập chờn | Chưa xác minh | Không áp dụng | Không phải dấu hiệu hình ảnh đủ cụ thể; không gán trạng thái điện/chẩn đoán nguyên nhân từ ảnh tĩnh |
| `Birdpoop` → `bird_droppings` | 358 ảnh nguồn | 1.175 | Giống phân chim, chưa xác nhận đầy đủ bề mặt solar |
| `Dirt` → `surface_soiling` | 169 ảnh nguồn | 733 | Bụi/bẩn, không phải lỗi điện |
| `Leaf` → `leaf_debris` | 492 ảnh nguồn | 953 | Lá/rác bám, không phải lỗi điện |

Ba dòng chất bẩn có ảnh chồng lớp: **358 + 169 + 492 không phải số ảnh duy nhất**; hợp là 1.016. Số source box không thay cho số nhãn người xác nhận hoặc số ảnh đủ điều kiện train dấu hiệu Sửa điện.

### Chất lượng của ảnh nhập cần sửa trước

- Đã xem trực tiếp cả 3 ảnh nhập. Không xác định được nguồn thật/AI bằng ngoại hình; cần tác giả/nguồn gốc xác nhận. Không đổi provenance hiện tại.
- `img-22639`: box vật thể khoảng `[0.2134,0.0212,0.6878,1]`; box cháy `[0.1922,0.0042,0.7450,1]`, rộng và cao hơn cả box vật thể, bao cả ổ phía dưới. Cần thu box dấu hiệu quanh vùng có bằng chứng và gán nứt/gãy riêng nếu nhìn rõ; không tự sửa trong báo cáo.
- `rightsVerified=false`, các trường `rightsEvidence/sourceEvidence/groupEvidence` của bản sửa đang rỗng. Metadata import có khai báo không thay thế bước kiểm tra này. Vì vậy confirmed không đồng nghĩa export-eligible hoặc Ground Truth độc lập.

## 3. Đủ 29 đối tượng trong DB và tổng lượng bổ sung

**Quy ước:** cột nguồn là số ảnh có candidate/mapping, không phải số ảnh chứa vật thể đã kiểm chứng. “0 / ?” = 0 nhãn tìm thấy, số ảnh thực có vật thể/dấu hiệu **Chưa xác minh**. Bbox trong bảng là **bbox đối tượng**, không gộp box chất bẩn. Ảnh bình thường đã kiểm chứng độc lập: **Chưa xác minh** cho mọi đối tượng; không suy ra từ nhãn rỗng hay OUTLET. Nhãn bình thường đã được người lưu `none_visible` trong journal điện hiện tại: 0.

| Đối tượng FixGo (đang hoạt động) | Ảnh nguồn candidate | Ảnh có bbox đối tượng hợp lệ hình học | Admin có bbox | Thiếu gì / việc cần làm | AI tạo thêm | Ưu tiên |
|---|---:|---:|---:|---|---:|---|
| Dây điện / Cáp điện | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Hở cách điện/lộ lõi — nhãn mới đề xuất, Cháy/xém | 160 | P0 |
| Ổ cắm điện | 11.204 | 11.189 (11.191 box); +15 polygon | 1 ảnh / 1 box; chưa qua gate | Không thiếu số lượng OUTLET; thiếu nhãn dấu hiệu/âm và kiểm chất lượng | 320 | P0 |
| Aptomat / CB / MCB | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Cháy/xém, Gãy/vỡ | 120 | P1 |
| Bóng đèn / Đèn LED | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Nứt, Cháy/xém | 120 | P1 |
| Công tắc điện | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Nứt, Cháy/xém | 160 | P1 |
| Hộp nối điện / Hộp kỹ thuật | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 120 | P1 |
| Nguồn điện / Adapter / Bộ nguồn | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 120 | P1 |
| Tủ điện / Bảng điện | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Cháy/xém, Gãy/vỡ | 120 | P1 |
| Điện mặt trời / Inverter | 1.016 có điều kiện | 0 | 0 | Thiếu bbox toàn panel/inverter; kiểm lại nguồn bẩn trước khi tạo trùng | 120 | P1 |
| Bộ sạc xe điện / Ổ cắm sạc | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 100 | P2 |
| Chuông cửa / Nút nhấn | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Nứt | 100 | P2 |
| Công tắc thông minh / Relay | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 100 | P2 |
| Cảm biến / Thiết bị tự động | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Bụi/bẩn bám | 100 | P2 |
| Hệ thống điện phòng | 0 / ? | 0 | 0 | Phạm vi hệ thống/tác vụ; chưa có vật thể độc lập phù hợp bbox, dùng câu hỏi/thông tin thợ; không tạo “ảnh lỗi vô hình” | 0 | P2 — chưa tạo |
| Hệ thống điện toàn nhà | 0 / ? | 0 | 0 | Phạm vi hệ thống/tác vụ; chưa có vật thể độc lập phù hợp bbox, dùng câu hỏi/thông tin thợ; không tạo “ảnh lỗi vô hình” | 0 | P2 — chưa tạo |
| Kiểm tra / Khảo sát sự cố điện | 0 / ? | 0 | 0 | Phạm vi hệ thống/tác vụ; chưa có vật thể độc lập phù hợp bbox, dùng câu hỏi/thông tin thợ; không tạo “ảnh lỗi vô hình” | 0 | P2 — chưa tạo |
| Máy bơm nước – Phần điện | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 100 | P2 |
| Nguồn cấp cho thiết bị cố định | 0 / ? | 0 | 0 | Phạm vi hệ thống/tác vụ; chưa có vật thể độc lập phù hợp bbox, dùng câu hỏi/thông tin thợ; không tạo “ảnh lỗi vô hình” | 0 | P2 — chưa tạo |
| Quạt thông gió / Quạt hút | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Bụi/bẩn bám | 100 | P2 |
| Quạt trần / Quạt treo tường | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Bụi/bẩn bám | 100 | P2 |
| Thiết bị chống rò / Chống giật | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 100 | P2 |
| Thiết bị đo điện / Công tơ điện | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Nứt, Cháy/xém | 100 | P2 |
| Tiếp địa / Chống sét | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Hở cách điện/lộ lõi — nhãn mới đề xuất | 100 | P2 |
| Điện cửa cuốn / Cổng tự động | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 100 | P2 |
| Đèn ngoài trời / Sân vườn | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Nứt, Bề mặt ướt | 100 | P2 |
| Đèn sự cố / Đèn thoát hiểm | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 100 | P2 |
| Đèn trang trí / Đèn chùm | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Bụi/bẩn bám | 100 | P2 |
| Ổ cắm thông minh / Hẹn giờ | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 100 | P2 |
| Ổn áp / UPS / Bộ lưu điện | 0 / ? | 0 | 0 | Thiếu dữ liệu nhận diện đã gán nhãn + mẫu không thấy lỗi + Gãy/vỡ, Cháy/xém | 100 | P2 |

**Tổng AI đề xuất:** P0 480, P1 880, P2 1600; **2960 ảnh cho 25 đối tượng có phạm vi quan sát**, 4 đối tượng hệ thống/tác vụ chưa tạo. Số này là tổng các lượt khác nhau bên dưới, không cộng thêm lần nữa.

**Ảnh thực tế đề xuất thu riêng:** khởi đầu **20 ảnh mới/đối tượng × 25 = 500 ảnh**, dành để đánh giá thực tế có phân chia rõ và bằng chứng nguồn; ưu tiên 40 ảnh cho 2 đối tượng P0 trước. Ví dụ mỗi đối tượng 10 ảnh không thấy lỗi + 5 ảnh/mỗi hai dấu hiệu chính; riêng ổ cắm có thể chia 5 ảnh không thấy lỗi + 5 ảnh/mỗi 3 dấu hiệu. Đây cũng chỉ là mục tiêu nhỏ để phát hiện lỗi của thử nghiệm, không phải chứng nhận độ chính xác. Không tính 500 ảnh này vào 2.960 ảnh AI, không coi bản render mới của cùng cảnh là ảnh thực độc lập.

## 4. Các đợt tạo ảnh — từng trường hợp, số lượng và nhãn

**“Ảnh hiện có” dưới đây là số nhãn tương ứng đã lưu ở mức đối tượng–dấu hiệu**, không phải kết luận không có tình trạng đó trong ảnh raw. Trường hợp không thấy lỗi chưa có nhãn xác minh: 0 nhãn đã lưu; số ảnh thực sự bình thường **Chưa xác minh**. Các dòng 0 vì chưa gán nhãn phải được rà soát dữ liệu hiện có trước khi tạo đủ quota. Không trừ 1 box cháy chưa đạt chất lượng khỏi mục tiêu 120 ảnh cháy.

| Đối tượng | Dấu hiệu / tình trạng cần tạo | Ảnh hiện có | Ảnh AI bổ sung đề xuất | Mức ưu tiên | Nhãn dấu hiệu / bbox |
|---|---|---|---:|---|---|
| Dây điện / Cáp điện | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 60 | P0 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Dây điện / Cáp điện | Hở cách điện/lộ lõi — nhãn mới đề xuất | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 60 | P0 | `exposed_wire`; box dấu hiệu riêng — chưa hỗ trợ, cần mở rộng ontology trước |
| Dây điện / Cáp điện | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 40 | P0 | `burn_mark`; box dấu hiệu riêng |
| Ổ cắm điện | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 60 | P0 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Ổ cắm điện | Cháy/xém | 1 nhãn Admin; chưa đạt chất lượng/gate, raw Chưa xác minh | 120 | P0 | `burn_mark`; box dấu hiệu riêng |
| Ổ cắm điện | Nứt | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 80 | P0 | `crack`; box dấu hiệu riêng |
| Ổ cắm điện | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 60 | P0 | `broken_part`; box dấu hiệu riêng |
| Aptomat / CB / MCB | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P1 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Aptomat / CB / MCB | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 40 | P1 | `burn_mark`; box dấu hiệu riêng |
| Aptomat / CB / MCB | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 30 | P1 | `broken_part`; box dấu hiệu riêng |
| Bóng đèn / Đèn LED | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P1 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Bóng đèn / Đèn LED | Nứt | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 40 | P1 | `crack`; box dấu hiệu riêng |
| Bóng đèn / Đèn LED | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 30 | P1 | `burn_mark`; box dấu hiệu riêng |
| Công tắc điện | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 60 | P1 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Công tắc điện | Nứt | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P1 | `crack`; box dấu hiệu riêng |
| Công tắc điện | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P1 | `burn_mark`; box dấu hiệu riêng |
| Hộp nối điện / Hộp kỹ thuật | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P1 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Hộp nối điện / Hộp kỹ thuật | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 40 | P1 | `broken_part`; box dấu hiệu riêng |
| Hộp nối điện / Hộp kỹ thuật | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 30 | P1 | `burn_mark`; box dấu hiệu riêng |
| Nguồn điện / Adapter / Bộ nguồn | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P1 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Nguồn điện / Adapter / Bộ nguồn | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 40 | P1 | `broken_part`; box dấu hiệu riêng |
| Nguồn điện / Adapter / Bộ nguồn | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 30 | P1 | `burn_mark`; box dấu hiệu riêng |
| Tủ điện / Bảng điện | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P1 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Tủ điện / Bảng điện | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 40 | P1 | `burn_mark`; box dấu hiệu riêng |
| Tủ điện / Bảng điện | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 30 | P1 | `broken_part`; box dấu hiệu riêng |
| Điện mặt trời / Inverter | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 60 | P1 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Điện mặt trời / Inverter | Nứt | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 40 | P1 | `crack`; box dấu hiệu riêng |
| Điện mặt trời / Inverter | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 20 | P1 | `burn_mark`; box dấu hiệu riêng |
| Bộ sạc xe điện / Ổ cắm sạc | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Bộ sạc xe điện / Ổ cắm sạc | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Bộ sạc xe điện / Ổ cắm sạc | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `burn_mark`; box dấu hiệu riêng |
| Chuông cửa / Nút nhấn | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Chuông cửa / Nút nhấn | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Chuông cửa / Nút nhấn | Nứt | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `crack`; box dấu hiệu riêng |
| Công tắc thông minh / Relay | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Công tắc thông minh / Relay | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Công tắc thông minh / Relay | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `burn_mark`; box dấu hiệu riêng |
| Cảm biến / Thiết bị tự động | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Cảm biến / Thiết bị tự động | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Cảm biến / Thiết bị tự động | Bụi/bẩn bám | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `surface_soiling`; box dấu hiệu riêng |
| Máy bơm nước – Phần điện | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Máy bơm nước – Phần điện | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Máy bơm nước – Phần điện | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `burn_mark`; box dấu hiệu riêng |
| Quạt thông gió / Quạt hút | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Quạt thông gió / Quạt hút | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Quạt thông gió / Quạt hút | Bụi/bẩn bám | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `surface_soiling`; box dấu hiệu riêng |
| Quạt trần / Quạt treo tường | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Quạt trần / Quạt treo tường | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Quạt trần / Quạt treo tường | Bụi/bẩn bám | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `surface_soiling`; box dấu hiệu riêng |
| Thiết bị chống rò / Chống giật | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Thiết bị chống rò / Chống giật | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Thiết bị chống rò / Chống giật | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `burn_mark`; box dấu hiệu riêng |
| Thiết bị đo điện / Công tơ điện | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Thiết bị đo điện / Công tơ điện | Nứt | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `crack`; box dấu hiệu riêng |
| Thiết bị đo điện / Công tơ điện | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `burn_mark`; box dấu hiệu riêng |
| Tiếp địa / Chống sét | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Tiếp địa / Chống sét | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Tiếp địa / Chống sét | Hở cách điện/lộ lõi — nhãn mới đề xuất | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `exposed_wire`; box dấu hiệu riêng — chưa hỗ trợ, cần mở rộng ontology trước |
| Điện cửa cuốn / Cổng tự động | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Điện cửa cuốn / Cổng tự động | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Điện cửa cuốn / Cổng tự động | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `burn_mark`; box dấu hiệu riêng |
| Đèn ngoài trời / Sân vườn | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Đèn ngoài trời / Sân vườn | Nứt | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `crack`; box dấu hiệu riêng |
| Đèn ngoài trời / Sân vườn | Bề mặt ướt | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `wet_surface`; box dấu hiệu riêng |
| Đèn sự cố / Đèn thoát hiểm | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Đèn sự cố / Đèn thoát hiểm | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Đèn sự cố / Đèn thoát hiểm | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `burn_mark`; box dấu hiệu riêng |
| Đèn trang trí / Đèn chùm | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Đèn trang trí / Đèn chùm | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Đèn trang trí / Đèn chùm | Bụi/bẩn bám | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `surface_soiling`; box dấu hiệu riêng |
| Ổ cắm thông minh / Hẹn giờ | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Ổ cắm thông minh / Hẹn giờ | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Ổ cắm thông minh / Hẹn giờ | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `burn_mark`; box dấu hiệu riêng |
| Ổn áp / UPS / Bộ lưu điện | Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 50 | P2 | chỉ box đối tượng; signReview=none_visible sau kiểm tra |
| Ổn áp / UPS / Bộ lưu điện | Gãy/vỡ | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `broken_part`; box dấu hiệu riêng |
| Ổn áp / UPS / Bộ lưu điện | Cháy/xém | 0 nhãn tương ứng đã lưu; ảnh thực có: Chưa xác minh | 25 | P2 | `burn_mark`; box dấu hiệu riêng |

### Bối cảnh và nhãn đối tượng cho từng đợt

Mọi dòng ở bảng tạo ảnh dùng đúng đối tượng/slug dưới đây. **ID DB giữ nguyên** trong bảng tham chiếu; không tạo lớp mới từ tên dịch vụ. Mỗi ảnh cần bbox từng vật thể thuộc phạm vi; mỗi vùng dấu hiệu có box riêng, nhỏ và sát vùng nhìn thấy. Các vật thể khác có thể xuất hiện nhưng phải được kiểm tra đầy đủ, không ép một nhãn toàn ảnh.

| Đối tượng | Nhãn đối tượng (slug / ID) | Mô tả bối cảnh cần tạo — áp dụng riêng cho từng tình trạng ở bảng trên |
|---|---|---|
| Dây điện / Cáp điện | `day-dien-cap-dien` / `36d41107-3c4a-4a4e-9aa1-22cba07aed57` | dây đơn/cáp nhiều lõi, dây nổi/nẹp/trên bàn; vỏ nhựa và lõi đồng hợp cấu tạo, vị trí hở khác nhau |
| Ổ cắm điện | `o-cam-dien` / `ca1e389e-6302-4a19-a086-5c815a836473` | ổ âm/nổi và ổ nối, chuẩn ổ dùng tại Việt Nam; tường sơn/gạch, phòng khách/bếp; vùng lỗi ở một lỗ cắm hoặc mặt che |
| Aptomat / CB / MCB | `aptomat-cb-mcb` / `484e7b6f-469e-4b22-acd8-bae2b7ea60a1` | CB một/hai/ba cực trong bảng điện; chụp ngoài vỏ, đầu nối nhìn thấy; không kết luận vị trí ON/OFF là lỗi |
| Bóng đèn / Đèn LED | `bong-den-den-led` / `b45c19d2-93d2-43ac-8330-87d223d941b4` | bóng bulb/tuýp/đèn LED trần, đui và vỏ thật; đèn không sáng trong ảnh chưa đủ kết luận hỏng |
| Công tắc điện | `cong-tac-dien` / `f2b5a73e-b1e3-45c2-97c1-a09015ad18b6` | công tắc một/hai/ba nút, mặt âm/nổi; lỗi ở viền hoặc nút nhấn |
| Hộp nối điện / Hộp kỹ thuật | `hop-noi-dien-hop-ky-thuat` / `56d03ad1-b3a0-469a-bf79-ec9e83d23e08` | hộp nối nổi/âm, vuông/tròn, tường/trần; hỏng nắp hoặc thành hộp, không tự suy tiếp xúc bên trong |
| Nguồn điện / Adapter / Bộ nguồn | `nguon-dien-adapter-bo-nguon` / `199c79fa-7e5d-424f-bb45-f2fd9242024f` | adapter ngoài/bộ nguồn có vỏ, bàn làm việc hoặc gắn tường; giữ chân cắm/dây đúng cấu tạo |
| Tủ điện / Bảng điện | `tu-dien-bang-dien` / `470acb27-41b1-4d36-9ee3-84b9bbc857de` | tủ điện dân dụng nắp đóng/mở, trong hành lang hoặc phòng kỹ thuật; xác định box toàn tủ và vùng hỏng riêng |
| Điện mặt trời / Inverter | `dien-mat-troi-inverter` / `72afafec-8d91-4ed9-b153-238d314ddfdf` | tấm pin trên mái và inverter trên tường; cân bằng hai kiểu con, không dùng box chất bẩn làm box thiết bị |
| Bộ sạc xe điện / Ổ cắm sạc | `bo-sac-xe-dien-o-cam-sac` / `34f7d2f7-e63f-4081-b968-2b8275cab527` | hộp sạc/đầu sạc/dây sạc xe điện ở chỗ đỗ xe; đầu nối đúng cấu tạo, không coi không sạc là dấu hiệu ảnh |
| Chuông cửa / Nút nhấn | `chuong-cua-nut-nhan` / `b5e21dc2-ed41-4aaa-9f0f-8f5f5aaf025c` | nút chuông/hộp chuông cạnh cửa, nhiều kiểu vỏ; không suy không kêu từ ảnh |
| Công tắc thông minh / Relay | `cong-tac-thong-minh-relay` / `1c1b61c3-be55-4d27-8a32-46410e2a2017` | công tắc thông minh gắn tường/relay trong hộp; phân biệt rõ với công tắc cơ, không vẽ mạch điện tưởng tượng |
| Cảm biến / Thiết bị tự động | `cam-bien-thiet-bi-tu-dong` / `56725529-2a0c-4bdf-a437-4f18d98b5939` | cảm biến chuyển động/ánh sáng, tường/trần; giữ chi tiết đặc trưng, không suy mất kết nối |
| Máy bơm nước – Phần điện | `may-bom-nuoc-phan-dien` / `bc70283c-4093-4574-aa3f-f5ef1fcdb353` | hộp đấu điện/vỏ bảo vệ phần điện của máy bơm, bối cảnh cạnh máy bơm; không gán toàn máy sang lỗi điện |
| Quạt thông gió / Quạt hút | `quat-thong-gio-quat-hut` / `9b5276c6-9692-46be-a8ad-f3e1afdac569` | quạt hút tường/trần nhà bếp/nhà tắm; cánh/lưới vỡ, bụi thật; không suy hỏng motor |
| Quạt trần / Quạt treo tường | `quat-tran-quat-treo-tuong` / `492a7d40-96f6-4b1a-8146-34956f8a95f8` | quạt trần và quạt treo, phòng ở; cánh/vỏ gãy hoặc bụi nhìn thấy, không suy quay chậm/rung từ ảnh tĩnh |
| Thiết bị chống rò / Chống giật | `thiet-bi-chong-ro-chong-giat` / `9a3f2d63-e61b-4d6c-8ff0-15e179c15d02` | RCD/RCCB có nút test nhìn thấy; không gán mọi CB thành chống giật hoặc suy chức năng bảo vệ |
| Thiết bị đo điện / Công tơ điện | `thiet-bi-do-dien-cong-to-dien` / `93797cd8-e539-456e-a38f-f76316e84107` | công tơ hoặc thiết bị đo trong hộp, hiển thị và đầu nối hợp cấu tạo; không suy đo sai hoặc điện áp từ ngoại hình |
| Tiếp địa / Chống sét | `tiep-dia-chong-set` / `aa15b0ce-a9e6-4faf-9c87-1d5102d339f5` | dây tiếp địa/điểm nối/bộ phận chống sét có bối cảnh nhận biết; không coi lõi trần thiết kế đúng là lỗi, chỉ gán hở cách điện ở đoạn vốn có vỏ |
| Điện cửa cuốn / Cổng tự động | `dien-cua-cuon-cong-tu-dong` / `2fe406ed-6aae-4f00-b90f-b262e69645e5` | motor/hộp điều khiển cửa hoặc cổng trong bối cảnh thật; định nghĩa phạm vi box bộ phận nhìn thấy trước khi gán |
| Đèn ngoài trời / Sân vườn | `den-ngoai-troi-san-vuon` / `2f246a0e-3617-4083-83da-2713460741cb` | đèn tường/trụ sân vườn, ngày/chiều; chụp bề mặt ướt rõ, không suy hỏng do nước |
| Đèn sự cố / Đèn thoát hiểm | `den-su-co-den-thoat-hiem` / `8e1b308f-a8cd-4de8-9a30-6db52cfdb32c` | đèn khẩn cấp/biển thoát hiểm hành lang; vỏ vỡ/xém rõ, không suy chai pin hay mất nguồn |
| Đèn trang trí / Đèn chùm | `den-trang-tri-den-chum` / `667cd41a-d6ab-42fa-808c-08898ba947dc` | đèn chùm/đèn trang trí trên trần, thủy tinh/kim loại; box lỗi phần gãy riêng, không suy chập điện |
| Ổ cắm thông minh / Hẹn giờ | `o-cam-thong-minh-hen-gio` / `215bc4ef-6d9d-49ec-841f-4a9fb91868f5` | ổ smart plug/hẹn giờ dạng cắm rời, nút điều khiển nhìn thấy; tránh hình giống ổ thường nhưng ghi nhãn smart |
| Ổn áp / UPS / Bộ lưu điện | `on-ap-ups-bo-luu-dien` / `ec503642-d273-4742-bf35-e8b3d509e7e5` | UPS/ổn áp ở sàn hoặc bàn, bảng điều khiển/vỏ hợp cấu tạo; không suy lỗi pin hoặc đầu ra điện áp |

### Mô tả dấu hiệu — ghép với từng đối tượng và bối cảnh ở trên

| Mã tình trạng | Mô tả hình ảnh cần tạo | Cách gán nhãn |
|---|---|---|
| Không thấy dấu hiệu lỗi (màu vật liệu/mối ghép dễ nhầm) | Vật thể nguyên vẹn; đa dạng màu vật liệu, bóng tối và mối ghép dễ nhầm nhưng không có dấu hiệu trong ontology; không yêu cầu AI thể hiện “đang hoạt động tốt”. Ảnh có bụi thật phải gán surface_soiling, không tự tính là none_visible. | Không tạo lớp healthy; object bbox + đánh dấu quan sát |
| Cháy/xém | Vùng ám muội/xém có cấu trúc và vị trí hợp lý, có thể kèm nhựa biến dạng; chỉ một vùng rõ. Thay đổi nhẹ/vừa/nặng, không thêm tia lửa hoặc suy nguyên nhân. | `burn_mark` đang có trong sign-ontology |
| Nứt | Đường nứt thật trên vỏ/mặt che/kính, phân biệt với mối ghép, họa tiết, bóng đổ; không gán “nứt” nếu chỉ bẩn. | `crack` đang có trong sign-ontology |
| Gãy/vỡ | Một phần vỏ/cánh/nắp hoặc chi tiết bị gãy/vỡ có rìa và phần thiếu hợp lý; không bịa cấu tạo bên trong. | `broken_part` đang có trong sign-ontology |
| Hở cách điện/lộ lõi — nhãn mới đề xuất | Đoạn vỏ cách điện rách/hở làm lộ lõi ở vị trí lẽ ra có vỏ; không coi đầu nối hoặc dây tiếp địa trần đúng thiết kế là lỗi. Chỉ chuẩn bị ảnh, chưa gán thành class bbox đang hỗ trợ. | Nhãn mới đề xuất, chưa hỗ trợ |
| Bề mặt ướt | Giọt/vệt nước nhìn thấy trên bề mặt ngoài; đây là quan sát, không chứng minh thiết bị hỏng hoặc nước đã vào mạch. | `wet_surface` đang có trong sign-ontology |
| Bụi/bẩn bám | Bụi/bẩn bám nhìn thấy rõ, mức độ mỏng/vừa/dày; không suy chập điện, không trộn với dấu cháy. | `surface_soiling` đang có trong sign-ontology |

**Đa dạng cho từng dòng cần tạo:** chính diện/nghiêng trái/nghiêng phải/nhìn từ trên; cận cảnh/vừa/toàn cảnh có thiết bị; ánh sáng ban ngày/đèn trong nhà/thiếu sáng vẫn nhìn được dấu hiệu; cũ/mới, nền tường/gạch/gỗ, nhà ở/cửa hàng; lỗi nhẹ/vừa/nặng. Phân bổ gần đều theo góc và độ hư hỏng, thay kiểu thiết bị/cảnh thực sự, không chỉ lật/xoay/crop một ảnh. Ảnh hiện có đã có nhiều biến thể Roboflow lật/xoay/nhiễu; không tính biến thể cùng gốc là mẫu độc lập mới.

### Prompt mẫu gửi ChatGPT — dùng cho TỪNG dòng trong bảng

```text
Tạo [N, bắt đầu 10–20] ảnh riêng biệt cho dữ liệu phát triển FixGo.
Danh mục: Sửa điện.
Đối tượng: [tên trong bảng], nhãn đối tượng [slug].
Tình trạng: [một tình trạng trong bảng], mã nhãn [sign code hoặc none_visible].
Bối cảnh thiết bị: [sao chép mô tả của đối tượng ở bảng].
Dấu hiệu phải nhìn thấy: [sao chép mô tả dấu hiệu ở bảng].
Phong cách ảnh chụp điện thoại trong bối cảnh nhà ở Việt Nam; nhiều kiểu thiết bị,
góc chụp và nền khác nhau. Giữ hình học, số lỗ cắm/chân cắm/cánh quạt/đầu nối đúng cấu tạo.
Mỗi ảnh là một cảnh độc lập, không ảnh ghép, không chữ quảng cáo/logo/watermark,
không vẽ sẵn bounding box hoặc nhãn lên ảnh. Không nhân bản cùng cảnh rồi chỉ đổi màu.
Không biểu diễn các chẩn đoán vô hình như mất điện, rò điện, chập mạch, sai điện áp.
Xuất từng ảnh riêng, kèm danh sách mô tả vùng vật thể và dấu hiệu để người gán nhãn đối chiếu.
Toàn bộ ảnh phải ghi rõ là ảnh AI tạo, không phải ảnh chụp thực tế.
```

Ví dụ đợt đầu: **20 ảnh ổ cắm cháy/xém**, dùng `o-cam-dien` + `burn_mark`; 5 chính diện, 5 nghiêng trái, 5 nghiêng phải, 5 cận vùng hỏng nhưng vẫn nhận biết ổ cắm. Sau khi xem loại bỏ lỗi hình học/ảnh trùng mới tạo các đợt tiếp đến mục tiêu 120. Với nứt/vỡ tạo đợt riêng; nếu cùng ảnh có nhiều dấu hiệu thì gán đủ nhưng chỉ đếm ảnh một lần trong tổng kho ảnh.

## 5. Không tạo trùng, không nhầm nguồn và không vượt gate

1. **Trước khi tạo:** ưu tiên rà 3 ảnh nhập, 653 ảnh ổ cắm trong quality queue và 1.016 ảnh chất bẩn có candidate solar; chốt phạm vi box và bảng quota. Tái sử dụng ảnh phù hợp thay vì mặc định phải sinh ảnh mới; quota có thể giảm sau rà soát, chưa biết chính xác mức giảm.
2. **Sau khi tạo:** so SHA/pixel hash với raw + uploaded + bộ tham chiếu được bảo vệ; dùng pHash và kiểm tra bằng mắt để tìm gần trùng. Trong hệ thống hiện có pHash khoảng cách ≤6 là candidate, không phải kết luận cùng ảnh. Prompt khác nhau không bảo đảm ảnh không trùng.
3. **Ghi nguồn:** lưu model tạo ảnh, phiên bản nếu biết, prompt, ngày tạo, mã lô/cảnh và quyền sử dụng thực tế. Những biến thể cùng cảnh/ảnh tham chiếu dùng chung group; không tạo mã group giả để vượt kiểm tra split. Bộ ảnh AI chỉ dùng thử nghiệm phát triển theo chính sách được thống nhất, đánh giá hiệu quả phải có ảnh thực độc lập.
4. **Hạn chế hiện tại:** import API chỉ nhận `own_photo / licensed / permission`, chưa có loại synthetic, chưa có cờ loại ảnh AI hoặc tùy chọn train-only. Không khai ChatGPT thành ảnh tự chụp, không sửa journal để lách. Cần hỗ trợ provenance/split cho synthetic trước khi nhập lô AI vào quy trình này; lượt này chỉ ghi yêu cầu, không sửa code.
5. **Hạn chế nhãn:** ontology bbox hiện có `burn_mark`, `crack`, `broken_part`, `wet_surface`, `surface_soiling` và các dấu hiệu khác nhưng **không có `exposed_wire`**. Cần thống nhất và bổ sung ontology/mapping theo yêu cầu riêng trước khi dùng dữ liệu hở dây; không chọn “vết nứt” để thay nhãn hở dây.
6. **Chất lượng bbox:** box đối tượng bao phần vật thể thấy được; box dấu hiệu bao vùng dấu hiệu thực tế. Không khoanh cả cụm ổ cắm thành một dấu cháy. Vật thể nguyên vẹn/không thấy dấu hiệu phải được người xem hết rồi mới đánh `none_visible`; ảnh nhãn rỗng không tự thành ảnh âm.
7. **Train thử sau này:** code hiện yêu cầu mỗi lớp ít nhất 20 ảnh train + 5 val, ≥2 nhóm train + ≥1 nhóm val, cùng ≥5 ảnh âm train + ≥2 ảnh âm val và đủ export gate. Đây là **engineering minimum trong code**, khác với mục tiêu đề xuất ở đây và không bảo đảm chất lượng; không train hoặc đổi các ngưỡng trong lượt này. Ba ảnh nhập cùng một nhóm train không đáp ứng.
8. **Không hứa ảnh AI bảo đảm chính xác:** ảnh tạo thêm không thay thế xác minh nhãn, ảnh thực, phân tích lỗi và tập kiểm chứng. Ảnh lỗi giả cấu tạo phải loại, không cố gán nhãn cho đủ số lượng.

## 6. Nguồn và khả năng tái kiểm tra

| Nguồn đã đọc | Dùng để kiểm tra |
|---|---|
| `server/scripts/ai01/snapshot_catalog.cjs` | Đọc trực tiếp 6 danh mục/70 đối tượng DB; lọc 29 đối tượng Sửa điện, transaction READ ONLY |
| `/home/vanvi/Work/datasetai/01-raw/suadien/data.yaml` | Một class OUTLET; workspace outletv2 / outlet-4xvv4 / v1, khai CC BY 4.0 |
| `/home/vanvi/Work/datasetai/01-raw/suadien/README.roboflow.txt` | 11.204 ảnh, resize 416×416, nguồn có biến thể lật/xoay/nhiễu |
| `/home/vanvi/Work/datasetai/02-development/ai01-prepared-v1/records.jsonl` | 21.437 record toàn kho, lọc nguồn + mapping Sửa điện xuyên thư mục; đếm split/nhãn/duplicate/task |
| `/home/vanvi/Work/datasetai/02-development/ai01-prepared-v1/normalized-mapping.json` | Mapping nguồn OUTLET và solar có điều kiện; không coi source label là lỗi đã xác minh |
| `/home/vanvi/Work/datasetai/02-development/ai01-quality-v1/drafts.jsonl` | 653 ảnh source suadien trong quality packet |
| `/home/vanvi/Work/datasetai/02-development/ai01-quality-v1/sign-ontology.json` | 10 dấu hiệu bbox hiện hành; không có exposed_wire |
| `/home/vanvi/Work/datasetai/03-experiments/ai01-task04a-strict-v2/data/labels` | Đếm trực tiếp lớp outlet train/val/full_val thay vì lấy class-map cũ |
| `/home/vanvi/Work/datasetai/06-benchmarks/ai01-admin-v1/reviews/uploaded-dataset-v1/events.jsonl` | 3 ảnh nhập, hash ảnh gốc/chuẩn hóa, khai báo nguồn, group/split |
| `/home/vanvi/Work/datasetai/06-benchmarks/ai01-admin-v1/reviews/bbox-quality-v1/events.jsonl` | 6 sự kiện bbox; dùng bản mới nhất, không đếm lịch sử thành nhiều ảnh |
| `docs/ai01-admin/DATASET-PREPARATION-RESULTS.txt; docs/ai01-admin/TASK04B-RESULTS.txt` | Đối chiếu báo cáo chuẩn hóa và giới hạn source-supervised |
| `ai-service/training/visual_service_training.py; server/scripts/ai01/quality_review.py` | Engineering minimum, validation và export blockers |

**Kiểm tra đã chạy:** SHA ảnh/nhãn raw ổ cắm 11.204/11.204 và nguồn chất bẩn 1.155/1.155 khớp record; giải mã toàn bộ 12.359 ảnh thuộc hai nguồn này; hash 3 ảnh nhập và ảnh gốc khớp import event. Kiểm hash chain của 3 journal imported/bbox/fast-label. Các manifest records/mapping/catalog/drafts/ontology/inventory đã đối chiếu pin SHA256; không tuyên bố đã kiểm toàn bộ mọi artifact/model của hệ thống. Không chạy inference, training hoặc kiểm định chất lượng thị giác toàn bộ 12.359 ảnh.

**Cần người xác minh tiếp:** số ảnh chụp thật/AI, số cảnh độc lập thực tế, tình trạng bình thường/lỗi trong ảnh chưa gán, nguồn và quyền của ảnh nhập, chất lượng bbox từng ảnh, domain panel/inverter của nguồn chất bẩn. Không tự điền các số này từ tên file hoặc từ output model.
