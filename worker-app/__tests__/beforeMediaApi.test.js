import { orderService } from '../src/services/api/orderService';
import { apiClient } from '../src/services/api/apiClient';
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { post: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());
it('AC-07 sends camera bytes via multipart then saves the storage URL with the existing JSON contract', async () => {
  const signal = new AbortController().signal;
  apiClient.post.mockResolvedValueOnce({ data: { url: 'https://storage.invalid/photo.jpg' } });
  const uploaded = await orderService.uploadBeforeMedia('order/id', 'file:///camera.jpg', signal);
  expect(apiClient.post).toHaveBeenCalledWith('/orders/order%2Fid/before-media', expect.any(FormData),
    { signal, timeout: 30000, headers: { 'Content-Type': 'multipart/form-data' } });
  await orderService.uploadImage('o', { type: 'BEFORE', url: uploaded.data.url }, signal);
  expect(apiClient.post).toHaveBeenLastCalledWith('/orders/o/images', { type: 'BEFORE', url: uploaded.data.url }, { signal });
});
it('does not reinterpret an arbitrary remote URL as a local camera capture', async () => {
  await expect(orderService.uploadBeforeMedia('o', 'https://untrusted.invalid/photo.jpg')).rejects.toThrow('LOCAL_CAPTURE_REQUIRED');
  expect(apiClient.post).not.toHaveBeenCalled();
});
