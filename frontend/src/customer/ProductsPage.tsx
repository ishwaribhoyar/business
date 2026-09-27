import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { Product } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { Alert } from '../components/Alert.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { ArrowRight, CheckCircle2, PackageCheck, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../config/index.js';

export const ProductsPage: React.FC = () => {
  usePageMeta(
    'Bulk Construction Materials Catalog',
    'Browse bulk construction materials available for site delivery in Nagpur: Sand, Bricks, Black Stone Aggregate, and Murum. Verified quarry sourcing with transparent delivered quotations.'
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productService
      .getProducts()
      .then((data) => {
        setProducts(data);
        setError(null);
      })
      .catch(() => {
        // Fallback to APP_CONFIG
        setProducts(
          APP_CONFIG.mvpMaterials.map((m) => ({
            id: m.id,
            name: m.name,
            slug: m.slug,
            category: 'Bulk Material',
            description: `Quality ${m.name} for construction projects in Nagpur.`,
            unit: m.unit,
            min_quantity: m.unit === 'Pieces' ? 1000 : 1,
            display_order: 1,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading construction materials catalog..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-semibold mb-3">
          <span>🏗️ Initial 4 MVP Material Categories</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Bulk Construction Materials in Nagpur
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
          We coordinate bulk procurement and dedicated truck delivery for 4 core construction materials in Nagpur. Sourced directly from verified quarries and kilns, delivered quotes are calculated per site location.
        </p>
      </div>

      {error && <Alert type="error" title="Notice" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg uppercase tracking-wider border border-amber-200">
                  Unit: {product.unit}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Min. Order: <strong>{product.min_quantity || 1} {product.unit}</strong>
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{product.name}</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.typical_use_cases && (
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Typical Applications
                  </h3>
                  <p className="text-xs text-slate-500">{product.typical_use_cases}</p>
                </div>
              )}

              {product.quality_specifications && (
                <div className="pt-2">
                  <span className="text-[11px] text-slate-500 block">
                    <strong>Quality Standard:</strong> {product.quality_specifications}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                to={`/products/${product.slug}`}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 text-center sm:text-left py-2"
              >
                Specifications & Sourcing Details
              </Link>
              <Link
                to={`/get-quote?material=${product.id}`}
                className="inline-flex items-center justify-center gap-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl transition-colors shadow-xs"
              >
                <span>Request Delivered Quote</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quotation Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 flex items-start gap-3">
        <PackageCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Quotation-First Pricing in Nagpur</span>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            Delivered pricing varies based on quarry gate rates, truck type (e.g. 6-wheeler, 10-wheeler), and exact site distance. Submit your site location on the quote form to receive a fixed delivered price.
          </p>
        </div>
      </div>
    </div>
  );
};
