import React, { useEffect, useRef, useState } from 'react';
import SymptomForm from '../components/SymptomForm';
import MappingEditor from '../components/MappingEditor';
import { symptomsService } from '../services/symptomsService';
import { REVIEWS } from '../constants/symptoms';

const message = error => error.response?.data?.message || error.friendlyMessage || error.message || 'Không thể tải dữ liệu. Vui lòng thử lại.';
export default function SymptomManagementPage() {
  const [categories, setCategories] = useState([]), [categoryId, setCategory] = useState('');
  const [targets, setTargets] = useState([]), [targetId, setTarget] = useState('');
  const [search, setSearch] = useState(''), [reviewStatus, setReview] = useState(''), [isActive, setActive] = useState('');
  const [page, setPage] = useState(1), [result, setResult] = useState({ items: [], total: 0, hasMore: false });
  const [selectedId, setSelected] = useState(''), [services, setServices] = useState([]);
  const [servicePage, setServicePage] = useState(1), [serviceMore, setServiceMore] = useState(false);
  const [editor, setEditor] = useState(null), [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState(''), [reload, setReload] = useState(0);
  const locked = useRef(false);
  const previewVersion = useRef(0);
  useEffect(() => { previewVersion.current += 1; setPreview(null); return () => { previewVersion.current += 1; }; }, [categoryId, targetId, selectedId]);
  useEffect(() => { let alive = true; symptomsService.categories().then(items => { if (alive) setCategories(items); }).catch(err => { if (alive) setError(message(err)); }); return () => { alive = false; }; }, [reload]);
  useEffect(() => {
    if (!categoryId) { setTargets([]); return; }
    let alive = true; symptomsService.targets(categoryId).then(items => { if (alive) setTargets(items); }).catch(err => { if (alive) setError(message(err)); });
    return () => { alive = false; };
  }, [categoryId, reload]);
  useEffect(() => {
    if (!targetId) { setResult({ items: [], total: 0, hasMore: false }); setLoading(false); return; }
    let alive = true; setLoading(true); setError('');
    const timer = setTimeout(async () => {
      try { const value = await symptomsService.list({ targetId, categoryId, search, page, limit: 20, ...(reviewStatus ? { reviewStatus } : {}), ...(isActive ? { isActive } : {}) }); if (alive) setResult(value); }
      catch (err) { if (alive) { setError(message(err)); setResult({ items: [], total: 0, hasMore: false }); } }
      finally { if (alive) setLoading(false); }
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [targetId, categoryId, search, page, reviewStatus, isActive, reload]);
  useEffect(() => {
    if (!targetId) { setServices([]); return; }
    let alive = true;
    symptomsService.services(targetId, servicePage).then(value => { if (alive) { const rows = Array.isArray(value) ? value : value.data || value.items || []; setServices(rows); setServiceMore((value.pagination?.totalPages || 1) > servicePage); } }).catch(err => { if (alive) setError(message(err)); });
    return () => { alive = false; };
  }, [targetId, servicePage, reload]);
  const selected = result.items.find(item => item.id === selectedId);
  const resetSelection = () => { previewVersion.current += 1; setResult({ items: [], total: 0, hasMore: false }); setLoading(false); setSelected(''); setEditor(null); setPreview(null); setPage(1); setServicePage(1); setServices([]); setNotice(''); setError(''); };
  const mutate = async operation => {
    if (locked.current) return;
    locked.current = true; previewVersion.current += 1; setBusy(true); setError(''); setPreview(null);
    try { await operation(); setNotice('Đã lưu thay đổi.'); setEditor(null); setReload(v => v + 1); }
    catch (err) { setError(message(err)); }
    finally { locked.current = false; setBusy(false); }
  };
  const showPreview = async () => { const version = ++previewVersion.current; setError(''); setPreview(null); try { const value = await symptomsService.preview(targetId, selected.id); if (version === previewVersion.current) setPreview(value); } catch (err) { if (version === previewVersion.current) setError(message(err)); } };
  return <main className="space-y-5 p-4 text-slate-900 dark:text-slate-100">
    <h1 className="text-2xl font-semibold">Danh mục → Đối tượng → Triệu chứng → Dịch vụ</h1>
    <p>Triệu chứng cần được duyệt trước khi hiển thị cho khách. Dấu hiệu quan sát không đồng nghĩa AI đã phát hiện lỗi.</p>
    {!!error && <div role="alert" className="rounded border border-rose-500 p-3">{error}<button className="ml-4 underline" onClick={() => setReload(v => v + 1)}>Thử lại</button></div>}
    {!!notice && <p role="status" className="text-emerald-600">{notice}</p>}
    <div className="flex flex-wrap gap-3">
      <select aria-label="Danh mục" value={categoryId} disabled={busy} onChange={e => { setCategory(e.target.value); setTarget(''); setTargets([]); resetSelection(); }} className="rounded border p-2"><option value="">Chọn danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select aria-label="Đối tượng" value={targetId} disabled={!categoryId || busy} onChange={e => { setTarget(e.target.value); resetSelection(); }} className="rounded border p-2"><option value="">Chọn đối tượng</option>{targets.map(t => <option key={t.id} value={t.id}>{t.name}{!t.isActive ? ' (inactive)' : ''}</option>)}</select>
      <input placeholder="Tìm tên, code, alias" value={search} disabled={busy} onChange={e => { setSearch(e.target.value); setPage(1); setSelected(''); setPreview(null); setEditor(null); }} className="rounded border p-2" />
      <select aria-label="Lọc trạng thái duyệt" value={reviewStatus} disabled={busy} onChange={e => { setReview(e.target.value); setPage(1); setSelected(''); setPreview(null); }} className="rounded border p-2"><option value="">Tất cả mức duyệt</option>{Object.entries(REVIEWS).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select>
      <select aria-label="Lọc active" value={isActive} disabled={busy} onChange={e => { setActive(e.target.value); setPage(1); setSelected(''); setPreview(null); }} className="rounded border p-2"><option value="">Tất cả trạng thái</option><option value="true">Active</option><option value="false">Inactive</option></select>
      <button disabled={!targetId || busy} onClick={() => setEditor({ creating: true })} className="rounded bg-sky-600 px-4 py-2 text-white">Tạo triệu chứng</button>
    </div>
    {!targetId && <p>Chọn danh mục và thiết bị để quản lý triệu chứng.</p>}
    {loading && <p role="status">Đang tải triệu chứng…</p>}
    {targetId && !loading && !result.items.length && !error && <p>Chưa có triệu chứng phù hợp. Có thể tạo bản nháp mới.</p>}
    <div className="grid gap-5 xl:grid-cols-2"><section className="space-y-3">
      {result.items.map(item => <article key={item.id} className="rounded-xl border border-slate-700 p-4">
        <h2 className="font-semibold">{item.name}</h2><p className="text-sm">{item.code} · {REVIEWS[item.reviewStatus]} · {item.isActive ? 'Active' : 'Inactive'}</p>
        {item.warnings?.map(w => <p key={w} className="text-amber-500">{w}</p>)}
        <div className="mt-3 flex flex-wrap gap-4"><button disabled={busy} onClick={() => { setEditor({ item }); setSelected(item.id); setPreview(null); }}>Sửa</button>
          <button disabled={busy} onClick={() => { setSelected(item.id); setEditor(null); setPreview(null); }}>Quản lý mapping</button>
          <button disabled={busy || !item.isActive} onClick={() => mutate(() => symptomsService.save(item.id, { isActive: false }))}>Vô hiệu hóa</button></div>
      </article>)}
      {targetId && <div className="flex gap-4"><button disabled={page <= 1 || busy || loading} onClick={() => { setPage(p => p - 1); setSelected(''); setPreview(null); }}>Trang trước</button><span>Trang {page} · {result.total} triệu chứng</span><button disabled={!result.hasMore || busy || loading} onClick={() => { setPage(p => p + 1); setSelected(''); setPreview(null); }}>Trang sau</button></div>}
    </section><section className="space-y-4">
      {editor && <SymptomForm key={editor.item?.id || 'new'} value={editor.item} disabled={busy} onCancel={() => setEditor(null)} onSave={data => mutate(() => symptomsService.save(editor.item?.id, editor.item ? data : { ...data, targetId }))} />}
      {selected && !editor && <><MappingEditor symptom={selected} services={services} disabled={busy} onError={setError} onSave={(serviceId, data) => mutate(() => symptomsService.map(selected.id, serviceId, data))} onUnmap={serviceId => mutate(() => symptomsService.unmap(selected.id, serviceId))} />
        <div className="flex gap-4"><button disabled={servicePage <= 1 || busy} onClick={() => setServicePage(p => p - 1)}>Dịch vụ trước</button><button disabled={!serviceMore || busy} onClick={() => setServicePage(p => p + 1)}>Dịch vụ tiếp</button></div>
        <button disabled={busy || !selected.isActive || selected.reviewStatus !== 'APPROVED'} onClick={showPreview} className="rounded bg-emerald-700 px-4 py-2 text-white">Xem trước top-3 gợi ý</button>
        {preview && <div role="status">{!preview.items.length ? <p>Chưa có mapping active phù hợp. Customer sẽ chuyển sang chọn thủ công.</p> : preview.items.map(s => <article key={s.id} className="mt-2 rounded border p-3"><strong>{s.name}</strong><p>{s.reason}</p><p>{s.basePrice == null ? 'Thợ báo giá sau kiểm tra' : `Từ ${Number(s.basePrice).toLocaleString('vi-VN')} đ`}</p></article>)}</div>}
      </>}
    </section></div>
  </main>;
}
