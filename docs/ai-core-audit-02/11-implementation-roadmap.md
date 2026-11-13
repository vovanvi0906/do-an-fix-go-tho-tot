# Roadmap và backlog sau audit

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

Tất cả các task dưới đây là **RECOMMENDED, chưa coding**. Size S/M/L/XL là độ phức tạp tương đối, không phải cam kết ngày hoàn thành. Dependencies là điều kiện trước khi chuyển phase; evaluation có thể chuẩn bị song song sau khi scope/quyền dữ liệu được phê duyệt.

| Phase / Task | Priority / Size | Dependencies | Acceptance criteria | Rủi ro/kiểm chứng |
|---|---|---|---|---|
| 0.1 Khóa fail-open FastAPI+Nest | P0 / M | Phê duyệt policy reject/manual và legacy proof | No model/no face/decode/reference/feature/network/timeout/invalid score không ghi success proof; schema có reason/method; bounded fetch | Có thể chặn thợ đang hoạt động; rollout/rollback và review migration proof cũ, không “fallback pass” |
| 0.2 Tách trust và hợp đồng face API | P0 / M | 0.1; thống nhất daily/order/purpose | Generic API đúng signature/result; JWT/role/owner kiểm server; client boolean/echo workerId không grant; test access/stage/contract | Không sửa FSM ngoài task được duyệt |
| 0.3 Logging và storage boundaries | P0/P1 / M | Chủ data/security phê duyệt | Không log token/mặt/URL private/PII; correlation IDs; allowlist upload decode; network AI authenticated/private theo deployment | Test negative SSRF/quota chỉ trong isolated env, không truy tài nguyên thật |
| 1.1 Test set độc lập image | P1 / L | Consent/license, taxonomy, dedup | Freeze test groups; đủ tình huống, source/label manifest; leakage exact/near được review | Domain coverage ít, nhãn symptom ẩn không được suy từ ảnh |
| 1.2 Face/PAD protocol baseline | P1 / L | Consent, threat model, enrollment/reference provision isolated | Genuine/impostor/PAD species/device protocol, threshold validation, FAR/FRR/coverage/latency + CI | Không đủ mẫu không công bố accuracy bảo mật |
| 1.3 Ablation/calibration | P1 / M | 1.1+1.2, phase0 đúng | YOLO/CLIP/ensemble cùng test, raw-score logging không PII, reliability, CPU p50/p95/error rates | Tuning trên test làm leakage lần nữa |
| 2.1 Catalog retrieval và target contract | P1 / L | Taxonomy+benchmark; contract review | Real category/target/service IDs, parent active, invariant, top-k reasons, no static fallback giả | Race catalog change; version+invalidate/revalidate booking |
| 2.2 Enrollment/re-enrollment | P0/P1 / L | Identity review + privacy policy | Template version encrypted, đúng1 mặt/quality, review đổi mẫu, audit actor/reason, revoke stale sessions | Avatar không làm trusted template; orphan storage cleanup |
| 2.3 Daily/order proof + session | P0/P1 / L | 0.2,2.2; policy purpose/TTL | One-use/session binding worker/template/order; separate daily/order expiry; start requires correct proof+FSM | Concurrency/replay/clock skew; test atomic consumption |
| 2.4 Passive PAD integration | P1 / L | License+1.2 chọn model,2.3 | Identity và PAD tách decision; unacceptable APCER/BPCER theo mục tiêu đã duyệt phải reject rollout | Device/domain shift; không claim injection defense chỉ từ PAD |
| 2.5 Active challenge (nếu chọn C) | P2 / XL | 2.4 và evidence cần thêm | Random server challenge, temporal server validation, expiry/consumption; accessibility alternatives | Replay/deepfake thích ứng vẫn chưa bảo đảm |
| 3.1 Fine-tune có mục tiêu | P2 / L/XL | Phase1 evidence + data approval + budget | Chỉ component có gap; versioned dataset/model; cải thiện metric đã chốt, không regression, test khóa | Overfit/model-license/biometric privacy |
| 3.2 Deployment/rollback | P1 / M | Evaluation approved, template compatibility | Shadow/canary, safe failure, monitoring/calibration drift, rollback artifact/version | Rollback không phục hồi fail-open hoặc mẫu không tương thích |
| 4. Android E2E | P1 / L | Phase0+2 và isolated devices/accounts | AI Scan ảnh thật, enrollment, daily, order riêng; authorized print/screen/video; network/retry/account switch; log không PII | Thiết bị thật bắt buộc; không PASS từ Jest/curl |

## Task cần làm ngay sau audit

1. Chủ nhiệm duyệt hotfix fail-closed/provenance và chính sách xử lý timestamp cũ; viết test negative trước sửa.
2. Chốt enrollment + daily/per-order proof contract; giữ UI đang chặn khi chưa có proof, không mở khóa chỉ bằng local flag.
3. Chốt data ownership/consent/storage/retention và benchmark targets; thu tập nhỏ được kiểm chất lượng trước mở rộng.
4. Sửa JSON description và target DB contract; chuyển service retrieval qua active tree/ranking có lý do.
5. Đánh giá PAD pretrained; chỉ tích hợp/train khi có license/protocol và số liệu chấp nhận được; cuối cùng retest Android.

## Điều kiện bắt đầu coding cần phê duyệt

Policy fail-closed/manual reviewer; mục đích/TTL/proof consumption; revocation legacy timestamp; enrollment authority/template changes; service taxonomy/candidate UX; data/legal usage và retention; PAD threat model/license; metric mục tiêu/CPU budget; rollout/rollback. Audit không tự quyết định thay rules đang chạy.

**NOT VERIFIED:** Effort thực tế theo người/ngày, benchmark đạt ngưỡng nào, Android camera injection resistance. Không đủ bằng chứng thì ghi blocker thay vì hạ acceptance để hoàn thành demo.
