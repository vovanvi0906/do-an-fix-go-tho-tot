# AI-DATA-02 — Báo cáo kiểm thử thực tế

Ngày thực hiện: 25/11/2026, Ubuntu local. Dùng Python từ `ai-service/.venv`, Chromium/Playwright đã có trong client; không tải dependency/model mới. Các thử nghiệm xác minh/rights/export thành công chỉ dùng ảnh fixture do test tạo trong `/tmp`, không áp dụng nhãn hay chứng cứ giả lập cho ảnh nguồn thật.

## Kết quả

| Kiểm tra | Kết quả và bằng chứng |
|---|---|
| Backend | **11/11 PASS**: [backend-tests.txt](evidence/backend-tests.txt) |
| Chromium | **14 luồng PASS**, 0 page error: [chromium-test.json](evidence/chromium-test.json) |
| Full inventory | 22.680 entry, API/grid tối đa 24 ảnh/trang; thumbnail lazy load. Pilot phân trang 24/24/2 |
| Real inference | **50/50 thành công, 0 lỗi kỹ thuật**, 0 cache hit ở lượt profile cuối: [pilot-inference-first-run.json](evidence/pilot-inference-first-run.json) |
| Thời gian worker | **12,163 giây**, gồm lazy model load và inference 50 ảnh, chưa gồm đọc inventory/hash profile trước khi worker timer bắt đầu |
| RAM inference | Peak **1.545,57 MiB**, torch 2 CPU threads; RSS guard 3.072 MiB |
| Cache/resume | **50/50 cache hit**, 0 lỗi, vòng xử lý 0,035 giây (chưa gồm profile); peak 237,8 MiB: [pilot-cache-resume.json](evidence/pilot-cache-resume.json) |
| Resource guard + recovery | Worker thử 512 MiB thoát code 70 với `RSS_LIMIT_EXCEEDED`; lần sau cùng queue/state 3.072 MiB hoàn tất 1/1: [resource-and-resume-test.json](evidence/resource-and-resume-test.json) |
| Pilot integrity | 50 ID đúng pilot cũ, **50 component khác nhau**, rehash đủ 50 ảnh khớp inventory, hashes 3 model khớp sau inference: [pilot-integrity.json](evidence/pilot-integrity.json) |
| Label proposals | 47/50 ảnh có target proposal, tối đa 3 target/ảnh; 59 object bbox proposal, 14 ảnh uncertain; **0 defect AI prediction, 0 HUMAN_VERIFIED** |
| Bảo toàn dữ liệu | Không có code path ghi ảnh nguồn/weights. Fixture export giữ nguyên bytes ảnh; source hash thay đổi bị chặn. Không sửa DB/application production |

Cache theo profile đã được chạy lại sau khi bổ sung fingerprint code inference và category candidate ID thực. Chứng cứ lưu ở đây thuộc **profile cuối** `2bec234e3c01a70c92723363354ef279839208a6623e3dba9c5048a0ca99fcc6`, không trộn với lượt triển khai ban đầu. [pilot-ai-proposals.json](evidence/pilot-ai-proposals.json) chứa từng proposal thực, score, model/code hashes và provenance; không chứa ảnh hay label ground truth.

## Các tình huống đã kiểm

Backend kiểm explicit human checks, revision conflict, history restore/reload và hash-chain tamper; nhiều sign và objectId link; reject unknown/invisible fault label, bbox <2 pixel hoặc source hash đổi; bulk không HUMAN_VERIFIED/copy bbox/cấp quyền; không nhận flag approvedGroundTruth hay boolean string thay xác nhận thật. Cache sai profile/source/hash không được dùng; AI mới không hạ trạng thái human review.

Export test chặn chưa review/quyền, báo imageId + thiếu điều kiện; không tạo version lỗi; YOLO/classification/CSV/JSON thành công trên fixture có bằng chứng sở hữu **fixture**; không ghi đè version/source. Grouping test có pixel→pHash bridge qua ảnh ngoài selection, giữ cùng split, tái lập theo seed, historical train và synthetic ở train. Empty annotation chưa duyệt không thành negative; OOS empty label chỉ xuất sau review tường minh. Review manifest chỉ NON-GT.

Chromium kiểm toàn inventory/pilot pagination, nút chạy batch thật từ UI với 50/50 cache hit, ảnh và provenance thật; vẽ/di chuyển/resize bbox, undo/redo, hai sign liên kết cùng object, lưu review, chặn verify thiếu check, xác nhận fixture từng ảnh, reload session, lịch sử restore, bulk queue, chặn official export thiếu điều kiện và export review manifest. Fixture đã được hủy sau test. Ảnh chụp dùng kiểm giao diện đặt tại `/tmp/fixgo-studio-real-pilot.png` và `/tmp/fixgo-studio-fixture.png`, không đưa ảnh nguồn vào dataset export chưa được duyệt.

## Giới hạn và điều kiện chưa hoàn thành về dữ liệu

- Chưa có `docs/ai-knowledge/`; **chưa tích hợp taxonomy defect theo target**. Cấu trúc adapter có sẵn, chỉ dùng 10 observable signs đã tồn tại. Checkpoint hiện có chỉ đề xuất object/category, không bịa defect.
- Pilot chỉ được phân luồng **ứng viên**: 9 ảnh có source fault claim, 3 normal-appearance candidate và 16 hard/scope candidate; các nhóm có overlap. Chưa có người dùng kiểm trực tiếp, nên chưa khẳng định đã đủ normal/abnormal/OOS thật. Đặc biệt vòi đang chảy không tự là leaking_faucet.
- **Chưa có nhãn nguồn thật HUMAN_VERIFIED hoặc quyền VERIFIED mới**. Official export của pilot phải bị chặn; user review/provenance/rights thật còn thiếu. Không sinh official training dataset để làm đẹp kết quả kiểm thử.
- Không có independent GT/test set: không báo accuracy, precision/recall, mAP hoặc độ chính xác dịch vụ. 50 ảnh thuộc development/model-exposed data; không gọi holdout độc lập.
- Component/hash là proxy bảo thủ, chưa có nhóm thiết bị/cảnh thật được xác minh. Split không có duplicate đã biết xuyên tập không đủ chứng minh hết semantic/source leakage.
- RAM guard lấy mẫu 250 ms, không là hard cgroup cap; lần thử 512 MiB quan sát 777,24 MiB trước khi dừng. Peak dưới 3 GiB ở pilot. UI là local single-reviewer; bulk có per-image event, không transaction nhiều ảnh; nét vẽ chưa lưu mất khi reload. EXIF khác 1/multiframe phải chuẩn hóa bằng quy trình riêng trước bbox/export; inventory hiện tại toàn EXIF 1.
- Export nghiên cứu `fixgo.studio.development.v1` không thay chuẩn ZIP importer `fixgo.dataset.v1` và không cấp approval production/training. Có thể thiếu cả train/val khi selection quá ít hoặc cùng exposure; manifest đánh dấu chưa tự đủ điều kiện train.

Không train/fine-tune/deploy, không thu thập ảnh Internet, không sửa raw dataset/model/application/DB, không commit/push. Dừng tại Studio, proposal pilot, công cụ export có gate, tài liệu và kết quả kiểm thử.
