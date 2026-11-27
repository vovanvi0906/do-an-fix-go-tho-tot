# Pilot tận dụng ảnh sẵn có

## Pilot A — development review/regression, KHÔNG independent test

Đề xuất **50 entry** từ source đang có,10mỗi target của strict-v2 detector. [pilot-review-queue.csv](evidence/pilot-review-queue.csv) ghi từng ID/path/target/group/exposure; không copy/sửa ảnh. Ưu tiên preparedval để rà performance của tập development đã biết, **không gọi val đó test độc lập**. Mỗi target chọn10component khác nhau và không lặp component giữa5target (50component toàn queue); component là conservative grouping, chưa chứng minh10thiết bị độc lập.

| Target | Số entry đề xuất |
|---|---|
| may-giat-may-giat-say | 10 |
| may-lanh-dieu-hoa | 10 |
| o-cam-dien | 10 |
| tu-lanh-tu-lanh-side-by-side | 10 |
| voi-nuoc-voi-sen | 10 |

Queue không chứa GT đã xác minh: người xem phải đối chiếu nguồn/quyền, target/extent, normal/sign/OOS, xóa nhãn proposal sai bằng revision mới trong state riêng. Không báo accuracy/mAP từ source label hoặc kết quả model. Bản thân ảnh đã được training/tuning/AI exposure khai báo hoặc quan hệ nhóm chưa giải quyết nên independent_test_eligible=false.

Sau review đủ quyền/labels có thể dùng so sánh **development-only** CLIP/YOLO classifier/checkpoint hiện có, ghi rõ model/hash/version và giới hạn. Lượt này không chạy model hoặc metrics.

## Pilot B — independent evaluation, hiện BLOCKED

Không chọn ảnh train/val hoặc biến thể/cùngsource group vào independent test. Chỉ mở sau có nguồn thật được phép dùng, history chứng minh chưa train/tune, không near/source link tới development và nhãn được người kiểm độc lập. Nguồn chưa thấy trong selection log không tự đủ điều kiện. Không dùng hai ZIPsynthetic làm test thực tế.

Cỡ ban đầu đề xuất để lập nguồn lực:5target×(50ảnh đối tượng+25normal/hard-negative) +50OOS dùng chung =425ảnh thật nếu disjoint. Đây là quota kế hoạch, không425ảnh hiện có hay bảo đảm statistical power; có thể bắt đầu batch nhỏ rồi tăng theo CI/domain coverage. Dataset review cần ít nhất groups thiết bị/phiên/địa điểm thật, không nhóm giả từ filename. Sign evaluation đòi bbox và real negatives riêng; mẫu có thể overlap object set sau gán nhãn, không cộng thànhảnhunique giả.

## Protocol trước evaluation

- Khóa group/source/split và model/prompt/threshold trước mở holdout.
- Nhãn category/target/sign/unknown, evidence/rights/reviewer; service đáp án chuyên gia dựa symptoms/context chứ không pixels đơn.
- Đo precision/recall/mAP chỉ với bboxGT hợp lệ; classification macroF1 và OOS FAR/FRR, tách model unavailable khỏi unknown.
- Không chọn target/service từ model rồi dùng làm GT; không lấy việc API thành công là đúng semantic.
- Local review export vẫn proposals, không là approved production dataset hoặc chứng nhận independent review.

Dừng tại kế hoạch/kiểm kê. Không train, không inference mới, không deploy, không sửa application/DB/raw/weights hoặc commit/push.
