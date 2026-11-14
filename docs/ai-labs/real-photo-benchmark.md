# Real-photo evaluation protocol — BLOCKED_DATA

Hiện không có bộ ảnh thiết bị thật với nhãn/nguồn/quyền sử dụng và tách train/eval đã được review. Các ảnh dataset/test hiện có được audit là synthetic và leakage; không dùng để tuyên bố chất lượng ảnh thực.

1. Thu thập ảnh thiết bị thật có quyền sử dụng; loại PII/EXIF nhạy cảm. Bao phủ ánh sáng/góc chụp/mức mờ và ảnh ngoài miền. Không lấy ảnh từ train hoặc ảnh near-duplicate của train.
2. Hai người review category, canonical target và acceptable service IDs từ catalog snapshot. Triệu chứng phải là lời khai có nguồn, không suy hỏng hóc chỉ từ ảnh. Nếu không có GT service đáng tin cậy, để serviceIds rỗng và report recall N/A.
3. Tính SHA-256 ảnh gốc; kiểm trùng ảnh và đối chiếu train hashes. Kiểm near-duplicate bổ sung thủ công/perceptual hash, vì SHA chỉ bắt duplicate byte.
4. Dùng manifest version 2, lưu nguồn dataset, split eval/test, labelReview=reviewed, trainImageSha256 và source/annotationVersion/hash mỗi sample. Version 1 vẫn chạy được cho smoke cũ; không coi đó là bằng chứng provenance đã review.
5. Pin model/cache artifacts và runtime config, lưu authenticated telemetry cùng run. Threshold giữ AI 0.48/margin 0.10, backend cấu hình hiện hành (0.6 mặc định), target similarity 0.20; không tuning trên eval/test.
6. Chạy real HTTP inference, lưu per-sample outcome/error, model/config fingerprint, image hash, ground truth và predictions. Export JSON/CSV. Công bố category accuracy, target top1/top3, macro service recall@3, số false recommendations, abstention, failure rate và latency p50/p95; luôn nêu mẫu số và N/A. Cold model loading và HTTP elapsed khác pure inference compute.

Ví dụ khung (phải thay bằng hash/IDs/labels thực; không phải dataset):

```json
{
  "version": 2,
  "provenance": "real",
  "dataset": {"source":"consented owner photos / collection record", "split":"test", "labelReview":"reviewed", "trainImageSha256":[]},
  "samples": [{"id":"reviewed-photo-001", "image":"devices/fridge.jpg", "sha256":"<64 lowercase hex>", "source":"capture record 001", "annotationVersion":"double-review-001", "category":"dien-lanh", "target":"<canonical target ID>", "symptomIds":[], "serviceIds":[]}]
}
```

Trạng thái: pipeline READY_FOR_TESTING; MODEL_QUALITY_VALIDATED=false; kết quả ảnh thực BLOCKED_DATA. Không thay thế bằng metric synthetic.
