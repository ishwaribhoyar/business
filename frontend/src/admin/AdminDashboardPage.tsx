import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService.js';
import { DashboardSummary } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { Badge } from '../components/Badge.js';
import { formatINR, formatDate } from '../utils/formatters.js';
import {
  Clock,
  Truck,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Building2,
  Users,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getDashboardSummary()
      .then((data) => {
        setSummary(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading operational dashboard metrics..." />;
  }

  const marginPct =
    summary && summary.totalRevenue > 0
      ? Math.round((summary.grossMargin / summary.totalRevenue) * 1000) / 10
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Title & Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline & commercial performance metrics for Nagpur deliveries.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <span>Process Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Pipeline Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">New Requests</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.newOrders ?? 0}</h3>
            <span className="text-[11px] text-blue-600">Pending review</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Deliveries</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.activeDeliveries ?? 0}</h3>
            <span className="text-[11px] text-amber-600">Loading / In Transit</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Completed Orders</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.completedOrders ?? 0}</h3>
            <span className="text-[11px] text-emerald-600">Delivered & closed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Orders</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.totalOrders ?? 0}</h3>
            <span className="text-[11px] text-purple-600">Across all stages</span>
          </div>
        </div>
      </div>

      {/* Row 2: Real Commercial Financials (Direct Database Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Quoted Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-mono">
            {formatINR(summary?.totalRevenue ?? 0)}
          </h2>
          <p className="text-[11px] text-slate-400">Total customer value of confirmed and active orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Direct Fulfillment Costs</span>
            <Layers className="h-4 w-4 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-mono">
            {formatINR(summary?.totalDirectCosts ?? 0)}
          </h2>
          <p className="text-[11px] text-slate-400">Material + transport haulage + loading costs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Expected Gross Margin</span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-amber-700 font-mono">
              {formatINR(summary?.grossMargin ?? 0)}
            </h2>
            {summary && summary.totalRevenue > 0 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {marginPct}% margin
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Net operating margin before fixed overheads</p>
        </div>
      </div>

      {/* Row 3: Pipeline Stages Breakdown & Registries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Counts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Operational Delivery Pipeline</h2>
              <p className="text-xs text-slate-500">Live breakdown across all 11 lifecycle stages</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
              View queue →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {[
              'NEW',
              'CONTACTED',
              'QUOTATION_SENT',
              'CONFIRMED',
              'SUPPLIER_ASSIGNED',
              'TRUCK_ASSIGNED',
              'LOADING',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
              'COMPLETED',
              'CANCELLED',
            ].map((st) => {
              const count = summary?.ordersByStatus[st] || 0;
              return (
                <Link
                  key={st}
                  to={`/admin/orders?status=${st}`}
                  className="p-3 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-100 hover:border-amber-200 transition-all flex flex-col justify-between"
                >
                  <span className="text-[11px] font-mono text-slate-600 font-medium">{st}</span>
                  <span className="text-lg font-bold text-slate-900 mt-1">{count}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Partner Registries */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Asset-Light Network</h2>
            <p className="text-xs text-slate-500">Verified partners in Nagpur district</p>
          </div>

          <div className="space-y-3 text-xs">
            <Link
              to="/admin/suppliers"
              className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-slate-700">Suppliers (Quarries/Kilns)</span>
              </div>
              <span className="font-bold text-slate-900">{summary?.registeredSuppliersCount ?? 0}</span>
            </Link>

            <Link
              to="/admin/trucks"
              className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-slate-700">Third-Party Partner Trucks</span>
              </div>
              <span className="font-bold text-slate-900">{summary?.registeredTrucksCount ?? 0}</span>
            </Link>

            <Link
              to="/admin/trucks"
              className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Verified Drivers</span>
              </div>
              <span className="font-bold text-slate-900">{summary?.registeredDriversCount ?? 0}</span>
            </Link>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100">
            * Managed centrally by operations desk. Partners are assigned per delivery without self-service app accounts in MVP.
          </div>
        </div>
      </div>

      {/* Row 4: Recent Orders Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Customer Requests</h2>
            <p className="text-xs text-slate-500">Latest quote requests received via web & WhatsApp</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
            View all orders →
          </Link>
        </div>

        {summary?.recentOrders && summary.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Material & Qty</th>
                  <th className="py-3 px-4">Area / Pincode</th>
                  <th className="py-3 px-4">Preferred Delivery</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {ord.order_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold block">{ord.customer_name || 'Customer'}</span>
                      <span className="text-[11px] text-slate-400">{ord.customer_mobile || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">
                        {ord.quantity} {ord.unit} {ord.product_name || ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{ord.area_pincode}</td>
                    <td className="py-3.5 px-4">{formatDate(ord.preferred_delivery_date)}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={ord.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                      >
                        <span>Open Hub</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No orders recorded yet. Customer quote requests submitted on the website will appear here in real time.
          </div>
        )}
      </div>
    </div>
  );
};
