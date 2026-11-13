import os
import sys
import unittest
from pathlib import Path

# Add ai-service to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from ultralytics import YOLO

import clip_classifier
from recommendation.router import router as recommendation_router


class LiveModelInferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = FastAPI(title="Test Real Inference")
        cls.app.include_router(recommendation_router)

        # 1. Load Real YOLO model
        weights_path = root_dir / "weights" / "yolov8n-cls-fixgo.pt"
        cls.has_yolo = weights_path.exists()
        if cls.has_yolo:
            cls.app.state.yolo_cls_model = YOLO(str(weights_path))

        # 2. Load Real CLIP model
        cls.has_clip = clip_classifier.load_clip()
        cls.client = TestClient(cls.app)

    def test_sample_appliance_live_inference(self):
        if not (self.has_yolo and self.has_clip):
            self.skipTest("YOLO or CLIP not available")
        img_path = str(root_dir / "eval" / "images" / "sample_appliance.jpg")
        response = self.client.post("/ai/v2/diagnose", json={"imageUrl": img_path, "description": "bếp từ không nóng"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("\n[LIVE INFERENCE - Appliance]:", data)
        self.assertIn(data["suggestedCategoryId"], ["thiet-bi", "sua-dien", "dien-lanh"])
        self.assertGreater(len(data["targetCandidates"]), 0)
        self.assertIn("Nhận diện", data["observableSigns"][0])
        self.assertEqual(data["engine"], "model")

    def test_sample_garden_live_inference(self):
        if not (self.has_yolo and self.has_clip):
            self.skipTest("YOLO or CLIP not available")
        img_path = str(root_dir / "eval" / "images" / "sample_garden.jpg")
        response = self.client.post("/ai/v2/diagnose", json={"imageUrl": img_path, "description": "cắt tỉa cây vườn"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("\n[LIVE INFERENCE - Garden]:", data)
        self.assertEqual(data["suggestedCategoryId"], "lam-vuon")
        self.assertEqual(data["engine"], "model")

    def test_sample_face_is_ood_or_unclear(self):
        if not (self.has_yolo and self.has_clip):
            self.skipTest("YOLO or CLIP not available")
        img_path = str(root_dir / "eval" / "images" / "sample_face.jpg")
        response = self.client.post("/ai/v2/diagnose", json={"imageUrl": img_path, "description": ""})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("\n[LIVE INFERENCE - Face OOD]:", data)
        # Face is NOT a valid repair category -> must not force a high-confidence target
        if data.get("suggestedCategoryId"):
            # If any category assigned, confidence should be low or marked uncertain
            self.assertTrue(data.get("confidence") is None or data.get("confidence") < 0.85)

    def test_unreadable_image_handling(self):
        response = self.client.post("/ai/v2/diagnose", json={"imageUrl": "invalid_path.jpg", "description": ""})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["engine"], "unavailable")
        self.assertIsNone(data["suggestedCategoryId"])


if __name__ == "__main__":
    unittest.main()
