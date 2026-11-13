"""Offline scored-trial aggregation. No model, network, DB, image loader or runtime grants."""
import argparse
import hashlib
import json
import math
from collections import Counter
from pathlib import Path

OUTCOMES={'SCORED','NO_FACE','MULTIPLE_FACES','QUALITY_REJECTED','INCONCLUSIVE','TECHNICAL_ERROR','TIMEOUT'}
LABELS={'identity':{'genuine','impostor'},'pad':{'bona_fide','print','screen','video_replay'}}
FIELDS={'trial_id','task','label','outcome','score','cpu_inference_ms','end_to_end_ms'}

def rate(n,d):return n/d if d else None

def percentile(values,q):
    if not values:return None
    values=sorted(values);p=(len(values)-1)*q;lo=math.floor(p);hi=math.ceil(p)
    return values[lo]+(values[hi]-values[lo])*(p-lo)

def summarize(rows,identity_threshold,pad_threshold):
    if type(identity_threshold) not in (int,float) or not math.isfinite(identity_threshold) or not -1<=identity_threshold<=1:raise ValueError('Invalid identity threshold')
    if type(pad_threshold) not in (int,float) or not math.isfinite(pad_threshold) or not 0<=pad_threshold<=1:raise ValueError('Invalid PAD threshold')
    seen=set()
    for r in rows:
        if not isinstance(r,dict):raise ValueError('Trial object required')
        if set(r)-FIELDS:raise ValueError('Only deidentified score/outcome/latency fields allowed; no images or biometric vectors')
        if not isinstance(r.get('trial_id'),str) or not r['trial_id'] or r['trial_id'] in seen:raise ValueError('Unique trial ID required')
        seen.add(r['trial_id'])
        if r.get('task') not in LABELS or r.get('label') not in LABELS[r['task']] or r.get('outcome') not in OUTCOMES:raise ValueError('Invalid task/label/outcome')
        if r['outcome']=='SCORED':
            v=r.get('score');minimum=-1 if r['task']=='identity' else 0
            if type(v) not in (int,float) or not math.isfinite(v) or not minimum<=v<=1:raise ValueError('Finite task score required')
        elif r.get('score') is not None:raise ValueError('Nonconclusive trials must not invent a score')
        for field in ['cpu_inference_ms','end_to_end_ms']:
            v=r.get(field)
            if v is not None and (type(v) not in (int,float) or not math.isfinite(v) or v<0):raise ValueError('Invalid measured latency')
    result={'rate_definition':'Conditional scored-trial rates; report nonresponses and operational nonacceptance separately','trial_count':len(rows),'status':'NOT_MEASURED' if not rows else 'AGGREGATED_NOT_SECURITY_CERTIFIED','thresholds':{'identity':identity_threshold,'pad_real_score':pad_threshold}}
    for task,labels in LABELS.items():
        subset=[r for r in rows if r['task']==task];details={}
        threshold=identity_threshold if task=='identity' else pad_threshold
        for label in sorted(labels):
            trials=[r for r in subset if r['label']==label];scored=[r for r in trials if r['outcome']=='SCORED']
            accepted=sum(r['score']>=threshold for r in scored)
            details[label]={'trials':len(trials),'scored':len(scored),'accepted':accepted,'below_threshold':len(scored)-accepted,
                'unscored':len(trials)-len(scored),'outcomes':dict(Counter(r['outcome'] for r in trials)),
                'outcome_rates':{o:rate(sum(r['outcome']==o for r in trials),len(trials)) for o in sorted(OUTCOMES)},
                'scored_coverage':rate(len(scored),len(trials))}
        measured={}
        for field in ['cpu_inference_ms','end_to_end_ms']:
            values=[r[field] for r in subset if r.get(field) is not None]
            measured[field]={'n':len(values),'p50':percentile(values,.5),'p95':percentile(values,.95)}
        result[task]={'by_label':details,'latency':measured}
    i=result['identity']['by_label'];p=result['pad']['by_label'];g=i['genuine'];imp=i['impostor'];b=p['bona_fide']
    result['identity'].update(fmr=rate(imp['accepted'],imp['scored']),fnmr=rate(g['below_threshold'],g['scored']),
        tar_at_configured_threshold=rate(g['accepted'],g['scored']),achieved_fmr_at_that_threshold=rate(imp['accepted'],imp['scored']),
        genuine_operational_non_accept_rate=rate(g['below_threshold']+g['unscored'],g['trials']))
    result['pad'].update(bpcer=rate(b['below_threshold'],b['scored']),
        apcer_by_attack={a:rate(p[a]['accepted'],p[a]['scored']) for a in ['print','screen','video_replay']},
        bona_fide_operational_non_accept_rate=rate(b['below_threshold']+b['unscored'],b['trials']),
        bpnrr=rate(b['unscored'],b['trials']),apnrr_by_attack={a:rate(p[a]['unscored'],p[a]['trials']) for a in ['print','screen','video_replay']},
        missing_attack_types=[a for a in ['print','screen','video_replay'] if p[a]['trials']==0])
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--trials',required=True);parser.add_argument('--protocol',required=True);parser.add_argument('--out',required=True);args=parser.parse_args()
    protocol=json.loads(Path(args.protocol).read_text())
    if protocol.get('approved') is not True or not protocol.get('approval_reference') or protocol.get('split')!='held_out_test':raise SystemExit('Approved protocol and held-out test declaration required; this tool does not authorize collection')
    rows=[json.loads(line) for line in Path(args.trials).read_text().splitlines() if line.strip()]
    if not rows:raise SystemExit('No measured trials; no metric report generated')
    result=summarize(rows,protocol['identity_threshold'],protocol['pad_threshold'])
    result['trial_file_sha256']=hashlib.sha256(Path(args.trials).read_bytes()).hexdigest()
    result['protocol_file_sha256']=hashlib.sha256(Path(args.protocol).read_bytes()).hexdigest()
    result['provenance']={k:protocol.get(k) for k in ['protocol_id','approval_reference','dataset_manifest_sha256','identity_model_version','pad_model_version','threshold_selection_reference']}
    if any(not v for v in result['provenance'].values()):raise SystemExit('Protocol/model/data/threshold provenance required')
    with open(args.out,'x') as f:json.dump(result,f,indent=2,allow_nan=False);f.write('\n')
