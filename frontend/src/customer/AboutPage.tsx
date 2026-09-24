import React from 'react';
import { APP_CONFIG } from '../config/index.js';
import { Truck, CheckCircle2, Shield, Users } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
          About Nagpur Materials
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-3">Empowering Construction in Nagpur</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          We are building the regional standard for bulk building material procurement, eliminating middlemen ambiguity and fragmented transport coordination.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">Asset-Light Marketplace Model</h2>
        <p>
          In traditional construction procurement, contractors and individual home builders spend hours negotiating with disparate quarries, brick kilns, and individual truck owners. Delivered rates often change upon arrival, and delivery schedules are notoriously unpredictable.
        </p>
        <p>
          Our platform operates on a <strong>managed marketplace model</strong>. We partner directly with verified material producers and third-party truck owners across Nagpur. By coordinating orders centrally through human-assisted operations, we ensure transparent delivered quotations, verified quality, and traceable fulfillment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-bold text-slate-900 text-xs mb-1">Target Customers</h4>
            <p className="text-xs text-slate-500">Civil contractors, small/medium builders, site supervisors, and independent home builders.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-bold text-slate-900 text-xs mb-1">Service Geography</h4>
            <p className="text-xs text-slate-500">{APP_CONFIG.serviceArea}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
