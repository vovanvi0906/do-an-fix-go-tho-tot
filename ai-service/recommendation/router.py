import logging
import os
import hmac
import time
import uuid
import hashlib
from functools import lru_cache
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, Form, Request, UploadFile, Response, HTTPException
from recommendation.schemas import DiagnosisV2Response, CatalogSyncResponse
from recommendation.category_classifier import evaluate_categories, CATEGORY_NAMES, CATEGORY_MIN_CONFIDENCE, CATEGORY_MIN_MARGIN
from recommendation.target_matcher import match_targets, TARGET_MIN_SIMILARITY
from recommendation.catalog_manager import get_catalog_state, sync_catalog
from recommendation.image_utils import decode_image_to_cv2

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
    response: Response,
    file: Optional[UploadFile] = File(None),
    imageUrl: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
):
    started = time.perf_counter()
    stages = {}
    request_id = request.headers.get("x-request-id", "")
    if not request_id or len(request_id) > 100 or not all((c.isascii() and c.isalnum()) or c in "_-" for c in request_id):
        request_id = str(uuid.uuid4())
    response.headers["X-Request-ID"] = request_id
    stage_start = time.perf_counter()
    image_bytes, image_url, desc = await extract_request_data(request, file, imageUrl, description)
    cv_img = decode_image_to_cv2(image_bytes or image_url)
    stages["image_decode"] = (time.perf_counter()-stage_start)*1000
    if cv_img is None:
        request.state.recommendation_debug = {"requestId":request_id,"stagesMs":stages,"failureStage":"image_validation"}
        return DiagnosisV2Response(notes="Không đọc được ảnh. Vui lòng chụp lại hoặc chọn dịch vụ.")

    import clip_classifier
    stage_start = time.perf_counter()
    has_clip = clip_classifier.is_ready()
    request.state.recommendation_stage = "clip"
    clip_result = clip_classifier.predict_clip_full(cv_img) if has_clip else None
    clip_probs = clip_result.get("category_probs") if clip_result else None
    stages["clip"] = (time.perf_counter()-stage_start)*1000
    stage_start = time.perf_counter()
    yolo_probs = None
    request.state.recommendation_stage = "yolo"
    yolo_error = None
    yolo_model = getattr(request.app.state, "yolo_cls_model", None)
    if yolo_model is not None:
        try:
            preds = yolo_model.predict(source=cv_img, verbose=False)
            if preds and preds[0].probs is not None:
                yolo_probs = {preds[0].names[i].replace("-", "_"): float(v)
                              for i, v in enumerate(preds[0].probs.data.tolist())}
        except Exception as exc:
            yolo_error = "YOLO_INFERENCE_FAILED"
            logger.warning("YOLO inference error: %s", type(exc).__name__)

    stages["yolo"] = (time.perf_counter()-stage_start)*1000
    stage_start = time.perf_counter()
    request.state.recommendation_stage = "category_fusion"
    cat_slug, conf, cat_candidates, source = evaluate_categories(clip_probs, yolo_probs, desc)
    stages["category_fusion"] = (time.perf_counter()-stage_start)*1000
    stage_start = time.perf_counter()
    state = get_catalog_state()
    targets_dict = state.get("targets", {})
    if not targets_dict:
        from target_catalog import TARGET_PROMPTS
        targets_dict = TARGET_PROMPTS

    target_embs = state.get("target_embeddings") or clip_classifier.get_target_embeddings()
    img_feat = clip_result.get("img_feat") if clip_result else None
    request.state.recommendation_stage = "target_resolution"
    target_candidates = match_targets(img_feat, cat_slug, targets_dict, target_embs, top_k=3) if cat_slug else []

    stages["target_resolution"] = (time.perf_counter()-stage_start)*1000
    top_target = target_candidates[0] if target_candidates else None
    observable = []
    if cat_slug:
        cat_name = CATEGORY_NAMES.get(cat_slug.replace("-", "_"), cat_slug)
        observable.append(f"Nhận diện danh mục: {cat_name}")
    if top_target and top_target.get("targetName"):
        observable.append(f"Nhận diện đối tượng: {top_target['targetName']}")

    final_source = source if cat_slug else ("abstained_ood" if source != "unavailable" else "unavailable")
    notes = "Chẩn đoán danh mục và đối tượng thành công." if cat_slug else "Ảnh chưa đủ rõ hoặc ngoài danh mục dịch vụ hỗ trợ."

    stages["total"] = (time.perf_counter()-started)*1000
    request.state.recommendation_debug = {
        "requestId": request_id, "stagesMs": stages,
        "clipScores": clip_probs, "yoloScores": yolo_probs,
        "modelsLoaded": {"clip": has_clip, "yolo": yolo_model is not None},
        "stageOutcomes":{"model_loading":"ready" if has_clip or yolo_model is not None else "unavailable", "clip":"ready" if clip_result else ("failed" if has_clip else "unavailable"), "yolo":"failed" if yolo_error else ("ready" if yolo_probs else "unavailable"),"category_fusion":"accepted" if cat_slug else "abstained","target_resolution":"accepted" if top_target else "unresolved"},
        "gates": {"categoryMinConfidence": CATEGORY_MIN_CONFIDENCE, "categoryMinMargin":CATEGORY_MIN_MARGIN,
                  "categoryAccepted": bool(cat_slug), "confidence":conf,
                  "targetMinSimilarity":TARGET_MIN_SIMILARITY, "targetAccepted":bool(top_target),
                  "source":"evaluate_categories defaults / match_targets defaults"},
        "catalog":{"version":state.get("version"),"source":state.get("source","static_fallback"),"targetCount":len(targets_dict)},
        "model":{"clip":"openai/clip-vit-base-patch32","clipCommit":getattr(getattr(getattr(clip_classifier,"_model",None),"config",None),"_commit_hash",None),"declaredVersion":"fixgo-ai-rec-v1"}
    }
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
        decision_source=final_source,
        engine="model" if source != "unavailable" else "unavailable",
        notes=notes,
    )


