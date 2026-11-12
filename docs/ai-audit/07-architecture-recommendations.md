# So sánh và khuyến nghị kiến trúc

Ngày lập: 13/11/2026 (Asia/Ho_Chi_Minh). Baseline: `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

Quy ước: **VERIFIED** = xác nhận bằng code/artifact hoặc phép thử được nêu; **INFERRED** = suy luận còn cần kiểm chứng; **NOT VERIFIED** = chưa đủ bằng chứng; **RECOMMENDED** = đề xuất, chưa triển khai. VERIFIED về code không đồng nghĩa PASS E2E hoặc độ chính xác thực địa.

Tất cả đánh giá tương lai dưới đây là **RECOMMENDED/INFERRED**, chưa có benchmark chứng minh tăng độ chính xác.

| Tiêu chí | 1. Giữ YOLO + CLIP + rules | 2. Category → target → triệu chứng → retrieval | 3. Multimodal retrieval + khách xác nhận |
|---|---|---|---|
| Chính xác dự kiến | Giới hạn bởi ensemble/threshold và static prompts | Dễ cô lập lỗi; triệu chứng khách cung cấp giảm đoán lỗi ẩn | Có thể tốt khi mô tả chuẩn; similarity vẫn dễ lẫn triệu chứng |
| Dữ liệu | Benchmark thật, chỉnh prompts/rules | Nhãn category/target, symptom taxonomy, service mapping | Cặp ảnh–text/catalog, hard negatives, symptom feedback |
| Chi phí train | Thấp nếu giữ pretrained | Từ thấp baseline tới vừa nếu fine-tune target | Thấp pretrained; tăng nhiều nếu fine-tune contrastive |
| CPU/RAM/latency | Hai encoder/model hiện tại; cần profiling | Có thể reuse embedding và gate; số bước tăng nhưng cache được | Encode ảnh một lần; retrieval text cache; index phải version |
| Catalog cập nhật | Static service catalog dễ lệch | DB IDs và mapping rõ, refresh embeddings theo version | Dễ embed text mới, cần kiểm drift/ranking |
| Giải thích | Score/rule nhưng ensemble phức tạp | Rõ từng bước và câu trả lời khách | Giải thích bằng ứng viên/text tương tự, không là nguyên nhân |
| Phù hợp sinh viên | Nhanh sửa nhưng giữ nợ kỹ thuật | Cân bằng demo, khả năng đo và giới hạn khoa học | Hợp thử nghiệm retrieval; dữ liệu/eval khó hơn |
| Rủi ro sai chẩn đoán | Cao nếu service similarity gọi là chẩn đoán | Giảm khi luôn xác nhận triệu chứng và cho chọn lại | Vẫn còn nếu bỏ bước xác nhận/không có OOD |

## Kiến trúc khuyến nghị

**RECOMMENDED:** Chọn phương án 2 theo lộ trình nhỏ. Ảnh → kiểm chất lượng/OOD → gợi category/target (CLIP pretrained baseline; YOLO chỉ giữ nếu ablation chứng minh có ích) → khách xác nhận target → chọn triệu chứng → query active services theo categoryId+targetId → rank bằng triệu chứng/metadata và trả ID DB. Không có chứng cứ lỗi thì đề xuất kiểm tra/tư vấn chỉ khi dịch vụ này thật sự tồn tại. Confidence thấp cho chọn tay; không auto-create order từ một softmax.

Lưu cùng kết quả: model hash/version, prompt/catalog version, candidate IDs, score thô và reason, symptom do khách xác nhận. Snapshot embeddings cập nhật atomically; invalidate khi catalog đổi, không tự suy ID từ tên. Tránh ngôn từ “sửa đạt an toàn” hoặc “liveness” khi chỉ so ảnh/phát hiện mặt.

## Trình tự có thể phê duyệt

1. Khóa benchmark độc lập và taxonomy, sửa contract description ở task riêng.
2. Bổ sung targetId vào response Backend và lựa chọn Customer, filter membership category/target/service; rà soát thứ tự rule symptom.
3. Chuyển static sub-service embeddings sang snapshot DB, filter target trước ranking; không ghi đè target của một service khác.
4. Ablation, calibration, đo CPU; chỉ fine-tune phần có error analysis cho thấy cần.
5. Task riêng Worker/verification: bỏ heuristic pass không có bằng chứng, có review/rollback; không thực hiện trong audit này.

**NOT VERIFIED:** Phương án nào đạt accuracy/latency tốt hơn; bảng không đưa phần trăm giả hoặc lời hứa tài nguyên chưa đo.
