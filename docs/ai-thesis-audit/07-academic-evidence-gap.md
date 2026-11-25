# 07 — Bằng chứng học thuật và tính tái lập

**Chưa đủ bằng chứng để tuyên bố hoàn thành chuẩn đầu ra AI.** Có artifact và test thật; vấn đề là dữ liệu độc lập, ground truth và diễn giải metric.

## Quy ước mức bằng chứng

| Nhãn | Dùng khi nào | Không được suy ra |
|---|---|---|
| TESTED_WITH_MOCK | Có thực thi nhưng model/network/DB/evidence được thay fixture hoặc stub | Quality model, provider thật hoặc device E2E |
| INTEGRATION_VERIFIED | Các ranh giới thành phần thật được chạy trong phạm vi ghi rõ | Chất lượng dự đoán thực địa; cả hệ thống production |
| MODEL_VERIFIED | Đã load artifact thật và thực thi inference trong điều kiện ghi rõ | Accuracy đạt yêu cầu nếu không có ground truth độc lập |
| NOT_VERIFIED | Chưa chạy hoặc không đủ evidence | FAIL tự động; cũng không được PASS |

Một phép thử có thể vừa INTEGRATION_VERIFIED cho ASGI/model, vừa NOT_VERIFIED cho Cloudinary/DB/thiết bị. Trạng thái PASS/PARTIAL/FAIL của yêu cầu khác với nhãn loại bằng chứng này.

## Kiểm tra dataset hiện có

