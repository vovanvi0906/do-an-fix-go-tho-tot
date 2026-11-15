import { AppState } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../src/services/api/apiClient';
import { useFaceVerification } from '../src/features/face-verification/hooks/useFaceVerification';
import { hasShiftVerification } from '../src/features/auth/services/workerEligibility';

jest.mock('../src/services/api/apiClient', () => ({ apiClient: { post: jest.fn(), get: jest.fn(), delete: jest.fn() } }));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'bc6cb9be-55ee-42be-8df7-493e09a6019d') }));
jest.mock('expo-image-picker', () => ({ requestCameraPermissionsAsync: jest.fn(), launchCameraAsync: jest.fn(), CameraType: { front: 'front' } }));
const ready = { enrollmentStatus: 'ENROLLED', templateVersion: 1, canVerifyDaily: true, canVerifyOrder: true, canEnroll: false, dailyProof: null, orderProof: null };
const makeSession = (purpose='DAILY', orderId=null, templateVersion=1) => ({ id: 'session-1', nonce: 'synthetic-nonce', purpose, orderId, templateVersion, expiresAt: new Date(Date.now()+120000).toISOString() });
const proof = (purpose='DAILY', orderId=null) => ({ id: 'proof-1', purpose, orderId, templateVersion: 1, consumedAt: null, issuedAt: new Date(Date.now()-1000).toISOString(), expiresAt: new Date(Date.now()+300000).toISOString() });
beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  apiClient.get.mockResolvedValue({ data: ready });
  ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
  ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///synthetic.jpg' }] });
});
async function hook(orderId, mode='daily') {
  const result = renderHook(() => useFaceVerification(orderId, undefined, mode));
  await waitFor(() => expect(result.result.current.loadingStatus).toBe(false)); return result;
}
it('daily uses backend session before camera and trusts only refetched matching proof', async () => {
  apiClient.post.mockResolvedValueOnce({ data: makeSession() }).mockResolvedValueOnce({ data: { verified: true, proof: proof() } });
  const h = await hook();
  await act(async () => h.result.current.takeSelfie());
  expect(apiClient.post.mock.calls[0][1]).toMatchObject({ purpose: 'DAILY' });
  expect(apiClient.post.mock.invocationCallOrder[0]).toBeLessThan(ImagePicker.launchCameraAsync.mock.invocationCallOrder[0]);
  apiClient.get.mockResolvedValue({ data: { ...ready, dailyProof: proof() } });
  await act(async () => h.result.current.verify());
  expect(apiClient.post.mock.calls[1][0]).toBe('/workers/me/face/sessions/session-1/capture');
  expect(h.result.current.result.verified).toBe(true);
  expect(hasShiftVerification(h.result.current.status)).toBe(true);
});
it('per-order upload success cannot substitute proof of another order', async () => {
  apiClient.post.mockResolvedValueOnce({ data: makeSession('ORDER','order-1') }).mockResolvedValueOnce({ data: { verified: true, proof: proof('ORDER','order-2') } });
  const h = await hook('order-1'); await act(async () => h.result.current.takeSelfie());
  apiClient.get.mockResolvedValue({ data: { ...ready, orderProof: proof('ORDER','order-2') } });
  await act(async () => h.result.current.verify());
  expect(h.result.current.result.verified).toBe(false);
});
it('success response without persisted proof stays failure', async () => {
  apiClient.post.mockResolvedValueOnce({ data: makeSession() }).mockResolvedValueOnce({ data: { verified: true, proof: proof() } });
  const h = await hook(); await act(async () => h.result.current.takeSelfie()); await act(async () => h.result.current.verify());
  expect(h.result.current.result.verified).toBe(false);
});
it('enrollment success is distinct from a daily verification proof', async () => {
  apiClient.get.mockResolvedValue({ data: { ...ready, enrollmentStatus: 'PENDING_REVIEW', canEnroll: true, canVerifyDaily: false } });
  apiClient.post.mockResolvedValueOnce({ data: makeSession('ENROLLMENT',null,2) }).mockResolvedValueOnce({ data: { enrolled: true } });
  const h = await hook(undefined,'enrollment'); await act(async () => h.result.current.takeSelfie());
  apiClient.get.mockResolvedValue({ data: { ...ready, templateVersion: 2 } });
  await act(async () => h.result.current.verify());
  expect(h.result.current.result.enrolled).toBe(true); expect(h.result.current.result.verified).toBe(false);
  expect(hasShiftVerification(h.result.current.status)).toBe(false);
});
it('creation retry keeps idempotency key and nonce; native camera background does not cancel capture', async () => {
  apiClient.post.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({ data: makeSession() });
  const h = await hook(); await act(async () => h.result.current.takeSelfie()); act(() => h.result.current.reset());
  ImagePicker.launchCameraAsync.mockImplementation(async () => {
    const listener = AppState.addEventListener.mock.calls[0][1]; listener('background'); listener('active');
    return { canceled: false, assets: [{ uri: 'file:///synthetic.jpg' }] };
  });
  await act(async () => h.result.current.takeSelfie());
  expect(apiClient.post.mock.calls[0][1].requestKey).toBe(apiClient.post.mock.calls[1][1].requestKey);
  expect(h.result.current.imageUri).toBe('file:///synthetic.jpg'); expect(apiClient.get).toHaveBeenCalledTimes(1);
});
it('consent and withdrawal use backend records without automatic enrollment', async () => {
  apiClient.get.mockResolvedValue({ data: { ...ready, requiredConsentVersion: 'experimental-v1', consentRequired: true } });
  apiClient.post.mockResolvedValue({ data: { consentVersion: 'experimental-v1' } });
  apiClient.delete.mockResolvedValue({ data: { templatesDeleted: true } });
  const h = await hook(undefined,'enrollment');
  await act(async () => h.result.current.recordConsent(true));
  expect(apiClient.post).toHaveBeenCalledWith('/workers/me/face/consent', { consent: true, version: 'experimental-v1' }, expect.any(Object));
  await act(async () => h.result.current.withdraw());
  expect(apiClient.delete).toHaveBeenCalledWith('/workers/me/face/template', expect.any(Object));
  expect(h.result.current.result.verified).toBe(false);
});
it('embedded capture creates scoped session before opening, no external camera is launched', async () => {
  apiClient.post.mockResolvedValueOnce({ data: makeSession() });
  const h = renderHook(() => useFaceVerification(undefined, undefined, 'daily', { embeddedCamera: true }));
  await waitFor(() => expect(h.result.current.loadingStatus).toBe(false));
  await act(async () => h.result.current.takeSelfie());
  expect(h.result.current.cameraVisible).toBe(true);
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  act(() => h.result.current.acceptCapture('file:///synthetic-live.jpg'));
  expect(h.result.current.imageUri).toBe('file:///synthetic-live.jpg');
  expect(h.result.current.cameraVisible).toBe(false);
  act(() => h.result.current.cancel());
  expect(h.result.current.imageUri).toBeNull();
  expect(h.result.current.status).toBeNull();
});
it('self enrollment exposes no manual review request action', async () => {
  const h = await hook(undefined,'enrollment');
  expect(h.result.current.requestReview).toBeUndefined();
  expect(apiClient.post).not.toHaveBeenCalled();
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
});

