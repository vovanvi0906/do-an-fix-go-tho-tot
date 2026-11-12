/**
 * @file EmptyState.tsx
 * @description Component trạng thái rỗng (Empty State) phong cách Linear/Vercel tinh gọn.
 */

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Component `EmptyState` hiển thị khi danh mục hoặc kết quả lọc không có dữ liệu
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100 active:scale-95 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
