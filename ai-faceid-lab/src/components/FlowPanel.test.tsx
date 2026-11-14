import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FlowPanel } from './FlowPanel';
import { LabClient } from '../lib/api';
import { measurement } from '../lib/fixtures';

afterEach(cleanup);

type Route = (url: string, init: RequestInit) => { status: number; body: unknown };
function client(route: Route) {
  const calls: string[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push(`${init.method} ${url}`);
    const r = route(url, init);
    return new Response(JSON.stringify(r.body), { status: r.status });
  }) as unknown as typeof fetch;
  return { c: new LabClient('', 'tok', undefined, fn), calls };
}
const stage = (name: string) => document.querySelector(`[data-stage="${name}"]`)!;
const session = { id: 'sess-1', purpose: 'DAILY', orderId: null, nonce: 'nonce-abcdefghij', expiresAt: new Date(Date.now() + 120000).toISOString(), state: 'PENDING' };

test('Face Core: PAD unavailable blocks at session creation and never issues proof', async () => {
  const { c } = client(() => ({ status: 400, body: { success: false, statusCode: 400, error: { message: 'PAD_NOT_EVALUATED' } } }));
  const onRun = vi.fn();
  render(<FlowPanel purpose="DAILY" backend="core" research={null} core={c} other={null} onRun={onRun} researchCameraAllowed={false} />);
  await act(async () => { fireEvent.click(screen.getByText('Tạo session DAILY')); });
  await waitFor(() => expect(stage('PAD').getAttribute('data-status')).toBe('NOT_EVALUATED'));
  expect(stage('SESSION').getAttribute('data-status')).toBe('BLOCKED');
  expect(stage('PROOF').getAttribute('data-status')).toBe('BLOCKED');
  expect(onRun).toHaveBeenCalled();
});

test('Research synthetic: real-shaped measurement maps to stages, no proof', async () => {
  const m = measurement({ errorCode: 'NO_FACE', identityDecision: 'INCONCLUSIVE', identityScore: null, padRealScore: null, padSpoofScore: null,
    quality: { decision: 'FAIL', faceCount: 0, brightness: null, sharpness: null, reasons: ['NO_FACE'] },
    padPolicy: { decision: 'NOT_EVALUATED', reason: 'PAD_NOT_RUN_NO_SINGLE_FACE', evaluated: false, threshold: null, evaluationReference: null } });
  const { c, calls } = client(url => url.endsWith('/synthetic') ? { status: 201, body: { success: true, data: m } } : { status: 201, body: { success: true, data: session } });
  render(<FlowPanel purpose="DAILY" backend="research" research={c} core={null} other={null} onRun={() => {}} researchCameraAllowed={false} />);
  await act(async () => { fireEvent.click(screen.getByText('Tạo session DAILY')); });
  await waitFor(() => expect(stage('SESSION').getAttribute('data-status')).toBe('PASS'));
  expect(screen.queryByText('nonce-abcdefghij')).toBeNull(); // nonce masked in UI
  await act(async () => { fireEvent.click(screen.getByText('Synthetic (server tự tạo ảnh)')); });
  await waitFor(() => expect(stage('DETECTION').getAttribute('data-status')).toBe('FAIL'));
  expect(stage('AUTH').getAttribute('data-status')).toBe('PASS');
  expect(stage('QUALITY').getAttribute('data-status')).toBe('SKIPPED');
  expect(stage('CAMERA').getAttribute('data-status')).toBe('SKIPPED');
  expect(stage('PROOF').getAttribute('data-status')).toBe('BLOCKED');
  expect(calls).toEqual(['POST /face-research/sessions', 'POST /face-research/sessions/sess-1/synthetic']);
});

test('Nonce replay/forgery is rejected by backend and shown at SESSION', async () => {
  const { c } = client((url, init) => url.endsWith('/synthetic')
    ? (JSON.parse(String(init.body)).nonce === session.nonce ? { status: 201, body: { success: true, data: measurement() } } : { status: 400, body: { statusCode: 400, message: 'RESEARCH_NONCE_INVALID' } })
    : { status: 201, body: { success: true, data: session } });
  render(<FlowPanel purpose="DAILY" backend="research" research={c} core={null} other={null} onRun={() => {}} researchCameraAllowed={false} />);
  await act(async () => { fireEvent.click(screen.getByText('Tạo session DAILY')); });
  await waitFor(() => expect(stage('SESSION').getAttribute('data-status')).toBe('PASS'));
  await act(async () => { fireEvent.click(screen.getByText('Nonce sai/replay')); });
  await waitFor(() => expect(stage('SESSION').getAttribute('data-status')).toBe('BLOCKED'));
  expect(stage('SESSION').textContent).toContain('RESEARCH_NONCE_INVALID');
});

test('Research camera upload is not transmitted when capture is not approved', async () => {
  const { c, calls } = client(() => ({ status: 201, body: { success: true, data: session } }));
  render(<FlowPanel purpose="ENROLLMENT" backend="research" research={c} core={null} other={null} onRun={() => {}} researchCameraAllowed={false} />);
  await act(async () => { fireEvent.click(screen.getByText('Tạo session ENROLLMENT')); });
  await waitFor(() => expect(stage('SESSION').getAttribute('data-status')).toBe('PASS'));
  await act(async () => { fireEvent.click(screen.getByText('Gửi ảnh camera')); });
  expect(stage('POLICY').textContent).toContain('RESEARCH_CAPTURE_NOT_APPROVED');
  expect(calls.some(x => x.includes('/capture'))).toBe(false);
});

test('Camera permission denied is shown in the timeline', async () => {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: () => Promise.reject(Object.assign(new Error('no'), { name: 'NotAllowedError' })) } });
  render(<FlowPanel purpose="DAILY" backend="research" research={null} core={null} other={null} onRun={() => {}} researchCameraAllowed={false} />);
  await act(async () => { fireEvent.click(screen.getByText('Bật camera')); });
  await waitFor(() => expect(stage('CAMERA').getAttribute('data-status')).toBe('BLOCKED'));
  expect(screen.getByRole('alert').textContent).toContain('CAMERA_PERMISSION_DENIED');
});

test('Order: foreign order is rejected by backend ownership check', async () => {
  const { c, calls } = client(() => ({ status: 403, body: { statusCode: 403, message: 'RESEARCH_ORDER_DENIED' } }));
  render(<FlowPanel purpose="ORDER" orderId="00000000-0000-4000-8000-000000000000" backend="research" research={c} core={null} other={null} onRun={() => {}} researchCameraAllowed={false} />);
  await act(async () => { fireEvent.click(screen.getByText('Order không thuộc worker')); });
  await waitFor(() => expect(stage('SESSION').textContent).toContain('RESEARCH_ORDER_DENIED'));
  expect(calls[0]).toBe('POST /face-research/sessions');
});
