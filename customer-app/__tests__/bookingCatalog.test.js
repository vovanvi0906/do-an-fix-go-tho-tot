jest.mock('../src/services/storage/orderStorage', () => ({ orderStorage: {} }));
import { renderHook, waitFor } from '@testing-library/react-native';
import { useBooking } from '../src/features/booking/hooks/useBooking';
import { apiClient } from '../src/services/api/apiClient';
import { bookingService } from '../src/features/booking/services/bookingService';
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { get: jest.fn() } }));
jest.mock('../src/features/booking/services/bookingService', () => ({ bookingService: { getAvailableServices: jest.fn() } }));
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied' })) }));
jest.mock('../src/services/socket/socketService', () => ({ socketService: { connect: jest.fn(), on: jest.fn(), off: jest.fn() } }));
it('resolves real service price/unit and loads only its target', async () => {
  const service = { id: 'svc', categoryId: 'cat', targetId: 'target', basePrice: 0, unit: 'm²' };
  apiClient.get.mockResolvedValue(service);
  bookingService.getAvailableServices.mockResolvedValue([service]);
  const { result } = renderHook(() => useBooking(null, { serviceId: 'svc' }));
  await waitFor(() => expect(result.current.selectedService).toEqual(service));
  expect(bookingService.getAvailableServices).toHaveBeenCalledWith('cat', 'target');
});
it('does not request the entire service catalog without context', async () => {
  jest.clearAllMocks();
  renderHook(() => useBooking());
  expect(bookingService.getAvailableServices).not.toHaveBeenCalled();
});
