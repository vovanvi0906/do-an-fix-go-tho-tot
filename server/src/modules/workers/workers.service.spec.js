import { WorkersService } from './workers.service';

describe('Worker one-scan availability and legacy check-in', () => {
  let prisma, ai, service, worker;
  beforeEach(() => {
    worker = { id: 'w1', userId: 'u1', faceProfile: { facePhotoUrl: 'reference' },
      faceVerifiedAt: new Date(), user: { status: 'ACTIVE' }, approvalStatus: 'APPROVED', workerServices: [{}] };
    prisma = { workerProfile: { findUnique: jest.fn(async () => worker), update: jest.fn(async ({ data }) => data) } };
    ai = { confidenceThreshold: 0.6, verifyFace: jest.fn(async () => ({ verified: true, confidence: 0.9 })) };
    service = new WorkersService(prisma, {}, ai);
  });
  it('AC-03 permits online without a Daily proof or legacy timestamp', async () => {
    worker.faceVerifiedAt = null;
    await expect(service.updateAvailability('u1', { isOnline: true, lat: 10.8, lng: 106.7 })).resolves.toMatchObject({ isOnline: true });
  });
  it('permits going offline without a Daily proof', async () => {
    await expect(service.updateAvailability('u1', { isOnline: false })).resolves.toMatchObject({ isOnline: false });
  });
  it.each([
    ['GPS', () => {}, { isOnline: true }],
    ['active', () => { worker.user.status = 'BLOCKED'; }, { isOnline: true, lat: 10, lng: 106 }],
    ['approved', () => { worker.approvalStatus = 'PENDING'; }, { isOnline: true, lat: 10, lng: 106 }],
    ['services', () => { worker.workerServices = []; }, { isOnline: true, lat: 10, lng: 106 }],
  ])('AC-03 retains %s gate', async (_name, change, input) => {
    change();
    await expect(service.updateAvailability('u1', input)).rejects.toThrow();
    expect(prisma.workerProfile.update).not.toHaveBeenCalled();
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
