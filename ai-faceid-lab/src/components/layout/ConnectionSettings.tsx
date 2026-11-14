import { useEffect, useRef } from 'react';
import type { Backend } from '../../lib/types';
import { describe } from '../../lib/codes';
import { Icon } from '../Icon';
import { ActionButton, Badge } from '../ui';

export interface Tokens { research: string; core: string; otherResearch: string; otherCore: string }
type Conn = 'none' | 'unchecked' | 'ok' | 'error';

/**
 * Token entry. Values live only in React state of the shell (memory): no storage, no URL,
 * no logging. Inputs are password fields with autocomplete off; reload forgets everything.
 */
export function ConnectionSettings({ open, onClose, tokens, onTokens, backend, onConnect, onClear, onErase, researchConn, coreConn, errors }: {
  open: boolean; onClose: () => void; tokens: Tokens; onTokens: (t: Tokens) => void; backend: Backend;
  onConnect: () => void; onClear: () => void; onErase: () => void;
  researchConn: Conn; coreConn: Conn; errors: Record<string, string | null>;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    panel.current?.querySelector<HTMLInputElement>('input')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) { // keep focus inside the dialog
        const f = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, [href], select')];
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); (opener.current as HTMLElement | null)?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;

  const set = (k: keyof Tokens) => (e: React.ChangeEvent<HTMLInputElement>) => onTokens({ ...tokens, [k]: e.target.value });
  const field = (k: keyof Tokens, label: string, placeholder: string, hint: string) => (
    <label className="field">
      <span className="field-label">{label}{tokens[k] ? <span className="token-set"><Icon name="check" size={12} />đã nhập</span> : <span className="token-unset">trống</span>}</span>
      <input type="password" autoComplete="off" spellCheck={false} value={tokens[k]} onChange={set(k)} placeholder={placeholder} />
      <span className="field-hint">{hint}</span>
    </label>
  );
  const st = (c: Conn, key: string) => c === 'ok' ? <Badge status="PASS">OK</Badge> : c === 'error' ? <Badge status="ERROR" title={describe(errors[key]).text}>{errors[key]}</Badge> : c === 'unchecked' ? <Badge tone="neutral">chưa kiểm tra</Badge> : <Badge tone="neutral">chưa có token</Badge>;
  const anyToken = !!(tokens.research || tokens.core);

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="conn-title" ref={panel}>
        <header className="modal-head">
          <h2 id="conn-title"><Icon name="plug" size={18} />Connection Settings</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Đóng Connection Settings"><Icon name="x" size={18} /></button>
        </header>
        <div className="modal-body">
          <p className="callout"><Icon name="lock" size={16} /><span>Token chỉ nằm trong bộ nhớ tab này: không lưu localStorage/cookie, không đưa vào URL, không ghi log. Tải lại trang sẽ xóa.</span></p>
          <p className="small muted">Chế độ đang chọn: <b>{backend === 'core' ? 'Face Core (gate production thật)' : 'Research lab (đo lường thật, không thẩm quyền)'}</b> — đổi ở thanh trên cùng.</p>

          <fieldset className="fieldset">
            <legend>Worker TEST chính</legend>
            <div className="conn-row">{field('research', 'Research token (lab :3107)', 'token từ fixtures.json riêng tư', 'Dùng cho Research mode.')}<div className="conn-status">{st(researchConn, 'caps')}</div></div>
            <div className="conn-row">{field('core', 'Worker TEST JWT (Face Core /api)', 'access token của tài khoản worker test', 'Dùng cho Face Core mode và Session/Proof Inspector.')}<div className="conn-status">{st(coreConn, 'status')}</div></div>
          </fieldset>
          <fieldset className="fieldset">
            <legend>Worker #2 (chỉ cho kiểm thử âm)</legend>
            {field('otherResearch', 'Research token worker #2 (kiểm thử âm)', 'researchOtherToken', 'Kiểm thử “Session của worker khác” ở Research mode.')}
            {field('otherCore', 'Face Core JWT worker #2 (kiểm thử âm)', 'coreOtherToken', 'Kiểm thử “Session của worker khác” ở Face Core mode.')}
          </fieldset>
        </div>
        <footer className="modal-foot">
          <div className="btn-row">
            <ActionButton variant="primary" icon="refresh" onClick={onConnect} reason={anyToken ? null : 'Nhập ít nhất Research token hoặc Face Core JWT.'}>Kết nối &amp; kiểm tra</ActionButton>
            <ActionButton icon="trash" onClick={onErase} reason={tokens.research ? null : 'Cần Research token.'}>Xóa phiên research của tôi</ActionButton>
            <ActionButton variant="danger" icon="x" onClick={onClear}>Xóa token khỏi bộ nhớ</ActionButton>
          </div>
          {!anyToken && <p className="field-hint">Dán token từ file fixture riêng tư do <code>./dev-local.sh faceid</code> in ra đường dẫn.</p>}
          {errors.erase && <p className="alert-box" role="alert"><b>{errors.erase}</b>: {describe(errors.erase).text}</p>}
        </footer>
      </div>
    </div>
  );
}
