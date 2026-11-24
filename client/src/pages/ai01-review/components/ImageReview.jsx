import React,{useEffect,useRef,useState} from 'react';
import {buttonClass,fieldClass,ReviewPanel} from './ReviewPanel';
export default function ImageReview({items,item,imageUrl,onSelect,children,datasetNames={},navigationLimit=null,disabled=false,reviewTitle='Quyết định review',compact=false,hideNavigation=false}) {
 const canvas=useRef(null),[overlay,setOverlay]=useState(true),[zoom,setZoom]=useState(1);
 useEffect(()=>{setZoom(1);},[item?.id]);
 useEffect(()=>{
  if(!imageUrl||!item)return;let alive=true;const im=new Image();
  im.onload=()=>{
   if(!alive||!canvas.current)return;const c=canvas.current;c.width=im.naturalWidth;c.height=im.naturalHeight;
   const pen=c.getContext('2d');pen.drawImage(im,0,0);if(!overlay)return;
   pen.strokeStyle='#f43f5e';pen.lineWidth=Math.max(2,c.width/280);
   for(const a of item.annotations){
    const v=a.coordinates;pen.beginPath();
    if(a.format==='bbox')pen.rect((v[0]-v[2]/2)*c.width,(v[1]-v[3]/2)*c.height,v[2]*c.width,v[3]*c.height);
    else{pen.moveTo(v[0]*c.width,v[1]*c.height);for(let i=2;i<v.length;i+=2)pen.lineTo(v[i]*c.width,v[i+1]*c.height);pen.closePath();}
    pen.stroke();
    const label=item.sourceMappings?.find(m=>m.classId===a.classId)?.displayVi?.labelVi;
    if(label){
     const size=Math.max(12,c.width/48);pen.font=`600 ${size}px sans-serif`;
     const text=label.length>42?label.slice(0,39)+'…':label;
     const x=Math.max(0,Math.min(c.width-pen.measureText(text).width-8,(a.format==='bbox'?v[0]-v[2]/2:Math.min(...v.filter((_,i)=>i%2===0)))*c.width));
     const y=Math.max(size+6,(a.format==='bbox'?v[1]-v[3]/2:Math.min(...v.filter((_,i)=>i%2===1)))*c.height);
     pen.fillStyle='#be123c';pen.fillRect(x,y-size-5,pen.measureText(text).width+8,size+7);pen.fillStyle='#fff';pen.fillText(text,x+4,y-1);
    }
   }
  };im.src=imageUrl;return()=>{alive=false;};
 },[imageUrl,item,overlay]);
 const pos=items.findIndex(r=>r.id===item.id),start=navigationLimit?Math.max(0,pos-Math.floor(navigationLimit/2)):0;
 const navigationItems=navigationLimit?items.slice(start,start+navigationLimit):items;
 return <div className="space-y-4">
  {!hideNavigation&&<div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={disabled||pos<1} onClick={()=>onSelect(items[pos-1].id)}>Trước</button><select aria-label="Chọn ảnh pilot" disabled={disabled} className={`${fieldClass} max-w-sm`} value={item.id} onChange={e=>onSelect(e.target.value)}>{navigationItems.map((r,i)=><option key={r.id} value={r.id}>{start+i+1}/{items.length} · {r.id} · {datasetNames[r.dataset]||r.dataset}{r.sourceLabelsVi?.length?` · ${r.sourceLabelsVi.join(", ")}`:""}</option>)}</select><button className={buttonClass} disabled={disabled||pos===items.length-1} onClick={()=>onSelect(items[pos+1].id)}>Tiếp</button></div>}
  <div className="grid items-start gap-4 lg:grid-cols-2">
   <div className="lg:sticky lg:top-4"><ReviewPanel title={`${item.id} · ${datasetNames[item.dataset]||item.dataset}`}>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={overlay} onChange={e=>setOverlay(e.target.checked)}/>{item.imported?'Hiện khung nhãn Admin đã lưu':'Hiện khung/vùng nhãn nguồn'}</label>
    {compact&&<div className="flex items-center gap-2"><button className={buttonClass} disabled={zoom<=1} onClick={()=>setZoom(v=>Math.max(1,v-.25))} aria-label="Thu nhỏ ảnh">−</button><button className={buttonClass} onClick={()=>setZoom(1)}>{Math.round(zoom*100)}%</button><button className={buttonClass} disabled={zoom>=3} onClick={()=>setZoom(v=>Math.min(3,v+.25))} aria-label="Phóng to ảnh">+</button></div>}
    <div className="overflow-auto max-h-[65vh]"><div style={compact?{width:`${zoom*100}%`}:undefined}><canvas ref={canvas} aria-label="Ảnh nguồn và vùng nhãn Roboflow" className={`${compact?'w-full':'w-full max-h-[55vh]'} object-contain bg-slate-100 dark:bg-slate-800 rounded-lg`}/></div></div>
    <div><p className="text-xs text-slate-500 mb-2">{item.imported?'Ảnh Admin bổ sung · không có nhãn nguồn tự động':'Nhãn nguồn Roboflow · chưa được người xác nhận'}</p><div className="flex flex-wrap gap-2">{(item.sourceLabelsVi||item.sourceLabels).length?(item.sourceLabelsVi||item.sourceLabels).map((v,i)=><span key={i} className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 text-sm font-medium text-rose-800 dark:text-rose-200">{v}</span>):<span className="text-sm">Chưa có nhãn nguồn — không có nghĩa là bình thường</span>}</div></div>
    <details className="text-xs text-slate-500"><summary className="cursor-pointer">Thông tin nguồn và mã gốc</summary><div className="mt-2 space-y-1 break-all"><p>Mã nhãn gốc: {item.sourceLabels.join(', ')||'Rỗng'}</p><p>SHA256: {item.sha256}</p><p>Nguồn: {item.source.url}</p><p>Giấy phép khai: {item.source.licenseDeclared} — cần xác minh riêng.</p></div></details>
   </ReviewPanel></div>
   <ReviewPanel title={reviewTitle}>{children}</ReviewPanel>
  </div>
 </div>;
}
