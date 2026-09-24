import React, { useEffect, useState } from 'react';
import { orderService } from '../services/orderService.js';
import { Order } from '../types/index.js';
import { Badge } from '../components/Badge.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { EmptyState } from '../components/EmptyState.js';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    orderService
      .getOrders(selectedStatus || undefined)
      .then((res) => setOrders(res.orders))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders & Quote Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and process orders across the 11-stage delivery lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Lifecycle Stages</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUOTATION_SENT">QUOTATION_SENT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SUPPLIER_ASSIGNED">SUPPLIER_ASSIGNED</option>
            <option value="TRUCK_ASSIGNED">TRUCK_ASSIGNED</option>
            <option value="LOADING">LOADING</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          description="Customer quotation requests submitted through the public website will appear here for operational processing."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Delivery Area</th>
                  <th className="py-3 px-4">Quantity / Unit</th>
                  <th className="py-3 px-4">Preferred Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.order_reference}</td>
                    <td className="py-3 px-4">{ord.area_pincode}</td>
                    <td className="py-3 px-4 font-semibold">{ord.quantity} {ord.unit}</td>
                    <td className="py-3 px-4">{ord.preferred_delivery_date}</td>
                    <td className="py-3 px-4">
                      <Badge status={ord.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
