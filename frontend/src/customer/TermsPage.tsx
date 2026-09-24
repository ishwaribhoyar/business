import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
        <p><strong>Effective Date:</strong> September 2026</p>
        <h2 className="text-base font-bold text-slate-900 pt-2">1. Quotation-First Model</h2>
        <p>
          All orders are initiated on a quotation-first basis. Prices are communicated by our operations desk based on material availability and transport distance. Quotations are valid for the period specified in the quotation.
        </p>
        <h2 className="text-base font-bold text-slate-900 pt-2">2. Site Accessibility & Unloading</h2>
        <p>
          The customer is responsible for ensuring the construction site has lawful and physically accessible approach roads for heavy transport vehicles (tippers/trucks).
        </p>
        <h2 className="text-base font-bold text-slate-900 pt-2">3. Material Inspection</h2>
        <p>
          Material must be inspected by the customer or site supervisor prior to unloading. In case of discrepancies in quantity or quality, issues must be raised immediately before the truck departs.
        </p>
      </div>
    </div>
  );
};
