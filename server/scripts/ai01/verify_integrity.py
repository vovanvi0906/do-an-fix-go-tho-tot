"""Read-only data/model/history integrity audit; writes evidence only at requested --out."""
import argparse,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DATA=Path.home()/'Work/datasetai';PILOT=DATA/'06-benchmarks/ai01-pilot-v1';B=DATA/'06-benchmarks/ai01-label-review-v1';RAW=DATA/'01-raw'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
a=argparse.ArgumentParser();a.add_argument('--out',type=Path,required=True);args=a.parse_args()
manifest=json.loads((PILOT/'SHA256SUMS.json').read_text())['files']
for n,h in manifest.items():assert sha(PILOT/n)==h,'TASK03C changed: '+n
rows=[json.loads(l) for l in (B/'images.jsonl').read_text().splitlines()];raw=[r for r in rows if not r['reference']]
for r in rows:
 base=ROOT/'ai-service/dataset' if r['reference'] else RAW
 assert sha(base/r['path'])==r['sha256']
 if not r['reference']:assert sha(RAW/r['annotationPath'])==r['annotationSha256']
pilot=json.loads((PILOT/'pilot-proposal.json').read_text());assert len(pilot['items'])==150
for n,h in pilot['inputHashes'].items():assert sha(B/n)==h
for r in pilot['items']:assert sha(RAW/r['dataset']/'data.yaml')==r['source']['yamlSha256']
old=json.loads((DATA/'06-benchmarks/ai01-exploratory-v1/config.json').read_text());assert sha(ROOT/'ai-service/weights/yolov8n-cls-fixgo.pt')==old['weightsSha256'];assert all(sha(ROOT/k)==h for k,h in old['sourceHashes'].items())
policy=json.loads((ROOT/'server/config/ai01-review.example.json').read_text());assert policy['users']==[] and policy['permissionManagers']==[]
result={'status':'passed','task03CImmutableArtifactHashesVerified':len(manifest),'rawImageAndAnnotationHashesVerified':len(raw),'trainingReferenceHashesVerified':len(rows)-len(raw),'pilotImages':150,'mappingClasses':54,'productionInferenceSourceAndWeightsUnchanged':True,'historicalReviewEventsSha256':sha(PILOT/'reviews/events.jsonl'),'historicalReviewEventCount':len((PILOT/'reviews/events.jsonl').read_text().splitlines()),'defaultAssignments':0,'defaultPermissionManagers':0,'realDbAccountsOrGrantsCreated':0,'actualApprovedGroundTruthCreated':0,'qualityMetricsComputed':False,'scope':'Read-only integrity audit, not model accuracy or human annotation approval'}
args.out.parent.mkdir(parents=True,exist_ok=True);args.out.write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
