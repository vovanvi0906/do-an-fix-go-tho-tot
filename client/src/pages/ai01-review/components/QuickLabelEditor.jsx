import React,{useEffect,useRef,useState} from 'react';
import {buttonClass,fieldClass,Field} from './ReviewPanel';
import {IMAGE_FLAGS,REVIEW_ACTIONS,VISUAL_CONDITIONS,VISIBLE_SIGNS} from '../labelingOptions';

export default function QuickLabelEditor({detail,catalog,busy,onSave}){
 const previous=detail.annotation;
 const [action,setAction]=useState(previous?.reviewAction||({uncertain:'uncertain',rejected:'reject'}[previous?.decision]||'confirm'));
 const [targets,setTargets]=useState(previous?.targetIds||detail.candidates.map(c=>c.targetId));
 const [category,setCategory]=useState('all'),[search,setSearch]=useState('');
 const [condition,setCondition]=useState(previous?.visualCondition||'not_reviewed');
 const [signs,setSigns]=useState(previous?.visibleSigns||[]),[flags,setFlags]=useState(previous?.imageFlags||[]);
 const [reason,setReason]=useState(previous?.reason||''),[error,setError]=useState('');
 const current=useRef(null),reasonRef=useRef(null);
 const categories=catalog?.categories||[],allTargets=catalog?.targets||[];
 const selectedTargets=allTargets.filter(t=>targets.includes(t.id));
 const choices=allTargets.filter(t=>(category==='all'||t.categoryId===category)&&t.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
 function toggle(list,value){return list.includes(value)?list.filter(v=>v!==value):[...list,value];}
 function correct(){setAction('correct');setError('');}
 function chooseAction(value){setAction(value);setError('');}
 function save(advance,override){
  const chosen=override||action;setError('');
  if(['confirm','correct'].includes(chosen)&&!targets.length){setError('Chọn ít nhất một đối tượng, hoặc chọn Chưa chắc chắn / Loại ảnh.');return;}
  if(['confirm','correct'].includes(chosen)&&condition==='not_reviewed'){setError('Hãy chọn tình trạng quan sát. Ví dụ: Không thấy dấu hiệu lỗi.');return;}
  if(condition==='abnormal_visible'&&!signs.length){setError('Chọn dấu hiệu bạn thấy, ví dụ Nước nhỏ giọt.');return;}
  if(chosen==='correct'&&!reason.trim()){setError('Ghi ngắn gọn vì sao sửa, ví dụ: Đây là vòi nước, không phải ống nước.');reasonRef.current?.focus();return;}
  const decision={confirm:'confirmed',correct:'confirmed',uncertain:'uncertain',reject:'rejected'}[chosen];
  onSave({decision,targetIds:targets,reviewAction:chosen,imageFlags:flags,visualCondition:condition,
    visibleSigns:condition==='abnormal_visible'?signs:condition==='no_visible_fault'?[]:null,
    reason:reason.trim()||({confirm:'Đã xem ảnh và xác nhận nhãn.',uncertain:'Đã xem ảnh nhưng chưa chắc về nhãn.',reject:'Đã xem ảnh và loại khỏi tập nhãn sử dụng.'}[chosen])},advance);
 }
 current.current={save,chooseAction};
 useEffect(()=>{function key(e){if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.isContentEditable||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)||busy)return;
  const modes={c:'confirm',e:'correct',u:'uncertain',r:'reject'};
  if(modes[e.key.toLowerCase()]){e.preventDefault();current.current.chooseAction(modes[e.key.toLowerCase()]);}
  if(e.key==='Enter'){e.preventDefault();current.current.save(true);}
 }window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[busy]);
 return <div className="space-y-4">
  <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 text-sm"><b>1. Xem ảnh · 2. Chọn quyết định · 3. Lưu</b><p className="mt-1 text-slate-600 dark:text-slate-300">Đề xuất chưa được xác nhận. Chọn đúng đối tượng và chỉ ghi dấu hiệu nhìn thấy; không suy ra nguyên nhân hoặc dịch vụ sửa.</p></div>
  <fieldset disabled={busy} className="space-y-2"><legend className="text-sm font-semibold">Bạn muốn xử lý ảnh này thế nào?</legend><p className="text-xs text-slate-500">Ví dụ: đối tượng đúng thì Xác nhận; đối tượng sai thì Sửa; ảnh khó đọc thì Chưa chắc chắn.</p><div className="grid grid-cols-2 gap-2">{Object.entries(REVIEW_ACTIONS).map(([id,label])=><label key={id} className={`flex gap-2 rounded-lg border p-3 text-sm cursor-pointer ${action===id?'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30':'border-slate-200 dark:border-slate-700'}`}><input type="radio" name={`review-action-${detail.id}`} value={id} checked={action===id} onChange={()=>chooseAction(id)}/>{label}</label>)}</div></fieldset>
  <div className="sticky top-0 z-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-3 space-y-2"><div className="flex flex-wrap gap-2"><button className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700`} disabled={busy} onClick={()=>save(true)}>Lưu & ảnh tiếp theo</button><button className={buttonClass} disabled={busy} onClick={()=>save(false)}>Lưu tại ảnh này</button></div><p className="text-xs text-slate-500">C: xác nhận · E: sửa · U: chưa chắc · R: loại · Enter: lưu & tiếp. Chọn quyết định chưa ghi dữ liệu; chỉ nút Lưu hoặc Enter mới lưu.</p></div>
  <Field label="Danh mục"><select disabled={busy} className={fieldClass} value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Tất cả danh mục</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
  <p className="text-xs text-slate-500">Lọc đối tượng theo nhóm nghề. Ví dụ: Sửa nước → Vòi nước. Đổi bộ lọc không xóa đối tượng đã chọn.</p>
  <Field label="Tìm đối tượng"><input disabled={busy} className={fieldClass} placeholder="Ví dụ: vòi nước, máy lạnh, ổ cắm" value={search} onChange={e=>setSearch(e.target.value)}/></Field>
  <fieldset disabled={busy} className="space-y-2"><legend className="text-sm font-semibold">Đối tượng FixGo</legend><p className="text-xs text-slate-500">Chọn vật thực sự có trong ảnh; có thể chọn nhiều. Ví dụ: Ống nước và Vòi nước.</p>
   <div className="max-h-44 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 p-2 space-y-1">{choices.map(t=><label key={t.id} className="flex items-start gap-2 rounded p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><input type="checkbox" checked={targets.includes(t.id)} onChange={()=>{setTargets(v=>toggle(v,t.id));correct();}}/><span>{t.name}<span className="block text-xs text-slate-500">{categories.find(c=>c.id===t.categoryId)?.name}</span></span></label>)}{!choices.length&&<p className="p-2 text-sm text-slate-500">Không tìm thấy. Thử từ ngắn hơn hoặc chọn tất cả danh mục.</p>}</div>
   <div className="flex flex-wrap gap-2">{selectedTargets.map(t=><button key={t.id} disabled={busy} type="button" className={`${buttonClass} text-xs`} aria-label={`Bỏ đối tượng ${t.name}`} onClick={()=>{setTargets(v=>v.filter(id=>id!==t.id));correct();}}>{t.name} ×</button>)}</div>
  </fieldset>
  <Field label="Dấu hiệu quan sát được"><select className={fieldClass} disabled={busy} value={condition} onChange={e=>{setCondition(e.target.value);setSigns([]);setError('');}}>{Object.entries(VISUAL_CONDITIONS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></Field>
  <p className="text-xs text-slate-500">Ví dụ: nước nhỏ giọt, vết nứt, vết ố. “Không thấy dấu hiệu lỗi” chỉ mô tả ảnh, không khẳng định thiết bị hoạt động tốt.</p>
  {condition==='abnormal_visible'&&<fieldset disabled={busy} className="space-y-2"><legend className="text-sm font-medium">Dấu hiệu nhìn thấy trong ảnh</legend><div className="grid gap-2 sm:grid-cols-2">{Object.entries(VISIBLE_SIGNS).map(([id,label])=><label key={id} className="flex gap-2 text-sm"><input type="checkbox" checked={signs.includes(id)} onChange={()=>setSigns(v=>toggle(v,id))}/>{label}</label>)}</div></fieldset>}
  <div aria-label="Nhãn bạn đang xem lại" className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-sm space-y-1"><p className="text-xs font-medium text-slate-500">Danh mục → Đối tượng → Dấu hiệu quan sát được · Chưa lưu</p>{selectedTargets.length?selectedTargets.map(t=><p key={t.id}>{categories.find(c=>c.id===t.categoryId)?.name||'Chưa rõ danh mục'} → <b>{t.name}</b> → {condition==='abnormal_visible'?(signs.map(s=>VISIBLE_SIGNS[s]).join(', ')||'Chọn dấu hiệu'):VISUAL_CONDITIONS[condition]}</p>):<p>Chưa chọn đối tượng.</p>}</div>
  <fieldset disabled={busy} className="space-y-2"><legend className="text-sm font-semibold">Đánh dấu đặc điểm ảnh</legend><p className="text-xs text-slate-500">Có chữ bán hàng/logo/giá: ảnh quảng cáo. Nhiều ảnh ghép: ảnh tổng hợp. Các đánh dấu này không tự loại ảnh.</p>{Object.entries(IMAGE_FLAGS).map(([id,label])=><label key={id} className="flex gap-2 text-sm"><input type="checkbox" checked={flags.includes(id)} onChange={()=>setFlags(v=>toggle(v,id))}/>{label}</label>)}</fieldset>
  <label className="block space-y-1 text-sm"><span>Ghi chú / lý do sửa</span><textarea ref={reasonRef} className={fieldClass} disabled={busy} value={reason} placeholder="Ví dụ: Nhãn nguồn là rò ống, nhưng ảnh chỉ thấy vòi nước; chưa thấy nước rò." onChange={e=>setReason(e.target.value)}/></label>
  <p className="text-xs text-slate-500">Bắt buộc khi Sửa nhãn. Với ảnh quảng cáo bị loại, có thể ghi “Ảnh bán hàng, không phải ảnh hiện trường”.</p>
  {error&&<p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}

 </div>;
}
