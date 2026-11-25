# Tự động gán nhãn — dữ liệu AI chưa kiểm chứng

## Dùng nhanh

1. Lưu bản đang chỉnh rồi khởi động lại Studio bằng `ai-service/.venv/bin/python scripts/ai-data-02/studio.py` nếu server cũ đang chạy. Tính năng này thêm endpoint/worker Python nên chỉ reload HTML là chưa đủ.
2. Trong thư viện, chọn bộ lọc phù hợp; bỏ Pilot 50 nếu muốn toàn tập. Bấm **Tự động gán nhãn**.
3. Chọn **Toàn bộ ảnh đang lọc (mọi trang)** hoặc **Ảnh đã chọn**, rồi **Chạy tự động**. Không cần mở và xác nhận từng ảnh. Những ảnh đã có revision người dùng, kể cả bản nháp, được bỏ qua.
4. Xem số đề xuất, ảnh cần kiểm tra, lỗi và nhóm/gần trùng. Có thể lọc hàng đợi, mở một số ảnh để kiểm mẫu. Nhãn vẫn AI_PROPOSED; không sinh HUMAN_VERIFIED.
5. Khi hoàn tất, đặt version và bấm **Xuất YOLO nhãn AI**. Không có bước phê duyệt từng nhãn. Hồ sơ nguồn/quyền của dataset phải được xác nhận một lần từ trước để copy ảnh; ảnh lỗi, mâu thuẫn, có revision người dùng hoặc thiếu hồ sơ quyền sẽ được liệt kê trong `excluded` và không copy.

Nút **Dừng sau ảnh hiện tại** dừng ở ranh giới ảnh; **Tiếp tục từ cache** chạy lại cùng request. Source hash và model profile vẫn được kiểm. Đóng popup không dừng worker. Tắt server sẽ kết thúc worker do server tạo; lần mở tiếp theo có thể tiếp tục. Lỗi đọc/inference của một ảnh không làm dừng toàn tập; lỗi nạp model hoặc vượt RAM sẽ dừng để xử lý/tiếp tục.

## Khả năng thực tế

Mặc định tái sử dụng CLIP ViT-B/32, YOLO classifier và detector strict-v2 đã có. Các checkpoint này nhận diện nhóm/thiết bị, **không phát hiện vết cháy/nứt**. Vì vậy:

- Có thể tự tạo nhãn/vùng thiết bị trong khả năng detector.
- Không lấy tên file, nhãn nguồn `burn_mark` candidate hay tình trạng mặc định NORMAL của UI để chế tạo vùng dấu hiệu.
- Không phát hiện dấu hiệu không có nghĩa bình thường. `outcome` của nhãn tự động luôn UNKNOWN.
- Chế độ **Thiết bị + dấu hiệu** chỉ bật khi request có checkpoint dấu hiệu local hợp lệ. Nếu chưa có, export chỉ chứa class object, tránh biến thiếu nhãn dấu hiệu thành ảnh âm.

Có model dấu hiệu: mở phần nâng cao, nhập đường dẫn manifest. Ví dụ cấu trúc, **chỉ điền hash và tên class đúng checkpoint thực tế**, không đổi tên class COCO để giả thành detector cháy:

```json
{
  "schema": "fixgo.studio.pseudo-detector.v1",
  "task": "detect",
  "weights": "burn-detector.pt",
  "weightsSha256": "<SHA256 checkpoint local>",
  "threshold": 0.5,
  "classes": [
    {"name": "object:o-cam-dien", "kind": "object", "targetId": "<ID thật trong catalog>"},
    {"name": "sign:burn_mark", "kind": "sign", "code": "burn_mark", "targetId": "<ID thật trong catalog>"}
  ]
}
```

Class index theo thứ tự array và phải khớp `model.names`; task phải detect. `targetId` của sign có thể bỏ trống nếu model không chuyên thiết bị; khi đó cần một object bao quanh rõ ràng. Model sign-only dùng object geometry từ detector nền. Model object+sign dùng object geometry của chính nó để tránh tạo object trùng với detector nền. Sign phải có một object tương thích bao ít nhất 80% diện tích; mơ hồ/không có parent thì đưa vào hàng đợi, không chế bbox hoặc gắn bừa. Confidence chưa được hiệu chỉnh, threshold không phải cam kết độ chính xác.

Tool không tải dependency/weights, không train model dấu hiệu và không tạo phê duyệt production. Quy trình chỉ tự động được những nhãn mà model thực tế hỗ trợ.

## Cache, nhóm và trạng thái

