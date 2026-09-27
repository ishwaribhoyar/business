import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminService, OrderListParams } from '../services/adminService.js';
import { Order } from '../types/index.js';
import { Badge } from '../components/Badge.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { EmptyState } from '../components/EmptyState.js';
import { formatDate } from '../utils/formatters.js';
import { Search, Filter, RotateCcw, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const fetchOrders = () => {
    setLoading(true);
    const params: OrderListParams = {
      limit,
      offset: (page - 1) * limit,
      status: selectedStatus || undefined,
      payment_status: selectedPaymentStatus || undefined,
      search: search.trim() || undefined,
    };

    adminService
      .getOrders(params)
      .then((res) => {
        setOrders(res.orders);
        setTotal(res.total);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, selectedPaymentStatus, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedPaymentStatus('');
    setPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders & Quote Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Operational queue across the 11-stage delivery lifecycle ({total} total records).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Reference ID, Customer Name, Mobile (e.g. 9823...), or Delivery Area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
                if (e.target.value) {
                  setSearchParams({ status: e.target.value });
                } else {
                  setSearchParams({});
                }
              }}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
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

            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Refunded">Refunded</option>
            </select>

            <button
              type="submit"
              className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition-colors shadow-xs"
            >
              Filter
            </button>

            {(search || selectedStatus || selectedPaymentStatus) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner message="Loading orders queue..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Orders Match Your Filters"
          description="Try adjusting your search terms or clearing the status filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Material / Quantity</th>
                  <th className="py-3.5 px-4">Delivery Site</th>
                  <th className="py-3.5 px-4">Preferred Date</th>
                  <th className="py-3.5 px-4">Delivery Stage</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {ord.order_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold block">{ord.customer_name || 'Customer'}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{ord.customer_mobile || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900">
                        {ord.quantity} {ord.unit}
                      </span>
                      <span className="text-[11px] text-slate-500 block">{ord.product_name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 block truncate max-w-xs">
                        {ord.delivery_address}
                      </span>
                      <span className="text-[11px] text-slate-400">Pincode: {ord.area_pincode}</span>
                    </td>
                    <td className="py-3.5 px-4">{formatDate(ord.preferred_delivery_date)}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={ord.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          ord.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : ord.payment_status === 'Partially Paid'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : ord.payment_status === 'Refunded'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {ord.payment_status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                      >
                        <span>Manage</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} orders total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
