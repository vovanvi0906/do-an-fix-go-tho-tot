import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { FaceLoginPrompt } from '../src/features/face-verification/components/FaceLoginPrompt';
import { faceIdentityService } from '../src/features/face-verification/services/faceIdentityService';
let mockIdentity='u1', mockPath='/', mockEpoch=1;
const mockPush=jest.fn();
jest.mock('expo-router',()=>({useRouter:()=>({push:mockPush}),usePathname:()=>mockPath}));
jest.mock('../src/features/auth',()=>({useAuth:()=>({user:{id:mockIdentity},token:'synthetic-token'})}));
jest.mock('../src/features/auth/services/sessionEpoch',()=>({sessionEpoch:{current:()=>mockEpoch}}));
jest.mock('../src/features/face-verification/services/faceIdentityService',()=>({faceIdentityService:{profile:jest.fn(),status:jest.fn()}}));
beforeEach(()=>{jest.clearAllMocks();mockIdentity='u1';mockPath='/';mockEpoch=1;faceIdentityService.profile.mockResolvedValue({approvalStatus:'APPROVED'});faceIdentityService.status.mockResolvedValue({enrollmentStatus:'PENDING_REVIEW',canEnroll:true});});
it('offers first enrollment after login and later stays dismissed for same session',async()=>{
  const ui=render(<FaceLoginPrompt/>);
  await waitFor(()=>expect(ui.getByText('Chưa đăng ký khuôn mặt')).toBeTruthy());
  fireEvent.press(ui.getByText('Để sau, vào ứng dụng'));
  expect(ui.queryByText('Chưa đăng ký khuôn mặt')).toBeNull();
  ui.rerender(<FaceLoginPrompt/>);
  expect(faceIdentityService.status).toHaveBeenCalledTimes(1);
});
it('opens enrollment explicitly, never starts camera on login',async()=>{
  const ui=render(<FaceLoginPrompt/>);
  await waitFor(()=>expect(ui.getByText('Đăng ký khuôn mặt')).toBeTruthy());
  expect(mockPush).not.toHaveBeenCalled();
  fireEvent.press(ui.getByText('Đăng ký khuôn mặt'));
  expect(mockPush).toHaveBeenCalledWith({pathname:'/(worker)/verification/face',params:{mode:'enrollment'}});
});
it('does not prompt enrolled workers when no Daily proof exists',async()=>{
  const now=Date.now();faceIdentityService.status.mockResolvedValue({enrollmentStatus:'ENROLLED',dailyProof:null});
  const ui=render(<FaceLoginPrompt/>);
  await waitFor(()=>expect(faceIdentityService.status).toHaveBeenCalled());
  expect(ui.queryByText('Để sau, vào ứng dụng')).toBeNull();
});
it('direct profile navigation and unavailable API do not trap user in a modal',async()=>{
  mockPath='/profile';const ui=render(<FaceLoginPrompt/>);
  await waitFor(()=>expect(faceIdentityService.status).toHaveBeenCalled());
  expect(ui.queryByText('Để sau, vào ứng dụng')).toBeNull();
});
