import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  variant: 'blue' | 'emerald' | 'purple' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  variant,
}) => {
  const variantStyles = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100 text-blue-600',
      badge: 'border-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100 text-emerald-600',
      badge: 'border-emerald-100',
    },
    purple: {
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-100 text-indigo-600',
      badge: 'border-indigo-100',
    },
    rose: {
      bg: 'bg-rose-50',
      iconBg: 'bg-rose-100 text-rose-600',
      badge: 'border-rose-100',
    },
  }[variant];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums font-mono">
            {value}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};
