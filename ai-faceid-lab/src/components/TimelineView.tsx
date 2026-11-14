import { createContext } from 'react';
import { STAGE_LABEL } from '../lib/codes';
import type { Timeline } from '../lib/timeline';
import { toneOf } from '../lib/workflow';
import { Badge, ToneIcon } from './ui';

/** Where FlowPanel portals its timeline (the bottom Debug drawer). null → render inline. */
export const TimelineHost = createContext<HTMLElement | null>(null);

export function TimelineView({ timeline }: { timeline: Timeline }) {
  return (
    <ol className="timeline" aria-label="Debug timeline">
      {timeline.map((s, i) => (
        <li key={s.stage} className={`stage tone-border-${toneOf(s.status)}`} data-stage={s.stage} data-status={s.status}>
          <div className="stage-head">
            <ToneIcon tone={toneOf(s.status)} size={16} />
            <span className="stage-idx">{String(i + 1).padStart(2, '0')}</span>
            <span className="stage-name">{STAGE_LABEL[s.stage]}</span>
            <Badge status={s.status} />
            {s.ms != null && <span className="stage-ms">{s.ms.toFixed(1)} ms</span>}
          </div>
          <div className="stage-body">
            {s.code && <code className="stage-code">{s.code}</code>}
            <span className="stage-detail">{s.detail}</span>
          </div>
          {(s.ref || s.version || s.policy) && (
            <div className="stage-meta">
              {s.ref && <span>ref: {s.ref}</span>}
              {s.version && <span>model: <code>{s.version}</code></span>}
              {s.policy && <span>policy: {s.policy}</span>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Ten-dot summary for the collapsed drawer bar. Decorative duplicate of the timeline (no data-stage). */
export function MiniStrip({ timeline }: { timeline: Timeline }) {
  return (
    <span className="mini-strip" aria-hidden="true">
      {timeline.map(s => <span key={s.stage} className={`mini-dot tone-bg-${toneOf(s.status)}`} title={`${STAGE_LABEL[s.stage]}: ${s.status}${s.code ? ` · ${s.code}` : ''}`} />)}
    </span>
  );
}
