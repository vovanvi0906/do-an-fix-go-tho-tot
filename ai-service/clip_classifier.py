"""FixGo Pro - Zero-Shot Incident & Sub-Service Classifier using CLIP ViT-B/32."""

import logging
from typing import Dict, List, Optional, Tuple, Union, Any
import numpy as np
from PIL import Image
import torch
from service_catalog import CLASS_PROMPTS, CLASSES, SUB_SERVICES_CATALOG, format_vnd

logger = logging.getLogger("ai-service.clip")
MODEL_NAME = "openai/clip-vit-base-patch32"

_model, _processor, _text_features = None, None, None
_sub_service_embeddings: Dict[str, Tuple[List[Dict[str, Any]], torch.Tensor]] = {}


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


def load_clip() -> bool:
    """Nạp CLIP ViT-B/32 và tính sẵn Text Embeddings cho danh mục lớn & dịch vụ con."""
    global _model, _processor, _text_features, _sub_service_embeddings
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

        logger.info("✅ [CLIP] Đã nạp thành công và tính sẵn Embeddings danh mục & dịch vụ con.")
        return True
    except Exception as e:
        logger.error(f"❌ [CLIP] Không thể nạp mô hình: {e}")
        _model, _processor, _text_features = None, None, None
        _sub_service_embeddings.clear()
        return False


def is_ready() -> bool:
    return _model is not None and _processor is not None and _text_features is not None


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
    """Phân loại 2 bước: 1. Dự đoán danh mục lớn -> 2. Dự đoán dịch vụ con chi tiết."""
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
        sub_svc = predict_sub_service_from_feat(img_feat, target_cat) if target_cat != "other_unclear" else None
        return {"category_probs": probs_dict, "top_category": top_cat, "top_category_conf": top_conf, "sub_service": sub_svc}
    except Exception as e:
        logger.warning(f"⚠️ [CLIP] Lỗi dự đoán: {e}")
        return None


def predict_clip(image_input: Union[np.ndarray, Image.Image]) -> Optional[Dict[str, float]]:
    """Hàm tương thích ngược trả về xác suất 5 nhóm lớp."""
    res = predict_clip_full(image_input)
    return res["category_probs"] if res else None
