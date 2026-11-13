"""FixGo Pro - Zero-Shot Incident & Sub-Service Classifier using CLIP ViT-B/32."""

import logging
import os
from typing import Dict, List, Optional, Tuple, Union, Any
import httpx
import numpy as np
from PIL import Image
import torch
from service_catalog import CLASS_PROMPTS, CLASSES, SUB_SERVICES_CATALOG, format_vnd
from target_catalog import TARGET_PROMPTS

logger = logging.getLogger("ai-service.clip")
MODEL_NAME = "openai/clip-vit-base-patch32"
BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:3000/api")

_model, _processor, _text_features = None, None, None
_sub_service_embeddings: Dict[str, Tuple[List[Dict[str, Any]], torch.Tensor]] = {}
_target_embeddings: Optional[Tuple[List[str], torch.Tensor]] = None
_dynamic_targets: Dict[str, Dict[str, Any]] = {}


def _to_tensor(feat) -> torch.Tensor:
    if hasattr(feat, "pooler_output") and feat.pooler_output is not None:
        return feat.pooler_output
    if hasattr(feat, "last_hidden_state") and feat.last_hidden_state is not None:
        return feat.last_hidden_state[:, 0]
    return feat[0] if isinstance(feat, (tuple, list)) else feat


def _embed_prompts(prompts: List[str]) -> torch.Tensor:
    inputs = _processor(text=prompts, return_tensors="pt", padding=True)
    txt_feat = _to_tensor(_model.get_text_features(**inputs))
    txt_feat = txt_feat / txt_feat.norm(dim=-1, keepdim=True)
    mean_feat = txt_feat.mean(dim=0, keepdim=True)
    return mean_feat / mean_feat.norm(dim=-1, keepdim=True)


def fetch_targets_from_backend() -> Dict[str, Dict[str, Any]]:
    """Tải danh sách Đối tượng kèm aiPrompts trực tiếp từ Backend/Database."""
    try:
        url = f"{BACKEND_API_URL}/service-targets"
        resp = httpx.get(url, timeout=3.5)
        if resp.status_code == 200:
            items = resp.json()
            targets_dict = {}
            for item in items:
                slug = item.get("slug")
                if not slug:
                    continue
                name = item.get("name", slug)
                cat = item.get("category")
                cat_slug = cat.get("slug") if isinstance(cat, dict) else None
                prompts = item.get("aiPrompts") or []
                if not prompts:
                    prompts = [
                        f"a photo of a {name} device in home repair",
                        f"a photo of {slug.replace('-', ' ')}",
                    ]
                targets_dict[slug] = {
                    "name": name,
                    "category": cat_slug,
                    "prompts": prompts,
                }
            if targets_dict:
                logger.info(f"🌐 [CLIP] Tải thành công {len(targets_dict)} đối tượng từ DB ({url}).")
                return targets_dict
    except Exception as e:
        logger.warning(f"⚠️ [CLIP] Không thể kết nối Backend ({e}). Sử dụng target_catalog fallback.")
    return TARGET_PROMPTS


def reload_targets() -> int:
    """Nạp lại đối tượng động từ Database và tính toán lại Embeddings ngay lập tức."""
    global _target_embeddings, _dynamic_targets
    if not is_ready():
        return 0
    _dynamic_targets = fetch_targets_from_backend()
    target_keys = list(_dynamic_targets.keys())
    with torch.no_grad():
        target_embeds = [_embed_prompts(_dynamic_targets[k]["prompts"]) for k in target_keys]
        _target_embeddings = (target_keys, torch.cat(target_embeds, dim=0))
    logger.info(f"🔄 [CLIP] Đã đồng bộ và tính Embeddings cho {len(target_keys)} đối tượng.")
    return len(target_keys)