@router.post("/catalog/sync", response_model=CatalogSyncResponse)
async def sync_catalog_endpoint():
    import clip_classifier
    if clip_classifier.is_ready():
        clip_classifier.reload_targets()
        state = get_catalog_state()
        return CatalogSyncResponse(status="synced",version=state["version"],categoryCount=len(set(t.get("category") for t in state["targets"].values())),targetCount=len(state["targets"]))
    res = sync_catalog()
    return CatalogSyncResponse(**res)


@router.get("/catalog/status")
async def catalog_status_endpoint():
    state = get_catalog_state()
    return {
        "source": state.get("source", "uninitialized"),
        "version": state.get("version"),
        "updatedAt": state.get("updated_at"),
        "targetCount": len(state.get("targets", {})),
    }


@router.post("/internal/diagnose-debug", include_in_schema=False)
async def diagnose_debug(request: Request, response: Response,
                         file: Optional[UploadFile] = File(None),
                         imageUrl: Optional[str] = Form(None),
                         description: Optional[str] = Form(None)):
    expected = os.environ.get("RECOMMENDATION_DEBUG_TOKEN", "")
    if os.environ.get("RECOMMENDATION_DEBUG_ENABLED") != "true" or os.environ.get("NODE_ENV", "production") not in ("development", "staging", "test"):
        raise HTTPException(404, "Not found")
    supplied = request.headers.get("x-recommendation-debug-token", "")
    if len(expected) < 32 or not hmac.compare_digest(supplied.encode("utf-8"), expected.encode("utf-8")):
        raise HTTPException(401, "Unauthorized")
    try:
        result = await diagnose_v2(request, response, file, imageUrl, description)
    except Exception:
        raise HTTPException(502, {"code":"MODEL_STAGE_FAILED","stage":getattr(request.state,"recommendation_stage","image_validation")})
    debug = request.state.recommendation_debug
    weights = Path(__file__).resolve().parents[1]/"weights/yolov8n-cls-fixgo.pt"
    debug["model"] = {**debug.get("model", {}), "yoloSha256": hashlib.sha256(weights.read_bytes()).hexdigest() if weights.exists() else None}
    debug["model"].update(_clip_artifact())
    return {"result":result.model_dump(),"debug":debug}


@lru_cache(maxsize=4)
def _artifact_sha256(path, mtime_ns, size):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024*1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _clip_artifact():
    from huggingface_hub import try_to_load_from_cache
    for filename in ("model.safetensors", "pytorch_model.bin"):
        cached = try_to_load_from_cache("openai/clip-vit-base-patch32", filename)
        if isinstance(cached, str) and Path(cached).is_file():
            artifact = Path(cached)
            stat = artifact.stat()
            return {"clipArtifactSha256":_artifact_sha256(str(artifact),stat.st_mtime_ns,stat.st_size),"clipRevision":artifact.parent.name,"clipArtifactFile":filename}
    return {"clipArtifactSha256":None,"clipRevision":None}
