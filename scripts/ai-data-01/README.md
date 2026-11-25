# AI-DATA-01 — Công cụ local, tách production

Các script này chỉ đọc nguồn và ghi **audit metadata hoặc proposal mới**, không train/inference model, không sửa database/raw/labels/weights. Dùng môi trường Python hiện có của ai-service; không tự cài/download. Audit cần Pillow, OpenCV, NumPy và PyYAML, reviewer dùng thêm Python standard library.

## 1. Snapshot catalog chỉ đọc

Dùng snapshot hiện có trong `docs/ai-data-audit/evidence/catalog.json`, hoặc đọc lại catalog với script riêng:

```bash
node scripts/ai-data-01/snapshot_catalog_readonly.cjs /tmp/fixgo-ai-data-catalog-new.json
```

Script chỉ cho DB local, transaction READ ONLY / RepeatableRead, select category/target/service/symptom/link và aiPrompts; không ghi DB, không in credentials. Cần file output mới, không ghi đè. Snapshot chuẩn package chỉ có category/target chưa đủ cho report tổng dịch vụ; dùng snapshot đầy đủ của tool này.

## 2. Quét metadata, ảnh và annotation

Từ gốc repository:

```bash
ai-service/.venv/bin/python -B scripts/ai-data-01/audit.py \
  --catalog /tmp/fixgo-ai-data-catalog-new.json \
  --data-root /home/vanvi/Work/datasetai \
  --output /tmp/fixgo-ai-data-scan-new --workers 4
```

Output phải chưa tồn tại và không chồng raw/prepared/classification sources. Tìm thư mục repo + dataset tree; canonical image ledger gồm raw, classification, hai ZIP20ảnh đã biết trong Downloads và admin uploads. Những bản sao prepared/trial/screenshots/Face chỉ có inventory thư mục để tránh đếm như nguồn độc lập. Không đọc ảnh qua Internet, không quét dữ liệu người dùng ngoài scope này.

Tính SHA, pixel hash, pHash, dHash, dimensions, technical errors; parse YOLO bbox/polygon tại chỗ. Không remap/sửa nhãn nguồn. pHash radius6 là queue ứng viên, không kết luận identity. `near-hash-edges.csv.gz` lưu cạnh giữa hash representatives, dHash/RMSE chỉ tham khảo. Giữ source annotation coordinates và source class khác ontology FixGo nếu chưa được người duyệt.

## 3. Chuẩn hóa ledger và báo cáo tái sử dụng

```bash
ai-service/.venv/bin/python -B scripts/ai-data-01/plan_reuse.py \
  --scan /tmp/fixgo-ai-data-scan-new \
  --output /tmp/fixgo-ai-data-report-new
```

Thư mục báo cáo tách scan và sources, không ghi đè báo cáo đã có. Policy giữ plumbing fault-region/leaf/surface context ở review thay vì dùng như whole-object bbox. CSV chuẩn hóa là ledger audit, **không metadata.csv import v1 hoặc approved training export**. Script tạo đủ8file theo task, object coverage70targets/693services và pilot review queue50 development-only; cỡ nguồn21437 là invariant của snapshot task hiện tại. Nếu dataset/catalog thay đổi cần cập nhật kế hoạch audit có version, không bỏ assert để ép báo cáo PASS.

## 4. Kiểm duyệt/gán nhãn local

```bash
ai-service/.venv/bin/python -B scripts/ai-data-01/review.py \
  --inventory docs/ai-data-audit/image-inventory.csv \
  --state /tmp/fixgo-ai-data-review --port 8766
```

Mở `http://127.0.0.1:8766`. Server chỉ bind loopback, không tự mở trình duyệt hoặc gọi dịch vụ bên ngoài. State phải ngoài repo, dataset tree và source Downloads. Có single-writer lock, pin SHA inventory/catalog/ontology và hash-chain; snapshot đổi phải dùng state mới, không gắn nhãn cũ lên ảnh/ontology revision mới; log bị thay ngoài writer/hỏng thì dừng, không tự sửa.

- Lọc nguồn/target/group/sign hoặc chuỗi metadata, phân trang24ảnh; đánh dấu nhiều ảnh và lưu hint/ghi chú, đề xuất loại hoặc cần xem.
- Mở một ảnh để vẽ bbox; nét đứt là annotation **nguồn chưa kiểm**, nét màu là bbox nháp. Với EXIF xoay không overlay source tự động.
- Chọn target ID hoặc sign code hiện hành trước khi vẽ. Box finite, chuẩn hóa, trong ảnh, ít nhất2pixel; không copy bbox hàng loạt.
- Có thể ghi “không thấy dấu hiệu” **dưới dạng đề xuất cho từng ảnh**; không bulk-confirm negative hoặc biến TXT rỗng thành negative.
- Mỗi lần ghi kiểm lại SHA ảnh. Proposals JSONL chứa reviewer display name tự khai, identity_verified=false, groundtruth/rights/independent review/training eligible đều false.
- Tải nhật ký qua link trên UI. Không nhập nó vào FixGo như approved export; chuyển review thủ công qua workflow production và gate hiện có nếu được yêu cầu sau.
- Các ô nguồn/quyền chưa biết để chưa xác minh. Không có nút auto-approve hoặc suy nhãn từ model.

Dừng Ctrl+C. Audit không để reviewer chạy nền sau bàn giao. State /tmp có thể mất khi khởi động lại; nếu cần lưu lâu, chọn thư mục audit riêng ngoài source, sao lưu log cùng evidence theo chính sách của dự án.

## 5. Kiểm thử an toàn

```bash
ai-service/.venv/bin/python -B scripts/ai-data-01/test_tools.py
```

Test chỉ tạo fixture /tmp: exact BK-tree so brute-force, invalid bbox/polygon, hash của ảnh không đọc được, source unchanged, proposal không cấp quyền, chống bbox cloning/approval flags/stale image, log tamper và token loopback. Browser smoke trong evidence dùng **ảnh fixture riêng**, không ghi nhãn lên ảnh raw thật.

## Trạng thái annotation đã có

Bước plan_reuse đọc riêng snapshot bbox-quality/upload journal ở vùng Admin local, kiểm hash chain và giữ các box đã lưu tách khỏi TXT immutable. Không đọc/xuất định danh tài khoản. Journal đổi trong lúc snapshot thì dừng. Một status confirmed hoặc quyền do event khai không được tự nâng thành independently approved GT. Đường review-state snapshot hiện mặc định theo layout local `~/Work/datasetai/06-benchmarks/ai01-admin-v1/reviews`; nếu dùng môi trường khác phải đối chiếu cấu hình trước khi coi overlay inventory đầy đủ.

Cột object_box_reuse_candidates_json đánh dấu bbox/polygon nguồn riêng lẻ có thể cứu dù ảnh còn nhãn khác cần review. Enclosing bbox từ polygon là phép hình học min/max trên tọa độ có sẵn, có transform metadata, không tự tạo bằng chứng bbox do người kiểm xác minh.
