#!/usr/bin/env python3
"""Read-only ZIP preflight using the backend DatasetImport preview and v1 rules.
No commit, source edits, audit writes, training or network access.
"""
import argparse
import os
import sys
import json
import shutil
import tempfile
import uuid
from pathlib import Path
from types import SimpleNamespace
import yaml
# Backend exception type lives in the installed immutable pilot artifact.
sys.path.insert(0,os.environ.get('AI01_PILOT_DIR',str(Path.home()/'Work/datasetai/06-benchmarks/ai01-pilot-v1')))
from dataset_import import DatasetImport, text
from dataset_package import VERSION, check_layout, row_errors
from review_core import Invalid

REPO=Path(__file__).resolve().parents[3]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('zip',type=Path)
    parser.add_argument('--catalog',type=Path,default=REPO/'docs/ai01-admin/dataset-package/catalog.json')
    parser.add_argument('--ontology',type=Path,default=REPO/'docs/ai01-admin/dataset-package/sign-ontology.json')
    parser.add_argument('--inventory',type=Path,help='Trusted JSONL inventory of current development images')
    parser.add_argument('--references',type=Path,help='Trusted JSONL inventory of protected reference images')
    parser.add_argument('--report',type=Path)
    args=parser.parse_args()
    report={'schema':VERSION,'zip':str(args.zip),'valid':False,'trainingEligible':False,
            'scope':'offline preflight; backend rechecks live DB, protected images, audit and export gates',
            'crossInventoryChecked':bool(args.inventory and args.references),'errors':[],'items':[]}
    try:
        catalog=json.loads(args.catalog.read_text());signs=json.loads(args.ontology.read_text())['signs']
        load=lambda p: [json.loads(l) for l in p.read_text().splitlines() if l.strip()] if p else []
        with tempfile.TemporaryDirectory(prefix='fixgo-preflight-') as tmp:
            home=Path(tmp)/'reviews'/'fast';home.mkdir(parents=True)
            parent=SimpleNamespace(home=home,rows={r['id']:r for r in load(args.inventory)},reference_rows=load(args.references),quality=SimpleNamespace(load=lambda:{'signs':signs}))
            engine=DatasetImport(parent);batch_id=str(uuid.uuid4());folder=engine.folder(batch_id);(folder/'input').mkdir(parents=True)
            shutil.copyfile(args.zip,folder/'input'/'upload.zip')
            options=dict(categoryId='',targetId='',sourceType='',sourceReference='',rightsType='',rightsEvidence='',groupKey='',generatorTool='',generatedAt='',prompt='',developmentOnly=True,classMapping={},metadataSource='auto')
            # Same default/hard limits as datasetLimits(); a server may configure lower limits.
            limits=dict(maxImages=200,maxUploadBytes=64*1024**2,maxExpandedBytes=256*1024**2,maxImageBytes=10*1024**2,maxEntries=2000,maxRatio=100)
            result=engine.preview('offline',dict(batchId=batch_id,limits=limits,options=options,catalog=catalog,inputs=[dict(name=args.zip.name,stored='upload.zip',size=args.zip.stat().st_size)]))
            assets=folder/'assets';yml=next(iter(assets.rglob('data.yaml')),None)
            try:check_layout(assets,result['assetPaths'] if 'assetPaths' in result else [r['filename'] for r in result['items']],yaml.safe_load(text(yml)) if yml else {},text)
            except Invalid as err:report['errors'].append(str(err))
            cats={c['id']:c for c in catalog['categories'] if c.get('isActive') is not False};targets={t['id']:t for t in catalog['targets'] if t.get('isActive') is not False}
            for row in result['items']:
                errors=list(row['errors'])
                errors+=row_errors(row['sourceMetadata'],row['filename'],row['sha256'],cats,targets,signs,row.get('sourceLabelPath'),row['labelCount'])
                if row.get('duplicateOf') or row.get('duplicateImageId'):errors.append('duplicate: ảnh trùng, không thêm mẫu mới')
                report['items'].append(dict(filename=row['filename'],errors=list(dict.fromkeys(errors)),warnings=row['warnings'],missingInfo=row['missingInfo'],proposedBoxes=row['validLabelCount']))
            report['valid']=not report['errors'] and not any(r['errors'] for r in report['items'])
            report['imageCount']=len(report['items']);report['catalogCapturedAt']=catalog.get('capturedAt')
    except (Invalid,OSError,ValueError,KeyError) as err:report['errors'].append(str(err))
    output=json.dumps(report,ensure_ascii=False,indent=2)
    if args.report:args.report.write_text(output+'\n',encoding='utf-8')
    print(output)
    return 0 if report['valid'] else 1

if __name__=='__main__':raise SystemExit(main())
