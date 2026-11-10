"""FixGo AI Service - Target Device Keyword Matching Helper.

Tuân thủ quy tắc file size (<= 100 dòng, hàm <= 40 dòng).
"""

from typing import Optional
from category_helper import strip_accents

TARGET_KEYWORDS = [
    ("duong-ong-cap-thoat-nuoc", ["ong nuoc", "duong ong", "buc ong", "vo ong", "xi nuoc"]),
    ("voi-nuoc-voi-sen", ["voi nuoc", "voi sen", "sen tam", "cu sen", "voi xit"]),
    ("bon-cau-ket-nuoc", ["bon cau", "ket nuoc", "xa nuoc bon cau", "be phot"]),
    ("lavabo-chau-rua-bon-rua", ["lavabo", "chau rua", "bon rua", "chau rua bat"]),
    ("bon-nuoc-may-bom-phao-nuoc", ["may bom", "bon nuoc", "phao co", "phao dien"]),
    ("pheu-thoat-san-khu-vuc-phong-tam", ["thoat san", "cong san", "pheu thoat"]),
    ("o-cam-dien", ["o cam", "phich cam", "o dien"]),
    ("cong-tac-dien", ["cong tac", "bat tat den"]),
    ("bong-den-den-led", ["bong den", "den led", "den tuyp", "chay bong"]),
    ("aptomat-cb-mcb", ["aptomat", "cb", "mcb", "cau dao", "nhay cb", "nhay aptomat"]),
    ("tu-dien-bang-dien", ["tu dien", "bang dien"]),
    ("day-dien-cap-dien", ["day dien", "cap dien", "dut day", "chay day"]),
    ("quat-tran-quat-treo-tuong", ["quat tran", "quat treo", "quat dung"]),
    ("may-lanh-dieu-hoa", ["may lanh", "dieu hoa", "cuc nong", "cuc lanh"]),
    ("tu-lanh-tu-lanh-side-by-side", ["tu lanh", "ngan da", "ngan mat"]),
    ("may-giat-may-giat-say", ["may giat", "long giat", "vat quan ao"]),
    ("bep-tu-bep-hong-ngoai", ["bep tu", "bep hong ngoai"]),
    ("lo-vi-song", ["lo vi song"]),
    ("may-loc-nuoc-ro-nano", ["may loc nuoc", "loi loc"]),
    ("binh-nong-lanh-dien", ["binh nong lanh", "may nuoc nong"]),
    ("sofa-nem-tham-rem", ["sofa", "nem", "tham", "rem cua"]),
    ("nha-o-can-ho", ["don dep", "ve sinh nha", "lau nha"]),
    ("tham-co-bai-co", ["cat co", "bai co", "co dai"]),
    ("cay-canh-chau-cay", ["cay canh", "chau cay", "tia cay"]),
]


def match_target_by_keywords(text: str) -> Optional[str]:
    """Tìm đối tượng/thiết bị từ mô tả văn bản của khách hàng."""
    if not text:
        return None
    clean_text = strip_accents(text)
    for target_slug, keywords in TARGET_KEYWORDS:
        for kw in keywords:
            if kw in clean_text:
                return target_slug
    return None
