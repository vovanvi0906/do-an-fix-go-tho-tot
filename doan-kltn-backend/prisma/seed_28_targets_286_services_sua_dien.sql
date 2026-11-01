-- =========================================================================================
-- FIXGO PRO: SQL SEED CHO 28 ĐỐI TƯỢNG VÀ 286 DỊCH VỤ THUỘC DANH MỤC "SỬA ĐIỆN" (sua-dien)
-- Hỗ trợ Postgres / PostGIS - Tương thích 100% với Prisma Schema FixGo Pro
-- Tự động sinh UUID bằng gen_random_uuid() và kiểm tra tồn tại (ON CONFLICT DO UPDATE)
-- =========================================================================================

DO $$
DECLARE
    v_category_id UUID;
    v_target_id UUID;
BEGIN
    -- 1. Tìm hoặc khởi tạo Danh mục 'Sửa điện'
    SELECT id INTO v_category_id FROM service_categories WHERE slug = 'sua-dien';
    
    IF v_category_id IS NULL THEN
        v_category_id := gen_random_uuid();
        INSERT INTO service_categories (id, name, slug, description, "basePrice", unit, "estimatedMinutes", "warrantyDays", "isActive", "createdAt", "updatedAt")
        VALUES (
            v_category_id,
            'Sửa điện',
            'sua-dien',
            'Khắc phục sự cố điện dân dụng, chập cháy, thay thế công tắc ổ cắm an toàn 100%.',
            80000,
            'lần',
            60,
            30,
            true,
            NOW(),
            NOW()
        );
    END IF;

    -- -------------------------------------------------------------------------------------
    -- 01. ĐỐI TƯỢNG: Ổ cắm điện (11 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'o-cam-dien';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Ổ cắm điện', 'o-cam-dien', 'Zap', 'Các gói dịch vụ chuyên trách cho ổ cắm điện', true, 1, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Ổ cắm điện', icon = 'Zap', description = 'Các gói dịch vụ chuyên trách cho ổ cắm điện', "sortOrder" = 1, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Sửa ổ cắm không có điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa ổ cắm không có điện', 'sua-o-cam-khong-co-dien', 'Sửa ổ cắm không có điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'điểm', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa ổ cắm không có điện',
        description = 'Sửa ổ cắm không có điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'điểm',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa ổ cắm chập chờn / tiếp xúc kém
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa ổ cắm chập chờn / tiếp xúc kém', 'sua-o-cam-chap-chon-tiep-xuc-kem', 'Sửa ổ cắm chập chờn / tiếp xúc kém chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'điểm', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa ổ cắm chập chờn / tiếp xúc kém',
        description = 'Sửa ổ cắm chập chờn / tiếp xúc kém chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'điểm',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa ổ cắm bị lỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa ổ cắm bị lỏng', 'sua-o-cam-bi-long', 'Sửa ổ cắm bị lỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 80000, 'điểm', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa ổ cắm bị lỏng',
        description = 'Sửa ổ cắm bị lỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 80000,
        unit = 'điểm',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay ổ cắm cháy / hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay ổ cắm cháy / hỏng', 'thay-o-cam-chay-hong', 'Thay ổ cắm cháy / hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay ổ cắm cháy / hỏng',
        description = 'Thay ổ cắm cháy / hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay ổ cắm âm tường
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay ổ cắm âm tường', 'thay-o-cam-am-tuong', 'Thay ổ cắm âm tường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay ổ cắm âm tường',
        description = 'Thay ổ cắm âm tường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay ổ cắm nổi
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay ổ cắm nổi', 'thay-o-cam-noi', 'Thay ổ cắm nổi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay ổ cắm nổi',
        description = 'Thay ổ cắm nổi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt ổ cắm mới
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt ổ cắm mới', 'lap-dat-o-cam-moi', 'Lắp đặt ổ cắm mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'điểm', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt ổ cắm mới',
        description = 'Lắp đặt ổ cắm mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'điểm',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Di dời vị trí ổ cắm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Di dời vị trí ổ cắm', 'di-doi-vi-tri-o-cam', 'Di dời vị trí ổ cắm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'điểm', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Di dời vị trí ổ cắm',
        description = 'Di dời vị trí ổ cắm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'điểm',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt ổ cắm chống nước
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt ổ cắm chống nước', 'lap-dat-o-cam-chong-nuoc', 'Lắp đặt ổ cắm chống nước chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt ổ cắm chống nước',
        description = 'Lắp đặt ổ cắm chống nước chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt ổ cắm có cổng USB / USB-C
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt ổ cắm có cổng USB / USB-C', 'lap-dat-o-cam-co-cong-usb-usb-c', 'Lắp đặt ổ cắm có cổng USB / USB-C chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt ổ cắm có cổng USB / USB-C',
        description = 'Lắp đặt ổ cắm có cổng USB / USB-C chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra ổ cắm phát nóng / có mùi khét
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra ổ cắm phát nóng / có mùi khét', 'kiem-tra-o-cam-phat-nong-co-mui-khet', 'Kiểm tra ổ cắm phát nóng / có mùi khét chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra ổ cắm phát nóng / có mùi khét',
        description = 'Kiểm tra ổ cắm phát nóng / có mùi khét chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 02. ĐỐI TƯỢNG: Công tắc điện (11 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'cong-tac-dien';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Công tắc điện', 'cong-tac-dien', 'ToggleLeft', 'Các gói dịch vụ chuyên trách cho công tắc điện', true, 2, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Công tắc điện', icon = 'ToggleLeft', description = 'Các gói dịch vụ chuyên trách cho công tắc điện', "sortOrder" = 2, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Sửa công tắc không hoạt động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc không hoạt động', 'sua-cong-tac-khong-hoat-dong', 'Sửa công tắc không hoạt động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc không hoạt động',
        description = 'Sửa công tắc không hoạt động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa công tắc chập chờn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc chập chờn', 'sua-cong-tac-chap-chon', 'Sửa công tắc chập chờn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc chập chờn',
        description = 'Sửa công tắc chập chờn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa công tắc bị kẹt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc bị kẹt', 'sua-cong-tac-bi-ket', 'Sửa công tắc bị kẹt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 80000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc bị kẹt',
        description = 'Sửa công tắc bị kẹt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 80000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay công tắc điện hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay công tắc điện hỏng', 'thay-cong-tac-dien-hong', 'Thay công tắc điện hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay công tắc điện hỏng',
        description = 'Thay công tắc điện hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay công tắc âm tường / nổi
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay công tắc âm tường / nổi', 'thay-cong-tac-am-tuong-noi', 'Thay công tắc âm tường / nổi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay công tắc âm tường / nổi',
        description = 'Thay công tắc âm tường / nổi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt công tắc mới
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt công tắc mới', 'lap-dat-cong-tac-moi', 'Lắp đặt công tắc mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'điểm', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt công tắc mới',
        description = 'Lắp đặt công tắc mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'điểm',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Di dời công tắc
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Di dời công tắc', 'di-doi-cong-tac', 'Di dời công tắc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'điểm', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Di dời công tắc',
        description = 'Di dời công tắc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'điểm',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp công tắc cảm ứng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp công tắc cảm ứng', 'lap-cong-tac-cam-ung', 'Lắp công tắc cảm ứng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp công tắc cảm ứng',
        description = 'Lắp công tắc cảm ứng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp công tắc thông minh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp công tắc thông minh', 'lap-cong-tac-thong-minh', 'Lắp công tắc thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bộ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp công tắc thông minh',
        description = 'Lắp công tắc thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bộ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa công tắc điều chỉnh độ sáng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc điều chỉnh độ sáng', 'sua-cong-tac-dieu-chinh-do-sang', 'Sửa công tắc điều chỉnh độ sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc điều chỉnh độ sáng',
        description = 'Sửa công tắc điều chỉnh độ sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa công tắc hai chiều / cầu thang
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc hai chiều / cầu thang', 'sua-cong-tac-hai-chieu-cau-thang', 'Sửa công tắc hai chiều / cầu thang chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'hệ thống', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc hai chiều / cầu thang',
        description = 'Sửa công tắc hai chiều / cầu thang chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 03. ĐỐI TƯỢNG: Bóng đèn / Đèn chiếu sáng (13 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'bong-den-chieu-sang';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Bóng đèn / Đèn chiếu sáng', 'bong-den-chieu-sang', 'Lightbulb', 'Các gói dịch vụ chuyên trách cho bóng đèn / đèn chiếu sáng', true, 3, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Bóng đèn / Đèn chiếu sáng', icon = 'Lightbulb', description = 'Các gói dịch vụ chuyên trách cho bóng đèn / đèn chiếu sáng', "sortOrder" = 3, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Thay bóng đèn LED
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bóng đèn LED', 'thay-bong-den-led', 'Thay bóng đèn LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 80000, 'bóng', 25, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bóng đèn LED',
        description = 'Thay bóng đèn LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 80000,
        unit = 'bóng',
        "estimatedDurationMin" = 25,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay bóng đèn tuýp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bóng đèn tuýp', 'thay-bong-den-tuyp', 'Thay bóng đèn tuýp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'bóng', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bóng đèn tuýp',
        description = 'Thay bóng đèn tuýp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'bóng',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn không sáng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn không sáng', 'sua-den-khong-sang', 'Sửa đèn không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn không sáng',
        description = 'Sửa đèn không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn chập chờn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn chập chờn', 'sua-den-chap-chon', 'Sửa đèn chập chờn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn chập chờn',
        description = 'Sửa đèn chập chờn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn sáng yếu
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn sáng yếu', 'sua-den-sang-yeu', 'Sửa đèn sáng yếu chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn sáng yếu',
        description = 'Sửa đèn sáng yếu chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn LED nhấp nháy
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn LED nhấp nháy', 'sua-den-led-nhap-nhay', 'Sửa đèn LED nhấp nháy chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn LED nhấp nháy',
        description = 'Sửa đèn LED nhấp nháy chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay driver / bộ nguồn LED
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay driver / bộ nguồn LED', 'thay-driver-bo-nguon-led', 'Thay driver / bộ nguồn LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay driver / bộ nguồn LED',
        description = 'Thay driver / bộ nguồn LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay đui đèn hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay đui đèn hỏng', 'thay-dui-den-hong', 'Thay đui đèn hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 80000, 'cái', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay đui đèn hỏng',
        description = 'Thay đui đèn hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 80000,
        unit = 'cái',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn LED âm trần
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn LED âm trần', 'lap-den-led-am-tran', 'Lắp đèn LED âm trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 110000, 'bóng', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn LED âm trần',
        description = 'Lắp đèn LED âm trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 110000,
        unit = 'bóng',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn LED ốp trần
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn LED ốp trần', 'lap-den-led-op-tran', 'Lắp đèn LED ốp trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn LED ốp trần',
        description = 'Lắp đèn LED ốp trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn tuýp / đèn thanh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn tuýp / đèn thanh', 'lap-den-tuyp-den-thanh', 'Lắp đèn tuýp / đèn thanh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn tuýp / đèn thanh',
        description = 'Lắp đèn tuýp / đèn thanh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn tường / đèn trang trí
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn tường / đèn trang trí', 'lap-den-tuong-den-trang-tri', 'Lắp đèn tường / đèn trang trí chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn tường / đèn trang trí',
        description = 'Lắp đèn tường / đèn trang trí chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra đèn bị chập / phát nóng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra đèn bị chập / phát nóng', 'kiem-tra-den-bi-chap-phat-nong', 'Kiểm tra đèn bị chập / phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'lần', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra đèn bị chập / phát nóng',
        description = 'Kiểm tra đèn bị chập / phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'lần',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 04. ĐỐI TƯỢNG: Đèn chùm / Đèn trang trí (11 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'den-chum-trang-tri';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Đèn chùm / Đèn trang trí', 'den-chum-trang-tri', 'Sparkles', 'Các gói dịch vụ chuyên trách cho đèn chùm / đèn trang trí', true, 4, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Đèn chùm / Đèn trang trí', icon = 'Sparkles', description = 'Các gói dịch vụ chuyên trách cho đèn chùm / đèn trang trí', "sortOrder" = 4, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Lắp đặt đèn chùm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt đèn chùm', 'lap-dat-den-chum', 'Lắp đặt đèn chùm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 350000, 'bộ', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt đèn chùm',
        description = 'Lắp đặt đèn chùm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 350000,
        unit = 'bộ',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Tháo dỡ đèn chùm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Tháo dỡ đèn chùm', 'thao-do-den-chum', 'Tháo dỡ đèn chùm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bộ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Tháo dỡ đèn chùm',
        description = 'Tháo dỡ đèn chùm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bộ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn chùm không sáng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn chùm không sáng', 'sua-den-chum-khong-sang', 'Sửa đèn chùm không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'bộ', 75, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn chùm không sáng',
        description = 'Sửa đèn chùm không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'bộ',
        "estimatedDurationMin" = 75,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay bóng / đui đèn chùm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bóng / đui đèn chùm', 'thay-bong-dui-den-chum', 'Thay bóng / đui đèn chùm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bóng / đui đèn chùm',
        description = 'Thay bóng / đui đèn chùm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay bộ nguồn / driver đèn trang trí
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bộ nguồn / driver đèn trang trí', 'thay-bo-nguon-driver-den-trang-tri', 'Thay bộ nguồn / driver đèn trang trí chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bộ nguồn / driver đèn trang trí',
        description = 'Thay bộ nguồn / driver đèn trang trí chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn thả trần
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn thả trần', 'lap-den-tha-tran', 'Lắp đèn thả trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn thả trần',
        description = 'Lắp đèn thả trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn LED dây
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn LED dây', 'lap-den-led-day', 'Lắp đèn LED dây chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'cuộn', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn LED dây',
        description = 'Lắp đèn LED dây chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'cuộn',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn LED dây không sáng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn LED dây không sáng', 'sua-den-led-day-khong-sang', 'Sửa đèn LED dây không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn LED dây không sáng',
        description = 'Sửa đèn LED dây không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn hắt trần
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn hắt trần', 'lap-den-hat-tran', 'Lắp đèn hắt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'mét', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn hắt trần',
        description = 'Lắp đèn hắt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'mét',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bộ điều khiển đèn RGB / LED
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bộ điều khiển đèn RGB / LED', 'sua-bo-dieu-khien-den-rgb-led', 'Sửa bộ điều khiển đèn RGB / LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bộ điều khiển đèn RGB / LED',
        description = 'Sửa bộ điều khiển đèn RGB / LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bảo dưỡng / vệ sinh đèn trang trí
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bảo dưỡng / vệ sinh đèn trang trí', 'bao-duong-ve-sinh-den-trang-tri', 'Bảo dưỡng / vệ sinh đèn trang trí chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'bộ', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bảo dưỡng / vệ sinh đèn trang trí',
        description = 'Bảo dưỡng / vệ sinh đèn trang trí chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'bộ',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 05. ĐỐI TƯỢNG: Đèn ngoài trời / Đèn sân vườn (10 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'den-ngoai-troi-san-vuon';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Đèn ngoài trời / Đèn sân vườn', 'den-ngoai-troi-san-vuon', 'Trees', 'Các gói dịch vụ chuyên trách cho đèn ngoài trời / đèn sân vườn', true, 5, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Đèn ngoài trời / Đèn sân vườn', icon = 'Trees', description = 'Các gói dịch vụ chuyên trách cho đèn ngoài trời / đèn sân vườn', "sortOrder" = 5, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Lắp đèn sân vườn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn sân vườn', 'lap-den-san-vuon', 'Lắp đèn sân vườn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'trụ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn sân vườn',
        description = 'Lắp đèn sân vườn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'trụ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn cổng / đèn tường ngoài trời
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn cổng / đèn tường ngoài trời', 'lap-den-cong-den-tuong-ngoai-troi', 'Lắp đèn cổng / đèn tường ngoài trời chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn cổng / đèn tường ngoài trời',
        description = 'Lắp đèn cổng / đèn tường ngoài trời chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn pha LED
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn pha LED', 'lap-den-pha-led', 'Lắp đèn pha LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn pha LED',
        description = 'Lắp đèn pha LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn chống nước
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn chống nước', 'lap-den-chong-nuoc', 'Lắp đèn chống nước chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn chống nước',
        description = 'Lắp đèn chống nước chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn ngoài trời không sáng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn ngoài trời không sáng', 'sua-den-ngoai-troi-khong-sang', 'Sửa đèn ngoài trời không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn ngoài trời không sáng',
        description = 'Sửa đèn ngoài trời không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn ngoài trời chập chờn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn ngoài trời chập chờn', 'sua-den-ngoai-troi-chap-chon', 'Sửa đèn ngoài trời chập chờn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn ngoài trời chập chờn',
        description = 'Sửa đèn ngoài trời chập chờn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay bộ nguồn / driver đèn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bộ nguồn / driver đèn', 'thay-bo-nguon-driver-den', 'Thay bộ nguồn / driver đèn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bộ nguồn / driver đèn',
        description = 'Thay bộ nguồn / driver đèn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra hệ thống dây đèn ngoài trời
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra hệ thống dây đèn ngoài trời', 'kiem-tra-he-thong-day-den-ngoai-troi', 'Kiểm tra hệ thống dây đèn ngoài trời chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'hệ thống', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra hệ thống dây đèn ngoài trời',
        description = 'Kiểm tra hệ thống dây đèn ngoài trời chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay đèn cảm biến chuyển động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay đèn cảm biến chuyển động', 'thay-den-cam-bien-chuyen-dong', 'Thay đèn cảm biến chuyển động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay đèn cảm biến chuyển động',
        description = 'Thay đèn cảm biến chuyển động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn tự bật khi trời tối
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn tự bật khi trời tối', 'lap-den-tu-bat-khi-troi-toi', 'Lắp đèn tự bật khi trời tối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 170000, 'bộ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn tự bật khi trời tối',
        description = 'Lắp đèn tự bật khi trời tối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 170000,
        unit = 'bộ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 06. ĐỐI TƯỢNG: Aptomat / CB / MCB (11 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'aptomat-cb-mcb';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Aptomat / CB / MCB', 'aptomat-cb-mcb', 'ShieldAlert', 'Các gói dịch vụ chuyên trách cho aptomat / cb / mcb', true, 6, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Aptomat / CB / MCB', icon = 'ShieldAlert', description = 'Các gói dịch vụ chuyên trách cho aptomat / cb / mcb', "sortOrder" = 6, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Kiểm tra aptomat nhảy liên tục
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra aptomat nhảy liên tục', 'kiem-tra-aptomat-nhay-lien-tuc', 'Kiểm tra aptomat nhảy liên tục chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra aptomat nhảy liên tục',
        description = 'Kiểm tra aptomat nhảy liên tục chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa lỗi mất điện do CB ngắt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa lỗi mất điện do CB ngắt', 'sua-loi-mat-dien-do-cb-ngat', 'Sửa lỗi mất điện do CB ngắt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'lần', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa lỗi mất điện do CB ngắt',
        description = 'Sửa lỗi mất điện do CB ngắt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'lần',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay aptomat hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay aptomat hỏng', 'thay-aptomat-hong', 'Thay aptomat hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'cái', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay aptomat hỏng',
        description = 'Thay aptomat hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'cái',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay MCB nhánh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay MCB nhánh', 'thay-mcb-nhanh', 'Thay MCB nhánh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'cái', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay MCB nhánh',
        description = 'Thay MCB nhánh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'cái',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay CB tổng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay CB tổng', 'thay-cb-tong', 'Thay CB tổng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'cái', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay CB tổng',
        description = 'Thay CB tổng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'cái',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt aptomat mới
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt aptomat mới', 'lap-dat-aptomat-moi', 'Lắp đặt aptomat mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'cái', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt aptomat mới',
        description = 'Lắp đặt aptomat mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'cái',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Nâng cấp CB đúng tải thiết kế
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Nâng cấp CB đúng tải thiết kế', 'nang-cap-cb-dung-tai-thiet-ke', 'Nâng cấp CB đúng tải thiết kế chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'cái', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Nâng cấp CB đúng tải thiết kế',
        description = 'Nâng cấp CB đúng tải thiết kế chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'cái',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra tiếp điểm CB phát nóng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra tiếp điểm CB phát nóng', 'kiem-tra-tiep-diem-cb-phat-nong', 'Kiểm tra tiếp điểm CB phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'lần', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra tiếp điểm CB phát nóng',
        description = 'Kiểm tra tiếp điểm CB phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'lần',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra CB không đóng được
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra CB không đóng được', 'kiem-tra-cb-khong-dong-duoc', 'Kiểm tra CB không đóng được chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'lần', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra CB không đóng được',
        description = 'Kiểm tra CB không đóng được chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'lần',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra hiện tượng quá tải / ngắn mạch
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra hiện tượng quá tải / ngắn mạch', 'kiem-tra-hien-tuong-qua-tai-ngan-mach', 'Kiểm tra hiện tượng quá tải / ngắn mạch chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'lần', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra hiện tượng quá tải / ngắn mạch',
        description = 'Kiểm tra hiện tượng quá tải / ngắn mạch chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'lần',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bảo dưỡng tủ CB
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bảo dưỡng tủ CB', 'bao-duong-tu-cb', 'Bảo dưỡng tủ CB chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'tủ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bảo dưỡng tủ CB',
        description = 'Bảo dưỡng tủ CB chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'tủ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 07. ĐỐI TƯỢNG: Thiết bị chống rò / Chống giật (9 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'chong-ro-chong-giat';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Thiết bị chống rò / Chống giật', 'chong-ro-chong-giat', 'ShieldCheck', 'Các gói dịch vụ chuyên trách cho thiết bị chống rò / chống giật', true, 7, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Thiết bị chống rò / Chống giật', icon = 'ShieldCheck', description = 'Các gói dịch vụ chuyên trách cho thiết bị chống rò / chống giật', "sortOrder" = 7, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Kiểm tra RCCB / RCBO nhảy liên tục
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra RCCB / RCBO nhảy liên tục', 'kiem-tra-rccb-rcbo-nhay-lien-tuc', 'Kiểm tra RCCB / RCBO nhảy liên tục chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'lần', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra RCCB / RCBO nhảy liên tục',
        description = 'Kiểm tra RCCB / RCBO nhảy liên tục chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'lần',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay RCCB / RCBO hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay RCCB / RCBO hỏng', 'thay-rccb-rcbo-hong', 'Thay RCCB / RCBO hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'cái', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay RCCB / RCBO hỏng',
        description = 'Thay RCCB / RCBO hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'cái',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp thiết bị chống rò điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp thiết bị chống rò điện', 'lap-thiet-bi-chong-ro-dien', 'Lắp thiết bị chống rò điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'cái', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp thiết bị chống rò điện',
        description = 'Lắp thiết bị chống rò điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'cái',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra chức năng nút TEST
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra chức năng nút TEST', 'kiem-tra-chuc-nang-nut-test', 'Kiểm tra chức năng nút TEST chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'lần', 25, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra chức năng nút TEST',
        description = 'Kiểm tra chức năng nút TEST chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'lần',
        "estimatedDurationMin" = 25,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra dòng rò hệ thống điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra dòng rò hệ thống điện', 'kiem-tra-dong-ro-he-thong-dien', 'Kiểm tra dòng rò hệ thống điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'lần', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra dòng rò hệ thống điện',
        description = 'Kiểm tra dòng rò hệ thống điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'lần',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Xác định nhánh điện bị rò
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Xác định nhánh điện bị rò', 'xac-dinh-nhanh-dien-bi-ro', 'Xác định nhánh điện bị rò chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'hệ thống', 75, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Xác định nhánh điện bị rò',
        description = 'Xác định nhánh điện bị rò chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 75,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra đấu nối trung tính và tiếp địa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra đấu nối trung tính và tiếp địa', 'kiem-tra-dau-noi-trung-tinh-va-tiep-dia', 'Kiểm tra đấu nối trung tính và tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra đấu nối trung tính và tiếp địa',
        description = 'Kiểm tra đấu nối trung tính và tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Nâng cấp bảo vệ chống rò phù hợp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Nâng cấp bảo vệ chống rò phù hợp', 'nang-cap-bao-ve-chong-ro-phu-hop', 'Nâng cấp bảo vệ chống rò phù hợp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'hệ thống', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Nâng cấp bảo vệ chống rò phù hợp',
        description = 'Nâng cấp bảo vệ chống rò phù hợp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra thiết bị chống giật không đóng được
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra thiết bị chống giật không đóng được', 'kiem-tra-thiet-bi-chong-giat-khong-dong-duoc', 'Kiểm tra thiết bị chống giật không đóng được chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'lần', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra thiết bị chống giật không đóng được',
        description = 'Kiểm tra thiết bị chống giật không đóng được chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'lần',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 08. ĐỐI TƯỢNG: Tủ điện / Bảng điện (12 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'tu-dien-bang-dien';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Tủ điện / Bảng điện', 'tu-dien-bang-dien', 'LayoutGrid', 'Các gói dịch vụ chuyên trách cho tủ điện / bảng điện', true, 8, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Tủ điện / Bảng điện', icon = 'LayoutGrid', description = 'Các gói dịch vụ chuyên trách cho tủ điện / bảng điện', "sortOrder" = 8, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Sửa tủ điện mất nguồn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa tủ điện mất nguồn', 'sua-tu-dien-mat-nguon', 'Sửa tủ điện mất nguồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'tủ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa tủ điện mất nguồn',
        description = 'Sửa tủ điện mất nguồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'tủ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bảng điện hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bảng điện hỏng', 'sua-bang-dien-hong', 'Sửa bảng điện hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bảng', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bảng điện hỏng',
        description = 'Sửa bảng điện hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bảng',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay vỏ tủ điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay vỏ tủ điện', 'thay-vo-tu-dien', 'Thay vỏ tủ điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'tủ', 75, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay vỏ tủ điện',
        description = 'Thay vỏ tủ điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'tủ',
        "estimatedDurationMin" = 75,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt tủ điện dân dụng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt tủ điện dân dụng', 'lap-dat-tu-dien-dan-dung', 'Lắp đặt tủ điện dân dụng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 350000, 'tủ', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt tủ điện dân dụng',
        description = 'Lắp đặt tủ điện dân dụng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 350000,
        unit = 'tủ',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt bảng điện mới
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt bảng điện mới', 'lap-dat-bang-dien-moi', 'Lắp đặt bảng điện mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bảng', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt bảng điện mới',
        description = 'Lắp đặt bảng điện mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bảng',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay thanh đấu nối / terminal
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay thanh đấu nối / terminal', 'thay-thanh-dau-noi-terminal', 'Thay thanh đấu nối / terminal chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'thanh', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay thanh đấu nối / terminal',
        description = 'Thay thanh đấu nối / terminal chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'thanh',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay dây dẫn hư hỏng trong tủ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay dây dẫn hư hỏng trong tủ', 'thay-day-dan-hu-hong-trong-tu', 'Thay dây dẫn hư hỏng trong tủ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'tủ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay dây dẫn hư hỏng trong tủ',
        description = 'Thay dây dẫn hư hỏng trong tủ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'tủ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sắp xếp lại dây điện trong tủ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sắp xếp lại dây điện trong tủ', 'sap-xep-lai-day-dien-trong-tu', 'Sắp xếp lại dây điện trong tủ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'tủ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sắp xếp lại dây điện trong tủ',
        description = 'Sắp xếp lại dây điện trong tủ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'tủ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Dán nhãn và phân chia nhánh điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Dán nhãn và phân chia nhánh điện', 'dan-nhan-va-phan-chia-nhanh-dien', 'Dán nhãn và phân chia nhánh điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'tủ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Dán nhãn và phân chia nhánh điện',
        description = 'Dán nhãn và phân chia nhánh điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'tủ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Xử lý tiếp điểm tủ điện phát nóng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Xử lý tiếp điểm tủ điện phát nóng', 'xu-ly-tiep-diem-tu-dien-phat-nong', 'Xử lý tiếp điểm tủ điện phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Xử lý tiếp điểm tủ điện phát nóng',
        description = 'Xử lý tiếp điểm tủ điện phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra / bảo trì tủ điện định kỳ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra / bảo trì tủ điện định kỳ', 'kiem-tra-bao-tri-tu-dien-dinh-ky', 'Kiểm tra / bảo trì tủ điện định kỳ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'tủ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra / bảo trì tủ điện định kỳ',
        description = 'Kiểm tra / bảo trì tủ điện định kỳ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'tủ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Nâng cấp tủ điện theo nhu cầu sử dụng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Nâng cấp tủ điện theo nhu cầu sử dụng', 'nang-cap-tu-dien-theo-nhu-cau-su-dung', 'Nâng cấp tủ điện theo nhu cầu sử dụng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 400000, 'tủ', 120, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Nâng cấp tủ điện theo nhu cầu sử dụng',
        description = 'Nâng cấp tủ điện theo nhu cầu sử dụng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 400000,
        unit = 'tủ',
        "estimatedDurationMin" = 120,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 09. ĐỐI TƯỢNG: Dây điện / Cáp điện (13 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'day-dien-cap-dien';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Dây điện / Cáp điện', 'day-dien-cap-dien', 'Cable', 'Các gói dịch vụ chuyên trách cho dây điện / cáp điện', true, 9, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Dây điện / Cáp điện', icon = 'Cable', description = 'Các gói dịch vụ chuyên trách cho dây điện / cáp điện', "sortOrder" = 9, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Kiểm tra dây điện bị đứt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra dây điện bị đứt', 'kiem-tra-day-dien-bi-dut', 'Kiểm tra dây điện bị đứt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'lần', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra dây điện bị đứt',
        description = 'Kiểm tra dây điện bị đứt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'lần',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Xử lý dây điện bị chập
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Xử lý dây điện bị chập', 'xu-ly-day-dien-bi-chap', 'Xử lý dây điện bị chập chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'điểm', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Xử lý dây điện bị chập',
        description = 'Xử lý dây điện bị chập chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'điểm',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay dây điện cũ / xuống cấp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay dây điện cũ / xuống cấp', 'thay-day-dien-cu-xuong-cap', 'Thay dây điện cũ / xuống cấp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'đoạn', 75, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay dây điện cũ / xuống cấp',
        description = 'Thay dây điện cũ / xuống cấp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'đoạn',
        "estimatedDurationMin" = 75,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay dây điện bị cháy
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay dây điện bị cháy', 'thay-day-dien-bi-chay', 'Thay dây điện bị cháy chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'đoạn', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay dây điện bị cháy',
        description = 'Thay dây điện bị cháy chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'đoạn',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa điểm nối dây bị lỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa điểm nối dây bị lỏng', 'sua-diem-noi-day-bi-long', 'Sửa điểm nối dây bị lỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'điểm', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa điểm nối dây bị lỏng',
        description = 'Sửa điểm nối dây bị lỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'điểm',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay cáp nguồn thiết bị
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay cáp nguồn thiết bị', 'thay-cap-nguon-thiet-bi', 'Thay cáp nguồn thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'sợi', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay cáp nguồn thiết bị',
        description = 'Thay cáp nguồn thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'sợi',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Đi dây điện nổi
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Đi dây điện nổi', 'di-day-dien-noi', 'Đi dây điện nổi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'mét', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Đi dây điện nổi',
        description = 'Đi dây điện nổi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'mét',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Đi dây điện âm tường
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Đi dây điện âm tường', 'di-day-dien-am-tuong', 'Đi dây điện âm tường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'mét', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Đi dây điện âm tường',
        description = 'Đi dây điện âm tường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'mét',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Đi dây trong ống luồn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Đi dây trong ống luồn', 'di-day-trong-ong-luon', 'Đi dây trong ống luồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'mét', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Đi dây trong ống luồn',
        description = 'Đi dây trong ống luồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'mét',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Đi dây trong máng cáp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Đi dây trong máng cáp', 'di-day-trong-mang-cap', 'Đi dây trong máng cáp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'mét', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Đi dây trong máng cáp',
        description = 'Đi dây trong máng cáp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'mét',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bổ sung đường dây cấp điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bổ sung đường dây cấp điện', 'bo-sung-duong-day-cap-dien', 'Bổ sung đường dây cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'đường', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bổ sung đường dây cấp điện',
        description = 'Bổ sung đường dây cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'đường',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra khả năng chịu tải của đường dây
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra khả năng chịu tải của đường dây', 'kiem-tra-kha-nang-chiu-tai-cua-duong-day', 'Kiểm tra khả năng chịu tải của đường dây chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'hệ thống', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra khả năng chịu tải của đường dây',
        description = 'Kiểm tra khả năng chịu tải của đường dây chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay dây điện hở / mất cách điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay dây điện hở / mất cách điện', 'thay-day-dien-ho-mat-cach-dien', 'Thay dây điện hở / mất cách điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'đoạn', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay dây điện hở / mất cách điện',
        description = 'Thay dây điện hở / mất cách điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'đoạn',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 10. ĐỐI TƯỢNG: Hộp nối điện / Hộp kỹ thuật (10 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'hop-noi-dien-ky-thuat';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Hộp nối điện / Hộp kỹ thuật', 'hop-noi-dien-ky-thuat', 'Box', 'Các gói dịch vụ chuyên trách cho hộp nối điện / hộp kỹ thuật', true, 10, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Hộp nối điện / Hộp kỹ thuật', icon = 'Box', description = 'Các gói dịch vụ chuyên trách cho hộp nối điện / hộp kỹ thuật', "sortOrder" = 10, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Sửa mối nối điện bị lỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa mối nối điện bị lỏng', 'sua-moi-noi-dien-bi-long', 'Sửa mối nối điện bị lỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 110000, 'hộp', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa mối nối điện bị lỏng',
        description = 'Sửa mối nối điện bị lỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 110000,
        unit = 'hộp',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa hộp nối bị chập
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa hộp nối bị chập', 'sua-hop-noi-bi-chap', 'Sửa hộp nối bị chập chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'hộp', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa hộp nối bị chập',
        description = 'Sửa hộp nối bị chập chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'hộp',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay hộp nối điện hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay hộp nối điện hỏng', 'thay-hop-noi-dien-hong', 'Thay hộp nối điện hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'hộp', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay hộp nối điện hỏng',
        description = 'Thay hộp nối điện hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'hộp',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay đầu nối / terminal
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay đầu nối / terminal', 'thay-dau-noi-terminal', 'Thay đầu nối / terminal chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay đầu nối / terminal',
        description = 'Thay đầu nối / terminal chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt hộp nối điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt hộp nối điện', 'lap-dat-hop-noi-dien', 'Lắp đặt hộp nối điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'hộp', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt hộp nối điện',
        description = 'Lắp đặt hộp nối điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'hộp',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp hộp kỹ thuật điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp hộp kỹ thuật điện', 'lap-hop-ky-thuat-dien', 'Lắp hộp kỹ thuật điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'hộp', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp hộp kỹ thuật điện',
        description = 'Lắp hộp kỹ thuật điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'hộp',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sắp xếp dây điện trong hộp nối
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sắp xếp dây điện trong hộp nối', 'sap-xep-day-dien-trong-hop-noi', 'Sắp xếp dây điện trong hộp nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'hộp', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sắp xếp dây điện trong hộp nối',
        description = 'Sắp xếp dây điện trong hộp nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'hộp',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Xử lý nước xâm nhập hộp nối
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Xử lý nước xâm nhập hộp nối', 'xu-ly-nuoc-xam-nhap-hop-noi', 'Xử lý nước xâm nhập hộp nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'hộp', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Xử lý nước xâm nhập hộp nối',
        description = 'Xử lý nước xâm nhập hộp nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'hộp',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra / thay nắp hộp nối
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra / thay nắp hộp nối', 'kiem-tra-thay-nap-hop-noi', 'Kiểm tra / thay nắp hộp nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 80000, 'cái', 25, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra / thay nắp hộp nối',
        description = 'Kiểm tra / thay nắp hộp nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 80000,
        unit = 'cái',
        "estimatedDurationMin" = 25,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra điểm nối phát nóng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra điểm nối phát nóng', 'kiem-tra-diem-noi-phat-nong', 'Kiểm tra điểm nối phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 110000, 'lần', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra điểm nối phát nóng',
        description = 'Kiểm tra điểm nối phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 110000,
        unit = 'lần',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 11. ĐỐI TƯỢNG: Hệ thống điện phòng / Khu vực (11 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'dien-phong-khu-vuc';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Hệ thống điện phòng / Khu vực', 'dien-phong-khu-vuc', 'Home', 'Các gói dịch vụ chuyên trách cho hệ thống điện phòng / khu vực', true, 11, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Hệ thống điện phòng / Khu vực', icon = 'Home', description = 'Các gói dịch vụ chuyên trách cho hệ thống điện phòng / khu vực', "sortOrder" = 11, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Sửa mất điện phòng ngủ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa mất điện phòng ngủ', 'sua-mat-dien-phong-ngu', 'Sửa mất điện phòng ngủ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'phòng', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa mất điện phòng ngủ',
        description = 'Sửa mất điện phòng ngủ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'phòng',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa mất điện phòng khách
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa mất điện phòng khách', 'sua-mat-dien-phong-khach', 'Sửa mất điện phòng khách chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'phòng', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa mất điện phòng khách',
        description = 'Sửa mất điện phòng khách chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'phòng',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa mất điện phòng bếp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa mất điện phòng bếp', 'sua-mat-dien-phong-bep', 'Sửa mất điện phòng bếp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'phòng', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa mất điện phòng bếp',
        description = 'Sửa mất điện phòng bếp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'phòng',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa mất điện phòng tắm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa mất điện phòng tắm', 'sua-mat-dien-phong-tam', 'Sửa mất điện phòng tắm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'phòng', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa mất điện phòng tắm',
        description = 'Sửa mất điện phòng tắm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'phòng',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa mất điện ban công
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa mất điện ban công', 'sua-mat-dien-ban-cong', 'Sửa mất điện ban công chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'khu vực', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa mất điện ban công',
        description = 'Sửa mất điện ban công chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'khu vực',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa mất điện sân vườn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa mất điện sân vườn', 'sua-mat-dien-san-vuon', 'Sửa mất điện sân vườn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'khu vực', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa mất điện sân vườn',
        description = 'Sửa mất điện sân vườn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'khu vực',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp thêm ổ cắm / công tắc trong phòng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp thêm ổ cắm / công tắc trong phòng', 'lap-them-o-cam-cong-tac-trong-phong', 'Lắp thêm ổ cắm / công tắc trong phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'điểm', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp thêm ổ cắm / công tắc trong phòng',
        description = 'Lắp thêm ổ cắm / công tắc trong phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'điểm',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bổ sung mạch điện cho khu vực
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bổ sung mạch điện cho khu vực', 'bo-sung-mach-dien-cho-khu-vuc', 'Bổ sung mạch điện cho khu vực chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'mạch', 75, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bổ sung mạch điện cho khu vực',
        description = 'Bổ sung mạch điện cho khu vực chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'mạch',
        "estimatedDurationMin" = 75,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra điện chập chờn một phòng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra điện chập chờn một phòng', 'kiem-tra-dien-chap-chon-mot-phong', 'Kiểm tra điện chập chờn một phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'phòng', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra điện chập chờn một phòng',
        description = 'Kiểm tra điện chập chờn một phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'phòng',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra quá tải điện khu vực
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra quá tải điện khu vực', 'kiem-tra-qua-tai-dien-khu-vuc', 'Kiểm tra quá tải điện khu vực chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'khu vực', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra quá tải điện khu vực',
        description = 'Kiểm tra quá tải điện khu vực chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'khu vực',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Nâng cấp hệ thống điện phòng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Nâng cấp hệ thống điện phòng', 'nang-cap-he-thong-dien-phong', 'Nâng cấp hệ thống điện phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 350000, 'phòng', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Nâng cấp hệ thống điện phòng',
        description = 'Nâng cấp hệ thống điện phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 350000,
        unit = 'phòng',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 12. ĐỐI TƯỢNG: Hệ thống điện toàn nhà (13 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'dien-toan-nha';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Hệ thống điện toàn nhà', 'dien-toan-nha', 'Building', 'Các gói dịch vụ chuyên trách cho hệ thống điện toàn nhà', true, 12, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Hệ thống điện toàn nhà', icon = 'Building', description = 'Các gói dịch vụ chuyên trách cho hệ thống điện toàn nhà', "sortOrder" = 12, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Kiểm tra mất điện toàn nhà
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra mất điện toàn nhà', 'kiem-tra-mat-dien-toan-nha', 'Kiểm tra mất điện toàn nhà chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'lần', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra mất điện toàn nhà',
        description = 'Kiểm tra mất điện toàn nhà chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'lần',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra điện chập chờn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra điện chập chờn', 'kiem-tra-dien-chap-chon', 'Kiểm tra điện chập chờn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'lần', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra điện chập chờn',
        description = 'Kiểm tra điện chập chờn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'lần',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra điện áp bất thường
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra điện áp bất thường', 'kiem-tra-dien-ap-bat-thuong', 'Kiểm tra điện áp bất thường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra điện áp bất thường',
        description = 'Kiểm tra điện áp bất thường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra hiện tượng sụt áp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra hiện tượng sụt áp', 'kiem-tra-hien-tuong-sut-ap', 'Kiểm tra hiện tượng sụt áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'lần', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra hiện tượng sụt áp',
        description = 'Kiểm tra hiện tượng sụt áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'lần',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra quá tải hệ thống điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra quá tải hệ thống điện', 'kiem-tra-qua-tai-he-thong-dien', 'Kiểm tra quá tải hệ thống điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'lần', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra quá tải hệ thống điện',
        description = 'Kiểm tra quá tải hệ thống điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'lần',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra rò điện toàn nhà
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra rò điện toàn nhà', 'kiem-tra-ro-dien-toan-nha', 'Kiểm tra rò điện toàn nhà chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 300000, 'lần', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra rò điện toàn nhà',
        description = 'Kiểm tra rò điện toàn nhà chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 300000,
        unit = 'lần',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra / xử lý sự cố chập điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra / xử lý sự cố chập điện', 'kiem-tra-xu-ly-su-co-chap-dien', 'Kiểm tra / xử lý sự cố chập điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 350000, 'lần', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra / xử lý sự cố chập điện',
        description = 'Kiểm tra / xử lý sự cố chập điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 350000,
        unit = 'lần',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra đường cấp nguồn chính
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra đường cấp nguồn chính', 'kiem-tra-duong-cap-nguon-chinh', 'Kiểm tra đường cấp nguồn chính chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'lần', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra đường cấp nguồn chính',
        description = 'Kiểm tra đường cấp nguồn chính chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'lần',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra các nhánh điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra các nhánh điện', 'kiem-tra-cac-nhanh-dien', 'Kiểm tra các nhánh điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'hệ thống', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra các nhánh điện',
        description = 'Kiểm tra các nhánh điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bảo trì hệ thống điện định kỳ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bảo trì hệ thống điện định kỳ', 'bao-tri-he-thong-dien-dinh-ky', 'Bảo trì hệ thống điện định kỳ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 450000, 'nhà', 120, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bảo trì hệ thống điện định kỳ',
        description = 'Bảo trì hệ thống điện định kỳ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 450000,
        unit = 'nhà',
        "estimatedDurationMin" = 120,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Cải tạo hệ thống điện nhà cũ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Cải tạo hệ thống điện nhà cũ', 'cai-tao-he-thong-dien-nha-cu', 'Cải tạo hệ thống điện nhà cũ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 800000, 'nhà', 240, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Cải tạo hệ thống điện nhà cũ',
        description = 'Cải tạo hệ thống điện nhà cũ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 800000,
        unit = 'nhà',
        "estimatedDurationMin" = 240,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt hệ thống điện nhà mới
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt hệ thống điện nhà mới', 'lap-dat-he-thong-dien-nha-moi', 'Lắp đặt hệ thống điện nhà mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 1200000, 'nhà', 360, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt hệ thống điện nhà mới',
        description = 'Lắp đặt hệ thống điện nhà mới chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 1200000,
        unit = 'nhà',
        "estimatedDurationMin" = 360,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra an toàn điện sau sửa chữa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra an toàn điện sau sửa chữa', 'kiem-tra-an-toan-dien-sau-sua-chua', 'Kiểm tra an toàn điện sau sửa chữa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra an toàn điện sau sửa chữa',
        description = 'Kiểm tra an toàn điện sau sửa chữa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 13. ĐỐI TƯỢNG: Quạt trần / Quạt treo tường (11 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'quat-tran-treo-tuong';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Quạt trần / Quạt treo tường', 'quat-tran-treo-tuong', 'Disc', 'Các gói dịch vụ chuyên trách cho quạt trần / quạt treo tường', true, 13, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Quạt trần / Quạt treo tường', icon = 'Disc', description = 'Các gói dịch vụ chuyên trách cho quạt trần / quạt treo tường', "sortOrder" = 13, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Lắp đặt quạt trần
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt quạt trần', 'lap-dat-quat-tran', 'Lắp đặt quạt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'cây', 75, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt quạt trần',
        description = 'Lắp đặt quạt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'cây',
        "estimatedDurationMin" = 75,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Tháo dỡ / di dời quạt trần
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Tháo dỡ / di dời quạt trần', 'thao-do-di-doi-quat-tran', 'Tháo dỡ / di dời quạt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'cây', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Tháo dỡ / di dời quạt trần',
        description = 'Tháo dỡ / di dời quạt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'cây',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt quạt treo tường
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt quạt treo tường', 'lap-dat-quat-treo-tuong', 'Lắp đặt quạt treo tường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'cái', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt quạt treo tường',
        description = 'Lắp đặt quạt treo tường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'cái',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa quạt không quay
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa quạt không quay', 'sua-quat-khong-quay', 'Sửa quạt không quay chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'cái', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa quạt không quay',
        description = 'Sửa quạt không quay chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'cái',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa quạt quay chậm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa quạt quay chậm', 'sua-quat-quay-cham', 'Sửa quạt quay chậm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'cái', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa quạt quay chậm',
        description = 'Sửa quạt quay chậm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'cái',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa quạt rung lắc / kêu to
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa quạt rung lắc / kêu to', 'sua-quat-rung-lac-keu-to', 'Sửa quạt rung lắc / kêu to chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'cái', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa quạt rung lắc / kêu to',
        description = 'Sửa quạt rung lắc / kêu to chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'cái',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bộ điều tốc quạt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bộ điều tốc quạt', 'sua-bo-dieu-toc-quat', 'Sửa bộ điều tốc quạt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bộ điều tốc quạt',
        description = 'Sửa bộ điều tốc quạt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay tụ điện quạt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay tụ điện quạt', 'thay-tu-dien-quat', 'Thay tụ điện quạt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'cái', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay tụ điện quạt',
        description = 'Thay tụ điện quạt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'cái',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa điều khiển quạt trần
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa điều khiển quạt trần', 'sua-dieu-khien-quat-tran', 'Sửa điều khiển quạt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa điều khiển quạt trần',
        description = 'Sửa điều khiển quạt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay công tắc quạt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay công tắc quạt', 'thay-cong-tac-quat', 'Thay công tắc quạt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'cái', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay công tắc quạt',
        description = 'Thay công tắc quạt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'cái',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bảo dưỡng quạt trần
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bảo dưỡng quạt trần', 'bao-duong-quat-tran', 'Bảo dưỡng quạt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'cây', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bảo dưỡng quạt trần',
        description = 'Bảo dưỡng quạt trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'cây',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 14. ĐỐI TƯỢNG: Quạt thông gió / Quạt hút (10 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'quat-thong-gio-hut';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Quạt thông gió / Quạt hút', 'quat-thong-gio-hut', 'Wind', 'Các gói dịch vụ chuyên trách cho quạt thông gió / quạt hút', true, 14, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Quạt thông gió / Quạt hút', icon = 'Wind', description = 'Các gói dịch vụ chuyên trách cho quạt thông gió / quạt hút', "sortOrder" = 14, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Lắp đặt quạt thông gió
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt quạt thông gió', 'lap-dat-quat-thong-gio', 'Lắp đặt quạt thông gió chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'cái', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt quạt thông gió',
        description = 'Lắp đặt quạt thông gió chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'cái',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp quạt hút nhà vệ sinh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp quạt hút nhà vệ sinh', 'lap-quat-hut-nha-ve-sinh', 'Lắp quạt hút nhà vệ sinh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'cái', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp quạt hút nhà vệ sinh',
        description = 'Lắp quạt hút nhà vệ sinh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'cái',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp quạt hút gắn tường / trần
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp quạt hút gắn tường / trần', 'lap-quat-hut-gan-tuong-tran', 'Lắp quạt hút gắn tường / trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'cái', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp quạt hút gắn tường / trần',
        description = 'Lắp quạt hút gắn tường / trần chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'cái',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa quạt thông gió không chạy
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa quạt thông gió không chạy', 'sua-quat-thong-gio-khong-chay', 'Sửa quạt thông gió không chạy chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'cái', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa quạt thông gió không chạy',
        description = 'Sửa quạt thông gió không chạy chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'cái',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa quạt hút yếu
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa quạt hút yếu', 'sua-quat-hut-yeu', 'Sửa quạt hút yếu chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 110000, 'cái', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa quạt hút yếu',
        description = 'Sửa quạt hút yếu chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 110000,
        unit = 'cái',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa quạt kêu to / rung
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa quạt kêu to / rung', 'sua-quat-keu-to-rung', 'Sửa quạt kêu to / rung chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'cái', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa quạt kêu to / rung',
        description = 'Sửa quạt kêu to / rung chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'cái',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay động cơ / tụ quạt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay động cơ / tụ quạt', 'thay-dong-co-tu-quat', 'Thay động cơ / tụ quạt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'cái', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay động cơ / tụ quạt',
        description = 'Thay động cơ / tụ quạt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'cái',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay công tắc / bộ điều khiển
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay công tắc / bộ điều khiển', 'thay-cong-tac-bo-dieu-khien', 'Thay công tắc / bộ điều khiển chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay công tắc / bộ điều khiển',
        description = 'Thay công tắc / bộ điều khiển chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Vệ sinh quạt thông gió
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Vệ sinh quạt thông gió', 've-sinh-quat-thong-gio', 'Vệ sinh quạt thông gió chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'cái', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Vệ sinh quạt thông gió',
        description = 'Vệ sinh quạt thông gió chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'cái',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Tháo dỡ / thay quạt hút
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Tháo dỡ / thay quạt hút', 'thao-do-thay-quat-hut', 'Tháo dỡ / thay quạt hút chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'cái', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Tháo dỡ / thay quạt hút',
        description = 'Tháo dỡ / thay quạt hút chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'cái',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 15. ĐỐI TƯỢNG: Chuông cửa / Nút nhấn chuông (10 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'chuong-cua-nut-nhan';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Chuông cửa / Nút nhấn chuông', 'chuong-cua-nut-nhan', 'Bell', 'Các gói dịch vụ chuyên trách cho chuông cửa / nút nhấn chuông', true, 15, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Chuông cửa / Nút nhấn chuông', icon = 'Bell', description = 'Các gói dịch vụ chuyên trách cho chuông cửa / nút nhấn chuông', "sortOrder" = 15, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Sửa chuông cửa không kêu
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa chuông cửa không kêu', 'sua-chuong-cua-khong-keu', 'Sửa chuông cửa không kêu chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa chuông cửa không kêu',
        description = 'Sửa chuông cửa không kêu chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa chuông cửa kêu liên tục
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa chuông cửa kêu liên tục', 'sua-chuong-cua-keu-lien-tuc', 'Sửa chuông cửa kêu liên tục chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 110000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa chuông cửa kêu liên tục',
        description = 'Sửa chuông cửa kêu liên tục chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 110000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay nút nhấn chuông
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay nút nhấn chuông', 'thay-nut-nhan-chuong', 'Thay nút nhấn chuông chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'cái', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay nút nhấn chuông',
        description = 'Thay nút nhấn chuông chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'cái',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay bộ chuông cửa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bộ chuông cửa', 'thay-bo-chuong-cua', 'Thay bộ chuông cửa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bộ chuông cửa',
        description = 'Thay bộ chuông cửa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp chuông cửa có dây
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp chuông cửa có dây', 'lap-chuong-cua-co-day', 'Lắp chuông cửa có dây chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp chuông cửa có dây',
        description = 'Lắp chuông cửa có dây chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp chuông cửa không dây
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp chuông cửa không dây', 'lap-chuong-cua-khong-day', 'Lắp chuông cửa không dây chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp chuông cửa không dây',
        description = 'Lắp chuông cửa không dây chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp chuông cửa màn hình
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp chuông cửa màn hình', 'lap-chuong-cua-man-hinh', 'Lắp chuông cửa màn hình chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'bộ', 75, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp chuông cửa màn hình',
        description = 'Lắp chuông cửa màn hình chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'bộ',
        "estimatedDurationMin" = 75,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp chuông cửa thông minh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp chuông cửa thông minh', 'lap-chuong-cua-thong-minh', 'Lắp chuông cửa thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'bộ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp chuông cửa thông minh',
        description = 'Lắp chuông cửa thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'bộ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bộ cấp nguồn chuông
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bộ cấp nguồn chuông', 'sua-bo-cap-nguon-chuong', 'Sửa bộ cấp nguồn chuông chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bộ cấp nguồn chuông',
        description = 'Sửa bộ cấp nguồn chuông chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra kết nối / tín hiệu chuông
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra kết nối / tín hiệu chuông', 'kiem-tra-ket-noi-tin-hieu-chuong', 'Kiểm tra kết nối / tín hiệu chuông chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'lần', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra kết nối / tín hiệu chuông',
        description = 'Kiểm tra kết nối / tín hiệu chuông chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'lần',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 16. ĐỐI TƯỢNG: Cảm biến / Thiết bị tự động (10 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'cam-bien-tu-dong';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Cảm biến / Thiết bị tự động', 'cam-bien-tu-dong', 'Radio', 'Các gói dịch vụ chuyên trách cho cảm biến / thiết bị tự động', true, 16, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Cảm biến / Thiết bị tự động', icon = 'Radio', description = 'Các gói dịch vụ chuyên trách cho cảm biến / thiết bị tự động', "sortOrder" = 16, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Lắp cảm biến chuyển động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp cảm biến chuyển động', 'lap-cam-bien-chuyen-dong', 'Lắp cảm biến chuyển động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp cảm biến chuyển động',
        description = 'Lắp cảm biến chuyển động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa cảm biến chuyển động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa cảm biến chuyển động', 'sua-cam-bien-chuyen-dong', 'Sửa cảm biến chuyển động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa cảm biến chuyển động',
        description = 'Sửa cảm biến chuyển động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp cảm biến ánh sáng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp cảm biến ánh sáng', 'lap-cam-bien-anh-sang', 'Lắp cảm biến ánh sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp cảm biến ánh sáng',
        description = 'Lắp cảm biến ánh sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa cảm biến ánh sáng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa cảm biến ánh sáng', 'sua-cam-bien-anh-sang', 'Sửa cảm biến ánh sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa cảm biến ánh sáng',
        description = 'Sửa cảm biến ánh sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp công tắc hẹn giờ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp công tắc hẹn giờ', 'lap-cong-tac-hen-gio', 'Lắp công tắc hẹn giờ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp công tắc hẹn giờ',
        description = 'Lắp công tắc hẹn giờ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa công tắc hẹn giờ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc hẹn giờ', 'sua-cong-tac-hen-gio', 'Sửa công tắc hẹn giờ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc hẹn giờ',
        description = 'Sửa công tắc hẹn giờ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp cảm biến hiện diện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp cảm biến hiện diện', 'lap-cam-bien-hien-dien', 'Lắp cảm biến hiện diện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp cảm biến hiện diện',
        description = 'Lắp cảm biến hiện diện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp bộ điều khiển đèn tự động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp bộ điều khiển đèn tự động', 'lap-bo-dieu-khien-den-tu-dong', 'Lắp bộ điều khiển đèn tự động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bộ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp bộ điều khiển đèn tự động',
        description = 'Lắp bộ điều khiển đèn tự động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bộ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bộ điều khiển tự động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bộ điều khiển tự động', 'sua-bo-dieu-khien-tu-dong', 'Sửa bộ điều khiển tự động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bộ điều khiển tự động',
        description = 'Sửa bộ điều khiển tự động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Cấu hình thiết bị điều khiển thông minh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Cấu hình thiết bị điều khiển thông minh', 'cau-hinh-thiet-bi-dieu-khien-thong-minh', 'Cấu hình thiết bị điều khiển thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'thiết bị', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Cấu hình thiết bị điều khiển thông minh',
        description = 'Cấu hình thiết bị điều khiển thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'thiết bị',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 17. ĐỐI TƯỢNG: Công tắc thông minh / Relay (10 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'cong-tac-relay-thong-minh';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Công tắc thông minh / Relay', 'cong-tac-relay-thong-minh', 'Cpu', 'Các gói dịch vụ chuyên trách cho công tắc thông minh / relay', true, 17, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Công tắc thông minh / Relay', icon = 'Cpu', description = 'Các gói dịch vụ chuyên trách cho công tắc thông minh / relay', "sortOrder" = 17, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Lắp công tắc thông minh Wi-Fi
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp công tắc thông minh Wi-Fi', 'lap-cong-tac-thong-minh-wi-fi', 'Lắp công tắc thông minh Wi-Fi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp công tắc thông minh Wi-Fi',
        description = 'Lắp công tắc thông minh Wi-Fi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp công tắc thông minh Zigbee
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp công tắc thông minh Zigbee', 'lap-cong-tac-thong-minh-zigbee', 'Lắp công tắc thông minh Zigbee chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bộ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp công tắc thông minh Zigbee',
        description = 'Lắp công tắc thông minh Zigbee chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bộ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay công tắc cơ bằng công tắc thông minh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay công tắc cơ bằng công tắc thông minh', 'thay-cong-tac-co-bang-cong-tac-thong-minh', 'Thay công tắc cơ bằng công tắc thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay công tắc cơ bằng công tắc thông minh',
        description = 'Thay công tắc cơ bằng công tắc thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa công tắc thông minh không hoạt động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc thông minh không hoạt động', 'sua-cong-tac-thong-minh-khong-hoat-dong', 'Sửa công tắc thông minh không hoạt động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc thông minh không hoạt động',
        description = 'Sửa công tắc thông minh không hoạt động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa công tắc thông minh mất kết nối
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc thông minh mất kết nối', 'sua-cong-tac-thong-minh-mat-ket-noi', 'Sửa công tắc thông minh mất kết nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc thông minh mất kết nối',
        description = 'Sửa công tắc thông minh mất kết nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp relay điều khiển điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp relay điều khiển điện', 'lap-relay-dieu-khien-dien', 'Lắp relay điều khiển điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp relay điều khiển điện',
        description = 'Lắp relay điều khiển điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa relay không đóng / ngắt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa relay không đóng / ngắt', 'sua-relay-khong-dong-ngat', 'Sửa relay không đóng / ngắt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa relay không đóng / ngắt',
        description = 'Sửa relay không đóng / ngắt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Cài đặt lịch bật / tắt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Cài đặt lịch bật / tắt', 'cai-dat-lich-bat-tat', 'Cài đặt lịch bật / tắt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'hệ thống', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Cài đặt lịch bật / tắt',
        description = 'Cài đặt lịch bật / tắt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Cấu hình điều khiển bằng ứng dụng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Cấu hình điều khiển bằng ứng dụng', 'cau-hinh-dieu-khien-bang-ung-dung', 'Cấu hình điều khiển bằng ứng dụng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'lần', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Cấu hình điều khiển bằng ứng dụng',
        description = 'Cấu hình điều khiển bằng ứng dụng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'lần',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra tương thích dây trung tính / tải
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra tương thích dây trung tính / tải', 'kiem-tra-tuong-thich-day-trung-tinh-tai', 'Kiểm tra tương thích dây trung tính / tải chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'lần', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra tương thích dây trung tính / tải',
        description = 'Kiểm tra tương thích dây trung tính / tải chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'lần',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 18. ĐỐI TƯỢNG: Ổ cắm thông minh / Bộ hẹn giờ (8 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'o-cam-thong-minh-hen-gio';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Ổ cắm thông minh / Bộ hẹn giờ', 'o-cam-thong-minh-hen-gio', 'Watch', 'Các gói dịch vụ chuyên trách cho ổ cắm thông minh / bộ hẹn giờ', true, 18, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Ổ cắm thông minh / Bộ hẹn giờ', icon = 'Watch', description = 'Các gói dịch vụ chuyên trách cho ổ cắm thông minh / bộ hẹn giờ', "sortOrder" = 18, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Lắp ổ cắm thông minh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp ổ cắm thông minh', 'lap-o-cam-thong-minh', 'Lắp ổ cắm thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp ổ cắm thông minh',
        description = 'Lắp ổ cắm thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa ổ cắm thông minh không cấp điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa ổ cắm thông minh không cấp điện', 'sua-o-cam-thong-minh-khong-cap-dien', 'Sửa ổ cắm thông minh không cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa ổ cắm thông minh không cấp điện',
        description = 'Sửa ổ cắm thông minh không cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa ổ cắm thông minh mất kết nối
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa ổ cắm thông minh mất kết nối', 'sua-o-cam-thong-minh-mat-ket-noi', 'Sửa ổ cắm thông minh mất kết nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa ổ cắm thông minh mất kết nối',
        description = 'Sửa ổ cắm thông minh mất kết nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp ổ cắm hẹn giờ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp ổ cắm hẹn giờ', 'lap-o-cam-hen-gio', 'Lắp ổ cắm hẹn giờ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp ổ cắm hẹn giờ',
        description = 'Lắp ổ cắm hẹn giờ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bộ hẹn giờ điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bộ hẹn giờ điện', 'sua-bo-hen-gio-dien', 'Sửa bộ hẹn giờ điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bộ hẹn giờ điện',
        description = 'Sửa bộ hẹn giờ điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Cấu hình lịch bật / tắt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Cấu hình lịch bật / tắt', 'cau-hinh-lich-bat-tat', 'Cấu hình lịch bật / tắt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'thiết bị', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Cấu hình lịch bật / tắt',
        description = 'Cấu hình lịch bật / tắt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'thiết bị',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay ổ cắm thông minh hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay ổ cắm thông minh hỏng', 'thay-o-cam-thong-minh-hong', 'Thay ổ cắm thông minh hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay ổ cắm thông minh hỏng',
        description = 'Thay ổ cắm thông minh hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra quá tải ổ cắm thông minh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra quá tải ổ cắm thông minh', 'kiem-tra-qua-tai-o-cam-thong-minh', 'Kiểm tra quá tải ổ cắm thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 110000, 'lần', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra quá tải ổ cắm thông minh',
        description = 'Kiểm tra quá tải ổ cắm thông minh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 110000,
        unit = 'lần',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 19. ĐỐI TƯỢNG: Nguồn điện / Adapter (9 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'nguon-dien-adapter';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Nguồn điện / Adapter', 'nguon-dien-adapter', 'Plug', 'Các gói dịch vụ chuyên trách cho nguồn điện / adapter', true, 19, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Nguồn điện / Adapter', icon = 'Plug', description = 'Các gói dịch vụ chuyên trách cho nguồn điện / adapter', "sortOrder" = 19, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Kiểm tra adapter không ra điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra adapter không ra điện', 'kiem-tra-adapter-khong-ra-dien', 'Kiểm tra adapter không ra điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 90000, 'cái', 25, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra adapter không ra điện',
        description = 'Kiểm tra adapter không ra điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 90000,
        unit = 'cái',
        "estimatedDurationMin" = 25,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay adapter hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay adapter hỏng', 'thay-adapter-hong', 'Thay adapter hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 110000, 'cái', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay adapter hỏng',
        description = 'Thay adapter hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 110000,
        unit = 'cái',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra bộ nguồn DC
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra bộ nguồn DC', 'kiem-tra-bo-nguon-dc', 'Kiểm tra bộ nguồn DC chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra bộ nguồn DC',
        description = 'Kiểm tra bộ nguồn DC chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay bộ nguồn LED
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bộ nguồn LED', 'thay-bo-nguon-led', 'Thay bộ nguồn LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bộ nguồn LED',
        description = 'Thay bộ nguồn LED chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bộ nguồn không cấp điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bộ nguồn không cấp điện', 'sua-bo-nguon-khong-cap-dien', 'Sửa bộ nguồn không cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bộ nguồn không cấp điện',
        description = 'Sửa bộ nguồn không cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra dây / đầu cắm nguồn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra dây / đầu cắm nguồn', 'kiem-tra-day-dau-cam-nguon', 'Kiểm tra dây / đầu cắm nguồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 80000, 'dây', 25, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra dây / đầu cắm nguồn',
        description = 'Kiểm tra dây / đầu cắm nguồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 80000,
        unit = 'dây',
        "estimatedDurationMin" = 25,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay bộ chuyển đổi điện áp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bộ chuyển đổi điện áp', 'thay-bo-chuyen-doi-dien-ap', 'Thay bộ chuyển đổi điện áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bộ chuyển đổi điện áp',
        description = 'Thay bộ chuyển đổi điện áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt bộ nguồn phù hợp thiết bị
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt bộ nguồn phù hợp thiết bị', 'lap-dat-bo-nguon-phu-hop-thiet-bi', 'Lắp đặt bộ nguồn phù hợp thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt bộ nguồn phù hợp thiết bị',
        description = 'Lắp đặt bộ nguồn phù hợp thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra nguồn phát nóng bất thường
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra nguồn phát nóng bất thường', 'kiem-tra-nguon-phat-nong-bat-thuong', 'Kiểm tra nguồn phát nóng bất thường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 110000, 'lần', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra nguồn phát nóng bất thường',
        description = 'Kiểm tra nguồn phát nóng bất thường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 110000,
        unit = 'lần',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 20. ĐỐI TƯỢNG: Ổn áp / UPS / Bộ lưu điện (10 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'on-ap-ups-luu-dien';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Ổn áp / UPS / Bộ lưu điện', 'on-ap-ups-luu-dien', 'BatteryCharging', 'Các gói dịch vụ chuyên trách cho ổn áp / ups / bộ lưu điện', true, 20, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Ổn áp / UPS / Bộ lưu điện', icon = 'BatteryCharging', description = 'Các gói dịch vụ chuyên trách cho ổn áp / ups / bộ lưu điện', "sortOrder" = 20, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Kiểm tra ổn áp không hoạt động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra ổn áp không hoạt động', 'kiem-tra-on-ap-khong-hoat-dong', 'Kiểm tra ổn áp không hoạt động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'máy', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra ổn áp không hoạt động',
        description = 'Kiểm tra ổn áp không hoạt động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'máy',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra ổn áp không ổn định điện áp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra ổn áp không ổn định điện áp', 'kiem-tra-on-ap-khong-on-dinh-dien-ap', 'Kiểm tra ổn áp không ổn định điện áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'máy', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra ổn áp không ổn định điện áp',
        description = 'Kiểm tra ổn áp không ổn định điện áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'máy',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt ổn áp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt ổn áp', 'lap-dat-on-ap', 'Lắp đặt ổn áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'máy', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt ổn áp',
        description = 'Lắp đặt ổn áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'máy',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra UPS không cấp điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra UPS không cấp điện', 'kiem-tra-ups-khong-cap-dien', 'Kiểm tra UPS không cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra UPS không cấp điện',
        description = 'Kiểm tra UPS không cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay ắc quy UPS
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay ắc quy UPS', 'thay-ac-quy-ups', 'Thay ắc quy UPS chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bình', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay ắc quy UPS',
        description = 'Thay ắc quy UPS chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bình',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra UPS không sạc
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra UPS không sạc', 'kiem-tra-ups-khong-sac', 'Kiểm tra UPS không sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra UPS không sạc',
        description = 'Kiểm tra UPS không sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra UPS báo lỗi
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra UPS báo lỗi', 'kiem-tra-ups-bao-loi', 'Kiểm tra UPS báo lỗi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra UPS báo lỗi',
        description = 'Kiểm tra UPS báo lỗi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt bộ lưu điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt bộ lưu điện', 'lap-dat-bo-luu-dien', 'Lắp đặt bộ lưu điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'bộ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt bộ lưu điện',
        description = 'Lắp đặt bộ lưu điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'bộ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bảo dưỡng UPS / ổn áp
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bảo dưỡng UPS / ổn áp', 'bao-duong-ups-on-ap', 'Bảo dưỡng UPS / ổn áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'máy', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bảo dưỡng UPS / ổn áp',
        description = 'Bảo dưỡng UPS / ổn áp chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'máy',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra khả năng cấp điện dự phòng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra khả năng cấp điện dự phòng', 'kiem-tra-kha-nang-cap-dien-du-phong', 'Kiểm tra khả năng cấp điện dự phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra khả năng cấp điện dự phòng',
        description = 'Kiểm tra khả năng cấp điện dự phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 21. ĐỐI TƯỢNG: Hệ thống tiếp địa / Chống sét (10 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'tiep-dia-chong-set';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Hệ thống tiếp địa / Chống sét', 'tiep-dia-chong-set', 'ZapOff', 'Các gói dịch vụ chuyên trách cho hệ thống tiếp địa / chống sét', true, 21, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Hệ thống tiếp địa / Chống sét', icon = 'ZapOff', description = 'Các gói dịch vụ chuyên trách cho hệ thống tiếp địa / chống sét', "sortOrder" = 21, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Kiểm tra hệ thống tiếp địa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra hệ thống tiếp địa', 'kiem-tra-he-thong-tiep-dia', 'Kiểm tra hệ thống tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'hệ thống', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra hệ thống tiếp địa',
        description = 'Kiểm tra hệ thống tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Đo điện trở tiếp địa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Đo điện trở tiếp địa', 'do-dien-tro-tiep-dia', 'Đo điện trở tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 300000, 'lần', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Đo điện trở tiếp địa',
        description = 'Đo điện trở tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 300000,
        unit = 'lần',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra dây tiếp địa bị đứt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra dây tiếp địa bị đứt', 'kiem-tra-day-tiep-dia-bi-dut', 'Kiểm tra dây tiếp địa bị đứt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'đoạn', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra dây tiếp địa bị đứt',
        description = 'Kiểm tra dây tiếp địa bị đứt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'đoạn',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bổ sung dây tiếp địa cho ổ cắm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bổ sung dây tiếp địa cho ổ cắm', 'bo-sung-day-tiep-dia-cho-o-cam', 'Bổ sung dây tiếp địa cho ổ cắm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'điểm', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bổ sung dây tiếp địa cho ổ cắm',
        description = 'Bổ sung dây tiếp địa cho ổ cắm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'điểm',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa mối nối tiếp địa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa mối nối tiếp địa', 'sua-moi-noi-tiep-dia', 'Sửa mối nối tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'mối', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa mối nối tiếp địa',
        description = 'Sửa mối nối tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'mối',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt hệ thống tiếp địa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt hệ thống tiếp địa', 'lap-dat-he-thong-tiep-dia', 'Lắp đặt hệ thống tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 600000, 'hệ thống', 180, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt hệ thống tiếp địa',
        description = 'Lắp đặt hệ thống tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 600000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 180,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra thiết bị chống sét lan truyền SPD
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra thiết bị chống sét lan truyền SPD', 'kiem-tra-thiet-bi-chong-set-lan-truyen-spd', 'Kiểm tra thiết bị chống sét lan truyền SPD chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra thiết bị chống sét lan truyền SPD',
        description = 'Kiểm tra thiết bị chống sét lan truyền SPD chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay SPD hỏng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay SPD hỏng', 'thay-spd-hong', 'Thay SPD hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'bộ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay SPD hỏng',
        description = 'Thay SPD hỏng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'bộ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra / bảo trì hệ thống chống sét
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra / bảo trì hệ thống chống sét', 'kiem-tra-bao-tri-he-thong-chong-set', 'Kiểm tra / bảo trì hệ thống chống sét chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 350000, 'hệ thống', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra / bảo trì hệ thống chống sét',
        description = 'Kiểm tra / bảo trì hệ thống chống sét chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 350000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra liên kết đẳng thế
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra liên kết đẳng thế', 'kiem-tra-lien-ket-dang-the', 'Kiểm tra liên kết đẳng thế chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'lần', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra liên kết đẳng thế',
        description = 'Kiểm tra liên kết đẳng thế chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'lần',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 22. ĐỐI TƯỢNG: Đèn sự cố / Đèn thoát hiểm (8 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'den-su-co-exit';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Đèn sự cố / Đèn thoát hiểm', 'den-su-co-exit', 'AlertOctagon', 'Các gói dịch vụ chuyên trách cho đèn sự cố / đèn thoát hiểm', true, 22, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Đèn sự cố / Đèn thoát hiểm', icon = 'AlertOctagon', description = 'Các gói dịch vụ chuyên trách cho đèn sự cố / đèn thoát hiểm', "sortOrder" = 22, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Lắp đặt đèn sự cố
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt đèn sự cố', 'lap-dat-den-su-co', 'Lắp đặt đèn sự cố chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt đèn sự cố',
        description = 'Lắp đặt đèn sự cố chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đèn EXIT
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đèn EXIT', 'lap-den-exit', 'Lắp đèn EXIT chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đèn EXIT',
        description = 'Lắp đèn EXIT chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn sự cố không sáng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn sự cố không sáng', 'sua-den-su-co-khong-sang', 'Sửa đèn sự cố không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn sự cố không sáng',
        description = 'Sửa đèn sự cố không sáng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa đèn không sạc pin
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa đèn không sạc pin', 'sua-den-khong-sac-pin', 'Sửa đèn không sạc pin chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 110000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa đèn không sạc pin',
        description = 'Sửa đèn không sạc pin chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 110000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay pin đèn sự cố
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay pin đèn sự cố', 'thay-pin-den-su-co', 'Thay pin đèn sự cố chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'bộ', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay pin đèn sự cố',
        description = 'Thay pin đèn sự cố chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'bộ',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay bộ nguồn đèn EXIT
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bộ nguồn đèn EXIT', 'thay-bo-nguon-den-exit', 'Thay bộ nguồn đèn EXIT chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bộ nguồn đèn EXIT',
        description = 'Thay bộ nguồn đèn EXIT chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra chức năng chiếu sáng dự phòng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra chức năng chiếu sáng dự phòng', 'kiem-tra-chuc-nang-chieu-sang-du-phong', 'Kiểm tra chức năng chiếu sáng dự phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'lần', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra chức năng chiếu sáng dự phòng',
        description = 'Kiểm tra chức năng chiếu sáng dự phòng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'lần',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bảo dưỡng đèn sự cố định kỳ
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bảo dưỡng đèn sự cố định kỳ', 'bao-duong-den-su-co-dinh-ky', 'Bảo dưỡng đèn sự cố định kỳ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'hệ thống', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bảo dưỡng đèn sự cố định kỳ',
        description = 'Bảo dưỡng đèn sự cố định kỳ chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 23. ĐỐI TƯỢNG: Điện cửa cuốn / Cổng tự động (9 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'dien-cua-cuon-cong-tu-dong';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Điện cửa cuốn / Cổng tự động', 'dien-cua-cuon-cong-tu-dong', 'Sliders', 'Các gói dịch vụ chuyên trách cho điện cửa cuốn / cổng tự động', true, 23, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Điện cửa cuốn / Cổng tự động', icon = 'Sliders', description = 'Các gói dịch vụ chuyên trách cho điện cửa cuốn / cổng tự động', "sortOrder" = 23, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Kiểm tra cửa cuốn mất nguồn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra cửa cuốn mất nguồn', 'kiem-tra-cua-cuon-mat-nguon', 'Kiểm tra cửa cuốn mất nguồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'cửa', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra cửa cuốn mất nguồn',
        description = 'Kiểm tra cửa cuốn mất nguồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'cửa',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa nút nhấn điều khiển cửa cuốn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa nút nhấn điều khiển cửa cuốn', 'sua-nut-nhan-dieu-khien-cua-cuon', 'Sửa nút nhấn điều khiển cửa cuốn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'bộ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa nút nhấn điều khiển cửa cuốn',
        description = 'Sửa nút nhấn điều khiển cửa cuốn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'bộ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bộ nhận tín hiệu điều khiển
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bộ nhận tín hiệu điều khiển', 'sua-bo-nhan-tin-hieu-dieu-khien', 'Sửa bộ nhận tín hiệu điều khiển chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'hộp', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bộ nhận tín hiệu điều khiển',
        description = 'Sửa bộ nhận tín hiệu điều khiển chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'hộp',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay bộ nguồn điều khiển
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay bộ nguồn điều khiển', 'thay-bo-nguon-dieu-khien', 'Thay bộ nguồn điều khiển chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay bộ nguồn điều khiển',
        description = 'Thay bộ nguồn điều khiển chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra motor không hoạt động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra motor không hoạt động', 'kiem-tra-motor-khong-hoat-dong', 'Kiểm tra motor không hoạt động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'motor', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra motor không hoạt động',
        description = 'Kiểm tra motor không hoạt động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'motor',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa công tắc hành trình
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc hành trình', 'sua-cong-tac-hanh-trinh', 'Sửa công tắc hành trình chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc hành trình',
        description = 'Sửa công tắc hành trình chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra cổng tự động không đóng / mở
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra cổng tự động không đóng / mở', 'kiem-tra-cong-tu-dong-khong-dong-mo', 'Kiểm tra cổng tự động không đóng / mở chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'cổng', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra cổng tự động không đóng / mở',
        description = 'Kiểm tra cổng tự động không đóng / mở chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'cổng',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra cảm biến an toàn cửa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra cảm biến an toàn cửa', 'kiem-tra-cam-bien-an-toan-cua', 'Kiểm tra cảm biến an toàn cửa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra cảm biến an toàn cửa',
        description = 'Kiểm tra cảm biến an toàn cửa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bảo dưỡng phần điện cửa cuốn / cổng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bảo dưỡng phần điện cửa cuốn / cổng', 'bao-duong-phan-dien-cua-cuon-cong', 'Bảo dưỡng phần điện cửa cuốn / cổng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'cửa', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bảo dưỡng phần điện cửa cuốn / cổng',
        description = 'Bảo dưỡng phần điện cửa cuốn / cổng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'cửa',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 24. ĐỐI TƯỢNG: Máy bơm nước – Phần điện (9 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'may-bom-nuoc-phan-dien';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Máy bơm nước – Phần điện', 'may-bom-nuoc-phan-dien', 'Gauge', 'Các gói dịch vụ chuyên trách cho máy bơm nước – phần điện', true, 24, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Máy bơm nước – Phần điện', icon = 'Gauge', description = 'Các gói dịch vụ chuyên trách cho máy bơm nước – phần điện', "sortOrder" = 24, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Sửa máy bơm không lên nguồn
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa máy bơm không lên nguồn', 'sua-may-bom-khong-len-nguon', 'Sửa máy bơm không lên nguồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'máy', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa máy bơm không lên nguồn',
        description = 'Sửa máy bơm không lên nguồn chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'máy',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bơm không khởi động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bơm không khởi động', 'sua-bom-khong-khoi-dong', 'Sửa bơm không khởi động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'máy', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bơm không khởi động',
        description = 'Sửa bơm không khởi động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'máy',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa công tắc áp suất
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa công tắc áp suất', 'sua-cong-tac-ap-suat', 'Sửa công tắc áp suất chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'cái', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa công tắc áp suất',
        description = 'Sửa công tắc áp suất chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'cái',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay tụ khởi động máy bơm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay tụ khởi động máy bơm', 'thay-tu-khoi-dong-may-bom', 'Thay tụ khởi động máy bơm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 140000, 'tụ', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay tụ khởi động máy bơm',
        description = 'Thay tụ khởi động máy bơm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 140000,
        unit = 'tụ',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra động cơ bơm quá nhiệt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra động cơ bơm quá nhiệt', 'kiem-tra-dong-co-bom-qua-nhiet', 'Kiểm tra động cơ bơm quá nhiệt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'máy', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra động cơ bơm quá nhiệt',
        description = 'Kiểm tra động cơ bơm quá nhiệt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'máy',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa phao điện máy bơm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa phao điện máy bơm', 'sua-phao-dien-may-bom', 'Sửa phao điện máy bơm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa phao điện máy bơm',
        description = 'Sửa phao điện máy bơm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Sửa bộ điều khiển bơm tự động
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Sửa bộ điều khiển bơm tự động', 'sua-bo-dieu-khien-bom-tu-dong', 'Sửa bộ điều khiển bơm tự động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Sửa bộ điều khiển bơm tự động',
        description = 'Sửa bộ điều khiển bơm tự động chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp mạch bảo vệ máy bơm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp mạch bảo vệ máy bơm', 'lap-mach-bao-ve-may-bom', 'Lắp mạch bảo vệ máy bơm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'mạch', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp mạch bảo vệ máy bơm',
        description = 'Lắp mạch bảo vệ máy bơm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'mạch',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra hệ thống dây điện cấp cho bơm
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra hệ thống dây điện cấp cho bơm', 'kiem-tra-he-thong-day-dien-cap-cho-bom', 'Kiểm tra hệ thống dây điện cấp cho bơm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'đường', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra hệ thống dây điện cấp cho bơm',
        description = 'Kiểm tra hệ thống dây điện cấp cho bơm chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'đường',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 25. ĐỐI TƯỢNG: Bộ cấp nguồn thiết bị cố định (9 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'cap-nguon-thiet-bi-co-dinh';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Bộ cấp nguồn thiết bị cố định', 'cap-nguon-thiet-bi-co-dinh', 'PowerSquare', 'Các gói dịch vụ chuyên trách cho bộ cấp nguồn thiết bị cố định', true, 25, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Bộ cấp nguồn thiết bị cố định', icon = 'PowerSquare', description = 'Các gói dịch vụ chuyên trách cho bộ cấp nguồn thiết bị cố định', "sortOrder" = 25, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Lắp đường cấp điện riêng cho máy lạnh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đường cấp điện riêng cho máy lạnh', 'lap-duong-cap-dien-rieng-cho-may-lanh', 'Lắp đường cấp điện riêng cho máy lạnh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'đường', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đường cấp điện riêng cho máy lạnh',
        description = 'Lắp đường cấp điện riêng cho máy lạnh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'đường',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đường cấp điện riêng cho bình nóng lạnh
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đường cấp điện riêng cho bình nóng lạnh', 'lap-duong-cap-dien-rieng-cho-binh-nong-lanh', 'Lắp đường cấp điện riêng cho bình nóng lạnh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'đường', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đường cấp điện riêng cho bình nóng lạnh',
        description = 'Lắp đường cấp điện riêng cho bình nóng lạnh chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'đường',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đường cấp điện riêng cho bếp điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đường cấp điện riêng cho bếp điện', 'lap-duong-cap-dien-rieng-cho-bep-dien', 'Lắp đường cấp điện riêng cho bếp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'đường', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đường cấp điện riêng cho bếp điện',
        description = 'Lắp đường cấp điện riêng cho bếp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'đường',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đường cấp điện riêng cho máy giặt
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đường cấp điện riêng cho máy giặt', 'lap-duong-cap-dien-rieng-cho-may-giat', 'Lắp đường cấp điện riêng cho máy giặt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'đường', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đường cấp điện riêng cho máy giặt',
        description = 'Lắp đường cấp điện riêng cho máy giặt chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'đường',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp bộ ngắt điện cô lập thiết bị
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp bộ ngắt điện cô lập thiết bị', 'lap-bo-ngat-dien-co-lap-thiet-bi', 'Lắp bộ ngắt điện cô lập thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'bộ', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp bộ ngắt điện cô lập thiết bị',
        description = 'Lắp bộ ngắt điện cô lập thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'bộ',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Thay dây cấp nguồn cố định
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Thay dây cấp nguồn cố định', 'thay-day-cap-nguon-co-dinh', 'Thay dây cấp nguồn cố định chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'đoạn', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Thay dây cấp nguồn cố định',
        description = 'Thay dây cấp nguồn cố định chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'đoạn',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra tiếp điểm cấp nguồn phát nóng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra tiếp điểm cấp nguồn phát nóng', 'kiem-tra-tiep-diem-cap-nguon-phat-nong', 'Kiểm tra tiếp điểm cấp nguồn phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 130000, 'lần', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra tiếp điểm cấp nguồn phát nóng',
        description = 'Kiểm tra tiếp điểm cấp nguồn phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 130000,
        unit = 'lần',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra bảo vệ quá tải nhánh thiết bị
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra bảo vệ quá tải nhánh thiết bị', 'kiem-tra-bao-ve-qua-tai-nhanh-thiet-bi', 'Kiểm tra bảo vệ quá tải nhánh thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'nhánh', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra bảo vệ quá tải nhánh thiết bị',
        description = 'Kiểm tra bảo vệ quá tải nhánh thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'nhánh',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra điện áp cấp cho thiết bị
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra điện áp cấp cho thiết bị', 'kiem-tra-dien-ap-cap-cho-thiet-bi', 'Kiểm tra điện áp cấp cho thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'lần', 30, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra điện áp cấp cho thiết bị',
        description = 'Kiểm tra điện áp cấp cho thiết bị chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'lần',
        "estimatedDurationMin" = 30,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 26. ĐỐI TƯỢNG: Điện mặt trời / Inverter (9 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'dien-mat-troi-inverter';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Điện mặt trời / Inverter', 'dien-mat-troi-inverter', 'Sun', 'Các gói dịch vụ chuyên trách cho điện mặt trời / inverter', true, 26, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Điện mặt trời / Inverter', icon = 'Sun', description = 'Các gói dịch vụ chuyên trách cho điện mặt trời / inverter', "sortOrder" = 26, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Kiểm tra inverter báo lỗi
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra inverter báo lỗi', 'kiem-tra-inverter-bao-loi', 'Kiểm tra inverter báo lỗi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 300000, 'máy', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra inverter báo lỗi',
        description = 'Kiểm tra inverter báo lỗi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 300000,
        unit = 'máy',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra inverter không phát điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra inverter không phát điện', 'kiem-tra-inverter-khong-phat-dien', 'Kiểm tra inverter không phát điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 350000, 'máy', 75, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra inverter không phát điện',
        description = 'Kiểm tra inverter không phát điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 350000,
        unit = 'máy',
        "estimatedDurationMin" = 75,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra thiết bị đóng cắt phía AC
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra thiết bị đóng cắt phía AC', 'kiem-tra-thiet-bi-dong-cat-phia-ac', 'Kiểm tra thiết bị đóng cắt phía AC chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 220000, 'tủ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra thiết bị đóng cắt phía AC',
        description = 'Kiểm tra thiết bị đóng cắt phía AC chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 220000,
        unit = 'tủ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra thiết bị bảo vệ phía DC
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra thiết bị bảo vệ phía DC', 'kiem-tra-thiet-bi-bao-ve-phia-dc', 'Kiểm tra thiết bị bảo vệ phía DC chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'tủ', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra thiết bị bảo vệ phía DC',
        description = 'Kiểm tra thiết bị bảo vệ phía DC chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'tủ',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra hệ thống giám sát mất kết nối
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra hệ thống giám sát mất kết nối', 'kiem-tra-he-thong-giam-sat-mat-ket-noi', 'Kiểm tra hệ thống giám sát mất kết nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'hệ thống', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra hệ thống giám sát mất kết nối',
        description = 'Kiểm tra hệ thống giám sát mất kết nối chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra dây dẫn / đầu nối hệ thống
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra dây dẫn / đầu nối hệ thống', 'kiem-tra-day-dan-dau-noi-he-thong', 'Kiểm tra dây dẫn / đầu nối hệ thống chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'hệ thống', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra dây dẫn / đầu nối hệ thống',
        description = 'Kiểm tra dây dẫn / đầu nối hệ thống chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bảo dưỡng phần điện hệ thống
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bảo dưỡng phần điện hệ thống', 'bao-duong-phan-dien-he-thong', 'Bảo dưỡng phần điện hệ thống chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 400000, 'hệ thống', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bảo dưỡng phần điện hệ thống',
        description = 'Bảo dưỡng phần điện hệ thống chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 400000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra hệ thống tiếp địa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra hệ thống tiếp địa', 'kiem-tra-he-thong-tiep-dia', 'Kiểm tra hệ thống tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'hệ thống', 50, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra hệ thống tiếp địa',
        description = 'Kiểm tra hệ thống tiếp địa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 50,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra tủ điện năng lượng mặt trời
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra tủ điện năng lượng mặt trời', 'kiem-tra-tu-dien-nang-luong-mat-troi', 'Kiểm tra tủ điện năng lượng mặt trời chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 300000, 'tủ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra tủ điện năng lượng mặt trời',
        description = 'Kiểm tra tủ điện năng lượng mặt trời chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 300000,
        unit = 'tủ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 27. ĐỐI TƯỢNG: Bộ sạc xe điện / Ổ cắm sạc (9 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'bo-sac-xe-dien';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Bộ sạc xe điện / Ổ cắm sạc', 'bo-sac-xe-dien', 'Car', 'Các gói dịch vụ chuyên trách cho bộ sạc xe điện / ổ cắm sạc', true, 27, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Bộ sạc xe điện / Ổ cắm sạc', icon = 'Car', description = 'Các gói dịch vụ chuyên trách cho bộ sạc xe điện / ổ cắm sạc', "sortOrder" = 27, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Khảo sát vị trí lắp bộ sạc xe điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Khảo sát vị trí lắp bộ sạc xe điện', 'khao-sat-vi-tri-lap-bo-sac-xe-dien', 'Khảo sát vị trí lắp bộ sạc xe điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Khảo sát vị trí lắp bộ sạc xe điện',
        description = 'Khảo sát vị trí lắp bộ sạc xe điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt mạch cấp nguồn riêng cho bộ sạc
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt mạch cấp nguồn riêng cho bộ sạc', 'lap-dat-mach-cap-nguon-rieng-cho-bo-sac', 'Lắp đặt mạch cấp nguồn riêng cho bộ sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 350000, 'mạch', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt mạch cấp nguồn riêng cho bộ sạc',
        description = 'Lắp đặt mạch cấp nguồn riêng cho bộ sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 350000,
        unit = 'mạch',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lắp đặt bộ sạc xe điện tại nhà
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lắp đặt bộ sạc xe điện tại nhà', 'lap-dat-bo-sac-xe-dien-tai-nha', 'Lắp đặt bộ sạc xe điện tại nhà chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 400000, 'bộ', 90, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lắp đặt bộ sạc xe điện tại nhà',
        description = 'Lắp đặt bộ sạc xe điện tại nhà chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 400000,
        unit = 'bộ',
        "estimatedDurationMin" = 90,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra bộ sạc không cấp điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra bộ sạc không cấp điện', 'kiem-tra-bo-sac-khong-cap-dien', 'Kiểm tra bộ sạc không cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra bộ sạc không cấp điện',
        description = 'Kiểm tra bộ sạc không cấp điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra bộ sạc báo lỗi
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra bộ sạc báo lỗi', 'kiem-tra-bo-sac-bao-loi', 'Kiểm tra bộ sạc báo lỗi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bộ', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra bộ sạc báo lỗi',
        description = 'Kiểm tra bộ sạc báo lỗi chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bộ',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra ổ cắm sạc phát nóng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra ổ cắm sạc phát nóng', 'kiem-tra-o-cam-sac-phat-nong', 'Kiểm tra ổ cắm sạc phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 160000, 'ổ cắm', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra ổ cắm sạc phát nóng',
        description = 'Kiểm tra ổ cắm sạc phát nóng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 160000,
        unit = 'ổ cắm',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra thiết bị bảo vệ nhánh sạc
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra thiết bị bảo vệ nhánh sạc', 'kiem-tra-thiet-bi-bao-ve-nhanh-sac', 'Kiểm tra thiết bị bảo vệ nhánh sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'nhánh', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra thiết bị bảo vệ nhánh sạc',
        description = 'Kiểm tra thiết bị bảo vệ nhánh sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'nhánh',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra tiếp địa hệ thống sạc
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra tiếp địa hệ thống sạc', 'kiem-tra-tiep-dia-he-thong-sac', 'Kiểm tra tiếp địa hệ thống sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'hệ thống', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra tiếp địa hệ thống sạc',
        description = 'Kiểm tra tiếp địa hệ thống sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Bảo trì hệ thống cấp điện bộ sạc
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Bảo trì hệ thống cấp điện bộ sạc', 'bao-tri-he-thong-cap-dien-bo-sac', 'Bảo trì hệ thống cấp điện bộ sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 250000, 'hệ thống', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Bảo trì hệ thống cấp điện bộ sạc',
        description = 'Bảo trì hệ thống cấp điện bộ sạc chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 250000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- -------------------------------------------------------------------------------------
    -- 28. ĐỐI TƯỢNG: Dịch vụ kiểm tra / Khảo sát điện (10 dịch vụ)
    -- -------------------------------------------------------------------------------------
    SELECT id INTO v_target_id FROM service_targets WHERE slug = 'khao-sat-kiem-tra-dien';
    IF v_target_id IS NULL THEN
        v_target_id := gen_random_uuid();
        INSERT INTO service_targets (id, "categoryId", name, slug, icon, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (v_target_id, v_category_id, 'Dịch vụ kiểm tra / Khảo sát điện', 'khao-sat-kiem-tra-dien', 'ClipboardCheck', 'Các gói dịch vụ chuyên trách cho dịch vụ kiểm tra / khảo sát điện', true, 28, NOW(), NOW());
    ELSE
        UPDATE service_targets SET name = 'Dịch vụ kiểm tra / Khảo sát điện', icon = 'ClipboardCheck', description = 'Các gói dịch vụ chuyên trách cho dịch vụ kiểm tra / khảo sát điện', "sortOrder" = 28, "updatedAt" = NOW() WHERE id = v_target_id;
    END IF;

    -- Dịch vụ: Khảo sát sửa chữa điện tại nhà
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Khảo sát sửa chữa điện tại nhà', 'khao-sat-sua-chua-dien-tai-nha', 'Khảo sát sửa chữa điện tại nhà chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 100000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Khảo sát sửa chữa điện tại nhà',
        description = 'Khảo sát sửa chữa điện tại nhà chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 100000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra sự cố điện chưa xác định
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra sự cố điện chưa xác định', 'kiem-tra-su-co-dien-chua-xac-dinh', 'Kiểm tra sự cố điện chưa xác định chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'lần', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra sự cố điện chưa xác định',
        description = 'Kiểm tra sự cố điện chưa xác định chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'lần',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Đo điện áp / dòng điện tải
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Đo điện áp / dòng điện tải', 'do-dien-ap-dong-dien-tai', 'Đo điện áp / dòng điện tải chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 120000, 'lần', 35, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Đo điện áp / dòng điện tải',
        description = 'Đo điện áp / dòng điện tải chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 120000,
        unit = 'lần',
        "estimatedDurationMin" = 35,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra tình trạng cách điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra tình trạng cách điện', 'kiem-tra-tinh-trang-cach-dien', 'Kiểm tra tình trạng cách điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra tình trạng cách điện',
        description = 'Kiểm tra tình trạng cách điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra điểm phát nóng bất thường
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra điểm phát nóng bất thường', 'kiem-tra-diem-phat-nong-bat-thuong', 'Kiểm tra điểm phát nóng bất thường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'lần', 40, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra điểm phát nóng bất thường',
        description = 'Kiểm tra điểm phát nóng bất thường chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'lần',
        "estimatedDurationMin" = 40,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Đánh giá tải điện hiện tại
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Đánh giá tải điện hiện tại', 'danh-gia-tai-dien-hien-tai', 'Đánh giá tải điện hiện tại chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 180000, 'hệ thống', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Đánh giá tải điện hiện tại',
        description = 'Đánh giá tải điện hiện tại chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 180000,
        unit = 'hệ thống',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Khảo sát nâng cấp hệ thống điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Khảo sát nâng cấp hệ thống điện', 'khao-sat-nang-cap-he-thong-dien', 'Khảo sát nâng cấp hệ thống điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'nhà', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Khảo sát nâng cấp hệ thống điện',
        description = 'Khảo sát nâng cấp hệ thống điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'nhà',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra an toàn điện trước khi sử dụng
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra an toàn điện trước khi sử dụng', 'kiem-tra-an-toan-dien-truoc-khi-su-dung', 'Kiểm tra an toàn điện trước khi sử dụng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra an toàn điện trước khi sử dụng',
        description = 'Kiểm tra an toàn điện trước khi sử dụng chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Lập phương án sửa chữa / lắp đặt điện
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Lập phương án sửa chữa / lắp đặt điện', 'lap-phuong-an-sua-chua-lap-dat-dien', 'Lập phương án sửa chữa / lắp đặt điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 200000, 'bộ', 60, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Lập phương án sửa chữa / lắp đặt điện',
        description = 'Lập phương án sửa chữa / lắp đặt điện chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 200000,
        unit = 'bộ',
        "estimatedDurationMin" = 60,
        "isActive" = true,
        "updatedAt" = NOW();

    -- Dịch vụ: Kiểm tra nghiệm thu sau sửa chữa
    INSERT INTO services (id, "categoryId", "targetId", name, slug, description, "basePrice", unit, "estimatedDurationMin", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_category_id, v_target_id, 'Kiểm tra nghiệm thu sau sửa chữa', 'kiem-tra-nghiem-thu-sau-sua-chua', 'Kiểm tra nghiệm thu sau sửa chữa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.', 150000, 'lần', 45, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
        "categoryId" = v_category_id,
        "targetId" = v_target_id,
        name = 'Kiểm tra nghiệm thu sau sửa chữa',
        description = 'Kiểm tra nghiệm thu sau sửa chữa chuyên nghiệp, khảo sát nhanh, vật tư chính hãng bảo hành 30 ngày.',
        "basePrice" = 150000,
        unit = 'lần',
        "estimatedDurationMin" = 45,
        "isActive" = true,
        "updatedAt" = NOW();

    RAISE NOTICE 'Hoàn thành seed 28 đối tượng và 286 dịch vụ ngành Sửa điện thành công!';
END $$;
