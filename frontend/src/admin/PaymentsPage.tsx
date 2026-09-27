import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import { Payment } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { formatINR, formatDateTime } from '../utils/formatters.js';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getPayments(100, 0);
      setPayments(res.payments);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const totalCollected = payments.reduce((acc, p) => {
    if (p.payment_status === 'Refunded') return acc - p.amount;
    return acc + p.amount;
  }, 0);

  const completedCount = payments.filter((p) => p.payment_status === 'Paid').length;
  const partialCount = payments.filter((p) => p.payment_status === 'Partially Paid').length;
  const refundedCount = payments.filter((p) => p.payment_status === 'Refunded').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner message="Loading payments ledger..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Financial Ledger</h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical ledger of offline cash, UPI, bank transfers, and cheque payments recorded for orders.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Net Collected</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{formatINR(totalCollected)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Transactions</span>
            <span className="text-xl font-bold text-slate-900">{total}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Full Payments</span>
            <span className="text-xl font-bold text-slate-900">{completedCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Partials / Refunds</span>
            <span className="text-xl font-bold text-slate-900">
              {partialCount} / {refundedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            All Payment Transactions ({payments.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Recorded via human-assisted admin order management
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <th className="p-3.5 pl-4">Date & Time</th>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Txn Reference</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">No payment records yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Payments are recorded directly on confirmed customer orders in the Order Management screen.
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isRefund = p.payment_status === 'Refunded';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 pl-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDateTime(p.payment_date || p.created_at)}
                      </td>
                      <td className="p-3.5 font-mono">
                        <Link
                          to={`/admin/orders/${p.order_id}`}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {p.order_id.slice(0, 13)}...
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-full text-[11px]">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {p.transaction_reference || '—'}
                      </td>
                      <td className="p-3.5 font-mono font-bold whitespace-nowrap">
                        <span className={isRefund ? 'text-rose-600' : 'text-emerald-700'}>
                          {isRefund ? '-' : '+'}
                          {formatINR(p.amount)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.payment_status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.payment_status === 'Partially Paid'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isRefund
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.payment_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">
                        {p.notes || '—'}
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <Link
                          to={`/admin/orders/${p.order_id}`}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium text-[11px] transition"
                        >
                          View Order
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
