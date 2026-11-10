import { diagnoseIssueImage } from './aiService';
import { apiClient } from './apiClient';
jest.mock('./apiClient', () => ({ apiClient: { post: jest.fn() } }));
const post = apiClient.post;
describe('AI mobile adapter', () => {
  beforeEach(() => jest.clearAllMocks());
  it('preserves zero score and empty category instead of substituting defaults', async () => {
    post.mockResolvedValue({ status: 'manual_selection', confidence: 0,
      suggestedCategoryId: null, suggestedServiceId: null });
    const result = await diagnoseIssueImage('https://example.test/photo.jpg');
    expect(result.confidence).toBe(0);
    expect(result.suggestedCategoryId).toBeNull();
    expect(result.suggestedServiceId).toBeNull();
  });
  it('keeps unavailable results without adding confidence or prices', async () => {
    post.mockResolvedValue({ status: 'unavailable', confidence: null, estimatedPriceMin: null });
    const result = await diagnoseIssueImage('https://example.test/photo.jpg');
    expect(result.confidence).toBeNull();
    expect(result.estimatedPriceRange).toBeUndefined();
  });
  it('propagates connection errors instead of creating an electrical diagnosis', async () => {
    post.mockRejectedValue(new Error('offline'));
    await expect(diagnoseIssueImage('https://example.test/photo.jpg')).rejects.toThrow('offline');
  });
  it('rejects responses from an incompatible backend', async () => {
    post.mockResolvedValue({ confidence: 0.93 });
    await expect(diagnoseIssueImage('https://example.test/photo.jpg')).rejects.toThrow();
  });
  it('sends structured answers to the backend', async () => {
    post.mockResolvedValue({ status: 'needs_more_info' });
    const answers = { categoryId: 'cat-1', symptom: 'ac_leak' };
    await diagnoseIssueImage('https://example.test/photo.jpg', 'Chảy nước', answers);
    expect(post).toHaveBeenCalledWith('/orders/diagnose', {
      imageUrl: 'https://example.test/photo.jpg', description: 'Chảy nước', answers,
    }, { timeout: 30000 });
  });
});
