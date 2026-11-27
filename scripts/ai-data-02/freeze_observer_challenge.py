#!/usr/bin/env python3
"""Freeze source-only AI review decisions before any challenge inference."""
import json
from datetime import datetime,timezone
from prepare_observer_challenge import ROOT,SCOPES
from build_reviewed_scope_packs import checked
from multiservice_data import sha
ALL=['broken_part','crack','exposed_conductor','peeling_surface','socket_damage_or_displacement','stain_or_discoloration']

def main():
    path=ROOT/'reviewed-labels.json'
    if path.exists():raise ValueError('Reviewed labels already frozen')
    candidate=json.loads((ROOT/'candidate-index.json').read_text());index={r['reviewId']:r for r in candidate['records']};decisions={}
    def put(key,scope=None,boxes=None,negatives=(),suite='clean',note='Source box visually reviewed; aggregate/native envelope is a localization proxy.'):
        row=index[key];annotations=[]
        if scope:
            if boxes is None:boxes=[a['xyxy'] for a in row['annotations'] if a['sourceClass'] in SCOPES[row['scope']]]
            if not boxes:raise ValueError('No reviewed positive geometry')
            annotations=[{'code':scope,'xyxy':checked(b)} for b in boxes]
        decisions[key]={'reviewId':key,'imageId':row['imageId'],'image':row['path'],'sha256':row['sha256'],'sheet':row['sheet'],'sourceFamily':row['sourceFamily'],'suite':suite,'scopes':([scope] if scope else [])+list(negatives),'annotations':annotations,'note':note,'labelStatus':'AI_VISUAL_REVIEW_NOT_EXPERT_GROUND_TRUTH'}
    for n in [1,2,3,5,6]:put(f'Q{n:03}','broken_part')
    for n in [7,8]:put(f'Q{n:03}','exposed_conductor',suite='watermarked_diagnostic_only')
    for n in [19,21,22]:put(f'Q{n:03}','socket_damage_or_displacement',suite='watermarked_diagnostic_only')
    for n in [15,16,17,18]:put(f'Q{n:03}','peeling_surface')
    put('Q014','stain_or_discoloration',[[0,0,1,.28],[0,.5,1,1]],['peeling_surface'],note='Green/yellow discoloration on intact siding; no visible peeling. Approximate reviewed region envelopes.')
    put('Q024','socket_damage_or_displacement')
    for n in [25,26]:put(f'Q{n:03}','peeling_surface',negatives=['stain_or_discoloration'],note='Missing/blistered white paint layer, not confirmed discoloration. Relabeled before inference.')
    put('Q029','stain_or_discoloration',[[.25,.43,1,.83]],note='Brown discoloration on trim; excludes patterned carpet. Approximate reviewed envelope.')
    put('Q030','stain_or_discoloration',[[.15,.53,.33,.99],[.42,.52,.59,.99],[.80,.51,.97,.99]],note='Three visible discoloration streaks; right streak omitted by source, added before inference.')
    for n in [32,35,36]:put(f'Q{n:03}','crack')
    for n in [37,40,43,45,46,47]:put(f'Q{n:03}',negatives=ALL,note='No visible evidence of these six scoped signs; does not mean fault-free or safe device.')
    for n in [41,48]:put(f'Q{n:03}',negatives=[c for c in ALL if c!='stain_or_discoloration'],note='Scoped negatives only; material pattern/age discoloration ambiguous, not scored for stain.')
    put('Q023',negatives=['socket_damage_or_displacement'],note='Open wiring installation without a displaced socket face; not a normal-device claim.')
    excluded=[]
    for key,row in index.items():
        if key in decisions:continue
        reason=('POSSIBLE_PRIOR_SAME_BLUE_WALL_SCENE' if key in ['Q031','Q034'] else 'INCOMPLETE_CRACK_LABELS' if key=='Q033' else 'STOCK_OR_EDITORIAL_OR_ILLUSTRATION' if key in ['Q004','Q012','Q020','Q038','Q039','Q042','Q044'] else 'AMBIGUOUS_VISIBLE_CLASS_REQUIRES_BETTER_EVIDENCE')
        excluded.append({'reviewId':key,'imageId':row['imageId'],'reason':reason})
    report={'schema':'fixgo.multiservice-challenge-labels.v1','frozenAtUtc':datetime.now(timezone.utc).isoformat(),'candidateIndexSha256':sha((ROOT/'candidate-index.json').read_bytes()),'records':list(decisions.values()),'excluded':excluded,'expertVerified':False,'limitations':['AI review of source-only images before observer inference, not expert ground truth.','Some boxes are native aggregate region/device envelopes; localization proxy.','CLIP source screening may previously have seen these images; this is not fully externally independent data.','Stock-watermarked images are diagnostic-only and never training data or primary clean test.','Unannotated classes are not treated as negatives.','All test images become exposed after this evaluation; do not tune thresholds using their scores.']}
    path.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'cases':len(decisions),'clean':sum(r['suite']=='clean' for r in decisions.values()),'diagnostic':sum(r['suite']!='clean' for r in decisions.values()),'quarantined':len(excluded)},indent=2))
if __name__=='__main__':main()
