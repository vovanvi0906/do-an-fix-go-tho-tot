import React,{useEffect,useRef,useState} from 'react';
import {ai01ReviewService as api} from '../../../services/ai01ReviewService';
import {message} from '../constants';
import {DATASET_NAMES,REVIEW_ACTIONS,STATUS_NAMES} from '../labelingOptions';
import {buttonClass,LoadingReview} from './ReviewPanel';
import ImageReview from './ImageReview';
import QuickLabelEditor from './QuickLabelEditor';
import BBoxQualityEditor from './BBoxQualityEditor';
import DatasetQualityPanel from './DatasetQualityPanel';
import {DevelopmentCheck} from '../FastLabelPage';

export default function LabelDetailEditor({imageId,catalog,onSaved,onNext,onDirtyChange,onBusyChange}) {
 const [detail,setDetail]=useState(null),[url,setUrl]=useState(''),[bbox,setBbox]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0),[draftKey,setDraftKey]=useState(0);
 const lock=useRef(false),dirty=useRef(false);
 function markDirty(value){dirty.current=value;onDirtyChange(value);}
 const dirtyCallback=useRef(markDirty);dirtyCallback.current=markDirty;
 const stableDirty=useRef(value=>dirtyCallback.current(value)).current;
 useEffect(()=>{onBusyChange(busy);return()=>onBusyChange(false);},[busy,onBusyChange]);
 useEffect(()=>()=>onDirtyChange(false),[onDirtyChange]);
 useEffect(()=>{let alive=true,objectUrl;setDetail(null);setUrl('');setError('');
  Promise.all([api.read('fast_detail',{imageId}),api.fastImage(imageId)]).then(([d,b])=>{objectUrl=URL.createObjectURL(b);if(alive){setDetail(d);setUrl(objectUrl);}else URL.revokeObjectURL(objectUrl);}).catch(e=>{if(alive)setError(message(e));});return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[imageId,revision]);
 function mode(value){if(busy||dirty.current&&!window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và chuyển công cụ?'))return;markDirty(false);setDraftKey(v=>v+1);setBbox(value);}
 async function save(payload,advance){if(lock.current||!detail||!url)return;lock.current=true;setBusy(true);setError('');try{
  const event=await api.save('fast_save',{...payload,imageId,expectedHash:detail.annotation?.eventHash||null});markDirty(false);
  setDetail(d=>({...d,annotation:event,history:[...d.history,event],blockers:['Nhãn đã lưu; cần kiểm tra lại trước khi xuất.']}));setNotice(`Đã lưu ${imageId}: ${REVIEW_ACTIONS[event.reviewAction]||STATUS_NAMES[event.decision]}.`);
  await onSaved();if(advance)await onNext();
 }catch(e){setError(message(e));}finally{lock.current=false;setBusy(false);}}
 async function check(form){if(lock.current||!detail?.annotation)return;lock.current=true;setBusy(true);setError('');try{await api.save('fast_check',{...form,imageId,annotationEventHash:detail.annotation.eventHash});markDirty(false);setNotice('Đã kiểm tra và ghi bằng chứng cho bản xuất SOLO.');setRevision(v=>v+1);await onSaved();}catch(e){setError(message(e));}finally{lock.current=false;setBusy(false);}}
 return <div className="space-y-4">
  {error&&<div role="alert" className="rounded-lg border border-rose-300 p-3 text-rose-700 dark:text-rose-300">{error}{!detail&&<button className={`${buttonClass} ml-2`} onClick={()=>setRevision(v=>v+1)}>Thử lại</button>}</div>}
  {notice&&<p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
  {!detail||!url?!error&&<LoadingReview/>:<>
   <div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={busy} aria-pressed={!bbox} onClick={()=>mode(false)}>Nhãn ảnh</button><button className={buttonClass} disabled={busy||!detail.qualityReview} aria-pressed={bbox} onClick={()=>mode(true)}>Chỉnh bounding box</button></div>
   {!detail.qualityReview&&<p className="text-xs text-slate-500">API hiện chỉ hỗ trợ chỉnh bbox cho ảnh thuộc hàng đợi sửa bbox.</p>}
   {bbox?<BBoxQualityEditor compact key={imageId} imageId={imageId} onBusyChange={setBusy} onDirtyChange={stableDirty} onNext={onNext} onSaved={()=>{markDirty(false);onSaved();}}/>:<ImageReview compact hideNavigation items={[detail]} item={detail} imageUrl={url} datasetNames={DATASET_NAMES} disabled={busy} onSelect={()=>{}} reviewTitle="Kiểm tra và gán nhãn">
    <p className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">Nhãn Roboflow và mapping là gợi ý chưa xác nhận. Chỉ thao tác Lưu mới ghi quyết định của bạn.</p>
    <QuickLabelEditor compact key={`${imageId}-${detail.annotation?.eventHash||'new'}-${draftKey}`} detail={detail} catalog={catalog} busy={busy} onSave={save} onDirtyChange={stableDirty}/>
   </ImageReview>}
   <details className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><summary className="cursor-pointer text-sm font-medium">Chi tiết, điều kiện xuất và lịch sử</summary><div className="mt-4 space-y-4">
    <DevelopmentCheck key={`${imageId}-${detail.annotation?.eventHash}-${revision}-${draftKey}`} detail={detail} busy={busy} onSave={check} onDirtyChange={stableDirty}/>
    <details><summary className="cursor-pointer text-sm">Nguồn, ảnh trùng và kiểm tra tự động</summary><div className="mt-2 text-xs space-y-2 break-all"><p>SHA256: {detail.sha256} · {detail.duplicateCount} bản trùng</p><p>Nguồn: {detail.source.url} · {detail.source.licenseDeclared}</p><pre className="whitespace-pre-wrap">{JSON.stringify({duplicate:detail.duplicateEvidence,preparation:detail.preparationReview,ai:detail.ai},null,2)}</pre></div></details>
    <details><summary className="cursor-pointer text-sm">Kiểm tra chất lượng và xuất bản sửa bbox</summary><div className="mt-3"><DatasetQualityPanel revision={revision} onBusyChange={setBusy} onReview={()=>mode(true)}/></div></details>
    <h3 className="text-sm font-medium">Lịch sử ảnh ({detail.history.length})</h3>{detail.history.map(e=><p key={e.eventHash} className="text-xs break-all">{new Date(e.timestamp).toLocaleString('vi-VN')} · {e.userId} · {REVIEW_ACTIONS[e.reviewAction]||STATUS_NAMES[e.decision]||'Kiểm tra điều kiện xuất'} · {e.reason}<br/>Audit: {e.eventHash}</p>)}
   </div></details>
  </>}
 </div>;
}
