import React, { useState } from 'react';
import { EMPTY_FORM, KINDS, REVIEWS } from '../constants/symptoms';
export default function SymptomForm({ value, disabled, onSave, onCancel }) {
  const [form, setForm] = useState(value ? { ...EMPTY_FORM, ...value, aliases: value.aliases || [] } : EMPTY_FORM);
  const set = (key, val) => setForm(current => ({ ...current, [key]: val }));
  return <form className="space-y-3 rounded-xl border border-slate-700 p-4" onSubmit={e => { e.preventDefault(); onSave({ code: form.code, name: form.name, aliases: form.aliases, description: form.description || '', kind: form.kind, reviewStatus: form.reviewStatus, isActive: form.isActive, sortOrder: Number(form.sortOrder) }); }}>
    <h2 className="font-semibold">{value ? 'Sửa triệu chứng' : 'Tạo triệu chứng cho thiết bị đã chọn'}</h2>
    <label className="block">Code<input aria-label="Code" required pattern="[a-z][a-z0-9_]{1,79}" maxLength={80} value={form.code} onChange={e => set('code', e.target.value)} className="block w-full rounded border p-2" disabled={disabled} /></label>
    <label className="block">Tên triệu chứng<input aria-label="Tên triệu chứng" required maxLength={200} value={form.name} onChange={e => set('name', e.target.value)} className="block w-full rounded border p-2" disabled={disabled} /></label>
    <label className="block">Aliases (mỗi dòng một tên)<textarea value={form.aliases.join('\n')} onChange={e => set('aliases', e.target.value.split('\n'))} className="block w-full rounded border p-2" disabled={disabled} /></label>
    <label className="block">Mô tả<textarea maxLength={2000} value={form.description || ''} onChange={e => set('description', e.target.value)} className="block w-full rounded border p-2" disabled={disabled} /></label>
    <label className="block">Loại<select value={form.kind} onChange={e => set('kind', e.target.value)} disabled={disabled} className="block w-full rounded border p-2">{Object.entries(KINDS).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
    <label className="block">Duyệt<select value={form.reviewStatus} onChange={e => set('reviewStatus', e.target.value)} disabled={disabled} className="block w-full rounded border p-2">{Object.entries(REVIEWS).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
    <label className="block">Thứ tự<input aria-label="Thứ tự" type="number" min="0" max="100000" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)} disabled={disabled} className="ml-3 rounded border p-2" /></label>
    <label className="block"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} disabled={disabled} /> Kích hoạt (cần duyệt)</label>
    <div className="flex gap-3"><button disabled={disabled} className="rounded bg-sky-600 px-4 py-2 text-white">Lưu triệu chứng</button><button type="button" onClick={onCancel} disabled={disabled}>Hủy</button></div>
  </form>;
}
