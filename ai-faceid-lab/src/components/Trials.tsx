import { useState } from 'react';
import { download, IDENTITY_LABELS, PAD_LABELS, summarize, toJsonl, type TrialCondition, type TrialRow, type TrialTask } from '../lib/trials';
import { ActionButton, Card } from './ui';
import { Icon } from './Icon';

export interface TrialSettings { recording: boolean; task: TrialTask; label: string; device: string; lighting: string; instrument: string }

export function TrialsPanel({ rows, conditions, settings, onSettings, onClear, identityThreshold }: {
  rows: TrialRow[];
  conditions: TrialCondition[];
  settings: TrialSettings;
  onSettings: (s: TrialSettings) => void;
  onClear: () => void;
  identityThreshold: number;
}) {
  const [padTh, setPadTh] = useState(0.5);
  const labels = settings.task === 'pad' ? PAD_LABELS : IDENTITY_LABELS;
  const set = (patch: Partial<TrialSettings>) => onSettings({ ...settings, ...patch });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return (
    <div className="stack">
      <p className="callout callout-warn"><Icon name="alert" size={16} /><span>Chỉ thu thập khi protocol, consent người tham gia và vật liệu tấn công đã được duyệt (participant-test-protocol.md). Bảng tóm tắt bên dưới là mô tả, <b>không</b> phải chỉ số bảo mật; chạy <code>ai-service/eval/face_metrics.py</code> với protocol đã duyệt và tập held-out để có APCER/BPCER/FMR/FNMR.</span></p>
      <Card title="Controlled trials (PAD / identity)" icon="scenarios" actions={settings.recording ? <span className="chip chip-live"><span className="chip-dot" />Đang ghi</span> : undefined}>
        <div className="form-grid">
          <label className="check"><input type="checkbox" checked={settings.recording} onChange={e => set({ recording: e.target.checked })} /> Ghi trial sau mỗi phép đo research</label>
          <label className="field">Task <select value={settings.task} onChange={e => set({ task: e.target.value as TrialTask, label: e.target.value === 'pad' ? 'bona_fide' : 'genuine' })}>
            <option value="pad">pad</option><option value="identity">identity</option></select></label>
          <label className="field">Label <select value={settings.label} onChange={e => set({ label: e.target.value })}>{labels.map(l => <option key={l}>{l}</option>)}</select></label>
          <label className="field">Thiết bị <input value={settings.device} onChange={e => set({ device: e.target.value })} placeholder="vd. Laptop webcam 720p" /></label>
          <label className="field">Ánh sáng <input value={settings.lighting} onChange={e => set({ lighting: e.target.value })} placeholder="vd. đèn trần, 300 lux" /></label>
          <label className="field">Instrument <input value={settings.instrument} onChange={e => set({ instrument: e.target.value })} placeholder="vd. in A4 laser / iPhone 12 100%" /></label>
        </div>
        <p className="field-hint">Không nhập tên/thông tin cá nhân. Điều kiện xuất ra file riêng theo trial_id. Trial chỉ được ghi từ phép đo research có điểm thật.</p>
      </Card>
      <Card title={`Tóm tắt mô tả (${rows.length} trial)`} icon="activity"
        actions={<label className="field field-inline">Ngưỡng PAD (chỉ để khám phá) <input type="number" step="0.01" min={0} max={1} value={padTh} onChange={e => setPadTh(Number(e.target.value))} /></label>}>
        {(['pad', 'identity'] as TrialTask[]).map(task => (
          <div key={task} className="scroll"><table className="tbl">
            <thead><tr><th>{task}</th><th>trials</th><th>scored</th><th>≥ ngưỡng</th><th>tỉ lệ (scored)</th></tr></thead>
            <tbody>{summarize(rows, task, task === 'pad' ? padTh : identityThreshold).map(s => (
              <tr key={s.label}><td>{s.label}</td><td>{s.trials}</td><td>{s.scored}</td><td>{s.accepted}</td><td>{s.rate == null ? 'NOT_MEASURED' : s.rate.toFixed(3)}</td></tr>
            ))}</tbody>
          </table></div>
        ))}
        <div className="btn-row">
          <ActionButton icon="download" reason={!rows.length ? 'Chưa có trial nào.' : null} onClick={() => download(`trials-${stamp}.jsonl`, toJsonl(rows))}>Tải trials.jsonl</ActionButton>
          <ActionButton icon="download" reason={!conditions.length ? 'Chưa có trial nào.' : null} onClick={() => download(`trial-conditions-${stamp}.json`, JSON.stringify(conditions, null, 2), 'application/json')}>Tải conditions.json</ActionButton>
          <ActionButton icon="trash" variant="danger" reason={!rows.length ? 'Chưa có trial nào.' : null} onClick={() => { if (confirm('Xóa toàn bộ trial trong bộ nhớ?')) onClear(); }}>Xóa</ActionButton>
        </div>
        {!rows.length && <p className="field-hint">Export bị khóa: bật “Ghi trial”, rồi chạy phép đo research (synthetic hoặc camera đã duyệt).</p>}
      </Card>
    </div>
  );
}
