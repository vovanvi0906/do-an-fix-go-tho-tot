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
    "sua_dien": ["chập cháy điện", "ổ cắm hỏng", "aptomat nhảy", "dây điện hở", "broken electrical socket"],
    "sua_nuoc": ["rò rỉ nước", "gãy vòi nước", "bục ống nước", "nghẹt bồn rửa", "pipe leaking water"],
    "dien_lanh": ["máy lạnh chảy nước", "dàn lạnh đóng tuyết", "lưới lọc máy lạnh bẩn", "dirty air conditioner filter"],
    "thiet_bi": ["bếp từ báo lỗi", "hỏng bo mạch thiết bị", "máy giặt rò nước", "broken home appliance"],
    "lam_vuon": ["sân vườn cỏ mọc um tùm", "cắt tỉa cỏ dại", "cây cảnh cần tỉa", "sâu bệnh lá cây", "overgrown lawn grass weed garden"]
}

CLASS_PROMPTS: Dict[str, List[str]] = {
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
    "sua-nuoc": [
        {
            "slug": "sua-voi-nuoc-ro-ri-thay-voi-sen",
            "name": "Sửa vòi nước rò rỉ / Thay vòi sen tắm",
            "min_price": 100000,
            "max_price": 220000,
            "unit": "cái",
            "prompts": [
                "a photo of a leaking bathroom sink faucet tap",
                "a photo of a dripping water shower head or bidet sprayer",
                "a photo of a broken chrome water faucet",
            ],
        },
        {
            "slug": "thong-tac-lavabo-cong-san-chau-rua-bat",
            "name": "Thông tắc lavabo, cống sàn, chậu rửa bát",
            "min_price": 250000,
            "max_price": 450000,
            "unit": "lần",
            "prompts": [
                "a photo of a clogged kitchen sink drain with standing water",
                "a photo of a clogged bathroom floor drain or toilet bowl",
                "a photo of water backed up in a drainage pipe",
            ],
        },
        {
            "slug": "khac-phuc-buc-vo-ong-nuoc-pvc-ppr",
            "name": "Khắc phục bục vỡ đường ống nước PVC/PPR",
            "min_price": 250000,
            "max_price": 600000,
            "unit": "điểm",
            "prompts": [
                "a photo of a burst cracked PVC or PPR plumbing pipe",
                "a photo of high pressure water spraying from a broken pipe",
                "a photo of leaking water pipe elbow joint",
            ],
        },
        {
            "slug": "sua-chua-lap-may-bom-nuoc-tang-ap",
            "name": "Sửa chữa / Lắp máy bơm nước tăng áp",
            "min_price": 200000,
            "max_price": 450000,
            "unit": "máy",
            "prompts": [
                "a photo of a residential electric water booster pump",
                "a photo of an automatic water pump machine",
            ],
        },
    ],
    "sua-dien": [
        {
            "slug": "sua-thay-o-cam-cong-tac-aptomat",
            "name": "Sửa / Thay ổ cắm, công tắc, Aptomat",
            "min_price": 80000,
            "max_price": 180000,
            "unit": "cái",
            "prompts": [
                "a photo of a broken loose electrical wall outlet plug socket",
                "a photo of a burnt wall light switch or circuit breaker",
                "a photo of replacing an electrical switch on wall",
            ],
        },
        {
            "slug": "xu-ly-su-co-chap-dien-nhay-cb",
            "name": "Xử lý sự cố chập điện / Nhảy CB âm tường",
            "min_price": 350000,
            "max_price": 850000,
            "unit": "lần",
            "prompts": [
                "a photo of burnt melted wires from an electrical short circuit",
                "a photo of electrical fire burn marks on wall panel",
                "a photo of tripped circuit breakers in home panel",
            ],
        },
        {
            "slug": "lap-dat-sua-den-chieu-sang",
            "name": "Lắp đặt / Sửa hệ thống đèn chiếu sáng",
            "min_price": 70000,
            "max_price": 150000,
            "unit": "bộ",
            "prompts": [
                "a photo of a broken burned out ceiling light bulb",
                "a photo of installing modern LED downlight fixture",
            ],
        },
        {
            "slug": "dau-noi-keo-day-dien-noi-luon-ghen",
            "name": "Đấu nối, kéo đường dây điện nổi / luồn ghen",
            "min_price": 120000,
            "max_price": 250000,
            "unit": "lần",
            "prompts": [
                "a photo of exposed tangled electric power wiring",
                "a photo of electrical conduit plastic trunking cables",
            ],
        },
    ],
    "dien-lanh": [
        {
            "slug": "ve-sinh-may-lanh-treo-tuong",
            "name": "Vệ sinh máy lạnh treo tường",
            "min_price": 150000,
            "max_price": 220000,
            "unit": "bộ",
            "prompts": [
                "a photo of very dirty dusty air conditioner filter mesh",
                "a photo of technician cleaning indoor split air conditioner unit",
            ],
        },
        {
            "slug": "khac-phuc-may-lanh-chay-nuoc-mang-sau",
            "name": "Khắc phục máy lạnh chảy nước máng sau",
            "min_price": 150000,
            "max_price": 250000,
            "unit": "lần",
            "prompts": [
                "a photo of water leaking and dripping from an air conditioner unit",
                "a photo of water leaking down the wall beneath an AC unit",
            ],
        },
        {
            "slug": "nap-gas-bo-sung-may-lanh",
            "name": "Nạp gas bổ sung máy lạnh (R32 / R410A)",
            "min_price": 200000,
            "max_price": 450000,
            "unit": "máy",
            "prompts": [
                "a photo of an outdoor air conditioning compressor unit",
                "a photo of pressure gauge manifold recharging refrigerant gas into AC",
            ],
        },
        {
            "slug": "sua-chua-tu-lanh-khong-dong-da",
            "name": "Sửa chữa tủ lạnh không đông đá / kém lạnh",
            "min_price": 250000,
            "max_price": 550000,
            "unit": "tủ",
            "prompts": [
                "a photo of a home kitchen refrigerator appliance",
                "a photo of heavy frost and ice buildup inside refrigerator freezer",
            ],
        },
    ],
    "thiet-bi": [
        {
            "slug": "sua-bep-tu-bep-hong-ngoai",
            "name": "Sửa bếp từ, bếp hồng ngoại (Báo lỗi E0-E9)",
            "min_price": 250000,
            "max_price": 550000,
            "unit": "bếp",
            "prompts": [
                "a photo of an induction cooker or ceramic glass cooktop stove",
                "a photo of an induction stove with digital error code display",
            ],
        },
        {
            "slug": "bao-duong-thay-loi-loc-nuoc-ro",
            "name": "Bảo dưỡng & Thay lõi lọc nước tinh khiết RO",
            "min_price": 150000,
            "max_price": 350000,
            "unit": "bộ",
            "prompts": [
                "a photo of a home reverse osmosis RO water purifier machine",
                "a photo of dirty cylindrical sediment water filter cartridges",
            ],
        },
        {
            "slug": "sua-may-nuoc-nong-truc-tiep-gian-tiep",
            "name": "Sửa máy nước nóng trực tiếp / gián tiếp",
            "min_price": 200000,
            "max_price": 450000,
            "unit": "bình",
            "prompts": [
                "a photo of a bathroom electric instant water heater unit",
                "a photo of a hot water boiler storage tank in bathroom",
            ],
        },
    ],
    "lam-vuon": [
        {
            "slug": "cat-tia-co-san-vuon-don-co-dai",
            "name": "Cắt tỉa cỏ sân vườn, dọn cỏ dại",
            "min_price": 250000,
            "max_price": 500000,
            "unit": "buổi",
            "prompts": [
                "a photo of mowing overgrown lawn grass in garden",
                "a photo of grass trimming weed clearing in backyard",
                "a photo of lawnmower cutting green grass",
            ],
        },
        {
            "slug": "cat-tia-tao-tan-cay-canh-hang-rao",
            "name": "Cắt tỉa, tạo tán cây cảnh / Hàng rào",
            "min_price": 180000,
            "max_price": 400000,
            "unit": "cây",
            "prompts": [
                "a photo of pruning ornamental tree branches in garden",
                "a photo of shaping garden hedge plants with shears",
                "a photo of tree pruning and gardening maintenance",
            ],
        },
        {
            "slug": "trong-co-cai-tao-dat-don-dep-khuon-vien",
            "name": "Trồng cỏ, cải tạo đất, dọn dẹp khuôn viên vườn",
            "min_price": 160000,
            "max_price": 350000,
            "unit": "m2",
            "prompts": [
                "a photo of planting fresh grass turf in yard",
                "a photo of garden soil cultivation and landscaping cleanup",
            ],
        },
        {
            "slug": "lap-dat-sua-he-thong-tuoi-nho-giot",
            "name": "Lắp đặt / Sửa hệ thống tưới nhỏ giọt tự động",
            "min_price": 200000,
            "max_price": 500000,
            "unit": "gói",
            "prompts": [
                "a photo of garden automatic drip irrigation watering system",
                "a photo of irrigation water pipes and garden sprinklers",
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

