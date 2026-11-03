# [STATIC DATA]: File chứa dữ liệu tĩnh danh mục dịch vụ và prompt zero-shot của FixGo (ngoại lệ Rule 7 sizefile.md)
"""
FixGo AI Service - Service Catalog & Prompts for Zero-Shot Classification
Định nghĩa danh mục dịch vụ chi tiết và prompt CLIP tương ứng.
"""

from typing import Dict, List, Any, Optional
from category_helper import (
    CATEGORIES,
    CATEGORY_KEYWORDS,
    normalize_category_key,
    match_category_by_keywords,
    extract_category_from_path,
    strip_accents,
)

CANDIDATE_LABELS: Dict[str, List[str]] = {
    "giup_viec": ["dọn dẹp nhà cửa", "vệ sinh sàn nhà bẩn", "giặt sofa thảm rèm", "dọn rác bừa bộn", "house cleaning dirty room"],
    "sua_dien": ["chập cháy điện", "ổ cắm hỏng", "aptomat nhảy", "dây điện hở", "broken electrical socket"],
    "sua_nuoc": ["rò rỉ nước", "gãy vòi nước", "bục ống nước", "nghẹt bồn rửa", "pipe leaking water"],
    "dien_lanh": ["máy lạnh chảy nước", "dàn lạnh đóng tuyết", "lưới lọc máy lạnh bẩn", "dirty air conditioner filter"],
    "thiet_bi": ["bếp từ báo lỗi", "hỏng bo mạch thiết bị", "máy giặt rò nước", "broken home appliance"],
    "lam_vuon": ["sân vườn cỏ mọc um tùm", "cắt tỉa cỏ dại", "cây cảnh cần tỉa", "sâu bệnh lá cây", "overgrown lawn grass weed garden"]
}

CLASS_PROMPTS: Dict[str, List[str]] = {
    "giup_viec": [
        "a photo of a messy dirty room needing house cleaning",
        "a photo of sweeping or mopping a dirty floor",
        "a photo of stained sofa carpet curtains needing upholstery cleaning",
        "a photo of kitchen grease stove deep cleaning housekeeping",
        "a photo of a messy bathroom needing housekeeping cleaning",
    ] + CANDIDATE_LABELS["giup_viec"],
    "sua_dien": [
        "a photo of burnt black electrical wall outlet with scorch marks",
        "sparking electrical short circuit hazard with melted copper wires",
        "tripped miniature circuit breaker switch inside home distribution box",
        "a photo of an electric circuit breaker or breaker box",
        "a photo of burnt electrical wires or short circuit",
        "a photo of a broken electrical wall outlet",
        "a photo of home power wiring hazard",
        "a photo of an electrical distribution panel",
    ] + CANDIDATE_LABELS["sua_dien"],
    "sua_nuoc": [
        "a photo of water spraying out from cracked PVC water pipe",
        "puddle of leaking water on floor beneath kitchen sink basin",
        "loose bathroom water faucet dripping droplets continuously",
        "a photo of a leaking water pipe under a sink",
        "a photo of a broken water pipe with water leaking",
        "a photo of a dripping faucet or shower head",
        "a photo of water leak damage on wall or floor",
        "a photo of a clogged drainage pipe or toilet",
    ] + CANDIDATE_LABELS["sua_nuoc"],
    "dien_lanh": [
        "water dripping down from wall mounted air conditioner plastic casing",
        "thick white ice and frost buildup on evaporator cooling coils",
        "opened front-load washing machine drum with water drainage issue",
        "a photo of a leaking wall mounted air conditioner",
        "a photo of an indoor air conditioning unit",
        "a photo of a refrigerator appliance interior or exterior",
        "a photo of a washing machine appliance issue",
        "a photo of cooling frost buildup on HVAC equipment",
    ] + CANDIDATE_LABELS["dien_lanh"],
    "thiet_bi": [
        "cracked induction cooker glass top showing error code on digital display",
        "home microwave oven interior sparking or damaged turntable plate",
        "a photo of a broken kitchen induction cooker stove",
        "a photo of a damaged microwave oven appliance",
        "a photo of an electric water heater cylinder",
        "a photo of a malfunctioning household kitchen appliance",
        "a photo of an appliance digital error code",
    ] + CANDIDATE_LABELS["thiet_bi"],
    "lam_vuon": [
        "overgrown messy garden grass weeds needing lawn mower trimming",
        "dense garden shrub hedge fence requiring hedge shear trimming",
        "a photo of an overgrown garden lawn grass",
        "a photo of lawn mowing or grass trimming",
        "a photo of pruning garden trees and ornamental plants",
        "a photo of garden weed clearing and landscaping",
        "a photo of backyard garden landscaping maintenance",
    ] + CANDIDATE_LABELS["lam_vuon"],
    "other_unclear": [
        "a photo of an unclear blurry image",
        "a photo of a person portrait or selfie",
        "a photo of an outdoor landscape nature view",
        "a photo of a document text on paper",
        "a photo of a random object unrelated to home repair",
    ],
}

