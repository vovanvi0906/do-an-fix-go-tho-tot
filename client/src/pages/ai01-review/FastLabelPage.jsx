import { useLabelDraft, draftKey, removeDraft } from './useLabelDraft';
import React, {useEffect, useRef, useState} from 'react';
import {ai01ReviewService as api} from '../../services/ai01ReviewService';
import ImageReview from './components/ImageReview';
import BBoxQualityEditor from './components/BBoxQualityEditor';
import DatasetQualityPanel from './components/DatasetQualityPanel';
import DatasetPreparationPanel from './components/DatasetPreparationPanel';
import QuickLabelEditor from './components/QuickLabelEditor';
import {DATASET_NAMES, IMAGE_FLAGS, REVIEW_ACTIONS, STATUS_NAMES, VISUAL_CONDITIONS, VISIBLE_SIGNS} from './labelingOptions';
import {buttonClass, fieldClass, LoadingReview, ReviewPanel, Field} from './components/ReviewPanel';
import {message} from './constants';

const EVIDENCE_HINTS={rightsEvidence:'Ví dụ: liên kết license, tên tác giả và yêu cầu ghi nguồn đã kiểm tra.',sourceEvidence:'Ví dụ: liên kết bộ ảnh gốc và nội dung bạn đã đối chiếu.',groupEvidence:'Ví dụ: đã so sánh các ảnh cùng cảnh; ghi ID nhóm hoặc ảnh cần giữ cùng split.',reason:'Ví dụ: đã đọc lại nhãn đối tượng và dấu hiệu, đủ bằng chứng dùng cho dữ liệu phát triển.'};

