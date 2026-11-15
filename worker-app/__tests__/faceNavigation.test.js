import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FaceScreen from '../app/(worker)/verification/face';
import { useFaceVerification } from '../src/features/face-verification';
let mockParams = {};
const mockReplace = jest.fn(), mockBack = jest.fn();
jest.mock('expo-router', () => ({ useNavigation: () => ({ getState: () => ({routes:[],index:0}) }), useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace, back: mockBack }) }));
jest.mock('../src/features/face-verification/components/LiveFaceCamera', () => ({ LiveFaceCamera: () => null }));
jest.mock('../src/features/face-verification', () => {
  const React = require('react'), { TouchableOpacity, Text } = require('react-native');
  return { useFaceVerification: jest.fn(), BiometricOvalFrame: () => null,
    VerificationResultModal: ({ onClose, successLabel }) => <TouchableOpacity onPress={onClose}><Text>{successLabel}</Text></TouchableOpacity> };
});
let flow;
beforeEach(() => {
  jest.clearAllMocks(); mockParams = {};
  flow = { status: { enrollmentStatus: 'ENROLLED' }, cancel: jest.fn(), takeSelfie: jest.fn(),
    result: { enrolled: true, verified: false }, showModal: true };
  useFaceVerification.mockReturnValue(flow);
});
it('AC-01 enrollment success returns home without a mandatory Daily scan', () => {
  const ui = render(<FaceScreen />);
  expect(useFaceVerification).toHaveBeenCalledWith(undefined, undefined, 'enrollment', { embeddedCamera: true });
  expect(flow.takeSelfie).not.toHaveBeenCalled();
  fireEvent.press(ui.getByText('Tiếp tục'));
  expect(mockReplace).toHaveBeenCalledWith('/(worker)/(tabs)');
  expect(mockReplace).not.toHaveBeenCalledWith(expect.objectContaining({ params: { mode: 'daily' } }));
});
it('Order proof success returns to the exact job, including a direct-link entry', () => {
  mockParams = { orderId: 'o' }; flow.result = { verified: true };
  const ui = render(<FaceScreen />);
  expect(useFaceVerification).toHaveBeenCalledWith('o', undefined, 'order', { embeddedCamera: true });
  fireEvent.press(ui.getByText('Về công việc'));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(worker)/job/[id]', params: { id: 'o' } });
});
it('Enrollment reached from an order preserves the job return context', () => {
  mockParams = { orderId: 'o', mode: 'enrollment' };
  const ui = render(<FaceScreen />); fireEvent.press(ui.getByText('Tiếp tục'));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(worker)/job/[id]', params: { id: 'o' } });
});
