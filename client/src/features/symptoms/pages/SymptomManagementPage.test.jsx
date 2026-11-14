import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SymptomManagementPage from './SymptomManagementPage';
import { symptomsService } from '../services/symptomsService';
import { mappingPayload, mappingWarnings } from '../constants/symptoms';
vi.mock('../services/symptomsService', () => ({ symptomsService: { categories: vi.fn(), targets: vi.fn(), services: vi.fn(), list: vi.fn(), save: vi.fn(), map: vi.fn(), unmap: vi.fn(), preview: vi.fn() } }));
const service = { id: 'srv', targetId: 'fridge', categoryId: 'cold', name: 'Sửa ngăn mát đóng tuyết', isActive: true, basePrice: 180000 };
const symptom = { id: 'sym', targetId: 'fridge', target: { categoryId: 'cold' }, name: 'Đóng tuyết', code: 'frost_buildup', kind: 'VISUAL_OBSERVABLE', aliases: [], reviewStatus: 'APPROVED', isActive: true, mappings: [], warnings: ['NO_ACTIVE_MAPPING'] };
async function chooseTarget() {
  await waitFor(() => expect(screen.getByText('Điện lạnh')).toBeTruthy());
  fireEvent.change(screen.getByLabelText('Danh mục'), { target: { value: 'cold' } });
  await waitFor(() => expect(screen.getByText('Tủ lạnh')).toBeTruthy());
  fireEvent.change(screen.getByLabelText('Đối tượng'), { target: { value: 'fridge' } });
  await waitFor(() => expect(screen.getByText('Đóng tuyết')).toBeTruthy());
}
beforeEach(() => {
  vi.clearAllMocks();
  symptomsService.categories.mockResolvedValue([{ id: 'cold', name: 'Điện lạnh' }]);
  symptomsService.targets.mockResolvedValue([{ id: 'fridge', name: 'Tủ lạnh', isActive: true }, { id: 'washer', name: 'Máy giặt', isActive: true }]);
  symptomsService.services.mockResolvedValue({ data: [service], pagination: { totalPages: 1 } });
  symptomsService.list.mockResolvedValue({ items: [symptom], total: 1, hasMore: false });
  symptomsService.save.mockResolvedValue(symptom); symptomsService.map.mockResolvedValue({}); symptomsService.preview.mockResolvedValue({ items: [service] });
});
afterEach(cleanup);
describe('Admin symptom hierarchy', () => {
  it('creates an inactive review draft scoped to the selected target', async () => {
    render(<SymptomManagementPage />); await chooseTarget();
    fireEvent.click(screen.getByText('Tạo triệu chứng'));
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'frost_test' } });
    fireEvent.change(screen.getByLabelText('Tên triệu chứng'), { target: { value: 'Tuyết bám bất thường' } });
    fireEvent.click(screen.getByText('Lưu triệu chứng'));
    await waitFor(() => expect(symptomsService.save).toHaveBeenCalledWith(undefined, expect.objectContaining({ targetId: 'fridge', code: 'frost_test', reviewStatus: 'NEEDS_REVIEW', isActive: false })));
  });
  it('maps a service, changes priority, previews top-3 and archives the symptom', async () => {
    render(<SymptomManagementPage />); await chooseTarget(); fireEvent.click(screen.getByText('Quản lý mapping'));
    fireEvent.change(screen.getByLabelText(`Priority ${service.name}`), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText(`Duyệt ${service.name}`), { target: { value: 'APPROVED' } });
    fireEvent.click(screen.getByLabelText('Active'));
    fireEvent.click(screen.getByText('Liên kết'));
    await waitFor(() => expect(symptomsService.map).toHaveBeenCalledWith('sym', 'srv', expect.objectContaining({ priority: 40, isActive: true, reviewStatus: 'APPROVED' })));
    await waitFor(() => expect(screen.getByText('Xem trước top-3 gợi ý').disabled).toBe(false));
    fireEvent.click(screen.getByText('Xem trước top-3 gợi ý'));
    await waitFor(() => expect(symptomsService.preview).toHaveBeenCalledWith('fridge', 'sym'));
    fireEvent.click(screen.getByText('Vô hiệu hóa'));
    await waitFor(() => expect(symptomsService.save).toHaveBeenCalledWith('sym', { isActive: false }));
  });
  it('blocks inactive and cross-target service mapping and enforces approval in UI helpers', () => {
    expect(mappingWarnings(symptom, { ...service, targetId: 'washer' })).toMatch(/Sai đối tượng/);
    expect(mappingWarnings(symptom, { ...service, isActive: false })).toMatch(/inactive/);
    expect(() => mappingPayload({ priority: 1, reviewStatus: 'NEEDS_REVIEW', isActive: true })).toThrow();
  });
  it('clears selected mapping/preview when changing target and reports backend errors', async () => {
    render(<SymptomManagementPage />); await chooseTarget(); fireEvent.click(screen.getByText('Quản lý mapping'));
    expect(screen.getByText('Xem trước top-3 gợi ý')).toBeTruthy();
    symptomsService.list.mockRejectedValueOnce(new Error('Chưa migrate triệu chứng'));
    fireEvent.change(screen.getByLabelText('Đối tượng'), { target: { value: 'washer' } });
    expect(screen.queryByText('Xem trước top-3 gợi ý')).toBeNull();
    expect(screen.queryByText('Đóng tuyết')).toBeNull();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Chưa migrate/));
  });
});
