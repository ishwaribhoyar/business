import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-3" />
      <p className="text-xs text-slate-500 font-medium">{message}</p>
    </div>
  );
};
