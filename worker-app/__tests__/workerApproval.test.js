import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { WorkerApprovalForm } from '../src/features/auth/components/WorkerApprovalForm';
import { apiClient } from '../src/services/api/apiClient';
import { catalogService } from '../src/services/api/catalogService';
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { patch: jest.fn(), put: jest.fn(), post: jest.fn() } }));
jest.mock('../src/services/api/catalogService', () => ({ catalogService: { getServices: jest.fn() } }));
beforeEach(() => {
  jest.clearAllMocks();
  catalogService.getServices.mockResolvedValue([{ id: 'svc-1', name: 'Điện', isActive: true }]);
});
it('persists fields and selected service IDs before submitting, then reloads approval', async () => {
  let finish;
  apiClient.post.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const reload = jest.fn();
  const ui = render(<WorkerApprovalForm profile={{ fullName: 'Thợ', idCardNumber: '012345678901' }} onSaved={reload} />);
  await waitFor(() => expect(ui.getByRole('checkbox')).toBeTruthy());
  fireEvent.press(ui.getByRole('checkbox'));
  fireEvent.press(ui.getByText('Lưu và nộp duyệt'));
  await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/workers/me/submit-approval'));
  expect(apiClient.patch).toHaveBeenCalledWith('/workers/me', { fullName: 'Thợ', idCardNumber: '012345678901' });
  expect(apiClient.put).toHaveBeenCalledWith('/workers/me/services', { serviceIds: ['svc-1'] });
  expect(reload).not.toHaveBeenCalled();
  fireEvent.press(ui.getByText('Đang nộp hồ sơ…'));
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  await act(async () => finish({ approvalStatus: 'PENDING' }));
  expect(reload).toHaveBeenCalledTimes(1);
});
it('failed service save never submits approval or invents APPROVED', async () => {
  apiClient.put.mockRejectedValueOnce(new Error('Dịch vụ không hợp lệ'));
  const reload = jest.fn();
  const ui = render(<WorkerApprovalForm profile={{ fullName: 'Thợ', idCardNumber: '012345678901' }} onSaved={reload} />);
  await waitFor(() => expect(ui.getByRole('checkbox')).toBeTruthy());
  fireEvent.press(ui.getByRole('checkbox'));
  fireEvent.press(ui.getByText('Lưu và nộp duyệt'));
  await waitFor(() => expect(ui.getByText('Dịch vụ không hợp lệ')).toBeTruthy());
  expect(apiClient.post).not.toHaveBeenCalled();
  expect(reload).not.toHaveBeenCalled();
});
