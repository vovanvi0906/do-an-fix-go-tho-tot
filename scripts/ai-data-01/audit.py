#!/usr/bin/env python3
"""AI-DATA-01: inventory/dedup/proposed split, only NEW audit outputs; no ML inference."""
import argparse,collections,csv,gzip,hashlib,json,os,sys,zipfile,math,io
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import cv2,numpy as np,yaml
from common import IMAGE_EXT,BKTree,Union,canonical,digest,image_facts,read_asset,parse_yolo,choose_pilot
cv2.setNumThreads(1)
REPO=Path(__file__).resolve().parents[2]
J=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':'))
SKIP={'node_modules','.git','.venv','venv','__pycache__','.gradle','.expo','dist','build','.cxx','.android-qa','.android','.idea'}

def write_csv(path,rows,fields=None):
    with path.open('x',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields or list(rows[0]));w.writeheader();w.writerows(rows)

def discover(roots):
    folders=collections.defaultdict(collections.Counter)
    for root in roots:
        if not root.exists():continue
        for base,dirs,files in os.walk(root,followlinks=False):
            dirs[:]=[d for d in dirs if d not in SKIP and not (Path(base)/d).is_symlink()]
            for name in files:
                p=Path(base)/name
                if p.is_symlink():continue
                ext=p.suffix.lower()
                if ext in IMAGE_EXT:folders[str(p.parent)]['images']+=1
                elif ext in {'.txt','.csv','.json','.jsonl','.yaml','.yml','.xml'} and any(x in str(p).lower() for x in ['dataset','label','annotation','training','benchmark','experiment']):folders[str(p.parent)]['annotation_or_manifest_files']+=1
    return [{'directory':k,**{c:v.get(c,0) for c in ['images','annotation_or_manifest_files']}} for k,v in sorted(folders.items())]

