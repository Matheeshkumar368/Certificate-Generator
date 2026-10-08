import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  total: number;
  current: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total,
  current,
  label = 'Generating certificates...'
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-slate-700">{label}</span>
        <span className="text-indigo-600 font-semibold tabular-nums">{clampedProgress}%</span>
      </div>

      {/* Progress track */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 rounded-full transition-all duration-300 ease-out shadow-xs"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
        <span>{current} of {total} certificates generated</span>
        <span>{total - current} remaining</span>
      </div>
    </div>
  );
};
