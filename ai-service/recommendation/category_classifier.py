from typing import Dict, List, Optional, Tuple, Any
from category_helper import match_category_by_keywords

CATEGORY_NAMES = {
    "sua_dien": "Sửa điện",
    "sua_nuoc": "Sửa nước",
    "dien_lanh": "Điện lạnh",
    "thiet_bi": "Thiết bị gia dụng",
    "lam_vuon": "Làm vườn",
    "giup_viec": "Giúp việc",
}


def fuse_category_scores(
    clip_probs: Optional[Dict[str, float]],
    yolo_probs: Optional[Dict[str, float]],
    description: Optional[str] = "",
) -> Tuple[Dict[str, float], str]:
    if not clip_probs and not yolo_probs:
        return {}, "unavailable"
    if clip_probs and not yolo_probs:
        scores, source = dict(clip_probs), "clip"
    elif yolo_probs and not clip_probs:
        scores, source = dict(yolo_probs), "yolo"
    else:
        yolo_top = max(yolo_probs, key=yolo_probs.get)
        if yolo_top == "other_unclear":
            scores, source = dict(clip_probs), "clip"
        else:
            w_clip, w_yolo = 0.6, 0.4
            all_keys = set(clip_probs) | set(yolo_probs)
            scores = {k: w_clip * clip_probs.get(k, 0.0) + w_yolo * yolo_probs.get(k, 0.0) for k in all_keys}
            source = "ensemble"

    if description and scores:
        matched = match_category_by_keywords(description)
        if matched:
            k = matched.replace("-", "_")
            if k in scores:
                scores[k] = scores[k] * 1.8
                source = f"{source}+text"

    total = sum(scores.values()) or 1.0
    normalized = {k: round(v / total, 4) for k, v in scores.items()}
    return normalized, source


def evaluate_categories(
    clip_probs: Optional[Dict[str, float]],
    yolo_probs: Optional[Dict[str, float]],
    description: Optional[str] = "",
    min_confidence: float = 0.48,
    min_margin: float = 0.10,
) -> Tuple[Optional[str], Optional[float], List[Dict[str, Any]], str]:
    scores, source = fuse_category_scores(clip_probs, yolo_probs, description)
    if not scores or source == "unavailable":
        return None, None, [], "unavailable"

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_label, top_score = ranked[0]
    margin = (top_score - ranked[1][1]) if len(ranked) > 1 else top_score

    accepted = (
        top_label != "other_unclear"
        and top_score >= min_confidence
        and margin >= min_margin
        and top_label in CATEGORY_NAMES
    )

    candidates = [
        {
            "id": k.replace("_", "-"),
            "slug": k.replace("_", "-"),
            "name": CATEGORY_NAMES.get(k, k),
            "confidence": round(v, 4),
            "provenance": source,
        }
        for k, v in ranked[:3]
        if k in CATEGORY_NAMES
    ]

    selected_label = top_label.replace("_", "-") if accepted else None
    confidence = round(top_score, 4) if accepted else None
    return selected_label, confidence, candidates, source
