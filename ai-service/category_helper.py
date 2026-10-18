"""FixGo AI Service - Category Normalization & Keyword Matching Helper.

Tuân thủ quy tắc file size (<= 100 dòng, hàm <= 40 dòng).
"""

import re
import unicodedata
from typing import Dict, List, Optional, Any

CATEGORIES: Dict[str, Dict[str, Any]] = {
    "lam-vuon": {
        "id": "lam-vuon",
        "name": "Làm vườn",
        "default_service": "Cắt tỉa cỏ sân vườn, dọn cỏ dại",
        "default_service_id": "cat-tia-co-san-vuon-don-co-dai",
    },
    "sua-dien": {"id": "sua-dien", "name": "Sửa điện", "default_service": "Sửa / Thay ổ cắm, công tắc, Aptomat"},
    "sua-nuoc": {"id": "sua-nuoc", "name": "Sửa nước", "default_service": "Sửa vòi nước rò rỉ / Thay vòi sen tắm"},
    "dien-lanh": {"id": "dien-lanh", "name": "Điện lạnh", "default_service": "Vệ sinh máy lạnh treo tường"},
    "thiet-bi": {"id": "thiet-bi", "name": "Thiết bị gia dụng", "default_service": "Sửa bếp từ, bếp hồng ngoại (Báo lỗi E0-E9)"},
}

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "lam-vuon": [
        "lam vuon", "lam-vuon", "lam_vuon", "vuon",
        "cay", "co", "co dai", "cat co", "tia cay",
        "garden", "lawn", "grass", "weed", "plant", "tree", "pruning",
    ],
    "sua-dien": ["sua dien", "sua-dien", "sua_dien", "dien", "chap", "aptomat", "cau dao", "o cam", "chay", "day"],
    "sua-nuoc": ["sua nuoc", "sua-nuoc", "sua_nuoc", "nuoc", "ro ri", "ong", "voi", "bon cau", "lavabo", "sen tam"],
    "dien-lanh": ["dien lanh", "dien-lanh", "dien_lanh", "lanh", "may lanh", "dieu hoa", "tu lanh", "gas", "hvac"],
    "thiet-bi": ["thiet bi", "thiet-bi", "thiet_bi", "bep", "bep tu", "lo vi song", "loc nuoc", "nong lanh"],
}


def strip_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt và chuẩn hóa về ASCII thường."""
    if not text:
        return ""
    norm = unicodedata.normalize("NFD", text)
    cleaned = "".join(c for c in norm if unicodedata.category(c) != "Mn")
    return cleaned.replace("đ", "d").replace("Đ", "d").lower()


def normalize_category_key(raw_name: str) -> str:
    """Chuẩn hóa chuỗi/thư mục: 'lam vuon' -> 'lam-vuon'."""
    norm = re.sub(r"[\s_]+", "-", strip_accents(raw_name).strip())
    return re.sub(r"[^a-z0-9\-]", "", norm)


GARDEN_PATH_KEYWORDS = [
    "co", "grass", "weed", "lawn", "vuon", "garden", "cay", "plant", "tia_cay", "tia-cay", "lam-vuon", "lam_vuon",
]


def extract_category_from_path(file_path: str) -> str:
    """Bóc tách nhãn từ đường dẫn file, chuyển đổi khoảng trắng và gạch dưới thành gạch ngang."""
    if not file_path:
        return "other-unclear"
    norm = strip_accents(str(file_path)).lower().replace("\\", "/").replace(" ", "-").replace("_", "-")
    # Kiểm tra tập từ khóa làm vườn ưu tiên cao
    for g_kw in GARDEN_PATH_KEYWORDS:
        kw_norm = g_kw.replace("_", "-")
        pattern = rf"(?:^|[\/_\-\.\s]){re.escape(kw_norm)}(?:[\/_\-\.\s]|$|\d)"
        if re.search(pattern, norm) or (len(kw_norm) >= 5 and kw_norm in norm):
            return "lam-vuon"

    if "sua-dien" in norm or "/dien/" in norm:
        return "sua-dien"
    if "sua-nuoc" in norm or "/nuoc/" in norm:
        return "sua-nuoc"
    if "dien-lanh" in norm or "/lanh/" in norm:
        return "dien-lanh"
    if "thiet-bi" in norm:
        return "thiet-bi"
    kw = match_category_by_keywords(norm)
    return kw if kw else "other-unclear"


def match_category_by_keywords(text: str) -> Optional[str]:
    """Tìm danh mục phù hợp qua tập từ khóa nhận diện, ưu tiên làm vườn."""
    clean_text = strip_accents(text)
    for cat_slug, kw_list in CATEGORY_KEYWORDS.items():
        for kw in sorted(kw_list, key=len, reverse=True):
            pattern = rf"(?:\b|_|-){re.escape(kw)}(?:\b|_|-)" if len(kw) <= 4 else re.escape(kw)
            if re.search(pattern, clean_text):
                return cat_slug
    return None
