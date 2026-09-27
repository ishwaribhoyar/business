import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { Product } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { APP_CONFIG } from '../config/index.js';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageCircle,
  Truck,
  Shield,
  Layers,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  usePageMeta(
    product ? `${product.name} Delivery in Nagpur` : 'Material Details',
    product?.description || 'Bulk building material specifications and site delivery in Nagpur.'
  );

  useEffect(() => {
    if (slug) {
      setLoading(true);
      productService
        .getProductBySlug(slug)
        .then((data) => setProduct(data))
        .catch(() => {
          // Check fallback in APP_CONFIG
          const matched = APP_CONFIG.mvpMaterials.find(
            (m) => m.slug === slug || (slug === 'aggregate' && m.slug === 'black-stone-aggregate')
          );
          if (matched) {
            setProduct({
              id: matched.id,
              name: matched.name,
              slug: matched.slug,
              category: 'Bulk Aggregate',
              description: `Quality ${matched.name} sourced from verified quarries for construction in Nagpur.`,
              unit: matched.unit,
              min_quantity: matched.unit === 'Pieces' ? 1000 : 1,
              typical_use_cases: 'RCC construction, masonry, foundation, and plastering work.',
              quality_specifications: 'Filtered and verified as per regional construction standards.',
              availability_disclaimer: 'Delivered price calculated per order based on site distance and vehicle access.',
              display_order: 1,
            });
          } else {
            setProduct(null);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return <LoadingSpinner message="Loading material details..." />;
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Material Not Found</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The requested construction material is not in our initial 4 MVP categories (Sand, Bricks, Black Stone Aggregate, Murum).
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-amber-600 text-white px-5 py-2.5 rounded-xl hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Materials Catalog
          </Link>
        </div>
      </div>
    );
  }

  const waPrefill = encodeURIComponent(
    `Hello Nagpur Materials, I would like to inquire about ${product.name} delivery in Nagpur.`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to="/" className="hover:text-slate-800">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-800">Materials</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{product.name}</span>
      </nav>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-md uppercase tracking-wider border border-amber-200">
              <Layers className="h-3.5 w-3.5" />
              {product.category || 'Bulk Construction Material'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {product.name}
            </h1>
            <span className="text-xs text-slate-500 block mt-1">
              Service Area: Nagpur and currently serviceable nearby areas
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              to={`/get-quote?material=${product.id}`}
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
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">Description</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>
        </div>

        {/* Technical & Commercial Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-500 font-medium block">Billing & Measurement Unit</span>
            <span className="text-slate-900 font-bold text-base">{product.unit}</span>
            <span className="text-slate-400 text-[11px] block">
              Standard commercial unit utilized across Nagpur construction works.
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-500 font-medium block">Minimum Order Quantity</span>
            <span className="text-slate-900 font-bold text-base">
              {product.min_quantity || 1} {product.unit}
            </span>
            <span className="text-slate-400 text-[11px] block">
              Minimum viable transport truckload for direct site dispatch.
            </span>
          </div>
        </div>

        {/* Use Cases */}
        {product.typical_use_cases && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Typical Applications & Use Cases
            </h3>
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-2xl leading-relaxed">
              {product.typical_use_cases}
            </p>
          </div>
        )}

        {/* Quality Standards */}
        {product.quality_specifications && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Quality & Sourcing Standards
            </h3>
            <p className="text-xs text-slate-600 bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl leading-relaxed">
              {product.quality_specifications}
            </p>
          </div>
        )}

        {/* Availability & Pricing Disclaimer */}
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Quotation-First Pricing</span>
            <p className="leading-relaxed">
              {product.availability_disclaimer ||
                'Delivered prices are calculated per order based on site distance, truck road accessibility, and current quarry dispatch rates. Submit your delivery location for a firm quote.'}
            </p>
          </div>
        </div>

        {/* Bottom CTA Block */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Truck className="h-4 w-4 text-amber-600" />
            <span>Dedicated truck transport across Nagpur and nearby areas</span>
          </div>
          <Link
            to={`/get-quote?material=${product.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <span>Request Delivered Quote</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
