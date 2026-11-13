import React from 'react';
import { AppState } from 'react-native';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import FaceScreen from '../app/(worker)/verification/face';
import { apiClient } from '../src/services/api/apiClient';
const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockParams = {};
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams, useRouter: () => ({ back: mockBack, replace: mockReplace }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { get: jest.fn(), post: jest.fn() } }));
jest.mock('expo-image-picker', () => ({ requestCameraPermissionsAsync: jest.fn(), launchCameraAsync: jest.fn(), CameraType: { front: 'front' } }));
const blocked = { enrollmentStatus: 'PENDING_REVIEW', canEnroll: false, canVerifyDaily: false, canVerifyOrder: false };
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); mockParams = {}; apiClient.get.mockResolvedValue(blocked); jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() }); });
afterEach(() => { act(() => jest.runOnlyPendingTimers()); jest.useRealTimers(); });
it('daily shows pending state with capture disabled and no gallery option', async () => {
  const ui = render(<FaceScreen />);
  await waitFor(() => expect(ui.getByText('Chụp ảnh — chưa sẵn sàng')).toBeDisabled());
  expect(ui.getByText('Check-in đầu ca')).toBeTruthy();
  expect(ui.queryByText('Chọn ảnh')).toBeNull();
  expect(apiClient.post).not.toHaveBeenCalled();
  fireEvent.press(ui.getByText('Đăng ký lần đầu'));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(worker)/verification/face', params: { mode: 'enrollment' } });
});
it('enrollment requires consent, reports no queued request', async () => {
  mockParams = { mode: 'enrollment' };
  apiClient.post.mockResolvedValue({ ...blocked, accepted: false });
  const ui = render(<FaceScreen />);
  await waitFor(() => expect(ui.getByText('Kiểm tra điều kiện đăng ký')).toBeDisabled());
  fireEvent.press(ui.getByRole('checkbox'));
  fireEvent.press(ui.getByText('Kiểm tra điều kiện đăng ký'));
  await waitFor(() => expect(ui.getByText(/Chưa tiếp nhận đăng ký/)).toBeTruthy());
  expect(ui.queryByText('Xác thực thành công')).toBeNull();
});
it('order context stays distinct and returning cancels state', async () => {
  mockParams = { orderId: 'synthetic-order' };
  const ui = render(<FaceScreen />);
  await waitFor(() => expect(ui.getByText('Xác thực trước công việc')).toBeTruthy());
  fireEvent.press(ui.getByLabelText('Quay lại và hủy xác thực'));
  expect(mockBack).toHaveBeenCalled();
  expect(apiClient.post).not.toHaveBeenCalled();
});
it('offline status can retry', async () => {
  apiClient.get.mockRejectedValueOnce(new Error('offline'));
  const ui = render(<FaceScreen />);
  await waitFor(() => expect(ui.getByText(/Không tải được trạng thái/)).toBeTruthy());
  fireEvent.press(ui.getByText('Kiểm tra lại trạng thái'));
  await waitFor(() => expect(ui.queryByText(/Không tải được trạng thái/)).toBeNull());
});
