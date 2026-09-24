import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Truck, PhoneCall, FileText } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
          Managed Delivery Process
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">How Nagpur Materials Works</h1>
        <p className="text-sm text-slate-600 mt-2">
          An asset-light managed delivery marketplace coordinating bulk materials between verified suppliers, third-party trucks, and construction sites.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">1</div>
          <div>
            <h3 className="font-bold text-slate-900">Step 1: Submit Your Requirement</h3>
            <p className="text-xs text-slate-600 mt-1">
              Select one of the 4 core materials (Sand, Bricks, Black Stone Aggregate, Murum), input desired quantity and site location within Nagpur.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">2</div>
          <div>
            <h3 className="font-bold text-slate-900">Step 2: Operations Desk Calculates All-Inclusive Delivered Price</h3>
            <p className="text-xs text-slate-600 mt-1">
              Rather than risky automated estimation, our local Nagpur operations desk calculates material, transport, loading, and distance rates, then communicates a fixed quotation.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">3</div>
          <div>
            <h3 className="font-bold text-slate-900">Step 3: Partner Supplier & Truck Assignment</h3>
            <p className="text-xs text-slate-600 mt-1">
              Upon customer confirmation, we match the order to the closest verified quarry/kiln and coordinate third-party truck dispatch.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">4</div>
          <div>
            <h3 className="font-bold text-slate-900">Step 4: Construction Site Unloading & Confirmation</h3>
            <p className="text-xs text-slate-600 mt-1">
              The truck arrives at the scheduled window. Material is verified and unloaded at the site supervisor's direction. Payment and receipts are closed.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          to="/get-quote"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl shadow-xs text-sm"
        >
          <span>Request a Quote Now</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
