#!/usr/bin/env python3
"""Real local ASGI smoke with existing category weights and experimental sign candidate."""
import argparse,asyncio,json,os,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ai-service'))
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
from multiservice_data import BASE
os.environ['OBSERVABLE_CANDIDATE_ENABLED']='true'
os.environ['OBSERVABLE_CANDIDATE_MANIFEST']=str(BASE/'05-models/fixgo-observable-v2/model-manifest.json')

async def main(stable=False,manifest=None,output=None):
    if stable:os.environ['OBSERVABLE_CANDIDATE_MANIFEST']=str(BASE/'05-models/fixgo-observable-v3-stable/model-manifest.json')
    if manifest is not None:os.environ['OBSERVABLE_CANDIDATE_MANIFEST']=str(manifest.resolve())
    import torch,httpx
    from fastapi import FastAPI
    from ultralytics import YOLO
    from recommendation.router import router
    from recommendation.observable_candidate import load_candidate
    torch.set_num_threads(2);app=FastAPI();app.include_router(router)
    app.state.yolo_cls_model=YOLO(str(ROOT/'ai-service/weights/yolov8n-cls-fixgo.pt'))
    app.state.observable_candidate=load_candidate()
    if app.state.observable_candidate is None:raise ValueError('Candidate failed to load')
    # Fixed image chosen from original validation by ID, no success-based search.
    folder=BASE/'02-curated/fixgo-multiservice-ai-v1/images/val';image=next(folder.glob('multi-bef350024ab65f0b87077c.*'))
    started=time.time()
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://local-test') as client:
        response=await client.post('/ai/v2/diagnose',files={'file':(image.name,image.read_bytes(),'image/jpeg')})
    response.raise_for_status();result=response.json()
    if result['observableAnalysis']['status'] in ['disabled','unavailable']:raise ValueError('Candidate inference unavailable')
    evidence={'schema':'fixgo.observable-api-real-smoke.v1','image':str(image),'transport':'Local ASGI, real image decode, existing YOLO category model, real candidate sign inference; CLIP not initialized in this isolated smoke.','httpStatus':response.status_code,'elapsedSeconds':time.time()-started,'response':result,'accuracyClaim':False,'productionActivated':False}
    output=output or BASE/'04-training'/('fixgo-observable-v3-stable' if stable else 'fixgo-observable-v2')/'api-smoke.json'
    with output.open('x') as f:json.dump(evidence,f,ensure_ascii=False,indent=2)
    print(json.dumps({'httpStatus':response.status_code,'category':result.get('suggestedCategoryId'),'candidateStatus':result['observableAnalysis']['status'],'proposals':len(result['observableAnalysis']['proposals']),'evidence':str(output)},ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--stable',action='store_true');parser.add_argument('--manifest',type=Path);parser.add_argument('--output',type=Path);args=parser.parse_args();asyncio.run(main(args.stable,args.manifest,args.output))
