# Grounding DINO Tiny trong Dataset Studio

**Đã mở rộng theo nhiều dịch vụ:** xem [MULTISERVICE-SIGNS.md](MULTISERVICE-SIGNS.md). Ví dụ ổ cắm/vết cháy và số liệu ba ảnh bên dưới là thử nghiệm phát triển ban đầu, không còn là phạm vi cố định của nút AI.

## Dùng ngay

Model đã được cài local trong phiên triển khai. Lưu tiến độ, dừng server cũ rồi chạy lại:

```bash
ai-service/.venv/bin/python scripts/ai-data-02/studio.py
```

- **Một ảnh:** mở ảnh chưa duyệt để tự nhận diện; có thể tắt ô **Nhận diện tự động khi mở ảnh** hoặc bấm **AI nhận diện dấu hiệu bất thường** để chạy lại. Worker trả khung gợi ý vào lớp AI. Ảnh mới chưa có chỉnh sửa sẽ điền thiết bị và chọn ABNORMAL nếu có sign proposal. Nếu đúng, bấm lưu để nhận các khung; không cần vẽ lại hoặc chép riêng. Nếu đang có bản chỉnh/bản duyệt, tool giữ nguyên nó; dùng Chép gợi ý AI khi bạn muốn thay.
- **Nhiều ảnh:** lọc Sửa điện → Ổ cắm điện, bấm Tự động gán nhãn, chọn **Grounding DINO · dấu hiệu theo dịch vụ**, rồi chạy. Không cần nhập manifest thủ công. Bộ CLIP/YOLO cũ vẫn chọn được qua mục model khác.
- Bấm AI không ghi HUMAN_VERIFIED, không thay lịch sử/bbox người dùng. Route kiểm một ảnh được phép tạo cache ngay cả khi ảnh có bản duyệt; batch thông thường vẫn bỏ qua mọi ảnh đã có revision người dùng. Export vẫn kiểm quyền và trạng thái nhãn như AUTO-LABELING.md.

Phạm vi mặc định hiện tại được tạo theo thiết bị/danh mục trong catalog; cấu hình tìm kiếm bao phủ 69 target vật lý/khu vực và 10 observable signs, còn tác vụ khảo sát không được dựng bbox giả. Chưa có bằng chứng detector chính xác cho toàn bộ target/lỗi. Không lấy tên file hoặc nhãn nguồn để dựng bbox. Các vùng orange trong lớp AI là gợi ý; dữ liệu tự động vẫn `outcome=UNKNOWN`, không phải NORMAL. UI giữ mặc định NORMAL theo lựa chọn trước của người dùng khi không có kết luận/sign đã lưu; đó không phải suy luận “không hỏng” của model.

## Model và triển khai

