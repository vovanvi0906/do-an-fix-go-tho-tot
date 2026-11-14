import type { Backend } from '../../lib/types';
import type { Tone } from '../../lib/workflow';
import { Icon, type IconName } from '../Icon';
import { ToneIcon } from '../ui';

export interface Health { key: string; label: string; icon: IconName; value: string; tone: Tone; detail: string }

export function Topbar({ health, backend, onBackend, onConnection, tokenCount }: {
  health: Health[]; backend: Backend; onBackend: (b: Backend) => void; onConnection: () => void; tokenCount: number;
}) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>FixGo FaceID Lab</h1>
        <span className="env-tag" title="Lab chạy trên loopback, dev/staging. Không có thẩm quyền cấp proof.">{envLabel()}</span>
      </div>
      <ul className="health" aria-label="Trạng thái hệ thống">
        {health.map(h => (
          <li key={h.key} className={`pill tone-pill-${h.tone}`} title={h.detail} data-health={h.key} data-tone={h.tone}>
            <Icon name={h.icon} size={14} />
            <span className="pill-k">{h.label}</span>
            <ToneIcon tone={h.tone} size={12} />
            <span className="pill-v">{h.value}</span>
          </li>
        ))}
      </ul>
      <div className="topbar-actions">
        <fieldset className="segmented">
          <legend className="sr-only">Chế độ backend</legend>
          <label title="Research lab: đo lường thật, không thẩm quyền"><input type="radio" name="backend" checked={backend === 'research'} onChange={() => onBackend('research')} /><span>Research</span></label>
          <label title="Face Core: gate production thật"><input type="radio" name="backend" checked={backend === 'core'} onChange={() => onBackend('core')} /><span>Face Core</span></label>
        </fieldset>
        <button type="button" className="btn btn-secondary" onClick={onConnection} aria-label="Mở Connection Settings" aria-haspopup="dialog">
          <Icon name="plug" size={16} /><span className="hide-sm">Connection</span><span className={`count ${tokenCount ? 'count-on' : ''}`}>{tokenCount}/4</span>
        </button>
      </div>
    </header>
  );
}

function envLabel() {
  const host = typeof location !== 'undefined' ? location.hostname : '';
  const loop = ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(host);
  return `${loop ? 'DEV · loopback' : 'STAGING'} · research/test only`;
}
