import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService, ManualQuotationPayload, RecordPaymentPayload } from '../services/adminService.js';
import { OrderDetailData, Supplier, Truck, Driver, OrderStatus } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { Badge } from '../components/Badge.js';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters.js';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Truck as TruckIcon,
  Building2,
  DollarSign,
  TrendingUp,
  FileText,
  MapPin,
  Calendar,
  User,
  Plus,
  RotateCcw,
  XCircle,
  ExternalLink,
  Info,
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Available partner registries for assignment
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Quotation form state
  const [quoteForm, setQuoteForm] = useState<ManualQuotationPayload>({
    material_cost: 0,
    transport_cost: 0,
    loading_cost: 0,
    platform_fee: 0,
    discount: 0,
    validity_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: '',
    advance_order_status: true,
  });
  const [isQuoting, setIsQuoting] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  // Fulfillment assignment state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [autoAssignDriver, setAutoAssignDriver] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [fulfillmentWarning, setFulfillmentWarning] = useState<string | null>(null);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState<RecordPaymentPayload>({
    amount: 0,
    payment_method: 'UPI',
    transaction_reference: '',
    notes: '',
  });
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Note form state
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'quotation' | 'fulfillment' | 'payments' | 'notes' | 'timeline'>('quotation');

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      adminService.getOrderDetail(id),
      adminService.getSuppliers(),
      adminService.getTrucks(),
      adminService.getDrivers(),
    ])
      .then(([orderData, supList, trkList, drvList]) => {
        setData(orderData);
        setSuppliers(supList);
        setTrucks(trkList);
        setDrivers(drvList);

        if (orderData.order.supplier_id) setSelectedSupplierId(orderData.order.supplier_id);
        if (orderData.order.truck_id) setSelectedTruckId(orderData.order.truck_id);
        if (orderData.order.driver_id) setSelectedDriverId(orderData.order.driver_id);

        // Prepopulate quote form if active quote exists
        if (orderData.activeQuotation) {
          setQuoteForm({
            material_cost: orderData.activeQuotation.material_cost,
            transport_cost: orderData.activeQuotation.transport_cost,
            loading_cost: orderData.activeQuotation.loading_cost,
            platform_fee: orderData.activeQuotation.platform_fee,
            discount: orderData.activeQuotation.discount,
            validity_date: orderData.activeQuotation.validity_date,
            notes: orderData.activeQuotation.notes || '',
            advance_order_status: false,
          });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading order hub & operational details..." />;
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Could not locate operational order record.'}</p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold bg-amber-600 text-white px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  const { order, customer, product, activeQuotation, quotations, supplier, truck, driver, payments, paymentSummary, statusHistory, notes } = data;

  // Live preview arithmetic
  const previewBaseCost =
    Number(quoteForm.material_cost || 0) +
    Number(quoteForm.transport_cost || 0) +
    Number(quoteForm.loading_cost || 0);
  const previewFinalPrice =
    previewBaseCost + Number(quoteForm.platform_fee || 0) - Number(quoteForm.discount || 0);
  const previewGrossMargin = previewFinalPrice - previewBaseCost;
  const previewMarginPct =
    previewFinalPrice > 0 ? Math.round((previewGrossMargin / previewFinalPrice) * 1000) / 10 : 0;

  // Status transitions
  const handleTransition = async (nextStatus: OrderStatus, notesText?: string) => {
    try {
      setError(null);
      await adminService.updateOrderStatus(order.id, nextStatus, undefined, notesText);
      setActionSuccess(`Order status updated to ${nextStatus}.`);
      loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status transition failed');
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      await adminService.updateOrderStatus(order.id, 'CANCELLED', cancelReason.trim());
      setShowCancelModal(false);
      setActionSuccess('Order has been cancelled.');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuoting(true);
    setError(null);
    try {
      const res = await adminService.createQuotation(order.id, quoteForm);
      setShowQuoteForm(false);
      setActionSuccess(`Quotation ${res.quotation.quotation_reference} issued successfully.`);
      loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quotation creation failed');
    } finally {
      setIsQuoting(false);
    }
  };

  const handleAssignSupplier = async () => {
    if (!selectedSupplierId) return;
    try {
      await adminService.assignSupplier(order.id, selectedSupplierId);
      setActionSuccess('Supplier assigned successfully.');
      loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign supplier');
    }
  };

  const handleAssignTruck = async () => {
    if (!selectedTruckId) return;
    try {
      const res = await adminService.assignTruck(order.id, selectedTruckId, autoAssignDriver);
      if (res.warnings && res.warnings.length > 0) {
        setFulfillmentWarning(res.warnings.join(' '));
      } else {
        setFulfillmentWarning(null);
      }
      setActionSuccess('Truck assigned successfully.');
      loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign truck');
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) return;
    try {
      const res = await adminService.assignDriver(order.id, selectedDriverId);
      if (res.warnings && res.warnings.length > 0) {
        setFulfillmentWarning(res.warnings.join(' '));
      }
      setActionSuccess('Driver assigned successfully.');
      loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign driver');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecordingPayment(true);
    setError(null);
    try {
      await adminService.recordPayment(order.id, {
        ...paymentForm,
        amount: Number(paymentForm.amount),
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: 0, payment_method: 'UPI', transaction_reference: '', notes: '' });
      setActionSuccess('Payment recorded successfully.');
      loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment recording failed');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setIsAddingNote(true);
    try {
      await adminService.addOrderNote(order.id, noteText.trim());
      setNoteText('');
      setActionSuccess('Note added.');
      loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  const waCustomerPrefill = encodeURIComponent(
    `Hello ${customer?.full_name || 'Customer'}, regarding your building material quote request (${order.order_reference}) for ${order.quantity} ${order.unit} ${product?.name || ''}...`
  );

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Notification Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/admin" className="hover:text-slate-800">Dashboard</Link>
          <span>/</span>
          <Link to="/admin/orders" className="hover:text-slate-800">Orders</Link>
          <span>/</span>
          <span className="font-mono font-bold text-slate-900">{order.order_reference}</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">×</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">×</button>
        </div>
      )}

      {/* Main Order Header Hub */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {order.order_reference}
              </h1>
              <Badge status={order.status} />
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                  order.payment_status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : order.payment_status === 'Partially Paid'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {order.payment_status || 'Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Received on {formatDateTime(order.created_at)} | Preferred Site Delivery: <strong>{formatDate(order.preferred_delivery_date)}</strong>
            </p>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {customer && (
              <>
                <a
                  href={`tel:${customer.mobile_number}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-slate-600" />
                  <span>Call {customer.mobile_number}</span>
                </a>
                <a
                  href={`https://wa.me/91${customer.whatsapp_number?.replace(/\D/g, '') || customer.mobile_number}?text=${waCustomerPrefill}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>WhatsApp Customer</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Operational Workflow Action Bar */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Current Stage: <span className="text-slate-900">{order.status}</span>
            </span>
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>

          {/* Contextual Next Stage Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {order.status === 'NEW' && (
              <button
                type="button"
                onClick={() => handleTransition('CONTACTED', 'Contacted customer regarding requirements')}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                1. Mark Customer Contacted →
              </button>
            )}

            {(order.status === 'NEW' || order.status === 'CONTACTED') && (
              <button
                type="button"
                onClick={() => {
                  setShowQuoteForm(true);
                  setActiveTab('quotation');
                }}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                2. Calculate & Issue Quotation →
              </button>
            )}

            {order.status === 'QUOTATION_SENT' && (
              <>
                <button
                  type="button"
                  onClick={() => handleTransition('CONFIRMED', 'Customer confirmed quotation via WhatsApp')}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
                >
                  ✓ Mark Customer Confirmed →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuoteForm(true);
                    setActiveTab('quotation');
                  }}
                  className="text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-white px-3 py-2 rounded-xl transition-colors"
                >
                  Revise Quotation (New Snapshot)
                </button>
              </>
            )}

            {order.status === 'CONFIRMED' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('fulfillment');
                  if (order.supplier_id) {
                    handleTransition('SUPPLIER_ASSIGNED', 'Supplier confirmed for delivery');
                  }
                }}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                Assign Supplier & Logistics →
              </button>
            )}

            {order.status === 'SUPPLIER_ASSIGNED' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('fulfillment');
                  if (order.truck_id) {
                    handleTransition('TRUCK_ASSIGNED', 'Truck assigned for dispatch');
                  }
                }}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                Confirm Truck & Driver →
              </button>
            )}

            {order.status === 'TRUCK_ASSIGNED' && (
              <button
                type="button"
                onClick={() => handleTransition('LOADING', 'Truck arrived at quarry weighbridge for loading')}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                Confirm Weighbridge Loading →
              </button>
            )}

            {order.status === 'LOADING' && (
              <button
                type="button"
                onClick={() => handleTransition('OUT_FOR_DELIVERY', 'Truck dispatched and en route to site')}
                className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                Mark Out for Delivery (Truck In Transit) →
              </button>
            )}

            {order.status === 'OUT_FOR_DELIVERY' && (
              <button
                type="button"
                onClick={() => handleTransition('DELIVERED', 'Material unloaded and accepted at customer site')}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                Confirm Site Unloading & Delivered →
              </button>
            )}

            {order.status === 'DELIVERED' && (
              <button
                type="button"
                onClick={() => handleTransition('COMPLETED', 'Order reconciled and closed')}
                className="text-xs font-bold bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                Mark Order Completed (Final Closure) ✓
              </button>
            )}

            {order.status === 'COMPLETED' && (
              <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                This order has completed fulfillment and is closed.
              </span>
            )}

            {order.status === 'CANCELLED' && (
              <span className="text-xs text-red-700 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Order Cancelled: {order.cancellation_reason}
              </span>
            )}
          </div>
        </div>

        {/* Request Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Material & Quantity */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Material Requested
            </span>
            <div className="text-base font-bold text-slate-900">
              {order.quantity} {order.unit} of {product?.name || 'Material'}
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              {product?.typical_use_cases || 'Standard regional construction application.'}
            </p>
          </div>

          {/* Delivery Site Details */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Delivery Site (Nagpur)
            </span>
            <div className="text-xs font-semibold text-slate-900 leading-relaxed">
              {order.delivery_address}
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Pincode: {order.area_pincode}</span>
              {customer?.map_pin_url && (
                <a
                  href={customer.map_pin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" /> Map Link
                </a>
              )}
            </div>
          </div>

          {/* Customer & Notes */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Customer Contact
            </span>
            <div className="text-xs font-semibold text-slate-900">
              {customer?.full_name || 'Customer'}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Primary: {customer?.mobile_number || '—'}
            </div>
            {order.additional_notes && (
              <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                Site Note: {order.additional_notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('quotation')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'quotation'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Quotation Engine {activeQuotation ? `(₹${activeQuotation.final_delivered_price.toLocaleString('en-IN')})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('fulfillment')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'fulfillment'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Fulfillment Logistics {order.supplier_id && order.truck_id ? '✓' : ''}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Payment Ledger ({paymentSummary.paymentStatus})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          4. Operational Notes ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          5. Audit & History ({statusHistory.length})
        </button>
      </div>

      {/* TAB 1: Quotation Engine */}
      {activeTab === 'quotation' && (
        <div className="space-y-6">
          {activeQuotation && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">
                      Active Quotation Snapshot v{activeQuotation.version}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Ref: {activeQuotation.quotation_reference}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Issued on {formatDateTime(activeQuotation.created_at)} | Valid until: <strong>{formatDate(activeQuotation.validity_date)}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQuoteForm(!showQuoteForm)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl border border-amber-200 transition-colors"
                >
                  {showQuoteForm ? 'Hide Revision Form' : '+ Issue Revised Quotation (v' + (activeQuotation.version + 1) + ')'}
                </button>
              </div>

              {/* Cost & Price Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 block">Material Cost</span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                    {formatINR(activeQuotation.material_cost)}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 block">Transport Cost</span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                    {formatINR(activeQuotation.transport_cost)}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 block">Loading / Direct</span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                    {formatINR(activeQuotation.loading_cost)}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 block">Platform Margin / Fee</span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                    {formatINR(activeQuotation.platform_fee)}
                  </span>
                  {activeQuotation.discount > 0 && (
                    <span className="text-[11px] text-red-600 block mt-0.5">
                      Discount: -{formatINR(activeQuotation.discount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Total & Expected Margin Summary */}
              <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-amber-800 font-medium block">Delivered Customer Price</span>
                  <span className="text-3xl font-extrabold text-amber-900 font-mono mt-0.5 block">
                    {formatINR(activeQuotation.final_delivered_price)}
                  </span>
                  <span className="text-[11px] text-amber-700">All-inclusive delivered site quotation</span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-600 font-medium block">Expected Gross Margin</span>
                  <span className="text-2xl font-bold text-emerald-700 font-mono mt-0.5 block">
                    {formatINR(activeQuotation.estimated_gross_margin)}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    Net Margin: {Math.round((activeQuotation.estimated_gross_margin / activeQuotation.final_delivered_price) * 1000) / 10}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quotation Calculator / Revision Form */}
          {(showQuoteForm || !activeQuotation) && (
            <form
              onSubmit={handleQuoteSubmit}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {activeQuotation ? `Issue Revised Quotation (Version ${activeQuotation.version + 1})` : 'Manual Quotation Engine'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter supplier purchase cost, vehicle haulage, and platform margin. Pricing is deterministically calculated.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Material Cost (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={quoteForm.material_cost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, material_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Direct supplier/quarry purchase price</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transport Haulage Cost (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={quoteForm.transport_cost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, transport_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Truck haulage to delivery plot</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loading / Direct Costs (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quoteForm.loading_cost}
                    onChange={(e) => setQuoteForm({ ...quoteForm, loading_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Labour loading, weighing fees</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform Margin / Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quoteForm.platform_fee}
                    onChange={(e) => setQuoteForm({ ...quoteForm, platform_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Operating markup & coordination fee</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quoteForm.discount}
                    onChange={(e) => setQuoteForm({ ...quoteForm, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Promotional or volume concession</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quote Validity Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={quoteForm.validity_date}
                    onChange={(e) => setQuoteForm({ ...quoteForm, validity_date: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Deterministic Live Calculation Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Direct Cost Base:</span>
                  <span className="text-base font-bold text-slate-800 font-mono">{formatINR(previewBaseCost)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Final Delivered Price:</span>
                  <span className="text-xl font-extrabold text-amber-700 font-mono">{formatINR(previewFinalPrice)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Gross Margin:</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {formatINR(previewGrossMargin)} ({previewMarginPct}%)
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {activeQuotation && (
                  <button
                    type="button"
                    onClick={() => setShowQuoteForm(false)}
                    className="text-xs font-semibold px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isQuoting}
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isQuoting ? 'Persisting Snapshot...' : 'Save & Issue Quotation Snapshot'}
                </button>
              </div>
            </form>
          )}

          {/* Quotations Revision History */}
          {quotations.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Quotation Snapshot History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Version</th>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Material Cost</th>
                      <th className="py-2.5 px-3">Transport</th>
                      <th className="py-2.5 px-3">Final Delivered Price</th>
                      <th className="py-2.5 px-3">Gross Margin</th>
                      <th className="py-2.5 px-3">Issued Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotations.map((q) => (
                      <tr key={q.id}>
                        <td className="py-2.5 px-3 font-bold">v{q.version}</td>
                        <td className="py-2.5 px-3 font-mono">{q.quotation_reference}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              q.quotation_status === 'ISSUED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {q.quotation_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{formatINR(q.material_cost)}</td>
                        <td className="py-2.5 px-3 font-mono">{formatINR(q.transport_cost)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {formatINR(q.final_delivered_price)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700">
                          {formatINR(q.estimated_gross_margin)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{formatDate(q.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Fulfillment Logistics */}
      {activeTab === 'fulfillment' && (
        <div className="space-y-6">
          {fulfillmentWarning && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{fulfillmentWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Supplier Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-3">
                <Building2 className="h-4 w-4 text-amber-600" />
                <span>1. Verified Sourcing Partner</span>
              </div>

              {supplier ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                  <div className="font-bold text-slate-900 text-sm">{supplier.business_name}</div>
                  <div className="text-slate-600">Contact: {supplier.contact_person} ({supplier.mobile_number})</div>
                  <div className="text-slate-500">Location: {supplier.location_address}</div>
                  {supplier.indicative_purchase_price && (
                    <div className="text-[11px] font-semibold text-emerald-800">
                      Indicative Price: ₹{supplier.indicative_purchase_price} (Updated: {formatDate(supplier.price_updated_at)})
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No supplier assigned yet.</p>
              )}

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">Select Partner Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Choose Supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.business_name} ({s.location_address})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignSupplier}
                  disabled={!selectedSupplierId || selectedSupplierId === order.supplier_id}
                  className="w-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white py-2 rounded-xl transition-colors"
                >
                  {order.supplier_id ? 'Update Supplier Assignment' : 'Assign Supplier'}
                </button>
              </div>
            </div>

            {/* Truck Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-3">
                <TruckIcon className="h-4 w-4 text-blue-600" />
                <span>2. Partner Truck Transport</span>
              </div>

              {truck ? (
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl text-xs space-y-2">
                  <div className="font-bold text-slate-900 text-sm font-mono">{truck.registration_number}</div>
                  <div className="text-slate-600">Capacity: {truck.capacity_tons} Tons</div>
                  <div className="text-slate-600">Owner: {truck.owner_name} ({truck.owner_mobile})</div>
                  <div className="text-[11px] text-blue-800">Status: {truck.availability_status}</div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No vehicle assigned yet.</p>
              )}

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">Select Partner Vehicle</label>
                <select
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Choose Truck...</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.registration_number} ({t.capacity_tons}T - {t.availability_status})
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-xs text-slate-600 py-1">
                  <input
                    type="checkbox"
                    checked={autoAssignDriver}
                    onChange={(e) => setAutoAssignDriver(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Auto-assign vehicle default driver</span>
                </label>

                <button
                  type="button"
                  onClick={handleAssignTruck}
                  disabled={!selectedTruckId || selectedTruckId === order.truck_id}
                  className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-2 rounded-xl transition-colors"
                >
                  {order.truck_id ? 'Update Truck Assignment' : 'Assign Truck'}
                </button>
              </div>
            </div>

            {/* Driver Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-3">
                <User className="h-4 w-4 text-emerald-600" />
                <span>3. Assigned Driver Partner</span>
              </div>

              {driver ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                  <div className="font-bold text-slate-900 text-sm">{driver.full_name}</div>
                  <div className="text-slate-600">Mobile: {driver.mobile_number}</div>
                  <div className="text-slate-500 font-mono text-[11px]">License: {driver.license_number || '—'}</div>
                  <div className="text-[11px] text-emerald-800">Status: {driver.availability_status}</div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No driver assigned yet.</p>
              )}

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">Select Driver</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Choose Driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.mobile_number} - {d.availability_status})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignDriver}
                  disabled={!selectedDriverId || selectedDriverId === order.driver_id}
                  className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white py-2 rounded-xl transition-colors"
                >
                  {order.driver_id ? 'Update Driver Assignment' : 'Assign Driver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Payment Ledger */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Payment Reconciliation</h2>
                <p className="text-xs text-slate-500 mt-0.5">Recorded customer payments and outstanding balances</p>
              </div>

              {order.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
                >
                  + Record Payment
                </button>
              )}
            </div>

            {/* Financial Status Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 block">Total Quoted Value</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">
                  {formatINR(paymentSummary.finalCustomerPrice)}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 block">Total Paid So Far</span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono mt-1 block">
                  {formatINR(paymentSummary.totalPaid)}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 block">Outstanding Balance</span>
                <span className="text-xl font-extrabold text-amber-700 font-mono mt-1 block">
                  {formatINR(paymentSummary.balanceDue)}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 block">Current Status</span>
                <span className="text-base font-bold text-slate-800 mt-1 block">
                  {paymentSummary.paymentStatus}
                </span>
              </div>
            </div>

            {/* Payments List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payment Transactions</h3>
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Reference / Txn ID</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2.5 px-3">{formatDate(p.payment_date)}</td>
                          <td className="py-2.5 px-3 font-semibold">{p.payment_method}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatINR(p.amount)}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800">
                              {p.payment_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{p.transaction_reference || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{p.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No payment records logged for this order.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Operational Internal Notes */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Operational Internal Notes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Coordination notes between operations desk, quarry weighbridges, and transport drivers.
            </p>
          </div>

          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              required
              maxLength={1000}
              placeholder="e.g. Supervisor called: daytime heavy vehicle entry permitted via Wardha road before 8:00 AM..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAddingNote || !noteText.trim()}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl transition-colors shadow-xs"
              >
                {isAddingNote ? 'Adding...' : 'Add Operational Note'}
              </button>
            </div>
          </form>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {notes.length > 0 ? (
              notes.map((n) => (
                <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700">{n.author_name}</span>
                    <span>{formatDateTime(n.created_at)}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{n.note}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No operational notes recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Audit & Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Immutable Status & Activity History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chronological record of every state transition and administrative action</p>
          </div>

          <div className="space-y-4">
            {statusHistory.map((h, i) => (
              <div key={h.id} className="flex gap-4 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600 mt-1" />
                  {i < statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                </div>
                <div className="space-y-0.5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{h.new_status}</span>
                    {h.previous_status && (
                      <span className="text-[11px] text-slate-400">(from {h.previous_status})</span>
                    )}
                  </div>
                  {h.notes && <p className="text-slate-600">{h.notes}</p>}
                  <span className="text-[11px] text-slate-400 block">{formatDateTime(h.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Record Customer Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder={`Max: ${paymentSummary.balanceDue}`}
                  value={paymentForm.amount || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Outstanding balance: {formatINR(paymentSummary.balanceDue)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash at Site Unloading</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction / Reference ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-123456789 or NEFT-REF"
                  value={paymentForm.transaction_reference || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 50% advance before tipper dispatch"
                  value={paymentForm.notes || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment || paymentForm.amount <= 0}
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors"
                >
                  {isRecordingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Cancel Order {order.order_reference}
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Cancelling an order is an irreversible terminal state. Historical request and quotation data will be preserved for audit.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer cancelled foundation work due to site road height restriction..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isCancelling || cancelReason.trim().length < 3}
                  className="px-5 py-2 font-bold bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Order Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
