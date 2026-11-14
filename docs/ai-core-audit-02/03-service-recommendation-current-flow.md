# Dịch vụ được tạo kết quả như thế nào?

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

## Nguồn dịch vụ và ràng buộc

**VERIFIED:** CLIP load `_sub_service_embeddings` từ `SUB_SERVICES_CATALOG` tĩnh (25 service/6 category); target embeddings fetch DB (70 active targets trong snapshot). Câu log “Embeddings 3 tầng từ Database” không phản ánh nguồn service tĩnh. ServiceId AI là slug. Snapshot GET catalog xác nhận hiện cả 25 slug có trong 693 dịch vụ và đúng category; điều này chỉ đúng ở thời điểm snapshot, không có service status/price sync vào static list. [E02](13-evidence-index.md#e02) [E03](13-evidence-index.md#e03) [E04](13-evidence-index.md#e04) Xem [static-vs-db-catalog.json](evidence/static-vs-db-catalog.json).

**VERIFIED:** Target softmax trên toàn targets trước category filtering; nếu không target đúng hint, fallback global argmax. Service softmax trong category, không filter target; `predict_clip_full` ghi targetInfo đè lên target của sub_service. Vì vậy target hiển thị và service có thể không cùng thiết bị. Đây là lỗi quan hệ có thể xảy ra theo code, chưa có tỷ lệ thực địa. [E03](13-evidence-index.md#e03)

**VERIFIED:** `resolveDiagnosis` không đọc suggestedTargetId/suggestedServiceId của AI. Nó dùng category ID/slug và score≥threshold, query service active theo category, lọc symptom rules bằng slug có thật. Khách chọn service ID được kiểm membership; khách chọn symptom chọn một slug rule duy nhất. Không có ranking nhiều service theo triệu chứng, không top-k reranking, không câu hỏi phân biệt động; availableServices xếp alphabet. `answers.targetId` bị reject bởi allowlist; response services không gồm targetId. [E05](13-evidence-index.md#e05)

**VERIFIED:** Admin create/update/toggle/delete target gọi notifyAiServiceSync, fetch POST kiểu fire-and-forget, lỗi bị nuốt; không có ACK/version đảm bảo RAM đã cập nhật. Service CRUD không thấy gọi sync trong search scope. AI sync chỉ reload target embeddings, không rebuild sub-service từ DB. [E13](13-evidence-index.md#e13) [E14](13-evidence-index.md#e14) [E02](13-evidence-index.md#e02)

## Active status và khóa ngoại

| Tầng | Kiểm tra thực có | Khoảng trống |
|---|---|---|
| Schema | FK Service.categoryId và targetId riêng; target.categoryId cũng là FK | Không composite constraint buộc service.categoryId=service.target.categoryId; targetId nullable [E16](13-evidence-index.md#e16) |
| AI | Category hint và static category candidates | Không query service.isActive; có thể giữ service ngừng hoạt động sau Admin update [E03](13-evidence-index.md#e03) [E04](13-evidence-index.md#e04) |
| Resolver | Category active, service active + category membership | Không targetId/target active filter; không kế thừa việc target bị vô hiệu hóa nếu service vẫn active [E05](13-evidence-index.md#e05) |
| Booking create | Service active + category active, category khớp; giá từ server | Không target.isActive và không category-target invariant tại đoạn này [E12](13-evidence-index.md#e12) |
| Detail GET | findUnique ID + include category/target | Không active filter trong getServiceById [E15](13-evidence-index.md#e15) |

**NOT VERIFIED:** Có row DB hiện vi phạm category-target hoặc service active dưới target disabled. Snapshot active tree không bao gồm inactive entities nên không dùng nó chứng minh toàn DB sạch/vi phạm. Đây là thiếu guard được xác minh, tác động dữ liệu thực cần truy vấn read-only được phép thêm.

## Ví dụ FixGo dùng dịch vụ thật, không tạo đơn

**VERIFIED:** GET `/api/service-categories/tree` chỉ đọc cho snapshot:

| Trường | Giá trị xác minh |
|---|---|
| category | Sửa điện — `4d397d29-ec22-4eae-88ea-8e411e04bdb3` |
| target | Công tắc điện — `f2b5a73e-b1e3-45c2-97c1-a09015ad18b6` |
| service | Sửa công tắc không hoạt động — `00a5f8a1-29f9-4179-adc1-556cb7bad482` |
| slug / giá / unit | `sua-cong-tac-khong-hoat-dong` / 100000 / điểm |

Offline gọi **hàm resolver hiện tại** với catalog snapshot và AI stub ghi rõ:

1. Ảnh fixture không tải; AI category `sua-dien`, score .8 là stub kiểm contract, **không phải inference ảnh thật**. Target/service stub cố tình khác bị bỏ. Output `needs_more_info`, serviceId=null.
2. Khách xác nhận `answers={categoryId: <ID ở trên>, symptom:'switch_power'}`; resolver bỏ AI, tìm rule/DB snapshot, trả suggested/source=rules, service ID thật, giá100000/unit điểm.
3. Target ID lấy được từ snapshot/detail, **không có trong response diagnose**. Home truyền category/service tới booking; useBooking lấy detail và scoped services; createOrder sẽ kiểm lại active/giá server. Bước tạo đơn chỉ truy code, không gửi request và không ghi DB.

Bằng chứng: [catalog-flow.json](evidence/catalog-flow.json), script [check-catalog-flow.cjs](evidence/check-catalog-flow.cjs), call chain [E05](13-evidence-index.md#e05) [E10](13-evidence-index.md#e10) [E11](13-evidence-index.md#e11) [E12](13-evidence-index.md#e12). Không gọi đây là E2E ảnh→AI đúng→booking thành công.

**RECOMMENDED:** Trả candidate target DB IDs; khách chọn thiết bị/triệu chứng; filter categoryId+targetId+isActive của cả cây; rank nhiều service hợp lệ; cho abstain/manual. Confidence target/service không được tạo bằng multiplier tùy ý rồi gọi xác suất chẩn đoán.
