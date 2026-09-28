import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/index.js';
import { productService } from '../services/productService.js';
import { catalogService } from '../services/catalogService.js';
import { Product, ProductCategory } from '../types/index.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import {
  Truck,
  ShieldCheck,
  Clock,
  Calculator,
  ArrowRight,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Building2,
  HardHat,
  Phone,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  usePageMeta(
    'Bulk Building Material Delivery in Nagpur',
    'Order Sand, Bricks, Black Stone Aggregate, and Murum with transparent delivered quotations in Nagpur. Sourced from verified quarry network and managed truck dispatch directly to your construction site.'
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    catalogService
      .getCategories(true)
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch(() => {});

    productService
      .getProducts()
      .then((data) => {
        if (data && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {
        setProducts(
          APP_CONFIG.mvpMaterials.map((m) => ({
            id: m.id,
            name: m.name,
            slug: m.slug,
            category: 'Bulk Material',
            description: `Quality ${m.name} for construction projects across Nagpur.`,
            unit: m.unit,
            min_quantity: m.unit === 'Pieces' ? 1000 : 1,
            display_order: 1,
          }))
        );
      });
  }, []);

  const displayProducts = products.length > 0 ? products : (APP_CONFIG.mvpMaterials as unknown as Product[]);

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
      {/* 1. HERO SECTION - 100% Light Theme, High-Contrast & Professional */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-slate-50/80 rounded-3xl border border-slate-200/90 p-6 sm:p-10 lg:p-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Core Value & Calls to Action */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold tracking-wide">
                <MapPin className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                <span>Nagpur & Nearby Serviceable Areas • Direct Tipper Dispatch</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Bulk Construction Materials Delivered Directly to Your Construction Site.
              </h1>

              <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                Order Sand, Bricks, Black Stone Aggregate, and Murum with guaranteed, transparent delivered pricing. Sourced from verified regional quarries and delivered straight to your site by dedicated partner trucks.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  to="/get-quote"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <span>Request Delivered Quote</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Nagpur%20Materials,%20I%20need%20a%20delivered%20quotation%20for%20construction%20materials.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp Operations</span>
                </a>
              </div>

              {/* Trust Checkpoints */}
              <div className="pt-4 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Quotation-First Pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Verified Quarry Sourcing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Dedicated Truck Dispatch</span>
                </div>
              </div>
            </div>

            {/* Right Column: Direct Material Quick-Selector Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Select Material For Quote
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fixed delivered rates calculated for your site
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    4 MVP Materials
                  </span>
                </div>

                {/* Quick Material Tiles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {(categories.length > 0 ? categories : displayProducts).map((item: any) => (
                    <Link
                      key={item.id}
                      to={`/products/${item.slug}`}
                      className="group p-3.5 bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-400 rounded-xl transition-all flex flex-col justify-between text-left"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            {item.variants ? `${item.variants.length} Subtypes` : item.unit}
                          </span>
                          <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-amber-600 transition" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1.5 group-hover:text-amber-800">
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-600 mt-3 block">
                        Browse Subtypes →
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <Link
                    to="/get-quote"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    <span>Enter Site Location & Get Full Quote</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Questions? Call our desk:</span>
                  <a
                    href={`tel:${APP_CONFIG.phone}`}
                    className="font-bold text-slate-800 hover:text-amber-600 flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3 text-amber-600" />
                    <span>{APP_CONFIG.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE MVP MATERIALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">
            Initial 4 MVP Materials
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
            Core Building Materials in Nagpur
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Direct quarry and kiln partnerships with managed tipper delivery to residential, commercial, and infrastructure sites.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(categories.length > 0 ? categories : displayProducts).map((cat: any) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-wider border border-amber-200">
                    {cat.variants ? `${cat.variants.length} Subtypes` : cat.unit}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Nagpur Region
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-3">{cat.name}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {cat.description || 'Quality verified bulk construction material for Nagpur construction sites.'}
                </p>

                {cat.variants && cat.variants.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Available Subtypes:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.variants.map((v: any) => (
                        <span
                          key={v.id}
                          className="inline-flex text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          {v.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/products/${cat.slug}`}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Explore Subtypes →
                </Link>
                <Link
                  to={`/get-quote?category=${cat.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition"
                >
                  <span>Get Quote</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS (5-STEP WORKFLOW) - Light & Clean */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl p-6 sm:p-12 border border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300">
              Quotation-First Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              How Material Delivery Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              A transparent, 5-step process designed for contractors, builders, and individual home builders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">1</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Select Material</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Choose Sand, Bricks, Black Stone Aggregate, or Murum with your desired quantity.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">2</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Share Site Location</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provide your construction site address, pincode, and preferred delivery date.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">3</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Get Delivered Quote</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our operations team calculates exact transport haulage and communicates a fixed delivered price.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">4</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Confirm & Dispatch</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Confirm via WhatsApp or phone. We assign the verified quarry supplier and dedicated truck.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">5</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Site Delivery</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Truck arrives at your site. Material is inspected and unloaded under supervisor direction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUST & OPERATIONAL ADVANTAGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex gap-4">
            <div className="bg-amber-100 text-amber-800 p-3 rounded-xl h-fit shrink-0">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">Guaranteed Delivered Price</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No surprises on arrival. Every quotation includes material sourcing and transport calculated specifically for your construction site in Nagpur.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex gap-4">
            <div className="bg-amber-100 text-amber-800 p-3 rounded-xl h-fit shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">Verified Quarry Network</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We coordinate materials through verified local suppliers and third-party truck partners serving Nagpur and currently serviceable nearby areas.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex gap-4">
            <div className="bg-amber-100 text-amber-800 p-3 rounded-xl h-fit shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">Human-Assisted Operations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our operations desk manually calculates delivered quotations and coordinates between customers, suppliers, and truck operators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PARTNER TRUCK FLEET (Light Theme Industrial Design) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50/70 rounded-3xl p-6 sm:p-10 border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300">
              <Truck className="h-3.5 w-3.5 text-amber-800" />
              <span>Partner Delivery Network</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Asset-Light Delivery Fleet Coordination
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We coordinate deliveries through verified third-party trucks. Partner trucks may display platform branding panels and QR codes for convenient on-site quote requests.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/get-quote"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl shadow-xs text-xs sm:text-sm flex items-center gap-2 transition"
            >
              <span>Get Delivered Quote</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3 rounded-xl text-xs sm:text-sm transition"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* 6. SERVICE AREA (PRD Section 5) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300">
            <MapPin className="h-3.5 w-3.5 text-amber-800" />
            <span>Service Area</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            {APP_CONFIG.serviceArea}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            The platform currently serves Nagpur and currently serviceable nearby areas. Each quote request is verified by our operations team based on supplier availability and delivery location accessibility.
          </p>
        </div>
      </section>
    </div>
  );
};
