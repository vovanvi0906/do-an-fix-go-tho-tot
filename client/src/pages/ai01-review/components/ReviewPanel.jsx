import React from 'react';
import Skeleton from '../../../components/ui/Skeleton';
export const fieldClass = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-slate-100';
export const buttonClass = 'rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40';
export function ReviewPanel({title,children}) { return <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 space-y-3"><h2 className="font-semibold">{title}</h2>{children}</section>; }
export function Field({label,children}) { const generated=React.useId(),id=children.props.id||generated;return <div className="space-y-1 text-sm"><label className="block" htmlFor={id}>{label}</label>{React.cloneElement(children,{id})}</div>; }
export function LoadingReview() { return <div aria-label="Đang tải review" className="space-y-4">{[1,2,3].map(n=><Skeleton key={n} className="h-24 rounded-xl" />)}</div>; }
