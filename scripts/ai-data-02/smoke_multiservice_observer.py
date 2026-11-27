#!/usr/bin/env python3
"""Real image/API integration smoke on exposed development images, not an accuracy test."""
import argparse,asyncio,json,os,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'ai-service'))
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
from multiservice_data import BASE,sha
OUT=BASE/'04-training/multiservice-observer-v2-tested'

async def main(expected_version='fixgo-multiservice-observer-v2-tested'):
    if OUT.exists():raise ValueError('Evidence already exists')
    import torch,httpx
    from fastapi import FastAPI
    from ultralytics import YOLO
    from recommendation.router import router
    from recommendation.multiservice_observer import load_observer
    torch.set_num_threads(2);app=FastAPI();app.include_router(router);app.state.yolo_cls_model=YOLO(str(ROOT/'ai-service/weights/yolov8n-cls-fixgo.pt'));app.state.multiservice_observer=load_observer()
    if app.state.multiservice_observer is None:raise ValueError('Default release unavailable')
    rows=json.loads((BASE/'02-curated/fixgo-multiservice-ai-v1/manifest.json').read_text())['records'];chosen={}
    for code in ['scorched_outlet','visible_water','surface_soiling','broken_part','crack']:
        chosen[code]=sorted([r for r in rows if r['split']=='val' and any(a['code']==code for a in r['proposedAnnotations'])],key=lambda r:r['imageId'])[0]
    results=[]
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://local-test') as client:
        for scope,row in chosen.items():
            image=Path(row['path']);start=time.time();response=await client.post('/ai/v2/diagnose',files={'file':(image.name,image.read_bytes(),'image/jpeg')});response.raise_for_status();result=response.json();analysis=result['observableAnalysis']
            assert analysis['modelVersion']==expected_version and len(analysis['coverage'])==6
            assert analysis['labelStatus']=='AI_UNVERIFIED' and all(p['objectId'] is None for p in analysis['proposals'])
            assert analysis['evaluationStatus']=='limited_scope_evaluated' and analysis['evaluationSampleCount']==91
            assert not analysis['degradedModels'] and analysis['status'] in ['proposed','no_detection']
            results.append({'scope':scope,'imageId':row['imageId'],'imageSha256':sha(image.read_bytes()),'image':str(image),'httpStatus':response.status_code,'elapsedSeconds':time.time()-start,'response':result})
    OUT.mkdir(parents=True);(OUT/'api-smoke.json').write_text(json.dumps({'status':'PASSED','accuracyClaim':False,'mode':'Real category weights + default two-expert observer; CLIP not initialized in isolated ASGI test. Development images only.','cases':results,'mainCategoryWeightsOverwritten':False},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps([{'scope':r['scope'],'httpStatus':r['httpStatus'],'signs':[p['code'] for p in r['response']['observableAnalysis']['proposals']],'elapsedSeconds':r['elapsedSeconds']} for r in results],ensure_ascii=False,indent=2))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,default=OUT);parser.add_argument('--expected-version',default='fixgo-multiservice-observer-v2-tested');args=parser.parse_args();OUT=args.out;asyncio.run(main(args.expected_version))
