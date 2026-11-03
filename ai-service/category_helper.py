"""FixGo AI Service - Category Normalization & Keyword Matching Helper.

Tuân thủ quy tắc file size (<= 100 dòng, hàm <= 40 dòng).
"""

import re
import unicodedata
from typing import Dict, List, Optional, Any

CATEGORIES: Dict[str, Dict[str, Any]] = {
    "giup-viec": {"id": "giup-viec", "name": "Giúp việc", "default_service": "Dọn dẹp nhà theo giờ", "default_service_id": "don-dep-nha-theo-gio"},
    "lam-vuon": {"id": "lam-vuon", "name": "Làm vườn", "default_service": "Cắt cỏ định kỳ", "default_service_id": "cat-co-dinh-ky"},
    "sua-dien": {"id": "sua-dien", "name": "Sửa điện", "default_service": "Sửa công tắc không hoạt động", "default_service_id": "sua-cong-tac-khong-hoat-dong"},
    "sua-nuoc": {"id": "sua-nuoc", "name": "Sửa nước", "default_service": "Lắp đặt vòi mới", "default_service_id": "lap-dat-voi-moi"},
    "dien-lanh": {"id": "dien-lanh", "name": "Điện lạnh", "default_service": "Kiểm tra máy lạnh không lạnh hoặc lạnh yếu", "default_service_id": "kiem-tra-may-lanh-khong-lanh-hoac-lanh-yeu"},
    "thiet-bi": {"id": "thiet-bi", "name": "Thiết bị gia dụng", "default_service": "Sửa bếp không lên nguồn", "default_service_id": "sua-bep-khong-len-nguon"},
}

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "giup-viec": ["giup viec", "giup-viec", "giup_viec", "don dep", "ve sinh", "lau nha", "giat sofa", "housekeeping", "cleaning"],
    "lam-vuon": ["lam vuon", "lam-vuon", "lam_vuon", "san vuon", "cay canh", "co dai", "cat co", "tia cay", "garden", "lawn", "grass"],
    "sua-dien": ["sua dien", "sua-dien", "sua_dien", "chap dien", "aptomat", "cau dao", "o cam", "cong tac", "chay no", "day dien"],
    "sua-nuoc": ["sua nuoc", "sua-nuoc", "sua_nuoc", "ro ri nuoc", "ong nuoc", "duong ong", "voi nuoc", "bon cau", "lavabo", "sen tam"],
    "dien-lanh": ["dien lanh", "dien-lanh", "dien_lanh", "may lanh", "dieu hoa", "tu lanh", "may giat", "may say", "nap gas", "hvac"],
    "thiet-bi": ["thiet bi", "thiet-bi", "thiet_bi", "bep tu", "bep hong ngoai", "lo vi song", "may loc nuoc", "binh nong lanh", "noi com"],
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

    if "giup-viec" in norm or "ve-sinh" in norm or "/don-dep/" in norm:
        return "giup-viec"
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
    """Tìm danh mục phù hợp qua tập từ khóa nhận diện sắp xếp theo độ dài giảm dần."""
    clean_text = strip_accents(text)
    all_kws = [(kw, slug) for slug, kws in CATEGORY_KEYWORDS.items() for kw in kws]
    all_kws.sort(key=lambda item: len(item[0]), reverse=True)
    for kw, cat_slug in all_kws:
        pattern = rf"(?:\b|_|-){re.escape(kw)}(?:\b|_|-)" if len(kw) <= 5 else re.escape(kw)
        if re.search(pattern, clean_text):
            return cat_slug
    return None
