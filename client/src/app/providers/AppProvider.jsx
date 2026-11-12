import React from 'react';
import { AuthProvider } from '../../store/authStore';
import { ThemeProvider } from '../../store/themeStore';

export default function AppProvider({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
