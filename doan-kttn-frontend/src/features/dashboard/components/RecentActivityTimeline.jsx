import React from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Briefcase,
  CheckCircle2,
  PackageCheck,
  Activity,
  Clock,
  XCircle,
} from 'lucide-react';
import { TimelineSkeleton, DashboardEmptyState } from './DashboardStates';

/**
 * Hàm định dạng thời gian tương đối
 * @param {string} createdAt
 * @param {string} [fallbackTime]
 */
function formatRelativeTime(createdAt, fallbackTime) {
  if (fallbackTime) return fallbackTime;
  if (!createdAt) return 'Vừa xong';
  const diff = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

/**
 * RecentActivityTimeline Component
 * Dòng thời gian hiển thị các sự kiện phát sinh theo thời gian thực.
 * Tích hợp Framer Motion whileHover={{ x: 4 }} cho từng bản ghi.
 * Tuyệt đối không sử dụng CSS inline.
 *
 * @param {import('../../../types/dashboard').RecentActivityTimelineProps} props
 */
export default function RecentActivityTimeline({ activities = [], isLoading = false }) {
  const getEventBadge = (type) => {
    switch (type) {
      case 'WORKER_REGISTER':
        return {
          icon: Briefcase,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          border: 'border-amber-200/80 dark:border-amber-800/60',
        };
      case 'WORKER_APPROVED':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          border: 'border-emerald-200/80 dark:border-emerald-800/60',
        };
      case 'ORDER_COMPLETED':
        return {
          icon: PackageCheck,
          color: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-950/60',
          border: 'border-purple-200/80 dark:border-purple-800/60',
        };
      case 'ORDER_CANCELLED':
        return {
          icon: XCircle,
          color: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/60',
          border: 'border-rose-200/80 dark:border-rose-800/60',
        };
      case 'ORDER_IN_PROGRESS':
      case 'ORDER_ASSIGNED':
      case 'ORDER_CREATED':
        return {
          icon: Clock,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/60',
          border: 'border-blue-200/80 dark:border-blue-800/60',
        };
      case 'CUSTOMER_NEW':
        return {
          icon: UserPlus,
          color: 'text-cyan-600 dark:text-cyan-400',
          bg: 'bg-cyan-50 dark:bg-cyan-950/60',
          border: 'border-cyan-200/80 dark:border-cyan-800/60',
        };
      default:
        return {
          icon: Activity,
          color: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-50 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
        };
    }
  };

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (!activities || activities.length === 0) {
    return (
      <DashboardEmptyState
        title="Chưa có hoạt động mới"
        description="Các sự kiện đơn hàng và đăng ký thợ sẽ xuất hiện tại đây theo thời gian thực."
        icon={Activity}
      />
    );
  }

  return (
    <div className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar py-1">
      {/* Trục đường kẻ kết nối thẳng đứng (Vertical Timeline Line) */}
      <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200 dark:bg-slate-800 pointer-events-none" />

      <div className="space-y-1">
        {activities.map((act) => {
          const badge = getEventBadge(act.type);
          const Icon = badge.icon;
          const displayTime = formatRelativeTime(act.createdAt, act.time);

          return (
            <motion.div
              key={act.id}
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="group relative flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 cursor-default"
            >
              {/* Event Icon Indicator */}
              <div
                className={`relative z-10 w-7 h-7 rounded-lg flex items-center justify-center border ${badge.bg} ${badge.border} ${badge.color} shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {act.title}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                    {displayTime}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  {act.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
