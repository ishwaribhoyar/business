import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogService } from '../services/catalogService.js';
import { ProductCategory } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { Alert } from '../components/Alert.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { ArrowRight, Layers, PackageCheck, CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '../config/index.js';
import { VariantImage } from '../components/VariantImage.js';

export const ProductsPage: React.FC = () => {
  usePageMeta(
    'Bulk Construction Material Categories',
    'Browse the 4 core bulk construction material categories in Nagpur: Sand, Bricks, Black Stone Aggregate, and Murum. Explore specific subtypes, technical specifications, and request delivered quotations.'
  );

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogService
      .getCategories(true)
      .then((data) => {
        if (data && data.length > 0) {
          setCategories(data);
          setError(null);
        } else {
          fallbackCategories();
        }
      })
      .catch(() => {
        fallbackCategories();
      })
      .finally(() => setLoading(false));
  }, []);

  const fallbackCategories = () => {
    setCategories([
      {
        id: 'cat_sand_01',
        name: 'Sand',
        slug: 'sand',
        description: 'Clean construction sand and manufactured sand options suitable for plastering, masonry, and RCC concrete in Nagpur.',
        image_url: null,
        is_active: 1,
        display_order: 1,
        variants: [
          {
            id: 'var_sand_river',
            category_id: 'cat_sand_01',
            name: 'River Sand',
            slug: 'river-sand',
            short_description: 'Natural river bed sand screened for civil construction and plastering.',
            unit: 'Brass',
            min_quantity: 1,
            specifications_schema: '[]',
            is_active: 1,
            display_order: 1,
          },
          {
            id: 'var_sand_msand',
            category_id: 'cat_sand_01',
            name: 'M-Sand (Manufactured Sand)',
            slug: 'm-sand',
            short_description: 'Manufactured crushed stone sand for RCC concrete and masonry works.',
            unit: 'Brass',
            min_quantity: 1,
            specifications_schema: '[]',
            is_active: 1,
            display_order: 2,
          },
        ],
      },
      {
        id: 'cat_bricks_02',
        name: 'Bricks',
        slug: 'bricks',
        description: 'Red clay kiln bricks and fly ash bricks for residential and commercial masonry construction in Nagpur.',
        image_url: null,
        is_active: 1,
        display_order: 2,
        variants: [
          {
            id: 'var_brick_red',
            category_id: 'cat_bricks_02',
            name: 'Red Clay Bricks',
            slug: 'red-clay-bricks',
            short_description: 'Traditional kiln-burnt red clay bricks for masonry walls.',
            unit: 'Pieces',
            min_quantity: 1000,
            specifications_schema: '[]',
            is_active: 1,
            display_order: 1,
          },
          {
            id: 'var_brick_flyash',
            category_id: 'cat_bricks_02',
            name: 'Fly Ash Bricks',
            slug: 'fly-ash-bricks',
            short_description: 'Machine-pressed cement fly ash bricks for commercial partitions.',
            unit: 'Pieces',
            min_quantity: 1000,
            specifications_schema: '[]',
            is_active: 1,
            display_order: 2,
          },
        ],
      },
      {
        id: 'cat_stone_03',
        name: 'Black Stone / Aggregate',
        slug: 'black-stone-aggregate',
        description: 'Crushed basalt black metal stone aggregates (10mm, 20mm, 40mm) and GSB mix for RCC concrete and road sub-base.',
        image_url: null,
        is_active: 1,
        display_order: 3,
        variants: [
          {
            id: 'var_stone_20mm',
            category_id: 'cat_stone_03',
            name: '20mm Black Stone Metal',
            slug: '20mm-aggregate',
            short_description: 'Coarse angular crushed basalt aggregate for RCC slabs and beams.',
            unit: 'Brass',
            min_quantity: 1,
            specifications_schema: '[]',
            is_active: 1,
            display_order: 1,
          },
          {
            id: 'var_stone_10mm',
            category_id: 'cat_stone_03',
            name: '10mm Black Stone Metal',
            slug: '10mm-aggregate',
            short_description: 'Fine aggregate metal for RCC work and concrete precast.',
            unit: 'Brass',
            min_quantity: 1,
            specifications_schema: '[]',
            is_active: 1,
            display_order: 2,
          },
        ],
      },
      {
        id: 'cat_murum_04',
        name: 'Murum',
        slug: 'murum',
        description: 'Natural excavated yellow murum and hard red murum (bharda) for foundation filling, plinth packing, and site leveling.',
        image_url: null,
        is_active: 1,
        display_order: 4,
        variants: [
          {
            id: 'var_murum_yellow',
            category_id: 'cat_murum_04',
            name: 'Yellow Murum',
            slug: 'yellow-murum',
            short_description: 'Natural excavated yellow murum soil for plinth filling.',
            unit: 'Brass',
            min_quantity: 1,
            specifications_schema: '[]',
            is_active: 1,
            display_order: 1,
          },
          {
            id: 'var_murum_red',
            category_id: 'cat_murum_04',
            name: 'Red / Hard Murum (Bharda)',
            slug: 'red-bharda-murum',
            short_description: 'Rocky coarse murum with gravel composition for road subgrade.',
            unit: 'Brass',
            min_quantity: 1,
            specifications_schema: '[]',
            is_active: 1,
            display_order: 2,
          },
        ],
      },
    ]);
  };

  if (loading) {
    return <LoadingSpinner message="Loading material categories & subtypes..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-semibold mb-3">
          <Layers className="h-3.5 w-3.5" />
          <span>Core Material Categories — Nagpur</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Bulk Construction Material Categories
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
          Select a category below to explore specific construction subtypes, technical specifications (e.g. aggregate size, sand silt grade, brick class), and request a delivered quotation.
        </p>
      </div>

      {error && <Alert type="error" title="Notice" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg uppercase tracking-wider border border-amber-200">
                  Category
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {category.variants?.length ? `${category.variants.length} Subtypes Available` : 'Subtypes Available'}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{category.name}</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {category.description}
                </p>
              </div>

              {/* Subtypes Preview List */}
              {category.variants && category.variants.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Available Subtypes & Variants
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {category.variants.map((v) => (
                      <Link
                        key={v.id}
                        to={`/products/${category.slug}/${v.slug}`}
                        className="inline-flex items-center text-[11px] font-medium bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                      >
                        <span>{v.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                to={`/products/${category.slug}`}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 text-center sm:text-left py-2"
              >
                Browse {category.name} Subtypes →
              </Link>
              <Link
                to={`/get-quote?category=${category.slug}`}
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
          <span className="font-bold block">Quotation-First Sourcing in Nagpur</span>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            Delivered pricing varies based on current quarry gate rates, truck tonnage (6-wheeler or 10-wheeler), and exact delivery distance. Submit your construction site address to receive a fixed delivered quote.
          </p>
        </div>
      </div>
    </div>
  );
};
