/**
 * @file index.jsx
 * @description Route Entry Trang Chủ Khách Hàng (Customer Home Screen) cho FixGo Mobile.
 * Tái cấu trúc sạch sẽ theo Clean Architecture, ủy quyền toàn bộ cho component modular HomeScreen.
 */

import React from 'react';
import HomeScreen from '../../../src/features/home/screens/HomeScreen';

export default function UserHomeTabRoute() {
  return <HomeScreen />;
}
