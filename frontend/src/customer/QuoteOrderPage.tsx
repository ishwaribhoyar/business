import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/index.js';
import { productService } from '../services/productService.js';
import { orderService, QuoteRequestResponse } from '../services/orderService.js';
import { Product } from '../types/index.js';
import { Input } from '../components/Input.js';
import { Button } from '../components/Button.js';
import { Alert } from '../components/Alert.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import {
  CheckCircle2,
  MessageCircle,
  Phone,
  ArrowRight,
  RotateCcw,
  Calendar,
  MapPin,
  Package,
  Info,
  Clock,
} from 'lucide-react';

export const QuoteOrderPage: React.FC = () => {
  usePageMeta(
    'Request Delivered Quote',
    'Request an all-inclusive delivered price quote for bulk sand, bricks, aggregate, or murum delivery in Nagpur. Transparent pricing, verified supplier network, and managed truck transport.'
  );

  const [searchParams] = useSearchParams();
  const initialMaterialParam = searchParams.get('material') || '';
  const qrParam = searchParams.get('qr') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    material_id: '',
    quantity: 1,
    unit: 'Brass',
    delivery_address: '',
    area_pincode: '',
    preferred_delivery_date: tomorrowStr,
    customer_name: '',
    mobile_number: '',
    whatsapp_number: '',
    additional_notes: '',
    map_pin_url: '',
    qr_campaign_code: qrParam,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<QuoteRequestResponse | null>(null);
  const submitLockRef = useRef(false);

  // Fetch active products from backend
  useEffect(() => {
    productService
      .getProducts()
      .then((items) => {
        if (items && items.length > 0) {
          setProducts(items);
          // Match preselected material from query param or fallback to first product
          const matched =
            items.find((p) => p.id === initialMaterialParam || p.slug === initialMaterialParam) || items[0];
          setSelectedProduct(matched);
          setFormData((prev) => ({
            ...prev,
            material_id: matched.id,
            unit: matched.unit,
            quantity: matched.min_quantity || 1,
          }));
        }
      })
      .catch(() => {
        // Fallback to APP_CONFIG MVP materials if offline
        const fallbackItems: Product[] = APP_CONFIG.mvpMaterials.map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          category: 'Bulk Material',
          description: `Quality ${m.name} for construction projects in Nagpur.`,
          unit: m.unit,
          min_quantity: m.unit === 'Pieces' ? 1000 : 1,
          display_order: 1,
        }));
        setProducts(fallbackItems);
        const matched =
          fallbackItems.find((p) => p.id === initialMaterialParam || p.slug === initialMaterialParam) ||
          fallbackItems[0];
        setSelectedProduct(matched);
        setFormData((prev) => ({
          ...prev,
          material_id: matched.id,
          unit: matched.unit,
          quantity: matched.min_quantity || 1,
        }));
      });
  }, [initialMaterialParam]);

  const handleMaterialChange = (materialId: string) => {
    const product = products.find((p) => p.id === materialId) || null;
    setSelectedProduct(product);
    if (product) {
      setFormData((prev) => ({
        ...prev,
        material_id: product.id,
        unit: product.unit,
        quantity: product.min_quantity || 1,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.material_id) {
      errors.material_id = 'Please select a material';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    } else if (selectedProduct && selectedProduct.min_quantity && formData.quantity < selectedProduct.min_quantity) {
      errors.quantity = `Minimum order quantity for ${selectedProduct.name} is ${selectedProduct.min_quantity} ${selectedProduct.unit}`;
    }

    if (!formData.delivery_address || formData.delivery_address.trim().length < 5) {
      errors.delivery_address = 'Please enter your construction site address (min. 5 characters)';
    }

    if (!formData.area_pincode || formData.area_pincode.trim().length < 3) {
      errors.area_pincode = 'Please provide the site area or 6-digit Nagpur pincode';
    }

    if (!formData.preferred_delivery_date) {
      errors.preferred_delivery_date = 'Please select a delivery date';
    } else if (new Date(formData.preferred_delivery_date).getTime() < new Date(todayStr).getTime()) {
      errors.preferred_delivery_date = 'Delivery date cannot be in the past';
    }

    if (!formData.customer_name || formData.customer_name.trim().length < 2) {
      errors.customer_name = 'Please enter your name or company/site name';
    }

    const cleanMobile = formData.mobile_number.replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.mobile_number = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (formData.whatsapp_number && formData.whatsapp_number.trim()) {
      const cleanWa = formData.whatsapp_number.replace(/\D/g, '').slice(-10);
      if (cleanWa.length !== 10 || !/^[6-9]\d{9}$/.test(cleanWa)) {
        errors.whatsapp_number = 'Please enter a valid 10-digit WhatsApp number or leave blank';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate multi-click submissions
    if (submitLockRef.current || isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await orderService.submitQuoteRequest({
        ...formData,
        quantity: Number(formData.quantity),
      });
      setSubmittedData(response);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "We couldn't submit your request right now. Please try again or reach out directly on WhatsApp."
      );
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setFieldErrors({});
    setErrorMsg(null);
    if (selectedProduct) {
      setFormData({
        material_id: selectedProduct.id,
        quantity: selectedProduct.min_quantity || 1,
        unit: selectedProduct.unit,
        delivery_address: '',
        area_pincode: '',
        preferred_delivery_date: tomorrowStr,
        customer_name: '',
        mobile_number: '',
        whatsapp_number: '',
        additional_notes: '',
        map_pin_url: '',
        qr_campaign_code: qrParam,
      });
    }
  };

  // -------------------------------------------------------------
  // SUCCESS / CONFIRMATION VIEW
  // -------------------------------------------------------------
  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">
              <Clock className="h-3 w-3" /> Quotation Request Received
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Request Ref: {submittedData.orderReference}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              Your bulk material requirement has been logged. Our Nagpur operations desk is calculating the exact delivered price with verified supplier and transport haulage.
            </p>
          </div>

          {/* Important Distinction Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left flex gap-3 text-xs text-blue-900">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Quotation-First Business Model</span>
              <p className="mt-0.5 text-blue-800">
                This is a quotation request, not an auto-charged order. You will receive an all-inclusive delivered quotation to review and confirm before dispatch.
              </p>
            </div>
          </div>

          {/* Summary Recap Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Reference ID:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{submittedData.orderReference}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Material Requested:</span>
              <span className="font-semibold text-slate-800">
                {selectedProduct?.name} ({formData.quantity} {formData.unit})
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Site Area / Pincode:</span>
              <span className="font-semibold text-slate-800">{formData.area_pincode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Preferred Delivery:</span>
              <span className="font-semibold text-slate-800">{formData.preferred_delivery_date}</span>
            </div>
          </div>

          {/* WhatsApp & Phone Actions */}
          <div className="space-y-3 pt-2">
            <a
              href={submittedData.whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-xs text-sm transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Continue on WhatsApp with Reference ID</span>
            </a>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`tel:${APP_CONFIG.phone}`}
                className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                <Phone className="h-4 w-4 text-amber-600" />
                <span>Call Operations Desk</span>
              </a>

              <button
                onClick={handleReset}
                className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Request Another Material</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Link to="/" className="text-xs text-amber-600 hover:text-amber-700 font-semibold">
              ← Return to Marketplace Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FORM VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-semibold mb-3">
          <span>📍 Nagpur and currently serviceable nearby areas</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Request Delivered Quotation
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Submit your required material, quantity, and construction site location in Nagpur. Our operations desk calculates an all-inclusive delivered quote with verified transport.
        </p>
      </div>

      {errorMsg && <Alert type="error" title="Submission Error" message={errorMsg} />}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6"
        noValidate
      >
        {/* Section 1: Material & Quantity */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-amber-600" />
            1. Material & Required Quantity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="material-select" className="block text-sm font-medium text-slate-700 mb-1">
                Select Building Material <span className="text-red-500">*</span>
              </label>
              <select
                id="material-select"
                value={formData.material_id}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.material_id
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-amber-500'
                }`}
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </select>
              {fieldErrors.material_id && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.material_id}</p>
              )}
            </div>

            <div>
              <Input
                label="Quantity"
                type="number"
                inputMode="decimal"
                min="0.5"
                step="any"
                required
                value={formData.quantity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFormData({ ...formData, quantity: isNaN(val) ? 0 : val });
                }}
                error={fieldErrors.quantity}
                helperText={`Billing Unit: ${formData.unit}`}
              />
            </div>
          </div>

          {selectedProduct && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <span>
                Standard Unit: <strong>{selectedProduct.unit}</strong> (Minimum order:{' '}
                <strong>
                  {selectedProduct.min_quantity} {selectedProduct.unit}
                </strong>
                )
              </span>
              <Link
                to={`/products/${selectedProduct.slug}`}
                className="text-amber-600 hover:text-amber-700 font-semibold shrink-0 ml-2"
              >
                View specs →
              </Link>
            </div>
          )}
        </div>

        {/* Section 2: Site Location */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-amber-600" />
            2. Site Delivery Location (Nagpur)
          </h2>

          <div className="space-y-4">
            <div>
              <Input
                label="Site Address & Landmarks"
                required
                placeholder="e.g., Construction site address, road/landmark, Nagpur area"
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                error={fieldErrors.delivery_address}
                helperText="Provide physical plot/road details so truck access can be confirmed."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Area / Pincode"
                required
                placeholder="e.g., Area name or 6-digit Nagpur pincode"
                value={formData.area_pincode}
                onChange={(e) => setFormData({ ...formData, area_pincode: e.target.value })}
                error={fieldErrors.area_pincode}
                helperText="Used to calculate transport distance from source."
              />

              <Input
                label="Preferred Delivery Date"
                type="date"
                min={todayStr}
                required
                value={formData.preferred_delivery_date}
                onChange={(e) => setFormData({ ...formData, preferred_delivery_date: e.target.value })}
                error={fieldErrors.preferred_delivery_date}
              />
            </div>

            <div>
              <Input
                label="Google Maps Pin / Location Link (Optional)"
                placeholder="e.g., https://maps.app.goo.gl/..."
                value={formData.map_pin_url}
                onChange={(e) => setFormData({ ...formData, map_pin_url: e.target.value })}
                helperText="Optional GPS link to help truck driver locate site accurately."
              />
            </div>
          </div>
        </div>

        {/* Section 3: Contact Details */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Phone className="h-4 w-4 text-amber-600" />
            3. Contact Information (No Account Required)
          </h2>

          <div className="space-y-4">
            <Input
              label="Contact Person / Firm Name"
              required
              placeholder="e.g., Contact Name / Company Name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              error={fieldErrors.customer_name}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mobile Number (Primary)"
                required
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                error={fieldErrors.mobile_number}
                helperText="Quotation will be sent to this number."
              />

              <Input
                label="WhatsApp Number (Optional)"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Leave blank if same as mobile"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                error={fieldErrors.whatsapp_number}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Site Access & Notes */}
        <div className="pt-4 border-t border-slate-100">
          <label htmlFor="notes-textarea" className="block text-sm font-medium text-slate-700 mb-1">
            Site Access or Delivery Notes (Optional)
          </label>
          <textarea
            id="notes-textarea"
            rows={3}
            maxLength={500}
            placeholder="e.g., Narrow lane access, night unloading preferred, 6-wheeler truck required, dumping space available on roadside..."
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={formData.additional_notes}
            onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Tell us if your site has road height/weight restrictions or specific unloading constraints.
          </p>
        </div>

        {/* Submit Action */}
        <div className="pt-2 space-y-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full py-3.5 text-base font-bold shadow-md rounded-xl"
          >
            <span>Submit Quotation Request</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <p className="text-[11px] text-slate-500 text-center leading-normal">
            * <strong>Quotation-First Model:</strong> Submitting this request creates an operational lead for our Nagpur team. We calculate supplier pricing and truck transport haulage, then send you the delivered quotation. No instant online payments or automatic cards.
          </p>
        </div>
      </form>
    </div>
  );
};
