"""Validate prepared source supervision; train ONLY on explicit future CLI request.
No call from Admin or import can start training. No activation or production copy.
"""
import argparse
import csv
import gzip
import hashlib
import json
from collections import defaultdict
from pathlib import Path


def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()


def validate(root, raw):
    root, raw = root.resolve(), raw.resolve()
    if root.is_relative_to(raw): raise ValueError('Prepared dataset must be outside raw')
    pins = json.loads((root/'SHA256SUMS.json').read_text())
    for rel, expected in pins.items():
        p = (root/rel).resolve()
        if not p.is_relative_to(root) or not p.is_file() or sha(p) != expected: raise ValueError('Artifact checksum mismatch: '+rel)
    summary = json.loads((root/'summary.json').read_text())
    if summary.get('approvedGroundTruth') is not False or summary.get('trained') is not False: raise ValueError('Not a preparation-only source dataset')
    records = [json.loads(l) for l in (root/'records.jsonl').read_text().splitlines()]
    if len(records)!=summary['counts']['scanned']: raise ValueError('Record count mismatch')
    for r in records:
        expected='val' if int(hashlib.sha256(('fixgo-source-v1:'+r['leakageGroup']).encode()).hexdigest()[:8],16)/0xffffffff<.2 else 'train'
        if r['developmentSplit']!=expected or r.get('approvedGroundTruth') is not False or r.get('benchmarkEligible') is not False:raise ValueError('Invalid frozen split/source supervision markers')
        if any(t['included'] for t in r['tasks'].values()) and r.get('partition')!='development_unverified':raise ValueError('Quarantined image included in trial')
    split_by_id={r['id']:r['developmentSplit'] for r in records}
    crossing={}
    for field in ['sha256','pixelSha256','sourceFamilyCandidate','leakageGroup']:
        groups=defaultdict(set)
        for r in records:
            if r.get(field):groups[r[field]].add(r['developmentSplit'])
        crossing[field]=sum(len(s)>1 for s in groups.values())
        if crossing[field]:raise ValueError('Cross-split leakage: '+field)
    near_cross=0;near_pairs=0
    with gzip.open(root/'near-pairs.csv.gz','rt') as f:
        for pair in csv.DictReader(f):
            near_pairs+=1;near_cross+=split_by_id[pair['a_id']]!=split_by_id[pair['b_id']]
    if near_cross:raise ValueError('pHash pair crosses split')
    for r in records:
        image=(raw/r['path']).resolve();label=(raw/r['annotationPath']).resolve()
        if not image.is_relative_to(raw) or not label.is_relative_to(raw):raise ValueError('Source path escape')
        if sha(image)!=r['sha256'] or (sha(label) if label.exists() else None)!=r['annotationSha256']:raise ValueError('Source changed: '+r['id'])
    normalized=json.loads((root/'normalized-mapping.json').read_text());mapping={e['mappingKey']:e for e in normalized['entries']}
    meta={e['dataset']:e['sourceYamlSha256'] for e in mapping.values()}
    for ds,expected in meta.items():
        if sha(raw/ds/'data.yaml')!=expected:raise ValueError('Source YAML changed')
    task_checks={}
    for task, stats in summary['tasks'].items():
        folder=root/task;classes=json.loads((folder/'class-map.json').read_text());size=len(classes['classIndexToKey'])
        if task=='category_classification':
            folder_order=sorted(classes['classes'],key=lambda c:c['slug'])
            if [classes['classIndexToKey'][str(i)] for i in range(size)]!=[c['key'] for c in folder_order]:raise ValueError('Classifier folder order differs from class map')
        config=json.loads((folder/'experiment.json').read_text())
        expected_dataset=folder/'data.yaml' if task.endswith('detection') else folder
        if Path(config['dataset']).resolve()!=expected_dataset.resolve() or config['task']!=('detect' if task.endswith('detection') else 'classify') or config.get('launchAuthorized') is not False:raise ValueError('Experiment config must point only to prepared data, with training disabled')
        selected=[r for r in records if r['tasks'][task]['included']]
        if len(selected)!=stats['images']:raise ValueError('Task count mismatch')
        for r in selected:
            if task=='category_classification':
                entry=next(c for c in classes['classes'] if c['key']==r['tasks'][task]['labels'][0]);image=folder/r['developmentSplit']/entry['slug']/(r['id']+Path(r['path']).suffix.lower())
            else:
                image=folder/'images'/r['developmentSplit']/(r['id']+Path(r['path']).suffix.lower())
                label=folder/'labels'/r['developmentSplit']/(r['id']+'.txt')
                lines=label.read_text().splitlines()
                if len(lines)!=len(r['annotations']):raise ValueError('Dropped source annotation')
                for line,a in zip(lines,r['annotations']):
                    parts=line.split();cid=int(parts[0]);coords=list(map(float,parts[1:]))
                    if len(coords)!=4 or not 0<=cid<size or any(not 0<=v<=1 for v in coords) or coords[2]<=0 or coords[3]<=0:raise ValueError('Invalid derived YOLO label')
                    # Validate semantic class and exact derived geometry, not only format.
                    e=next(mapping[k] for k in r['mappingKeys'] if mapping[k]['classId']==a['classId'])
                    key=e['catalogTargetCandidates'][0]['targetId'] if task=='object_detection' else e['normalizedSignCandidate']
                    if classes['classIndexToKey'][str(cid)]!=key or any(abs(v-b)>1e-7 for v,b in zip(coords,a['bbox'])):raise ValueError('Incorrect derived label conversion')
            if not image.is_file() or sha(image)!=r['sha256']:raise ValueError('Copied image mismatch')
        task_checks[task]={'imagesChecked':len(selected),'allClassesMeetTrialMinimum':stats['allClassesMeetTrialMinimum']}
    return {'status':'passed','rawUnchanged':True,'manifestFilesChecked':len(pins),'recordsChecked':len(records),'crossSplitGroups':crossing,'phashPairsChecked':near_pairs,'phashPairsCrossSplit':near_cross,'tasks':task_checks,'trained':False,'approvedGroundTruth':False}


