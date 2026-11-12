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
  it('persists actual GPS when going online', async () => {
    await service.updateAvailability('u1', { isOnline: true, lat: 10.8, lng: 106.7 });
    expect(prisma.workerProfile.update).toHaveBeenCalledWith({ where: { id: 'w1' }, data: { isOnline: true, currentLat: 10.8, currentLng: 106.7 } });
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
  it('checks against registered face without fallback before granting 24h access', async () => {
    await expect(service.verifyFaceDaily('u1', 'selfie')).resolves.toHaveProperty('faceVerifiedAt');
    expect(ai.verifyFace).toHaveBeenCalledWith('w1', 'selfie', 'reference', { allowFallback: false });
  });
});