Source [generate_class_images:70](../../ai-service/training/prepare_dataset.py#L70) dùng OpenCV tạo hình vẽ cho lớp; [build_dataset:~145](../../ai-service/training/prepare_dataset.py#L145) chạy generator mỗi split. Metadata [dataset_info.json](../../ai-service/dataset/dataset_info.json) ghi các tên nguồn Roboflow/Kaggle/Survey nhưng không có URL từng ảnh, tác giả, giấy phép, người gán nhãn hoặc lịch sử import để chứng minh nguồn thực địa. Không coi tên nguồn tham khảo trong metadata là provenance ảnh.

Đã đọc manifest cũ [dataset_manifest.json](../../ai-service/eval/dataset_manifest.json), rồi **tự hash lại file hiện tại** thay vì tin kết luận cũ:

| Split | File JPG | SHA256 duy nhất |
|---|---:|---:|
| train | 840 | 646 |
| val | 240 | 213 |
| test | 120 | 114 |

| Giao hai tập | Số hash chung |
|---|---:|
| train / val | 210 |
| train / test | 109 |
| val / test | 109 |

Đây là số **hash**, không tự đổi thành số ảnh hoặc tỷ lệ accuracy. Exact leakage đã được chứng minh. Chưa chạy lại near-duplicate/perceptual grouping; thiếu exact overlap không có nghĩa độc lập. Có generator synthetic và manifest cũ ghi synthetic_ratio 1.0, nhưng không có provenance từng file để chứng minh mọi ảnh hiện tại đều sinh từ một run cụ thể; không dùng “100% ảnh hiện tại synthetic đã chứng minh” như kết luận forensic.

## Training có thật đến đâu?

[train_model:27](../../ai-service/training/train.py#L27) fine-tune pretrained YOLOv8n-cls, export best.pt sang weights. Có `runs/classify/fixgo_cls_v1/args.yaml`, `results.csv`, confusion matrices và ảnh batch. CSV có 5 epoch, top1/top5 cuối bằng 1 trên run lưu lại. Đây là artifact run hiện có, chưa rerun training và không chứng minh chất lượng thực địa do leakage/synthetic. Tên gọi/comment “5 classes” khác names artifact thực load **6 lớp**; CLIP còn có `giup_viec`, cần ghi taxonomy từng model.

Nguồn/base artifact, code version, seed và hash liên kết từ run training tới weights hiện hành chưa được đóng gói thành manifest tái lập đầy đủ. Không chạy train hoặc thay weights trong audit.

## Benchmark đề xuất không phải đo inference

[benchmark_recommendation.run_benchmark:42–60](../../ai-service/eval/benchmark_recommendation.py#L42) đọc `predicted_cat`, `target_rank`, `service_rank` từ fixture, cộng `simulated_latency_ms`; không gọi YOLO/CLIP/resolver. [benchmark_report.json](../../ai-service/eval/benchmark_report.json) hiện có 7 cases, category .8571, service Recall@1 .7143, latency p50 19.5/p95 25.0. **Không công bố các số này như chất lượng/latency model.** Có thể dùng để kiểm công thức metric bằng dữ liệu dựng sẵn. Audit không chạy lại generator benchmark để tránh ghi đè artifact.

## Ma trận bằng chứng còn thiếu

| Bằng chứng | Hiện có | Thiếu / cách bổ sung |
|---|---|---|
| Nguồn/quyền/nhãn dataset | Metadata tổng, generator và splits | Manifest từng ảnh: origin/license/consent/hash/device/session/nhãn/người đánh giá |
| Test độc lập pretrained/API | Fixture appliance/garden/face và test smoke | Ảnh điện thoại thật theo danh mục, normal/OOD, giữ kín khỏi prompt/threshold tuning |
| Nhãn lỗi/service | Taxonomy/rules catalog và folder class | Label category, target, visible fault, triệu chứng, service ground truth độc lập; có nhãn “không đủ dữ kiện” |
| Accuracy/P/R/F1/confusion matrix | Training CSV/plots | Báo cáo test thật, macro/micro theo lớp, raw predictions + CI, nhóm thiết bị hiếm |
| Service Top-1/Top-3 | Benchmark fixture, ranking code | Chạy cả AI+resolver trên DB catalog snapshot; tách image-only với symptom-assisted |
| Face FMR/FNMR | Hàm [face_metrics.py](../../ai-service/eval/face_metrics.py), [face_evaluation.py](../../ai-service/eval/face_evaluation.py), protocol | Genuine/impostor pairs độc lập theo người/session, threshold calibration và evaluation tách rời |
| PAD APCER/BPCER | [PAD protocol](../ai-labs/faceid-pad-evaluation-protocol.md), MN3 experimental | Print/screen/replay datasets, nhãn người, tỷ lệ và CI theo attack/device; evaluated registry chưa record |
| Before/After | CV probes và fixture images | Ground truth chất lượng người đánh giá, ảnh đổi góc/sáng, sửa ẩn, không sửa/làm hỏng thêm; agreement/inter-rater |
| Latency/lỗi/unavailable | Debug stages + fixture latency giả | Đo monotonic tại inference + end-to-end p50/p95, cold/warm/concurrency; timeout/transport/decode/inconclusive phân riêng |
| Tái lập | Source, weights, requirements, tests | Frozen manifest: commit/deps/model/prompt/catalog/config, raw result JSON, lệnh chạy, thiết bị, ngày và failure log |
| Demo nghiệp vụ | Source UI/API/FSM | Video/log từ camera→storage→AI→catalog→booking, Face proof→Start, AFTER→khách nghiệm thu, payment/commission/payout |

Các protocol/test runner có sẵn là đóng góp kỹ thuật; không đồng nghĩa đã tuyển người/thu dữ liệu/chạy đánh giá. Không tạo score accuracy, FMR, FNMR hoặc APCER/BPCER mới trong báo cáo này.

## Thiết kế thí nghiệm khuyến nghị

- Chia theo **thiết bị/công việc/địa điểm**, không rải ảnh gần giống vào train/test; face chia theo người và session/camera phù hợp thiết kế, giữ test độc lập khỏi chọn threshold.
- Có calibration/dev để chọn prompt/threshold, test khóa lại trước so sánh; sử dụng nhiều lần cùng test để tuning làm mất tính độc lập.
- Mỗi prediction lưu version/hash, requestId, ground truth, score/source, abstention, lỗi, latency; không lưu mặt/embedding/secret trong log công khai.
- AI-01 báo coverage bên cạnh accuracy trên accepted cases; service recommendation tách quy tắc theo triệu chứng khỏi hiệu quả nhìn ảnh. AI-02 đánh giá “đối chiếu đủ dữ kiện/không đủ” và quality so với người, không chỉ similarity.
- Face báo FMR = false matches / impostor attempts, FNMR = false non-matches / genuine attempts, thêm failure-to-acquire và PAD riêng; không trộn detection failure thành một con số match accuracy không giải thích.
- Chọn cỡ mẫu/ngưỡng mục tiêu với giảng viên theo CI và số lượt feasible. Không có ngưỡng trường trong T; không tự đặt 95% làm chuẩn bắt buộc. Zero false-match trên tập nhỏ không chứng minh FMR bằng 0 ngoài mẫu.

Khi chưa có dữ liệu thật, trình bày trung thực **proof-of-integration**, không gọi đó là thí nghiệm chứng minh AI đáp ứng toàn miền dịch vụ gia đình.
