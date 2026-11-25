import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ai01ReviewService as api} from '../../services/ai01ReviewService';
import {message, DECISIONS, SIGNS} from './constants';
import {ReviewPanel, LoadingReview, Field, buttonClass, fieldClass} from './components/ReviewPanel';
import MappingReview from './components/MappingReview';
import ImageReview from './components/ImageReview';
import LabelForm from './components/LabelForm';
import SourceReview from './components/SourceReview';

const STEPS = {mapping:'1. Duyệt mapping', annotation:'2. Gán nhãn', sources:'3. Nguồn và ảnh trùng', confirm:'4. Tự kiểm tra', export:'5. Xuất dữ liệu phát triển'};
const EVENT_NAMES = {solo_annotation:'Lưu/sửa nhãn một người', solo_confirmation:'Tự kiểm tra và xác nhận', mapping:'Duyệt mapping một người', provenance:'Kiểm nguồn một người', solo_export:'Xuất dữ liệu một người'};
const DATASETS = {suanuoc:'Sửa nước',suadien:'Sửa điện',dienlanh:'Điện lạnh',giupviec:'Giúp việc',lamvuon:'Làm vườn',thietbigiadinh:'Thiết bị gia đình'};

export default function SoloReviewPage() {
  const [access,setAccess]=useState(null),[catalog,setCatalog]=useState(null),[items,setItems]=useState([]),[mappings,setMappings]=useState([]);
  const [step,setStep]=useState('annotation'),[selected,setSelected]=useState(''),[filter,setFilter]=useState('all'),[detail,setDetail]=useState(null),[readiness,setReadiness]=useState([]);
  const [image,setImage]=useState(''),[related,setRelated]=useState([]),[reason,setReason]=useState(''),[ids,setIds]=useState('');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
  const lock=useRef(false),selectedRef=useRef(selected);selectedRef.current=selected;
  const filtered=filter==='water10'?items.filter(i=>i.dataset==='suanuoc').slice(0,10):items;
  const item=filtered.find(i=>i.id===selected);

  useEffect(()=>{let alive=true;setLoading(true);setError('');
    (async()=>{const a=await api.access();if(!alive)return;setAccess(a);if(!a.enabled||!a.canUseSolo)return;
      const [cat,rows,maps]=await Promise.all([api.read('solo_catalog'),api.read('solo_items'),api.read('solo_mappings')]);
      if(alive){setCatalog(cat);setItems(rows.items);setMappings(maps.entries);setSelected(v=>v||rows.items[0]?.id||'');}
    })().catch(e=>{if(alive)setError(message(e));}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};
  },[revision]);
  useEffect(()=>{if(filtered.length&&!filtered.some(i=>i.id===selected))setSelected(filtered[0].id);},[filter,items,selected]);
  useEffect(()=>{if(!access?.canUseSolo||!item||['mapping','export'].includes(step))return;let alive=true,url;setDetail(null);setReason('');
    (async()=>{const [d,blob]=await Promise.all([api.read('solo_detail',{imageId:item.id}),api.soloImage(item.id)]);url=URL.createObjectURL(blob);if(alive){setDetail(d);setImage(url);}else URL.revokeObjectURL(url);})().catch(e=>{if(alive)setError(message(e));});
    return()=>{alive=false;if(url)URL.revokeObjectURL(url);};
  },[item?.id,step,revision,access?.canUseSolo]);
  useEffect(()=>{if(step!=='export'||!access?.canUseSolo)return;let alive=true;setReadiness([]);api.read('solo_readiness').then(d=>{if(alive)setReadiness(d.items);}).catch(e=>{if(alive)setError(message(e));});return()=>{alive=false;};},[step,revision,access?.canUseSolo]);
  useEffect(()=>{setRelated([]);},[selected]);
  useEffect(()=>()=>{for(const r of related)URL.revokeObjectURL(r.url);},[related]);

  async function save(op,payload) {
    if(lock.current)return;lock.current=true;setBusy(true);setError('');setNotice('');
    try{await api.save(op,payload);setNotice('Đã lưu lịch sử chế độ một người với tài khoản và thời gian thực hiện.');setRevision(v=>v+1);}catch(e){setError(message(e));}finally{lock.current=false;setBusy(false);}
  }
  async function showRelated(){if(lock.current)return;lock.current=true;setBusy(true);setError('');const wanted=selected;const next=[];
    try{const data=await api.read('solo_related',{imageId:wanted});for(const r of data.members){if(r.reference)continue;const blob=await api.soloImage(wanted,r.id);next.push({...r,url:URL.createObjectURL(blob)});}if(selectedRef.current===wanted)setRelated(next);else for(const r of next)URL.revokeObjectURL(r.url);}catch(e){for(const r of next)URL.revokeObjectURL(r.url);setError(message(e));}finally{lock.current=false;setBusy(false);}
  }
  async function exportData(){if(lock.current)return;lock.current=true;setBusy(true);setError('');setNotice('');try{const result=await api.save('solo_export',{imageIds:ids.split('\n').map(v=>v.trim()).filter(Boolean)});const blob=await api.soloDownload(result.file);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=result.file;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice(`Đã xuất ${result.images} ảnh solo-development. Nhãn một người, không phải GT duyệt độc lập. Mã kiểm tra SHA256: ${result.sha256}`);}catch(e){setError(message(e));}finally{lock.current=false;setBusy(false);}}

  return <div className="h-full overflow-auto select-text space-y-5 p-2 sm:p-4"><header className="space-y-2"><p className="text-sm font-semibold text-blue-600">Quản lý AI · Khóa luận một người</p><h1 className="text-2xl font-bold">Tự gán nhãn dữ liệu phát triển</h1><p>Chế độ SOLO_THESIS: một Admin tự gán và xác nhận nhãn. Không yêu cầu Reviewer A/B hoặc người thứ ba.</p><p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Dữ liệu xuất là solo-development, không phải Ground Truth được duyệt độc lập và không phải tập kiểm thử mù. Nguồn, quyền ảnh, taxonomy, hash và metadata vẫn phải được xác minh.</p><Link className="text-blue-600 underline" to="/admin/ai01/overview">Chuyển sang quy trình review độc lập 7 bước</Link></header>
    {error&&<p role="alert" className="rounded-xl border border-rose-300 p-3 whitespace-pre-wrap text-rose-700 dark:text-rose-300">{error}</p>}{notice&&<p role="status" className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-700 dark:text-emerald-300">{notice}</p>}
    {loading?<LoadingReview/>:!access?.enabled||!access?.canUseSolo?<ReviewPanel title="Chưa truy cập được chế độ một người"><p>Cần đăng nhập tài khoản ADMIN active và bật runtime AI-01.</p></ReviewPanel>:<>
      <nav aria-label="Các bước chế độ một người" className="flex flex-wrap gap-2">{Object.entries(STEPS).map(([id,label])=><button key={id} aria-current={step===id?'step':undefined} disabled={busy} className={`${buttonClass} ${step===id?'bg-blue-600 text-white':''}`} onClick={()=>{setStep(id);setError('');setNotice('');}}>{label}</button>)}</nav>
      {step==='mapping'?<MappingReview key={revision} entries={mappings} catalog={catalog} busy={busy} onSave={p=>save('solo_mapping',p)}/>:step==='export'?<>
        <ReviewPanel title="Kiểm điều kiện và xuất solo-development"><p>Chỉ xuất những ảnh do chính bạn gán và xác nhận, đủ mapping SOLO, quyền ảnh, nguồn, nhóm trùng và metadata. Một ảnh thiếu điều kiện sẽ chặn cả yêu cầu.</p><Field label="ID ảnh xuất một người (mỗi dòng một ảnh)"><textarea rows={5} className={fieldClass} value={ids} onChange={e=>setIds(e.target.value)}/></Field><button className={buttonClass} disabled={busy} onClick={exportData}>Xuất dữ liệu một người</button></ReviewPanel>
        <ReviewPanel title="Điều kiện từng ảnh"><p>{readiness.filter(r=>r.eligible).length}/{items.length} ảnh đủ điều kiện nguồn/nhãn; backend còn kiểm chủ sở hữu nhãn khi xuất.</p><ul className="space-y-2">{readiness.map(r=><li key={r.imageId}><b>{r.imageId}</b>: {r.blockers.length?r.blockers.join(' · '):'Đủ điều kiện phát triển một người'}</li>)}</ul></ReviewPanel>
      </>:<><Field label="Phạm vi ảnh"><select className={`${fieldClass} max-w-sm`} value={filter} disabled={busy} onChange={e=>setFilter(e.target.value)}><option value="all">Toàn bộ 150 ảnh pilot</option><option value="water10">Thử 10 ảnh Sửa nước đầu tiên</option></select></Field>
        {item&&<ImageReview items={filtered} item={item} imageUrl={image} datasetNames={DATASETS} reviewTitle="Quyết định gán nhãn một người" onSelect={id=>{if(!busy){setSelected(id);setError('');setNotice('');}}}>
          {!detail?<LoadingReview/>:step==='annotation'?<LabelForm key={`${item.id}-${revision}`} solo catalog={catalog} initial={detail.annotation?.data} busy={busy} onSave={p=>save('solo_annotate',{...p,imageId:item.id,expectedAnnotationHash:detail.annotation?.eventHash||null})}/>:step==='sources'?<SourceReview key={`${item.id}-${revision}`} initial={detail.provenance?.data} busy={busy} onSave={p=>save('solo_save_provenance',{...p,imageId:item.id})} onRelated={showRelated} relatedImages={related}/>:<div className="space-y-3"><p>Đọc lại nhãn và bằng chứng trước khi tự xác nhận. Mọi chỉnh sửa nhãn, mapping hoặc nguồn sẽ yêu cầu xác nhận lại.</p><p>Trạng thái nhãn: {detail.annotation?.data.decision==='submitted'?'Đã gán nhãn, chờ tự kiểm tra':DECISIONS[detail.annotation?.data.decision]||'Chưa gán nhãn'}.</p>
            {detail.annotation&&<div className="space-y-2">{Object.entries({category:'Danh mục',target:'Đối tượng',visibleFault:'Dấu hiệu nhìn thấy',symptom:'Triệu chứng thực tế',recommendedService:'Dịch vụ đề xuất',unknown:'Ngoài phạm vi',needsInspection:'Cần kiểm tra tại chỗ'}).map(([k,title])=><p key={k}><b>{title}:</b> {k==='category'?catalog.categories.find(c=>c.id===detail.annotation.data.labels[k])?.name||'Chưa xác nhận':k==='target'?catalog.targets.find(t=>t.id===detail.annotation.data.labels[k])?.name||'Chưa xác nhận':detail.annotation.data.labels[k]===null?'Chưa xác nhận':typeof detail.annotation.data.labels[k]==='boolean'?(detail.annotation.data.labels[k]?'Có':'Không'):detail.annotation.data.labels[k].map(v=>SIGNS[v]||catalog.services.find(s=>s.id===v)?.name||v).join(', ')||'Đã xem: không có'}</p>)}<p><b>Lý do nhãn:</b> {detail.annotation.data.reason}</p><p><b>Bằng chứng triệu chứng:</b> {detail.annotation.data.symptomEvidence||'Chưa có'}</p><p><b>Bằng chứng dịch vụ:</b> {detail.annotation.data.serviceEvidence||'Chưa có'}</p></div>}
            <Field label="Lý do tự kiểm tra và xác nhận"><textarea className={fieldClass} value={reason} onChange={e=>setReason(e.target.value)}/></Field><button className={buttonClass} disabled={busy||detail.annotation?.data.decision!=='submitted'||!reason.trim()} onClick={()=>save('solo_confirm',{imageId:item.id,annotationEventHash:detail.annotation.eventHash,reason})}>Tự xác nhận nhãn một người</button>
            <p>{detail.confirmation?'Đã có xác nhận; kiểm các điều kiện còn thiếu bên dưới.':'Chưa tự xác nhận.'}</p><ul className="list-disc pl-5">{detail.blockers.map(b=><li key={b}>{b}</li>)}</ul>
          </div>}
        </ImageReview>}
        {detail&&<ReviewPanel title="Lịch sử ảnh trong chế độ một người"><ul className="space-y-3">{detail.history.map(e=><li key={e.eventHash}><b>{EVENT_NAMES[e.kind]||'Quyết định một người'}</b> · {new Date(e.timestamp).toLocaleString('vi-VN')} · Tài khoản: {e.reviewerId}<p>{e.data.reason||'Đã lưu bằng chứng nguồn ảnh.'}</p><details><summary>Xem bản ghi và mã kiểm tra</summary><pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(e,null,2)}</pre></details></li>)}</ul>{!detail.history.length&&<p>Chưa có thao tác cho ảnh này.</p>}</ReviewPanel>}
      </>}
    </>}
  </div>;
}
