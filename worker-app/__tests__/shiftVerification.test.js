import { renderHook, act } from '@testing-library/react-native';
import { useFaceVerification } from '../src/features/face-verification/hooks/useFaceVerification';
import { apiClient } from '../src/services/api/apiClient';
import * as ImagePicker from 'expo-image-picker';
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { post: jest.fn(), get: jest.fn() } }));
jest.mock('expo-image-picker', () => ({ requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })), launchCameraAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///selfie.jpg' }] })), CameraType: { front: 'front' } }));
beforeEach(() => jest.clearAllMocks());
async function ready(orderId) {
  const hook = renderHook(() => useFaceVerification(orderId));
  await act(async () => hook.result.current.takeSelfie());
  return hook;
}
it('refetches backend proof after daily face response and suppresses double-submit', async () => {
  apiClient.post.mockResolvedValue({ success: true });
  apiClient.get.mockResolvedValue({ faceVerifiedAt: new Date().toISOString() });
  const hook = await ready();
  await act(async () => { await Promise.all([hook.result.current.verify(), hook.result.current.verify()]); });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  expect(apiClient.post.mock.calls[0][0]).toBe('/workers/verify-face-daily');
  expect(apiClient.get).toHaveBeenCalledWith('/workers/me');
  expect(hook.result.current.result.verified).toBe(true);
});
it('does not trust face response without persisted verification', async () => {
  apiClient.post.mockResolvedValue({ success: true });
  apiClient.get.mockResolvedValue({ faceVerifiedAt: null });
  const hook = await ready();
  await act(async () => hook.result.current.verify());
  expect(hook.result.current.result.verified).toBe(false);
});
it('timeout remains failure and can retry', async () => {
  apiClient.post.mockRejectedValueOnce(new Error('Timeout'));
  const hook = await ready();
  await act(async () => hook.result.current.verify());
  expect(hook.result.current.result.verified).toBe(false);
  expect(hook.result.current.isAnalyzing).toBe(false);
  expect(apiClient.get).not.toHaveBeenCalled();
});
it('never substitutes a daily timestamp for order verification', async () => {
  const hook = await ready('order-1');
  await act(async () => hook.result.current.verify());
  expect(apiClient.post).not.toHaveBeenCalled();
  expect(hook.result.current.result.verified).toBe(false);
});
