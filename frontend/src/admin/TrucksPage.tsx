import React from 'react';
import { Card } from '../components/Card.js';

export const TrucksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trucks & Drivers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Third-party vehicle partners and fleet availability in Nagpur.
        </p>
      </div>

      <Card title="Partner Logistics Logistics Network" subtitle="No Driver App Required in MVP">
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Trucks and drivers are managed directly by the platform operations desk. No driver application or GPS tracking is required in MVP.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800 block">Fleet & Driver Attributes:</span>
            <ul className="list-disc list-inside text-slate-500 space-y-0.5 font-mono text-[11px]">
              <li>registration_number, capacity_tons, supported_materials</li>
              <li>owner_name, owner_mobile, driver_name, driver_mobile</li>
              <li>availability_status: Available | Busy | Offline</li>
              <li>indicative_transport_rate, verification_status</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