def load_clip() -> bool:
    """Nạp CLIP ViT-B/32 và tính sẵn Text Embeddings cho danh mục, đối tượng & dịch vụ."""
    global _model, _processor, _text_features, _sub_service_embeddings, _target_embeddings
    try:
        from transformers import CLIPModel, CLIPProcessor

        logger.info(f"📦 [CLIP] Đang nạp {MODEL_NAME} trên CPU...")
        _model = CLIPModel.from_pretrained(MODEL_NAME).to("cpu")
        _processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        _model.eval()

        with torch.no_grad():
            class_embeds = [_embed_prompts(CLASS_PROMPTS[c]) for c in CLASSES]
            _text_features = torch.cat(class_embeds, dim=0)

            _sub_service_embeddings.clear()
            for cat_slug, services in SUB_SERVICES_CATALOG.items():
                svc_embeds = [_embed_prompts(s["prompts"]) for s in services]
                _sub_service_embeddings[cat_slug] = (services, torch.cat(svc_embeds, dim=0))

            reload_targets()

        logger.info("✅ [CLIP] Đã nạp thành công và tính sẵn Embeddings 3 tầng từ Database.")
        return True
    except Exception as e:
        logger.error(f"❌ [CLIP] Không thể nạp mô hình: {e}")
        _model, _processor, _text_features = None, None, None
        _sub_service_embeddings.clear()
        _target_embeddings = None
        return False


def is_ready() -> bool:
    return _model is not None and _processor is not None and _text_features is not None


def get_target_embeddings() -> Optional[Tuple[List[str], torch.Tensor]]:
    return _target_embeddings


def _encode_image(image_input: Union[np.ndarray, Image.Image]) -> Optional[torch.Tensor]:
    if isinstance(image_input, np.ndarray):
        rgb = image_input[:, :, ::-1] if len(image_input.shape) == 3 and image_input.shape[2] == 3 else image_input
        pil_img = Image.fromarray(rgb)
    elif isinstance(image_input, Image.Image):
        pil_img = image_input.convert("RGB")
    else:
        return None

    inputs = _processor(images=pil_img, return_tensors="pt")
    with torch.no_grad():
        img_feat = _to_tensor(_model.get_image_features(**inputs))
        return img_feat / img_feat.norm(dim=-1, keepdim=True)


