import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/index.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import {
  Truck,
  CheckCircle2,
  Shield,
  Users,
  Building2,
  HardHat,
  ArrowRight,
  MapPin,
  Scale,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  usePageMeta(
    'About Our Managed Marketplace',
    'Learn about Nagpur Building Materials: An asset-light managed marketplace coordinating bulk construction materials between verified quarries, partner trucks, and construction sites in Nagpur.'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 mb-3">
          <Building2 className="h-3.5 w-3.5" /> About Nagpur Building Materials
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Modernizing Bulk Construction Logistics in Nagpur
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
          We operate an asset-light managed marketplace connecting construction customers with verified material suppliers and third-party truck owners in Nagpur.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {/* Core Model */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Asset-Light Managed Marketplace Model</h2>
          <p>
            In traditional bulk building material procurement, customers often rely on fragmented phone calls and local traders to source materials. Material pricing and delivered pricing can vary widely depending on transport and site location.
          </p>
          <p>
            As defined in our Business Requirements, our platform operates as an <strong>asset-light managed marketplace</strong>. We do not own inventory or transport fleets. Instead, we coordinate supply through an internal operations desk that connects customers with verified material suppliers and third-party truck owners.
          </p>
        </section>

        {/* Target Segments */}
        <section className="pt-6 border-t border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Target Customers (BRD Section 5)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HardHat className="h-4 w-4 text-amber-600" />
                <span>Civil Contractors</span>
              </div>
              <p className="text-xs text-slate-500">
                Frequent bulk orders and reliable delivery coordination.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Building2 className="h-4 w-4 text-amber-600" />
                <span>Small & Medium Builders</span>
              </div>
              <p className="text-xs text-slate-500">
                Recurring material procurement with transparent delivered quotations.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Scale className="h-4 w-4 text-amber-600" />
                <span>Site Supervisors & Engineers</span>
              </div>
              <p className="text-xs text-slate-500">
                Fast sourcing and direct site coordination.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Users className="h-4 w-4 text-amber-600" />
                <span>Individual House Builders</span>
              </div>
              <p className="text-xs text-slate-500">
                Simple delivered-price ordering without requiring complex accounts.
              </p>
            </div>
          </div>
        </section>

        {/* Operating Principles */}
        <section className="pt-6 border-t border-slate-100 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Operating Principles</h2>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Quotation-First Pricing:</strong> Prices are manually verified and confirmed by our operations desk based on supplier availability and transport distance.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Verified Supplier Network:</strong> Materials are sourced from verified local suppliers.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Human-Assisted Operations:</strong> Our internal operations desk assists with pricing, order dispatch, and delivery status tracking.</span>
            </li>
          </ul>
        </section>

        {/* Service Geography */}
        <section className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block text-xs">Primary Service Geography</span>
              <span className="text-slate-500 text-xs">{APP_CONFIG.serviceArea}</span>
            </div>
          </div>

          <Link
            to="/get-quote"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition-colors shrink-0"
          >
            <span>Request Quote</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
};
