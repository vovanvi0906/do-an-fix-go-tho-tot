import { STAGE_LABEL } from '../lib/codes';
import type { Timeline } from '../lib/timeline';

export function TimelineView({ timeline }: { timeline: Timeline }) {
  return (
    <ol className="timeline" aria-label="Debug timeline">
      {timeline.map(s => (
        <li key={s.stage} className={`stage st-${s.status}`} data-stage={s.stage} data-status={s.status}>
          <div className="stage-head">
            <span className="stage-name">{STAGE_LABEL[s.stage]}</span>
            <span className={`badge b-${s.status}`}>{s.status}</span>
            {s.ms != null && <span className="muted small">{s.ms.toFixed(1)} ms</span>}
          </div>
          {s.code && <code className="small">{s.code}</code>}
          <div className="small">{s.detail}</div>
          {(s.ref || s.version || s.policy) && (
            <div className="stage-meta small muted">
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
