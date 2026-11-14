import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Stack: Object.assign(({ children }) => children, { Screen: () => null }),
}));
jest.mock('../src/services/storage/tokenStorage', () => ({
  tokenStorage: {
    getToken: jest.fn(),
    getUser: jest.fn(),
    saveToken: jest.fn(),
    saveUser: jest.fn(),
    clearAll: jest.fn(),
  },
}));

import { AuthProvider } from '../src/features/auth/context/AuthContext';
import { authService } from '../src/features/auth/services/authService';
import UserLayout from '../app/(user)/_layout';
import WorkerLayout from '../app/(worker)/_layout';

describe('AUTH-CUS-01: Role Guard & Route Access Control', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockReplace.mockClear();
  });

  it('AC-02 & AC-06: Redirects unauthenticated deep links to login screen', async () => {
    jest.spyOn(authService, 'getCurrentSession').mockResolvedValueOnce({
      token: null,
      user: null,
    });

    render(
      <AuthProvider>
        <UserLayout />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('AC-02 & AC-06: Blocks WORKER session from accessing customer area', async () => {
    jest.spyOn(authService, 'getCurrentSession').mockResolvedValueOnce({
      token: 'worker-token',
      user: { id: 'w-1', role: 'WORKER' },
    });

    render(
      <AuthProvider>
        <UserLayout />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('AC-02: Blocks ADMIN session from accessing customer area', async () => {
    jest.spyOn(authService, 'getCurrentSession').mockResolvedValueOnce({
      token: 'admin-token',
      user: { id: 'a-1', role: 'ADMIN' },
    });

    render(
      <AuthProvider>
        <UserLayout />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('AC-01: Allows valid CUSTOMER session to access customer area', async () => {
    jest.spyOn(authService, 'getCurrentSession').mockResolvedValueOnce({
      token: 'customer-token',
      user: { id: 'c-1', role: 'CUSTOMER' },
    });

    render(
      <AuthProvider>
        <UserLayout />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('AC-02: Worker layout in customer app automatically redirects to login', async () => {
    render(<WorkerLayout />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });
});
