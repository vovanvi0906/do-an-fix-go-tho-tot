import React from 'react';
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
jest.mock('expo-location', () => ({}));
jest.mock('expo-image-picker', () => ({}));
jest.mock('../src/features/auth', () => ({ useAuth: () => ({ user: { id: 'worker-1' } }) }));
jest.mock('../src/services/api/apiClient', () => ({ apiClient: {} }));
jest.mock('../src/services/api/orderService', () => ({ orderService: { getCurrentWorkerOrder: jest.fn() } }));
jest.mock('../src/services/socket/socketService', () => ({ socketService: {
  connect: jest.fn(), on: jest.fn(), off: jest.fn(), joinOrderRoom: jest.fn(), leaveOrderRoom: jest.fn(),
} }));
beforeEach(() => jest.clearAllMocks());
it('restores backend active card on launch, navigates by ID only, clears completed work after reconnect', async () => {
  orderService.getCurrentWorkerOrder.mockResolvedValueOnce({ id: 'order-1', status: 'AWAITING_PAYMENT', service: { name: 'Dịch vụ backend' }, estimatedPrice: 123000, addressText: 'Địa chỉ backend' }).mockResolvedValue(null);
  const ui = render(<WorkerDashboardScreen />);
  await waitFor(() => expect(ui.getByText('AWAITING_PAYMENT')).toBeTruthy());
  expect(ui.getByText('Dịch vụ backend')).toBeTruthy();
  expect(ui.getByText('📍 Địa chỉ backend')).toBeTruthy();
  expect(socketService.joinOrderRoom).toHaveBeenCalledWith('order-1');
  fireEvent.press(ui.getByText('XEM CHI TIẾT & TIẾP NHẬN CÔNG VIỆC'));
  expect(mockPush).toHaveBeenCalledWith('/(worker)/job/order-1');
  const reconnect = socketService.on.mock.calls.find(([event]) => event === 'connect')[1];
  await act(async () => reconnect());
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
