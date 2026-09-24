import React from 'react';
import { OrderStatus } from '../types/index.js';

export interface BadgeProps {
  status: OrderStatus | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const getStyle = (val: string) => {
    switch (val) {
      case 'NEW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONTACTED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'QUOTATION_SENT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CONFIRMED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SUPPLIER_ASSIGNED':
      case 'TRUCK_ASSIGNED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'LOADING':
      case 'OUT_FOR_DELIVERY':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
      case 'DELIVERED':
      case 'COMPLETED':
      case 'Paid':
      case 'Available':
      case 'VERIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
      case 'REJECTED':
      case 'Refunded':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Pending':
      case 'Busy':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Offline':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyle(
        status
      )} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};
