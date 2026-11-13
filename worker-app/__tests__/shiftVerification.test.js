import { AppState } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFaceVerification } from '../src/features/face-verification/hooks/useFaceVerification';
import { apiClient } from '../src/services/api/apiClient';
import * as ImagePicker from 'expo-image-picker';
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { post: jest.fn(), get: jest.fn() } }));
jest.mock('expo-image-picker', () => ({ requestCameraPermissionsAsync: jest.fn(), launchCameraAsync: jest.fn(), CameraType: { front: 'front' } }));
const blocked = { enrollmentStatus: 'PENDING_REVIEW', canVerifyDaily: false, canVerifyOrder: false, dailyProof: null };
beforeEach(() => { jest.resetAllMocks(); apiClient.get.mockResolvedValue(blocked); jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() }); });
async function ready(orderId, mode) {
  const hook = renderHook(() => useFaceVerification(orderId, undefined, mode));
  await waitFor(() => expect(hook.result.current.loadingStatus).toBe(false));
  return hook;
}
it.each([undefined, 'order-1'])('does not collect or upload while blocked (%s)', async orderId => {
  const hook = await ready(orderId);
  await act(async () => hook.result.current.takeSelfie());
  expect(ImagePicker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  expect(apiClient.post).not.toHaveBeenCalled();
  expect(hook.result.current.result.verified).toBe(false);
});
it('never treats timestamp or arbitrary backend success as scoped proof', async () => {
  apiClient.get.mockResolvedValue({ faceVerifiedAt: new Date().toISOString(), verified: true });
  const hook = await ready();
  await act(async () => hook.result.current.verify());
  expect(hook.result.current.result.verified).toBe(false);
  expect(apiClient.post).not.toHaveBeenCalled();
});
it('offline status is recoverable without restoring local success', async () => {
  apiClient.get.mockRejectedValueOnce(new Error('offline'));
  const hook = await ready();
  expect(hook.result.current.statusError).toBeTruthy();
  await act(async () => hook.result.current.refresh());
  expect(hook.result.current.status).toEqual(blocked);
  expect(hook.result.current.statusError).toBe('');
});
it('preflight requires consent and never reports accepted enrollment', async () => {
  const hook = await ready(undefined, 'enrollment');
  await act(async () => hook.result.current.preflight(false));
  expect(apiClient.post).not.toHaveBeenCalled();
  apiClient.post.mockResolvedValue({ ...blocked, accepted: false, reviewRequestSubmitted: false });
  await act(async () => hook.result.current.preflight(true));
  expect(apiClient.post).toHaveBeenCalledWith('/workers/me/face/enrollment/preflight', { consent: true }, expect.any(Object));
  expect(hook.result.current.result.verified).toBe(false);
});
it('reset is preflight only, with duplicate submit suppression', async () => {
  let finish;
  apiClient.post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const hook = await ready(undefined, 'reset');
  await act(async () => { hook.result.current.preflight(true); hook.result.current.preflight(true); });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  expect(apiClient.post.mock.calls[0][0]).toBe('/workers/me/face/reset/preflight');
  await act(async () => finish(blocked));
  expect(hook.result.current.result.verified).toBe(false);
});
it('camera permission denial has feedback, never gallery fallback', async () => {
  apiClient.get.mockResolvedValue({ ...blocked, canVerifyDaily: true });
  ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });
  const hook = await ready();
  await act(async () => hook.result.current.takeSelfie());
  expect(hook.result.current.result.message).toContain('quyền camera');
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  expect(hook.result.current.pickImage).toBeUndefined();
});
it('cancel aborts pending request and ignores delayed response', async () => {
  let finish;
  apiClient.get.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const hook = renderHook(() => useFaceVerification());
  act(() => hook.result.current.cancel());
  await act(async () => finish({ verified: true }));
  expect(hook.result.current.status).toBeNull();
  expect(hook.result.current.result).toBeNull();
  expect(apiClient.get.mock.calls[0][1].signal.aborted).toBe(true);
});

it('foreground restoration refetches server status and discards capture state', async () => {
  const hook = await ready('order-1');
  const listener = AppState.addEventListener.mock.calls[0][1];
  act(() => listener('background'));
  expect(hook.result.current.status).toBeNull();
  await act(async () => listener('active'));
  expect(apiClient.get).toHaveBeenCalledTimes(2);
  expect(hook.result.current.status).toEqual(blocked);
  expect(hook.result.current.imageUri).toBeNull();
});
