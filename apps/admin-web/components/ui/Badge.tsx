import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  withDot?: boolean;
}

export function Badge({
  className,
  variant = 'neutral',
  withDot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    danger: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
    },
    neutral: {
      bg: 'bg-slate-100 border-slate-200 text-slate-700',
      text: 'text-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        style.bg,
        className
      )}
      {...props}
    >
      {withDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      )}
      {children}
    </span>
  );
}

// Helper mapper for common status values in attendance system
export function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  if (['active', 'present', 'verified', 'connected'].includes(lower)) {
    return <Badge variant="success" withDot>{status}</Badge>;
  }
  if (['expired', 'absent', 'inactive', 'failed', 'cancelled'].includes(lower)) {
    return <Badge variant="danger" withDot>{status}</Badge>;
  }
  if (['pending', 'low_battery', 'late', 'warning'].includes(lower)) {
    return <Badge variant="warning" withDot>{status.replace('_', ' ')}</Badge>;
  }
  if (['beacon', 'info', 'teacher_phone', 'completed'].includes(lower)) {
    return <Badge variant="info">{status.replace('_', ' ')}</Badge>;
  }
  return <Badge variant="neutral">{status}</Badge>;
}
