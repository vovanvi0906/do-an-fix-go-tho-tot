"""Explicit one-time download of pinned official Grounding DINO Tiny; inference stays offline."""
import argparse
import json
import os
from pathlib import Path

MODEL='IDEA-Research/grounding-dino-tiny'
REVISION='a2bb814dd30d776dcf7e30523b00659f4f141c71'
FILES=['config.json','model.safetensors','preprocessor_config.json','tokenizer.json','tokenizer_config.json','special_tokens_map.json','added_tokens.json','vocab.txt','README.md']
DEFAULT_MANIFEST=Path.home()/'.local/share/fixgo-models/grounding-dino-tiny/manifest.json'


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--download',action='store_true',help='Explicitly allow model download for setup only')
    p.add_argument('--manifest',type=Path,default=DEFAULT_MANIFEST)
    p.add_argument('--catalog',type=Path,default=Path(__file__).resolve().parents[2]/'docs/ai-data-audit/evidence/catalog.json')
    a=p.parse_args()
    if a.download:
        os.environ['HF_HUB_OFFLINE']='0';os.environ['TRANSFORMERS_OFFLINE']='0';os.environ.setdefault('HF_HUB_DISABLE_XET','1')
    from huggingface_hub import snapshot_download
    snapshot=Path(snapshot_download(MODEL,revision=REVISION,allow_patterns=FILES,local_files_only=not a.download))
    # Import after download so the offline worker environment cannot disable this explicit setup action.
    from batch import file_hash
    m={'schema':'fixgo.studio.grounding-dino.v1','backend':'grounding-dino','task':'detect','repository':MODEL,'revision':REVISION,
       'modelDirectory':str(snapshot),'files':{name:file_hash(snapshot/name) for name in FILES},'device':'cpu','shortestEdge':640,'longestEdge':1024,
       'objectThreshold':.3,'signThreshold':.3,'textThreshold':.2,'nmsIou':.5,'maximumSignObjectAreaRatio':.8,
       'classes':[],'scopeMode':'catalog-adaptive','scopeNote':'Artifact base only; Studio creates immutable per-catalog search manifests.',
       'warning':'Open-vocabulary observable-sign proposals only; unvalidated, not human ground truth.'}
    a.manifest.parent.mkdir(parents=True,exist_ok=True)
    # Never replace user-tuned configuration silently.
    if a.manifest.exists():
        existing=json.loads(a.manifest.read_text())
        if any(existing.get(k)!=m[k] for k in ['repository','revision','modelDirectory','files']):raise ValueError('Manifest already exists for different artifacts; choose a new --manifest path')
    else:
        a.manifest.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'manifest':str(a.manifest),'repository':MODEL,'revision':REVISION,'artifactFiles':FILES}))

if __name__=='__main__':main()
