from typing import Any, Dict, List, Optional
import torch


TARGET_MIN_SIMILARITY = 0.20
# CLIP logit scale is 100: a 0.01 cosine gap means top-1 is ~e (2.7x) as likely as top-2.
# Smaller gaps are reported as ambiguous options for the user, never auto-selected.
TARGET_MIN_MARGIN = 0.01
# Service tasks without a visible physical object must never be matched from pixels.
NON_VISUAL_TARGET_SLUGS = frozenset({"kiem-tra-khao-sat-su-co-dien"})


def is_visual_target(key: str, meta: Dict[str, Any]) -> bool:
    if meta.get("visual") is False:
        return False
    return key not in NON_VISUAL_TARGET_SLUGS and meta.get("slug") not in NON_VISUAL_TARGET_SLUGS


def select_target(candidates: List[Dict[str, Any]], min_margin: float = TARGET_MIN_MARGIN) -> Optional[Dict[str, Any]]:
    """Auto-select only a clear winner; ties stay as options for the user."""
    if not candidates:
        return None
    if len(candidates) > 1 and candidates[0]["similarity"] - candidates[1]["similarity"] < min_margin:
        return None
    return candidates[0]


def match_targets(
    img_feat: Optional[torch.Tensor],
    category_slug: Optional[str],
    targets_dict: Dict[str, Dict[str, Any]],
    target_embeddings: Optional[Any],
    top_k: int = 3,
    min_similarity: float = TARGET_MIN_SIMILARITY,
) -> List[Dict[str, Any]]:
    if img_feat is None or not targets_dict or not category_slug:
        return []

    norm_cat = category_slug.replace("_", "-")
    filtered_keys = [
        k for k, meta in targets_dict.items()
        if (not meta.get("category") or meta.get("category") == norm_cat) and is_visual_target(k, meta)
    ]
    if not filtered_keys:
        return []

    if target_embeddings is not None and isinstance(target_embeddings, tuple):
        keys, feats = target_embeddings
        key_to_idx = {k: i for i, k in enumerate(keys)}
        valid_indices = [key_to_idx[k] for k in filtered_keys if k in key_to_idx]
        if valid_indices:
            sub_feats = feats[valid_indices]
            with torch.no_grad():
                cos_sim = (img_feat @ sub_feats.T).squeeze(0)
            ranked_pairs = sorted(
                zip(valid_indices, cos_sim.tolist()),
                key=lambda p: p[1],
                reverse=True,
            )
            if not ranked_pairs or ranked_pairs[0][1] < min_similarity:
                return []

            candidates = []
            for idx, sim in ranked_pairs[:top_k]:
                key = keys[idx]
                meta = targets_dict.get(key, {})
                conf = max(0.0, min(1.0, (sim + 1.0) / 2.0))
                candidates.append({
                    "targetId": meta.get("id") or key,
                    "targetName": meta.get("name", key),
                    "targetCategory": meta.get("category", norm_cat),
                    "similarity": round(sim, 4),
                    "confidence": round(conf, 4),
                    "provenance": "clip_target_similarity",
                })
            return candidates

    return []
