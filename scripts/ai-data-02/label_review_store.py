"""AI review ledger isolated from Studio human journals and all frozen tests."""
import json
from datetime import datetime,timezone
from audit_observable_labels import ROOT
from multiservice_data import sha

def record(decisions,revision=False,root=ROOT):
    index={r['reviewId']:r for r in json.loads((root/'review-index.json').read_text())}
    path=root/'visual-review-events.jsonl';old=[json.loads(l) for l in path.read_text().splitlines()] if path.exists() else [];head=old[-1]['eventHash'] if old else '0'*64;done={e['reviewId'] for e in old}
    with path.open('a') as f:
        for review_id,value in decisions.items():
            if review_id in done and not revision:raise ValueError('Review already exists: '+review_id)
            row=index[review_id];decision={'status':'AI_VISUAL_REVIEW_NOT_EXPERT_GROUND_TRUTH','reviewer':'Codex','reviewedAtUtc':datetime.now(timezone.utc).isoformat(),'reviewId':review_id,'imageId':row['imageId'],'evidenceSheet':row['sheet'],'scope':row['focusCode'],'decision':value,'previousHash':head}
            if review_id in done:decision['supersedesEventHash']=next(e['eventHash'] for e in reversed(old) if e['reviewId']==review_id)
            head=sha(json.dumps(decision,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode());decision['eventHash']=head;f.write(json.dumps(decision,ensure_ascii=False)+'\n');done.add(review_id)
    return len(decisions)

def accept(boxes,note='Visible evidence; approximate region from source-only visual review.'):
    return {'action':'REVISE_SIGN_REGIONS','boxes':boxes,'note':note,'geometryStatus':'AI_APPROXIMATE_NOT_EXPERT_VERIFIED','scopeOnly':True}

def quarantine(reason):return {'action':'QUARANTINE','reason':reason}
