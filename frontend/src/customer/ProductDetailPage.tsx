import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { Product } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { Card } from '../components/Card.js';
import { ArrowLeft, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      productService
        .getProductBySlug(slug)
        .then((data) => setProduct(data))
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return <LoadingSpinner message="Loading material details..." />;
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested building material does not exist in our catalog.</p>
        <Link to="/products" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-amber-600">
          <ArrowLeft className="h-4 w-4" /> Back to Materials Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Materials
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md uppercase">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{product.name}</h1>
          </div>
          <Link
            to={`/get-quote?material=${product.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <span>Request Delivered Quote</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium block">Billing Unit</span>
            <span className="text-slate-800 font-bold text-sm">{product.unit}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium block">Minimum Order Quantity</span>
            <span className="text-slate-800 font-bold text-sm">{product.min_quantity} {product.unit}</span>
          </div>
        </div>

        {product.quality_specifications && (
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Quality & Sourcing Standards
            </h3>
            <p className="text-xs text-slate-600 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
              {product.quality_specifications}
            </p>
          </div>
        )}

        {product.availability_disclaimer && (
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>{product.availability_disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
};
