import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/index.js';
import { orderService, QuoteRequestResponse } from '../services/orderService.js';
import { Input } from '../components/Input.js';
import { Button } from '../components/Button.js';
import { Alert } from '../components/Alert.js';
import { CheckCircle2, MessageCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export const QuoteOrderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedMaterial = searchParams.get('material') || APP_CONFIG.mvpMaterials[0].id;
  const qrParam = searchParams.get('qr') || '';

  const [formData, setFormData] = useState({
    material_id: preselectedMaterial,
    quantity: 1,
    unit: 'Brass',
    delivery_address: '',
    area_pincode: '',
    preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    customer_name: '',
    mobile_number: '',
    whatsapp_number: '',
    additional_notes: '',
    map_pin_url: '',
    qr_campaign_code: qrParam,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<QuoteRequestResponse | null>(null);

  const handleMaterialChange = (materialId: string) => {
    const selected = APP_CONFIG.mvpMaterials.find((m) => m.id === materialId);
    setFormData((prev) => ({
      ...prev,
      material_id: materialId,
      unit: selected ? selected.unit : 'Brass',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await orderService.submitQuoteRequest({
        ...formData,
        quantity: Number(formData.quantity),
      });
      setSubmittedData(response);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Request Received
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Quotation Request #{submittedData.orderReference}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
              Our Nagpur operations desk is calculating the exact delivered price including vehicle transport to your site.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Order Reference:</span>
              <span className="font-bold text-slate-800">{submittedData.orderReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Initial Status:</span>
              <span className="font-bold text-blue-600">{submittedData.status}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={submittedData.whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-xs text-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Connect on WhatsApp Now</span>
            </a>
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Request Delivered Quotation</h1>
        <p className="text-sm text-slate-600 mt-2">
          Submit your required material, quantity, and Nagpur site location. We will calculate an exact delivered quote with verified transport.
        </p>
      </div>

      {errorMsg && <Alert type="error" title="Submission Error" message={errorMsg} />}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Material Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Material <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.material_id}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              {APP_CONFIG.mvpMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Quantity"
              type="number"
              min="1"
              step="any"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
              helperText={`Unit: ${formData.unit}`}
            />
          </div>
        </div>

        {/* Site Location */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Site Delivery Location (Nagpur)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Site Address / Landmark"
                required
                placeholder="e.g., Plot 22, Near Metro Pillar 140, Wardha Road"
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              />
            </div>

            <Input
              label="Area / Pincode"
              required
              placeholder="e.g., Manish Nagar (440015)"
              value={formData.area_pincode}
              onChange={(e) => setFormData({ ...formData, area_pincode: e.target.value })}
            />

            <Input
              label="Preferred Delivery Date"
              type="date"
              required
              value={formData.preferred_delivery_date}
              onChange={(e) => setFormData({ ...formData, preferred_delivery_date: e.target.value })}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Contact Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Full Name / Firm Name"
                required
                placeholder="Contractor / Site Supervisor / Owner Name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>

            <Input
              label="Mobile Number"
              required
              type="tel"
              placeholder="10-digit mobile number"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
            />

            <Input
              label="WhatsApp Number (Optional)"
              type="tel"
              placeholder="Leave blank if same as mobile"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Site Access or Delivery Instructions (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g., Narrow road access, night unloading required, 10-wheeler restriction..."
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={formData.additional_notes}
            onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
          />
        </div>

        <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
          Submit Quotation Request
        </Button>

        <p className="text-[11px] text-slate-500 text-center">
          * MVP pricing is quotation-first. No automated cards or charges. Our operations team verifies quarry and transport rates before confirming.
        </p>
      </form>
    </div>
  );
};
