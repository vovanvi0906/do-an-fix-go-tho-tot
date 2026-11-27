# Dataset thực sự cần xây dựng

## Trả lời 12 câu hỏi quyết định

1. **Có cần dataset object từ đầu?** Không mặc định. Đã có CLIP70 target prompts, COCO80, fine-tuned trial5, raw21.437; cần review/evaluation trước rồi chỉ bổ sung gap.
2. **Pretrained đủ danh sách thiết bị?** Chưa chứng minh. COCO chỉ có semantic subset7 target, không outlet/wire/faucet class riêng; CLIP có thiết kế70 nhưng accuracy chưa đo. [ai-service/recommendation/target_matcher.py:8 — match_targets](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/recommendation/target_matcher.py:8) [ai-service/main.py:191 — lifespan](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/main.py:191).
3. **Target nào cần bổ sung?** Cả70 cần independent evaluation; ưu tiên5 target có checkpoint để đối chiếu baseline, rồi điện/target không có source candidates. CSV ghi counts ứng viên, không gọi đó là số GT đủ train. Target hệ thống/khu vực cần scope trước bbox.
4. **Fine-tune YOLO?** Có điều kiện sau baseline localization/sign fail; đã có checkpoint fine-tuned để thử, không train lại toàn bộ. Thiếu trained sign model runtime khác với chưa có bất kỳ trained YOLO.
5. **Fine-tune CLIP?** Chưa có bằng chứng cần. Trước hết kiểm prompt theo subtype, category filter và threshold, tránh biến static subservice similarity thành diagnosis.
6. **Tận dụng zero-shot?** Có, source/runtime đã sử dụng. Phải đo image-only/description ablation và OOS.
7. **Model defect riêng?** Hợp lý cho dấu hiệu nhìn thấy nếu baseline không đáp ứng và có bbox/rights; optional architecture có sẵn. Không model nào thay đo rò điện, nhiệt, âm/mùi từ ảnh đơn.
8. **Questionnaire/rules?** Có, phù hợp lỗi vận hành và demand installation; cần symptom-service review. Không cần một class ảnh cho693 dịch vụ.
9. **Training hay evaluation?** Evaluation độc lập trước; training có điều kiện cho lớp thiếu sau audit. Nguồn val/test riêng, không toàn synthetic/cùng cảnh.
10. **Bao nhiêu ảnh và cơ sở?** Xem kế hoạch cỡ pilot bên dưới; đây là ước lượng để thấy confusion/domain gap, không proof power/accuracy. Min train trong code không là guarantee.
11. **Loại annotation?** Category/target labels+unknown/group/source cho classification; bbox object/sign và evidence cho detection; segmentation chưa bắt buộc theo API hiện tại. Triệu chứng và service answer set do chuyên gia, không bbox của service.
12. **Nhanh nhất?** Evaluation pilot tận dụng weights/dataset hiện có, sửa mapping/integration theo task riêng, training sign/object chỉ khi có bằng chứng gap, không thực thi mass-generation trước.

## Cỡ dữ liệu đề xuất có điều kiện

| Mục tiêu | Số ảnh/ca dự kiến ban đầu | Cơ sở và điều kiện |
|---|---|---|
| Object/category baseline pilot5 target | 50 ảnh target +25 normal/hardnegative mỗi target;50 OOS thật dùng chung = **425 ảnh** nếu các tập disjoint | 75/target đủ phát hiện confusion ban đầu; không đảm bảo statistical significance. Đa dạng ≥10 source/device/session groups/target, không dựa prompt để đếm group |
| Sign evaluation ổ cắm burn_mark/crack | 50 positives mỗi sign-target +50 none-visible/dễ nhầm chung =150 ảnh nếu disjoint | Có thể overlap425 object set sau gán GT, không tự cộng thành575 unique. Khóa holdout, báo CI/per-class, không dùng synthetic test |
| Fine-tune class còn thiếu sau baseline | Khoảng100 ảnh dương train +30 val độc lập mỗi class/target, tăng theo learning curve | Đây là estimate, ưu tiên reuse ảnh có quyền/nhãn. Giữ min code≥20train/5val,≥2train group/1val group và5/2 negative, không hạ gate |
| Recommendation | Ít nhất1 expert case mỗi693 service cho coverage nghiệp vụ + positive/negative/ambiguous/OOS ca ưu tiên | Coverage rule không phải693 ảnh hoặc service accuracy; đáp án expert có thể là nhiều dịch vụ/hỏi thêm, không lấy model prediction làm GT |
| Missing modality | Questionnaire/metadata/measurement cases | Không sinh ảnh của điện áp/không điện/mùi để học nhãn giả |

Cỡ425/150/100+30 là **đề xuất**, chưa thu thập hoặc sinh. Nếu theo dõi learning curve/CI cho thấy chưa đủ thì tăng theo gap; nếu pretrained đáp ứng thì không train. Không ràng buộc GPU/compute budget chưa đo.

[dataset-requirements.csv](dataset-requirements.csv) liệt kê đủ70 target với ưu tiên, nguồn candidate đang có, annotation và điều kiện trước training. Các ô eval75/target là unit planning nếu mở rộng, không lệnh cần thu5.250 ảnh ngay; bắt đầu425 pilot.

## Dữ liệu cần giữ riêng

- Synthetic có provenance thật chỉ vào development training sau gate; importer hiện train-only, không tự chia val/test trong ZIP. [server/scripts/ai01/uploaded_dataset.py:166 — UploadedDataset synthetic train-only policy](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/uploaded_dataset.py:166).
- Test thực tế độc lập: source/rights/capture/device/session/groups và GT được người xem độc lập; không dùng image-model exposure/ảnh trainval cũ làm blind test. [ai-service/eval/ai01/annotation.py:10 — Labels/Provenance/Review/Sample](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/annotation.py:10) [ai-service/eval/ai01/runner.py:44 — Resolver/run_case/setup_models](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/eval/ai01/runner.py:44).
- Normal không thấy dấu hiệu chưa chứng minh hoạt động tốt; label rỗng chưa là reviewed negative. OOS không có target hợp lệ phải giữ ngoài importerv1 hiện tại.
- Bbox source/fault region không tự trở thành object extent; quyền/nhóm/GT phải review rồi export audit. [server/scripts/ai01/quality_review.py:68 — QualityReview.blockers/export](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/quality_review.py:68) [ai-service/training/visual_service_training.py:38 — audit/prepare_trial](/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/training/visual_service_training.py:38) [server/scripts/ai01/dataset_package.py:8 — fixgo.dataset.v1 rules](/home/vanvi/Work/do-an-fix-go-tho-tot/server/scripts/ai01/dataset_package.py:8).

Kế hoạch generation 13.340 ảnh trước đây là gross scenario quota, không kết quả audit rằng cần tạo đủ13.340. Chỉ mở batch có gap đã đo và approved scope/provenance; chưa sinh dataset trong lượt này.
