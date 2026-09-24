import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient.js';
import { Card } from '../components/Card.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<any>('/admin/settings')
      .then((res) => setSettings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Verifying Super Admin access..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Super Admin configuration and system controls.
        </p>
      </div>

      <Card title="System Environment & Constraints" subtitle="Enforcing MVP Guardrails">
        <div className="space-y-3 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">System:</span>
              <span className="font-semibold">{settings?.system || 'Nagpur Building Materials Platform MVP'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Release Version:</span>
              <span className="font-semibold">{settings?.version || '1.0.0-phase0'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Primary Market:</span>
              <span className="font-semibold">{settings?.serviceArea || 'Nagpur'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Pricing Model:</span>
              <span className="font-semibold">{settings?.pricingEngine || 'Manual Quotation First'}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
