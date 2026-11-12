import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import WorkerJobDetailScreen from '../app/(worker)/job/[id]';
import { apiClient } from '../src/services/api/apiClient';
import { orderService } from '../src/services/api/orderService';
import { socketService } from '../src/services/socket/socketService';

const mockPush = jest.fn();
const mockStartTracking = jest.fn(async () => true);
const mockStopTracking = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'order-1', price: '999999', faceVerified: 'true' }),
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../src/features/auth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('../src/hooks/useWorkerLocationTracker', () => ({ useWorkerLocationTracker: () => ({
  isTracking: false, startTracking: mockStartTracking, stopTracking: mockStopTracking,
}) }));
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { get: jest.fn(), patch: jest.fn() } }));
jest.mock('../src/services/api/orderService', () => ({ orderService: { getOrderById: jest.fn() } }));
jest.mock('../src/services/socket/socketService', () => ({ socketService: {
  joinOrderRoom: jest.fn(), leaveOrderRoom: jest.fn(), on: jest.fn(), off: jest.fn(), emit: jest.fn(),
} }));
const snapshot = status => ({ id: 'order-1', status, estimatedPrice: 100000,
  service: { name: 'Dịch vụ từ server' }, customer: { name: 'Khách từ server' }, addressText: 'Địa chỉ server' });
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  apiClient.get.mockResolvedValue({ faceVerifiedAt: new Date().toISOString() });
  orderService.getOrderById.mockResolvedValue(snapshot('MATCHED'));
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('loads order by ID and waits for REST acknowledgement before showing travel state', async () => {
  let resolve;
  apiClient.patch.mockImplementation(() => new Promise(done => { resolve = done; }));
  const ui = render(<WorkerJobDetailScreen />);
  await waitFor(() => expect(ui.getByText('Dịch vụ từ server')).toBeTruthy());
  expect(orderService.getOrderById).toHaveBeenCalledWith('order-1');
  fireEvent.press(ui.getByText('BẮT ĐẦU DI CHUYỂN ĐẾN KHÁCH'));
  expect(apiClient.patch).toHaveBeenCalledWith('/orders/order-1/status', { status: 'WORKER_EN_ROUTE' });
  expect(ui.queryByText('ĐÃ ĐẾN NƠI')).toBeNull();
  await act(async () => resolve({ order: snapshot('WORKER_EN_ROUTE') }));
  expect(ui.getByText('ĐÃ ĐẾN NƠI')).toBeTruthy();
  expect(socketService.emit).not.toHaveBeenCalled();
});
it('restores ARRIVED without silently starting work', async () => {
  orderService.getOrderById.mockResolvedValue(snapshot('ARRIVED'));
  const ui = render(<WorkerJobDetailScreen />);
  await waitFor(() => expect(ui.getByText('BẮT ĐẦU CÔNG VIỆC')).toBeTruthy());
  expect(apiClient.patch).not.toHaveBeenCalled();
  expect(ui.queryByText('BẮT ĐẦU DI CHUYỂN ĐẾN KHÁCH')).toBeNull();
});
it('failed transition refetches instead of inventing a successful state', async () => {
  apiClient.patch.mockRejectedValue(new Error('INVALID_TRANSITION'));
  const ui = render(<WorkerJobDetailScreen />);
  await waitFor(() => expect(ui.getByText('BẮT ĐẦU DI CHUYỂN ĐẾN KHÁCH')).toBeTruthy());
  fireEvent.press(ui.getByText('BẮT ĐẦU DI CHUYỂN ĐẾN KHÁCH'));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Chưa cập nhật trạng thái', 'INVALID_TRANSITION'));
  await waitFor(() => expect(orderService.getOrderById).toHaveBeenCalledTimes(2));
  expect(ui.queryByText('ĐÃ ĐẾN NƠI')).toBeNull();
  expect(mockStartTracking).not.toHaveBeenCalled();
});
it('order event triggers a backend reload rather than trusting event status', async () => {
  render(<WorkerJobDetailScreen />);
  await waitFor(() => expect(socketService.on).toHaveBeenCalled());
  const handler = socketService.on.mock.calls.find(([event]) => event === 'order:status_changed')[1];
  await act(async () => handler({ orderId: 'order-1', status: 'COMPLETED' }));
  expect(orderService.getOrderById).toHaveBeenCalledTimes(2);
  expect(apiClient.patch).not.toHaveBeenCalled();
});
