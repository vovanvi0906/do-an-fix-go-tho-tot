import os,sys,unittest
sys.path.insert(0,os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import torch
from recommendation.target_matcher import match_targets,select_target,TARGET_MIN_MARGIN

def setup(sims):
    keys=list(sims);feats=torch.eye(len(keys))
    img=torch.tensor([[sims[k] for k in keys]])
    meta={k:{'name':k,'category':'sua-dien'} for k in keys}
    return img,meta,(keys,feats)

class TargetMatcherTests(unittest.TestCase):
    def test_non_visual_service_task_is_never_matched_from_pixels(self):
        img,meta,emb=setup({'kiem-tra-khao-sat-su-co-dien':.40,'tu-dien-bang-dien':.30})
        self.assertEqual([c['targetId'] for c in match_targets(img,'sua-dien',meta,emb)],['tu-dien-bang-dien'])

    def test_catalog_flag_can_mark_other_targets_non_visual(self):
        img,meta,emb=setup({'a':.40,'b':.30});meta['a']['visual']=False
        self.assertEqual([c['targetId'] for c in match_targets(img,'sua-dien',meta,emb)],['b'])

    def test_near_tie_returns_options_without_auto_selection(self):
        img,meta,emb=setup({'o-cam-thong-minh-hen-gio':.3034,'o-cam-dien':.3023,'cong-tac-dien':.29})
        candidates=match_targets(img,'sua-dien',meta,emb)
        self.assertEqual(len(candidates),3);self.assertIsNone(select_target(candidates))

    def test_clear_winner_is_selected(self):
        img,meta,emb=setup({'o-cam-dien':.32,'cong-tac-dien':.32-TARGET_MIN_MARGIN-.001})
        self.assertEqual(select_target(match_targets(img,'sua-dien',meta,emb))['targetId'],'o-cam-dien')

    def test_single_candidate_and_empty_are_handled(self):
        img,meta,emb=setup({'o-cam-dien':.32})
        self.assertEqual(select_target(match_targets(img,'sua-dien',meta,emb))['targetId'],'o-cam-dien')
        self.assertIsNone(select_target([]))

if __name__=='__main__':unittest.main()
