import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DiagnosisChoices from './DiagnosisChoices';
import { diagnoseIssueImage } from '../../services/api/aiService';
jest.mock('../../services/api/aiService', () => ({ diagnoseIssueImage: jest.fn() }));
const result = { imageUrl: 'https://example.test/photo.jpg', suggestedCategoryId: 'cat-1',
  availableCategories: [{ id: 'cat-1', name: 'Điện lạnh' }],
  availableServices: [{ id: 'srv-1', name: 'Sửa máy lạnh chảy nước' }],
  questions: [{ id: 'symptom', label: 'Triệu chứng?', options: [{ value: 'ac_leak', label: 'Máy lạnh chảy nước' }] }] };
describe('DiagnosisChoices', () => {
  beforeEach(() => jest.clearAllMocks());
  it('sends confirmed symptoms with category and uploaded URL', async () => {
    const next = { status: 'suggested' };
    diagnoseIssueImage.mockResolvedValue(next);
    const onResult = jest.fn();
    const onReset = jest.fn();
    const screen = render(<DiagnosisChoices result={result} imageUrl="file://local.jpg" onResult={onResult} onReset={onReset} />);
    fireEvent.press(screen.getByText('Máy lạnh chảy nước'));
    expect(onReset).toHaveBeenCalled();
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(next));
    expect(diagnoseIssueImage).toHaveBeenCalledWith(result.imageUrl, '', { categoryId: 'cat-1', symptom: 'ac_leak' });
  });
  it('shows connection errors without inventing a result', async () => {
    diagnoseIssueImage.mockRejectedValue(new Error('Không thể kết nối'));
    const onResult = jest.fn();
    const screen = render(<DiagnosisChoices result={result} onResult={onResult} />);
    fireEvent.press(screen.getByText('Sửa máy lạnh chảy nước'));
    await waitFor(() => expect(screen.getByText('Không thể kết nối')).toBeTruthy());
    expect(onResult).not.toHaveBeenCalled();
  });
  it('changing category clears the previous service and symptom from answers', async () => {
    diagnoseIssueImage.mockResolvedValue({ status: 'needs_more_info' });
    const screen = render(<DiagnosisChoices result={result} onResult={jest.fn()} />);
    fireEvent.press(screen.getByText('Điện lạnh'));
    await waitFor(() => expect(diagnoseIssueImage).toHaveBeenCalledWith(result.imageUrl, '', { categoryId: 'cat-1' }));
  });
});
