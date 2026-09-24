import React from 'react';
import { Card } from '../components/Card.js';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Business KPIs and offline truck QR campaign tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Authoritative PRD Operational Metrics" subtitle="Scheduled for Phase 1-2 reporting">
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Orders by Material:</span>
              <span className="font-semibold text-slate-800">Identify demand trends across 4 MVP materials</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Orders by Nagpur Area:</span>
              <span className="font-semibold text-slate-800">Identify profitable & high-demand delivery zones</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Quote-to-Order Conversion:</span>
              <span className="font-semibold text-slate-800">Measure sales effectiveness</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Gross Margin per Order:</span>
              <span className="font-semibold text-slate-800">Track unit economics post direct transport</span>
            </li>
          </ul>
        </Card>

        <Card title="Truck QR Campaign Tracking" subtitle="Offline to online lead attribution">
          <div className="text-xs text-slate-600 space-y-2">
            <p>
              Each partner truck with branded vinyl panels is assigned a unique QR campaign code (e.g. <code>?qr=TRUCK_01</code>).
            </p>
            <p>
              The system attributes scan counts and inbound quote requests to specific partner trucks, measuring offline marketing ROI without expensive telematics.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
