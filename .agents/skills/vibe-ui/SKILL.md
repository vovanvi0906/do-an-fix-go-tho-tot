---
name: vibe-ui
description: Hướng dẫn thiết kế giao diện cao cấp phong cách Linear/Vercel (Glassmorphism, Skeleton, Ambient Glow).
---

# ✨ Hướng Dẫn Thiết Kế UI Phong Cách Linear/Vercel (Vibe Code)

## 1. Màu Sắc & Nền
- **Dark Mode Background:** `#090A0F` hoặc `bg-slate-950/90`.
- **Card Background:** `bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-slate-700`.
- **Accent Glow:** Hiệu ứng hào quang nền sử dụng `radial-gradient` với màu xanh ngọc (`emerald`) hoặc tím ánh kim (`indigo/violet`).

## 2. Skeleton Loading Pattern
Tuyệt đối không dùng spinner xoay đơn điệu. Sử dụng Skeleton mô phỏng chính xác layout:
```jsx
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-800/40 animate-pulse rounded-lg border border-slate-800/50" />
      ))}
    </div>
  );
}
```

## 3. Empty State Component
```jsx
export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
      <div className="p-3 bg-slate-800/60 rounded-full text-slate-400 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mt-1 mb-5">{description}</p>
      {actionText && (
        <button onClick={onAction} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all">
          {actionText}
        </button>
      )}
    </div>
  );
}
```
