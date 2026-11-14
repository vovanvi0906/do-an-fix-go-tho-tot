import { Fragment } from 'react';
import { STEP_STATE_LABEL, toneOf, type Step } from '../lib/workflow';
import { ToneIcon } from './ui';

export function Stepper({ steps, label }: { steps: Step[]; label: string }) {
  return (
    <ol className="stepper" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.id} className={`step step-${s.state}`} data-step={s.id} data-state={s.state} aria-current={s.state === 'active' ? 'step' : undefined}>
          <span className="step-marker"><ToneIcon tone={toneOf(s.state)} size={14} /><span className="step-num">{i + 1}</span></span>
          <span className="step-body">
            <span className="step-label">{s.label}</span>
            <span className="step-state">{STEP_STATE_LABEL[s.state]}</span>
            <span className="step-note" title={s.note}>{breakable(s.note)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Let long machine codes wrap at underscores instead of mid-word. */
function breakable(text: string) {
  const parts = text.split('_');
  return parts.map((p, i) => <Fragment key={i}>{p}{i < parts.length - 1 && <>_<wbr /></>}</Fragment>);
}

/** Legend that makes the BLOCKED ≠ REJECTED ≠ ERROR distinction explicit. */
export function StateLegend() {
  return (
    <details className="legend">
      <summary>Ý nghĩa trạng thái</summary>
      <dl>
        <div><dt><ToneIcon tone="blocked" size={14} />Blocked</dt><dd>Gate/policy chặn <b>trước khi</b> đánh giá (consent, data policy, PAD NOT_EVALUATED, ownership). Không phải lỗi ảnh.</dd></div>
        <div><dt><ToneIcon tone="rejected" size={14} />Rejected</dt><dd>Đã đánh giá và <b>không đạt</b> (NO_FACE, quality FAIL, cosine dưới ngưỡng).</dd></div>
        <div><dt><ToneIcon tone="error" size={14} />Error</dt><dd>Lỗi kỹ thuật: mạng, timeout, model. Fail closed, không có kết quả.</dd></div>
        <div><dt><ToneIcon tone="info" size={14} />Measured</dt><dd>Research chỉ đo điểm; không phải quyết định MATCH/PASS.</dd></div>
        <div><dt><ToneIcon tone="neutral" size={14} />Skipped / Pending</dt><dd>Không chạy vì luồng dừng trước đó, hoặc chưa tới.</dd></div>
      </dl>
    </details>
  );
}
