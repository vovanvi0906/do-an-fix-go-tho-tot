# FaceID PAD và SFace: protocol đánh giá (ĐỀ XUẤT, CHƯA PHÊ DUYỆT, CHƯA BẮT ĐẦU)

- Phạm vi: đánh giá PAD (anti-spoof-mn3) và hiệu chỉnh ngưỡng SFace/quality cho Worker FaceID.
- Trạng thái: **BLOCKED_DATA + BLOCKED_APPROVAL**. Chưa tuyển người, chưa thu ảnh, chưa có kết quả.
- Kế thừa và mở rộng: `docs/implementation/face-id/participant-test-protocol.md` (consent, retention, quyền với dữ liệu).
- Công cụ: Lab tab "PAD trials" → `trials.jsonl`; `ai-service/eval/face_evaluation.py` (calibration + đánh giá độc lập); `ai-service/eval/face_metrics.py` (tóm tắt cũ).

## 1. Điều kiện trước khi thu dữ liệu

1. Phê duyệt protocol này cùng consent/pilot: người chịu trách nhiệm dữ liệu, form consent tiếng Việt, retention, quy trình xóa.
2. Phê duyệt mục tiêu: `pad_max_apcer`, BPCER tối đa, `identity_max_fmr`, FNMR chấp nhận được, mức tối thiểu dữ liệu (§5).
3. Chuẩn bị thiết bị: tối thiểu 2 mẫu Android mục tiêu, cộng webcam của Lab nếu muốn so sánh.
4. Bật capture trên research stack bằng cấu hình **có phê duyệt**: `FACE_RESEARCH_CAPTURE_APPROVED=true`, `protocolReference`, participants với consent và review khớp epoch. Không bật cho demo.

## 2. Kịch bản (presentation và điều kiện)

| Mã | Kịch bản | ground_truth | attack_type | conditions | Kỳ vọng hệ thống |
|---|---|---|---|---|---|
| G1 | Người thật, ánh sáng bình thường | bona_fide | bona_fide | lighting=normal | Quality PASS; PAD real cao; cosine ≥ ngưỡng nếu cùng người |
| G2 | Người thật, thiếu sáng | bona_fide | bona_fide | lighting=low | Có thể `TOO_DARK` (FTA); không được PASS khi quality FAIL |
| G3 | Người thật, ngược sáng / quá sáng | bona_fide | bona_fide | lighting=backlit/bright | Đo FTA và BPCER riêng |
| G4 | Người thật, chuyển động (motion blur) | bona_fide | bona_fide | motion=blur | `BLUR` → FTA |
| G5 | Che một phần (khẩu trang, tay) | bona_fide | bona_fide | occlusion=partial | Đo FTA và BPCER; không ép PASS |
| A1 | Ảnh in (A4 laser, giấy ảnh; nhiều kích thước) | attack | print | lighting=* | PAD phải từ chối → đo APCER(print) |
| A2 | Ảnh trên màn hình điện thoại (nhiều model, độ sáng 50/100%) | attack | screen | lighting=* | APCER(screen) |
| A3 | Video phát lại (điện thoại/máy tính bảng, có chớp mắt) | attack | video_replay | lighting=* | APCER(video_replay) |
| N1 | Nhiều khuôn mặt | bona_fide | bona_fide | faces=multiple | `MULTIPLE_FACES`; không đo PAD |
| N2 | Không có mặt | — | — | faces=none | `NO_FACE` (không vào manifest PAD; ghi outcome) |
| N3 | Camera không khả dụng / bị từ chối | — | — | — | `CAMERA_PERMISSION_DENIED` / `CAMERA_NOT_FOUND`, không gửi gì |
| N4 | Session hết hạn | — | — | — | `SESSION_EXPIRED`, không có inference |

Mỗi attack chỉ được tạo từ ảnh/video **của chính người tham gia đã đồng ý** với việc tạo vật liệu tấn công. Không dùng ảnh mạng hay ảnh worker có sẵn.

## 3. Ground truth và manifest

- Một dòng cho mỗi capture. Đúng các trường sau, không thêm trường nào (validator `validate_manifest` từ chối trường lạ):
  `sample_id, subject_id, capture_device, attack_type, ground_truth, consent_reference, model_version, conditions{lighting,motion,occlusion,faces}, media_sha256, split, evaluated_at`.
- `subject_id` là pseudonym `S###`. Bảng ánh xạ pseudonym ↔ người lưu riêng, mã hóa, **ngoài Git**.
- `media_sha256` là hash của ảnh/video gốc lưu ở kho mã hóa ngoài Git. Hash trùng giữa hai mẫu sẽ bị từ chối.
- `split` ∈ {`calibration`, `evaluation`}. **Một subject chỉ thuộc một split** (validator kiểm tra). Cặp identity không được bắc qua hai split.
- `sample_id` trùng `trial_id` của Lab export (UUID) để nối trial với manifest. `conditions.json` của Lab là nguồn để dựng manifest.
- Template: [faceid-dataset-manifest.template.json](faceid-dataset-manifest.template.json) (rỗng, không có dữ liệu).

