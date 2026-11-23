# Dataset inventory và leakage

Quét lại toàn bộ `ai-service/dataset/` bằng [inventory.py](../../ai-service/eval/ai01/inventory.py); kết quả đầy đủ ở [dataset-inventory.json](artifacts/dataset-inventory.json). Chỉ đọc ảnh, không chạy generator/training và không di chuyển/xóa dữ liệu.

| Split | File | SHA256 duy nhất |
|---|---:|---:|
| train | 840 | 646 |
| val | 240 | 213 |
| test | 120 | 114 |
| Toàn bộ | 1.200 | 654 |

Mỗi folder class có 200 ảnh; 6 lớp `dien_lanh`, `lam_vuon`, `other_unclear`, `sua_dien`, `sua_nuoc`, `thiet_bi`. Không có giup_viec. Nhãn folder chỉ chứng minh cách tổ chức category, không có nhãn target/fault/symptom/service hay chuyên gia xác nhận. Không có lỗi decode trong lần quét.

Exact leakage: train/val chung 210 hash; train/test 109; val/test 109. Đây là **số hash giao nhau**, không phải số ảnh hay số cặp. Artifact có cả exact duplicate groups và pixel duplicate groups để truy ngược từng đường dẫn.

Near-duplicate: resize grayscale 32×32 → DCT → khối 8×8 bỏ DC → median AC → 63-bit pHash, Hamming ≤6. Tìm 47.394 cặp khác SHA256, trong đó 21.732 cặp khác split. Có thể gồm ảnh pixel-identical nhưng JPEG khác, biến thể template và ảnh khác bị hash giống; phải duyệt người. Ngưỡng này là heuristic audit, không hiệu chỉnh bằng độ chính xác test. Không tự chuyển ứng viên thành cùng thiết bị. Crop/đổi góc lớn có thể bị bỏ sót, vì vậy không có candidate cũng chưa chứng minh độc lập.

## Nguồn và giới hạn provenance

`ai-service/training/prepare_dataset.py:generate_class_images` vẽ ảnh OpenCV theo template từng lớp; `build_dataset` gọi generator riêng mỗi split và lặp index. Seed dùng `hash(cls_key)` không ổn định giữa process, nền random trước seed; không đủ metadata tái lập từng run. File có lệnh `shutil.rmtree(DATASET_DIR)` nên **không chạy script này để sửa split**.

`dataset_info.json` nêu tên Roboflow/Kaggle/HVAC/Survey nhưng không có URL, license, consent hay trace từng ảnh. Manifest cũ ghi synthetic_ratio=1.0 nhưng đó là khai báo trong code. Kết luận được hỗ trợ: có generator synthetic, exact leakage và thiếu provenance; chưa chứng minh forensic nguồn từng file hiện tại. Không nhận ảnh này là khảo sát thực địa.

`ai-service/eval/images/` có 6 JPG fixture (appliance/garden/face và before/after/diff-angle), không có nhãn sự cố độc lập. Ba ảnh dùng smoke được hash trong `smoke-manifest.jsonl`; không nhập vào holdout nghiên cứu. `runs/classify/...` có batch images/confusion matrices/results.csv là training artifacts, không phải ảnh sự cố độc lập. Các benchmark fixture/predicted label/latency cũ và `eval/classify_dataset.py` có path-hint/confidence fallback phải loại khỏi báo cáo chất lượng. Không dùng đường dẫn file làm đặc trưng inference.

## Tạo split độc lập, giữ dữ liệu gốc

1. Quarantine dữ liệu thiếu nguồn/device/session. Bộ hiện tại dùng kiểm tích hợp; không “làm sạch” bằng đổi tên rồi dùng làm test học thuật. Weights YOLO đã train từ dữ liệu liên quan nên re-split cùng nguồn không khôi phục holdout sạch.
2. Thu deviceId (thiết bị được sửa), sessionId (phiên chụp), siteId và duplicateGroup do người duyệt; cùng thiết bị, phiên, địa điểm hoặc exact/near family phải cùng connected component. Camera phone ID ghi trong metadata thu thập phụ, không nhầm với deviceId.
3. Duyệt near candidates bằng thông tin hiện trường; nối nhóm bắc cầu. Vẽ cùng template có thể nối thành component rất lớn; không ép tách để đạt tỷ lệ đẹp.
4. [split.py](../../ai-service/eval/ai01/split.py) đề xuất manifest mới bằng hash component + seed, kỳ vọng 70/15/15, không bảo đảm stratification/số lượng từng lớp. Thiếu device/session/duplicateGroup → quarantine cả component. Chỉ viết file mới (`open x`), không copy/xóa ảnh.
5. Kiểm số nhóm độc lập mỗi class và cân đối trên metadata trước khi xem output test. Nếu thiếu nhóm, thu thêm; không đổi seed vì model làm sai trên test. Validation dành cho prompt/threshold; test giữ kín, một lần đánh giá protocol đã khóa. Train có thể giữ trống khi chưa huấn luyện.

```bash
ai-service/.venv/bin/python ai-service/eval/ai01/inventory.py \
  --root ai-service/dataset --out /tmp/ai01-inventory.json --threshold 6
ai-service/.venv/bin/python ai-service/eval/ai01/split.py \
  --dataset /path/annotated.jsonl --out /path/proposed-splits.jsonl --seed fixgo-ai01-v1
```

Inventory là đo dữ liệu, không là dự đoán model. Khi thu dữ liệu mới, chạy lại exact/pixel/near audit trên toàn train/validation/test trước khi khóa test; lưu artifact hash cùng protocol. Công cụ split chỉ tin duplicateGroup đã duyệt, không tự chạy pHash trên annotation manifest.