def inspect(spec):
    row=dict(spec);row.update(decode_status='OK',image_errors_json='[]',annotations_json='[]',annotation_issues_json='[]',annotation_sha256='',annotation_status='NOT_PRESENT',source_label_signature='')
    try:
        payload=read_asset(row['path']);row.update(sha256=digest(payload),bytes=len(payload));row.update(image_facts(row['path']));errors=[]
        annotation=row.get('annotation_path','')
        if annotation:
            p=Path(annotation)
            if p.exists():
                data=p.read_bytes();row['annotation_sha256']=digest(data)
                anns,issues=parse_yolo(data.decode('utf-8-sig'),row['_names'],row['width'],row['height'])
                row.update(annotations_json=J(anns),annotation_issues_json=J(issues),annotation_status='NEEDS_GEOMETRY_REVIEW' if issues else 'EMPTY_UNREVIEWED' if not anns else 'PARSED_SOURCE_UNVERIFIED')
                row['source_label_signature']=digest(canonical(anns).encode())
            else:row['annotation_status']='MISSING_LABEL'
        if row['frames']!=1:errors.append('animated/multiframe outside detection policy')
        if min(row['width'],row['height'])<32:errors.append('too small for FixGo import')
        if row['exif_orientation']!=1:errors.append('EXIF orientation needs coordinated geometry review')
        row['image_errors_json']=J(errors)
    except Exception as e:row.update(decode_status='UNUSABLE_OR_READ_ERROR',image_errors_json=J([type(e).__name__+': '+str(e)[:250]]))
    return row

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--data-root',type=Path,default=Path.home()/'Work/datasetai');ap.add_argument('--catalog',type=Path,required=True);ap.add_argument('--workers',type=int,default=4);args=ap.parse_args()
    out=args.output.resolve();data=args.data_root.resolve();raw=data/'01-raw';prep=data/'02-development/ai01-prepared-v1';classification=REPO/'ai-service/dataset'
    if out.exists():raise SystemExit('Output already exists: use a NEW directory; no overwrite.')
    for protected in [raw,prep,classification]:
        if out==protected or out.is_relative_to(protected) or protected.is_relative_to(out):raise SystemExit('Output overlaps a protected source tree')
    out.mkdir(parents=True);evidence=out/'evidence';evidence.mkdir();catalog=json.loads(args.catalog.read_text());targets={t['id']:t for t in catalog['targets']};categories={c['id']:c for c in catalog['categories']}
    ontology=json.loads((REPO/'docs/ai01-admin/dataset-package/sign-ontology.json').read_text())['signs']
    records=[json.loads(l) for l in (prep/'records.jsonl').read_text().splitlines()];pins=json.loads((prep/'SHA256SUMS.json').read_text())
    if digest((prep/'records.jsonl').read_bytes())!=pins.get('records.jsonl'):raise SystemExit('Prepared record pin mismatch')
    mapping=json.loads((prep/'normalized-mapping.json').read_text());entries={r['mappingKey']:r for r in mapping['entries']}
    if digest((prep/'normalized-mapping.json').read_bytes())!=pins.get('normalized-mapping.json'):raise SystemExit('Mapping pin mismatch')
    folders=discover([REPO,data]);write_csv(evidence/'discovered-directories.csv',folders)
    evidence.joinpath('input-reports.json').write_text(json.dumps([{'path':str(p.relative_to(REPO)),'sha256':digest(p.read_bytes()),'lines':len(p.read_text().splitlines())} for p in sorted((REPO/'docs/ai-audit').rglob('*.md'))],ensure_ascii=False,indent=2)+'\n')
    specs=[];names={};sourceclaims={};yamlpins={}
    for p in sorted(raw.rglob('data.yaml')):
        y=yaml.safe_load(p.read_text());ns=y.get('names',[]);names[p.parent.name]=[ns[k] for k in sorted(ns,key=lambda x:int(x))] if isinstance(ns,dict) else ns;sourceclaims[p.parent.name]=y.get('roboflow',{});yamlpins[str(p)]=digest(p.read_bytes())
    specs_by_old={};oldmeta={}
    for r in records:
        mapped=[entries[k] for k in r['mappingKeys'] if k in entries];tids=sorted({t['targetId'] for p in r.get('sourceNormalizedProposals',[]) for t in p.get('objectCandidates') or [] if t['targetId'] in targets})
        direct=sorted({t['targetId'] for p in r.get('sourceNormalizedProposals',[]) if p['mappingState']=='usable_source_candidate' for t in p.get('objectCandidates') or [] if t['targetId'] in targets})
        signs=sorted({e['normalizedSignCandidate'] for e in mapped if e.get('normalizedSignCandidate') in ontology});faultclaims=sorted({str(p['sourceFaultOrDiseaseClaim']) for p in r.get('sourceNormalizedProposals',[]) if p.get('sourceFaultOrDiseaseClaim')})
        spec=dict(image_id=r['id'],corpus='raw_source',dataset=r['dataset'],path=str(raw/r['path']),source_relative_path=r['path'],original_split=r.get('sourceSplit','unknown'),prepared_development_split=r['developmentSplit'],previous_group=r['leakageGroup'],source_family_candidate=r.get('sourceFamilyCandidate',''),source_claim_json=J(sourceclaims[r['dataset']]),license_declared=str(sourceclaims[r['dataset']].get('license','')),rights_verification='UNVERIFIED',real_or_synthetic='UNKNOWN_NO_IMAGE_LEVEL_EVIDENCE',type_evidence='source metadata does not establish real/synthetic',annotation_path=str(raw/r['annotationPath']),candidate_target_ids_json=J(tids),direct_object_candidate_ids_json=J(direct),sign_candidates_json=J(signs),source_fault_claims_json=J(faultclaims),prepared_tasks_json=J(r['tasks']),prepared_ai_exposed_declaration=str(r.get('aiExposed')).lower(),source_sha256_expected=r['sha256'],annotation_sha256_expected=r.get('annotationSha256') or '',_names=names[r['dataset']])
        specs.append(spec);specs_by_old[r['id']]=spec;oldmeta[r['id']]=r
    for p in sorted(classification.rglob('*')):
        if p.suffix.lower() not in IMAGE_EXT:continue
        parts=p.relative_to(classification).parts;label=parts[1];specs.append(dict(image_id='cls-'+digest(str(p.relative_to(classification)).encode())[:16],corpus='classification_fixture',dataset='fixgo_cls_v1',path=str(p),source_relative_path=str(p.relative_to(classification)),original_split=parts[0],prepared_development_split='',previous_group='',source_family_candidate='procedural-template:'+label+':'+p.stem.rsplit('_',1)[-1],source_claim_json=J({'generatorSource':'ai-service/training/prepare_dataset.py:generate_class_images','folderLabel':label}),license_declared='',rights_verification='UNVERIFIED',real_or_synthetic='SYNTHETIC_PROCEDURAL_SOURCE_EVIDENCE',type_evidence='generator code and fixture characteristics; exact run lineage not established',annotation_path='',candidate_target_ids_json='[]',direct_object_candidate_ids_json='[]',sign_candidates_json='[]',source_fault_claims_json='[]',prepared_tasks_json='{}',prepared_ai_exposed_declaration='true',source_sha256_expected='',annotation_sha256_expected='',_names=[]))
    # User ZIP contents are inventoried IN PLACE, never extracted or corrected.
    for archive in sorted((Path.home()/'Downloads').glob('fixgo_suadien_outlet_burnmark_20*.zip')):
        with zipfile.ZipFile(archive) as z:
            metadata={}
            csvnames=[n for n in z.namelist() if Path(n).name=='metadata.csv']
            if len(csvnames)==1:
                for m in csv.DictReader(io.StringIO(z.read(csvnames[0]).decode('utf-8-sig'))):
                    key=m.get('filename') or m.get('image_file') or m.get('image_path')
                    if key:metadata[Path(key).name]=m
            for name in sorted(z.namelist()):
                if Path(name).suffix.lower() not in IMAGE_EXT:continue
                meta=metadata.get(Path(name).name,{})
                group=meta.get('group_key') or meta.get('source_group') or ''
                specs.append(dict(image_id='zip-'+digest((str(archive)+'!/'+name).encode())[:16],corpus='user_synthetic_zip',dataset=archive.stem,path=str(archive)+'!/'+name,source_relative_path=name,original_split='unassigned',prepared_development_split='',previous_group='',source_family_candidate='user-synthetic-generation-family:'+group if group else '',source_claim_json=J({'source':'synthetic_ai','declared_group':group,'metadata':meta,'evidence':'user package metadata; individual prompt/rights not verified'}),license_declared='',rights_verification='UNVERIFIED',real_or_synthetic='SYNTHETIC_DECLARED',type_evidence='CSV source/source_type declaration in user ZIP; not photo capture',annotation_path='',candidate_target_ids_json=J([next(t['id'] for t in targets.values() if t['slug']=='o-cam-dien')]),direct_object_candidate_ids_json='[]',sign_candidates_json=J(['burn_mark']),source_fault_claims_json='[]',prepared_tasks_json='{}',prepared_ai_exposed_declaration='true',source_sha256_expected='',annotation_sha256_expected='',_names=[]))
    uploadlog=data/'06-benchmarks/ai01-admin-v1/reviews/uploaded-dataset-v1/events.jsonl'
    if uploadlog.exists():
        head='0'*64
        for l in uploadlog.read_text().splitlines():
            r=json.loads(l);assert r['previousHash']==head and digest(canonical({k:v for k,v in r.items() if k!='eventHash'}).encode())==r['eventHash'];head=r['eventHash']
            specs.append(dict(image_id='upload-'+r['id'],corpus='admin_upload',dataset='admin_upload',path=str(uploadlog.parent/r['imageFile']),source_relative_path=r['imageFile'],original_split=r.get('developmentSplit','unknown'),prepared_development_split=r.get('developmentSplit',''),previous_group=r.get('leakageGroup',''),source_family_candidate='declared-upload-group:'+r['groupKey'],source_claim_json=J({'sourceType':r['sourceType'],'sourceReference':r['sourceReference']}),license_declared=r['rightsType'],rights_verification='UNVERIFIED_SOURCE_DECLARATION_NOT_REVIEW',real_or_synthetic='OWN_PHOTO_DECLARED_NOT_CAPTURE_VERIFIED' if r['sourceType']=='own_photo' else 'UNKNOWN',type_evidence='upload source declaration only',annotation_path='',candidate_target_ids_json=J([r['targetId']] if r['targetId'] else []),direct_object_candidate_ids_json='[]',sign_candidates_json='[]',source_fault_claims_json='[]',prepared_tasks_json='{}',prepared_ai_exposed_declaration='true',source_sha256_expected=r['sha256'],annotation_sha256_expected='',_names=[]))
    print(f'Scanning {len(specs)} selected canonical/fixture/ZIP/upload entries; {len(folders)} data-related directories found',flush=True)
    rows=[]
    with ThreadPoolExecutor(max_workers=max(1,min(8,args.workers))) as pool:
        for i,row in enumerate(pool.map(inspect,specs)):
            rows.append(row)
            if (i+1)%4000==0:print('images',i+1,flush=True)
    # Actual experiment membership is separate from generic aiExposed flags.
    exposure=collections.defaultdict(set);exposure_files=[]
    for p in sorted((data/'03-experiments').rglob('selection.jsonl')):
        exposure_files.append({'path':str(p),'sha256':digest(p.read_bytes())})
        for l in p.read_text().splitlines():
            r=json.loads(l);key=r.get('sha256')
            if key:exposure[key].add(p.parent.name+':'+str(r.get('split','unknown')))
    for row in rows:
        if row['corpus']=='classification_fixture':exposure[row.get('sha256','')].add('fixgo_cls_v1:'+row['original_split'])
    n=len(rows);uf=Union(n);nearuf=Union(n);lookups={};group_rows=[];stats={};pairfile=gzip.open(evidence/'near-hash-edges.csv.gz','wt',newline='');pw=csv.writer(pairfile);pw.writerow(['left_image_id','right_image_id','phash_distance','dhash_distance','thumbnail_rmse','interpretation'])
    for kind,key in [('sha256','sha256'),('pixels','pixel_sha256')]:
        lookup=collections.defaultdict(list)
        for i,r in enumerate(rows):
            if r.get(key):lookup[r[key]].append(i)
        lookups[kind]=lookup
        for members in lookup.values():
            for j in members[1:]:uf.join(members[0],j)
    byhash=collections.defaultdict(list)
    for i,r in enumerate(rows):
        if r.get('phash'):byhash[int(r['phash'],16)].append(i)
    tree=BKTree();hash_edges=0
    for ix,(h,members) in enumerate(byhash.items()):
        a=members[0]
        for i in members[1:]:nearuf.join(a,i);uf.join(a,i)
        for match,dist in tree.search(h,6):
            b=byhash[match][0];nearuf.join(a,b);uf.join(a,b);hash_edges+=1
            pw.writerow([rows[a]['image_id'],rows[b]['image_id'],dist,(int(rows[a]['dhash'],16)^int(rows[b]['dhash'],16)).bit_count(),round(float(np.sqrt(np.mean((rows[a]['_thumb']-rows[b]['_thumb'])**2))),6),'CANDIDATE_ONLY_NOT_IDENTITY'])
        tree.add(h)
        if ix and ix%4000==0:print('unique phash values queried',ix,flush=True)
    pairfile.close();near_components=collections.defaultdict(list)
    for i in range(n):
        if rows[i].get('phash'):near_components[nearuf.find(i)].append(i)
    lookups['phash_component']=dict(near_components)
    # Same family and prior conservative group remain linked; filename relations are hypotheses.
    for key in ['source_family_candidate','previous_group']:
        lookup=collections.defaultdict(list)
        for i,r in enumerate(rows):
            if r.get(key):lookup[r[key]].append(i)
        for members in lookup.values():
            for j in members[1:]:uf.join(members[0],j)
    components=collections.defaultdict(list)
    for i in range(n):components[uf.find(i)].append(i)
    component_names={};component_exposure={};split_assign={}
    for root,members in components.items():
        name='source-component-'+digest('|'.join(sorted(rows[i]['image_id'] for i in members)).encode())[:20];component_names[root]=name
        ex=sorted({e for i in members for e in exposure.get(rows[i].get('sha256',''),set())});component_exposure[root]=ex
        # No independent test created. Existing observed groups cannot become future independent validation.
        split_assign[root]='legacy_model_train_exposed' if any(e.endswith(':train') for e in ex) else 'legacy_model_validation_exposed' if ex else 'quarantine_source_and_exposure_review'
    membership=collections.defaultdict(dict)
    for kind,lookup in lookups.items():
        groups=[v for v in lookup.values() if len(v)>1];stats[kind]={'groups':len(groups),'entries':sum(map(len,groups)),'largest':max(map(len,groups),default=0)}
        for members in groups:
            gid=kind+'-'+digest('|'.join(sorted(rows[i]['image_id'] for i in members)).encode())[:18]
            labels={rows[i]['source_label_signature'] for i in members if rows[i]['source_label_signature']}
            splitkeys={rows[i]['corpus']+':'+rows[i]['original_split'] for i in members}
            for i in members:
                membership[i][kind]=gid
                group_rows.append(dict(group_id=gid,group_type=kind,image_id=rows[i]['image_id'],path=rows[i]['path'],group_size=len(members),corpus=rows[i]['corpus'],original_split=rows[i]['original_split'],cross_original_split=len({rows[j]['original_split'] for j in members if rows[j]['corpus']==rows[i]['corpus']})>1,cross_corpus=len({rows[j]['corpus'] for j in members})>1,label_conflict_candidate=len(labels)>1,identity_status='EXACT_BYTES' if kind=='sha256' else 'EXACT_NORMALIZED_PIXELS' if kind=='pixels' else 'CONNECTED_NEAR_CANDIDATE_NOT_VERIFIED'))
    print('Grouping complete',J(stats),flush=True)
    for i,r in enumerate(rows):
        old=oldmeta.get(r['image_id']);tasks=json.loads(r['prepared_tasks_json']);buckets=['Unknown/Needs Review']
        if r['decode_status']!='OK':buckets=['Unusable']
        else:
            if json.loads(r['candidate_target_ids_json']) or r['corpus']=='classification_fixture' and json.loads(r['source_claim_json']).get('folderLabel')!='other_unclear':buckets.append('Object Recognition')
            if r['corpus']=='classification_fixture' and json.loads(r['source_claim_json']).get('folderLabel')=='other_unclear':buckets.append('Out-of-scope')
            if tasks.get('object_detection',{}).get('included'):buckets.append('Object Detection')
            if tasks.get('visible_sign_detection',{}).get('labels'):buckets.extend(['Defect Classification','Defect Detection'])
            if old and any(entries[k].get('mappingState')=='out_of_scope' for k in old['mappingKeys'] if k in entries):buckets.append('Out-of-scope')
            if old and any(x in str(old.get('visualCandidates',[])) for x in ['advertisement','composite']):buckets.append('Out-of-scope')
            if membership[i]:buckets.append('Duplicate')
        root=uf.find(i);r.update(proposed_task_buckets_json=J(sorted(set(buckets))),bucket_status='CANDIDATE_ONLY_NOT_VERIFIED',normal_negative_status='NOT_ESTABLISHED_EMPTY_LABEL_IS_NOT_NEGATIVE',sha_group_id=membership[i].get('sha256',''),pixel_group_id=membership[i].get('pixels',''),phash_component_id=membership[i].get('phash_component',''),proposed_source_component=component_names[root],proposed_split=split_assign[root],direct_experiment_exposure_json=J(sorted(exposure.get(r.get('sha256',''),set()))),component_exposure_json=J(component_exposure[root]),independent_test_eligible='false',independence_status='BLOCKED_NO_VERIFIED_SOURCE_RIGHTS_GROUP_AND_EXPOSURE_CLEARANCE',source_sha256_matches=r.get('sha256')==r['source_sha256_expected'] if r['source_sha256_expected'] else 'NOT_PINNED',annotation_sha256_matches=r['annotation_sha256']==r['annotation_sha256_expected'] if r['annotation_sha256_expected'] else 'NOT_PINNED',reuse_status='UNUSABLE' if r['decode_status']!='OK' else 'REVIEW_SOURCE_RIGHTS_LABEL_GEOMETRY_GROUP_BEFORE_REUSE',ground_truth_status='UNVERIFIED_SOURCE_OR_PROPOSAL',source_file_unchanged=True)
        if old:
            r['phash_matches_prepared']=r.get('phash')==old.get('phash');r['pixel_hash_matches_prepared']=r.get('pixel_sha256')==old.get('pixelSha256')
        else:r['phash_matches_prepared']='NOT_APPLICABLE';r['pixel_hash_matches_prepared']='NOT_APPLICABLE'
        for key in ['_names','_thumb']:r.pop(key,None)
    fields=list(dict.fromkeys(k for r in rows for k in r));write_csv(out/'image-inventory.csv',rows,fields);write_csv(out/'duplicate-groups.csv',group_rows)
    coverage=[]
    for tid,t in sorted(targets.items(),key=lambda x:(categories[x[1]['categoryId']]['name'],x[1]['name'])):
        allc=[r for r in rows if r['corpus']=='raw_source' and tid in json.loads(r['candidate_target_ids_json'])];direct=[r for r in allc if tid in json.loads(r['direct_object_candidate_ids_json'])];task=[r for r in allc if tid in json.loads(r['prepared_tasks_json']).get('object_detection',{}).get('labels',[]) and json.loads(r['prepared_tasks_json']).get('object_detection',{}).get('included')]
        coverage.append(dict(category_id=t['categoryId'],category_name=categories[t['categoryId']]['name'],target_id=tid,target_slug=t['slug'],target_name=t['name'],raw_candidate_images=len(allc),raw_direct_object_candidate_images=len(direct),prepared_object_task_candidate_images=len(task),candidate_distinct_pixels=len({r.get('pixel_sha256') for r in allc}),candidate_source_components=len({r['proposed_source_component'] for r in allc}),source_ambiguous_images=sum(len(json.loads(r['candidate_target_ids_json']))>1 for r in allc),verified_object_images='NOT_ASSESSED',verified_normal_images='NOT_ASSESSED',verified_defect_images='NOT_ASSESSED',independent_test_released_images=0,related_services=sum(s['targetId']==tid for s in catalog['services']),data_gap='NO_SOURCE_CANDIDATE_TAG_FOUND' if not allc else 'REVIEW_REQUIRED_COUNTS_ARE_NOT_VERIFIED_COVERAGE'))
    write_csv(out/'object-coverage.csv',coverage)
    # Proposed small development-only review queue, one component per target for diversity.
    pilot=choose_pilot(rows,targets)
    write_csv(evidence/'pilot-review-queue.csv',pilot)
    # Compare leakage across each corpus separately, not train from different projects as equal split identities.
    leakage={}
    for corpus in sorted({r['corpus'] for r in rows}):
        sub=[i for i,r in enumerate(rows) if r['corpus']==corpus];groupsby={}
        for kind,key in [('sha256','sha256'),('pixels','pixel_sha256'),('phash_component','phash_component_id'),('combined_source','proposed_source_component')]:
            lookup=collections.defaultdict(list)
            for i in sub:
                if rows[i].get(key):lookup[rows[i][key]].append(i)
            cross=[v for v in lookup.values() if len({rows[i]['original_split'] for i in v})>1];groupsby[kind]={'cross_original_split_groups':len(cross),'involved_entries':sum(map(len,cross))}
        leakage[corpus]=groupsby
    report=dict(schema='fixgo.ai-data-01.audit.v1',audit_client_date='2026-11-25',catalog_captured_at=catalog.get('capturedAt'),counts_by_corpus=dict(collections.Counter(r['corpus'] for r in rows)),selected_entries=len(rows),unique_sha256=len(lookups['sha256']),duplicates=stats,leakage=leakage,phash_algorithm='OpenCV gray DCT32 top8x8 excluding DC; 63-bit median; exact BKTree Hamming<=6',hash_value_edges=hash_edges,grouping_caveat='Transitive near components are conservative candidates, NOT identity equivalence; do not auto-delete/confirm labels',raw_annotation_status=dict(collections.Counter(r['annotation_status'] for r in rows if r['corpus']=='raw_source')),raw_decode_errors=sum(r['decode_status']!='OK' for r in rows if r['corpus']=='raw_source'),raw_image_hash_mismatches=sum(r['source_sha256_matches'] is False for r in rows if r['corpus']=='raw_source'),raw_label_hash_mismatches=sum(r['annotation_sha256_matches'] is False for r in rows if r['corpus']=='raw_source'),raw_hash_algorithm_mismatches=sum(r['phash_matches_prepared'] is False or r['pixel_hash_matches_prepared'] is False for r in rows if r['corpus']=='raw_source'),task_buckets=dict(collections.Counter(k for r in rows for k in json.loads(r['proposed_task_buckets_json']))),targets_with_raw_candidate=sum(r['raw_candidate_images']>0 for r in coverage),targets_with_direct_object_candidate=sum(r['raw_direct_object_candidate_images']>0 for r in coverage),targets_without_raw_candidate=[r['target_slug'] for r in coverage if not r['raw_candidate_images']],source_components=len(components),largest_source_component=max(map(len,components.values())),pilot_review_queue=len(pilot),independent_test_released=0,exposure_files=exposure_files,source_yaml_hashes=yamlpins,normal_negative_verified='NOT_ASSESSED',source_rights_verified='NOT_ASSESSED')
    (evidence/'summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(evidence/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');(evidence/'ontology.json').write_text(json.dumps({'signs':ontology},ensure_ascii=False,indent=2)+'\n')
    # Final rehash source LABEL/YAML inputs after all reads; image digests pin the image inventory.
    label_checks=all(digest(Path(r['annotation_path']).read_bytes())==r['annotation_sha256'] for r in rows if r.get('annotation_path') and r['annotation_sha256'])
    yaml_checks=all(digest(Path(p).read_bytes())==v for p,v in yamlpins.items())
    assert label_checks and yaml_checks
    (evidence/'source-integrity.json').write_text(json.dumps({'source_labels_unchanged_after_scan':label_checks,'source_yamls_unchanged_after_scan':yaml_checks,'raw_image_hash_mismatches_vs_pinned_before':report['raw_image_hash_mismatches'],'no_sources_written':True},indent=2)+'\n')
    print(J({k:report[k] for k in ['counts_by_corpus','duplicates','targets_with_raw_candidate','targets_with_direct_object_candidate','pilot_review_queue','source_components','largest_source_component','raw_annotation_status']}),flush=True)

if __name__=='__main__':main()
