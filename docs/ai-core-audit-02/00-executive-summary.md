# AI-CORE-AUDIT-02 — Kết luận forensic

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

## A. Top 10 vấn đề nghiêm trọng nhất

| # / Mức độ | Phát hiện có bằng chứng | Tác động và giới hạn |
|---|---|---|
| 1 — CRITICAL SECURITY FINDING | FastAPI trả face verified=true/.95 khi thiếu model, decode lỗi, không mặt hoặc exception; detection-only cũng verified=true | Daily chỉ kiểm boolean/score, có thể ghi faceVerifiedAt mà chưa match danh tính. Offline branch checks xác nhận, chưa thử thợ thật. [E23](13-evidence-index.md#e23) [E25](13-evidence-index.md#e25) |
| 2 — CRITICAL SECURITY FINDING | Per-order dùng Nest heuristic fallback khi network lỗi, rồi ghi faceVerifiedAt và kycStatus APPROVED | Chỉ với tài khoản WORKER ACTIVE được gán đơn đúng stage; không phải endpoint anonymous. [E07](13-evidence-index.md#e07) [E26](13-evidence-index.md#e26) [E28](13-evidence-index.md#e28) |
| 3 — HIGH | Không có PAD, challenge/nonce/capture session hoặc proof chống replay trong call chain | Một ảnh tĩnh đủ đi vào matcher; không chứng minh chống ảnh in/màn hình/video/injection. [E23](13-evidence-index.md#e23) [E39](13-evidence-index.md#e39) [E60](13-evidence-index.md#e60) |
| 4 — HIGH | faceVerifiedAt chung cho daily và mọi đơn; không ghi FaceVerification theo order | Gate nhận đơn/bắt đầu không có chứng cứ riêng theo đơn. Worker UI chặn start, API vẫn dùng timestamp chung với các điều kiện FSM khác. [E29](13-evidence-index.md#e29) [E34](13-evidence-index.md#e34) [E41](13-evidence-index.md#e41) |
| 5 — HIGH | Không tìm thấy enrollment endpoint/FaceProfile create/upsert; per-order dùng avatar do chủ tài khoản sửa làm fallback reference | Không có chuỗi bảo đảm template được danh tính đã duyệt phê chuẩn. Schema có field không đồng nghĩa có enrollment. [E34](13-evidence-index.md#e34) [E35](13-evidence-index.md#e35) [E36](13-evidence-index.md#e36) [E26](13-evidence-index.md#e26) |
| 6 — HIGH | Dataset1.200 ảnh, generator synthetic và exact split leakage210/109/109 hash; nhiều candidate gần trùng | Accuracy run cũ không đại diện ảnh điện thoại; taxonomy YOLO 6 class khác CLIP 7 class. [E17](13-evidence-index.md#e17) [E19](13-evidence-index.md#e19) [E20](13-evidence-index.md#e20) [E04](13-evidence-index.md#e04) |
| 7 — HIGH | AI service static 25 services, target và service ranking độc lập; Backend bỏ target/service và không nhận targetId | Có 70 targets/693 services DB nhưng chưa có retrieval/ranking ba tầng hoàn chỉnh. 25 slug hiện có trong DB và static target slug của cả25 cũng khớp snapshot; không phải693 dịch vụ đã được embed. [E03](13-evidence-index.md#e03) [E04](13-evidence-index.md#e04) [E05](13-evidence-index.md#e05) |
| 8 — HIGH | Dữ liệu face URL lưu object storage; không thấy template version/re-enrollment audit/retention/private delivery trong code | Không kết luận hệ thống hạ tầng không mã hóa; chính sách và cấu hình bên ngoài NOT VERIFIED. [E34](13-evidence-index.md#e34) [E37](13-evidence-index.md#e37) [E38](13-evidence-index.md#e38) [E50](13-evidence-index.md#e50) |
| 9 — HIGH | Image decoder cho URL tùy ý/local path; FastAPI không có auth ở routes, compose publish 8000 | Nguy cơ fetch nội bộ/lộ kết quả từ input không tin cậy và lạm dụng CPU; chưa kiểm network reachability hay khai thác. [E45](13-evidence-index.md#e45) [E52](13-evidence-index.md#e52) |
| 10 — HIGH | Compare fallback `passed=true, matchScore=.92`; Backend lưu score và báo đạt | Tạo thông điệp chất lượng không có chứng cứ; chưa chứng minh tự động settlement/FSM từ score. `passed` là boolean, không phải số .92. [E46](13-evidence-index.md#e46) [E47](13-evidence-index.md#e47) |

**Mức độ nghiêm trọng là đánh giá định tính để ưu tiên sửa từ code baseline, không phải điểm CVSS hoặc chứng minh exposure production.** Nguồn gốc từng ảnh và toàn bộ lịch sử tạo dataset chưa có manifest; synthetic generator là VERIFIED, gán mọi file hiện tại cho một run generator cụ thể là NOT VERIFIED.

## B. Kiến trúc hiện tại có phù hợp không?

**VERIFIED:** Các primitive ML/CV là có thật: YOLO classifier, CLIP và YuNet/SFace; các quyết định business đa phần là rule/DB lookup. **INFERRED:** Có thể làm nguyên mẫu có trợ giúp, nhưng chưa phù hợp để tuyên bố chẩn đoán nguyên nhân hỏng hoặc biometric security production. Vấn đề ưu tiên là trust boundary và dữ liệu, không phải thêm model phức tạp. [E01](13-evidence-index.md#e01) [E05](13-evidence-index.md#e05) [E23](13-evidence-index.md#e23) [E29](13-evidence-index.md#e29)

## C. Mức độ hoàn thiện thực tế

| Hệ thống | Đã có | Chưa đủ |
|---|---|---|
| Recommendation | Image→category, manual/symptom→DB service, booking lấy giá server | Target xuyên Backend, service ranking theo target/symptom, benchmark độc lập, calibration |
| Face enrollment | Schema FaceProfile/embedding, một số đường đọc reference | Enrollment/re-enrollment được phê duyệt, template immutable/versioned, audit log |
| Daily Face ID | Auth current user, reference từ faceProfile, persist timestamp, 24h gate | Reject heuristic/detection-only, PAD/freshness và method provenance |
| Per-order Face ID | Assigned-worker + stage guards, SFace path khi ảnh/reference dùng được | Order proof độc lập; UI hiện chặn flow vì thiếu contract |
| PAD/replay/injection | Không tìm thấy cơ chế chuyên biệt trong phạm vi source | Chưa triển khai PAD/challenge/session; bảo vệ injection/deepfake NOT VERIFIED |

Không gán phần trăm “hoàn thiện” hoặc “accuracy 95%” cho những mục này.

## D. Giữ / sửa / thay / train

- **RECOMMENDED — Giữ:** pretrained CLIP, YuNet, SFace làm baseline có version; catalog DB và guard assigned-worker, giá server, cơ chế manual selection.
- **RECOMMENDED — Sửa trước:** face fail-open, contract/provenance, daily vs order proof, enrollment, JSON description, filter category/target/service và snapshot catalog.
- **RECOMMENDED — Thay:** heuristic success bằng technical_error/inconclusive; static service list bằng DB retrieval có version; bỏ claim detector/liveness khi không có thực thi.
- **RECOMMENDED — Train sau benchmark:** category/target nếu có domain gap; PAD chỉ với dữ liệu/license/protocol. Không mặc định fine-tune SFace.

## E. Thứ tự task sau audit

Security hotfix riêng → enrollment + proof contract → test set độc lập → category/target/symptom retrieval → PAD evaluation/integration → fine-tune cần thiết → Android E2E. Roadmap có acceptance/dependencies/size ở [11](11-implementation-roadmap.md).

## F. Quyết định cần phê duyệt trước coding

1. Check-in có bắt buộc identity match + PAD không; khi lỗi kỹ thuật có chặn online/start và chuyển manual review thế nào?
2. Per-order proof có bắt buộc, dùng một lần ở bước nào, TTL bao lâu; xử lý mốc faceVerifiedAt cũ chưa có provenance?
3. Ai phê duyệt enrollment/re-enrollment; có chấp nhận avatar làm template không (khuyến nghị không)?
4. Quyền sử dụng ảnh, thời hạn lưu/xóa, private storage, chủ sở hữu quyền truy cập và quy trình rút đồng ý.
5. Giải pháp PAD và threat model: ảnh in/màn hình/video; injection là lớp riêng, không tự tuyên bố bảo vệ đầy đủ.
6. Taxonomy, benchmark và mục tiêu FAR/BPCER/abstention/latency; chưa đặt số mục tiêu giả thay người phụ trách.

**Phạm vi đã giữ:** chỉ thêm tài liệu/evidence trong thư mục này; không sửa source/UI/Face ID rules, USB, DB hay weights. Không inference ảnh người thật, không upload Cloudinary, không live mutation. Chưa thể công bố production-ready.
