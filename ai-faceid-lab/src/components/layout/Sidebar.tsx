import { useEffect, useRef } from 'react';
import { Icon, type IconName } from '../Icon';

export type View = 'overview' | 'enroll' | 'daily' | 'order' | 'pad' | 'identity' | 'inspect' | 'scenarios' | 'requests';
export const VIEWS: { id: View; label: string; icon: IconName; group: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'overview', group: '' },
  { id: 'enroll', label: 'Enrollment', icon: 'enroll', group: 'Workflows' },
  { id: 'daily', label: 'Daily Verification', icon: 'daily', group: 'Workflows' },
  { id: 'order', label: 'Order Verification', icon: 'order', group: 'Workflows' },
  { id: 'pad', label: 'PAD Inspector', icon: 'pad', group: 'Inspectors' },
  { id: 'identity', label: 'Identity Inspector', icon: 'identity', group: 'Inspectors' },
  { id: 'inspect', label: 'Session/Proof', icon: 'session', group: 'Inspectors' },
  { id: 'scenarios', label: 'Test Scenarios', icon: 'scenarios', group: 'Testing' },
  { id: 'requests', label: 'Debug/Requests', icon: 'debug', group: 'Testing' },
];
export const isView = (v: string): v is View => VIEWS.some(x => x.id === v);

export function Sidebar({ view, onView, badges }: { view: View; onView: (v: View) => void; badges: Partial<Record<View, { text: string; tone: string }>> }) {
  const list = useRef<HTMLUListElement>(null);
  // Mobile strip: keep the current item visible (horizontal scroll of the strip only, never the page).
  useEffect(() => {
    const ul = list.current;
    const cur = ul?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!ul || !cur || ul.scrollWidth <= ul.clientWidth) return;
    ul.scrollLeft = Math.max(0, cur.offsetLeft - ul.offsetLeft - 16);
  }, [view]);
  let lastGroup = '';
  return (
    <nav className="sidebar" aria-label="Lab sections">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true"><Icon name="identity" size={18} /></span>
        <span className="brand-text"><b>FixGo</b><span>FaceID Lab</span></span>
      </div>
      <ul className="nav-list" ref={list}>
        {VIEWS.map(v => {
          const header = v.group && v.group !== lastGroup ? v.group : null;
          lastGroup = v.group || lastGroup;
          const b = badges[v.id];
          return (
            <li key={v.id}>
              {header && <div className="nav-group">{header}</div>}
              <button type="button" className="nav-item" aria-current={view === v.id ? 'page' : undefined} onClick={() => onView(v.id)}>
                <Icon name={v.icon} size={18} />
                <span className="nav-label">{v.label}</span>
                {b && <span className={`nav-badge tone-bg-soft-${b.tone}`}>{b.text}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="sidebar-foot">Dev/staging only. Lab không có thẩm quyền cấp FaceID proof; mọi gate do backend quyết định.</p>
    </nav>
  );
}
