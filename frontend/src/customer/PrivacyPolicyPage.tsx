import React from 'react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { ShieldCheck, Lock, EyeOff, FileText } from 'lucide-react';
import { APP_CONFIG } from '../config/index.js';

export const PrivacyPolicyPage: React.FC = () => {
  usePageMeta(
    'Privacy Policy',
    'Learn how Nagpur Building Materials protects customer data, contact numbers, and construction site delivery details in accordance with our asset-light marketplace principles.'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 mb-3">
          <Lock className="h-3.5 w-3.5" /> Data Protection Principles
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">Effective Date: September 2026 | Nagpur, India</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs text-xs sm:text-sm text-slate-700 space-y-6 leading-relaxed">
        <p>
          Nagpur Building Materials Platform operates an asset-light building-material marketplace coordinating bulk material procurement and delivery in Nagpur and nearby areas. We are committed to protecting the privacy, contact information, and commercial data of our customers, contractors, suppliers, and transport partners.
        </p>

        <section className="space-y-2 pt-2 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Information We Collect</h2>
          <p>
            To calculate delivered pricing and fulfill material deliveries, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Customer Contact Details:</strong> Name or firm name, 10-digit mobile number, and optional WhatsApp number.</li>
            <li><strong>Delivery Site Coordinates:</strong> Physical site address, nearest landmarks, Nagpur area pincode, and optional GPS map reference links.</li>
            <li><strong>Material Specifications:</strong> Selected material type, quantity, preferred delivery schedule, and site access notes.</li>
          </ul>
          <p className="text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
            ✓ <strong>No Complex Account Creation:</strong> We do not require customers to create accounts, passwords, or link financial payment cards to submit quotation requests.
          </p>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Purpose & Use of Data</h2>
          <p>Collected information is used strictly to:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Calculate haulage distance from the closest verified quarry or brick kiln.</li>
            <li>Communicate firm delivered quotations and updates via WhatsApp or voice calls.</li>
            <li>Assign and coordinate partner trucks and verified drivers for physical site delivery.</li>
            <li>Maintain internal audit and regulatory records of completed deliveries and payments.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Protection of Customer Data & No Public Exposure</h2>
          <p>
            In accordance with our core product principles:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>We do NOT expose customer directories or order histories publicly.</li>
            <li>Customer phone numbers and physical site locations are masked and sanitized in public logs.</li>
            <li>Driver and transport partners only receive the physical site address and contact details strictly required to navigate and unload agreed deliveries.</li>
            <li>We do NOT sell, rent, or trade your contact information to third-party telemarketers.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">4. Data Retention & Contact</h2>
          <p>
            Commercial delivery records are maintained securely for operational accounting and warranty/dispute resolution. If you wish to inquire about your data or request deletion of inactive contact records, reach our operations desk at:
          </p>
          <p className="font-semibold text-slate-800">
            Email: {APP_CONFIG.supportEmail} | Operations Desk: {APP_CONFIG.phone}
          </p>
        </section>
      </div>
    </div>
  );
};
