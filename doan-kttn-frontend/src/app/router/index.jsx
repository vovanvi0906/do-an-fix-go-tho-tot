import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '../../routers/routes';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
