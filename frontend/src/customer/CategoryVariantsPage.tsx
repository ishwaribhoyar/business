import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogService } from '../services/catalogService.js';
import { ProductCategory, ProductVariant } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { Alert } from '../components/Alert.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { VariantImage } from '../components/VariantImage.js';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  Layers,
  Info,
} from 'lucide-react';

export const CategoryVariantsPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta(
    category ? `${category.name} Subtypes & Delivery in Nagpur` : 'Material Subtypes',
    category?.description || 'Browse bulk construction material subtypes available for site delivery in Nagpur.'
  );

  useEffect(() => {
    if (!categorySlug) return;
    setLoading(true);
    catalogService
      .getCategoryBySlug(categorySlug)
      .then((data) => {
        setCategory(data);
        setVariants(data.variants || []);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load category subtypes');
      })
      .finally(() => setLoading(false));
  }, [categorySlug]);

  if (loading) {
    return <LoadingSpinner message="Loading material subtypes & specifications..." />;
  }

  if (error || !category) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Category Not Found</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The requested material category is not in our 4 core categories (Sand, Bricks, Black Stone / Aggregate, Murum).
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to="/" className="hover:text-slate-800">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-800">Materials</Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-semibold">
          <Layers className="h-3.5 w-3.5" />
          <span>Category Overview</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {category.name} Subtypes & Specifications
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          {category.description}
        </p>
      </div>

      {/* Variants Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {variants.map((variant) => (
          <div
            key={variant.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Variant Image */}
              <VariantImage
                src={variant.image_url}
                alt={variant.name}
                categorySlug={category.slug}
                className="w-full h-40 object-cover"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-wider border border-amber-200">
                  Unit: {variant.unit}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Min. Order: <strong>{variant.min_quantity} {variant.unit}</strong>
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">{variant.name}</h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                  {variant.short_description}
                </p>
              </div>

              {/* Dynamic Specifications Preview */}
              {variant.parsed_specifications && variant.parsed_specifications.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                    Configurable Specifications:
                  </span>
                  <div className="space-y-1 text-xs text-slate-600">
                    {variant.parsed_specifications.map((spec) => (
                      <div key={spec.key} className="flex items-start gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>{spec.label}:</strong>{' '}
                          {spec.options ? spec.options.join(', ') : 'Custom value'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to={`/get-quote?category=${category.slug}&variant=${variant.slug}`}
                className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-xs"
              >
                <span>Select & Request Quote</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to={`/products/${category.slug}/${variant.slug}`}
                className="w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5"
              >
                Specifications & Sourcing Details →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quotation Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 flex items-start gap-3">
        <PackageCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Quotation-First Delivery Process</span>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            All prices are quoted all-inclusive delivered to your site in Nagpur based on current quarry gate rates, truck tonnage, and exact distance. Submit a quote request to receive a confirmed delivered rate.
          </p>
        </div>
      </div>
    </div>
  );
};
