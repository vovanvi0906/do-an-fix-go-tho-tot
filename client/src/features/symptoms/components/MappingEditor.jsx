import React, { useState } from 'react';
import { mappingPayload, mappingWarnings, REVIEWS } from '../constants/symptoms';
function MappingRow({ symptom, service, link, disabled, onSave, onUnmap, onError }) {
  const [priority, setPriority] = useState(link?.priority || 0);
  const [reviewStatus, setReview] = useState(link?.reviewStatus || 'NEEDS_REVIEW');
  const [isActive, setActive] = useState(link?.isActive || false);
  const [reason, setReason] = useState(link?.reason || '');
  const warning = mappingWarnings(symptom, service);
  return <div className="space-y-2 rounded border border-slate-700 p-3">
    <p className="font-medium">{service.name}</p>
    <p>{service.basePrice == null ? 'Thợ báo giá sau kiểm tra' : `Từ ${Number(service.basePrice).toLocaleString('vi-VN')} đ / ${service.unit || 'lần'}`}</p>
    {warning && <p role="alert" className="text-amber-500">{warning}</p>}
    <div className="flex flex-wrap items-center gap-3">
      <label>Priority<input aria-label={`Priority ${service.name}`} type="number" min="0" max="100000" value={priority} onChange={e => setPriority(e.target.value)} className="ml-2 w-24 rounded border p-2" disabled={disabled} /></label>
      <select aria-label={`Duyệt ${service.name}`} value={reviewStatus} onChange={e => setReview(e.target.value)} disabled={disabled} className="rounded border p-2">{Object.entries(REVIEWS).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select>
      <label><input type="checkbox" checked={isActive} disabled={disabled} onChange={e => setActive(e.target.checked)} /> Active</label>
    </div>
    <input aria-label={`Lý do ${service.name}`} placeholder="Lý do phù hợp" value={reason} onChange={e => setReason(e.target.value)} maxLength={500} disabled={disabled} className="w-full rounded border p-2" />
    <div className="flex gap-3"><button disabled={disabled || !!warning} onClick={() => { try { onSave(service.id, mappingPayload({ priority, reviewStatus, isActive, reason })); } catch (error) { onError(error.message); } }} className="rounded bg-sky-600 px-3 py-2 text-white">{link ? 'Lưu mapping' : 'Liên kết'}</button>
      {link && <button disabled={disabled} onClick={() => onUnmap(service.id)} className="text-amber-500">Bỏ liên kết</button>}</div>
  </div>;
}
export default function MappingEditor({ symptom, services, disabled, onSave, onUnmap, onError }) {
  return <section className="space-y-3"><h2 className="font-semibold">Dịch vụ cho: {symptom.name}</h2><p className="text-sm">Ưu tiên nhiều triệu chứng khớp, rồi priority cao hơn; tối đa 3 gợi ý. Bỏ liên kết sẽ archive.</p>
    {symptom.warnings?.map(warning => <p role="alert" key={warning} className="text-amber-500">{warning}</p>)}
    {!services.length && <p>Chưa có dịch vụ cho thiết bị này.</p>}
    {services.map(service => { const link = symptom.mappings?.find(m => m.serviceId === service.id); return <MappingRow key={`${service.id}:${link?.updatedAt || 'new'}`} symptom={symptom} service={service} link={link} disabled={disabled} onSave={onSave} onUnmap={onUnmap} onError={onError} />; })}
  </section>;
}
