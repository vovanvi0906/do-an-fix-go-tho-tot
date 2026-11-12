# Hướng dẫn dataset → train → recommendation cho sinh viên

Ngày lập: 13/11/2026 (Asia/Ho_Chi_Minh). Baseline: `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

Quy ước: **VERIFIED** = xác nhận bằng code/artifact hoặc phép thử được nêu; **INFERRED** = suy luận còn cần kiểm chứng; **NOT VERIFIED** = chưa đủ bằng chứng; **RECOMMENDED** = đề xuất, chưa triển khai. VERIFIED về code không đồng nghĩa PASS E2E hoặc độ chính xác thực địa.

Toàn bộ phần này là **RECOMMENDED**. Không chạy training, không tải checkpoint, không thay kiến trúc trong đợt audit.

## 1. Hiểu dữ liệu và nhãn

Dataset là tập ví dụ; label là đáp án chuyên gia. Category “Sửa điện” khác target “Ổ cắm”; symptom “không có điện” khác service “kiểm tra ổ cắm không có điện”. Ảnh ổ cắm không cho biết điện áp bên trong. Dùng taxonomy có ID ổn định, version và quan hệ category→target→service DB; symptom tách riêng, nhiều symptom có thể gắn một target.

Thu ảnh tự chụp với đồng ý hoặc nguồn license phù hợp, lưu URL/license/tác giả/ngày/consent; không lấy tên nguồn trong comment làm quyền sử dụng. Không đưa thông tin cá nhân không cần thiết vào ảnh. Lưu ảnh gốc bất biến và manifest checksum; synthetic để nhóm riêng phục vụ smoke test, không trộn rồi gọi ảnh thực địa.

## 2. Annotation guideline

Annotator chọn category và target nhìn thấy; đánh dấu box chỉ nếu cần detection. Ghi healthy/unknown, ảnh mờ, nhiều thiết bị, symptom “thấy trên ảnh” hoặc “người dùng khai”; không đoán triệu chứng ẩn. Chỉ service IDs đang active; cho nhiều dịch vụ chấp nhận được khi chưa phân biệt. Hai người review, đo agreement và phân xử; lưu lý do loại ảnh.

## 3. Split chống leakage

Group theo household/device/session/source trước khi chia train/validation/test; dedup exact và perceptual trước split. Augmentation chỉ áp train sau split. Validation dùng chọn hyperparameter/threshold; test bị khóa tới cuối. Không dùng tên thư mục/filename làm feature khi đánh giá pixel. 70/20/10 là lựa chọn ban đầu, cần cân nhắc coverage từng class; không lấy mẫu ít rồi suy chất lượng.

## 4. Baseline và fine-tuning

Bắt đầu CLIP pretrained với prompts có version và retrieval DB; baseline majority/manual để biết model có giá trị gì. Giữ YuNet/SFace pretrained cho nghiên cứu riêng, không train mặt khi không có dữ liệu/consent và protocol phù hợp. Không cần train model “nguyên nhân hỏng” nếu dữ liệu chỉ là ảnh thiết bị.

Chỉ fine-tune YOLO category/target nếu nhãn ảnh đủ tốt và error analysis chỉ ra domain gap. Lưu model source/revision, seed, epochs, batch, imgsz, optimizer thật/lr, augmentation, device và git SHA. Chọn budget/early stopping qua validation; không copy mặc định 5 epoch như công thức chất lượng. Contrastive fine-tune embeddings chỉ sau baseline nếu cặp ảnh–text và hard negatives đủ tin cậy.

## 5. Validation, test và error analysis

Validation chọn model, prompt và abstention; test đo một lần theo protocol đã khóa. Báo category/target F1, service Recall@k, sai service dù đúng target, coverage/abstention, calibration và CPU p50/p95. Đọc từng nhóm lỗi: ảnh mờ, nhiều thiết bị, target mới, nhầm nhóm, triệu chứng không thấy được. Không tiếp tục chỉnh test và gọi nó độc lập.

## 6. Inference và recommendation

Inference nhận ảnh mới → preprocess cùng chuẩn → model trả category/target và score. Recommendation dùng context/triệu chứng người dùng để truy DB candidates, filter IDs active, ranking, hiển thị lý do và cho sửa. Nếu ảnh chỉ cho biết thiết bị mà không có dấu hiệu lỗi, hỏi “thiết bị đang gặp tình trạng nào?” hiệu quả hơn cố train nhãn lỗi không quan sát được.

## 7. Version, deploy và rollback

Gói dataset manifest/model hash/config/prompt/catalog/eval report thành version. Candidate shadow test trên ảnh có quyền dùng; canary sau phê duyệt; theo dõi unknown/error/latency và sai target/service. Giữ version trước và tương thích response để rollback. Không tự động train từ mọi lựa chọn khách (có thể sai hoặc thao tác nhầm); chỉ feedback được review mới thành label.

Điều kiện bắt đầu train: dataset đã qua dedup/split, quyền sử dụng rõ, baseline và protocol được chủ nhiệm phê duyệt, ngân sách CPU/GPU và rollback cụ thể. Hiện các điều kiện này chưa được xác minh đầy đủ.
