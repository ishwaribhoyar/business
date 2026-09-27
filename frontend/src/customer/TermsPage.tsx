import React from 'react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { FileText, Scale, CheckCircle2, AlertTriangle } from 'lucide-react';
import { APP_CONFIG } from '../config/index.js';

export const TermsPage: React.FC = () => {
  usePageMeta(
    'Terms of Service',
    'Review terms of service for Nagpur Building Materials: Quotation-first ordering, site road accessibility, material unloading inspection, and commercial terms in Nagpur.'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 mb-3">
          <Scale className="h-3.5 w-3.5" /> Commercial Terms
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1">Effective Date: September 2026 | Nagpur, India</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs text-xs sm:text-sm text-slate-700 space-y-6 leading-relaxed">
        <p>
          These Terms of Service govern all requests, delivered quotations, and coordinated deliveries facilitated by <strong>Nagpur Building Materials Platform</strong> within Nagpur and surrounding serviceable areas.
        </p>

        <section className="space-y-2 pt-2 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Quotation-First Model & Price Snapshots
          </h2>
          <p>
            All material requirements submitted on this website are accepted on a quotation-first basis. The submission of a quote request does NOT constitute a confirmed contract or guarantee delivery until:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Our operations team verifies quarry availability and calculates exact vehicle haulage.</li>
            <li>A firm delivered quotation with an explicit validity period is communicated to you.</li>
            <li>You confirm acceptance of the quotation via WhatsApp, phone, or electronic confirmation.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            2. Site Accessibility, Approach Roads & Permissions
          </h2>
          <p>
            Bulk construction materials are transported by heavy commercial vehicles (tippers and multi-axle trucks). It is the customer's responsibility to ensure that:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>The approach road to the construction site has lawful vehicular access and sufficient clearance (width, height, turning radius) for the scheduled truck type.</li>
            <li>The site has adequate designated space for safe unloading and vehicle maneuvering without damaging municipal infrastructure or neighboring properties.</li>
            <li>Any required local municipal permissions, daytime heavy vehicle entry passes, or colony gate entry permissions are secured in advance.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            3. On-Site Material Inspection & Acceptance
          </h2>
          <p>
            Reliability and transparency are fundamental to our marketplace:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>The customer or authorized site supervisor must be present at the site upon vehicle arrival.</li>
            <li>Material quantity (measured in standard Brass or Brick pieces) and visible quality specifications must be inspected <strong>prior to tipper unloading</strong>.</li>
            <li>Any visible discrepancies in grade, cleanliness, or volume must be communicated immediately to our operations desk while the vehicle remains at the site.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            4. Payment Terms & Settlement
          </h2>
          <p>
            In the MVP operating model, payment methods, advance requirements, and balance settlements are agreed upon during quotation confirmation. Payment records are maintained in our central operations system.
          </p>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            5. Jurisdiction
          </h2>
          <p>
            Any disputes arising out of delivery coordination or transactions shall be subject to the exclusive jurisdiction of the competent courts in Nagpur, Maharashtra.
          </p>
        </section>
      </div>
    </div>
  );
};
