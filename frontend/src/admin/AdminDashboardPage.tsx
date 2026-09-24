import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient.js';
import { Card } from '../components/Card.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ShoppingCart, Truck, Building2, Layers, CheckCircle2, Clock, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<any>('/admin/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading operations dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline overview for Nagpur managed deliveries.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg shadow-xs"
          >
            <span>View All Orders</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">New Quote Requests</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.newOrders ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Deliveries</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.activeDeliveries ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Completed Orders</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.completedOrders ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active MVP Materials</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary?.activeProductsCount ?? 4}</h3>
          </div>
        </div>
      </div>

      {/* Operations Quick Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Order Lifecycle Stages (PRD Compliant)" subtitle="All 11 state transitions are architected">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
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
            ].map((st) => (
              <div key={st} className="p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[11px] text-slate-700">
                {st}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Partner Registries" subtitle="Asset-light network management">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">Registered Suppliers (Quarries/Kilns):</span>
              <span className="font-bold text-slate-900">{summary?.registeredSuppliersCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">Partner Trucks / Drivers:</span>
              <span className="font-bold text-slate-900">{summary?.registeredTrucksCount ?? 0}</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              * In Phase 0, supply and logistics are managed by Admin without external app credentials.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
