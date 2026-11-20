import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorVariant?: 'indigo' | 'emerald' | 'amber' | 'blue';
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorVariant = 'indigo',
}: StatsCardProps) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
  };

  return (
    <Card className="hover:border-slate-300 transition-all shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border',
              colorMap[colorVariant].bg
            )}
          >
            {icon}
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.isPositive ? '+' : '-'}
              {trend.value}%
            </span>
          )}
        </div>

        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
