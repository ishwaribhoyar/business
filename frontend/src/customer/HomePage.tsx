import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/index.js';
import { productService } from '../services/productService.js';
import { Product } from '../types/index.js';
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
  QrCode,
  Building2,
  HardHat,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  usePageMeta(
    'Bulk Building Material Delivery in Nagpur',
    'Order Sand, Bricks, Black Stone Aggregate, and Murum with transparent delivered quotations in Nagpur. Verified quarry network and managed truck dispatch directly to your construction site.'
  );

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productService
      .getProducts()
      .then((data) => {
        if (data && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {
        // Fallback to APP_CONFIG
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
    <div className="space-y-16 sm:space-y-20 py-6 sm:py-10">
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-12 lg:p-16 border border-slate-700 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <MapPin className="h-3.5 w-3.5" />
              <span>Serving {APP_CONFIG.serviceArea}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Bulk Construction Materials Delivered Directly to Your Site.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Order Sand, Bricks, Black Stone Aggregate, and Murum with transparent delivered pricing. No hidden transport surprises. Verified local suppliers and dedicated truck coordination across Nagpur.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                to="/get-quote"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>Request Delivered Quote</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Nagpur%20Materials,%20I%20need%20a%20delivered%20quotation%20for%20construction%20materials.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Operations</span>
              </a>
            </div>

            {/* Quick stats/principles */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Quotation-First Pricing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Verified Local Quarries</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Coordinated Transport</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core MVP Materials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">
            Initial MVP Materials
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
            Core Building Materials in Nagpur
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Direct quarry and kiln partnerships with managed delivery to residential and commercial construction sites.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-wider border border-amber-200">
                    {mat.unit}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Min: {mat.min_quantity || 1} {mat.unit}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-3">{mat.name}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {mat.description || 'Quality verified bulk construction material for Nagpur construction sites.'}
                </p>

                {mat.typical_use_cases && (
                  <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <strong>Uses:</strong> {mat.typical_use_cases}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/products/${mat.slug}`}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View Details
                </Link>
                <Link
                  to={`/get-quote?material=${mat.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  <span>Get Quote</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. How It Works (5-Step Workflow) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/80 rounded-3xl p-6 sm:p-12 border border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">
              Quotation-First Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">How Delivery Works</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              A transparent, 5-step process designed for contractors, builders, and site supervisors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">1</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Select Material</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose from Sand, Bricks, Black Stone Aggregate, or Murum with desired quantity.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">2</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Provide Site Location</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Specify your Nagpur site address, pincode, and preferred delivery date.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">3</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Receive Delivered Quote</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our operations team calculates exact transport haulage and communicates a fixed price.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">4</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Confirm & Dispatch</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Confirm via WhatsApp or phone. We assign the verified supplier and dedicated truck.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs mb-3">5</div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Site Delivery</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Truck arrives at your site. Material is inspected and unloaded under supervisor direction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trust & Core Value Principles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4">
            <div className="bg-amber-100 text-amber-700 p-3 rounded-2xl h-fit shrink-0">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">Transparent Delivered Pricing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No surprises on arrival. Every quotation includes material sourcing and transport calculated specifically for your construction site pincode in Nagpur.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-amber-100 text-amber-700 p-3 rounded-2xl h-fit shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">Verified Quarry & Kiln Network</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We partner exclusively with verified quarries, brick kilns, and aggregate crushers across Nagpur, ensuring uniform quality and lawful compliance.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-amber-100 text-amber-700 p-3 rounded-2xl h-fit shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">Human-Assisted Operations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Experienced dispatch desk tracking every delivery, coordinating directly with truck drivers and site engineers to prevent costly project delays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Partner Truck Fleet & QR Campaign Section (PRD Section 5 & 16) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl p-6 sm:p-10 border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
              <Truck className="h-3.5 w-3.5" />
              <span>Partner Truck Network</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Direct Quarry-to-Site Haulage in Nagpur
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our managed network coordinates verified third-party tippers and trucks. Look for our partner trucks across Nagpur construction corridors — scan the truck QR code to instantly submit your site requirement!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/get-quote"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl shadow-xs text-xs sm:text-sm flex items-center gap-2"
            >
              <span>Get Delivered Quote</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3 rounded-xl text-xs sm:text-sm"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Nagpur Service Zones */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Active Delivery Service Areas in Nagpur
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              We coordinate material deliveries to construction sites across all major residential, commercial, and industrial corridors.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Wardha Road & Manish Nagar</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Besa, Ghogli & Beltarodi</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Hingna Road & MIDC</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>MIHAN & Butibori Corridors</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Dharampeth & Ramdaspeth</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Civil Lines & Sadar</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Koradi & Kamptee Road</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Wadi & Amravati Road</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
