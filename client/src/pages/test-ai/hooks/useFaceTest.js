import { useCallback, useEffect, useRef, useState } from 'react';
import { faceRequest, blobAsDataUrl } from '../../../services/test-ai/faceTestService';

export function useFaceTest() {
  const [capabilities, setCapabilities] = useState(null), [connecting, setConnecting] = useState(false);
  const [consent, setConsent] = useState(false), [enrolled, setEnrolled] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [result, setResult] = useState(null);
  const [history, setHistory] = useState([]), [purpose, setPurpose] = useState('ENROLL');
  const workspace = useRef(null), controller = useRef(null), generation = useRef(0), lock = useRef(false);
  const connection = useRef(null);
  const connect = useCallback(async () => {
    connection.current?.abort(); const request = new AbortController(); connection.current = request;
    setConnecting(true); setError('');
    try { const caps = await faceRequest('/capabilities', { signal: request.signal }); if (!request.signal.aborted) setCapabilities(caps); }
    catch (e) { if (e.name !== 'AbortError') setError(e.message); }
    finally { if (connection.current === request) setConnecting(false); }
  }, []);
  useEffect(() => {
    void connect();
    return () => {
      generation.current++; controller.current?.abort(); connection.current?.abort();
      if (workspace.current) void faceRequest('/workspace', { method: 'DELETE', workspace: workspace.current }).catch(() => {});
    };
  }, [connect]);

  const erase = useCallback(async () => {
    generation.current++; controller.current?.abort();
    const key = workspace.current; workspace.current = null;
    setEnrolled(false); setResult(null); setHistory([]); setPurpose('ENROLL'); setConsent(false);
    setError('');
    try { if (key) await faceRequest('/workspace', { method: 'DELETE', workspace: key }); }
    catch { setError('Đã xóa dữ liệu trên trang; chưa xác nhận xóa trên AI. Mẫu tạm tự hết hạn sau 30 phút hoặc khi dừng Vite.'); }
  }, []);

  const submit = useCallback(async shot => {
    if (!shot || !consent || lock.current || !capabilities?.identityReady || !capabilities?.padReady) return;
    lock.current = true; setBusy(true); setError(''); setResult(null);
    const current = generation.current;
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 30000);
    try {
      if (!workspace.current) {
        const created = await faceRequest('/workspaces', { method: 'POST', data: { consent: true }, signal: abort.signal });
        if (current !== generation.current) { void faceRequest('/workspace', { method: 'DELETE', workspace: created.workspace }).catch(() => {}); return; }
        workspace.current = created.workspace;
      }
      const key = workspace.current;
      const session = await faceRequest('/sessions', { method: 'POST', data: { purpose }, workspace: key, signal: abort.signal });
      const photo = await blobAsDataUrl(shot.blob);
      const measured = await faceRequest(`/sessions/${encodeURIComponent(session.id)}/capture`, {
        method: 'POST', data: { nonce: session.nonce, photo }, workspace: key, signal: abort.signal,
      });
      if (current !== generation.current) return;
      const record = { ...measured, at: new Date().toISOString(), id: crypto.randomUUID() };
      setResult(record); setHistory(previous => [record, ...previous].slice(0, 20));
      if (measured.templateStoredInMemory) setEnrolled(true);
    } catch (e) {
      if (current === generation.current) setError(e.name === 'AbortError' ? 'Đã hủy hoặc quá thời gian xử lý. Hãy xóa phiên nếu kết quả đăng ký chưa xác định.' : e.message);
    } finally { clearTimeout(timeout); lock.current = false; setBusy(false); }
  }, [consent, capabilities, purpose]);

  const exportHistory = () => {
    const data = { exportedAt: new Date().toISOString(), testOnly: true, capabilities, trials: history };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'fixgo-face-test-results.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return { capabilities, connecting, connect, consent, setConsent, enrolled, busy, error, result, history, purpose,
    setPurpose: value => { setPurpose(value); setResult(null); setError(''); }, erase, submit, exportHistory };
}
