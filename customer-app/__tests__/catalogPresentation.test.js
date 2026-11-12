jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
import React from 'react';
import { render } from '@testing-library/react-native';
import PopularServicesCarousel from '../src/features/home/components/PopularServicesCarousel';
import PriceEstimateScreen from '../src/features/services/screens/PriceEstimateScreen';
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));
jest.mock('../src/features/services/hooks/usePriceList', () => ({ usePriceList: () => ({
  tree: [], filteredTargets: [], expandedTargetIds: [], loading: false,
  refreshing: false, searchQuery: '',
}) }));
it('shows an empty service state instead of fake service cards', () => {
  const screen = render(<PopularServicesCarousel services={[]} onBookService={jest.fn()} />);
  expect(screen.getByText('Chưa có dữ liệu dịch vụ. Vui lòng tải lại.')).toBeTruthy();
});
it('does not display fabricated ratings when review data is absent', () => {
  const screen = render(<PopularServicesCarousel services={[{ id: 'real', name: 'Dịch vụ thật', basePrice: 0, unit: 'm', rating: 0, reviewsCount: 0 }]} onBookService={jest.fn()} />);
  expect(screen.getByText('Chưa có đánh giá')).toBeTruthy();
  expect(screen.queryByText('4.9')).toBeNull();
});
it('uses the live catalog view for the price estimate route', () => {
  const screen = render(<PriceEstimateScreen />);
  expect(screen.getByText('Bảng giá dịch vụ minh bạch')).toBeTruthy();
});
