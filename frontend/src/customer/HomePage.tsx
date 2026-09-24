import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/index.js';
import { Truck, ShieldCheck, Clock, Calculator, ArrowRight, MessageCircle } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-8 sm:p-14 border border-slate-700 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <span>📍 Serving {APP_CONFIG.serviceArea}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Bulk Construction Materials Delivered Directly to Your Site.
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Order Sand, Bricks, Black Stone Aggregate, and Murum with transparent delivered pricing. No hidden transport costs. Verified suppliers and dedicated truck coordination across Nagpur.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/get-quote"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <span>Request Delivered Quote</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Nagpur%20Materials,%20I%20need%20a%20delivered%20quotation.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Operations</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core MVP Materials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Initial MVP Materials</h2>
          <p className="text-sm text-slate-600 mt-2">
            Verified local supply sources in Nagpur with managed truck delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {APP_CONFIG.mvpMaterials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Bulk {mat.unit}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3">{mat.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Direct quarry & manufacturer dispatch with verified quality inspection.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/products/${mat.slug}`}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  View Details
                </Link>
                <Link
                  to={`/get-quote?material=${mat.id}`}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  Get Quote →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. How It Works (4-Step Process) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-100/70 rounded-3xl py-12 px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How Delivery Works</h2>
          <p className="text-sm text-slate-600 mt-2">
            Simple 4-step quotation-first workflow designed for builders and site engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold mx-auto mb-3">1</div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Select Material</h4>
            <p className="text-xs text-slate-500">Choose quantity and specify your construction site location in Nagpur.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold mx-auto mb-3">2</div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Receive Delivered Quote</h4>
            <p className="text-xs text-slate-500">Our operations team verifies transport & calculates an all-inclusive delivered price.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold mx-auto mb-3">3</div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Confirm & Dispatch</h4>
            <p className="text-xs text-slate-500">Confirm over WhatsApp or phone; we assign verified suppliers and partner trucks.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold mx-auto mb-3">4</div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Site Delivery</h4>
            <p className="text-xs text-slate-500">Truck arrives at your site on scheduled date with delivery confirmation.</p>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Nagpur Materials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4">
            <div className="bg-amber-100 text-amber-700 p-3 rounded-xl h-fit">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Transparent Delivered Pricing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No unexpected haulage fees. Every quotation is confirmed with exact transport and loading calculated for your pin code.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-amber-100 text-amber-700 p-3 rounded-xl h-fit">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Verified Supplier Network</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We work exclusively with lawful, quality-checked quarries and brick kilns across Nagpur district.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-amber-100 text-amber-700 p-3 rounded-xl h-fit">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Reliable Site Coordination</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated operational team tracking truck dispatch and coordinating directly with site supervisors.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
