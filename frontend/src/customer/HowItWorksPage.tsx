import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { APP_CONFIG } from '../config/index.js';
import {
  ArrowRight,
  CheckCircle2,
  Truck,
  MessageCircle,
  HelpCircle,
  FileCheck,
  Scale,
  ShieldCheck,
  Clock,
  MapPin,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  usePageMeta(
    'How Delivery Works',
    'Understand the quotation-first building material delivery process in Nagpur: Select material, receive delivered price quote, confirm order, and get site delivery through verified suppliers and trucks.'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">
          <Clock className="h-3 w-3" /> Managed Delivery Model
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How Nagpur Materials Works
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          An asset-light managed marketplace coordinating bulk construction materials between verified suppliers, third-party trucks, and construction sites across Nagpur.
        </p>
      </div>

      {/* 5-Step Process */}
      <div className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-extrabold text-lg">
            1
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Step 1: Submit Your Material Requirement
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Select one of our 4 initial MVP materials (Sand, Bricks, Black Stone Aggregate, or Murum), specify the quantity you need, and provide your construction site address and pincode in Nagpur.
            </p>
            <p className="text-xs text-amber-700 font-medium pt-1">
              ✓ No account or password creation required.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-extrabold text-lg">
            2
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Step 2: Operations Desk Calculates All-Inclusive Delivered Price
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Rather than risky, inaccurate algorithmic pricing, our local Nagpur operations desk checks current quarry/kiln rates, determines the closest lawful source, and calculates exact truck haulage for your pincode.
            </p>
            <p className="text-xs text-amber-700 font-medium pt-1">
              ✓ Prevents unexpected transport surprises or hidden loading charges.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-extrabold text-lg">
            3
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Step 3: Receive Fixed Delivered Quotation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              You receive a formal delivered quotation with a clear breakdown, sent directly via WhatsApp or communicated over the phone by your dedicated operations coordinator.
            </p>
            <p className="text-xs text-amber-700 font-medium pt-1">
              ✓ The quotation is valid for your delivery date and site location.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-extrabold text-lg">
            4
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Step 4: Confirm Order & Dispatch Coordination
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Once you confirm the quotation, our team assigns the nearest verified supplier quarry and schedules a partner truck with a verified driver for loading.
            </p>
            <p className="text-xs text-amber-700 font-medium pt-1">
              ✓ Full lifecycle traceability from loading to dispatch.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-extrabold text-lg">
            5
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Step 5: Construction Site Unloading & Verification
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The truck arrives at your site during the agreed delivery window. Your site supervisor inspects the material quality and volume before tipper unloading. Delivery is confirmed, and commercial records are closed.
            </p>
            <p className="text-xs text-amber-700 font-medium pt-1">
              ✓ On-site verification ensures complete transparency.
            </p>
          </div>
        </div>
      </div>

      {/* Explanatory Callout: Why Quotation-First */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Product Principle</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold">
          Why Quotation-First Instead of Instant Automated E-Commerce?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Bulk construction materials in India cannot be priced like standard consumer goods. Heavy trucks (tippers carrying 2 to 6 brass or 2,000+ bricks) face physical variables that automated algorithms cannot reliably guess:
        </p>
        <ul className="text-xs sm:text-sm text-slate-300 space-y-2 pt-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Road Accessibility:</strong> Narrow lanes, low-hanging overhead cables, or residential weight restrictions dictate whether a 6-wheeler or 10-wheeler can enter.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Quarry Gate Price Volatility:</strong> Raw material rates at regional quarries around Nagpur fluctuate based on seasonal mining and environmental regulations.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Zero Hidden Costs:</strong> By manually verifying vehicle availability and route distance first, we quote a firm price that does not change upon delivery.</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="text-center pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/get-quote"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-xs text-sm transition-colors"
        >
          <span>Request a Delivered Quote Now</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Nagpur%20Materials,%20I%20have%20a%20question%20about%20the%20ordering%20process.`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-xl text-sm transition-colors"
        >
          <MessageCircle className="h-4 w-4 text-emerald-600" />
          <span>Chat with Operations Desk</span>
        </a>
      </div>
    </div>
  );
};
