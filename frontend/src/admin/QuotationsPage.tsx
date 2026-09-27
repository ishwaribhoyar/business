import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import { Order } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { formatINR, formatDateTime } from '../utils/formatters.js';
import {
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Layers,
  Percent,
} from 'lucide-react';

export const QuotationsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getOrders({ limit: 50, sort_by: 'created_at', sort_order: 'DESC' })
      .then((res) => setOrders(res.orders))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const pendingQuotes = orders.filter((o) => o.status === 'NEW' || o.status === 'CONTACTED');
  const activeQuotes = orders.filter((o) => o.status === 'QUOTATION_SENT' || o.status === 'CONFIRMED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manual quotation snapshots, pricing transparency, and gross margin control for Nagpur orders.
        </p>
      </div>

      {/* Logic & Policy Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Percent className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Deterministic Math
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Zero automated algorithmic pricing. Admin inputs real material, transport, and loading rates. The backend validates and freezes immutable snapshots.
          </p>
          <div className="pt-2 font-mono text-[11px] text-slate-600 border-t border-slate-100">
            Base = Material + Transport + Loading
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Immutable Revision Trail
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Quotations are never overwritten. Negotiating revisions increments version numbers (<code className="font-mono">v1</code>, <code className="font-mono">v2</code>) and flags prior snapshots as superseded.
          </p>
          <div className="pt-2 font-mono text-[11px] text-slate-600 border-t border-slate-100">
            Delivered Price = Base + Fee - Discount
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Guaranteed Gross Margin
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Platform margin is calculated in real time against direct supplier and transport costs before dispatching the final offer to the customer.
          </p>
          <div className="pt-2 font-mono text-[11px] text-emerald-600 font-bold border-t border-slate-100">
            Margin = Delivered Price - Direct Costs
          </div>
        </div>
      </div>

      {/* Orders In Quotation Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Orders In Quotation Pipeline
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            {pendingQuotes.length} pending quote / {activeQuotes.length} sent
          </span>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner message="Loading quotation pipeline..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="p-3.5 pl-4">Order ID</th>
                  <th className="p-3.5">Customer & Delivery Location</th>
                  <th className="p-3.5">Material & Quantity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Quoted Final Price</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 20).map((ord) => {
                    const isPending = ord.status === 'NEW' || ord.status === 'CONTACTED';
                    const hasActiveQuote = ord.current_quotation_id != null;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">
                          <Link
                            to={`/admin/orders/${ord.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {ord.id.slice(0, 13)}...
                          </Link>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{ord.delivery_address}</div>
                          <div className="text-[11px] text-slate-400">Order Ref: {ord.id.slice(-8)}</div>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700">
                          {ord.quantity} {ord.unit}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : ord.status === 'QUOTATION_SENT'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : ord.status === 'CONFIRMED'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {ord.quoted_price ? formatINR(ord.quoted_price) : (ord.current_quotation_id ? 'Quotation Linked' : 'Awaiting Quote')}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                          {formatDateTime(ord.created_at)}
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <Link
                            to={`/admin/orders/${ord.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 rounded-lg text-slate-700 font-semibold text-[11px] transition"
                          >
                            {isPending && !hasActiveQuote ? 'Generate Quote' : 'View / Revise'}
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
        )}
      </div>
    </div>
  );
};
