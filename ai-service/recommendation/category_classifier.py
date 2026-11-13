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
    if clip_probs and yolo_probs:
        clip_top = max(clip_probs, key=clip_probs.get)
        yolo_top = max(yolo_probs, key=yolo_probs.get)
        if clip_top == yolo_top and clip_top != "other_unclear":
            w_clip = clip_probs[clip_top] ** 2
            w_yolo = yolo_probs[yolo_top] ** 2
            total = (w_clip + w_yolo) or 1.0
            scores = {k: (w_yolo * yolo_probs.get(k, 0) + w_clip * clip_probs.get(k, 0)) / total
                      for k in set(clip_probs) | set(yolo_probs)}
            source = "ensemble"
        elif yolo_top == "other_unclear" or yolo_probs[yolo_top] < 0.40:
            scores, source = clip_probs, "clip"
        else:
            scores, source = yolo_probs, "yolo"
    elif clip_probs:
        scores, source = clip_probs, "clip"
    elif yolo_probs:
        scores, source = yolo_probs, "yolo"
    else:
        scores, source = {}, "unavailable"

    if description and scores:
        matched = match_category_by_keywords(description)
        if matched:
            k = matched.replace("-", "_")
            if k in scores:
                scores[k] = min(1.0, scores[k] + 0.35)
                source = f"{source}+text"

    return scores, source


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
