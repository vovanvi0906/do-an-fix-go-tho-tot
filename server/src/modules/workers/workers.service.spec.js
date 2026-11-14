import { WorkersService } from './workers.service';

describe('Worker daily check-in and availability', () => {
  let prisma, ai, service, worker;
  beforeEach(() => {
    worker = { id: 'w1', userId: 'u1', faceProfile: { facePhotoUrl: 'reference' },
      faceVerifiedAt: new Date(), user: { status: 'ACTIVE' }, approvalStatus: 'APPROVED', workerServices: [{}] };
    prisma = { workerProfile: { findUnique: jest.fn(async () => worker), update: jest.fn(async ({ data }) => data) } };
    ai = { confidenceThreshold: 0.6, verifyFace: jest.fn(async () => ({ verified: true, confidence: 0.9 })) };
    service = new WorkersService(prisma, {}, ai);
  });
  it('rejects legacy timestamp for online access', async () => {
    await expect(service.updateAvailability('u1', { isOnline: true, lat: 10.8, lng: 106.7 })).rejects.toThrow('khuôn mặt');
    expect(prisma.workerProfile.update).not.toHaveBeenCalled();
  });
  it('requires a fresh check-in but always permits going offline', async () => {
    worker.faceVerifiedAt = new Date(Date.now() - 86400001);
    await expect(service.updateAvailability('u1', { isOnline: true, lat: 10, lng: 106 })).rejects.toThrow('khuôn mặt');
    await expect(service.updateAvailability('u1', { isOnline: false })).resolves.toMatchObject({ isOnline: false });
  });
  it('does not grant check-in when AI fails', async () => {
    ai.verifyFace.mockResolvedValue({ verified: false, confidence: 0 });
    await expect(service.verifyFaceDaily('u1', 'selfie')).rejects.toThrow('Chưa xác thực');
    expect(prisma.workerProfile.update).not.toHaveBeenCalled();
  });
  it('compares reference without fallback but never grants from legacy response', async () => {
    await expect(service.verifyFaceDaily('u1', 'selfie')).rejects.toThrow('Chưa xác thực');
    expect(ai.verifyFace).toHaveBeenCalledWith('w1', 'selfie', 'reference', { allowFallback: false });
  });
});
