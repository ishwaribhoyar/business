import React from 'react';
import { Card } from '../components/Card.js';

export const CustomersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Records</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage contractors, builders, engineers, and individual home builders.
        </p>
      </div>

      <Card title="Customer Management Foundation" subtitle="Phase 0 Architecture">
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Customer requests are tied to verified mobile numbers. In compliance with security requirements, customer contact details are protected and only accessible to authenticated Operations staff.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800 block">Customer Entity Attributes:</span>
            <ul className="list-disc list-inside text-slate-500 space-y-0.5 font-mono text-[11px]">
              <li>full_name, mobile_number, whatsapp_number</li>
              <li>delivery_address, area_pincode, map_pin_url</li>
              <li>internal_notes, order_history</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
