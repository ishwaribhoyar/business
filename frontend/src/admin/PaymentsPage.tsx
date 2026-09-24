import React from 'react';
import { Card } from '../components/Card.js';

export const PaymentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Financial Records</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track payment status and order-level gross margins.
        </p>
      </div>

      <Card title="Payment Status Architecture" subtitle="Human-assisted offline & bank recording">
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            The MVP supports tracking payment methods (Cash, UPI, Bank Transfer, Cheque) and status:
            <strong> Pending, Partially Paid, Paid, Refunded</strong>.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800 block">Unit Economics & Financial Tracking:</span>
            <ul className="list-disc list-inside text-slate-500 space-y-0.5 font-mono text-[11px]">
              <li>actual_revenue</li>
              <li>actual_material_cost, actual_transport_cost, other_direct_costs</li>
              <li>actual_gross_margin = revenue - direct_costs</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