## 4. Chỉ số và định nghĩa

| Chỉ số | Định nghĩa | Mẫu số |
|---|---|---|
| APCER(type) | attack được chấp nhận (real score ≥ t) / attack **scored** của type đó | Chỉ trial `SCORED` |
| BPCER | bona fide bị từ chối (real < t) / bona fide **scored** | Chỉ trial `SCORED` |
| ACER | (max APCER theo type + BPCER) / 2 | — |
| FTA | (`NO_FACE` + `MULTIPLE_FACES` + `QUALITY_REJECTED`) / tất cả trial của nhãn | Tất cả trial |
| Technical failure | (`TECHNICAL_ERROR` + `TIMEOUT` + `INCONCLUSIVE`) / tất cả trial | Báo **riêng**, không gộp vào PAD rejection |
| FMR | cặp impostor có cosine ≥ t / impostor scored | Cặp khác subject |
| FNMR | cặp genuine có cosine < t / genuine scored | Cặp cùng subject |
| Quality rejection rate | FTA trên các trial identity | — |
| Latency | p50/p95 PAD CPU (`probePadMs`) và end-to-end | Giá trị quan sát được |

- Mọi tỉ lệ đều kèm số đếm k/n và Wilson 95% CI. Nhãn không có dữ liệu trả `null` hoặc `INSUFFICIENT_DATA`, không bao giờ là 0.
- `NOT_EVALUATED` là **quyết định policy**, không phải outcome đo, nên không xuất hiện trong mẫu số.
- Có breakdown theo device và từng condition khi mỗi nhóm có ≥ `per_condition` (mặc định 30) trial; nhỏ hơn thì ghi `INSUFFICIENT_DATA`.

## 5. Quy trình chọn ngưỡng và đánh giá độc lập

1. `split=calibration`: chọn ngưỡng PAD thấp nhất sao cho max APCER(calibration) ≤ `pad_max_apcer`, và ngưỡng SFace thấp nhất sao cho FMR(calibration) ≤ `identity_max_fmr`.
2. Áp nguyên ngưỡng đó lên `split=evaluation` (subject-disjoint). **Không** chỉnh ngưỡng theo kết quả evaluation. Nếu không đạt thì báo FAIL và thu thêm dữ liệu calibration ở vòng mới, với tập evaluation mới.
3. Mức tối thiểu đề xuất (mặc định trong `face_evaluation.py`, cần phê duyệt): ≥ 300 bona fide scored và ≥ 100 scored cho mỗi loại tấn công trong evaluation; ≥ 8 subject mỗi split; ≥ 300 cặp genuine và ≥ 3000 cặp impostor. Pilot 24 người là **feasibility**, không phải chứng nhận.
4. Kết quả `EVALUATED_NOT_APPROVED` chỉ là đầu vào để xin phê duyệt. Để mở khóa PAD cần một `PadEvaluationRecord` (xem `ai-service/pad_policy.py`) có: artifact SHA-256, preprocessing và crop version, SHA-256 của manifest, procedure chọn ngưỡng, split khác nhau và subject-disjoint, SHA-256 của report, APCER/BPCER/FTA đạt mục tiêu, danh sách limitations, `approval_reference` và `approved_by_role`. Record được thêm qua code review.
5. Ngưỡng SFace 0.60 và ngưỡng quality giữ nguyên ở production cho đến khi có report và phê duyệt tương ứng.

Chạy (sau phê duyệt):

```sh
python ai-service/eval/face_evaluation.py --trials trials.jsonl --manifest manifest.json \
  --protocol approved-protocol.json --out report.json   # protocol: {"approved":true,"approval_reference":"…","targets":{"pad_max_apcer":0.05,"identity_max_fmr":0.001}}
```

## 6. Giới hạn đã biết (phải ghi vào record)

- MN3 là PAD thụ động trên một khung hình, huấn luyện trên CelebA-Spoof. Chưa có bằng chứng tổng quát hóa sang camera Android, ánh sáng Việt Nam hay các loại màn hình hiện đại.
- Crop PAD hiện là bbox YuNet sát mặt (`yunet-tight-bbox-floor-ceil-clamped-linear-128-v1`) và **chưa được xác minh** là trùng crop lúc huấn luyện upstream. Lệch crop có thể làm thay đổi điểm. Đánh giá phải dùng đúng crop version sẽ chạy production.
- Không chống camera injection, virtual camera, deepfake stream hay mặt nạ 3D (chưa có trong protocol).
- Nonce chỉ chống replay ở mức request, không chống video phát lại trước camera.
- Kết quả theo thiết bị chỉ có giá trị cho những thiết bị đã đo.
