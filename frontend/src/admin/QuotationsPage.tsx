import React from 'react';
import { Card } from '../components/Card.js';

export const QuotationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manual quotation-first pricing snapshots and validity tracking.
        </p>
      </div>

      <Card title="Quotation-First Pricing Architecture" subtitle="Protection Against Market Price Volatility">
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            In accordance with PRD principles, algorithmic or dynamic pricing is strictly avoided in MVP. Admin enters or confirms material costs, transport costs, and platform fees to freeze an immutable quotation snapshot for the customer.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800 block">Quotation Snapshot Fields:</span>
            <ul className="list-disc list-inside text-slate-500 space-y-0.5 font-mono text-[11px]">
              <li>quotation_reference, order_id, validity_date</li>
              <li>material_cost, transport_cost, loading_cost, platform_fee</li>
              <li>discount, final_delivered_price, estimated_gross_margin</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
