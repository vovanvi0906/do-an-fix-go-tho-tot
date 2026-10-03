"""
FixGo Pro - Zero-Shot Incident Classifier using OpenAI CLIP (ViT-B/32)
Phân loại 5 nhóm sự cố FixGo bằng kỹ thuật Prompt Ensembling không cần gán nhãn lại.
"""

import os
import logging
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image
import torch

logger = logging.getLogger("ai-service.clip")

MODEL_NAME = "openai/clip-vit-base-patch32"

CLASS_PROMPTS: Dict[str, List[str]] = {
    "sua_dien": [
        "a photo of an electric circuit breaker or breaker box",
        "a photo of burnt electrical wires or short circuit",
        "a photo of a broken electrical wall outlet",
        "a photo of home power wiring hazard",
        "a photo of an electrical distribution panel",
    ],
    "sua_nuoc": [
        "a photo of a leaking water pipe under a sink",
        "a photo of a broken water pipe with water leaking",
        "a photo of a dripping faucet or shower head",
        "a photo of water leak damage on wall or floor",
        "a photo of a clogged drainage pipe or toilet",
    ],
    "dien_lanh": [
        "a photo of a leaking wall mounted air conditioner",
        "a photo of an indoor air conditioning unit",
        "a photo of a refrigerator appliance interior or exterior",
        "a photo of a washing machine appliance issue",
        "a photo of cooling frost buildup on HVAC equipment",
    ],
    "thiet_bi": [
        "a photo of a broken kitchen induction cooker stove",
        "a photo of a damaged microwave oven appliance",
        "a photo of an electric water heater cylinder",
        "a photo of a malfunctioning household kitchen appliance",
        "a photo of an appliance digital error code",
    ],
    "other_unclear": [
        "a photo of an unclear blurry image",
        "a photo of a person portrait or selfie",
        "a photo of an outdoor landscape nature view",
        "a photo of a document text on paper",
        "a photo of a random object unrelated to home repair",
    ],
}

CLASSES = list(CLASS_PROMPTS.keys())

_model = None
_processor = None
_text_features = None  # Normalized (5, 512) tensor


def _to_tensor(feat) -> torch.Tensor:
    if hasattr(feat, "pooler_output") and feat.pooler_output is not None:
        return feat.pooler_output
    if hasattr(feat, "last_hidden_state") and feat.last_hidden_state is not None:
        return feat.last_hidden_state[:, 0]
    return feat[0] if isinstance(feat, (tuple, list)) else feat


def load_clip() -> bool:
    """Nạp CLIP ViT-B/32 trên CPU và tiền tính toán Text Embeddings cho 5 nhóm lớp."""
    global _model, _processor, _text_features
    try:
        # pyrefly: ignore [missing-import]
        from transformers import CLIPModel, CLIPProcessor

        logger.info(f"📦 [CLIP] Đang nạp mô hình {MODEL_NAME} trên CPU...")
        _model = CLIPModel.from_pretrained(MODEL_NAME).to("cpu")
        _processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        _model.eval()

        class_embeddings = []
        with torch.no_grad():
            for cls_name in CLASSES:
                prompts = CLASS_PROMPTS[cls_name]
                inputs = _processor(text=prompts, return_tensors="pt", padding=True)
                txt_feat = _to_tensor(_model.get_text_features(**inputs))
                txt_feat = txt_feat / txt_feat.norm(dim=-1, keepdim=True)
                mean_feat = txt_feat.mean(dim=0, keepdim=True)
                mean_feat = mean_feat / mean_feat.norm(dim=-1, keepdim=True)
                class_embeddings.append(mean_feat)

        _text_features = torch.cat(class_embeddings, dim=0)  # Shape: (5, dim)
        logger.info("✅ [CLIP] Đã nạp thành công và tính sẵn 5-class Prompt Embeddings.")
        return True
    except Exception as e:
        logger.error(f"❌ [CLIP] Không thể nạp mô hình: {e}")
        _model, _processor, _text_features = None, None, None
        return False


def is_ready() -> bool:
    return _model is not None and _processor is not None and _text_features is not None


def predict_clip(image_input: Union[np.ndarray, Image.Image]) -> Optional[Dict[str, float]]:
    """Dự đoán xác suất 5 nhóm sự cố bằng CLIP Zero-Shot (trả về dict class -> float)."""
    if not is_ready():
        return None

    try:
        if isinstance(image_input, np.ndarray):
            # Chuyển OpenCV BGR sang PIL RGB
            if len(image_input.shape) == 3 and image_input.shape[2] == 3:
                rgb = image_input[:, :, ::-1]
            else:
                rgb = image_input
            pil_img = Image.fromarray(rgb)
        elif isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")
        else:
            return None

        inputs = _processor(images=pil_img, return_tensors="pt")
        with torch.no_grad():
            img_feat = _to_tensor(_model.get_image_features(**inputs))
            img_feat = img_feat / img_feat.norm(dim=-1, keepdim=True)

            logit_scale = _model.logit_scale.exp()
            logits = logit_scale * (img_feat @ _text_features.T)
            probs = torch.softmax(logits, dim=-1).squeeze(0)

        probs_dict = {cls_name: round(float(probs[i].item()), 4) for i, cls_name in enumerate(CLASSES)}
        return probs_dict
    except Exception as e:
        logger.warning(f"⚠️ [CLIP] Lỗi dự đoán hình ảnh: {e}")
        return None
