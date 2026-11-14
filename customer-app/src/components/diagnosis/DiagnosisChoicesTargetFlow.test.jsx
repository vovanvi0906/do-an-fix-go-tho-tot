import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DiagnosisChoices from './DiagnosisChoices';
import { diagnoseIssueImage } from '../../services/api/aiService';

jest.mock('../../services/api/aiService', () => ({
  diagnoseIssueImage: jest.fn(),
}));

jest.mock('../../services/api/catalogService', () => ({ catalogService: { getCategories: jest.fn().mockResolvedValue([]), getServicesPage: jest.fn().mockResolvedValue([]) } }));

const mockResultWithTarget = {
  imageUrl: 'https://example.test/switch.jpg',
  suggestedCategoryId: 'cat-elec',
  suggestedTargetId: 'tgt-switch',
  suggestedTargetName: 'Công tắc điện',
  target: { id: 'tgt-switch', name: 'Công tắc điện' },
  confidence: 0.85,
  targetCandidates: [
    { targetId: 'tgt-switch', targetName: 'Công tắc điện', targetCategory: 'sua-dien', confidence: 0.85 },
  ],
  availableCategories: [{ id: 'cat-elec', name: 'Sửa điện' }],
  availableTargets: [
    { id: 'tgt-switch', name: 'Công tắc điện' },
    { id: 'tgt-outlet', name: 'Ổ cắm điện' },
  ],
  availableServices: [
    { id: 'srv-switch-fix', targetId: 'tgt-switch', name: 'Sửa công tắc không hoạt động', basePrice: 100000, unit: 'điểm' },
  ],
  suggestedServices: [
    { id: 'srv-switch-fix', targetId: 'tgt-switch', name: 'Sửa công tắc không hoạt động', basePrice: 100000, unit: 'điểm', reason: 'Khớp triệu chứng' },
  ],
  questions: [
    {
      id: 'symptom',
      label: 'Công tắc đang gặp tình trạng nào?',
      options: [{ value: 'switch_broken', label: 'Không hoạt động' }],
    },
  ],
};

describe('DiagnosisChoices Target and Flow Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('confirms detected target when user clicks "Đúng thiết bị này"', async () => {
    diagnoseIssueImage.mockResolvedValue({ status: 'needs_more_info', suggestedCategoryId: 'cat-elec' });
    const onResult = jest.fn();
    const screen = render(
      <DiagnosisChoices result={mockResultWithTarget} imageUrl="file://photo.jpg" onResult={onResult} />
    );

    fireEvent.press(screen.getByText('Đúng thiết bị này'));
    await waitFor(() =>
      expect(diagnoseIssueImage).toHaveBeenCalledWith(
        mockResultWithTarget.imageUrl,
        '',
        { categoryId: 'cat-elec', targetId: 'tgt-switch' }
      )
    );
  });

  it('allows user to change target via "Không đúng thiết bị"', async () => {
    diagnoseIssueImage.mockResolvedValue({ status: 'needs_more_info', suggestedCategoryId: 'cat-elec' });
    const screen = render(
      <DiagnosisChoices result={mockResultWithTarget} imageUrl="file://photo.jpg" onResult={jest.fn()} />
    );

    fireEvent.press(screen.getByText('Không đúng thiết bị'));
    await waitFor(() => expect(screen.getByText('Ổ cắm điện')).toBeTruthy());

    fireEvent.press(screen.getByText('Ổ cắm điện'));
    await waitFor(() =>
      expect(diagnoseIssueImage).toHaveBeenCalledWith(
        mockResultWithTarget.imageUrl,
        '',
        { categoryId: 'cat-elec', targetId: 'tgt-outlet' }
      )
    );
  });

  it('selects suggested service and includes targetId in answers', async () => {
    diagnoseIssueImage.mockResolvedValue({ status: 'suggested', suggestedServiceId: 'srv-switch-fix' });
    const screen = render(
      <DiagnosisChoices result={mockResultWithTarget} imageUrl="file://photo.jpg" onResult={jest.fn()} />
    );

    fireEvent.press(screen.getByText('Sửa công tắc không hoạt động'));
    await waitFor(() =>
      expect(diagnoseIssueImage).toHaveBeenCalledWith(
        mockResultWithTarget.imageUrl,
        '',
        { categoryId: 'cat-elec', targetId: 'tgt-switch', serviceId: 'srv-switch-fix' }
      )
    );
  });
});
