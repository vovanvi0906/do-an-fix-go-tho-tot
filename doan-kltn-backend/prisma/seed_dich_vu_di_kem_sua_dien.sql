DO $$
DECLARE
    v_category_id TEXT;
    v_target_id TEXT;
BEGIN
    SELECT id INTO v_category_id FROM service_categories WHERE slug = 'sua-dien';
    
    IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'Category sua-dien not found!';
    END IF;

    -- =====================================================================================
    -- 29. ĐỐI TƯỢNG: Dịch vụ đi kèm & Vật tư phụ trợ
    -- =====================================================================================
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'dich-vu-di-kem-vat-tu-phu-tro';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid()::text;
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Dịch vụ đi kèm & Vật tư phụ trợ', 'dich-vu-di-kem-vat-tu-phu-tro', 'PackagePlus', 'Các dịch vụ phụ trợ, đục tường, kéo dây theo mét và cung cấp vật tư linh kiện chính hãng đi kèm', true, 29, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Dịch vụ đi kèm & Vật tư phụ trợ', icon = 'PackagePlus', description = 'Các dịch vụ phụ trợ, đục tường, kéo dây theo mét và cung cấp vật tư linh kiện chính hãng đi kèm', "sortOrder" = 29, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- 29.1 Đục rãnh tường chôn ống đi dây âm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Đục rãnh tường chôn ống đi dây âm', 'duc-ranh-tuong-chon-ong-di-day-am', 'Đục rãnh tường gạch/bê tông chuẩn kỹ thuật, đặt ống ghen luồn dây điện âm tường thẩm mỹ an toàn.', 40000, 'mét', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Đục rãnh tường chôn ống đi dây âm', "basePrice" = 40000, unit = 'mét', "estimatedDurationMin" = 30, "isActive" = true, "updatedAt" = NOW();

    -- 29.2 Trám trét tường xi măng / bả thạch cao hoàn thiện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Trám trét tường xi măng / thạch cao sau đục', 'tram-tret-tuong-xi-mang-thach-cao-sau-duc', 'Trám kín rãnh đục bằng vữa xi măng hoặc bột bả thạch cao, làm phẳng mặt bằng phẳng mịn.', 30000, 'mét', 25, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Trám trét tường xi măng / thạch cao sau đục', "basePrice" = 30000, unit = 'mét', "estimatedDurationMin" = 25, "isActive" = true, "updatedAt" = NOW();

    -- 29.3 Đi nẹp điện bán nguyệt / nẹp vuông luồn dây nổi
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Đi nẹp điện nhựa luồn dây nổi thẩm mỹ', 'di-nep-dien-nhua-luon-day-noi-tham-my', 'Lắp nẹp điện bán nguyệt đi sàn hoặc nẹp vuông dán tường che giấu dây điện gọn gàng chống chuột cắn.', 25000, 'mét', 20, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Đi nẹp điện nhựa luồn dây nổi thẩm mỹ', "basePrice" = 25000, unit = 'mét', "estimatedDurationMin" = 20, "isActive" = true, "updatedAt" = NOW();

    -- 29.4 Đi ống ruột gà chống cháy luồn dây điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Đi ống ruột gà chống cháy luồn dây điện', 'di-ong-ruot-ga-chong-chay-luon-day-dien', 'Luồn dây điện trong ống mềm ruột gà cách điện chống cháy lan, bảo vệ dây trên trần la phông hoặc dưới đất.', 20000, 'mét', 20, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Đi ống ruột gà chống cháy luồn dây điện', "basePrice" = 20000, unit = 'mét', "estimatedDurationMin" = 20, "isActive" = true, "updatedAt" = NOW();

    -- 29.5 Kéo thêm dây điện nguồn Cadivi 1.5mm - 2.5mm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Kéo dây điện nguồn Cadivi 1.5mm - 2.5mm', 'keo-day-dien-nguon-cadivi-15mm-25mm', 'Kéo bổ sung dây điện ruột đồng nguyên chất chính hãng Cadivi cho ổ cắm và hệ thống đèn.', 25000, 'mét', 25, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Kéo dây điện nguồn Cadivi 1.5mm - 2.5mm', "basePrice" = 25000, unit = 'mét', "estimatedDurationMin" = 25, "isActive" = true, "updatedAt" = NOW();

    -- 29.6 Kéo thêm dây điện tải lớn Cadivi 4.0mm - 6.0mm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Kéo dây nguồn tải lớn Cadivi 4.0mm - 6.0mm', 'keo-day-nguon-tai-lon-cadivi-40mm-60mm', 'Kéo đường dây nguồn tiết diện lớn chuyên tải bếp từ, bình nóng lạnh, điều hòa công suất lớn.', 45000, 'mét', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Kéo dây nguồn tải lớn Cadivi 4.0mm - 6.0mm', "basePrice" = 45000, unit = 'mét', "estimatedDurationMin" = 30, "isActive" = true, "updatedAt" = NOW();

    -- 29.7 Cung cấp & thay mặt nạ ổ cắm / công tắc (Panasonic / Sino)
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Cung cấp mặt nạ ổ cắm / công tắc cao cấp', 'cung-cap-mat-na-o-cam-cong-tac-cao-cap', 'Cung cấp và lắp đặt mặt nạ 1-2-3 thiết bị thương hiệu Panasonic hoặc Sino chính hãng chống ố vàng.', 35000, 'cái', 15, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Cung cấp mặt nạ ổ cắm / công tắc cao cấp', "basePrice" = 35000, unit = 'cái', "estimatedDurationMin" = 15, "isActive" = true, "updatedAt" = NOW();

    -- 29.8 Cung cấp & thay hạt ổ cắm / công tắc chính hãng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Cung cấp hạt ổ cắm / công tắc chính hãng', 'cung-cap-hat-o-cam-cong-tac-chinh-hang', 'Cung cấp hạt ổ cắm 2 chấu / 3 chấu hoặc hạt công tắc 1 chiều / 2 chiều tiêu chuẩn chống hồ quang.', 30000, 'cái', 15, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Cung cấp hạt ổ cắm / công tắc chính hãng', "basePrice" = 30000, unit = 'cái', "estimatedDurationMin" = 15, "isActive" = true, "updatedAt" = NOW();

    -- 29.9 Cung cấp & lắp đế âm tường / hộp nổi kỹ thuật
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Cung cấp đế âm tường / hộp nổi kỹ thuật', 'cung-cap-de-am-tuong-hop-noi-ky-thuat', 'Đế âm vuông / chữ nhật hoặc hộp nổi kỹ thuật nhựa chống cháy tự dập lửa.', 20000, 'cái', 20, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Cung cấp đế âm tường / hộp nổi kỹ thuật', "basePrice" = 20000, unit = 'cái', "estimatedDurationMin" = 20, "isActive" = true, "updatedAt" = NOW();

    -- 29.10 Cung cấp & thay MCB tép bảo vệ nhánh (16A - 32A)
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Cung cấp Aptomat MCB tép bảo vệ nhánh 1P/2P', 'cung-cap-aptomat-mcb-tep-bao-ve-nhanh-1p-2p', 'Aptomat MCB Panasonic / Schneider ngắt ngắn mạch và quá tải dòng 16A, 20A, 25A, 32A.', 95000, 'cái', 25, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Cung cấp Aptomat MCB tép bảo vệ nhánh 1P/2P', "basePrice" = 95000, unit = 'cái', "estimatedDurationMin" = 25, "isActive" = true, "updatedAt" = NOW();

    -- 29.11 Cung cấp & thay RCBO chống giật 30mA
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Cung cấp Aptomat chống giật RCBO 30mA', 'cung-cap-aptomat-chong-giat-rcbo-30ma', 'Thiết bị bảo vệ chống dòng rò và chống giật siêu nhạy 30mA ngắt điện tức thì 0.03s.', 220000, 'cái', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Cung cấp Aptomat chống giật RCBO 30mA', "basePrice" = 220000, unit = 'cái', "estimatedDurationMin" = 30, "isActive" = true, "updatedAt" = NOW();

    -- 29.12 Gia cố ty treo / móc treo trần thạch cao
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Gia cố ty treo / móc treo trần cho đèn, quạt', 'gia-co-ty-treo-moc-treo-tran-cho-den-quat', 'Khoan cấy tắc kê sắt vào sàn bê tông, thả ty ren chịu lực đảm bảo an toàn tuyệt đối cho quạt trần, đèn chùm.', 120000, 'điểm', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Gia cố ty treo / móc treo trần cho đèn, quạt', "basePrice" = 120000, unit = 'điểm', "estimatedDurationMin" = 45, "isActive" = true, "updatedAt" = NOW();

    -- 29.13 Tháo dỡ thiết bị cũ & thu dọn hoàn trả mặt bằng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Tháo dỡ thiết bị điện cũ & dọn dẹp mặt bằng', 'thao-do-thiet-bi-dien-cu-don-dep-mat-bang', 'Tháo dỡ an toàn bình nóng lạnh, quạt trần, đèn cũ, đóng gói và vệ sinh sạch sẽ khu vực làm việc.', 50000, 'bộ', 25, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Tháo dỡ thiết bị điện cũ & dọn dẹp mặt bằng', "basePrice" = 50000, unit = 'bộ', "estimatedDurationMin" = 25, "isActive" = true, "updatedAt" = NOW();

    -- 29.14 Gói vật tư phụ (Băng keo Nano, domino, tắc kê vít)
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Gói vật tư phụ (Băng keo cách điện, domino, tắc kê)', 'goi-vat-tu-phu-bang-keo-cach-dien-domino-tac-ke', 'Bộ vật tư phụ trợ cách điện chống ẩm gồm băng keo điện chuyên dụng, cầu đấu domino kẹp dây và ốc vít.', 30000, 'gói', 10, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Gói vật tư phụ (Băng keo cách điện, domino, tắc kê)', "basePrice" = 30000, unit = 'gói', "estimatedDurationMin" = 10, "isActive" = true, "updatedAt" = NOW();

    -- 29.15 Đo kiểm tra tải & cân pha an toàn toàn mạch
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, v_category_id, v_target_id, 'Đo kiểm tra tải & cân pha an toàn toàn mạch', 'do-kiem-tra-tai-can-pha-an-toan-toan-mach', 'Dùng ampe kìm và đồng hồ vạn năng kiểm tra dòng rò, độ sụt áp và cân đối phụ tải giữa các nhánh.', 100000, 'lần', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET "categoryId" = v_category_id, "targetId" = v_target_id, name = 'Đo kiểm tra tải & cân pha an toàn toàn mạch', "basePrice" = 100000, unit = 'lần', "estimatedDurationMin" = 35, "isActive" = true, "updatedAt" = NOW();

    -- =====================================================================================
    -- LIÊN KẾT TỰ ĐỘNG TẤT CẢ DỊCH VỤ SỬA ĐIỆN CHO WORKER PHỤ TRÁCH SỬA ĐIỆN
    -- =====================================================================================
    INSERT INTO worker_services ("id", "workerId", "serviceId", "isAvailable", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        wp.id,
        s.id,
        true,
        NOW(),
        NOW()
    FROM worker_profiles wp
    CROSS JOIN services s
    WHERE s."categoryId" = v_category_id
      AND (
        v_category_id = ANY(wp."serviceCategoryIds") 
        OR 'sua-dien' = ANY(wp."skills")
        OR wp.bio ILIKE '%điện%'
        OR array_length(wp."serviceCategoryIds", 1) IS NULL
      )
    ON CONFLICT ("workerId", "serviceId") DO UPDATE SET "isAvailable" = true, "updatedAt" = NOW();

    RAISE NOTICE 'Đã bổ sung thành công Đối tượng 29 Dịch vụ đi kèm & Vật tư phụ trợ và cập nhật worker_services!';
END $$;
