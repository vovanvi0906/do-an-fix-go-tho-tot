import { useState } from 'react';
import type { RequestTrace } from '../../lib/api';
import type { Timeline } from '../../lib/timeline';
import { outcomeOf, toneOf } from '../../lib/workflow';
import { Icon } from '../Icon';
import { MiniStrip } from '../TimelineView';
import { Badge } from '../ui';

type Tab = 'timeline' | 'requests' | 'correlation';

/**
 * Bottom debug drawer. The 10-stage timeline element is portaled in by the active FlowPanel
 * (`setHost`), or `fallback` renders the last run when no workflow is open.
 * Panels are hidden, not unmounted, so the portal target stays stable.
 */
export function DebugDrawer({ timeline, traces, sessionId, requestKey, setHost, fallback, open, onOpen }: {
  timeline: Timeline; traces: RequestTrace[]; sessionId: string | null; requestKey: string | null;
  setHost: (el: HTMLElement | null) => void; fallback: React.ReactNode; open: boolean; onOpen: (o: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>('timeline');
  const outcome = outcomeOf(timeline);
  const total = timeline.reduce((a, s) => a + (s.ms ?? 0), 0);
  const last = traces[0];
  const refs = [...new Set(timeline.map(s => s.ref).filter(Boolean) as string[])];
  const tabs: [Tab, string][] = [['timeline', 'Timeline (10 stages)'], ['requests', `Requests (${traces.length})`], ['correlation', 'Correlation']];

  return (
    <section className={`drawer ${open ? 'is-open' : ''}`} aria-label="Debug drawer">
      <div className="drawer-bar">
        <button type="button" className="drawer-toggle" aria-expanded={open} aria-controls="drawer-body" onClick={() => onOpen(!open)}>
          <Icon name="debug" size={16} /><span>Debug</span><Icon name={open ? 'chevronDown' : 'chevronUp'} size={14} />
        </button>
        <MiniStrip timeline={timeline} />
        <span className="drawer-sum">
          {outcome.kind !== 'idle' && outcome.code ? <Badge tone={toneOf(outcome.kind)}>{outcome.code}</Badge> : <span className="muted">idle</span>}
          {total > 0 && <span className="muted hide-sm">{total.toFixed(0)} ms</span>}
          {last && <span className="muted hide-sm"><code>{last.method} {last.path}</code> → {last.status || 'ERR'}</span>}
        </span>
      </div>
      <div id="drawer-body" className="drawer-body" hidden={!open}>
        <div className="seg-tabs" role="tablist" aria-label="Debug views">
          {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} aria-controls={`drawer-${id}`} id={`drawer-tab-${id}`} onClick={() => setTab(id)}>{label}</button>)}
        </div>
        <div id="drawer-timeline" role="tabpanel" aria-labelledby="drawer-tab-timeline" hidden={tab !== 'timeline'}>
          <div ref={setHost} />
          {fallback}
        </div>
        <div id="drawer-requests" role="tabpanel" aria-labelledby="drawer-tab-requests" hidden={tab !== 'requests'}>
          <RequestTable traces={traces.slice(0, 20)} />
          <p className="field-hint">Chỉ method/path/status/thời gian/mã lỗi. Request/response body, token và ảnh không bao giờ được ghi.</p>
        </div>
        <div id="drawer-correlation" role="tabpanel" aria-labelledby="drawer-tab-correlation" hidden={tab !== 'correlation'}>
          <dl className="kv">
            <div className="kv-row"><dt>Session ID</dt><dd><code>{sessionId ?? '—'}</code></dd></div>
            <div className="kv-row"><dt>requestKey (idempotency)</dt><dd><code>{requestKey ?? '—'}</code></dd></div>
            <div className="kv-row"><dt>Stage refs</dt><dd>{refs.length ? refs.join(' · ') : '—'}</dd></div>
            <div className="kv-row"><dt>Stop code</dt><dd>{outcome.code ?? '—'}</dd></div>
            <div className="kv-row"><dt>Latency (tổng stage)</dt><dd>{total ? `${total.toFixed(1)} ms` : '—'}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}

export function RequestTable({ traces }: { traces: RequestTrace[] }) {
  if (!traces.length) return <p className="muted small">Chưa có request.</p>;
  return (
    <div className="scroll"><table className="tbl">
      <thead><tr><th>time</th><th>method</th><th>path</th><th>status</th><th>ms</th><th>code</th></tr></thead>
      <tbody>{traces.map((t, i) => (
        <tr key={i} className={t.status >= 400 || t.status === 0 ? 'row-err' : ''}>
          <td>{t.at.slice(11, 19)}</td><td>{t.method}</td><td><code>{t.path}</code></td>
          <td><span className={`status-code ${t.status === 0 ? 'tone-fg-error' : t.status >= 500 ? 'tone-fg-error' : t.status >= 400 ? 'tone-fg-blocked' : 'tone-fg-success'}`}>{t.status || 'ERR'}</span></td>
          <td>{t.ms.toFixed(0)}</td><td>{t.code ? <code>{t.code}</code> : ''}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}
