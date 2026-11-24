import React,{useEffect,useRef,useState} from 'react';
import {ai01ReviewService as api} from '../../../services/ai01ReviewService';
import {buttonClass,fieldClass,Field,LoadingReview,ReviewPanel} from './ReviewPanel';
import {message} from '../constants';

const TASKS={category_classification:'Phân loại danh mục',object_detection:'Nhận diện đối tượng',visible_sign_detection:'Nhận diện dấu hiệu lỗi'};
// Reference defaults from prepare_dataset.py / train_prepared.py, NOT a job configuration API.
const CLI_REFERENCE={epochs:10,batch:8,seed:23,workers:0,device:'CPU'};
const format=value=>Number.isFinite(value)?value.toLocaleString('vi-VN'):'—';
const metadataClass='text-xs text-slate-500 dark:text-slate-400';
const launchReason='Admin chưa có API khởi chạy và theo dõi huấn luyện. Cần kết nối job training, danh sách model và cấu hình trước khi có thể bắt đầu tại đây.';

export default function TrainingTab({capability,onReview,onBusyChange}) {
 const [prepared,setPrepared]=useState(null),[readiness,setReadiness]=useState(null),[loading,setLoading]=useState(true),[checking,setChecking]=useState(false),[exporting,setExporting]=useState(false);
 const [errors,setErrors]=useState({}),[notice,setNotice]=useState(''),[exportResult,setExportResult]=useState(null),[task,setTask]=useState('object_detection'),[showReasons,setShowReasons]=useState(false),[page,setPage]=useState(0);
 const alive=useRef(true),request=useRef(0),exportLock=useRef(false);
 const busy=checking||exporting;
 useEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
 async function load(manual=false){
  const token=++request.current;if(manual){setChecking(true);setNotice('');}else setLoading(true);
  const result=await Promise.allSettled([api.read('fast_preparation'),api.read('fast_readiness')]);
  if(!alive.current||token!==request.current)return;
  const nextErrors={};
  if(result[0].status==='fulfilled')setPrepared(result[0].value);else{setPrepared(null);nextErrors.prepared=message(result[0].reason);}
  if(result[1].status==='fulfilled'){setReadiness(result[1].value);setPage(p=>Math.min(p,Math.max(0,Math.ceil(result[1].value.items.length/50)-1)));}else{setReadiness(null);nextErrors.readiness=message(result[1].reason);}
  setErrors(nextErrors);setLoading(false);setChecking(false);
  if(manual&&Object.keys(nextErrors).length===0)setNotice('Đã cập nhật báo cáo dữ liệu và điều kiện xuất SOLO. Đây chưa phải kiểm tra toàn bộ dataset trước khi train.');
 }
 useEffect(()=>{alive.current=true;load();return()=>{alive.current=false;request.current++;};},[]);
 const summary=prepared?.available?prepared.summary:null;
 const tasks=Object.keys(TASKS).filter(id=>summary?.tasks?.[id]?.images>0);
 const selectedTask=tasks.includes(task)?task:tasks[0]||'';
 const stats=summary?.tasks?.[selectedTask];
 const version=summary?.exportRoot?.split(/[\\/]/).filter(Boolean).pop()||'Dataset đã chuẩn bị';
 const lowSupport=(stats?.classes||[]).filter(c=>!c.enoughForExploratoryTrial);
 const sufficient=!!stats&&stats.allClassesMeetTrialMinimum===true&&stats.trainImages>0&&stats.valImages>0&&stats.groupOverlap===0;
 const reasons=[
  ...(!stats?['Chưa có dataset hỗ trợ tác vụ. Kiểm tra lại báo cáo chuẩn bị dữ liệu.']:[]),
  ...(stats&&(!stats.trainImages||!stats.valImages)?['Thiếu ảnh train hoặc validation. Cần bổ sung dữ liệu trong pipeline chuẩn bị trước khi chạy.']:[]),
  ...(lowSupport.length?[`${lowSupport.length} lớp chưa đạt ngưỡng thử nghiệm. Xem số lượng theo lớp bên dưới và bổ sung ảnh/nhóm ảnh cho các lớp này.`]:[]),
  ...(stats?.groupOverlap>0?['Có nhóm ảnh giao giữa train và validation. Cần xử lý trùng/cùng cảnh và kiểm tra lại split trước khi chạy.']:[]),
  ...(stats&&!sufficient&&!lowSupport.length&&stats.trainImages>0&&stats.valImages>0&&!(stats.groupOverlap>0)?['Báo cáo chưa xác nhận đủ ngưỡng thử nghiệm và tách nhóm train/validation. Cần kiểm tra lại pipeline dữ liệu.']:[]),
  'Nhãn nguồn chưa được xác minh. Pipeline CLI yêu cầu xác nhận rõ việc dùng nhãn nguồn và kiểm tra checksum, split, nguồn ảnh trước khi chạy.',
  'Chưa có model pretrained được API công bố. Pipeline CLI yêu cầu weights YOLO cục bộ khớp tác vụ detect/classify.',
  launchReason,
 ];
 async function exportData(){
  if(exportLock.current||!readiness?.eligibleCount)return;exportLock.current=true;setExporting(true);setErrors(e=>({...e,export:''}));setExportResult(null);
  try{
   const result=await api.save('fast_export',{}),blob=await api.fastDownload(result.file),url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download=result.file;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   if(alive.current)setExportResult(result);
  }catch(e){if(alive.current)setErrors(v=>({...v,export:message(e)}));}finally{exportLock.current=false;if(alive.current)setExporting(false);}
 }
 const reviewRows=readiness?.items.slice(page*50,(page+1)*50)||[];
 return <div className="space-y-4 text-slate-900 dark:text-slate-100">
  <div><h2 className="text-lg font-semibold">Huấn luyện AI</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chọn dữ liệu → Chọn mô hình → Cấu hình → Huấn luyện → Theo dõi kết quả</p></div>
  <p className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-200"><b>Chưa thể huấn luyện từ Admin.</b> Hiện có báo cáo dữ liệu và chức năng xuất SOLO; chạy và theo dõi training cần API backend bổ sung.</p>
  {notice&&<p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
  <div className="grid min-w-0 gap-4 lg:grid-cols-2 [&>section]:min-w-0">
   <ReviewPanel title="A. Bộ dữ liệu">
    {errors.prepared?<p role="alert" className="text-sm text-rose-700 dark:text-rose-300">Không đọc được dữ liệu: {errors.prepared}</p>:loading?<LoadingReview/>:<>
     <Field label="Phiên bản dataset"><select className={fieldClass} value={stats?'prepared':''} disabled={!stats||busy} onChange={()=>{}}>{stats?<option value="prepared">{version} · Nhãn nguồn phát triển</option>:<option value="">Chưa có dataset hỗ trợ</option>}</select></Field>
     {!stats?<p className="text-sm text-slate-500">{prepared?.progress?`Đang chuẩn bị báo cáo: ${format(prepared.progress.processed)} / ${format(prepared.progress.total)} ảnh.`:'Chưa có phiên bản dataset dùng được. Cần chuẩn bị dữ liệu và công bố báo cáo trước.'}</p>:<>
      <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">{[['Ảnh train',stats.trainImages],['Ảnh validation',stats.valImages],['Số lớp',stats.classes.length]].map(([label,value])=><div key={label}><dt className={metadataClass}>{label}</dt><dd className="mt-1 text-xl font-semibold">{format(value)}</dd></div>)}</dl>
      <p className={`text-sm font-medium ${sufficient?'text-emerald-700 dark:text-emerald-300':'text-amber-700 dark:text-amber-300'}`}>{sufficient?'Đạt ngưỡng số lượng cho thử nghiệm':'Chưa đạt điều kiện dữ liệu cho thử nghiệm'}</p>
      <p className={metadataClass}>Số liệu theo tác vụ đang chọn. Nhãn nguồn chưa xác minh; đạt ngưỡng số lượng chưa có nghĩa là được phép train.</p>
     </>}
    </>}
    <div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={busy||loading} onClick={()=>load(true)}>{checking?'Đang kiểm tra báo cáo…':'Kiểm tra dữ liệu'}</button><button className={buttonClass} aria-expanded={showReasons} aria-controls="training-reasons" onClick={()=>setShowReasons(v=>!v)}>Xem lý do chưa thể train</button></div>
    {errors.readiness&&<p className="text-xs text-amber-800 dark:text-amber-300">Chưa đọc được điều kiện xuất SOLO. Xem lỗi trong Chi tiết dữ liệu hoặc chọn Kiểm tra dữ liệu để thử lại.</p>}
    {showReasons&&<div id="training-reasons" className="rounded-lg border border-amber-200 dark:border-amber-900 p-3"><ul className="list-disc pl-4 space-y-2 text-sm">{reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>{onReview&&<button className={`${buttonClass} mt-3`} disabled={busy} onClick={()=>onReview()}>Mở tab Gán nhãn</button>}</div>}
    <details className="text-sm"><summary className="cursor-pointer font-medium">Chi tiết dữ liệu</summary><div className="mt-3 space-y-4">
     <p className={metadataClass}>Nút Kiểm tra dữ liệu đọc lại báo cáo chuẩn bị và trạng thái SOLO. API chỉ kiểm các checksum báo cáo hiện có; kiểm đầy đủ ảnh, nhãn và chống leakage vẫn nằm trong pipeline CLI trước khi train.</p>
     {stats&&<><p className={`break-all ${metadataClass}`}>Dataset: {summary.exportRoot} · Báo cáo: {summary.createdAt?new Date(summary.createdAt).toLocaleString('vi-VN'):'Chưa có thời gian'}</p>{summary.minimumTrialCriteria&&<p className={metadataClass}>Ngưỡng thử nghiệm của báo cáo: {format(summary.minimumTrialCriteria.trainImages)} ảnh train, {format(summary.minimumTrialCriteria.valImages)} ảnh validation; tối thiểu {format(summary.minimumTrialCriteria.trainGroups)} nhóm train và {format(summary.minimumTrialCriteria.valGroups)} nhóm validation cho mỗi lớp.</p>}<div className="overflow-x-auto"><table className="w-full text-left text-xs text-slate-900 dark:text-slate-100"><caption className="sr-only">Mức hỗ trợ từng lớp của tác vụ đang chọn</caption><thead><tr>{['Lớp','Train','Validation','Điều kiện thử nghiệm'].map(h=><th scope="col" key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{stats.classes.map(c=><tr key={c.key} className="border-t border-slate-200 dark:border-slate-800"><td className="p-2">{c.name}</td><td className="p-2">{format(c.trainImages)}</td><td className="p-2">{format(c.valImages)}</td><td className="p-2">{c.enoughForExploratoryTrial?'Đạt ngưỡng tối thiểu':'Cần bổ sung dữ liệu'}</td></tr>)}</tbody></table></div><details><summary className="cursor-pointer">Kiểm tra split và chống leakage</summary><p className={`mt-2 ${metadataClass}`}>Chỉ xem train/validation phát triển của bản chuẩn bị. Các nhóm trùng/cùng cảnh phải ở cùng split; số nhóm giao của tác vụ: {format(stats.groupOverlap)}. API không xác nhận toàn bộ hash ảnh ở bước này.</p>{summary.leakageChecks&&<pre className="mt-2 whitespace-pre-wrap break-all text-xs">{JSON.stringify(summary.leakageChecks,null,2)}</pre>}</details></>}
     <details><summary className="cursor-pointer">Kiểm tra và xuất nhãn SOLO đã xác nhận</summary><div className="mt-3 space-y-3">
      {errors.readiness?<p role="alert" className="text-rose-700 dark:text-rose-300">Không đọc được điều kiện xuất: {errors.readiness}</p>:!readiness?<p className={metadataClass}>Chưa có báo cáo điều kiện xuất.</p>:<>
       <p className="text-sm">{format(readiness.eligibleCount)} ảnh đủ điều kiện xuất · {format(readiness.quarantineCount)} ảnh đã lưu còn cách ly.</p>
       <p className={metadataClass}>Bản xuất SOLO tách riêng với dataset nhãn nguồn ở trên; chưa có split và cấu hình training được API công bố. Nhãn sửa phải kiểm tra lại nguồn, quyền ảnh và nhóm trùng; không dùng làm Ground Truth độc lập.</p>
       <button className={buttonClass} disabled={busy||!readiness.eligibleCount} aria-describedby="solo-export-reason" onClick={exportData}>{exporting?'Đang xuất…':'Xuất solo-development đủ điều kiện'}</button>
       <p id="solo-export-reason" className={metadataClass}>{exporting?'Đang xác minh và tải bản xuất.':readiness.eligibleCount?'Server tiếp tục kiểm quyền, checksum và điều kiện xuất khi tạo bản xuất.':'Chưa có ảnh đủ điều kiện. Xác nhận nhãn và bổ sung bằng chứng ở tab Gán nhãn trước khi xuất.'}</p>
       <div className="overflow-auto"><table className="w-full text-left text-xs text-slate-900 dark:text-slate-100"><caption className="sr-only">Kiểm tra từng ảnh SOLO trước khi xuất</caption><thead><tr>{['Ảnh đã lưu','Điều kiện xuất','Thao tác'].map(h=><th scope="col" key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{reviewRows.map(row=><tr key={row.imageId} className="border-t border-slate-200 dark:border-slate-800"><td className="p-2">{row.imageId}</td><td className="p-2">{row.eligible?'Đủ điều kiện SOLO':row.blockers.join(' · ')}</td><td className="p-2"><button className={buttonClass} disabled={busy} onClick={()=>onReview?.(row.imageId)}>Kiểm tra ảnh</button></td></tr>)}</tbody></table></div>
       {!readiness.items.length&&<p className={metadataClass}>Chưa có quyết định nhãn đã lưu. Bắt đầu từ tab Gán nhãn.</p>}
       {readiness.items.length>50&&<div className="flex flex-wrap items-center gap-2"><button className={buttonClass} disabled={busy||page===0} onClick={()=>setPage(v=>v-1)}>Trang trước</button><span>Trang {page+1}/{Math.ceil(readiness.items.length/50)}</span><button className={buttonClass} disabled={busy||(page+1)*50>=readiness.items.length} onClick={()=>setPage(v=>v+1)}>Trang tiếp</button></div>}
      </>}
      {errors.export&&<p role="alert" className="text-rose-700 dark:text-rose-300">{errors.export}</p>}
      {exportResult&&<div role="status" className="text-sm text-emerald-700 dark:text-emerald-300">Đã xuất {exportResult.images} ảnh solo-development.<details className="mt-2 text-xs"><summary className="cursor-pointer">Checksum và audit bản xuất</summary><p className="break-all">SHA256: {exportResult.sha256}<br/>Audit: {exportResult.exportAuditHash}</p></details></div>}
     </div></details>
    </div></details>
   </ReviewPanel>
   <ReviewPanel title="B. Mô hình và tác vụ">
    <Field label="Tác vụ"><select className={fieldClass} disabled={!tasks.length||busy} value={selectedTask} onChange={e=>setTask(e.target.value)}>{tasks.length?tasks.map(id=><option key={id} value={id}>{TASKS[id]}</option>):<option value="">Chưa có tác vụ được dataset hỗ trợ</option>}</select></Field>
    <p className={metadataClass}>Chỉ hiển thị tác vụ có ảnh trong báo cáo dataset. Lựa chọn này dùng để xem dữ liệu và cấu hình tham khảo.</p>
    <Field label="Model pretrained"><select className={fieldClass} value="" disabled aria-describedby="training-model-reason"><option value="">Chưa có model được API công bố</option></select></Field>
    <p id="training-model-reason" className="text-sm text-slate-600 dark:text-slate-300">Chưa thể chọn model trên Admin. Pipeline CLI cần weights YOLO cục bộ tương thích{selectedTask?` với tác vụ ${selectedTask==='category_classification'?'classify':'detect'}`:''}; không có danh sách model pretrained để lựa chọn từ API.</p>
   </ReviewPanel>
   <ReviewPanel title="C. Cấu hình huấn luyện">
    <p className="text-sm text-slate-600 dark:text-slate-300">Cấu hình mẫu của pipeline CLI, chỉ để tham khảo. API chưa cung cấp cấu hình phiên train hoặc lưu thay đổi từ Admin.</p>
    <div className="grid grid-cols-2 gap-3">
     <Field label="Epochs"><input type="number" className={fieldClass} value={CLI_REFERENCE.epochs} readOnly aria-describedby="training-config-note"/></Field>
     <Field label="Image size"><input type="number" className={fieldClass} value={selectedTask?(selectedTask==='category_classification'?224:640):''} readOnly aria-describedby="training-config-note"/></Field>
     <Field label="Batch size"><input type="number" className={fieldClass} value={CLI_REFERENCE.batch} readOnly aria-describedby="training-config-note"/></Field>
     <Field label="Thiết bị CPU/GPU"><input className={fieldClass} value={CLI_REFERENCE.device} readOnly aria-describedby="training-config-note"/></Field>
    </div>
    <p id="training-config-note" className={metadataClass}>CLI hiện cố định CPU; GPU chưa được pipeline này hỗ trợ. Image size mẫu: detection 640, classification 224. Đây không phải cấu hình của một lần train đang chạy.</p>
    <details className="text-sm"><summary className="cursor-pointer font-medium">Cài đặt nâng cao</summary><dl className="mt-3 grid grid-cols-2 gap-3"><div><dt className={metadataClass}>Seed mẫu</dt><dd>{CLI_REFERENCE.seed}</dd></div><div><dt className={metadataClass}>Workers CLI</dt><dd>{CLI_REFERENCE.workers}</dd></div></dl><p className={`mt-3 ${metadataClass}`}>Cấu hình tham khảo từ prepare_dataset.py và train_prepared.py; API chưa trả experiment.json hoặc khả năng phần cứng. Chỉ kiểm các split train/validation phát triển; không lấy tập test độc lập làm dữ liệu train.</p></details>
    <button className={`${buttonClass} bg-indigo-600 text-white`} disabled aria-describedby="training-launch-reason">Bắt đầu huấn luyện</button>
    <p id="training-launch-reason" className="text-sm text-amber-800 dark:text-amber-300">{launchReason}</p>
   </ReviewPanel>
   <ReviewPanel title="D. Tiến trình và lịch sử">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium">Chưa có phiên train từ Admin</span><span className={metadataClass}>Theo dõi: chưa kết nối</span></div>
    <p className="text-sm text-slate-600 dark:text-slate-300">Chưa có API tiến trình, metrics hoặc lịch sử. Không xác định được các lần chạy CLI từ trang này.</p>
    <dl className="grid grid-cols-2 gap-3">{['Tiến độ / epoch','Loss','Thời gian',...(selectedTask==='category_classification'?['Accuracy / F1']:['Precision / Recall / mAP'])].map(label=><div key={label}><dt className={metadataClass}>{label}</dt><dd className="mt-1 text-sm">Chưa có dữ liệu</dd></div>)}</dl>
    <div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-xs text-slate-900 dark:text-slate-100"><caption className="sr-only">Lịch sử huấn luyện từ Admin</caption><thead><tr>{['Tên model','Dataset','Tác vụ','Ngày train','Trạng thái','Kết quả'].map(h=><th scope="col" key={h} className="p-2">{h}</th>)}</tr></thead><tbody><tr><td colSpan={6} className="border-t border-slate-200 dark:border-slate-800 py-5 text-center text-slate-500 dark:text-slate-400">Chưa kết nối lịch sử huấn luyện.</td></tr></tbody></table></div>
    <details className="text-sm"><summary className="cursor-pointer font-medium">Chi tiết phiên train</summary><div className={`mt-3 space-y-2 ${metadataClass}`}><p>Chưa có mã phiên, log, kết quả hoặc đường dẫn artifact do API trả về. Chưa thể xem, tải model, hủy hay chạy lại từ Admin.</p><p className="break-all">Pipeline CLI hiện có: {capability?.cliSource||'server/scripts/ai01/train_prepared.py'}</p><p>CLI chỉ ghi vào thư mục thử nghiệm mới, kiểm validation trước khi chạy và không tự deploy hoặc thay model production.</p></div></details>
   </ReviewPanel>
  </div>
 </div>;
}
