import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
        <p><strong>Effective Date:</strong> September 2026</p>
        <p>
          Nagpur Building Materials Platform operates an asset-light building-material marketplace in Nagpur. We value the privacy of our customers, contractors, suppliers, and transport partners.
        </p>
        <h2 className="text-base font-bold text-slate-900 pt-2">1. Information We Collect</h2>
        <p>
          When you request a delivered quotation, we collect customer name, mobile phone number, optional WhatsApp number, delivery address, and site access notes.
        </p>
        <h2 className="text-base font-bold text-slate-900 pt-2">2. Purpose of Collection</h2>
        <p>
          We use this information exclusively to calculate transport distances, communicate delivered price quotations, assign trucks, and coordinate site deliveries.
        </p>
        <h2 className="text-base font-bold text-slate-900 pt-2">3. Data Protection & Sharing</h2>
        <p>
          We do NOT publicly expose customer contact information or site addresses. Driver and truck partners are only provided with the site location necessary to fulfill agreed deliveries.
        </p>
      </div>
    </div>
  );
};
