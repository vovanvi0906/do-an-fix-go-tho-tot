import logging
from typing import Optional
from fastapi import APIRouter, File, Form, Request, UploadFile
from recommendation.schemas import DiagnosisV2Response, CatalogSyncResponse
from recommendation.category_classifier import evaluate_categories, CATEGORY_NAMES
from recommendation.target_matcher import match_targets
from recommendation.catalog_manager import get_catalog_state, sync_catalog

logger = logging.getLogger("ai-service.recommendation.router")
router = APIRouter(prefix="/ai/v2", tags=["recommendation-v2"])


async def extract_request_data(request: Request, file: Optional[UploadFile], image_url: Optional[str], description: Optional[str]):
    image_bytes = await file.read() if file else None
    if not file:
        try:
            body = await request.json()
            image_url = body.get("imageUrl") or image_url
            description = body.get("description") or description
        except Exception:
            pass
    return image_bytes, image_url, description or ""


@router.post("/diagnose", response_model=DiagnosisV2Response)
async def diagnose_v2(
    request: Request,
    file: Optional[UploadFile] = File(None),
    imageUrl: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
):
    image_bytes, image_url, desc = await extract_request_data(request, file, imageUrl, description)
    from main import decode_image_to_cv2, HAS_CLIP, is_clip_ready, predict_clip_full
    cv_img = decode_image_to_cv2(image_bytes or image_url)
    if cv_img is None:
        return DiagnosisV2Response(notes="Không đọc được ảnh. Vui lòng chụp lại hoặc chọn dịch vụ.")

    clip_result = predict_clip_full(cv_img) if HAS_CLIP and is_clip_ready() else None
    clip_probs = clip_result.get("category_probs") if clip_result else None
    yolo_probs = None
    yolo_model = getattr(request.app.state, "yolo_cls_model", None)
    if yolo_model is not None:
        try:
            preds = yolo_model.predict(source=cv_img, verbose=False)
            if preds and preds[0].probs is not None:
                yolo_probs = {preds[0].names[i].replace("-", "_"): float(v)
                              for i, v in enumerate(preds[0].probs.data.tolist())}
        except Exception as exc:
            logger.warning("YOLO inference error: %s", exc)

    cat_slug, conf, cat_candidates, source = evaluate_categories(clip_probs, yolo_probs, desc)
    state = get_catalog_state()
    targets_dict = state.get("targets", {})
    target_embs = state.get("target_embeddings")
    img_feat = clip_result.get("img_feat") if clip_result else None
    target_candidates = match_targets(img_feat, cat_slug, targets_dict, target_embs, top_k=3)

    top_target = target_candidates[0] if target_candidates else None
    observable = []
    if cat_slug:
        cat_name = CATEGORY_NAMES.get(cat_slug.replace("-", "_"), cat_slug)
        observable.append(f"Nhận diện danh mục: {cat_name}")
    if top_target:
        observable.append(f"Nhận diện đối tượng: {top_target['targetName']}")

    return DiagnosisV2Response(
        suggestedCategoryId=cat_slug,
        suggestedCategoryName=CATEGORY_NAMES.get(cat_slug.replace("-", "_")) if cat_slug else None,
        suggestedTargetId=top_target["targetId"] if top_target else None,
        suggestedTargetName=top_target["targetName"] if top_target else None,
        categoryCandidates=cat_candidates,
        targetCandidates=target_candidates,
        confidence=conf,
        detectedLabels=[cat_slug] if cat_slug else [],
        observableSigns=observable,
        decision_source=source,
        engine="model" if source != "unavailable" else "unavailable",
        notes="Chẩn đoán danh mục và đối tượng thành công." if cat_slug else "Ảnh chưa đủ rõ để phân loại.",
    )


@router.post("/catalog/sync", response_model=CatalogSyncResponse)
async def sync_catalog_endpoint():
    res = sync_catalog()
    return CatalogSyncResponse(**res)


@router.get("/catalog/status")
async def catalog_status_endpoint():
    state = get_catalog_state()
    return {
        "version": state.get("version"),
        "updatedAt": state.get("updated_at"),
        "targetCount": len(state.get("targets", {})),
    }
