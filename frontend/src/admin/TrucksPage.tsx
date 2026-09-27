import React from 'react';
import { Card } from '../components/Card.js';

export const TrucksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trucks & Drivers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Third-party vehicle partners and driver registry in Nagpur (Admin managed).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Partner Trucks Fleet" subtitle="Asset-Light Vehicle Registry">
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Third-party trucks operating in Nagpur. Vehicles can have a default assigned driver or dynamic driver assignment per trip/order.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="font-semibold text-slate-800 block">Truck Attributes:</span>
              <ul className="list-disc list-inside text-slate-500 space-y-0.5 font-mono text-[11px]">
                <li>registration_number, capacity_tons</li>
                <li>supported_materials (JSON list)</li>
                <li>owner_name, owner_mobile</li>
                <li>default_driver_id (Foreign Key to Drivers)</li>
                <li>availability_status: Available | Busy | Offline</li>
                <li>indicative_transport_rate, verification_status</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card title="Driver Registry" subtitle="Decoupled Driver Partner Profiles">
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Drivers are managed independently, enabling drivers to operate multiple trucks and allowing order dispatch to track specific drivers on each trip.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="font-semibold text-slate-800 block">Driver Attributes:</span>
              <ul className="list-disc list-inside text-slate-500 space-y-0.5 font-mono text-[11px]">
                <li>full_name, mobile_number, license_number</li>
                <li>verification_status: VERIFIED | PENDING | REJECTED</li>
                <li>availability_status: Available | Busy | Offline</li>
                <li>notes, is_active, order trip history</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
