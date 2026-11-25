import { useEffect, useRef, useState } from 'react';
import { tokenStorage } from '../../services/storage/tokenStorage';

export function draftKey(kind, imageId) {
  const user = tokenStorage.getUser();
  return user?.id && imageId ? `ai01:draft:${user.id}:${kind}:${imageId}` : null;
}
export function readDraft(key) {
  try { return key ? JSON.parse(sessionStorage.getItem(key)) : null; } catch { return null; }
}
export function removeDraft(key) { try { if (key) sessionStorage.removeItem(key); } catch { /* unavailable storage */ } }
// Session storage survives reauthentication/reload, without sharing drafts between accounts or tabs.
export function useLabelDraft(kind, imageId, revision, value, restore, ready = true) {
  const key = draftKey(kind, imageId);
  const initialized = useRef(null), baseline = useRef(null), latest = useRef(null);
  const [notice, setNotice] = useState('');
  latest.current = { value, restore, revision };
  useEffect(() => {
    if (!ready || !key || initialized.current === key) return;
    initialized.current = key;
    baseline.current = JSON.stringify(latest.current.value);
    const draft = readDraft(key);
    if (draft) {
      if (draft.revision !== revision && !window.confirm('Nhãn trên máy chủ đã thay đổi. Khôi phục bản nháp cũ để đối chiếu? Hãy kiểm tra lại trước khi lưu.')) {
        setNotice('Bản nháp cũ được giữ trong phiên trình duyệt; chưa áp dụng vì nhãn máy chủ đã thay đổi.');
        initialized.current = null;
        return;
      }
      latest.current.restore(draft.value);
      setNotice('Đã khôi phục bản nháp trên trình duyệt. Hãy kiểm tra và Lưu; bản nháp chưa xác nhận nhãn trên máy chủ.');
    }
  }, [key, ready]);
  useEffect(() => {
    if (!ready || !key || initialized.current !== key) return;
    const persist = () => {
      if (JSON.stringify(latest.current.value) === baseline.current) { removeDraft(key); return; }
      try { sessionStorage.setItem(key, JSON.stringify({ revision: latest.current.revision, value: latest.current.value })); }
      catch { setNotice('Không thể lưu bản nháp trên trình duyệt. Hãy lưu bản sửa lên máy chủ trước khi rời trang.'); }
    };
    persist();
    window.addEventListener('auth:before-expire', persist);
    window.addEventListener('pagehide', persist);
    return () => { window.removeEventListener('auth:before-expire', persist); window.removeEventListener('pagehide', persist); };
  }, [key, ready, value, revision]);
  return { notice, clear: () => { removeDraft(key); baseline.current = JSON.stringify(latest.current.value); setNotice(''); } };
}
