#!/usr/bin/env python3
"""Local experimental sign prediction; no root-cause or service diagnosis."""
import argparse,hashlib,json,os
from pathlib import Path
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import torch
from ultralytics import YOLO

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--image',type=Path,required=True);parser.add_argument('--bundle',type=Path,default=Path('/home/vanvi/Work/datasetai/05-models/fixgo-observable-v1'));parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    if args.output.exists():raise ValueError('Output exists; choose a new output folder')
    m=json.loads((args.bundle/'model-manifest.json').read_text());weights=(args.bundle/m['weights']).resolve()
    if not weights.is_relative_to(args.bundle.resolve()) or hashlib.sha256(weights.read_bytes()).hexdigest()!=m['weightsSha256']:raise ValueError('Weights path/hash mismatch')
    torch.set_num_threads(2);model=YOLO(str(weights));expected={i:c['name'] for i,c in enumerate(m['classes'])}
    if model.names!=expected:raise ValueError('Model class mapping mismatch')
    taxonomy=json.loads((args.bundle/'taxonomy.json').read_text());labels={c['code']:c for c in taxonomy['classes']}
    args.output.mkdir(parents=True)
    result=model.predict(source=str(args.image),imgsz=m['imgsz'],conf=m['threshold'],device='cpu',save=False,verbose=False)[0]
    proposals=[]
    for c,s,xy in zip(result.boxes.cls.tolist(),result.boxes.conf.tolist(),result.boxes.xyxyn.tolist()):
        code=m['classes'][int(c)]['code'];proposals.append({'code':code,'displayName':labels[code]['displayNameVi'],'definition':labels[code]['definition'],'xyxy':xy,'score':s,'scoreType':'YOLO confidence, not calibrated fault probability','status':'AI_PROPOSED','objectId':None})
    result.save(filename=str(args.output/'prediction.jpg'))
    report={'image':str(args.image.resolve()),'modelSha256':m['weightsSha256'],'proposals':proposals,'absenceMeans':'NO_SUPPORTED_SIGN_DETECTED_NOT_PROOF_NORMAL','faultDiagnosis':None,'deviceAssociation':'NOT_INFERRED','status':'EXPERIMENTAL_AI_OUTPUT'}
    (args.output/'prediction.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
