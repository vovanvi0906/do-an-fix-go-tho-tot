import { nextAction } from '../lib/guidance';
import type { Outcome } from '../lib/workflow';
import { toneOf } from '../lib/workflow';
import { Icon } from './Icon';
import { ToneIcon } from './ui';

/** Run summary: where the flow stopped, why, and what to do next. role=status (polite), never alert. */
export function ResultCard({ outcome, researchOnly }: { outcome: Outcome; researchOnly: boolean }) {
  const tone = outcome.kind === 'idle' ? 'neutral' : toneOf(outcome.kind);
  return (
    <section className={`result tone-border-${tone}`} role="status" aria-live="polite" aria-label="Kết quả lần chạy">
      <div className="result-head">
        <ToneIcon tone={tone} size={20} />
        <div>
          <div className="result-title">{outcome.title}</div>
          {outcome.code && outcome.kind !== 'idle' && <code className="result-code">{outcome.code}</code>}
        </div>
      </div>
      <p className="result-text">{outcome.text}</p>
      {outcome.kind !== 'idle' && outcome.kind !== 'success' && (
        <p className="result-next"><Icon name="chevronRight" size={14} /><span><b>Tiếp theo:</b> {nextAction(outcome.code)}</span></p>
      )}
      {outcome.padNotEvaluated && outcome.kind !== 'idle' && (
        <p className="result-note">PAD đang NOT_EVALUATED: production luôn fail closed cho tới khi có PAD provider đã được đánh giá.</p>
      )}
      {researchOnly && outcome.kind !== 'idle' && <p className="result-note">Research mode: chỉ đo, không có thẩm quyền enroll/verify/cấp proof.</p>}
      {outcome.kind !== 'idle' && (
        <details className="result-details">
          <summary>Chi tiết lỗi</summary>
          <dl className="kv">
            <div className="kv-row"><dt>Stage</dt><dd>{outcome.stageLabel ?? '—'}</dd></div>
            <div className="kv-row"><dt>Code</dt><dd><code>{outcome.code ?? '—'}</code></dd></div>
            <div className="kv-row"><dt>Correlation</dt><dd>{outcome.httpRef ?? '—'}</dd></div>
            <div className="kv-row"><dt>Latency (tổng stage)</dt><dd>{outcome.ms != null ? `${outcome.ms.toFixed(1)} ms` : '—'}</dd></div>
          </dl>
        </details>
      )}
    </section>
  );
}