export function DevelopmentCheck({detail, busy, onSave, onDirtyChange}) {
  const [form,setForm]=useState({rightsEvidence:'',sourceEvidence:'',groupEvidence:'',reason:''});
  const localDraft=useLabelDraft('check',detail.id,detail.annotation?.eventHash||null,form,setForm);
  const initialCheck=useRef(JSON.stringify({rightsEvidence:'',sourceEvidence:'',groupEvidence:'',reason:''}));
  useEffect(()=>{onDirtyChange?.(JSON.stringify(form)!==initialCheck.current);},[form,onDirtyChange]);
  const own = detail.annotation?.decision === 'confirmed';
  return <ReviewPanel title="Kiểm tra trước khi xuất SOLO">
    {localDraft.notice&&<p role="status" className="text-sm text-amber-600">{localDraft.notice}</p>}
    <p className="text-sm">Nhãn vừa lưu vẫn cách ly khỏi bản xuất cho đến khi bạn kiểm tra nguồn, quyền sử dụng và nhóm ảnh trùng. Thiếu bằng chứng thì để trống và xem lại sau.</p>
    {detail.blockers.length ? <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc pl-5">{detail.blockers.map(b=><li key={b}>{b}</li>)}</ul> : <p className="text-emerald-700 dark:text-emerald-300">Đủ điều kiện xuất solo-development; không đủ điều kiện benchmark độc lập.</p>}
    <form className="space-y-3" onSubmit={e=>{e.preventDefault();onSave(form);}}>
      {Object.entries({rightsEvidence:'Bằng chứng quyền ảnh / license / attribution',sourceEvidence:'Bằng chứng đã kiểm nguồn ảnh',groupEvidence:'Bằng chứng đã kiểm nhóm trùng / cùng cảnh',reason:'Kết luận kiểm tra nhãn và điều kiện xuất'}).map(([k,label])=><Field key={k} label={label}><textarea required placeholder={EVIDENCE_HINTS[k]} disabled={busy||!own} className={fieldClass} value={form[k]} onChange={e=>{setForm(v=>({...v,[k]:e.target.value}));onDirtyChange?.(true);}}/></Field>)}
      <button className={buttonClass} disabled={busy||!own}>Đã kiểm tra — cho phép xuất SOLO</button>
    </form>
  </ReviewPanel>;
}

export default function FastLabelPage({embedded=false,readOnly=false,initialImageId='',onBusyChange}) {
  const [rows,setRows]=useState([]),[catalog,setCatalog]=useState(null),[mappings,setMappings]=useState([]);
  const [selected,setSelected]=useState(initialImageId),[detail,setDetail]=useState(null),[url,setUrl]=useState('');
  const [inlineEdit,setInlineEdit]=useState(false),[filter,setFilter]=useState(initialImageId||readOnly?'all':'pending');
  const [dataset,setDataset]=useState('all'),[query,setQuery]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
  const lock=useRef(false);
  const [bboxMode,setBboxMode]=useState(false),[qualityRevision,setQualityRevision]=useState(0);
  const editing=!readOnly||inlineEdit;
  useEffect(()=>{setInlineEdit(false);},[readOnly]);
  const filteredRows=rows.filter(r=>(dataset==='all'||r.dataset===dataset)&&r.id.includes(query.trim())&&(filter==='all'||(filter==='quality'?Boolean(r.qualityReview):filter==='quality_pilot'?Boolean(r.qualityReview?.pilot):filter==='prepared'?Boolean(r.preparationReview):filter==='pending'?r.status==='pending':filter==='check'?r.status==='confirmed'&&!r.eligible:filter==='out_of_scope'?r.status===filter:filter==='uncertain'?(r.uncertain||r.status==='uncertain'):r[filter])));
  const filtered=filter.startsWith('quality')?[...filteredRows].sort((a,b)=>(a.qualityReview?.priority??9)-(b.qualityReview?.priority??9)||a.id.localeCompare(b.id)):filter==='prepared'?[...filteredRows].sort((a,b)=>(a.preparationReview?.priority??9)-(b.preparationReview?.priority??9)||a.id.localeCompare(b.id)):filteredRows;
  useEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
  useEffect(()=>{let alive=true;Promise.all([api.read('fast_items'),api.read('fast_catalog'),api.read('fast_mappings')]).then(([r,c,m])=>{if(alive){setRows(r.items);setCatalog(c);setMappings(m.entries);setSelected(v=>v||r.items[0]?.id||'');}}).catch(e=>{if(alive)setError(message(e));});return()=>{alive=false;};},[]);
  useEffect(()=>{if(filtered.length&&!filtered.some(r=>r.id===selected))setSelected(filtered[0].id);},[filter,rows,selected,dataset,query]);
  useEffect(()=>{if(!selected)return;let alive=true,objectUrl;setDetail(null);setUrl('');setError('');
    Promise.all([api.read('fast_detail',{imageId:selected}),api.fastImage(selected)]).then(([d,b])=>{objectUrl=URL.createObjectURL(b);if(alive){setDetail(d);setUrl(objectUrl);}else URL.revokeObjectURL(objectUrl);}).catch(e=>{if(alive)setError(message(e));});
    return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[selected,revision]);
  function next(){const index=filtered.findIndex(r=>r.id===selected);if(filtered[index+1])setSelected(filtered[index+1].id);}
  async function save(payload,advance){
    if(lock.current||!detail||!url||!editing)return;lock.current=true;setBusy(true);setError('');setNotice('');
    try{const e=await api.save('fast_save',{...payload,imageId:detail.id,expectedHash:detail.annotation?.eventHash||null});removeDraft(draftKey('image',detail.id));setDetail(d=>({...d,annotation:e,history:[...d.history,e],blockers:['Nhãn đã lưu; cần kiểm tra lại trước khi xuất.']}));if(advance)next();else setFilter('all');setRows(rs=>rs.map(r=>r.id===detail.id?{...r,status:e.decision,eligible:false}:r));setNotice(`Đã lưu ${detail.id}: ${REVIEW_ACTIONS[e.reviewAction]||STATUS_NAMES[e.decision]}.`);}catch(e){setError(message(e));}finally{lock.current=false;setBusy(false);}
  }
  async function check(form){
    if(lock.current||!detail?.annotation||!editing)return;lock.current=true;setBusy(true);setError('');setNotice('');
    try{await api.save('fast_check',{...form,imageId:detail.id,annotationEventHash:detail.annotation.eventHash});removeDraft(draftKey('check',detail.id));setNotice('Đã kiểm tra và ghi bằng chứng. Ảnh đủ điều kiện xuất solo-development.');setRevision(v=>v+1);const r=await api.read('fast_items');setRows(r.items);}catch(e){setError(message(e));}finally{lock.current=false;setBusy(false);}
  }
  const qualityPanel=<DatasetQualityPanel revision={qualityRevision} onBusyChange={onBusyChange} onReview={pilot=>{setFilter(pilot?'quality_pilot':'quality');setDataset('all');setQuery('');setBboxMode(true);}}/>;
  return <div className={`${embedded?'':'h-full overflow-auto p-5'} space-y-4`}>
    {!embedded&&<h1 className="text-2xl font-bold">Gán nhãn nhanh bằng AI</h1>}
    {!bboxMode&&qualityPanel}
    {readOnly&&!bboxMode&&<DatasetPreparationPanel onReview={()=>{setFilter('prepared');setDataset('all');setQuery('');}}/>}
    <div className="flex flex-wrap justify-between gap-3 text-sm"><p><b>{rows.length.toLocaleString('vi-VN')}</b> ảnh nguồn · <b>{mappings.length}</b> mapping TASK 03B</p><p>{rows.filter(r=>r.status==='confirmed').length} nhãn đã xác nhận · {rows.filter(r=>r.eligible).length} ảnh đủ điều kiện xuất</p></div>
    <p className="text-sm text-slate-500">Xem ảnh → đọc nhãn tiếng Việt → xác nhận hoặc sửa → . Cả hai tab đều có thể gán nhãn tại ảnh đang xem.</p>

    {error&&<p role="alert" className="rounded-xl border border-rose-300 p-3 text-rose-700 dark:text-rose-300">{error}</p>}
    {notice&&<p role="status" className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Bộ dữ liệu"><select className={fieldClass} disabled={busy} value={dataset} onChange={e=>setDataset(e.target.value)}><option value="all">Tất cả bộ dữ liệu</option>{[...new Set(rows.map(r=>r.dataset))].map(d=><option key={d} value={d}>{DATASET_NAMES[d]||d}</option>)}</select></Field>
      <Field label="Tìm ID ảnh"><input placeholder="vd img-19228" className={fieldClass} value={query} disabled={busy} onChange={e=>setQuery(e.target.value)}/></Field>
      <Field label="Lọc ảnh"><select disabled={busy} className={fieldClass} value={filter} onChange={e=>setFilter(e.target.value)}>{Object.entries({all:'Tất cả',quality_pilot:'TASK 04B — Đợt sửa ưu tiên',quality:'TASK 04B — Tất cả ảnh cần sửa bbox',prepared:'Cần duyệt chuẩn hóa dataset',pending:'Chưa duyệt',check:'Nhãn đã lưu — chờ kiểm tra',difficult:'Ảnh khó / lỗi nhãn',uncertain:'Chưa chắc chắn',duplicate:'Trùng / gần trùng (SHA, pHash)',out_of_scope:'Đã đánh dấu ngoài phạm vi'}).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field>
    </div>
    <p className="text-xs text-slate-500">Chọn nhóm nghề, ví dụ Sửa nước; nhập mã như img-19228 để tìm một ảnh, hoặc chọn bộ lọc để xem ảnh cần kiểm tra. Mỗi lựa chọn ảnh kèm tên nhãn tiếng Việt.</p>
    {!rows.length&&!error?<LoadingReview/>:!filtered.length?<ReviewPanel title="Không có ảnh trong bộ lọc này"><p>Thử chọn Tất cả hoặc một bộ dữ liệu khác.</p></ReviewPanel>:!detail?<LoadingReview/>:<>
      {bboxMode&&detail.qualityReview?<div className="space-y-3"><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} className={buttonClass} onClick={()=>setBboxMode(false)}>Quay lại nhãn cấp ảnh</button><button type="button" disabled={busy||filtered.findIndex(r=>r.id===selected)<=0} className={buttonClass} onClick={()=>setSelected(filtered[filtered.findIndex(r=>r.id===selected)-1].id)}>Ảnh trước</button><button type="button" disabled={busy||filtered.findIndex(r=>r.id===selected)>=filtered.length-1} className={buttonClass} onClick={next}>Bỏ qua / ảnh tiếp</button><span className="text-sm self-center">{filtered.findIndex(r=>r.id===selected)+1} / {filtered.length} ảnh trong bộ lọc</span></div><BBoxQualityEditor key={detail.id} imageId={detail.id} onNext={next} onBusyChange={setBusy} onSaved={(id,e)=>{setQualityRevision(v=>v+1);setRows(rs=>rs.map(r=>r.id===id?{...r,qualityReview:{...r.qualityReview,status:e.status,pending:!['confirmed','rejected'].includes(e.status)}}:r));}}/></div>:<>
      <ImageReview items={filtered} navigationLimit={100} item={detail} imageUrl={url} datasetNames={DATASET_NAMES} disabled={busy} reviewTitle={!editing?'Nhãn nguồn và mapping FixGo':'Nhãn FixGo do Admin xác nhận'} onSelect={id=>{if(!busy){setSelected(id);setNotice('');}}}>
        {detail.qualityReview&&<button type="button" disabled={busy} className={buttonClass} onClick={()=>setBboxMode(true)}>Sửa bbox / dấu hiệu ngay tại ảnh này</button>}
        {detail.preparationReview&&<div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-sm"><b>Ảnh cần xem sau kiểm tra tự động</b><ul className="mt-1 list-disc pl-4">{detail.preparationReview.reasons.map(r=><li key={r}>{detail.preparationReasonLabels?.[r]||r}</li>)}</ul><p className="mt-2 text-xs">Đây là cảnh báo/đề xuất, không thay thế quyết định của bạn. Nhãn nguồn vẫn được giữ để xác nhận hoặc sửa ngay bên dưới.</p></div>}
        <div className="space-y-3" aria-label="Mapping FixGo đề xuất">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Mapping FixGo đề xuất</h3><span className="rounded-full bg-amber-50 dark:bg-amber-950/30 px-2 py-1 text-xs text-amber-800 dark:text-amber-200">Đề xuất — chưa xác nhận</span></div>
          <p className="text-xs text-slate-500">Đọc theo thứ tự Danh mục → Đối tượng → Dấu hiệu quan sát được. Ví dụ: Sửa nước → Vòi nước → Nước nhỏ giọt. Nhãn nguồn có thể sai; chỉ chọn điều bạn thấy trong ảnh.</p>
          {detail.candidates.length?detail.candidates.map(t=>{
            const signs=[...new Set((detail.sourceMappings||[]).filter(m=>m.catalogTargetCandidates.some(c=>c.targetId===t.targetId)).map(m=>m.displayVi?.signVi).filter(v=>v&&!v.startsWith('Không có')))];
            return <p key={t.targetId} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-sm">{catalog?.categories.find(c=>c.id===t.categoryId)?.name||'Chưa rõ danh mục'} → <b>{t.targetName}</b> → {signs.join('; ')||'Chưa có dấu hiệu được xác nhận'}</p>;
          }):<p className="text-sm">Chưa rõ danh mục → Chưa rõ đối tượng → Cần xem ảnh và chọn nhãn.</p>}
          <details className="text-xs"><summary className="cursor-pointer text-slate-500">Chi tiết đề xuất theo từng nhãn nguồn</summary><div className="mt-2 space-y-2">{(detail.sourceMappings||[]).map(m=><p key={m.mappingKey}><b>{m.displayVi?.labelVi||'Nhãn chưa có bản dịch'}</b> · {m.displayVi?.objectVi||'Chưa rõ đối tượng'} · {m.displayVi?.signVi?.startsWith('Không có')?'Chưa có dấu hiệu được xác nhận':m.displayVi?.signVi||'Cần xem ảnh'}</p>)}</div></details>
        </div>
        <p className="text-sm">Trạng thái người gán: <b>{STATUS_NAMES[detail.annotation?.decision||'pending']}</b> · Trùng nội dung: {detail.duplicateCount} bản</p>
        {!editing&&<div className="space-y-2"><button disabled={busy} className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700`} onClick={()=>setInlineEdit(true)}>Gán nhãn ngay tại ảnh này</button><p className="text-xs text-slate-500">Mở phần xác nhận/sửa bên cạnh ảnh, không cần chuyển tab.</p></div>}
        {editing&&<QuickLabelEditor key={`${detail.id}-${detail.annotation?.eventHash||'new'}`} detail={detail} catalog={catalog} busy={busy||!url} onSave={save}/>}
        <details><summary className="cursor-pointer text-sm">Thông tin chi tiết: mã nguồn, ảnh trùng và AI</summary><div className="mt-2 space-y-3 text-xs"><p>Mã mapping: {detail.mappingKeys.join(', ')}</p><p>Nhãn nguồn gốc: {detail.sourceLabels.join(', ')}</p><p>Bằng chứng ảnh trùng / gần trùng</p><pre className="whitespace-pre-wrap">{JSON.stringify(detail.duplicateEvidence,null,2)}</pre><p>YOLO + CLIP đã lưu (chưa xác nhận)</p><pre className="whitespace-pre-wrap">{detail.ai?JSON.stringify(detail.ai,null,2):'Chưa có dự đoán khớp hash ảnh; đề xuất từ mapping nguồn.'}</pre></div></details>
      </ImageReview>
      {editing&&<details className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><summary className="cursor-pointer font-medium">Kiểm tra điều kiện xuất (sau khi lưu nhãn)</summary><div className="mt-3"><DevelopmentCheck key={`${detail.id}-${detail.annotation?.eventHash}-${revision}`} detail={detail} busy={busy} onSave={check}/></div></details>}
      <details className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><summary className="cursor-pointer font-medium">Lịch sử ảnh ({detail.history.length} thao tác)</summary><ul className="mt-3 space-y-3 text-sm">{detail.history.map(e=><li key={e.eventHash}><b>{e.kind==='development_check'?'Kiểm tra điều kiện xuất':REVIEW_ACTIONS[e.reviewAction]||STATUS_NAMES[e.decision]}</b> · {new Date(e.timestamp).toLocaleString('vi-VN')} · {e.userId}<p>{e.reason}</p>{e.visualCondition&&<p>{VISUAL_CONDITIONS[e.visualCondition]}{e.visibleSigns?.length?`: ${e.visibleSigns.map(v=>VISIBLE_SIGNS[v]||v).join(", ")}`:""}</p>}{e.imageFlags?.length>0&&<p>{e.imageFlags.map(v=>IMAGE_FLAGS[v]||v).join(", ")}</p>}<p className="break-all text-xs text-slate-500">Audit: {e.eventHash}</p></li>)}</ul>{!detail.history.length&&<p className="mt-3 text-sm text-slate-500">Chưa có nhãn người xác nhận hoặc kiểm tra điều kiện.</p>}</details>
    </>}
    </>}
    {bboxMode&&qualityPanel}
    {readOnly&&!bboxMode&&<details className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><summary className="cursor-pointer font-medium">Tra cứu toàn bộ {mappings.length} mapping TASK03B</summary><div className="max-h-96 overflow-auto mt-3"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Nhãn nguồn tiếng Việt</th><th className="p-2">Mapping FixGo đề xuất</th></tr></thead><tbody>{mappings.map(m=><tr key={m.mappingKey} className="border-t border-slate-200 dark:border-slate-800"><td className="p-2">{m.displayVi?.labelVi||"Nhãn chưa có bản dịch"}<details><summary>Mã gốc</summary>{m.mappingKey}<br/>{m.sourceLabel}</details></td><td className="p-2">{m.catalogTargetCandidates.map(t=>t.targetName).join(', ')||'Chưa có target phù hợp'}</td></tr>)}</tbody></table></div></details>}
  </div>;
}
