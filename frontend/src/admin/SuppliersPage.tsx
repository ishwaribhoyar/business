import React from 'react';
import { Card } from '../components/Card.js';

export const SuppliersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers Registry</h1>
        <p className="text-xs text-slate-500 mt-1">
          Quarry and brick manufacturing partners in Nagpur (Admin managed).
        </p>
      </div>

      <Card title="Asset-Light Supplier Model" subtitle="Managed Operations without Supplier Portal">
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Suppliers do not receive separate portal logins in the MVP. Instead, verified quarries and brick manufacturers are recorded by Admin with indicative purchase prices, update timestamps, and fulfillment track records.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800 block">Supplier Registry Fields:</span>
            <ul className="list-disc list-inside text-slate-500 space-y-0.5 font-mono text-[11px]">
              <li>business_name, contact_person, mobile_number, location_address</li>
              <li>service_zones, supported_materials, verification_status</li>
              <li>indicative_purchase_price, price_updated_at, quality_notes</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
