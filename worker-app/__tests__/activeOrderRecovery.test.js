import React from 'react';
import { AppState, Text, TouchableOpacity } from 'react-native';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { useOrderRecovery } from '../src/features/orders/hooks/useOrderRecovery';
import { orderService, ACTIVE_WORKER_STATUSES } from '../src/services/api/orderService';
import { apiClient } from '../src/services/api/apiClient';
import { socketService } from '../src/services/socket/socketService';

jest.mock('expo-router', () => ({ useFocusEffect: cb => require('react').useEffect(cb, [cb]) }));
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { get: jest.fn() } }));
jest.mock('../src/services/socket/socketService', () => ({ socketService: { on: jest.fn(), off: jest.fn() } }));
const load = () => orderService.getCurrentWorkerOrder();
function Harness({ identity = 'worker-1' }) {
  const { data, loading, error, reload } = useOrderRecovery(load, identity);
  return <><Text>{loading ? 'loading' : error || data?.status || 'empty'}</Text><TouchableOpacity onPress={reload}><Text>retry</Text></TouchableOpacity></>;
}
let foreground;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((name, cb) => { foreground = cb; return { remove: jest.fn() }; });
});
afterEach(() => jest.restoreAllMocks());

it.each(ACTIVE_WORKER_STATUSES)('restores %s after a fresh mount', async status => {
  apiClient.get.mockResolvedValue({ id: 'order-1', status });
  const first = render(<Harness />);
  await waitFor(() => expect(first.getByText(status)).toBeTruthy());
  first.unmount();
  const next = render(<Harness />);
  await waitFor(() => expect(next.getByText(status)).toBeTruthy());
  expect(apiClient.get).toHaveBeenCalledWith('/orders/worker/current');
});
it.each([null, '', { id: 'order-1', status: 'COMPLETED' }])('clears stale state on authoritative empty/terminal %j', async response => {
  apiClient.get.mockResolvedValueOnce({ id: 'order-1', status: 'IN_PROGRESS' }).mockResolvedValue(response);
  const ui = render(<Harness />);
  await waitFor(() => expect(ui.getByText('IN_PROGRESS')).toBeTruthy());
  await act(async () => foreground('active'));
  expect(ui.getByText('empty')).toBeTruthy();
});
it.each([401, 403, 404, 500])('hides previous data for HTTP %s and retries', async status => {
  apiClient.get.mockResolvedValueOnce({ id: 'order-1', status: 'ARRIVED' }).mockRejectedValueOnce(new Error(`HTTP ${status}`)).mockResolvedValue(null);
  const ui = render(<Harness />);
  await waitFor(() => expect(ui.getByText('ARRIVED')).toBeTruthy());
  await act(async () => foreground('active'));
  expect(ui.queryByText('ARRIVED')).toBeNull();
  expect(ui.getByText(`HTTP ${status}`)).toBeTruthy();
  fireEvent.press(ui.getByText('retry'));
  await waitFor(() => expect(ui.getByText('empty')).toBeTruthy());
});
it('refetches on reconnect without trusting event payload, and removes subscriptions', async () => {
  apiClient.get.mockResolvedValueOnce({ id: 'order-1', status: 'MATCHED' }).mockResolvedValue({ id: 'order-1', status: 'AWAITING_PAYMENT' });
  const ui = render(<Harness />);
  await waitFor(() => expect(ui.getByText('MATCHED')).toBeTruthy());
  const reconnect = socketService.on.mock.calls.find(([name]) => name === 'connect')[1];
  await act(async () => reconnect({ status: 'COMPLETED' }));
  expect(ui.getByText('AWAITING_PAYMENT')).toBeTruthy();
  ui.unmount();
  expect(socketService.off).toHaveBeenCalledWith('connect', reconnect);
});
it('ignores slow snapshots overtaken by a new request and after unmount', async () => {
  let resolveOld;
  apiClient.get.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValue(null);
  const ui = render(<Harness />);
  await act(async () => foreground('active'));
  expect(ui.getByText('empty')).toBeTruthy();
  await act(async () => resolveOld({ id: 'old', status: 'MATCHED' }));
  expect(ui.getByText('empty')).toBeTruthy();
  ui.unmount();
});
it('keeps GET /orders pagination envelope intact and fetches detail by escaped ID', async () => {
  const list = { data: [{ id: 'order-1', status: 'AWAITING_PAYMENT' }], pagination: { page: 1, totalPages: 1 } };
  apiClient.get.mockResolvedValueOnce(list).mockResolvedValueOnce(list.data[0]);
  expect(await orderService.getMyOrders({ page: 1, limit: 50 })).toEqual(list);
  expect(apiClient.get).toHaveBeenCalledWith('/orders', { params: { page: 1, limit: 50 } });
  expect(await orderService.getOrderById('order/1')).toEqual(list.data[0]);
  expect(apiClient.get).toHaveBeenCalledWith('/orders/order%2F1');
});
it.each([{}, { order: { id: 'order-1', status: 'MATCHED' } }])('rejects unexpected current response contract', async response => {
  apiClient.get.mockResolvedValue(response);
  await expect(orderService.getCurrentWorkerOrder()).rejects.toThrow('Dữ liệu đơn hàng không hợp lệ');
});
