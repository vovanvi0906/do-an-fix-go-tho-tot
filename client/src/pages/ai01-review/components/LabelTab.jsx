import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ai01ReviewService as api} from '../../../services/ai01ReviewService';
import {message} from '../constants';
import {buttonClass,fieldClass,Field,LoadingReview} from './ReviewPanel';
import LabelDetailEditor from './LabelDetailEditor';

const STORAGE='fixgo-ai01-label-table';
const DEFAULT_FILTERS={category:'all',target:'all',status:'all',q:'',dataset:'all',sourceLabel:'all',sign:'all',labelType:'all',quality:'all',bbox:'all',imageType:'all',duplicate:'all',queue:'all',priority:'all',usage:'all',quick:'all'};
const STATUS={pending:'Chưa kiểm tra',confirmed:'Đã xác nhận',corrected:'Đã sửa',uncertain:'Chưa chắc chắn',rejected:'Đã loại'};
const ADVANCED={dataset:'Nguồn dataset',sourceLabel:'Nhãn nguồn',sign:'Nhãn dấu hiệu',labelType:'Loại nhãn',quality:'Chất lượng nhãn',bbox:'Tình trạng bbox',imageType:'Loại ảnh',duplicate:'Ảnh trùng',queue:'Hàng đợi ưu tiên',priority:'Mức độ ưu tiên',usage:'Điều kiện sử dụng'};
const DISCARD='Bạn có thay đổi chưa lưu. Bỏ thay đổi và tiếp tục?';
function remembered(){try{return JSON.parse(sessionStorage.getItem(STORAGE)||'{}');}catch{return {};}}
function Thumbnail({id}) {
 const [url,setUrl]=useState(''),[error,setError]=useState(false);
 useEffect(()=>{let alive=true,objectUrl;api.fastImage(id).then(blob=>{objectUrl=URL.createObjectURL(blob);if(alive)setUrl(objectUrl);else URL.revokeObjectURL(objectUrl);}).catch(()=>{if(alive)setError(true);});return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};},[id]);
 return url?<img src={url} alt={`Ảnh ${id}`} className="h-16 w-24 rounded-lg object-cover"/>:<span className={`flex h-16 w-24 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 ${error?'':'animate-pulse'}`}>{error?'Không tải được ảnh':'Đang tải'}</span>;
}
export default function LabelTab({initialImageId='',onBusyChange,onDirtyChange}) {
 const [saved]=useState(()=>initialImageId?{}:remembered());
 const [filters,setFilters]=useState(()=>({...DEFAULT_FILTERS,...saved.filters})),[page,setPage]=useState(saved.page||1),[sort,setSort]=useState(saved.sort||'id'),[direction,setDirection]=useState(saved.direction||'asc');
 const [debouncedQuery,setDebouncedQuery]=useState(filters.q);
 useEffect(()=>{const timer=setTimeout(()=>setDebouncedQuery(filters.q),250);return()=>clearTimeout(timer);},[filters.q]);
 const filterKey=JSON.stringify({...filters,q:debouncedQuery});
 const [options,setOptions]=useState(null),[list,setList]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[notice,setNotice]=useState('');
 const [session,setSession]=useState(null),[opening,setOpening]=useState(false),[busy,setBusy]=useState(false),[navigating,setNavigating]=useState(false),[dirty,setDirty]=useState(false),[lastImage,setLastImage]=useState(saved.lastImage||'');
 const dirtyRef=useRef(false),closeRef=useRef(null),opener=useRef(null),modalRef=useRef(null),listRequest=useRef(0),navigationLock=useRef(false),mounted=useRef(true),deepLinkOpened=useRef(false);
 const markDirty=useCallback(value=>{dirtyRef.current=value;setDirty(value);},[]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;listRequest.current++;};},[]);
 useEffect(()=>{onBusyChange?.(busy||navigating||opening);return()=>onBusyChange?.(false);},[busy,navigating,opening,onBusyChange]);
 useEffect(()=>{onDirtyChange?.(dirty);return()=>onDirtyChange?.(false);},[dirty,onDirtyChange]);
 useEffect(()=>{try{sessionStorage.setItem(STORAGE,JSON.stringify({filters,page,sort,direction,lastImage}));}catch{}},[filters,page,sort,direction,lastImage]);
 useEffect(()=>{let alive=true;api.read('fast_label_options').then(o=>{if(alive)setOptions(o);}).catch(e=>{if(alive)setError(message(e));});return()=>{alive=false;};},[retry]);
 const requestPage=useCallback(async()=>{const token=++listRequest.current;setLoading(true);setError('');try{
  const result=await api.read('fast_label_items',{...JSON.parse(filterKey),page,pageSize:12,sort,direction});
  if(mounted.current&&token===listRequest.current){setList(result);if(result.page!==page)setPage(result.page);}
  return result;
 }catch(e){if(mounted.current&&token===listRequest.current)setError(message(e));return null;}finally{if(mounted.current&&token===listRequest.current)setLoading(false);}},[filterKey,page,sort,direction]);
 useEffect(()=>{if(options)requestPage();},[options,requestPage,retry]);
 async function refresh(){await requestPage();try{const o=await api.read('fast_label_options');if(mounted.current)setOptions(previous=>({...o,filters:Object.fromEntries(Object.entries(o.filters).map(([key,values])=>[key,[...values,...(previous?.filters[key]||[]).filter(v=>!values.some(n=>n.id===v.id)&&filters[key]===v.id)]]))}));}catch(e){if(mounted.current)setError(message(e));}}
 function allow(){return !busy&&!navigating&&(!dirtyRef.current||window.confirm(DISCARD));}
 const close=useCallback(()=>{if(busy||navigating||dirtyRef.current&&!window.confirm(DISCARD))return;markDirty(false);setSession(null);setNotice('');},[busy,navigating,markDirty]);
 async function open(id){if(opening||!allow())return;setOpening(true);setError('');setNotice('');opener.current=document.activeElement;try{
  const queue=await api.read('fast_label_queue',{...filters,sort,direction,imageId:id});if(mounted.current){markDirty(false);setSession(queue);setLastImage(id);}
 }catch(e){setError(message(e));}finally{if(mounted.current)setOpening(false);}}
 useEffect(()=>{if(initialImageId&&options&&list&&!deepLinkOpened.current){deepLinkOpened.current=true;open(initialImageId);}},[initialImageId,options,list]);
 async function move(moveDirection='next'){
  if(!session||navigationLock.current)return;
  // Explicit save clears dirty before calling this; manual navigation asks first.
  if(dirtyRef.current&&!window.confirm(DISCARD))return;
  navigationLock.current=true;setNavigating(true);setNotice('');try{
   const next=await api.read('fast_label_queue',{queueId:session.queueId,imageId:session.imageId,move:moveDirection});
   if(!mounted.current)return;
   if(next.imageId){markDirty(false);setSession(next);setLastImage(next.imageId);modalRef.current?.scrollTo?.({top:0});}
   else setNotice(moveDirection==='next'?'Đã đến cuối danh sách đang lọc.':'Đây là ảnh đầu trong danh sách đang lọc.');
  }catch(e){if(mounted.current)setNotice(message(e));}finally{navigationLock.current=false;if(mounted.current)setNavigating(false);}
 }
 useEffect(()=>{if(!session)return;closeRef.current?.focus();const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  function key(e){if(e.key==='Escape'&&e.target.closest('[aria-label="Sửa bbox trên bản sao"]'))return;if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const nodes=[...modalRef.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
  document.addEventListener('keydown',key);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);opener.current?.focus();};
 },[!!session,close]);
 useEffect(()=>{function unload(e){if(dirtyRef.current){e.preventDefault();e.returnValue='';}}function link(e){if(e.target.closest('a[href]')&&dirtyRef.current&&!window.confirm(DISCARD)){e.preventDefault();e.stopPropagation();}}window.addEventListener('beforeunload',unload);document.addEventListener('click',link,true);return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',link,true);};},[]);
 useEffect(()=>{if(!dirty)return;const current=history.state?.idx;if(typeof current!=='number')return;let restoring=false,delta=0,proceeding=false;function back(e){if(proceeding||typeof e.state?.idx!=='number')return;if(restoring){e.stopImmediatePropagation();restoring=false;if(window.confirm(DISCARD)){proceeding=true;markDirty(false);history.go(delta);}return;}if(e.state.idx===current)return;e.stopImmediatePropagation();delta=e.state.idx-current;restoring=true;history.go(-delta);}window.addEventListener('popstate',back,true);return()=>window.removeEventListener('popstate',back,true);},[dirty,markDirty]);
 function change(key,value){setFilters(f=>({...f,[key]:value,...(key==='category'?{target:'all'}:{})}));setPage(1);}
 function reset(){setFilters({...DEFAULT_FILTERS});setPage(1);}
 function selectFilter(key,label,values){return <Field key={key} label={label}><select className={fieldClass} value={filters[key]} onChange={e=>change(key,e.target.value)}><option value="all">Tất cả</option>{values.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>;}
 const targetName=id=>options?.catalog.targets.find(t=>t.id===id)?.name||'Đối tượng không còn hoạt động';
 const categoryName=id=>options?.catalog.categories.find(c=>c.id===id)?.name||'Danh mục không còn hoạt động';
 const disabled=busy||navigating||opening||debouncedQuery!==filters.q;
 return <div className="space-y-4 text-slate-900 dark:text-slate-100">
  <div><h2 className="text-lg font-semibold">Quản lý gán nhãn</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Lọc nhóm ảnh cần xử lý, mở một dòng để kiểm tra và gán nhãn.</p></div>
  {error&&<div role="alert" className="rounded-xl border border-rose-300 p-3 text-rose-700 dark:text-rose-300">{error}<button className={`${buttonClass} ml-2`} onClick={()=>setRetry(v=>v+1)}>Thử lại</button></div>}
  {!options?!error&&<LoadingReview/>:<>
   <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
     {selectFilter('category','Danh mục',options.catalog.categories)}
     {selectFilter('target','Đối tượng',options.catalog.targets.filter(t=>filters.category==='all'||t.categoryId===filters.category))}
     {selectFilter('status','Trạng thái',options.filters.status)}
     <Field label="Tìm ID ảnh"><input className={fieldClass} placeholder="Ví dụ: img-19358" value={filters.q} onChange={e=>change('q',e.target.value)}/></Field>
    </div>
    <details><summary className="cursor-pointer text-sm font-medium">Bộ lọc nâng cao{Object.keys(ADVANCED).filter(k=>filters[k]!=='all').length?` (${Object.keys(ADVANCED).filter(k=>filters[k]!=='all').length})`:''}</summary><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(ADVANCED).filter(([key])=>options.filters[key]?.length).map(([key,label])=>selectFilter(key,label,options.filters[key]))}</div><p className="mt-3 text-xs text-slate-500">Dấu hiệu nguồn là đề xuất. Nghi quảng cáo, gần trùng và bbox nghi sai là cờ cần kiểm tra. Ưu tiên lấy từ TASK 04B, hoặc hàng đợi chuẩn hóa nếu chưa có TASK 04B.</p></details>
    <div className="flex flex-wrap gap-2">{(options.filters.quick||[]).map(v=><button key={v.id} aria-pressed={filters.quick===v.id} className={`${buttonClass} ${filters.quick===v.id?'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300':''}`} onClick={()=>change('quick',filters.quick===v.id?'all':v.id)}>{v.name}</button>)}<button className={`${buttonClass} ml-auto`} onClick={reset}>Xóa bộ lọc</button></div>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p role="status" aria-live="polite">{loading?'Đang lọc…':`${(list?.total||0).toLocaleString('vi-VN')} ảnh phù hợp`}</p><div className="flex flex-wrap items-center gap-2"><label htmlFor="label-sort">Sắp xếp</label><select id="label-sort" className={`${fieldClass} !w-auto`} value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="id">ID ảnh</option><option value="status">Trạng thái</option><option value="priority">Mức ưu tiên</option></select><button className={buttonClass} onClick={()=>{setDirection(v=>v==='asc'?'desc':'asc');setPage(1);}}>{direction==='asc'?'Tăng dần ↑':'Giảm dần ↓'}</button></div></div>
   {loading&&!list?<LoadingReview/>:<div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50" aria-busy={loading}>
    <p className="px-4 pt-3 text-xs text-slate-500 lg:hidden">Vuốt ngang bảng để xem nhãn và trạng thái.</p>
    <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm text-slate-900 dark:text-slate-100"><caption className="sr-only">Danh sách ảnh để gán nhãn</caption><thead className="bg-slate-50 dark:bg-slate-800/60"><tr>{['Ảnh / ID','Danh mục FixGo','Đối tượng','Nhãn hiện tại','Trạng thái kiểm tra','Thao tác'].map(h=><th scope="col" key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody className={`divide-y divide-slate-200 dark:divide-slate-800 ${loading?'opacity-50':''}`}>{(list?.items||[]).map(row=><tr key={row.id} tabIndex={loading?-1:0} aria-label={`Gán nhãn ${row.id}`} className={`cursor-pointer align-top hover:bg-slate-50 dark:hover:bg-slate-800/40 focus-visible:outline-indigo-500 ${lastImage===row.id?'bg-indigo-50/40 dark:bg-indigo-950/20':''}`} onClick={()=>{if(!loading&&!disabled)open(row.id);}} onKeyDown={e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)&&!loading&&!disabled){e.preventDefault();open(row.id);}}}>
     <td className="p-4"><Thumbnail id={row.id}/><span className="mt-1 block text-xs text-slate-500">{row.id}</span></td>
     <td className="p-4">{row.categoryIds.map(categoryName).join(', ')||'Chưa rõ danh mục'}</td><td className="p-4 font-medium">{row.targetIds.map(targetName).join(', ')||'Chưa rõ đối tượng'}</td>
     <td className="p-4 max-w-xs"><p className={`mb-1 text-xs ${row.labelOrigin==='admin'?'text-emerald-700 dark:text-emerald-300':'text-amber-700 dark:text-amber-300'}`}>{row.labelOrigin==='admin'?'Nhãn Admin đã lưu':row.imported?'Ảnh bổ sung · Chưa gán nhãn':'Roboflow đề xuất'}</p><div className="flex flex-wrap gap-1">{row.labels.length?row.labels.map((label,i)=><span key={i} className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs">{label}</span>):<span className="text-slate-500">Chưa có nhãn</span>}</div></td>
     <td className="p-4"><span className={`inline-block rounded-full px-2 py-1 text-xs ${['confirmed','corrected'].includes(row.status)?'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300':'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{STATUS[row.status]}</span>{row.priority!==null&&<span className="mt-2 block text-xs text-slate-500">P{row.priority}</span>}</td>
     <td className="p-4"><button className={buttonClass} disabled={loading||disabled} onClick={e=>{e.stopPropagation();open(row.id);}}>Xem / Chỉnh sửa</button></td>
    </tr>)}</tbody></table></div>
    {!loading&&!list?.items.length&&<div className="p-12 text-center"><p className="font-medium">Không có ảnh phù hợp</p><p className="mt-2 text-sm text-slate-500">Thử bỏ bớt điều kiện hoặc xóa bộ lọc.</p></div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 p-4 text-sm"><span>Trang {list?.page||page}/{list?.pages||1} · 12 ảnh/trang</span><div className="flex gap-2"><button className={buttonClass} disabled={loading||page<=1} onClick={()=>setPage(p=>p-1)}>Trang trước</button><button className={buttonClass} disabled={loading||page>=(list?.pages||1)} onClick={()=>setPage(p=>p+1)}>Trang tiếp</button></div></div>
   </div>}
  </>}
  {session&&<div className="fixed inset-0 z-50 bg-slate-950/65 p-2 sm:p-4" onClick={e=>{if(e.target===e.currentTarget)close();}}><section ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="label-modal-title" className="mx-auto max-w-7xl max-h-full overflow-auto overscroll-contain rounded-2xl bg-white dark:bg-slate-950 p-4 sm:p-6 shadow-xl">
   <header className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h2 id="label-modal-title" className="font-semibold">Gán nhãn · {session.imageId}</h2><p className="text-xs text-slate-500 mt-1">Ảnh {session.position}/{session.total} trong phiên duyệt theo bộ lọc</p></div><div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={busy||navigating||session.position<=1} onClick={()=>move('previous')}>Ảnh trước</button><button className={buttonClass} disabled={busy||navigating||session.position>=session.total} onClick={()=>move('next')}>Ảnh tiếp</button><button ref={closeRef} className={buttonClass} disabled={busy||navigating} onClick={close}>Đóng</button></div></header>
   {dirty&&<p role="status" className="mb-3 text-sm text-amber-700 dark:text-amber-300">Có thay đổi chưa lưu</p>}{notice&&<p role="status" className="mb-3 text-sm text-indigo-700 dark:text-indigo-300">{notice}</p>}
   <LabelDetailEditor key={session.imageId} imageId={session.imageId} catalog={options.catalog} onSaved={refresh} onNext={()=>move('next')} onDirtyChange={markDirty} onBusyChange={setBusy}/>
  </section></div>}
 </div>;
}
