import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService.js';
import { Supplier, VerificationStatus } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { formatDate, formatINR } from '../utils/formatters.js';
import { Building2, Plus, CheckCircle2, AlertTriangle, Edit2, Shield } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    mobile_number: '',
    location_address: '',
    service_zones: 'Nagpur and nearby areas',
    supported_materials: ['Sand'],
    verification_status: 'VERIFIED' as VerificationStatus,
    indicative_purchase_price: 0,
    quality_notes: '',
  });

  const loadSuppliers = () => {
    setLoading(true);
    adminService
      .getSuppliers()
      .then((data) => setSuppliers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      business_name: '',
      contact_person: '',
      mobile_number: '',
      location_address: '',
      service_zones: 'Nagpur and nearby areas',
      supported_materials: ['Sand'],
      verification_status: 'VERIFIED',
      indicative_purchase_price: 0,
      quality_notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    let mats = ['Sand'];
    try {
      mats = JSON.parse(sup.supported_materials);
    } catch {}

    setFormData({
      business_name: sup.business_name,
      contact_person: sup.contact_person,
      mobile_number: sup.mobile_number,
      location_address: sup.location_address,
      service_zones: sup.service_zones,
      supported_materials: mats,
      verification_status: sup.verification_status,
      indicative_purchase_price: sup.indicative_purchase_price || 0,
      quality_notes: sup.quality_notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await adminService.updateSupplier(editingSupplier.id, {
          business_name: formData.business_name,
          contact_person: formData.contact_person,
          mobile_number: formData.mobile_number,
          location_address: formData.location_address,
          service_zones: formData.service_zones,
          supported_materials: JSON.stringify(formData.supported_materials) as any,
          verification_status: formData.verification_status,
          indicative_purchase_price: formData.indicative_purchase_price,
          quality_notes: formData.quality_notes,
        });
      } else {
        await adminService.createSupplier({
          ...formData,
          supported_materials: formData.supported_materials,
        });
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers Registry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified quarries, sand sources, and brick kilns in Nagpur ({suppliers.length} registered partners).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Verified Supplier</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading registered suppliers..." />
      ) : suppliers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No suppliers registered yet. Click &quot;Add Verified Supplier&quot; to log partner quarries.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Business / Quarry Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Materials</th>
                  <th className="py-3.5 px-4">Indicative Purchase Price</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{s.business_name}</span>
                      <span className="text-[11px] text-slate-400">Registered: {formatDate(s.created_at)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold block">{s.contact_person}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{s.mobile_number}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{s.location_address}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800">
                        {(() => {
                          try {
                            return JSON.parse(s.supported_materials).join(', ');
                          } catch {
                            return s.supported_materials;
                          }
                        })()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {s.indicative_purchase_price ? (
                        <div>
                          <span>{formatINR(s.indicative_purchase_price)}</span>
                          {s.price_updated_at && (
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Upd: {formatDate(s.price_updated_at)}
                            </span>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          s.verification_status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {s.verification_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSupplier ? `Edit Supplier (${editingSupplier.business_name})` : 'Register Verified Supplier'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business / Quarry Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">10-Digit Mobile Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Indicative Purchase Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.indicative_purchase_price || ''}
                    onChange={(e) => setFormData({ ...formData, indicative_purchase_price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location / Quarry Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.location_address}
                  onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verification Status</label>
                  <select
                    value={formData.verification_status}
                    onChange={(e) => setFormData({ ...formData, verification_status: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supported Materials</label>
                  <select
                    multiple
                    value={formData.supported_materials}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      setFormData({ ...formData, supported_materials: selected });
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 h-20"
                  >
                    <option value="Sand">Sand</option>
                    <option value="Bricks">Bricks</option>
                    <option value="Black Stone / Aggregate">Black Stone / Aggregate</option>
                    <option value="Murum">Murum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quality / Sourcing Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.quality_notes}
                  onChange={(e) => setFormData({ ...formData, quality_notes: e.target.value })}
                  placeholder="e.g. Filtered river sand, certified silt percentage"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {editingSupplier ? 'Save Updates' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
