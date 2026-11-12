# Audit dataset và huấn luyện

Ngày lập: 13/11/2026 (Asia/Ho_Chi_Minh). Baseline: `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

Quy ước: **VERIFIED** = xác nhận bằng code/artifact hoặc phép thử được nêu; **INFERRED** = suy luận còn cần kiểm chứng; **NOT VERIFIED** = chưa đủ bằng chứng; **RECOMMENDED** = đề xuất, chưa triển khai. VERIFIED về code không đồng nghĩa PASS E2E hoặc độ chính xác thực địa.

## Dữ liệu thực tế

**VERIFIED:** `ai-service/dataset`: sáu class `dien_lanh`, `lam_vuon`, `other_unclear`, `sua_dien`, `sua_nuoc`, `thiet_bi`; mỗi class train=140, val=40, test=20. Tổng 1.200, tỷ lệ 70/20/10; cân bằng số lượng class. Không thấy bounding-box annotation hoặc ground truth service/symptom, nên không đánh giá detection/service ranking bằng nhãn category này.

**VERIFIED:** `prepare_dataset.py:generate_class_images` vẽ rectangle/circle/text/noise bằng OpenCV; `build_dataset` gọi generator từng split với chỉ số bắt đầu lại. Nguồn Roboflow/Kaggle/field survey trong docstring/JSON là lời mô tả, không là manifest nguồn/license. **NOT VERIFIED:** Ảnh thực địa có quyền dùng, annotator, hướng dẫn nhãn, agreement, phân bố theo camera/hộ gia đình.

**VERIFIED:** [dataset-leakage.json](evidence/dataset-leakage.json): train 840 file/646 hash unique; val 240/213; test 120/114. Giao hash train/val=210, train/test=109, val/test=109. Các con số giao là số hash distinct, không phải tổng cặp ảnh trùng. Leakage exact đã đủ làm split không độc lập. **NOT VERIFIED:** Số near-duplicate theo perceptual hash/nhóm thiết bị.

**INFERRED:** Việc seed từ `i` và class, reset i theo split, template gần nhau và `hash(class)` phụ thuộc process góp phần gây trùng và khó tái lập. Cần kiểm chứng seed/process lịch sử để gán nguồn từng file; không suy ra toàn bộ ảnh từ một lần chạy cụ thể.

## Training và checkpoint

**VERIFIED:** `training/train.py`: khởi tạo pretrained `yolov8n-cls.pt`, `model.train`, copy run best.pt sang weights/yolov8n-cls-fixgo.pt. Default hàm 15 epoch, CLI default 10; đây không phải số epoch của run lưu lại.

**VERIFIED:** `runs/classify/fixgo_cls_v1/args.yaml`: epochs=5, batch=16, imgsz=224, pretrained=true, optimizer=auto, lr0=.01, lrf=.01, momentum=.937, weight_decay=.0005, seed=0, deterministic=true; auto_augment=randaugment, erasing=.4, fliplr=.5. Những khóa augmentation có trong config không chứng minh mọi phép được áp cho classification; cần đối chiếu phiên bản runtime/log chi tiết. Optimizer auto không đủ bằng chứng nói thuật toán optimizer cuối cùng là Adam hay SGD.

**VERIFIED:** `results.csv` có năm epoch, epoch cuối train/loss=.01044, val/loss=.00065, accuracy_top1=1, accuracy_top5=1. Confusion matrix PNG và batch plots tồn tại. Đây là artifact lịch sử; chưa tái chạy validation. Với sáu class, top5 cao ít thông tin. Không dùng số này làm chất lượng hiện tại trên khách hàng.

**VERIFIED:** Checksum best/deploy trong [weights.json](evidence/weights.json) cho phép đối chiếu byte. **NOT VERIFIED:** Full lineage run→dataset version→commit→checkpoint có chữ ký/manifest, metrics precision/recall/F1 trên ảnh thật, service Recall@k, detector mAP.

**RECOMMENDED:** Giữ nguyên dataset/weights cho reproducibility; gắn nhãn rõ synthetic; dataset mới tách group trước augmentation; thêm hard negatives và ảnh thiết bị lành, chỉ dùng test bị khóa sau khi hoàn tất chọn model/ngưỡng.

**VERIFIED:** SHA-256 checkpoint deploy `weights/yolov8n-cls-fixgo.pt` bằng run `weights/best.pt`: `959d3e9823c55ae0…` (xem hash đầy đủ trong manifest; prefix này không thay thế hash đầy đủ). Điều này xác nhận byte của hai file khớp, chưa chứng minh ảnh của dataset hiện tại chính là snapshot đã dùng train.