- Một worker tuần tự, 2 CPU threads; giới hạn queue 50.000 ID. Nút AI cũ vẫn giới hạn 500, không thay contract cũ.
- Source bytes được rehash trước dùng cache. Ảnh trùng **đúng SHA bytes** có thể dùng lại kết quả của ảnh trước trong cùng queue, với ID/path/hash cache mới và trường `reusedFromImageId`. Không sao chép nhãn giữa ảnh chỉ gần giống.
- Nhóm bảo thủ nối toàn inventory theo source component, SHA/pixel hash/pHash component, kể cả bridge ngoài selection. Report ghi representative và nhóm/gần trùng; không tự xóa ảnh nguồn hoặc giả định cùng nhóm là cùng thiết bị thật.
- Chia train/val development tái lập, giữ exposure trước đây theo `exporter.partition`. Không có test độc lập. Sau khi loại ảnh, một tập có thể rỗng; manifest ghi `hasTrainAndValidation`.
- Ảnh không có geometry, category/target không chắc, classifier–detector hoặc nguồn–model mâu thuẫn được tách NEEDS_REVIEW. Lỗi ảnh/cache là ERROR. PROPOSED chỉ có nghĩa chưa gặp các cờ kiểm tra đã định nghĩa, **không có nghĩa nhãn đúng**.
- Source/sign/score/model version đến từ inference thật; thông tin nguồn chỉ dùng đối chiếu, không mặc định là ground truth.
- RSS guard lấy mẫu 250 ms, 3.072 MiB, bao cả profile/inference/report của auto worker; không phải hard cgroup cap. Report lớn vẫn có thể chạm guard và cần thu nhỏ scope. Model load/hash thời gian đầu khác thời gian inference timer.

## File và export riêng

State chứa `auto-runs/<runId>/request.json`, `progress.json`, `report.json`, `report-seal.json`, `worker.log`; cache vẫn trong `ai-cache`. Request pin inventory/catalog/ontology và manifest dấu hiệu; report pin model/code/source hashes. Báo cáo/queue có phân trang 24 ảnh trên UI.

Output ở `state/pseudo-exports/<version>/`: ảnh giữ bytes, YOLO TXT, data.yaml, manifest, attribution và SHA256SUMS. Schema **`fixgo.studio.pseudo.v1`**, `labelStatus=AI_UNVERIFIED`, `humanVerified=false`, `independentTest=false`, `automaticallyApproved=false`. Không phải ZIP importer production, không được adapter trial hiện tại nhận như dataset đã duyệt. Luồng export chính thức và gate rights/human của trial giữ nguyên.

Trong export **objects-and-signs**, chỉ giữ ảnh có ít nhất một sign proposal hợp lệ và không có cờ lỗi/mâu thuẫn. Ảnh không phát hiện sign không được xuất thành negative đã xác minh. Đây vẫn là pseudo-labels có sai số; có thể thiếu các dấu hiệu thật ngoài khả năng model hoặc dưới threshold. Không dùng dataset này làm ground truth để báo accuracy của chính model đã tạo nhãn.

Export kiểm lại report seal, profile hiện hành, source/cache, revision người dùng và hồ sơ quyền hiện hành; không chạy đồng thời với inference. Không cập nhật hoặc ghi đè annotation, model, raw dataset hay DB. Không sửa export version đã tồn tại. Seal local phát hiện thay đổi thông thường, không chống người có toàn quyền sửa cả dữ liệu lẫn seal.

Có thể chạy tiếp một request đã tạo bằng UI, khi Studio đã dừng hoặc không có batch khác:

```bash
ai-service/.venv/bin/python scripts/ai-data-02/autolabel.py \
  --inventory docs/ai-data-audit/image-inventory.csv \
  --state "$HOME/.local/share/fixgo-dataset-studio" \
  --run-id '<runId từ UI>'
```

Dùng nút Tiếp tục để bỏ marker STOP đúng luồng. CLI giữ nguyên marker để không tự hủy yêu cầu dừng trước đó.

## Kiểm chứng

```bash
ai-service/.venv/bin/python scripts/ai-data-02/test_autolabel.py
ai-service/.venv/bin/python scripts/ai-data-02/test_auto_ui.py
```

Unit/browser tests dùng ảnh fixture và prediction stub được khai báo, không tạo quyền hoặc nhãn verified cho ảnh thật. Bao gồm queue 501 ảnh vượt giới hạn cũ, exact-duplicate cache reuse, cache/resume, lỗi một ảnh, lỗi load model, nhóm bắc cầu/exposure, mâu thuẫn, thiếu model dấu hiệu, optional sign linkage, rights, schema/export và CSRF.

Smoke thật chạy 3 ảnh pilot development trong state `/tmp` riêng bằng model offline hiện có; không tải weights, không sửa nhãn thật. Cả 3 inference thành công nhưng đều vào hàng đợi cần kiểm: 2 classifier/detector mâu thuẫn, 1 model uncertain. Không có model dấu hiệu; không kết luận độ chính xác. Xem [evidence/auto-label-real-smoke.json](evidence/auto-label-real-smoke.json). Chưa chạy toàn bộ 22.680 entry hoặc train/deploy.

Kết quả kiểm chứng local ngày 25/11/2026: **41 kiểm thử backend pass** (11 automation + 30 hồi quy), ba suite Chromium auto/manual/canvas pass, 0 page error. Lượt smoke thật cuối: 3/3 inference thành công, cache 0, worker timer 7,461 giây; peak RSS toàn worker 1.856,52 MiB. Lượt tiếp tục: 3/3 cache hit, 0 lỗi, loop timer 0,001 giây; peak RSS toàn worker 407,06 MiB. Loop timer không gồm hash/profile/khởi động/report. Hash 3 artifact model và adapter được đối chiếu sau smoke. Đây là bằng chứng vận hành, không phải độ chính xác nhãn.
