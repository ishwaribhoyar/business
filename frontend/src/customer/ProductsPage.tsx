import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { Product } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { APP_CONFIG } from '../config/index.js';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService
      .getProducts()
      .then((data) => setProducts(data))
      .catch(() => {
        // Fallback to config if backend is offline during static viewing
        setProducts(
          APP_CONFIG.mvpMaterials.map((m) => ({
            id: m.id,
            name: m.name,
            slug: m.slug,
            category: 'Bulk Material',
            description: `Quality ${m.name} for construction projects in Nagpur.`,
            unit: m.unit,
            min_quantity: 1,
            display_order: 1,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading materials..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Construction Materials</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          We coordinate bulk procurement and truck delivery for 4 core construction materials in Nagpur. Delivered prices are quoted per site location.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                  Unit: {product.unit} (Min. {product.min_quantity} {product.unit})
                </span>
                <span className="text-xs text-slate-400 font-medium">Nagpur Service Zone</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-3">{product.name}</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{product.description}</p>

              {product.typical_use_cases && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Typical Applications
                  </h4>
                  <p className="text-xs text-slate-500">{product.typical_use_cases}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                to={`/products/${product.slug}`}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Specifications & Details
              </Link>
              <Link
                to={`/get-quote?material=${product.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors shadow-xs"
              >
                <span>Request Quote</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
