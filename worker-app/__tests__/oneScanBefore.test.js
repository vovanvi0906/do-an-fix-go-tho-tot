import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import { BeforePhotoCapture } from '../src/features/orders/components/BeforePhotoCapture';
import { jobReadiness } from '../src/features/orders/jobReadiness';
import { orderService } from '../src/services/api/orderService';

const mockTake = jest.fn();
jest.mock('expo-camera', () => {
  const React = require('react'), { View } = require('react-native');
  return { useCameraPermissions: () => [{ granted: true }, jest.fn()],
    CameraView: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({ takePictureAsync: mockTake }));
      return <View testID="before-camera" {...props} />;
    }) };
});
jest.mock('../src/services/api/orderService', () => ({ orderService: { uploadBeforeMedia: jest.fn(), uploadImage: jest.fn() } }));
jest.mock('../src/features/face-verification/utils/captureFiles', () => ({ deleteCaptureFile: jest.fn(async () => {}) }));
const now = Date.now();
const order = { id: 'o', status: 'ARRIVED', images: [], statusHistory: [{ status: 'ARRIVED', createdAt: new Date(now - 10000).toISOString() }] };
const proof = { id: 'p', orderId: 'o', purpose: 'ORDER', templateVersion: 1, consumedAt: null,
  issuedAt: new Date(now - 1000).toISOString(), expiresAt: new Date(now + 60000).toISOString() };
const face = { canVerifyOrder: true, canUseOrderProof: true, orderProof: proof };
beforeEach(() => {
  jest.clearAllMocks(); mockTake.mockResolvedValue({ uri: 'file:///before.jpg' });
  orderService.uploadBeforeMedia.mockResolvedValue({ success: true, data: { url: 'https://storage.invalid/before.jpg' } });
  orderService.uploadImage.mockResolvedValue({ success: true, image: { orderId: 'o', type: 'BEFORE', url: 'https://storage.invalid/before.jpg' } });
});
it('AC-06/07/08 derives scan → BEFORE → start only from persisted backend snapshots', () => {
  expect(jobReadiness(order, null, now).step).toBe('FACE');
  expect(jobReadiness(order, face, now).step).toBe('BEFORE');
  const saved = { ...order, images: [{ type: 'BEFORE', uploadedAt: new Date(now).toISOString() }] };
  expect(jobReadiness(saved, face, now).step).toBe('START');
  expect(jobReadiness(saved, face, now + 61000).step).toBe('FACE');
  expect(jobReadiness({ ...saved, status: 'IN_PROGRESS' }, null, now).step).toBe('WORK');
});
it.each([
  { ...proof, orderId: 'other' }, { ...proof, purpose: 'DAILY' },
  { ...proof, consumedAt: new Date(now).toISOString() }, { ...proof, expiresAt: new Date(now - 1).toISOString() },
])('AC-12 invalid/foreign proof cannot open BEFORE/start', p => {
  expect(jobReadiness(order, { ...face, orderProof: p }, now).step).toBe('FACE');
});
async function capture(ui) {
  fireEvent.press(ui.getByText('Chụp ảnh trước khi làm'));
  fireEvent(ui.getByTestId('before-camera'), 'cameraReady');
  await act(async () => fireEvent.press(ui.getByText('Chụp BEFORE')));
}
it('AC-07/11 double tap uploads bytes once, then persists URL and awaits refetch', async () => {
  const saved = jest.fn(async () => {});
  const ui = render(<BeforePhotoCapture orderId="o" enabled onSaved={saved} />);
  await capture(ui);
  await act(async () => { fireEvent.press(ui.getByText('Lưu ảnh BEFORE')); fireEvent.press(ui.getByText('Lưu ảnh BEFORE')); });
  expect(orderService.uploadBeforeMedia).toHaveBeenCalledTimes(1);
  expect(orderService.uploadImage).toHaveBeenCalledWith('o', { type: 'BEFORE', url: 'https://storage.invalid/before.jpg' }, expect.anything());
  expect(saved).toHaveBeenCalledTimes(1);
});
it('AC-09 failed storage does not persist image/start; same capture can retry', async () => {
  orderService.uploadBeforeMedia.mockRejectedValueOnce(Error('Storage unavailable'));
  const ui = render(<BeforePhotoCapture orderId="o" enabled onSaved={jest.fn()} />);
  await capture(ui); await act(async () => fireEvent.press(ui.getByText('Lưu ảnh BEFORE')));
  expect(orderService.uploadImage).not.toHaveBeenCalled();
  expect(ui.getByText(/Storage unavailable/)).toBeTruthy();
  await act(async () => fireEvent.press(ui.getByText('Lưu ảnh BEFORE')));
  expect(mockTake).toHaveBeenCalledTimes(1); expect(orderService.uploadImage).toHaveBeenCalledTimes(1);
});
it('AC-10 DB save retry reuses uploaded URL rather than uploading again', async () => {
  orderService.uploadImage.mockRejectedValueOnce(Error('Timeout'));
  const ui = render(<BeforePhotoCapture orderId="o" enabled onSaved={jest.fn()} />);
  await capture(ui); await act(async () => fireEvent.press(ui.getByText('Lưu ảnh BEFORE')));
  await act(async () => fireEvent.press(ui.getByText('Lưu ảnh BEFORE')));
  expect(orderService.uploadBeforeMedia).toHaveBeenCalledTimes(1);
  expect(orderService.uploadImage).toHaveBeenCalledTimes(2);
});
it('AC-12 expired proof closes the scene camera and prevents persistence', async () => {
  const ui = render(<BeforePhotoCapture orderId="o" enabled onSaved={jest.fn()} />);
  await capture(ui);
  ui.rerender(<BeforePhotoCapture orderId="o" enabled={false} onSaved={jest.fn()} />);
  expect(ui.getByText('Lưu ảnh BEFORE')).toBeDisabled();
  fireEvent.press(ui.getByText('Lưu ảnh BEFORE'));
  expect(orderService.uploadBeforeMedia).not.toHaveBeenCalled();
});
