#!/usr/bin/env python3
"""Publish a metadata-only pilot update after the frozen quality comparison."""
import json,shutil
from datetime import datetime,timezone
from pathlib import Path
from multiservice_data import BASE,sha
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'ai-service/weights/multiservice-observer-v2'
OUT=ROOT/'ai-service/weights/multiservice-observer-v2-tested'
EXPERIMENT=BASE/'04-training/multiservice-challenge-v1'

def operational_signature(release):
    return {'models':release['models'],'classes':release['classes'],'coverage':release['coverage']}

def main():
    if OUT.exists():raise ValueError('Tested pilot release already exists')
    report=json.loads((EXPERIMENT/'report.json').read_text());protocol=json.loads((EXPERIMENT/'protocol.json').read_text());source=json.loads((SOURCE/'release.json').read_text())
    if sha((SOURCE/'release.json').read_bytes())!=protocol['releaseSha256']['v2']:raise ValueError('Baseline changed after test')
    if report['promoteConservativePilot'] is not False:raise ValueError('This metadata-only update is for the retained v2 baseline')
    journal=[json.loads(line) for line in (EXPERIMENT/'predictions.jsonl').read_text().splitlines()]
    if len(journal)!=report['cases'] or len({r['caseId'] for r in journal})!=report['cases']:raise ValueError('Incomplete experiment')
    shutil.copytree(SOURCE,OUT);(OUT/'evaluation').mkdir();shutil.copy2(EXPERIMENT/'report.json',OUT/'evaluation/report.json');shutil.copy2(EXPERIMENT/'protocol.json',OUT/'evaluation/protocol.json')
    release=json.loads((OUT/'release.json').read_text());release['modelVersion']='fixgo-multiservice-observer-v2-tested';release['quality']['evaluation']={'status':'limited_scope_evaluated','report':'evaluation/report.json','reportSha256':sha((OUT/'evaluation/report.json').read_bytes()),'protocol':'evaluation/protocol.json','protocolSha256':sha((OUT/'evaluation/protocol.json').read_bytes()),'cases':report['cases'],'productionValidated':False,'retainedBaseline':'v2','rejectedCandidate':'v3','note':'Same model weights, class availability, thresholds and context as evaluated v2. Metadata update only; no claim of complete multiservice accuracy.'}
    assert operational_signature(release)==operational_signature(source)
    (OUT/'release.json').write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n')
    receipt={'updatedAtUtc':datetime.now(timezone.utc).isoformat(),'modelVersion':release['modelVersion'],'releaseSha256':sha((OUT/'release.json').read_bytes()),'retainedModel':'v2','candidateV3Promoted':False,'operationalBehaviorUnchanged':True,'metadataOnlyUpdate':True,'productionValidated':False,'cases':report['cases'],'suiteCounts':report['suiteCounts'],'reservedCrackMetrics':report['results']['v2']['reservedCrack']['pooledScoped'],'cleanScopedMetrics':report['results']['v2']['clean']['pooledScoped'],'sourceReport':str(EXPERIMENT/'report.json'),'sourceReportSha256':sha((EXPERIMENT/'report.json').read_bytes()),'predictionsSha256':sha((EXPERIMENT/'predictions.jsonl').read_bytes()),'testExposed':True,'limitations':report['limitations']}
    (EXPERIMENT/'retained-release.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps(receipt,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