CLASSES = list(CLASS_PROMPTS.keys())

SUB_SERVICES_CATALOG: Dict[str, List[Dict[str, Any]]] = {
    "giup-viec": [
        {
            "slug": "don-dep-nha-theo-gio",
            "name": "Dọn dẹp nhà theo giờ",
            "min_price": 100000,
            "max_price": 150000,
            "unit": "giờ",
            "prompts": [
                "a photo of a messy room with clutter on the floor needing cleaning",
                "a photo of sweeping or vacuuming house floor",
                "a photo of home housekeeping and room tidying",
            ],
        },
        {
            "slug": "tong-ve-sinh-nha-o",
            "name": "Tổng vệ sinh nhà ở",
            "min_price": 500000,
            "max_price": 1500000,
            "unit": "buổi",
            "prompts": [
                "a photo of deep cleaning a kitchen or bathroom tiles",
                "a photo of an empty apartment during move-in deep cleaning",
            ],
        },
        {
            "slug": "giat-sofa-vai",
            "name": "Giặt sofa vải",
            "min_price": 250000,
            "max_price": 500000,
            "unit": "bộ",
            "prompts": [
                "a photo of a stained dirty fabric sofa couch or mattress",
                "a photo of dirty dusty carpet rug needing deep steam cleaning",
            ],
        },
        {
            "slug": "ve-sinh-cua-kinh",
            "name": "Vệ sinh cửa kính",
            "min_price": 120000,
            "max_price": 250000,
            "unit": "lần",
            "prompts": [
                "a photo of dirty dusty glass windows needing squeegee cleaning",
                "a photo of window glass cleaning",
            ],
        },
        {
            "slug": "ve-sinh-van-phong-theo-gio",
            "name": "Vệ sinh văn phòng theo giờ",
            "min_price": 120000,
            "max_price": 200000,
            "unit": "giờ",
            "prompts": [
                "a photo of messy office workspace needing janitorial cleaning",
                "a photo of office cleaning service",
            ],
        },
    ],
    "lam-vuon": [
        {
            "slug": "cat-co-dinh-ky",
            "name": "Cắt cỏ định kỳ",
            "min_price": 150000,
            "max_price": 350000,
            "unit": "lần",
            "prompts": [
                "a photo of mowing overgrown lawn grass in garden",
                "a photo of grass trimming weed clearing in backyard",
                "a photo of lawnmower cutting green grass",
            ],
        },
        {
            "slug": "cat-tia-cay-canh",
            "name": "Cắt tỉa cây cảnh",
            "min_price": 150000,
            "max_price": 400000,
            "unit": "lần",
            "prompts": [
                "a photo of pruning ornamental tree branches in garden",
                "a photo of shaping garden hedge plants with shears",
                "a photo of tree pruning and gardening maintenance",
            ],
        },
        {
            "slug": "nho-don-co-dai",
            "name": "Nhổ / dọn cỏ dại",
            "min_price": 150000,
            "max_price": 300000,
            "unit": "lần",
            "prompts": [
                "a photo of pulling weeds from flower bed or lawn",
                "a photo of overgrown garden weeds",
            ],
        },
        {
            "slug": "cat-tia-hang-rao-cay",
            "name": "Cắt tỉa hàng rào cây",
            "min_price": 150000,
            "max_price": 350000,
            "unit": "lần",
            "prompts": [
                "a photo of trimming green bush fence hedge",
                "a photo of neat garden border hedge pruning",
            ],
        },
        {
            "slug": "lap-he-thong-tuoi-tu-dong",
            "name": "Lắp hệ thống tưới tự động",
            "min_price": 200000,
            "max_price": 600000,
            "unit": "lần",
            "prompts": [
                "a photo of garden automatic drip irrigation watering system",
                "a photo of irrigation water pipes and garden sprinklers",
            ],
        },
    ],
    "sua-nuoc": [
        {
            "slug": "lap-dat-voi-moi",
            "name": "Lắp đặt vòi mới",
            "min_price": 150000,
            "max_price": 250000,
            "unit": "điểm",
            "prompts": [
                "a photo of a leaking bathroom sink faucet tap",
                "a photo of a dripping water shower head or bidet sprayer",
                "a photo of a broken chrome water faucet",
            ],
        },
        {
            "slug": "sua-bon-cau-xa-yeu",
            "name": "Sửa bồn cầu xả yếu",
            "min_price": 150000,
            "max_price": 350000,
            "unit": "điểm",
            "prompts": [
                "a photo of a clogged toilet bowl or running toilet tank",
                "a photo of toilet flush mechanism failure",
            ],
        },
        {
            "slug": "xu-ly-mui-hoi-quanh-bon-cau",
            "name": "Xử lý mùi hôi quanh bồn cầu",
            "min_price": 150000,
            "max_price": 400000,
            "unit": "điểm",
            "prompts": [
                "a photo of bathroom floor drain smelling bad",
                "a photo of unsealed toilet flange odor leak",
            ],
        },
        {
            "slug": "sua-bom-khong-chay",
            "name": "Sửa bơm không chạy",
            "min_price": 200000,
            "max_price": 500000,
            "unit": "điểm",
            "prompts": [
                "a photo of a residential electric water booster pump",
                "a photo of an automatic water pump machine",
            ],
        },
    ],
    "sua-dien": [
        {
            "slug": "sua-cong-tac-khong-hoat-dong",
            "name": "Sửa công tắc không hoạt động",
            "min_price": 100000,
            "max_price": 180000,
            "unit": "điểm",
            "prompts": [
                "a photo of a broken loose electrical wall outlet plug socket",
                "a photo of a burnt wall light switch or circuit breaker",
                "a photo of replacing an electrical switch on wall",
            ],
        },
        {
            "slug": "lap-tu-dien-dan-dung",
            "name": "Lắp tủ điện dân dụng",
            "min_price": 250000,
            "max_price": 600000,
            "unit": "điểm",
            "prompts": [
                "a photo of electrical distribution panel with circuit breakers",
                "a photo of tripped circuit breakers in home panel",
            ],
        },
        {
            "slug": "thay-day-cu-xuong-cap",
            "name": "Thay dây cũ / xuống cấp",
            "min_price": 150000,
            "max_price": 450000,
            "unit": "điểm",
            "prompts": [
                "a photo of burnt melted wires from an electrical short circuit",
                "a photo of exposed tangled electric power wiring",
            ],
        },
    ],
    "dien-lanh": [
        {
            "slug": "kiem-tra-may-lanh-khong-lanh-hoac-lanh-yeu",
            "name": "Kiểm tra máy lạnh không lạnh hoặc lạnh yếu",
            "min_price": 180000,
            "max_price": 300000,
            "unit": "máy",
            "prompts": [
                "a photo of technician inspecting indoor split air conditioner unit",
                "a photo of dusty dirty air conditioner filter mesh and cooling coil",
            ],
        },
        {
            "slug": "sua-may-lanh-chay-nuoc",
            "name": "Sửa máy lạnh chảy nước",
            "min_price": 180000,
            "max_price": 350000,
            "unit": "máy",
            "prompts": [
                "a photo of water leaking and dripping from an air conditioner unit",
                "a photo of water leaking down the wall beneath an AC unit",
            ],
        },
        {
            "slug": "sua-tu-lanh-khong-lanh",
            "name": "Sửa tủ lạnh không lạnh",
            "min_price": 200000,
            "max_price": 550000,
            "unit": "máy",
            "prompts": [
                "a photo of a home kitchen refrigerator appliance",
                "a photo of heavy frost and ice buildup inside refrigerator freezer",
            ],
        },
        {
            "slug": "sua-may-giat-khong-vat",
            "name": "Sửa máy giặt không vắt",
            "min_price": 180000,
            "max_price": 450000,
            "unit": "máy",
            "prompts": [
                "a photo of a front load washing machine with standing water",
                "a photo of washing machine spinning failure",
            ],
        },
    ],
    "thiet-bi": [
        {
            "slug": "sua-bep-khong-len-nguon",
            "name": "Sửa bếp không lên nguồn",
            "min_price": 150000,
            "max_price": 400000,
            "unit": "máy",
            "prompts": [
                "a photo of an induction cooker or ceramic glass cooktop stove",
                "a photo of an induction stove with digital error code display",
            ],
        },
        {
            "slug": "sua-bep-khong-nong-nong-yeu",
            "name": "Sửa bếp không nóng / nóng yếu",
            "min_price": 150000,
            "max_price": 450000,
            "unit": "máy",
            "prompts": [
                "a photo of induction cooker not heating properly",
                "a photo of damaged cooktop glass plate",
            ],
        },
        {
            "slug": "thay-loi-loc-dinh-ky",
            "name": "Thay lõi lọc định kỳ",
            "min_price": 120000,
            "max_price": 300000,
            "unit": "máy",
            "prompts": [
                "a photo of a home reverse osmosis RO water purifier machine",
                "a photo of dirty cylindrical sediment water filter cartridges",
            ],
        },
        {
            "slug": "sua-binh-khong-nong",
            "name": "Sửa bình không nóng",
            "min_price": 150000,
            "max_price": 400000,
            "unit": "máy",
            "prompts": [
                "a photo of a bathroom electric instant water heater unit",
                "a photo of a hot water boiler storage tank in bathroom",
            ],
        },
    ],
}


def format_vnd(amount: int) -> str:
    """Định dạng tiền tệ VNĐ (ví dụ: 100000 -> '100.000đ')."""
    return f"{amount:,.0f}".replace(",", ".") + "đ"


def get_services_by_category(category_key: str) -> List[Dict[str, Any]]:
    """Lấy danh sách dịch vụ con theo danh mục (chấp nhận lam-vuon, lam_vuon, lam vuon)."""
    norm_key = normalize_category_key(category_key) if category_key else ""
    return SUB_SERVICES_CATALOG.get(norm_key, [])

