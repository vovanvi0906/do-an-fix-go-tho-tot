import { useId, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { toneOf, type Tone } from '../lib/workflow';

const TONE_ICON: Record<Tone, IconName> = {
  success: 'check', rejected: 'x', blocked: 'lock', error: 'alert', neutral: 'circle', info: 'activity', ne: 'question', active: 'dot',
};

/** Status badge: colour + icon + text, never colour alone. */
export function Badge({ status, children, tone, title }: { status?: string; children?: ReactNode; tone?: Tone; title?: string }) {
  const t = tone ?? toneOf(status ?? '');
  return <span className={`badge tone-${t}`} title={title}><Icon name={TONE_ICON[t]} size={12} />{children ?? status}</span>;
}

export function ToneIcon({ tone, size = 16 }: { tone: Tone; size?: number }) {
  return <Icon name={TONE_ICON[tone]} size={size} className={`tone-fg-${tone}`} />;
}

export function Card({ title, icon, actions, children, className, labelledBy }: { title?: ReactNode; icon?: IconName; actions?: ReactNode; children: ReactNode; className?: string; labelledBy?: string }) {
  const id = useId();
  return (
    <section className={`card ${className ?? ''}`} aria-labelledby={title ? (labelledBy ?? id) : undefined}>
      {title && (
        <header className="card-head">
          <h3 id={labelledBy ?? id}>{icon && <Icon name={icon} size={16} />}{title}</h3>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/**
 * Button that explains why it is disabled. The reason is rendered by <Hints> as visible text
 * (disabled buttons cannot show tooltips to keyboard/touch users); `title` is a mouse fallback.
 */
export function ActionButton({ children, onClick, reason, busy, variant = 'secondary', icon, title, describedBy }: {
  children: ReactNode; onClick: () => void; reason?: string | null; busy?: boolean; variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: IconName; title?: string; describedBy?: string;
}) {
  const disabled = !!reason || !!busy;
  return (
    <button type="button" className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}
      title={reason ?? title} aria-describedby={reason ? describedBy : undefined}>
      {icon && <Icon name={icon} size={16} />}<span>{children}</span>
    </button>
  );
}

/** Visible "why disabled → what to do" lines for a group of actions. */
export function Hints({ id, items }: { id: string; items: (string | null | false | undefined)[] }) {
  const list = [...new Set(items.filter(Boolean) as string[])];
  if (!list.length) return null;
  return (
    <ul className="hints" id={id}>
      {list.map(h => <li key={h}><Icon name="info" size={14} />{h}</li>)}
    </ul>
  );
}

export function Kv({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return <dl className="kv">{rows.map(([k, v], i) => <div key={i} className="kv-row"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

export function Empty({ icon = 'info', children }: { icon?: IconName; children: ReactNode }) {
  return <div className="empty"><Icon name={icon} size={20} /><div>{children}</div></div>;
}

export function Meter({ value, min = 0, max = 1, threshold, label }: { value: number; min?: number; max?: number; threshold?: number | null; label: string }) {
  const pct = (v: number) => `${Math.max(0, Math.min(1, (v - min) / (max - min))) * 100}%`;
  return (
    <div className="meter" role="meter" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}>
      <div className="meter-fill" style={{ width: pct(value) }} />
      {threshold != null && <div className="meter-th" style={{ left: pct(threshold) }} title={`threshold ${threshold}`} />}
    </div>
  );
}
