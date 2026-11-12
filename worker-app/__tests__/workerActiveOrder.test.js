import React from 'react';
import { Alert } from 'react-native';
import { apiClient } from '../src/services/api/apiClient';
import * as Location from 'expo-location';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import WorkerDashboardScreen from '../app/(worker)/(tabs)/index';
import { orderService } from '../src/services/api/orderService';
import { socketService } from '../src/services/socket/socketService';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: cb => require('react').useEffect(cb, [cb]),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn(), getCurrentPositionAsync: jest.fn(), Accuracy: { High: 1 } }));
jest.mock('expo-image-picker', () => ({}));
jest.mock('../src/features/auth', () => ({ useAuth: () => ({ user: { id: 'worker-1' } }) }));
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { get: jest.fn(), patch: jest.fn() } }));
jest.mock('../src/services/api/orderService', () => ({ orderService: { getCurrentWorkerOrder: jest.fn() } }));
jest.mock('../src/services/socket/socketService', () => ({ socketService: {
  connect: jest.fn(), on: jest.fn(), off: jest.fn(), joinOrderRoom: jest.fn(), leaveOrderRoom: jest.fn(),
} }));
const eligible = { user: { role: 'WORKER', status: 'ACTIVE' }, approvalStatus: 'APPROVED', workerServices: [{ id: 'svc' }], faceVerifiedAt: new Date().toISOString(), isOnline: false };
beforeEach(() => {
  jest.clearAllMocks();
  apiClient.get.mockResolvedValue(eligible);
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 10, longitude: 106 } });
});
it('restores backend active card on launch, navigates by ID only, clears completed work after reconnect', async () => {
  orderService.getCurrentWorkerOrder.mockResolvedValueOnce({ id: 'order-1', status: 'AWAITING_PAYMENT', service: { name: 'Dịch vụ backend' }, estimatedPrice: 123000, addressText: 'Địa chỉ backend' }).mockResolvedValue(null);
  const ui = render(<WorkerDashboardScreen />);
  await waitFor(() => expect(ui.getByText('AWAITING_PAYMENT')).toBeTruthy());
  expect(ui.getByText('Dịch vụ backend')).toBeTruthy();
  expect(ui.getByText('📍 Địa chỉ backend')).toBeTruthy();
  expect(socketService.joinOrderRoom).toHaveBeenCalledWith('order-1');
  fireEvent.press(ui.getByText('XEM CHI TIẾT & TIẾP NHẬN CÔNG VIỆC'));
  expect(mockPush).toHaveBeenCalledWith('/(worker)/job/order-1');
  const reconnects = socketService.on.mock.calls.filter(([event]) => event === 'connect').map(([, handler]) => handler);
  await act(async () => Promise.all(reconnects.map(handler => handler())));
  expect(ui.queryByText('Dịch vụ backend')).toBeNull();
  expect(ui.getByText('Không có công việc đang thực hiện.')).toBeTruthy();
});
it('shows loading then recoverable error without an active card', async () => {
  let reject;
  orderService.getCurrentWorkerOrder.mockImplementationOnce(() => new Promise((resolve, fail) => { reject = fail; })).mockResolvedValue(null);
  const ui = render(<WorkerDashboardScreen />);
  expect(ui.getByLabelText('Đang khôi phục công việc')).toBeTruthy();
  await act(async () => reject(new Error('Không có mạng')));
  expect(ui.queryByText('XEM CHI TIẾT & TIẾP NHẬN CÔNG VIỆC')).toBeNull();
  fireEvent.press(ui.getByText('Không có mạng — Thử lại'));
  await waitFor(() => expect(ui.getByText('Không có công việc đang thực hiện.')).toBeTruthy());
});

it('online waits for backend ACK and never flips after permission denial', async () => {
  orderService.getCurrentWorkerOrder.mockResolvedValue(null);
  Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = render(<WorkerDashboardScreen />);
  await waitFor(() => expect(ui.getByText('Không có công việc đang thực hiện.')).toBeTruthy());
  fireEvent(ui.getByRole('switch'), 'valueChange', true);
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(apiClient.patch).not.toHaveBeenCalled();
  expect(ui.queryByText('ĐANG BẬT NHẬN ĐƠN')).toBeNull();
  alert.mockRestore();
});
it('requires a matching availability ACK', async () => {
  orderService.getCurrentWorkerOrder.mockResolvedValue(null);
  apiClient.patch.mockResolvedValue({ isOnline: false });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = render(<WorkerDashboardScreen />);
  await waitFor(() => expect(ui.getByText('Không có công việc đang thực hiện.')).toBeTruthy());
  fireEvent(ui.getByRole('switch'), 'valueChange', true);
  await waitFor(() => expect(apiClient.patch).toHaveBeenCalledWith('/workers/status', { isOnline: true, lat: 10, lng: 106 }));
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(ui.queryByText('ĐANG BẬT NHẬN ĐƠN')).toBeNull();
  alert.mockRestore();
});
