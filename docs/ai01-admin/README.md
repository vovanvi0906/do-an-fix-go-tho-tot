# AI-01 Review trong FixGo Admin Web

Cơ chế hiện hành: tài khoản PostgreSQL ACTIVE / ADMIN tự có quyền quản lý phân quyền và Coordinator sau khi đăng nhập thật. Không bootstrap, không phê duyệt thứ hai, không cấp Coordinator thủ công. Đây là thay đổi được chủ dự án yêu cầu; các báo cáo/evidence bootstrap trước đây là lịch sử, không mô tả quyền hiện hành.

Xem [hướng dẫn vận hành](USER-GUIDE.md) và [kết quả kiểm thử cơ chế Admin tự động](ADMIN-AUTO-RESULTS.txt).

Backend NestJS xác thực JWT và lookup user ACTIVE/role từ Prisma mỗi request. Review API cho authenticated principal có quyền tương ứng; permissions API chỉ ACTIVE ADMIN. Frontend không quyết định quyền backend.

ADMIN tự có quản lý mapping, nguồn, readiness/export, nhân sự và phân xử theo validation TASK03C. ADMIN không tự có Reviewer A/B hoặc chuyên môn; không được gắn slot reviewer. Để tự gán nhãn khóa luận, dùng chế độ SOLO_THESIS riêng. Trong luồng độc lập, Reviewer là hai tài khoản active không phải ADMIN, được Admin phân công có audit và dùng workspace `/ai01/:section`. Người phân xử phải khác A/B. Ràng buộc lịch sử chặn tự đổi vai trò/chuyên môn hoặc chuyển slot đã dùng.

Policy users giữ assignment/expertise explicit; metadata manager/bootstrap cũ chỉ là lịch sử. Policy/audit vẫn có revision, hash chain, lock và audit-before-swap. Không xóa audit khi thay đổi cơ chế. Python adapter stdio giữ Store TASK03C và kiểm checksum trước import. State Admin riêng copy baseline nguyên byte; source lịch sử không thay đổi.

Không migration, không đổi production inference/model/dataset. Runtime local một writer; JWT_SECRET/path không vào client hoặc Git. Quyền quản trị không bỏ kiểm độc lập, expert, quyền ảnh, nguồn, metadata, hash và TASK01 export contract. Thiếu điều kiện phải chặn export toàn subset.

Bộ kiểm thử HTTP: `cd server && npx jest --config test/jest-ai01-admin.config.cjs --runInBand`.
Bộ trình duyệt: `node server/test/check-ai01-admin-ui.cjs` với Vite cổng 5173; auth/DB fixture cô lập, engine thật và state tạm. Kết quả này không thay thế đăng nhập tài khoản thật; xem báo cáo hiện hành để biết giới hạn bằng chứng.

## SOLO_THESIS

Menu **Khóa luận một người** mở `/admin/ai01/solo`. ADMIN active tự duyệt mapping, gán nhãn, kiểm nguồn, tự xác nhận và xuất `solo-development`. State và audit riêng trong `solo-thesis/`, không sao chép quyết định SOLO vào Store độc lập. Bản xuất đánh dấu đúng một người thực hiện, không độc lập và không blind test; không dùng schema adjudicated của TASK01.

Xem [quy trình SOLO trong USER-GUIDE](USER-GUIDE.md) và [API/kiểm thử SOLO](SOLO-THESIS-RESULTS.txt). Bộ HTTP hiện chạy cả kiểm thử độc lập và SOLO. Kiểm thử trình duyệt SOLO: `node server/test/check-ai01-solo-ui.cjs` (Vite 5173, auth/DB fixture cô lập, engine thật, state tạm).
