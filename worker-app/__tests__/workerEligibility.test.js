import { hasShiftVerification, profileRestriction } from '../src/features/auth/services/workerEligibility';
const now = Date.parse('2026-11-12T08:00:00Z');
it.each([null, 'invalid', new Date(now + 1).toISOString(), new Date(now - 86400000).toISOString()])('rejects invalid or expired shift %s', faceVerifiedAt => {
  expect(hasShiftVerification({ faceVerifiedAt }, now)).toBe(false);
});
it('accepts a backend timestamp only within the shift window', () => {
  expect(hasShiftVerification({ faceVerifiedAt: new Date(now - 86399999).toISOString() }, now)).toBe(true);
});
const profile = { user: { role: 'WORKER', status: 'ACTIVE' }, approvalStatus: 'APPROVED', workerServices: [{ id: 'service' }] };
it('allows an approved active worker with registered services', () => expect(profileRestriction(profile)).toBe(''));
it.each(['DRAFT', 'PENDING', 'REJECTED', 'UNKNOWN'])('blocks approval %s', approvalStatus => expect(profileRestriction({ ...profile, approvalStatus })).toBeTruthy());
it.each(['CUSTOMER', 'ADMIN'])('blocks role %s', role => expect(profileRestriction({ ...profile, user: { ...profile.user, role } })).toBeTruthy());
it('blocks locked users and missing services', () => {
  expect(profileRestriction({ ...profile, user: { ...profile.user, status: 'SUSPENDED' } })).toBeTruthy();
  expect(profileRestriction({ ...profile, workerServices: [] })).toBeTruthy();
});
