import hashlib
import json
import logging
import os
import threading
import time
from typing import Any, Dict, Optional, Tuple
import httpx

logger = logging.getLogger("ai-service.recommendation.catalog")
BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:3000/api")

_lock = threading.Lock()
_catalog_state: Dict[str, Any] = {
    "version": "init",
    "updated_at": 0.0,
    "targets": {},
    "target_keys": [],
    "target_embeddings": None,
}


def get_catalog_state() -> Dict[str, Any]:
    with _lock:
        return dict(_catalog_state)


def load_targets_from_backend() -> Dict[str, Dict[str, Any]]:
    targets_map: Dict[str, Dict[str, Any]] = {}
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(f"{BACKEND_API_URL}/service-targets")
            if resp.status_code == 200:
                data = resp.json()
                for item in data:
                    slug = item.get("slug") or item.get("id")
                    if not item.get("isActive", True):
                        continue
                    targets_map[slug] = {
                        "id": item.get("id"),
                        "slug": slug,
                        "name": item.get("name"),
                        "category": item.get("category", {}).get("slug") if isinstance(item.get("category"), dict) else item.get("categoryId"),
                        "aiPrompts": item.get("aiPrompts") or [f"a photo of {item.get('name')}"],
                    }
    except Exception as exc:
        logger.warning("Could not fetch targets from Backend: %s", exc)
    return targets_map


def sync_catalog(embed_func=None) -> Dict[str, Any]:
    targets = load_targets_from_backend()
    if not targets:
        logger.info("Using existing targets snapshot")
        from target_catalog import TARGET_PROMPTS
        targets = TARGET_PROMPTS

    keys = list(targets.keys())
    embeddings = None
    if embed_func is not None and keys:
        try:
            embeddings = embed_func([targets[k].get("aiPrompts", [k]) for k in keys])
        except Exception as exc:
            logger.warning("Failed to embed target prompts: %s", exc)

    content_str = json.dumps(keys, sort_keys=True)
    version = hashlib.sha256(content_str.encode()).hexdigest()[:12]
    now = time.time()

    with _lock:
        _catalog_state["version"] = version
        _catalog_state["updated_at"] = now
        _catalog_state["targets"] = targets
        _catalog_state["target_keys"] = keys
        if embeddings is not None:
            _catalog_state["target_embeddings"] = embeddings

    return {
        "status": "synced",
        "version": version,
        "categoryCount": 6,
        "targetCount": len(targets),
    }
