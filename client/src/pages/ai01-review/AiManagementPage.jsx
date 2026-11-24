import React,{useEffect,useState} from 'react';
import {Navigate,useParams,useSearchParams} from 'react-router-dom';
import {Database,Tags,BrainCircuit,ChartNoAxesCombined,Rocket,ShieldCheck} from 'lucide-react';
import {ai01ReviewService as api} from '../../services/ai01ReviewService';
import {buttonClass,LoadingReview,ReviewPanel} from './components/ReviewPanel';
import TrainingTab from './components/TrainingTab';
import LabelTab from './components/LabelTab';
import DataTab from './components/DataTab';
import {message} from './constants';

const TABS=[['data','Dữ liệu',Database],['label','Gán nhãn',Tags],['training','Huấn luyện',BrainCircuit],['evaluation','Đánh giá',ChartNoAxesCombined],['deployment','Triển khai',Rocket]];
const LEGACY={overview:'data',mapping:'data',sources:'data',permissions:'data',adjudication:'data',annotation:'label',solo:'label','fast-label':'label',export:'training'};
export function AiManagementLegacyRedirect(){const {section}=useParams();return <Navigate to={`/admin/ai01?tab=${LEGACY[section]||'data'}`} replace/>;}

function Unavailable({title,capability,children}){
 return <ReviewPanel title={title}><p className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold">{capability?.supported?'Đã kết nối':'Chưa hỗ trợ từ Admin Web'}</p><p className="text-sm text-slate-600 dark:text-slate-300">{capability?.reason}</p>{children}</ReviewPanel>;
}

export default function AiManagementPage(){
 const [params,setParams]=useSearchParams(),[access,setAccess]=useState(null),[status,setStatus]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0),[labelDirty,setLabelDirty]=useState(false);
 const requested=params.get('tab'),tab=TABS.some(t=>t[0]===requested)?requested:'data';
 useEffect(()=>{let alive=true;setError('');setAccess(null);setStatus(null);api.access().then(async a=>{if(!alive)return;setAccess(a);if(a.enabled&&a.canUseSolo){const s=await api.read('management_status');if(alive)setStatus(s);}}).catch(e=>{if(alive)setError(message(e));});return()=>{alive=false;};},[retry]);
 function changeTab(value,imageId){if(tab==='label'&&labelDirty&&!window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và chuyển tab?'))return;const p=new URLSearchParams();p.set('tab',value);if(imageId)p.set('image',imageId);setParams(p);}
 const allowed=access?.enabled&&access?.canUseSolo;
 return <div className="h-full overflow-auto select-text"><div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
  <header className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-7">
   <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_65%)]"/>
   <div className="relative flex flex-wrap justify-between gap-4"><div><p className="text-xs uppercase tracking-widest font-semibold text-indigo-600 dark:text-indigo-300">FixGo · SOLO_THESIS</p><h1 className="text-2xl sm:text-3xl font-bold mt-2">Quản lý AI</h1><p className="mt-2 text-sm text-slate-500">Dữ liệu → Gán nhãn → Huấn luyện → Đánh giá → Triển khai</p></div><div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300"><ShieldCheck className="w-4 h-4"/>Một Admin · Lịch sử có audit</div></div>
  </header>
  {error&&<div role="alert" className="rounded-xl border border-rose-300 p-4 text-rose-600">{error}<button className="ml-3 underline" onClick={()=>setRetry(v=>v+1)}>Thử lại</button></div>}
  {!access&&!error?<LoadingReview/>:!allowed?<ReviewPanel title="Chưa truy cập được quản lý AI"><p>{access?.message||'Cần tài khoản ACTIVE / ADMIN đã đăng nhập và cấu hình AI-01 hợp lệ.'}</p></ReviewPanel>:!status?<LoadingReview/>:<>
   <nav role="tablist" aria-label="Quản lý AI" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-1.5">{TABS.map(([id,name,Icon])=><button role="tab" key={id} id={`ai-tab-${id}`} aria-controls={`ai-panel-${id}`} aria-selected={tab===id} disabled={busy} onClick={()=>changeTab(id)} className={`flex flex-1 justify-center items-center gap-2 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${tab===id?'bg-indigo-600 text-white shadow-sm':'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Icon className="w-4 h-4"/>{name}</button>)}</nav>
   {!['data','label','training'].includes(tab)&&<p className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-200">Nhãn nguồn thử nghiệm và nhãn SOLO chỉ dùng phát triển, chưa phải approved Ground Truth. Benchmark chính thức không nhận ảnh quarantine hoặc thiếu bằng chứng.</p>}
   <div role="tabpanel" id={`ai-panel-${tab}`} aria-labelledby={`ai-tab-${tab}`}>
    {tab==='data'?<DataTab onBusyChange={setBusy} initialImageId={params.get('image')||''} onLabel={id=>changeTab('label',id)}/>:tab==='label'?<LabelTab initialImageId={params.get('image')||''} onBusyChange={setBusy} onDirtyChange={setLabelDirty}/>:tab==='training'?<TrainingTab capability={status.training} onBusyChange={setBusy} onReview={id=>changeTab('label',id)}/>:tab==='evaluation'?<div className="space-y-5">
     <Unavailable title="Tập kiểm thử độc lập" capability={status.evaluation}><p className="text-sm">Không nhận bản xuất SOLO làm ground truth độc lập. Benchmark chính thức cần nhãn người kiểm tra, bằng chứng nguồn/quyền ảnh, nhóm cùng cảnh không giao với train, checksum và protocol đóng băng trước khi chạy. Kết quả smoke không được tính thành chất lượng model.</p></Unavailable>
     <div className="grid grid-cols-3 gap-3">{[['Precision',status.evaluation.precision],['Recall',status.evaluation.recall],['F1',status.evaluation.f1]].map(([name,value])=><ReviewPanel key={name} title={name}><p className="text-3xl font-semibold">{value===null?'—':value}</p><p className="text-xs text-slate-500">Chưa có benchmark chính thức đã xác minh</p></ReviewPanel>)}</div>
     <ReviewPanel title="So sánh các model"><p className="text-sm text-slate-500">Chưa có kết quả model đủ điều kiện để so sánh. Không dùng prediction cache hoặc smoke test làm số liệu Precision/Recall/F1.</p></ReviewPanel>
    </div>:<div className="space-y-5"><Unavailable title="Chọn model, thử inference và triển khai" capability={status.deployment}><p className="text-sm">Chỉ mở kích hoạt khi có artifact đã kiểm checksum, đánh giá đạt ngưỡng trên protocol cố định, kiểm thử inference cách ly và phiên bản rollback. Hiện không có thao tác kích hoạt hoặc rollback từ trang này.</p></Unavailable><ReviewPanel title="Trạng thái production"><p>Trang Quản lý AI chưa kết nối registry của production. Không có thay đổi model hoặc inference nào được thực hiện.</p></ReviewPanel></div>}
   </div>
  </>}
 </div></div>;
}
