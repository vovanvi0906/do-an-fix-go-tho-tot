# FIXGO AI-01 — TASK 01: bộ đánh giá baseline

Ngày thực hiện: 21/11/2026 (Asia/Ho_Chi_Minh). Đã đọc source AI/service resolver/customer và 10 báo cáo `docs/ai-thesis-audit/00..09`. Không thay model, prompt, threshold production, API, schema DB; không migration, ghi DB, commit/push hoặc sinh ảnh. Audit cũ giữ nguyên.

**Bàn giao công cụ thực nghiệm, chưa có kết quả độ chính xác học thuật.** [Smoke run](artifacts/smoke-run/run.json) chạy YOLO/CLIP thật qua v2 ASGI và resolver JS thật; catalog là snapshot trong bộ nhớ, không truy cập database. Ba ảnh có sẵn, không có nhãn chất lượng độc lập; `metrics.json` để null. Không diễn giải 9 lượt chạy thành accuracy hoặc kết quả thực địa. Mô tả trong smoke để rỗng, nên chưa kiểm chứng mức đóng góp text.

| Hạng mục | File |
|---|---|
| Truy vết YOLO/CLIP → resolver → catalog và khác biệt ID | [pipeline-taxonomy.md](pipeline-taxonomy.md) |
| Mapping 6 category / 70 target / 693 service từ bằng chứng API cũ; 70 static target / 25 static service | [taxonomy.json](artifacts/taxonomy.json) |
| Inventory, SHA256/pixel duplicate, near-duplicate candidates, leakage | [dataset-report.md](dataset-report.md), [dữ liệu chi tiết](artifacts/dataset-inventory.json) |
| Annotation contract, quy tắc và dữ liệu cần thu | [annotation-collection.md](annotation-collection.md), [JSON Schema](../../ai-service/eval/ai01/annotation.schema.json) |
| Runner, công thức, protocol và điều kiện công bố | [benchmark-guide.md](benchmark-guide.md) |

Phát hiện đã đo lại: 1.200 file, 654 SHA256 duy nhất; giao train/validation 210 hash, train/test 109, validation/test 109. Có 47.394 cặp near-duplicate candidates ở pHash distance ≤6, trong đó 21.732 cặp khác split (không bao gồm byte-identical). Không coi pHash là ground truth cùng thiết bị. Dataset hiện có không đủ điều kiện holdout độc lập.

Chạy kiểm tra công cụ từ root:

```bash
PYTHONDONTWRITEBYTECODE=1 ai-service/.venv/bin/python -B -m unittest discover \
  -s ai-service/eval/ai01 -p test_tools.py -v
```

Kiểm chứng bàn giao: **6/6 unit/contract tests đạt**; smoke cuối **9 lượt không lỗi**, gồm 6 lượt YOLO/CLIP thật và 3 lượt keyword text-only, qua resolver thật. Đã đối chiếu lại SHA256 của toàn bộ 1.200 ảnh với inventory; source hash trong smoke khớp bản bàn giao. `smoke-run-initial/` giữ lần kiểm tra trung gian, không dùng làm kết quả cuối.

Kiểm thử dựng record để kiểm công thức/guard được ghi rõ là unit test; không đưa chúng vào artifacts model predictions. Runtime production và dữ liệu người dùng không được sửa.
