import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogService } from '../services/catalogService.js';
import { ProductVariant } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { APP_CONFIG } from '../config/index.js';
import { VariantImage } from '../components/VariantImage.js';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageCircle,
  Truck,
  Shield,
  Layers,
  Clock,
  Package,
} from 'lucide-react';

export const VariantDetailPage: React.FC = () => {
  const { categorySlug, variantSlug } = useParams<{ categorySlug: string; variantSlug: string }>();
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta(
    variant ? `${variant.name} Delivery in Nagpur` : 'Material Details',
    variant?.short_description || 'Bulk building material specifications and site delivery in Nagpur.'
  );

  useEffect(() => {
    if (!categorySlug || !variantSlug) return;
    setLoading(true);
    catalogService
      .getVariantBySlug(categorySlug, variantSlug)
      .then((data) => {
        setVariant(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load variant details');
      })
      .finally(() => setLoading(false));
  }, [categorySlug, variantSlug]);

  if (loading) {
    return <LoadingSpinner message="Loading material details & technical specifications..." />;
  }

  if (error || !variant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Material Subtype Not Found</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The requested material subtype is not available. Please browse our materials catalog.
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-amber-600 text-white px-5 py-2.5 rounded-xl hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  const waPrefill = encodeURIComponent(
    `Hello Nagpur Materials, I would like to inquire about ${variant.name} (${variant.category_name || ''}) site delivery in Nagpur.`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to="/" className="hover:text-slate-800">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-800">Materials</Link>
        <span>/</span>
        <Link to={`/products/${categorySlug}`} className="hover:text-slate-800">
          {variant.category_name || categorySlug}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{variant.name}</span>
      </nav>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-md uppercase tracking-wider border border-amber-200">
              <Layers className="h-3.5 w-3.5" />
              {variant.category_name || 'Material Category'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {variant.name}
            </h1>
            <p className="text-xs text-slate-500">
              Service Area: Nagpur and currently serviceable nearby areas
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              to={`/get-quote?category=${categorySlug}&variant=${variant.slug}`}
              className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl shadow-xs transition-colors"
            >
              <span>Get Delivered Quote</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=${waPrefill}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-4 py-3 rounded-xl border border-emerald-200 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Visual & Short Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <VariantImage
            src={variant.image_url}
            alt={variant.name}
            categorySlug={categorySlug}
            className="w-full h-56 object-cover"
          />

          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Overview</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {variant.short_description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Standard Unit</span>
                <span className="text-sm font-bold text-slate-900">{variant.unit}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Minimum Order</span>
                <span className="text-sm font-bold text-slate-900">
                  {variant.min_quantity} {variant.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        {variant.detailed_description && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Technical Details</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {variant.detailed_description}
            </p>
          </div>
        )}

        {/* Configurable Specifications Schema */}
        {variant.parsed_specifications && variant.parsed_specifications.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Order Specifications for {variant.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variant.parsed_specifications.map((spec) => (
                <div key={spec.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{spec.label}</span>
                    {spec.required ? (
                      <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">Optional</span>
                    )}
                  </div>
                  {spec.options && (
                    <p className="text-xs text-slate-600">
                      Options: <strong>{spec.options.join(', ')}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotation Pricing Disclaimer */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
          <Package className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold block">Quotation-First Pricing Disclosure</span>
            <p className="text-amber-800 leading-relaxed">
              In accordance with our platform operating principles, delivered prices are not automated. Our local Nagpur operations desk calculates an all-inclusive delivered quotation based on current quarry gate rates, truck tonnage, and exact distance to your construction site.
            </p>
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to={`/products/${categorySlug}`}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {variant.category_name || 'Category'} Subtypes
          </Link>
          <Link
            to={`/get-quote?category=${categorySlug}&variant=${variant.slug}`}
            className="inline-flex items-center justify-center gap-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl transition-colors shadow-xs"
          >
            <span>Proceed to Delivered Quote Request</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
