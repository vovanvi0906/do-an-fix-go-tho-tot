# File dữ liệu tĩnh cấu hình ngân hàng prompt cho 70 đối tượng ngành nghề FixGo (Bắt buộc vượt giới hạn theo Mục 7)
"""FixGo Pro - Target Device Prompts Catalog for Zero-Shot Object Recognition (Full 70 Targets)."""

from typing import Dict, Any

TARGET_PROMPTS: Dict[str, Dict[str, Any]] = {
    # =========================================================================
    # 1. THIẾT BỊ GIA DỤNG (15 Đối tượng)
    # =========================================================================
    "bep-tu-bep-hong-ngoai": {
        "name": "Bếp từ / Bếp hồng ngoại",
        "category": "thiet-bi",
        "prompts": ["a photo of an induction cooker electric stove cooktop", "a photo of a ceramic glass induction hob"],
    },
    "bep-gas-bep-gas-am": {
        "name": "Bếp gas / Bếp gas âm",
        "category": "thiet-bi",
        "prompts": ["a photo of a kitchen gas stove burner cooktop", "a photo of a built-in kitchen gas hob"],
    },
    "noi-com-dien-noi-ap-suat-dien": {
        "name": "Nồi cơm điện / Nồi áp suất điện",
        "category": "thiet-bi",
        "prompts": ["a photo of an electric rice cooker appliance", "a photo of an electric pressure cooker pot"],
    },
    "lo-vi-song": {
        "name": "Lò vi sóng",
        "category": "thiet-bi",
        "prompts": ["a photo of a countertop microwave oven appliance"],
    },
    "lo-nuong-noi-chien-khong-dau": {
        "name": "Lò nướng / Nồi chiên không dầu",
        "category": "thiet-bi",
        "prompts": ["a photo of a kitchen electric oven or air fryer"],
    },
    "may-loc-nuoc-ro-nano": {
        "name": "Máy lọc nước RO / Nano",
        "category": "thiet-bi",
        "prompts": ["a photo of an RO water purifier filtration system", "a photo of under-sink water filter cartridges"],
    },
    "may-hut-mui": {
        "name": "Máy hút mùi",
        "category": "thiet-bi",
        "prompts": ["a photo of a kitchen cooker hood range hood exhaust"],
    },
    "may-hut-bui-robot-hut-bui": {
        "name": "Máy hút bụi / Robot hút bụi",
        "category": "thiet-bi",
        "prompts": ["a photo of a robot vacuum cleaner or handheld vacuum cleaner"],
    },
    "quat-dien-quat-dung-quat-ban": {
        "name": "Quạt điện / Quạt đứng / Quạt bàn",
        "category": "thiet-bi",
        "prompts": ["a photo of a home standing electric pedestal fan or table fan"],
    },
    "binh-nong-lanh-dien": {
        "name": "Bình nóng lạnh điện",
        "category": "thiet-bi",
        "prompts": ["a photo of a bathroom electric water heater storage tank cylinder"],
    },
    "may-xay-may-ep-may-danh-trung": {
        "name": "Máy xay / Máy ép / Máy đánh trứng",
        "category": "thiet-bi",
        "prompts": ["a photo of a food blender, fruit juicer, or stand mixer"],
    },
    "may-pha-ca-phe-am-sieu-toc": {
        "name": "Máy pha cà phê / Ấm siêu tốc",
        "category": "thiet-bi",
        "prompts": ["a photo of an electric water kettle or coffee machine"],
    },
    "may-rua-chen-may-rua-bat": {
        "name": "Máy rửa chén / Máy rửa bát",
        "category": "thiet-bi",
        "prompts": ["a photo of a home kitchen dishwasher machine"],
    },
    "ban-ui-ban-la-hoi-nuoc": {
        "name": "Bàn ủi / Bàn là hơi nước",
        "category": "thiet-bi",
        "prompts": ["a photo of a clothes steam iron appliance"],
    },
    "may-loc-khong-khi-may-hut-am": {
        "name": "Máy lọc không khí / Máy hút ẩm",
        "category": "thiet-bi",
        "prompts": ["a photo of a home air purifier or dehumidifier appliance"],
    },

    # =========================================================================
    # 2. SỬA NƯỚC (7 Đối tượng)
    # =========================================================================
    "voi-nuoc-voi-sen": {
        "name": "Vòi nước / Vòi sen",
        "category": "sua-nuoc",
        "prompts": ["a photo of a water faucet, sink tap, or shower head", "a photo of a leaking bathroom water tap or bidet spray"],
    },
    "bon-cau-ket-nuoc": {
        "name": "Bồn cầu / Két nước",
        "category": "sua-nuoc",
        "prompts": ["a photo of a ceramic toilet bowl or toilet flush water tank", "a photo of a leaking toilet cistern commode"],
    },
    "lavabo-chau-rua-bon-rua": {
        "name": "Lavabo / Chậu rửa / Bồn rửa",
        "category": "sua-nuoc",
        "prompts": ["a photo of a bathroom lavabo sink basin or kitchen wash sink"],
    },
    "duong-ong-cap-thoat-nuoc": {
        "name": "Đường ống cấp / thoát nước",
        "category": "sua-nuoc",
        "prompts": [
            "a photo of leaking PVC water pipe, cracked pipe plumbing joint, or water pipe fitting in dark corner",
            "a photo of a broken leaking drainage water pipe or metal plumbing pipe",
            "a photo of a leaking pipe with water spraying or dripping",
        ],
    },
    "bon-nuoc-may-bom-phao-nuoc": {
        "name": "Bồn nước / Máy bơm / Phao nước",
        "category": "sua-nuoc",
        "prompts": ["a photo of an electric water booster pump motor", "a photo of a stainless steel rooftop water tank or tank float valve"],
    },
    "pheu-thoat-san-khu-vuc-phong-tam": {
        "name": "Phễu thoát sàn / Khu vực phòng tắm",
        "category": "sua-nuoc",
        "prompts": ["a photo of a bathroom floor drain strainer grate", "a photo of clogged floor drain trap with overflowing water"],
    },
    "be-tu-hoai-ho-ga-cong-thoat": {
        "name": "Bể tự hoại / Hố ga / Cống thoát",
        "category": "sua-nuoc",
        "prompts": ["a photo of an outdoor sewer drain manhole cover, grease trap, or septic tank opening"],
    },

    # =========================================================================
    # 3. SỬA ĐIỆN (29 Đối tượng)
    # =========================================================================
    "o-cam-dien": {
        "name": "Ổ cắm điện",
        "category": "sua-dien",
        "prompts": ["a photo of an electrical wall outlet, power plug socket, or AC wall receptacle"],
    },
    "cong-tac-dien": {
        "name": "Công tắc điện",
        "category": "sua-dien",
        "prompts": ["a photo of a home wall light switch button", "a photo of an electric toggle switch on wall"],
    },
    "bong-den-den-led": {
        "name": "Bóng đèn / Đèn LED",
        "category": "sua-dien",
        "prompts": ["a photo of a ceiling light bulb, LED tube light, or downlight lamp"],
    },
    "den-trang-tri-den-chum": {
        "name": "Đèn trang trí / Đèn chùm",
        "category": "sua-dien",
        "prompts": ["a photo of a decorative ceiling chandelier, crystal light, or hanging pendant lamp"],
    },
    "den-ngoai-troi-san-vuon": {
        "name": "Đèn ngoài trời / Sân vườn",
        "category": "sua-dien",
        "prompts": ["a photo of outdoor garden landscape lighting or exterior wall sconce lamp"],
    },
    "aptomat-cb-mcb": {
        "name": "Aptomat / CB / MCB",
        "category": "sua-dien",
        "prompts": ["a photo of a circuit breaker switch, tripped MCB or electrical fuse switch"],
    },
    "thiet-bi-chong-ro-chong-giat": {
        "name": "Thiết bị chống rò / Chống giật",
        "category": "sua-dien",
        "prompts": ["a photo of an RCD residual current device or earth leakage circuit breaker (ELCB)"],
    },
    "tu-dien-bang-dien": {
        "name": "Tủ điện / Bảng điện",
        "category": "sua-dien",
        "prompts": ["a photo of a home electrical distribution board panel box with multiple breakers"],
    },
    "day-dien-cap-dien": {
        "name": "Dây điện / Cáp điện",
        "category": "sua-dien",
        "prompts": ["a photo of electrical wiring cables, exposed electrical wires, or cable conduit"],
    },
    "hop-noi-dien-hop-ky-thuat": {
        "name": "Hộp nối điện / Hộp kỹ thuật",
        "category": "sua-dien",
        "prompts": ["a photo of an electrical junction box or wiring terminal conduit box"],
    },
    "he-thong-dien-phong": {
        "name": "Hệ thống điện phòng",
        "category": "sua-dien",
        "prompts": ["a photo of indoor room electrical wiring layout on wall"],
    },
    "he-thong-dien-toan-nha": {
        "name": "Hệ thống điện toàn nhà",
        "category": "sua-dien",
        "prompts": ["a photo of building electrical wiring infrastructure"],
    },
    "quat-tran-quat-treo-tuong": {
        "name": "Quạt trần / Quạt treo tường",
        "category": "sua-dien",
        "prompts": ["a photo of a ceiling fan or wall-mounted electric fan"],
    },
    "quat-thong-gio-quat-hut": {
        "name": "Quạt thông gió / Quạt hút",
        "category": "sua-dien",
        "prompts": ["a photo of a bathroom exhaust ventilation fan or kitchen wall exhaust fan"],
    },
    "chuong-cua-nut-nhan": {
        "name": "Chuông cửa / Nút nhấn",
        "category": "sua-dien",
        "prompts": ["a photo of a door chime bell button or wireless doorbell receiver"],
    },
    "cam-bien-thiet-bi-tu-dong": {
        "name": "Cảm biến / Thiết bị tự động",
        "category": "sua-dien",
        "prompts": ["a photo of a motion sensor detector or automated light sensor"],
    },
    "cong-tac-thong-minh-relay": {
        "name": "Công tắc thông minh / Relay",
        "category": "sua-dien",
        "prompts": ["a photo of a smart touch light switch panel or wifi electrical relay module"],
    },
    "o-cam-thong-minh-hen-gio": {
        "name": "Ổ cắm thông minh / Hẹn giờ",
        "category": "sua-dien",
        "prompts": ["a photo of a smart wifi plug socket or timer plug outlet"],
    },
    "nguon-dien-adapter-bo-nguon": {
        "name": "Nguồn điện / Adapter / Bộ nguồn",
        "category": "sua-dien",
        "prompts": ["a photo of a power adapter brick, DC switching power supply, or transformer"],
    },
    "on-ap-ups-bo-luu-dien": {
        "name": "Ổn áp / UPS / Bộ lưu điện",
        "category": "sua-dien",
        "prompts": ["a photo of an automatic voltage stabilizer regulator or UPS backup battery unit"],
    },
    "tiep-dia-chong-set": {
        "name": "Tiếp địa / Chống sét",
        "category": "sua-dien",
        "prompts": ["a photo of an electrical earthing ground wire or lightning rod arrester"],
    },
    "den-su-co-den-thoat-hiem": {
        "name": "Đèn sự cố / Đèn thoát hiểm",
        "category": "sua-dien",
        "prompts": ["a photo of an emergency exit sign light or backup emergency illumination lamp"],
    },
    "dien-cua-cuon-cong-tu-dong": {
        "name": "Điện cửa cuốn / Cổng tự động",
        "category": "sua-dien",
        "prompts": ["a photo of a roller shutter motor box, automatic gate opener control board, or remote receiver"],
    },
    "may-bom-nuoc-phan-dien": {
        "name": "Máy bơm nước – Phần điện",
        "category": "sua-dien",
        "prompts": ["a photo of water pump electrical capacitor, pressure switch, or motor power connection"],
    },
    "nguon-cap-cho-thiet-bi-co-dinh": {
        "name": "Nguồn cấp cho thiết bị cố định",
        "category": "sua-dien",
        "prompts": ["a photo of electrical power connection for fixed heavy home appliance"],
    },
    "dien-mat-troi-inverter": {
        "name": "Điện mặt trời / Inverter",
        "category": "sua-dien",
        "prompts": ["a photo of a solar power inverter box or rooftop solar panel array"],
    },
    "bo-sac-xe-dien-o-cam-sac": {
        "name": "Bộ sạc xe điện / Ổ cắm sạc",
        "category": "sua-dien",
        "prompts": ["a photo of an electric vehicle EV wall charger station or e-bike charging outlet"],
    },
    "kiem-tra-khao-sat-su-co-dien": {
        "name": "Kiểm tra / Khảo sát sự cố điện",
        "category": "sua-dien",
        "prompts": ["a photo of electrical troubleshooting with multimeter test probes"],
    },
    "thiet-bi-do-dien-cong-to-dien": {
        "name": "Thiết bị đo điện / Công tơ điện",
        "category": "sua-dien",
        "prompts": ["a photo of an electric utility power meter kWh dial meter"],
    },

    # =========================================================================
    # 4. ĐIỆN LẠNH (7 Đối tượng)
    # =========================================================================
    "may-lanh-dieu-hoa": {
        "name": "Máy lạnh / Điều hòa",
        "category": "dien-lanh",
        "prompts": ["a photo of a wall mounted indoor air conditioner split unit or outdoor condenser unit"],
    },
    "tu-lanh-tu-lanh-side-by-side": {
        "name": "Tủ lạnh",
        "category": "dien-lanh",
        "prompts": ["a photo of a kitchen refrigerator fridge freezer appliance"],
    },
    "may-giat-may-giat-say": {
        "name": "Máy giặt / Máy giặt sấy",
        "category": "dien-lanh",
        "prompts": ["a photo of a front-loading or top-loading washing machine drum"],
    },
    "may-say-quan-ao": {
        "name": "Máy sấy quần áo",
        "category": "dien-lanh",
        "prompts": ["a photo of a clothes tumble dryer laundry machine"],
    },
    "tu-dong-tu-mat": {
        "name": "Tủ đông / Tủ mát",
        "category": "dien-lanh",
        "prompts": ["a photo of a commercial chest deep freezer or beverage cooler showcase"],
    },
    "may-lam-mat-quat-dieu-hoa": {
        "name": "Máy làm mát / Quạt điều hòa",
        "category": "dien-lanh",
        "prompts": ["a photo of an evaporative air cooler fan unit with water tank"],
    },
    "may-nuoc-uong-nong-lanh": {
        "name": "Máy nước uống nóng lạnh",
        "category": "dien-lanh",
        "prompts": ["a photo of a water dispenser cooler with hot and cold taps"],
    },

    # =========================================================================
    # 5. GIÚP VIỆC (7 Đối tượng)
    # =========================================================================
    "nha-o-can-ho": {
        "name": "Nhà ở / Căn hộ",
        "category": "giup-viec",
        "prompts": ["a photo of an apartment living room or bedroom needing housekeeping cleaning"],
    },
    "sofa-nem-tham-rem": {
        "name": "Sofa / Nệm / Thảm / Rèm",
        "category": "giup-viec",
        "prompts": ["a photo of a fabric sofa couch, mattress, floor carpet, or window curtain"],
    },
    "khu-vuc-bep-thiet-bi-bep-ben-ngoai": {
        "name": "Khu vực bếp / Thiết bị bếp bên ngoài",
        "category": "giup-viec",
        "prompts": ["a photo of a greasy dirty kitchen countertop, stove, or sink area needing cleaning"],
    },
    "nha-ve-sinh-phong-tam": {
        "name": "Nhà vệ sinh / Phòng tắm",
        "category": "giup-viec",
        "prompts": ["a photo of a bathroom toilet tiles floor needing deep scrubbing"],
    },
    "cua-kinh-cua-so-ban-cong": {
        "name": "Cửa kính / Cửa sổ / Ban công",
        "category": "giup-viec",
        "prompts": ["a photo of glass window panes, balcony railings, or sliding glass door needing wiping"],
    },
    "san-nha-tuong-tran-noi-that": {
        "name": "Sàn nhà / Tường / Trần / Nội thất",
        "category": "giup-viec",
        "prompts": ["a photo of ceramic tiled floor, dusty walls, or wooden furniture needing dusting"],
    },
    "van-phong-cua-hang": {
        "name": "Văn phòng / Cửa hàng",
        "category": "giup-viec",
        "prompts": ["a photo of a commercial office workspace or shop floor needing cleaning"],
    },

    # =========================================================================
    # 6. LÀM VƯỜN (5 Đối tượng)
    # =========================================================================
    "tham-co-bai-co": {
        "name": "Thảm cỏ / Bãi cỏ",
        "category": "lam-vuon",
        "prompts": ["a photo of an overgrown garden lawn grass weeds needing mowing"],
    },
    "cay-canh-chau-cay": {
        "name": "Cây cảnh / Chậu cây",
        "category": "lam-vuon",
        "prompts": ["a photo of potted ornamental bonsai plants, shrubs, or flowering plants needing pruning"],
    },
    "cay-bong-mat-cay-lon": {
        "name": "Cây bóng mát / Cây lớn",
        "category": "lam-vuon",
        "prompts": ["a photo of tall garden shade tree branches needing trimming or pruning"],
    },
    "hang-rao-cay-bon-hoa-vuon-rau": {
        "name": "Hàng rào cây / Bồn hoa / Vườn rau",
        "category": "lam-vuon",
        "prompts": ["a photo of garden green hedge fence, flower bed, or backyard vegetable patch"],
    },
    "he-thong-tuoi-san-vuon-tong-the": {
        "name": "Hệ thống tưới / Sân vườn tổng thể",
        "category": "lam-vuon",
        "prompts": ["a photo of automated garden irrigation drip system or overall garden landscape"],
    },
}
