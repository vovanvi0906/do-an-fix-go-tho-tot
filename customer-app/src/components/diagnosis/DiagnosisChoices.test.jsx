import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import DiagnosisChoices from './DiagnosisChoices';
import { diagnoseIssueImage } from '../../services/api/aiService';
import { catalogService } from '../../services/api/catalogService';
jest.mock('../../services/api/aiService', () => ({ diagnoseIssueImage: jest.fn() }));
jest.mock('../../services/api/catalogService', () => ({ catalogService: { getCategories: jest.fn(), getServicesPage: jest.fn() } }));
const result = { imageUrl: 'https://example.test/photo.jpg', suggestedCategoryId: 'cat-1',
  target: { id: 'fridge', name: 'Tủ lạnh' }, suggestedTargetId: 'fridge', suggestedTargetName: 'Tủ lạnh',
  availableCategories: [{ id: 'cat-1', name: 'Điện lạnh' }, { id: 'cat-2', name: 'Điện' }],
  availableTargets: [{ id: 'fridge', name: 'Tủ lạnh', categoryId: 'cat-1' }],
  questions: [{ id: 'symptom', label: 'Triệu chứng?', options: [{ value: 'fridge_weak', label: 'Tủ lạnh không lạnh' }] }] };
describe('DiagnosisChoices V3', () => {
  beforeEach(() => { jest.clearAllMocks(); catalogService.getCategories.mockResolvedValue([]); catalogService.getServicesPage.mockResolvedValue({ items: [], hasMore: false }); });
  it('sends confirmed symptom with canonical category and target', async () => {
    const next = { status: 'suggested' }; diagnoseIssueImage.mockResolvedValue(next);
    const onResult = jest.fn(); const onReset = jest.fn();
    const screen = render(<DiagnosisChoices result={result} imageUrl="file://photo.jpg" onResult={onResult} onReset={onReset} />);
    fireEvent.press(screen.getByText('Tủ lạnh không lạnh'));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(next));
    expect(onReset).toHaveBeenCalled();
    expect(diagnoseIssueImage).toHaveBeenCalledWith(result.imageUrl, '', { categoryId: 'cat-1', targetId: 'fridge', symptom: 'fridge_weak' });
  });
  it('retry preserves the failed answer and never invents a result', async () => {
    diagnoseIssueImage.mockRejectedValueOnce(new Error('Mất mạng')).mockResolvedValueOnce({ status: 'suggested' });
    const screen = render(<DiagnosisChoices result={result} onResult={jest.fn()} />);
    fireEvent.press(screen.getByText('Tủ lạnh không lạnh'));
    await waitFor(() => expect(screen.getByText('Mất mạng')).toBeTruthy());
    fireEvent.press(screen.getByText('Thử lại'));
    await waitFor(() => expect(diagnoseIssueImage).toHaveBeenCalledTimes(2));
    expect(diagnoseIssueImage.mock.calls[1][2]).toEqual(diagnoseIssueImage.mock.calls[0][2]);
  });
  it('changing category clears dependent IDs', async () => {
    diagnoseIssueImage.mockResolvedValue({ status: 'needs_more_info' });
    const screen = render(<DiagnosisChoices result={result} onResult={jest.fn()} />);
    fireEvent.press(screen.getByText('Đổi / chọn danh mục')); fireEvent.press(screen.getByText('Điện'));
    await waitFor(() => expect(diagnoseIssueImage).toHaveBeenCalledWith(result.imageUrl, '', { categoryId: 'cat-2' }));
  });
  it('ignores an old image response and blocks synchronous double taps', async () => {
    let finish; diagnoseIssueImage.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const onResult = jest.fn(); const screen = render(<DiagnosisChoices result={result} imageUrl="file://old.jpg" onResult={onResult} />);
    fireEvent.press(screen.getByText('Tủ lạnh không lạnh')); fireEvent.press(screen.getByText('Tủ lạnh không lạnh'));
    expect(diagnoseIssueImage).toHaveBeenCalledTimes(1);
    screen.rerender(<DiagnosisChoices result={{ ...result, imageUrl: 'https://example.test/new.jpg' }} imageUrl="file://new.jpg" onResult={onResult} />);
    await act(async () => finish({ status: 'suggested' })); expect(onResult).not.toHaveBeenCalled();
  });
  it('does not expose symptoms or services until target confirmation', () => {
    const screen = render(<DiagnosisChoices result={{ ...result, target: null }} onResult={jest.fn()} />);
    expect(screen.queryByText('Tủ lạnh không lạnh')).toBeNull();
  });
});

it('uses catalog symptom IDs, preserves them for recommended service validation, and clears them on target/category change', async () => {
  const catalog = { ...result, symptomCatalogEnabled: true, selectedSymptomIds: ['sym-frost'],
    questions: [{ id: 'symptomId', label: 'Triệu chứng?', options: [{ value: 'sym-frost', label: 'Đóng tuyết' }] }],
    suggestedServices: [{ id: 'service-frost', name: 'Sửa ngăn mát đóng tuyết', targetId: 'fridge', basePrice: 180000 }] };
  diagnoseIssueImage.mockResolvedValue({ status: 'needs_more_info' });
  const screen = render(<DiagnosisChoices result={catalog} onResult={jest.fn()} />);
  fireEvent.press(screen.getByText('Đóng tuyết'));
  await waitFor(() => expect(diagnoseIssueImage).toHaveBeenLastCalledWith(result.imageUrl, '', { categoryId: 'cat-1', targetId: 'fridge', symptomId: 'sym-frost' }));
  await waitFor(() => expect(screen.queryByTestId('diagnosis-choices-loading')).toBeNull());
  fireEvent.press(screen.getByText('Sửa ngăn mát đóng tuyết'));
  await waitFor(() => expect(diagnoseIssueImage).toHaveBeenLastCalledWith(result.imageUrl, '', { categoryId: 'cat-1', targetId: 'fridge', symptomIds: ['sym-frost'], serviceId: 'service-frost' }));
  fireEvent.press(screen.getByText('Đổi / chọn danh mục')); fireEvent.press(screen.getByText('Điện'));
  await waitFor(() => expect(diagnoseIssueImage).toHaveBeenLastCalledWith(result.imageUrl, '', { categoryId: 'cat-2' }));
});

it('offers manual selection when the confirmed target has no approved symptoms', () => {
  const screen = render(<DiagnosisChoices result={{ ...result, symptomCatalogEnabled: true, questions: [] }} onResult={jest.fn()} />);
  expect(screen.getByText('Chưa có triệu chứng được duyệt cho thiết bị này. Bạn có thể chọn dịch vụ thủ công.')).toBeTruthy();
  expect(screen.getByText('Không biết lỗi gì / Chọn dịch vụ thủ công')).toBeTruthy();
});