def main():
    p=argparse.ArgumentParser();p.add_argument('--prepared',type=Path,required=True);p.add_argument('--raw',type=Path,required=True)
    p.add_argument('--validation-report',type=Path);p.add_argument('--execute-train',action='store_true');p.add_argument('--acknowledge-unverified-source',action='store_true')
    p.add_argument('--allow-low-support-classes',action='store_true');p.add_argument('--task',choices=['object_detection','visible_sign_detection','category_classification']);p.add_argument('--weights',type=Path);p.add_argument('--output',type=Path)
    a=p.parse_args();report=validate(a.prepared,a.raw)
    if a.validation_report:
        target=a.validation_report.resolve()
        if target.is_relative_to(a.raw.resolve()) or target.is_relative_to(a.prepared.resolve()):p.error('Validation report must be outside immutable source/export')
        with target.open('x') as f:json.dump(report,f,ensure_ascii=False,indent=2)
    print(json.dumps(report,ensure_ascii=False),flush=True)
    if not a.execute_train:return
    if not a.acknowledge_unverified_source or not a.task or not a.weights or not a.weights.is_file() or not a.output:p.error('Explicit unverified-source acknowledgement, task, local weights and new experiment output required')
    allowed=(Path.home()/'Work/datasetai/03-experiments').resolve();output=a.output.resolve()
    if output==allowed or not output.is_relative_to(allowed) or output.exists():p.error('Output must be a NEW child of ~/Work/datasetai/03-experiments')
    if not report['tasks'][a.task]['allClassesMeetTrialMinimum'] and not a.allow_low_support_classes:p.error('Some classes lack the declared minimum; review support counts first, or explicitly acknowledge low-support classes')
    config=json.loads((a.prepared/a.task/'experiment.json').read_text())
    from ultralytics import YOLO
    model=YOLO(str(a.weights.resolve()))
    if model.task!=config['task']:p.error('Local model task must match prepared task (detect/classify); no implicit conversion/download')
    # Reached only by a future, explicit user invocation. Never copy best.pt into
    # production weights; candidate stays in this isolated experiment directory.
    model.train(data=config['dataset'],epochs=config['epochs'],imgsz=config['imgsz'],batch=config['batch'],seed=config['seed'],
                project=str(output.parent),name=output.name,exist_ok=False,device='cpu',workers=0)


if __name__=='__main__':main()
