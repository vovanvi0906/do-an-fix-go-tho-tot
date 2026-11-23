import React, { useState } from 'react';
import { Field, fieldClass, buttonClass } from './ReviewPanel';
import { CONDITIONS, DECISIONS, EMPTY_LABELS, SIGNS } from '../constants';
export default function LabelForm({catalog, initial, adjudicating=false, solo=false, busy, onSave}) {
  const [value,setValue]=useState(()=>initial ? Object.fromEntries(['labels','visualCondition','decision','reason','objectDescription','symptomEvidence','serviceEvidence','possibleCausesHypothesis','independentAttestation'].filter(k=>initial[k]!==undefined).map(k=>[k,k==='labels'?{...initial.labels}:initial[k]])) : {labels:{...EMPTY_LABELS},visualCondition:'',decision:adjudicating?'uncertain':'uncertain',reason:'',independentAttestation:false});
  const [signMode,setSignMode]=useState(initial?.labels.visibleFault===null||!initial?'':initial.labels.visibleFault.length?'some':'none');
  const [formError,setFormError]=useState('');
  const [exceptions,setExceptions]=useState(JSON.stringify(initial?.sourceLabelExceptions||{}));
  const set=(key,v)=>setValue(s=>({...s,[key]:v})); const label=(key,v)=>setValue(s=>({...s,labels:{...s.labels,[key]:v}}));
  const choices=(rows)=><><option value="">Chưa xác nhận</option>{rows.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</>;
  const multi=(event)=>Array.from(event.target.selectedOptions).map(o=>o.value);
  const list=(key,rows)=><select aria-label={key} multiple size={5} className={fieldClass} value={value.labels[key]||[]} onChange={e=>label(key,multi(e))}>{rows.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>;
  return <form className="space-y-4" onSubmit={e=>{e.preventDefault();if(signMode==='some'&&!value.labels.visibleFault?.length){setFormError('Chọn ít nhất một dấu hiệu cụ thể.');return;}setFormError('');const payload={...value,...(adjudicating?{sourceLabelExceptions:exceptions}:{})};if(solo)delete payload.independentAttestation;onSave(payload);}}>
    <p className="text-sm text-slate-500">Ghi điều thấy trong ảnh. Không suy nguyên nhân hỏng từ nhãn nguồn. Mọi trường chưa đánh giá giữ null.</p>
    <Field label="Tình trạng quan sát"><select required className={fieldClass} value={value.visualCondition} onChange={e=>set('visualCondition',e.target.value)}>{choices(Object.entries(CONDITIONS).map(([id,name])=>({id,name})))}</select></Field>
    {!adjudicating&&<Field label="Vật thể/vị trí bạn quan sát"><input className={fieldClass} value={value.objectDescription||''} onChange={e=>set('objectDescription',e.target.value)}/></Field>}
    <div className="grid gap-3 md:grid-cols-2"><Field label="Danh mục FixGo"><select className={fieldClass} value={value.labels.category||''} onChange={e=>setValue(s=>({...s,labels:{...s.labels,category:e.target.value||null,target:null,recommendedService:null}}))}>{choices(catalog.categories)}</select></Field><Field label="Đối tượng FixGo"><select className={fieldClass} value={value.labels.target||''} onChange={e=>setValue(s=>({...s,labels:{...s.labels,target:e.target.value||null,recommendedService:null}}))}>{choices(catalog.targets.filter(t=>t.categoryId===value.labels.category))}</select></Field></div>
    <Field label="Dấu hiệu nhìn thấy"><select className={fieldClass} value={signMode} onChange={e=>{setSignMode(e.target.value);label('visibleFault',e.target.value===''?null:[]);}}><option value="">Chưa đánh giá</option><option value="none">Đã xem: không thấy dấu hiệu bất thường</option><option value="some">Có dấu hiệu (chọn rõ bên dưới)</option></select></Field>
    {signMode==='some'&&list('visibleFault',Object.entries(SIGNS).map(([id,name])=>({id,name})))}
    {['unknown','needsInspection'].map(key=><Field key={key} label={key==='unknown'?'Ngoài phạm vi/không xác định theo taxonomy?':'Cần kiểm tra tại chỗ trước khuyến nghị sửa?'}><select className={fieldClass} value={value.labels[key]===null?'':String(value.labels[key])} onChange={e=>label(key,e.target.value===''?null:e.target.value==='true')}><option value="">Chưa xác nhận</option><option value="false">Không</option><option value="true">Có</option></select></Field>)}
    <details className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"><summary>Triệu chứng thật, giả thuyết và dịch vụ</summary><div className="mt-3 space-y-3">
      <Field label="Triệu chứng khách/phép đo thật (mỗi dòng một mục, không chép nhãn nguồn)"><textarea className={fieldClass} value={(value.labels.symptom||[]).join('\n')} onChange={e=>label('symptom',e.target.value.trim()?e.target.value.split('\n').filter(Boolean):null)}/></Field>
      <Field label="Nguồn triệu chứng/phép đo"><textarea className={fieldClass} value={value.symptomEvidence||''} onChange={e=>set('symptomEvidence',e.target.value)}/></Field>
      {!adjudicating&&<Field label="Giả thuyết nguyên nhân (không xuất như nguyên nhân xác nhận)"><textarea className={fieldClass} value={value.possibleCausesHypothesis||''} onChange={e=>set('possibleCausesHypothesis',e.target.value)}/></Field>}
      <Field label="Dịch vụ hợp lệ"><select className={fieldClass} value={value.labels.recommendedService===null?'':value.labels.recommendedService.length?'some':'none'} onChange={e=>label('recommendedService',e.target.value===''?null:[])}><option value="">Chưa đánh giá</option><option value="none">Đã duyệt: chưa có dịch vụ sửa phù hợp</option><option value="some">Chọn dịch vụ có bằng chứng bên dưới</option></select></Field>
      {value.labels.recommendedService!==null&&list('recommendedService',catalog.services.filter(s=>s.targetId===value.labels.target))}
      <Field label="Bằng chứng chuyên môn chọn dịch vụ"><textarea className={fieldClass} value={value.serviceEvidence||''} onChange={e=>set('serviceEvidence',e.target.value)}/></Field>
    </div></details>
    {adjudicating&&<Field label="Ngoại lệ nhãn nguồn (JSON mappingKey: lý do; chỉ chuyên gia)"><textarea className={fieldClass} value={exceptions} onChange={e=>setExceptions(e.target.value)}/></Field>}
    <Field label="Lý do/bằng chứng (bắt buộc)"><textarea required className={fieldClass} value={value.reason||''} onChange={e=>set('reason',e.target.value)}/></Field>
    <Field label="Quyết định"><select className={fieldClass} value={value.decision} onChange={e=>set('decision',e.target.value)}>{(adjudicating?['approved','uncertain','needsExpertReview','reject']:['submitted','uncertain','needsExpertReview','reject']).map(id=><option key={id} value={id}>{solo&&id==='submitted'?'Đã gán nhãn, chờ tự kiểm tra':DECISIONS[id]}</option>)}</select></Field>
    {!adjudicating&&!solo&&<label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={value.independentAttestation===true} onChange={e=>set('independentAttestation',e.target.checked)}/>Tôi tự gán nhãn, chưa xem prediction/mapping AI hoặc nhãn người khác cho ảnh này.</label>}
    {formError&&<p role="alert" className="text-rose-600">{formError}</p>}
    <button disabled={busy} className={`${buttonClass} bg-blue-600 text-white`}>{solo?'Lưu nhãn một người':adjudicating?'Lưu phân xử':'Nộp nhãn độc lập'}</button>
  </form>;
}
