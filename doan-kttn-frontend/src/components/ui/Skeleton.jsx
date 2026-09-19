import React from 'react';

/**
 * Skeleton Component (Linear / Vercel Style)
 * Thành phần hiển thị khung chờ mượt mà, viền mỏng, tối giản.
 * Tuyệt đối không dùng spinner tròn gây rối mắt.
 *
 * @param {Object} props
 * @param {string} [props.className] - Các class Tailwind CSS bổ sung (chiều rộng, cao, bo góc)
 */
export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-700/40 ${className}`}
      {...props}
    />
  );
}
