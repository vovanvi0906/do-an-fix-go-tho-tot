"""Loopback-only recommendation QA bootstrap; production handlers, no Face lifespan.
Local/cache weights only. No shared main.py or configuration edits.
"""
import os
from pathlib import Path
import sys
from contextlib import asynccontextmanager
os.environ['NODE_ENV']='test'
debug_token_path=Path(__file__).resolve().parents[1]/'.runtime/debug-token'
os.environ['RECOMMENDATION_DEBUG_ENABLED']='true' if debug_token_path.exists() else 'false'
os.environ['RECOMMENDATION_DEBUG_TOKEN']=debug_token_path.read_text().strip() if debug_token_path.exists() else ''
os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['BACKEND_API_URL']='http://127.0.0.1:3108/api'
root=Path(__file__).resolve().parents[2]/'ai-service'
sys.path.insert(0,str(root))
import clip_classifier
from ultralytics import YOLO
from fastapi import FastAPI
from recommendation.router import router

@asynccontextmanager
async def lifespan(app):
    app.state.yolo_cls_model=YOLO(str(root/'weights/yolov8n-cls-fixgo.pt'))
    clip_ready=clip_classifier.load_clip()
    app.state.models_status={'clip':clip_ready,'yolo_cls':True}
    yield

app=FastAPI(lifespan=lifespan)
app.include_router(router)
# Reuse V1 and health production functions without running main.app lifespan.
import main as production
app.add_api_route('/ai/diagnose',production.diagnose,methods=['POST'],response_model=production.DiagnoseResponse)
app.add_api_route('/health',production.health_check,methods=['GET'])
if __name__=='__main__':
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=8108,access_log=False)