it('one enrollment tap saves consent and confirms readiness before opening the camera', async () => {
  const pending={enrollmentStatus:'NOT_ENROLLED',consentRequired:true,requiredConsentVersion:'v1',canEnroll:false,blockers:['CONSENT_REQUIRED']};
  apiClient.get.mockResolvedValueOnce({data:pending}).mockResolvedValueOnce({data:{...pending,consentRequired:false,canEnroll:true,blockers:[]}});
  apiClient.post.mockResolvedValueOnce({data:{consentVersion:'v1'}}).mockResolvedValueOnce({data:makeSession('ENROLLMENT')});
  const h=await hook(undefined,'enrollment');
  expect(apiClient.post).not.toHaveBeenCalled();
  await act(async()=>h.result.current.takeSelfie(true));
  expect(apiClient.post.mock.calls[0][0]).toBe('/workers/me/face/consent');
  expect(apiClient.post.mock.calls[0][1]).toEqual({consent:true,version:'v1'});
  expect(apiClient.post.mock.calls[1][0]).toBe('/workers/me/face/sessions');
  expect(ImagePicker.launchCameraAsync).toHaveBeenCalledTimes(1);
});
it('declining consent or failure to save it never opens enrollment camera', async () => {
  apiClient.get.mockResolvedValue({data:{enrollmentStatus:'NOT_ENROLLED',consentRequired:true,requiredConsentVersion:'v1',canEnroll:false,blockers:['CONSENT_REQUIRED']}});
  const h=await hook(undefined,'enrollment');
  await act(async()=>h.result.current.takeSelfie(false));
  expect(apiClient.post).not.toHaveBeenCalled();
  apiClient.post.mockRejectedValueOnce(Error('offline'));
  await act(async()=>h.result.current.takeSelfie(true));
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});

it('embedded camera survives the Android camera permission dialog and opens after approval', async () => {
  let grant;
  ImagePicker.requestCameraPermissionsAsync.mockImplementation(()=>new Promise(resolve=>{grant=resolve;}));
  apiClient.post.mockResolvedValue({data:makeSession('ENROLLMENT')});
  apiClient.get.mockResolvedValue({data:{...ready,enrollmentStatus:'NOT_ENROLLED',canEnroll:true}});
  const h=renderHook(()=>useFaceVerification(undefined,undefined,'enrollment',{embeddedCamera:true}));
  await waitFor(()=>expect(h.result.current.loadingStatus).toBe(false));
  let opening;
  act(()=>{opening=h.result.current.takeSelfie(true);});
  const listener=AppState.addEventListener.mock.calls.at(-1)[1];
  act(()=>listener('background'));
  act(()=>listener('active'));
  await act(async()=>{grant({granted:true});await opening;});
  expect(h.result.current.cameraVisible).toBe(true);
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
});
