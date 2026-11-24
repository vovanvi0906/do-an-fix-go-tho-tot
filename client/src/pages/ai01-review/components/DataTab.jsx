import React, {useEffect, useRef, useState} from 'react';
import {ai01ReviewService as api} from '../../../services/ai01ReviewService';
import {DATASET_NAMES, VISIBLE_SIGNS} from '../labelingOptions';
import {message} from '../constants';
import {buttonClass, fieldClass, Field, LoadingReview} from './ReviewPanel';
import ImageReview from './ImageReview';
import DatasetUploadModal from './DatasetUploadModal';

const STATUSES = {pending:'Chưa kiểm tra', confirmed:'Đã xác nhận', correction:'Cần sửa', uncertain:'Chưa chắc chắn', rejected:'Đã loại'};
const unique = values => [...new Set(values.filter(Boolean))];
function reviewStatus(row) {
  if (['rejected','out_of_scope'].includes(row.status)) return 'rejected';
  if (row.status === 'uncertain') return 'uncertain';
  if (row.imported && row.status==='pending') return 'pending';
  if (row.qualityReview?.pending) return 'correction';
  return row.status === 'confirmed' ? 'confirmed' : 'pending';
}
function Thumbnail({id}) {
  const [url,setUrl]=useState(''), [failed,setFailed]=useState(false);
  useEffect(()=>{let alive=true,objectUrl; api.fastImage(id).then(blob=>{objectUrl=URL.createObjectURL(blob);if(alive)setUrl(objectUrl);else URL.revokeObjectURL(objectUrl);}).catch(()=>{if(alive)setFailed(true);});return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};},[id]);
  return url?<img src={url} alt={`Ảnh ${id}`} className="h-16 w-24 rounded-lg object-cover"/>:<span className={`flex h-16 w-24 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 ${failed?'':'animate-pulse'}`}>{failed?'Không tải được ảnh':'Đang tải'}</span>;
}
export default function DataTab({onLabel,initialImageId='',onBusyChange}) {
  const [uploadOpen,setUploadOpen]=useState(false),[sourceFilter,setSourceFilter]=useState('all');
  const [data,setData]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const [category,setCategory]=useState('all'),[target,setTarget]=useState('all'),[status,setStatus]=useState('all'),[query,setQuery]=useState(''),[page,setPage]=useState(0);
  const [selected,setSelected]=useState(initialImageId),[detail,setDetail]=useState(null),[url,setUrl]=useState(''),[detailError,setDetailError]=useState('');
  const closeRef=useRef(null),opener=useRef(null);
  useEffect(()=>{let alive=true;setError('');setData(null);
    Promise.all([api.read('fast_items'),api.read('fast_catalog'),api.read('fast_mappings')]).then(async ([items,catalog,mappings])=>{
      // The list endpoint omits saved target/sign labels. Read only reviewed records
      // with bounded concurrency so filters use the Admin's actual saved taxonomy.
      const confirmed=items.items.filter(r=>r.status==='confirmed');const saved={};let cursor=0;
      await Promise.all(Array.from({length:Math.min(4,confirmed.length)},async()=>{while(alive&&cursor<confirmed.length){const row=confirmed[cursor++];saved[row.id]=await api.read('fast_detail',{imageId:row.id});}}));
      if(alive)setData({rows:items.items,catalog,mappings:mappings.entries,saved});
    }).catch(e=>{if(alive)setError(message(e));});return()=>{alive=false;};
  },[retry]);
  useEffect(()=>{if(!selected)return;let alive=true,objectUrl;setDetail(null);setUrl('');setDetailError('');
    Promise.all([api.read('fast_detail',{imageId:selected}),api.fastImage(selected)]).then(([d,blob])=>{objectUrl=URL.createObjectURL(blob);if(alive){setDetail(d);setUrl(objectUrl);}else URL.revokeObjectURL(objectUrl);}).catch(e=>{if(alive)setDetailError(message(e));});return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[selected,retry]);
  useEffect(()=>{if(!selected)return;opener.current=document.activeElement;closeRef.current?.focus();const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    function key(e){if(e.key==='Escape')setSelected('');if(e.key==='Tab'){const nodes=[...closeRef.current?.closest('[role="dialog"]').querySelectorAll('button:not(:disabled),select,input,summary,[href]')||[]];const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
    document.addEventListener('keydown',key);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);opener.current?.focus();};
  },[selected]);
  function reset(){setCategory('all');setTarget('all');setStatus('all');setQuery('');setPage(0);setSourceFilter('all');}
  function describe(row) {
    const annotation=data.saved[row.id]?.annotation;
    const mappings=data.mappings.filter(m=>m.dataset===row.dataset&&row.sourceLabelsVi?.includes(m.displayVi?.labelVi));
    if(row.imported){const targets=data.catalog.targets.filter(t=>(row.currentTargetIds||[row.targetHintId]).includes(t.id));return {...row,targets,categoryIds:unique([row.categoryHintId,...targets.map(t=>t.categoryId)]),names:targets.map(t=>t.name),labels:row.currentLabelsVi||[],confirmed:row.labelConfirmed,statusKey:reviewStatus(row)};}
    const targets=annotation?data.catalog.targets.filter(t=>annotation.targetIds.includes(t.id)):unique(mappings.flatMap(m=>m.catalogTargetCandidates.map(t=>t.targetId))).map(id=>data.catalog.targets.find(t=>t.id===id)).filter(Boolean);
    return {...row,targets,categoryIds:unique(targets.map(t=>t.categoryId)),names:targets.map(t=>t.name),labels:annotation?unique([...targets.map(t=>t.name),...(annotation.visibleSigns||[]).map(s=>VISIBLE_SIGNS[s]||s),...(annotation.visualCondition==='no_visible_fault'?['Không thấy dấu hiệu lỗi']:[])]):row.sourceLabelsVi||[],confirmed:!!annotation,statusKey:reviewStatus(row)};
  }
  const rows=data?.rows.map(describe)||[];
  const filtered=rows.filter(r=>(sourceFilter==='all'||(sourceFilter==='admin_upload'?r.imported:!r.imported))&&(category==='all'||r.categoryIds.includes(category))&&(target==='all'||r.targets.some(t=>t.id===target))&&(status==='all'||r.statusKey===status)&&[r.id,...r.names,...r.labels].join(' ').toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));
  const pages=Math.max(1,Math.ceil(filtered.length/12)),currentPage=Math.min(page,pages-1),visible=filtered.slice(currentPage*12,(currentPage+1)*12);
  const categoryName=id=>data.catalog.categories.find(c=>c.id===id)?.name||'Chưa rõ danh mục';
  const selectedRow=rows.find(r=>r.id===selected);
  return <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Thư viện ảnh</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Xem ảnh, đối tượng và nhãn đã kiểm tra. Chọn một ảnh để xem lớn và khung nhãn.</p></div><button className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700`} onClick={()=>setUploadOpen(true)}>Thêm ảnh vào dataset</button></div>
    {error?<div role="alert" className="rounded-xl border border-rose-300 p-4 text-rose-700 dark:text-rose-300">{error}<button className={`${buttonClass} ml-3`} onClick={()=>setRetry(v=>v+1)}>Thử lại</button></div>:!data?<LoadingReview/>:<>
      <div className="grid gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Tìm kiếm ảnh"><input className={fieldClass} placeholder="Mã ảnh, đối tượng hoặc nhãn…" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></Field>
        <Field label="Danh mục"><select className={fieldClass} value={category} onChange={e=>{setCategory(e.target.value);setTarget('all');setPage(0);}}><option value="all">Tất cả danh mục</option>{data.catalog.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Đối tượng"><select className={fieldClass} value={target} onChange={e=>{setTarget(e.target.value);setPage(0);}}><option value="all">Tất cả đối tượng</option>{data.catalog.targets.filter(t=>category==='all'||t.categoryId===category).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Trạng thái kiểm tra"><select className={fieldClass} value={status} onChange={e=>{setStatus(e.target.value);setPage(0);}}><option value="all">Tất cả trạng thái</option>{Object.entries(STATUSES).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><div className="flex flex-wrap gap-3 items-center"><label htmlFor="data-source-filter">Nguồn ảnh</label><select id="data-source-filter" className={`${fieldClass} !w-auto`} value={sourceFilter} onChange={e=>{setSourceFilter(e.target.value);setPage(0);}}><option value="all">Tất cả ảnh</option><option value="original">Dataset có sẵn</option><option value="admin_upload">Ảnh Admin bổ sung</option></select><p><b>{filtered.length.toLocaleString('vi-VN')}</b> / {rows.length.toLocaleString('vi-VN')} ảnh</p></div><button className={buttonClass} onClick={reset}>Xóa bộ lọc</button></div>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <p className="px-4 pt-3 text-xs text-slate-500 dark:text-slate-400 lg:hidden">Vuốt ngang bảng để xem nhãn, trạng thái và thao tác.</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm text-slate-900 dark:text-slate-100"><caption className="sr-only">Danh sách ảnh và trạng thái kiểm tra nhãn</caption><thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300"><tr>{['Hình ảnh','Danh mục','Đối tượng','Nhãn','Trạng thái kiểm tra','Thao tác'].map(h=><th scope="col" key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{visible.map(r=><tr key={r.id} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/30"><td className="p-4"><button aria-label={`Xem ảnh ${r.id}`} onClick={()=>setSelected(r.id)} className="text-left rounded-lg focus-visible:outline-indigo-500"><Thumbnail id={r.id}/><span className="mt-1 block max-w-32 break-all text-xs text-slate-500">{r.id}</span></button></td><td className="p-4">{r.categoryIds.map(categoryName).join(', ')||'Chưa rõ danh mục'}</td><td className="p-4 font-medium">{r.names.join(', ')||'Chưa rõ đối tượng'}</td><td className="p-4 max-w-xs"><p className={`mb-2 text-xs font-medium ${r.confirmed?'text-emerald-700 dark:text-emerald-300':'text-amber-700 dark:text-amber-300'}`}>{r.confirmed?'Admin đã xác nhận':r.imported?'Ảnh bổ sung · Chưa xác nhận':'Roboflow đề xuất'}</p><div className="flex flex-wrap gap-1">{r.labels.length?r.labels.map((label,i)=><span key={i} className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs">{label}</span>):<span className="text-slate-500">Chưa có nhãn</span>}</div></td><td className="p-4"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${r.statusKey==='confirmed'?'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300':r.statusKey==='correction'?'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{STATUSES[r.statusKey]}</span></td><td className="p-4"><div className="flex flex-col items-start gap-2"><button className={buttonClass} onClick={()=>setSelected(r.id)}>Xem chi tiết</button><button className="text-indigo-600 dark:text-indigo-300 font-medium" onClick={()=>onLabel(r.id)}>Gán nhãn / Chỉnh sửa</button></div></td></tr>)}</tbody></table></div>
        {!filtered.length&&<div className="p-12 text-center"><p className="font-medium">Không tìm thấy ảnh phù hợp</p><p className="mt-2 text-sm text-slate-500">Thử từ khóa khác hoặc xóa bộ lọc.</p></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 p-4 text-sm"><span>{filtered.length?`${currentPage*12+1}–${Math.min((currentPage+1)*12,filtered.length)} / ${filtered.length} ảnh`:'0 ảnh'} · Trang {currentPage+1}/{pages}</span><div className="flex gap-2"><button className={buttonClass} disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Trang trước</button><button className={buttonClass} disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)}>Trang tiếp</button></div></div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Nhãn nguồn Roboflow là đề xuất; ảnh Admin bổ sung cần gán nhãn và xác nhận. Nhãn phát triển chưa phải Ground Truth.</p>
    </>}
    {uploadOpen&&<DatasetUploadModal onBusyChange={onBusyChange} catalog={data?.catalog} onClose={()=>setUploadOpen(false)} onImported={()=>{setSourceFilter('admin_upload');setCategory('all');setTarget('all');setStatus('all');setQuery('');setPage(0);setRetry(v=>v+1);}} onLabel={id=>{setUploadOpen(false);onLabel(id);}}/>}
    {selected&&<div className="fixed inset-0 z-50 bg-slate-950/60 p-2 sm:p-6" onClick={e=>{if(e.target===e.currentTarget)setSelected('');}}><section role="dialog" aria-modal="true" aria-labelledby="data-image-title" className="mx-auto max-w-6xl max-h-full overflow-auto rounded-2xl bg-white dark:bg-slate-950 p-4 sm:p-6 shadow-xl"><header className="flex items-center justify-between gap-3 mb-4"><h2 id="data-image-title" className="font-semibold break-all">Chi tiết ảnh · {selected}</h2><button ref={closeRef} className={buttonClass} onClick={()=>setSelected('')}>Đóng</button></header>{detailError?<p role="alert">{detailError}<button className={buttonClass} onClick={()=>setRetry(v=>v+1)}>Thử lại</button></p>:!detail||!url?<LoadingReview/>:<ImageReview items={rows} navigationLimit={30} item={detail} imageUrl={url} onSelect={setSelected} datasetNames={DATASET_NAMES} reviewTitle="Nhãn và trạng thái kiểm tra"><p>{selectedRow?.categoryIds.map(categoryName).join(', ')||'Chưa rõ danh mục'} → <b>{selectedRow?.names.join(', ')||'Chưa rõ đối tượng'}</b></p><p className="text-sm">{STATUSES[selectedRow?.statusKey]} · {selectedRow?.confirmed?'Admin đã xác nhận':detail.imported?'Ảnh bổ sung — chưa xác nhận':'Roboflow đề xuất — chưa xác nhận'}</p><div className="flex flex-wrap gap-2">{selectedRow?.labels.map((label,i)=><span key={i} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-sm">{label}</span>)}</div><p className="text-xs text-slate-500">{detail.imported?'Khung/vùng trên ảnh là nhãn Admin đã lưu. Xem trạng thái để biết nhãn đã được xác nhận hay chưa.':'Khung/vùng trên ảnh thuộc nhãn nguồn Roboflow, chưa được Admin xác nhận.'}</p><button className={`${buttonClass} text-indigo-600 dark:text-indigo-300`} onClick={()=>onLabel(selected)}>Gán nhãn / Chỉnh sửa</button></ImageReview>}</section></div>}
  </div>;
}
