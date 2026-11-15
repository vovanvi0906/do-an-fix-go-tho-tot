import { faceSummary, facePrompt } from '../src/features/face-verification/utils/faceStatus';
import { assessNativeFaces, captureStability } from '../src/features/face-verification/utils/captureQuality';
const profile = { approvalStatus: 'APPROVED' };
const now = Date.now();
const proof = { id: 'proof', purpose: 'DAILY', orderId: null, templateVersion: 1, consumedAt: null, issuedAt: new Date(now-1000).toISOString(), expiresAt: new Date(now+8000).toISOString() };
const enrolled = { enrollmentStatus: 'ENROLLED', canVerifyDaily: true, dailyProof: proof };
it('AC-01 enrolled workers are not prompted for Daily even without any Daily proof', () => {
  expect(facePrompt({ ...enrolled, dailyProof: null }, profile, now)).toBeNull();
  expect(facePrompt({ ...enrolled, dailyProof: null }, profile, now + 9000)).toBeNull();
  expect(faceSummary({ ...enrolled, consentRequired: true }, profile).valid).toBeUndefined();
  expect(faceSummary({ ...enrolled, blockers: ['TEMPLATE_MODEL_CHANGED'] }, profile).valid).toBeUndefined();
});
it('distinguishes first enrollment and withdrawn sample without manual review', () => {
  expect(faceSummary({ enrollmentStatus: 'PENDING_REVIEW', canEnroll: true }, profile).action).toBe('Đăng ký khuôn mặt');
  expect(faceSummary({ reviewRequestSubmitted: true }, profile).title).toBe('Chưa đăng ký khuôn mặt');
  expect(faceSummary({ enrollmentStatus: 'WITHDRAWN' }, profile).mode).toBe('enrollment');
  expect(faceSummary(enrolled, { approvalStatus: 'DRAFT' }).valid).toBeUndefined();
});
it('captures only after multiple stable samples, resets on movement/gaps/multiple faces', () => {
  const face = { frame: { left: 30, top: 30, width: 100, height: 100 }, rotationY: 0, rotationZ: 0 };
  const q = assessNativeFaces([face],160,160);
  expect(q.ok).toBe(true);
  expect(assessNativeFaces([face, face],160,160).ok).toBe(false);
  let state = captureStability(null,q,1000);
  for (const at of [1400,1800,2300]) state = captureStability(state,q,at);
  expect(state.progress).toBe(1);
  expect(captureStability(state,{ ...q, cx: q.cx+.1 },2400).progress).toBe(0);
  expect(captureStability(state,q,4000).progress).toBe(0);
  expect(captureStability(state,{ ok:false },2400).since).toBeNull();
});
