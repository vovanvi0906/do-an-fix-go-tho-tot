import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import FaceReviewPanel from './FaceReviewPanel';
import { faceReviewService } from '../services/faceReviewService';
vi.mock('../services/faceReviewService', () => ({ faceReviewService: { pending: vi.fn(), approve: vi.fn(), reject: vi.fn() } }));
beforeEach(() => { cleanup(); vi.clearAllMocks(); faceReviewService.pending.mockResolvedValue({ request: { id: 'request-1', kind: 'REENROLLMENT', submittedAt: new Date().toISOString() } }); });
describe('FaceID admin review', () => {
  it('requires explicit identity review and sends evidence bound to the pending request', async () => {
    faceReviewService.approve.mockResolvedValue({ id: 'review-1' });
    render(<FaceReviewPanel workerId="worker-1" />);
    await screen.findByText(/Yêu cầu cấp lại mẫu/);
    const approve = screen.getByRole('button', { name: 'Ghi nhận đã kiểm tra' });
    expect(approve.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Mã bằng chứng kiểm tra'), { target: { value: 'review:unit' } });
    fireEvent.change(screen.getByLabelText('SHA-256 của bằng chứng'), { target: { value: 'a'.repeat(64) } });
    fireEvent.change(screen.getByLabelText('Ghi chú kiểm tra FaceID'), { target: { value: 'Identity checked in synthetic test' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.submit(approve.closest('form'));
    await waitFor(() => expect(faceReviewService.approve).toHaveBeenCalledWith('worker-1', expect.objectContaining({ requestId: 'request-1', kind: 'REENROLLMENT', reviewedIdentity: true, evidenceDigest: 'a'.repeat(64) })));
    await screen.findByText(/Đã ghi nhận kiểm tra danh tính/);
  });
  it('an API failure is visible and never fabricates a pending request or approval', async () => {
    faceReviewService.pending.mockRejectedValue(new Error('offline'));
    render(<FaceReviewPanel workerId="worker-1" />);
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Ghi nhận đã kiểm tra' })).toBeNull();
    expect(faceReviewService.approve).not.toHaveBeenCalled();
  });
});
