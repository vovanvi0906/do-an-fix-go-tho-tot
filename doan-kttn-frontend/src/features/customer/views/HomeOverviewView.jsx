import React from 'react';
import CustomerPortalHome from '../components/CustomerPortalHome';

/**
 * HomeOverviewView Component
 * View tổng quan trang chủ Cổng Khách Hàng (Customer Portal)
 * Tích hợp toàn diện CustomerPortalHome component chuẩn Linear/Vercel với số liệu thời gian thực.
 *
 * @param {Object} props
 * @param {Function} [props.onOrderCreated]
 * @param {Function} [props.setActiveTab]
 */
export default function HomeOverviewView({ onOrderCreated, setActiveTab }) {
  return (
    <CustomerPortalHome
      onOrderCreated={onOrderCreated}
      setActiveTab={setActiveTab}
    />
  );
}
