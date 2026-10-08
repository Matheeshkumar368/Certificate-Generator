import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};
