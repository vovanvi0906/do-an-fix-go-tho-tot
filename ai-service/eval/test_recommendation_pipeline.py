import sys
from pathlib import Path
import unittest
import torch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from recommendation.category_classifier import evaluate_categories, fuse_category_scores
from recommendation.target_matcher import match_targets
from recommendation.catalog_manager import sync_catalog, get_catalog_state


class RecommendationPipelineTests(unittest.TestCase):
    def test_ensemble_agreement_boosts_confidence(self):
        clip = {"dien_lanh": 0.85, "sua_dien": 0.15}
        yolo = {"dien_lanh": 0.80, "sua_dien": 0.20}
        cat, conf, candidates, source = evaluate_categories(clip, yolo)
        self.assertEqual(cat, "dien-lanh")
        self.assertEqual(source, "ensemble")
        self.assertGreater(conf, 0.75)
        self.assertEqual(len(candidates), 2)

    def test_yolo_unclear_falls_back_to_clip(self):
        clip = {"sua_nuoc": 0.82, "sua_dien": 0.18}
        yolo = {"other_unclear": 0.90, "sua_nuoc": 0.10}
        cat, conf, candidates, source = evaluate_categories(clip, yolo)
        self.assertEqual(cat, "sua-nuoc")
        self.assertEqual(source, "clip")

    def test_ambiguous_image_abstains(self):
        clip = {"dien_lanh": 0.51, "sua_dien": 0.49}
        yolo = {"dien_lanh": 0.50, "sua_dien": 0.50}
        cat, conf, candidates, source = evaluate_categories(clip, yolo)
        self.assertIsNone(cat)
        self.assertIsNone(conf)

    def test_multimodal_description_boosts_matching_category(self):
        clip = {"sua_dien": 0.40, "thiet_bi": 0.60}
        yolo = {"sua_dien": 0.42, "thiet_bi": 0.58}
        cat, conf, candidates, source = evaluate_categories(clip, yolo, description="chập điện công tắc")
        self.assertEqual(cat, "sua-dien")
        self.assertIn("text", source)

    def test_target_matcher_restricts_to_category_and_ranks(self):
        targets = {
            "cong-tac-dien": {"id": "t1", "name": "Công tắc điện", "category": "sua-dien"},
            "o-cam-dien": {"id": "t2", "name": "Ổ cắm điện", "category": "sua-dien"},
            "voi-nuoc": {"id": "t3", "name": "Vòi nước", "category": "sua-nuoc"},
        }
        res = match_targets(img_feat=None, category_slug="sua-dien", targets_dict=targets, target_embeddings=None, top_k=3)
        self.assertEqual(len(res), 0)

        # Vector image feature (1 x 4)
        img_feat = torch.tensor([[1.0, 0.0, 0.0, 0.0]], dtype=torch.float32)
        # 2 target embeddings: first aligned with img_feat, second orthogonal
        target_embs = (
            ["cong-tac-dien", "o-cam-dien"],
            torch.tensor([[0.9, 0.1, 0.0, 0.0], [0.2, 0.8, 0.0, 0.0]], dtype=torch.float32),
        )
        res = match_targets(
            img_feat=img_feat,
            category_slug="sua-dien",
            targets_dict=targets,
            target_embeddings=target_embs,
            top_k=2,
        )
        self.assertEqual(len(res), 2)
        self.assertEqual(res[0]["targetId"], "t1")
        self.assertEqual(res[0]["targetCategory"], "sua-dien")
        self.assertGreater(res[0]["confidence"], res[1]["confidence"])

    def test_target_matcher_negative_below_similarity_threshold(self):
        targets = {
            "cong-tac-dien": {"id": "t1", "name": "Công tắc điện", "category": "sua-dien"},
        }
        img_feat = torch.tensor([[1.0, 0.0, 0.0, 0.0]], dtype=torch.float32)
        # Target embedding is completely orthogonal (cosine sim = 0.05 < 0.20 min_similarity)
        target_embs = (
            ["cong-tac-dien"],
            torch.tensor([[0.05, 0.99, 0.0, 0.0]], dtype=torch.float32),
        )
        res = match_targets(
            img_feat=img_feat,
            category_slug="sua-dien",
            targets_dict=targets,
            target_embeddings=target_embs,
            top_k=2,
            min_similarity=0.20,
        )
        self.assertEqual(len(res), 0)

    def test_target_matcher_negative_target_not_in_category(self):
        targets = {
            "voi-nuoc": {"id": "t3", "name": "Vòi nước", "category": "sua-nuoc"},
        }
        img_feat = torch.tensor([[1.0, 0.0, 0.0, 0.0]], dtype=torch.float32)
        target_embs = (
            ["voi-nuoc"],
            torch.tensor([[1.0, 0.0, 0.0, 0.0]], dtype=torch.float32),
        )
        # Querying sua-dien when only sua-nuoc exists
        res = match_targets(
            img_feat=img_feat,
            category_slug="sua-dien",
            targets_dict=targets,
            target_embeddings=target_embs,
        )
        self.assertEqual(len(res), 0)

    def test_catalog_manager_sync_and_state(self):
        res = sync_catalog()
        self.assertEqual(res["status"], "synced")
        self.assertIn("version", res)
        state = get_catalog_state()
        self.assertEqual(state["version"], res["version"])
        self.assertGreater(len(state["targets"]), 0)


if __name__ == "__main__":
    unittest.main()
