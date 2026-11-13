from typing import Any, Dict, List, Optional
import torch


def match_targets(
    img_feat: Optional[torch.Tensor],
    category_slug: Optional[str],
    targets_dict: Dict[str, Dict[str, Any]],
    target_embeddings: Optional[Any],
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    if img_feat is None or not targets_dict:
        return []

    norm_cat = category_slug.replace("_", "-") if category_slug else None
    filtered_keys = [
        k for k, meta in targets_dict.items()
        if not norm_cat or not meta.get("category") or meta.get("category") == norm_cat
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

    return [
        {
            "targetId": targets_dict[k].get("id") or k,
            "targetName": targets_dict[k].get("name", k),
            "targetCategory": targets_dict[k].get("category", norm_cat),
            "similarity": 0.5,
            "confidence": 0.5,
            "provenance": "catalog_fallback",
        }
        for k in filtered_keys[:top_k]
    ]
