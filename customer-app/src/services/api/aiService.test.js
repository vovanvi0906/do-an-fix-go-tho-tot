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


describe('AI upload failures and multipart contract', () => {
  const originalFormData = global.FormData;
  beforeAll(() => { global.FormData = require('react-native/Libraries/Network/FormData'); });
  afterAll(() => { global.FormData = originalFormData; });
  beforeEach(() => jest.clearAllMocks());
  it.each(['', '/tmp/photo.jpg', 'file://', 'content://', 'ph://photo'])('rejects unsupported URI %s before network', async uri => {
    await expect(diagnoseIssueImage(uri)).rejects.toMatchObject({ code: 'IMAGE_URI_INVALID' });
    expect(post).not.toHaveBeenCalled();
  });
  it.each(['file:///cache/photo.png', 'content://media/external/images/12'])('uploads native URI %s without fetch(blob)', async uri => {
    post.mockResolvedValue({ status: 'needs_more_info' });
    await diagnoseIssueImage(uri, 'mô tả', { categoryId: 'cat' });
    const [url, form, options] = post.mock.calls[0];
    expect(url).toBe('/orders/diagnose-upload');
    expect(form.getParts()).toEqual(expect.arrayContaining([
      expect.objectContaining({ fieldName: 'image', uri }),
      expect.objectContaining({ fieldName: 'description', string: 'mô tả' }),
      expect.objectContaining({ fieldName: 'answers', string: JSON.stringify({ categoryId: 'cat' }) }),
    ]));
    expect(options.timeout).toBe(45000);
  });
  it.each([400, 409, 422, 500, 503])('preserves HTTP %s from upload', async status => {
    post.mockRejectedValue(Object.assign(new Error('server failure'), { status }));
    await expect(diagnoseIssueImage('file:///cache/photo.jpg')).rejects.toMatchObject({ status });
  });
  it('preserves bounded timeout error', async () => {
    post.mockRejectedValue(Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }));
    await expect(diagnoseIssueImage('file:///cache/photo.jpg')).rejects.toMatchObject({ code: 'ECONNABORTED' });
  });
  it('keeps AI unavailable without fabricated suggestion', async () => {
    post.mockResolvedValue({ status: 'unavailable', suggestedServiceId: null });
    expect((await diagnoseIssueImage('file:///cache/photo.jpg')).suggestedServiceId).toBeNull();
  });
});
