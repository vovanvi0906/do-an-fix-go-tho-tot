import React,{useEffect,useState} from 'react';
import {ai01ReviewService as api} from '../../../services/ai01ReviewService';
import {buttonClass,ReviewPanel} from './ReviewPanel';
import {message} from '../constants';
export default function DatasetQualityPanel({onReview,revision=0,onBusyChange}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[reload,setReload]=useState(0);
 useEffect(()=>{let live=true;api.read('fast_quality_overview').then(d=>{if(live)setData(d);}).catch(e=>{if(live)setError(message(e));});return()=>{live=false;};},[revision,reload]);
 useEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
 async function exportData(){setBusy(true);setError('');try{setResult(await api.save('fast_quality_export',{}));}catch(e){setError(message(e));}finally{setBusy(false);}}
 if(!data?.available&&!error)return null;
 return <ReviewPanel title="TASK 04B — Sửa chất lượng box trên bản sao">
  {data?.available&&<><p className="text-sm">{data.summary.counts.candidateImages.toLocaleString('vi-VN')} ảnh cần xem · {data.summary.counts.candidateSourceBoxes.toLocaleString('vi-VN')} box nguồn · đợt ưu tiên {data.summary.counts.pilotImages} ảnh. Cảnh báo tự động chưa chứng minh box sai.</p><p className="text-sm">Đã lưu: {data.savedImages} · Đã xác nhận: {data.confirmedImages} · Đủ bằng chứng xuất: {data.exportEligibleImages}. Bồn cầu/đường ống phải được vẽ box vật thể riêng; không chuyển vùng rò nước thành vật thể.</p><div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} disabled={busy} onClick={()=>onReview(true)}>Mở đợt sửa ưu tiên</button><button type="button" className={buttonClass} disabled={busy} onClick={()=>onReview(false)}>Xem toàn bộ hàng đợi</button><button type="button" className={buttonClass} disabled={busy||!data.exportEligibleImages} onClick={exportData}>Xuất bbox solo-development đã kiểm tra</button><button type="button" className={buttonClass} disabled={busy} onClick={()=>setReload(v=>v+1)}>Cập nhật tiến độ</button></div><p className="text-xs text-slate-500">Xuất riêng object/sign với YOLO detection, giữ nhóm nguồn cùng split và audit. Lớp sửa đạt mức tối thiểu thử nghiệm: {data.classesMeetingTrialMinimum?.object||0} vật thể / {data.classesMeetingTrialMinimum?.sign||0} dấu hiệu (20 train, 5 val, ít nhất 2/1 nhóm). Vẫn phải kiểm dữ liệu trước train; không chạy train/deploy. Benchmark độc lập không nhận prediction hoặc bản sửa này.</p></>}
  {error&&<p role="alert" className="text-rose-700">{error}</p>}{result&&<p role="status" className="break-all text-sm">Đã xuất {result.images} ảnh: {result.folder}<br/>SHA256 manifest: {result.sha256} · Training tắt · Không phải Ground Truth độc lập.</p>}
 </ReviewPanel>;
}