Dùng checkpoint chính thức [IDEA-Research/grounding-dino-tiny](https://huggingface.co/IDEA-Research/grounding-dino-tiny), revision `a2bb814dd30d776dcf7e30523b00659f4f141c71`. Tài liệu [Transformers Grounding DINO](https://huggingface.co/docs/transformers/model_doc/grounding-dino) mô tả detection theo text prompt. Model card công bố Apache-2.0; file README được giữ trong snapshot.

Đã tải 9 file cần thiết, chỉ một weights `model.safetensors` **689.359.096 byte**; không tải bản pickle `.bin`, không thêm dependency. Snapshot ở Hugging Face cache; manifest ở:

```text
~/.local/share/fixgo-models/grounding-dino-tiny/manifest.json
```

Cài lại trên máy khác bằng bước **setup có tải mạng rõ ràng**:

```bash
ai-service/.venv/bin/python scripts/ai-data-02/grounding_setup.py --download
```

Kiểm/tạo manifest từ cache có sẵn mà không tải:

```bash
ai-service/.venv/bin/python scripts/ai-data-02/grounding_setup.py
```

Setup không ghi đè một manifest khác cấu hình; dùng `--manifest` đường dẫn mới nếu cần. Sau khi đã tạo request, đổi manifest làm request cũ bị chặn resume; tạo lượt mới cho cấu hình mới. Không sửa pin request để hợp thức hóa thay đổi.

Inference **local/offline**, `local_files_only=True`, `trust_remote_code=False`, safetensors và kiểm model_type. Không gửi ảnh tới Hugging Face/API bên ngoài. Khi chọn DINO, worker dùng thêm detector YOLO strict-v2 sẵn có nếu checkpoint tồn tại, được pin hash trong manifest. YOLO tìm thiết bị trước; DINO chạy sign pass theo thiết bị đó và tìm object dự phòng trong scope đủ hẹp. Không nạp CLIP/classifier; CPU 2 torch threads, RSS guard 3.072 MiB theo worker hiện có. Khởi động/nạp model gây độ trễ trên CPU; dùng batch để không phải nạp lại cho từng ảnh.

Profile/cache pin checksum các file snapshot, config, prompt/ngưỡng, catalog/ontology và code adapter. Chuyển engine làm profile thay đổi: cache cũ không được dùng nhầm cho model mới; annotation người dùng vẫn được giữ. Worker không train/fine-tune, không sửa raw hoặc model production.

## Tạo khung và gắn dấu hiệu

Mỗi lớp chạy một pass với các mô tả cùng nghĩa để tránh suy tên nhãn từ chuỗi text ghép mơ hồ:

- Object: `electrical outlet. wall socket.` → target `o-cam-dien` trong catalog đã pin.
- Sign: `burn mark. scorched plastic. charred area.` → `burn_mark`, chỉ liên kết với target ổ cắm.

Ngưỡng khởi đầu: object 0,30, sign 0,30, text 0,20; shortest edge 640, longest edge 1024. Không coi score là xác suất cháy đã hiệu chỉnh.

Object NMS theo IoU 0,5 và loại khung cùng nhãn bị lồng gần hoàn toàn (containment ≥0,95) theo thứ tự score; đây là heuristic để giảm các khung “cả ảnh + ổ cắm” trùng nhau, chưa chứng minh đúng với mọi cụm nhiều ổ cắm. Không nối nhãn giữa các ảnh.

Sign phải có một object cùng target bao ít nhất 80% diện tích. Sign bao hơn 80% diện tích object bị loại khỏi geometry gán nhãn vì có thể là DINO gọi cả thiết bị là vết cháy; raw candidate vẫn nằm trong diagnostics. Cờ loại whole-object là warning và không cản các sign nhỏ hợp lệ còn lại. Liên kết thiếu/mơ hồ là issue đưa vào hàng đợi. Không có sign còn lại không có nghĩa ảnh bình thường.

## Kiểm chứng và giới hạn

Smoke thật trong state `/tmp` riêng, không sửa state review đang dùng. Ba ảnh development: hai ảnh cháy tổng hợp từng được người dùng mở và một ảnh pilot tối. Lượt đầu trả object chồng nhau và sign gọi cả thiết bị; suppression/ngưỡng được điều chỉnh **trên chính các ảnh phát triển này**. Ở ngưỡng sign 0,25, một ảnh còn có proposal trên ổ phía dưới không cháy rõ; đã nâng lên 0,30. Đây là tuning, không phải independent evaluation.

Cấu hình cuối chạy 3/3 thành công, giữ hai cặp object/sign trên hai ảnh cháy mẫu; ảnh tối còn lại chưa có sign liên kết phù hợp và nằm trong hàng đợi. Một sign có thể chỉ phủ phần socket cháy mà thiếu vùng xém lan phía trên; vẫn cần kiểm mẫu và sửa khi dùng làm nhãn. Không báo accuracy/precision/recall/mAP hoặc cam kết tự gán đúng tất cả. Grounding DINO là model tổng quát theo mô tả, chưa fine-tune/phê duyệt cho lỗi điện.

Xem [evidence/grounding-dino-smoke.json](evidence/grounding-dino-smoke.json) để đối chiếu profile, prompts, geometry, timing, RAM và cache. Ảnh preview local thực tế: `/tmp/fixgo-grounding-real-outlet-burn.png`. Không export/train dataset thật trong smoke.

Kiểm fixture riêng:

```bash
ai-service/.venv/bin/python scripts/ai-data-02/test_grounding.py
ai-service/.venv/bin/python scripts/ai-data-02/test_grounding_ui.py
```

Test model/prompt hash, target/ontology, geometry/NMS/link, whole-object rejection, runtime không nạp CLIP/classifier, routing từ detector YOLO, preview ảnh đã duyệt không đổi revision, chọn engine mặc định, prefill và lưu sau hành động xác nhận. Các prediction trong browser/unit fixtures là stub được ghi rõ, tách với smoke inference thật.

Kết quả local 25/11/2026: **47 kiểm thử backend pass**, bốn suite Chromium pass, 0 page error. Smoke thật cấu hình cuối: 3/3 inference thành công, 2 ảnh có object + burn_mark proposal, 1 ảnh cần kiểm; worker timer 28,516 giây gồm lazy model load và inference, chưa gồm tải model/hash profile. Peak RSS toàn worker 2.511,89 MiB. Resume cùng request: 3/3 cache hit, 0 lỗi. Checksum 9 file snapshot và adapter đối chiếu sau smoke đều khớp. Không dùng số lượng proposal để suy ra độ chính xác.
