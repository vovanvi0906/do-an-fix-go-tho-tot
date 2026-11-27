#!/usr/bin/env python3
"""Per-sign activation gate on top of the tested v2 pilot.

Only availability changes: weights, thresholds and context policy stay identical.
A sign stays enabled only if one already-run, non-watermarked held-out suite gives
enough positive images and both precision and recall reach the gate. Everything else
is reported as unavailable ("chưa xác định"), never as a normal/negative result.
The results used here were already exposed; the gate does not tune any threshold.
"""
import csv,json,shutil
from datetime import datetime,timezone
from pathlib import Path
from multiservice_data import BASE,sha
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'ai-service/weights/multiservice-observer-v2-tested'
OUT=ROOT/'ai-service/weights/multiservice-observer-v2-gated'
EXPERIMENT=BASE/'04-training/multiservice-challenge-v1'
EVIDENCE=ROOT/'docs/ai-data-02/evidence/multiservice-sign-gate-v1.json'
GATE={'minPositiveImages':20,'minPrecision':0.6,'minRecall':0.6,'version':'v2','eligibleSuites':['clean','reservedCrack']}

def decide(rows,codes):
    decisions={}
    for code in codes:
        evidence=[r for r in rows if r['version']==GATE['version'] and r['code']==code and r['suite'] in GATE['eligibleSuites']]
        passing=[r for r in evidence if int(r['positiveImages'])>=GATE['minPositiveImages'] and r['precision'] and r['recall'] and float(r['precision'])>=GATE['minPrecision'] and float(r['recall'])>=GATE['minRecall']]
        support=max([int(r['positiveImages']) for r in evidence] or [0])
        reason='passed_held_out_gate' if passing else ('no_held_out_evaluation' if not evidence else ('insufficient_held_out_positives' if support<GATE['minPositiveImages'] else 'below_held_out_quality_gate'))
        decisions[code]={'enabled':bool(passing),'reason':reason,'evidence':[{k:r[k] for k in ['suite','positiveImages','TP','FP','FN','precision','recall','negativeScopeImages','negativeScopeImagesWithAlerts']} for r in evidence]}
    return decisions

def main():
    if OUT.exists():raise ValueError('Gated release already exists')
    source=json.loads((SOURCE/'release.json').read_text())
    rows=list(csv.DictReader((EXPERIMENT/'per-sign-results.csv').open()))
    decisions=decide(rows,list(source['classes']))
    shutil.copytree(SOURCE,OUT)
    release=json.loads((OUT/'release.json').read_text())
    release['modelVersion']='fixgo-multiservice-observer-v2-gated'
    for code,meta in release['classes'].items():
        meta['enabled']=meta.get('enabled',True) and decisions[code]['enabled']
        if not meta['enabled']:meta['unavailableReason']=decisions[code]['reason']
    on={c for c,m in release['classes'].items() if m['enabled']}
    for group in release['coverage']:
        group['availableSignCodes']=[c for c in group['signCodes'] if c in on]
        group['unavailableSignCodes']=[c for c in group['signCodes'] if c not in on]
    release['quality']['signGate']={**GATE,'resultsCsv':'evaluation/per-sign-results.csv','note':'Availability-only gate decided from results already exposed in multiservice-challenge-v1. No threshold or weight was tuned on them.'}
    shutil.copy2(EXPERIMENT/'per-sign-results.csv',OUT/'evaluation/per-sign-results.csv')
    assert release['models']==source['models']
    (OUT/'release.json').write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n')
    receipt={'createdAtUtc':datetime.now(timezone.utc).isoformat(),'modelVersion':release['modelVersion'],'releaseSha256':sha((OUT/'release.json').read_bytes()),'baseRelease':source['modelVersion'],'weightsAndThresholdsUnchanged':True,'gate':GATE,'enabledSigns':sorted(on),'decisions':decisions,'productionValidated':False,'testExposed':True}
    EVIDENCE.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:receipt[k] for k in ['modelVersion','enabledSigns']},indent=2));print({c:d['reason'] for c,d in decisions.items()})
if __name__=='__main__':main()