def predict_target_from_feat(
    img_feat: torch.Tensor, category_hint: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Dự đoán đối tượng / thiết bị cụ thể từ vector ảnh."""
    if not is_ready() or _target_embeddings is None:
        return None
    target_keys, target_feats = _target_embeddings
    with torch.no_grad():
        logits = _model.logit_scale.exp() * (img_feat @ target_feats.T)
        probs = torch.softmax(logits, dim=-1).squeeze(0)

    active_dict = _dynamic_targets or TARGET_PROMPTS
    norm_cat = category_hint.replace("_", "-") if category_hint else None
    best_idx, best_prob = None, -1.0
    for idx, key in enumerate(target_keys):
        meta = active_dict.get(key, {})
        if norm_cat and meta.get("category") and meta.get("category") != norm_cat:
            continue
        prob = float(probs[idx].item())
        if prob > best_prob:
            best_prob, best_idx = prob, idx

    if best_idx is None:
        if norm_cat:
            return None
        best_idx = int(torch.argmax(probs).item())
        best_prob = float(probs[best_idx].item())

    target_key = target_keys[best_idx]
    meta = active_dict.get(target_key, {})
    return {
        "targetId": target_key,
        "targetName": meta.get("name", target_key),
        "targetCategory": meta.get("category"),
        "confidence": round(best_prob, 4),
    }


def predict_target_candidates_from_feat(
    img_feat: torch.Tensor, category_hint: Optional[str] = None, top_k: int = 3
) -> List[Dict[str, Any]]:
    """Trả về top-k đối tượng khả dĩ thuộc danh mục phù hợp."""
    if not is_ready() or _target_embeddings is None:
        return []
    target_keys, target_feats = _target_embeddings
    with torch.no_grad():
        cos_sim = (img_feat @ target_feats.T).squeeze(0)
    active_dict = _dynamic_targets or TARGET_PROMPTS
    norm_cat = category_hint.replace("_", "-") if category_hint else None
    candidates = []
    for idx, key in enumerate(target_keys):
        meta = active_dict.get(key, {})
        if norm_cat and meta.get("category") and meta.get("category") != norm_cat:
            continue
        sim = float(cos_sim[idx].item())
        candidates.append({
            "targetId": key,
            "targetName": meta.get("name", key),
            "targetCategory": meta.get("category"),
            "similarity": round(sim, 4),
            "confidence": round(max(0.0, min(1.0, (sim + 1.0) / 2.0)), 4),
            "provenance": "clip_target_similarity",
        })
    candidates.sort(key=lambda x: x["similarity"], reverse=True)
    return candidates[:top_k]


def predict_sub_service_from_feat(
    img_feat: torch.Tensor, category_key: str
) -> Optional[Dict[str, Any]]:
    """Dự đoán dịch vụ con thuộc danh mục cụ thể từ vector ảnh đã trích xuất."""
    if not is_ready():
        return None
    norm_cat = category_key.replace("_", "-")
    if norm_cat not in _sub_service_embeddings:
        return None

    services, svc_feats = _sub_service_embeddings[norm_cat]
    with torch.no_grad():
        logits = _model.logit_scale.exp() * (img_feat @ svc_feats.T)
        probs = torch.softmax(logits, dim=-1).squeeze(0)

    best_idx = int(torch.argmax(probs).item())
    best_svc = services[best_idx]
    best_conf = float(probs[best_idx].item())
    unit_str = best_svc.get("unit", "lần")
    formatted_price = f"{format_vnd(best_svc['min_price'])} - {format_vnd(best_svc['max_price'])} / {unit_str}"

    return {
        "serviceId": best_svc["slug"],
        "serviceName": best_svc["name"],
        "targetId": best_svc.get("target_slug"),
        "targetName": best_svc.get("target_name"),
        "confidence": round(best_conf, 4),
        "priceRange": {
            "min": best_svc["min_price"],
            "max": best_svc["max_price"],
            "unit": unit_str,
            "formatted": formatted_price,
        },
        "allServiceProbs": {s["slug"]: round(float(probs[i].item()), 4) for i, s in enumerate(services)},
    }


def predict_clip_full(
    image_input: Union[np.ndarray, Image.Image], category_hint: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Phân loại 3 bước: 1. Danh mục lớn -> 2. Đối tượng thiết bị -> 3. Gói dịch vụ chi tiết."""
    if not is_ready():
        return None
    try:
        img_feat = _encode_image(image_input)
        if img_feat is None:
            return None

        with torch.no_grad():
            logits = _model.logit_scale.exp() * (img_feat @ _text_features.T)
            probs = torch.softmax(logits, dim=-1).squeeze(0)

        probs_dict = {cls_name: round(float(probs[i].item()), 4) for i, cls_name in enumerate(CLASSES)}
        sorted_cls = sorted(probs_dict.items(), key=lambda x: x[1], reverse=True)
        top_cat, top_conf = sorted_cls[0]

        target_cat = category_hint or top_cat
        target_info = predict_target_from_feat(img_feat, target_cat) if target_cat != "other_unclear" else None
        sub_svc = predict_sub_service_from_feat(img_feat, target_cat) if target_cat != "other_unclear" else None

        if target_info and sub_svc:
            sub_svc["targetId"] = target_info["targetId"]
            sub_svc["targetName"] = target_info["targetName"]

        return {
            "category_probs": probs_dict,
            "top_category": top_cat,
            "top_category_conf": top_conf,
            "target": target_info,
            "sub_service": sub_svc,
            "img_feat": img_feat,
        }
    except Exception as e:
        logger.warning(f"⚠️ [CLIP] Lỗi dự đoán: {e}")
        return None


def predict_clip(image_input: Union[np.ndarray, Image.Image]) -> Optional[Dict[str, float]]:
    """Hàm tương thích ngược trả về xác suất 5 nhóm lớp."""
    res = predict_clip_full(image_input)
    return res["category_probs"] if res else None
