import base64
import logging
from pathlib import Path
from typing import Optional, Union
import cv2
import httpx
import numpy as np

logger = logging.getLogger("ai-service.recommendation.image")


def decode_image_to_cv2(image_input: Union[bytes, str, None]) -> Optional[np.ndarray]:
    if image_input is None:
        return None
    try:
        if isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if isinstance(image_input, str):
            image_str = image_input.strip()
            if image_str.startswith("data:image") or ";base64," in image_str:
                base64_data = image_str.split(";base64,")[-1]
                img_bytes = base64.b64decode(base64_data)
                return cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)

            if image_str.startswith("http://") or image_str.startswith("https://"):
                with httpx.Client(timeout=8.0) as client:
                    resp = client.get(image_str, headers={"User-Agent": "FixGo-AI-Client/1.0"})
                    if resp.status_code == 200:
                        return cv2.imdecode(np.frombuffer(resp.content, np.uint8), cv2.IMREAD_COLOR)

            local_path = Path(image_str)
            if local_path.is_file():
                return cv2.imread(str(local_path))
    except Exception as exc:
        logger.warning("Could not decode image: %s", exc)
    return None
