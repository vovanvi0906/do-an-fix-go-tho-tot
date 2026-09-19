# 🗄️ TRÌNH TỰ MIGRATION AN TOÀN (DB-MIGRATION RULES)
## ÁP DỤNG CHO: PostgreSQL + PostGIS + Prisma ORM

Migration sai có thể xóa dữ liệu thật. File này là **rule bắt buộc cao nhất** trong toàn bộ hệ thống — ưu tiên hơn tốc độ code.

---

## 1. NGUYÊN TẮC TỐI THƯỢNG

* **Không bao giờ tự ý chạy các lệnh sau nếu không có xác nhận rõ ràng từ người dùng cho từng lần:**
  * `prisma migrate reset` (xóa toàn bộ DB)
  * `prisma db push --force-reset`
  * Bất kỳ câu lệnh SQL nào chứa `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`
* **Luôn ưu tiên thay đổi cộng thêm (additive-first):** thêm cột mới ở dạng `nullable` hoặc có `default`, không sửa/xóa cột cũ trong cùng một migration đang có dữ liệu.
* **Tách rời "đổi schema" và "xóa dữ liệu cũ":** Nếu cần bỏ một cột không dùng nữa, làm theo 2 bước cách nhau: (1) migration đánh dấu deprecated + ngừng dùng trong code, (2) migration xóa cột thật ở lần sau, sau khi xác nhận không còn phụ thuộc.

---

## 2. QUY TRÌNH TẠO MIGRATION MỚI (THEO THỨ TỰ)

### Bước 1 — Sửa `schema.prisma`
Chỉ sửa phần model liên quan đến task hiện tại. Không "tiện tay" sửa model khác.

### Bước 2 — Sinh migration ở môi trường dev/local
```
npx prisma migrate dev --name <mo_ta_ngan_gon_bang_tieng_anh>
```
Tên migration dùng snake_case tiếng Anh mô tả đúng thay đổi, ví dụ: `add_worker_verification_status`, `add_geospatial_index_workers`.

### Bước 3 — Đọc lại file SQL được sinh ra
File nằm tại `prisma/migrations/<timestamp>_<name>/migration.sql`. **Bắt buộc đọc toàn bộ nội dung trước khi coi là hoàn tất** — kiểm tra:
- Có câu lệnh `DROP`/`ALTER ... DROP COLUMN` không mong muốn không?
- Cột mới có `NOT NULL` mà không có `DEFAULT` trên bảng đã có dữ liệu không (sẽ fail nếu bảng không rỗng)?
- Index không gian (GiST cho PostGIS) có được tạo đúng cú pháp không (Prisma không tự sinh GiST index — phải viết tay bằng migration thủ công nếu cần, xem mục 4).

### Bước 4 — Chạy `prisma generate`
Đảm bảo Prisma Client đồng bộ với schema mới trước khi viết code service dùng field mới.

### Bước 5 — Seed/backfill dữ liệu (nếu cần)
Viết script backfill riêng trong `prisma/seed/`, không nhét logic backfill vào file migration.sql.

### Bước 6 — Migration cho production
```
npx prisma migrate deploy
```
Chỉ chạy sau khi đã test ở local/staging. Với thay đổi ảnh hưởng bảng lớn (`orders`, `wallets`, `wallet_transactions`) — backup DB trước khi deploy.

---

## 3. QUY TẮC RIÊNG CHO CÁC BẢNG NHẠY CẢM

* **`wallets`, `wallet_transactions`:** Không migration nào được phép sửa kiểu dữ liệu cột `amount`/`balance` (ví dụ đổi `Decimal` sang `Float`) — sai lệch số thực gây lỗi tính tiền. Luôn dùng `Decimal` với `@db.Decimal(15, 2)`.
* **`orders`:** Khi thêm trạng thái mới vào enum `OrderStatus`, phải cập nhật đồng thời state machine mô tả trong `backend.md`/`architecture.md`, không thêm state "mồ côi" không ai transition tới.
* **Geospatial (PostGIS):** Cột toạ độ dùng kiểu `geography(Point, 4326)`, index bắt buộc kiểu GiST. Prisma schema không hỗ trợ trực tiếp — dùng migration thủ công (`npx prisma migrate dev --create-only` rồi tự viết SQL) cho các cột này.

---

## 4. MIGRATION THỦ CÔNG (CHO POSTGIS / RAW SQL)

Khi cần SQL mà Prisma không hỗ trợ sinh tự động:
```
npx prisma migrate dev --create-only --name <ten_migration>
```
Sau đó chỉnh tay file `migration.sql` trước khi apply, ví dụ:
```sql
ALTER TABLE "workers" ADD COLUMN "location" geography(Point, 4326);
CREATE INDEX "workers_location_gist_idx" ON "workers" USING GIST ("location");
```
Rồi mới chạy `npx prisma migrate dev` (không có `--create-only`) để áp dụng.

---

## 5. ROLLBACK

Prisma không có lệnh rollback tự động. Khi migration lỗi ở production:
1. Không tự sửa trực tiếp DB production bằng tay.
2. Viết migration mới đảo ngược thay đổi (forward-only strategy), không cố "undo" migration cũ.
3. Ghi lại sự cố và nguyên nhân vào commit message của migration sửa lỗi.