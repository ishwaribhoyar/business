import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService.js';
import { Truck, Driver, VerificationStatus, AvailabilityStatus } from '../types/index.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { formatINR } from '../utils/formatters.js';
import { Truck as TruckIcon, User, Plus, CheckCircle2, AlertTriangle, Edit2, Shield, Phone, MessageCircle } from 'lucide-react';

const COMMON_MATERIALS = ['Sand', 'Aggregates', 'Bricks', 'Cement', 'TMT Steel'];

export const TrucksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trucks' | 'drivers'>('trucks');
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Truck Modal State
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [truckForm, setTruckForm] = useState({
    registration_number: '',
    capacity_tons: 10,
    owner_name: '',
    owner_mobile: '',
    default_driver_id: '',
    supported_materials: ['Sand', 'Aggregates'],
    verification_status: 'VERIFIED' as VerificationStatus,
    availability_status: 'Available' as AvailabilityStatus,
    indicative_transport_rate: 0,
    notes: '',
  });

  // Driver Modal State
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverForm, setDriverForm] = useState({
    full_name: '',
    mobile_number: '',
    license_number: '',
    verification_status: 'VERIFIED' as VerificationStatus,
    availability_status: 'Available' as AvailabilityStatus,
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trucksData, driversData] = await Promise.all([
        adminService.getTrucks(),
        adminService.getDrivers(),
      ]);
      setTrucks(trucksData);
      setDrivers(driversData);
    } catch (err: any) {
      setError(err.message || 'Failed to load transport registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Truck Handlers
  const handleOpenCreateTruck = () => {
    setEditingTruck(null);
    setActionError(null);
    setTruckForm({
      registration_number: '',
      capacity_tons: 10,
      owner_name: '',
      owner_mobile: '',
      default_driver_id: drivers[0]?.id || '',
      supported_materials: ['Sand', 'Aggregates'],
      verification_status: 'VERIFIED',
      availability_status: 'Available',
      indicative_transport_rate: 0,
      notes: '',
    });
    setShowTruckModal(true);
  };

  const handleOpenEditTruck = (truck: Truck) => {
    setEditingTruck(truck);
    setActionError(null);
    let mats = ['Sand'];
    try {
      mats = JSON.parse(truck.supported_materials);
    } catch {
      mats = [truck.supported_materials];
    }
    setTruckForm({
      registration_number: truck.registration_number,
      capacity_tons: truck.capacity_tons,
      owner_name: truck.owner_name,
      owner_mobile: truck.owner_mobile,
      default_driver_id: truck.default_driver_id || '',
      supported_materials: mats,
      verification_status: truck.verification_status,
      availability_status: truck.availability_status,
      indicative_transport_rate: truck.indicative_transport_rate || 0,
      notes: truck.notes || '',
    });
    setShowTruckModal(true);
  };

  const handleTruckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      if (editingTruck) {
        await adminService.updateTruck(editingTruck.id, {
          registration_number: truckForm.registration_number,
          capacity_tons: Number(truckForm.capacity_tons),
          owner_name: truckForm.owner_name,
          owner_mobile: truckForm.owner_mobile,
          default_driver_id: truckForm.default_driver_id || undefined,
          supported_materials: JSON.stringify(truckForm.supported_materials) as any,
          verification_status: truckForm.verification_status,
          availability_status: truckForm.availability_status,
          indicative_transport_rate: truckForm.indicative_transport_rate ? Number(truckForm.indicative_transport_rate) : undefined,
          notes: truckForm.notes,
        });
      } else {
        await adminService.createTruck({
          registration_number: truckForm.registration_number,
          capacity_tons: Number(truckForm.capacity_tons),
          owner_name: truckForm.owner_name,
          owner_mobile: truckForm.owner_mobile,
          default_driver_id: truckForm.default_driver_id || undefined,
          supported_materials: truckForm.supported_materials,
          verification_status: truckForm.verification_status,
          availability_status: truckForm.availability_status,
          indicative_transport_rate: truckForm.indicative_transport_rate ? Number(truckForm.indicative_transport_rate) : undefined,
          notes: truckForm.notes,
        });
      }
      setShowTruckModal(false);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save vehicle partner');
    } finally {
      setSaving(false);
    }
  };

  // Driver Handlers
  const handleOpenCreateDriver = () => {
    setEditingDriver(null);
    setActionError(null);
    setDriverForm({
      full_name: '',
      mobile_number: '',
      license_number: '',
      verification_status: 'VERIFIED',
      availability_status: 'Available',
      notes: '',
    });
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setActionError(null);
    setDriverForm({
      full_name: driver.full_name,
      mobile_number: driver.mobile_number,
      license_number: driver.license_number || '',
      verification_status: driver.verification_status,
      availability_status: driver.availability_status,
      notes: driver.notes || '',
    });
    setShowDriverModal(true);
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      if (editingDriver) {
        await adminService.updateDriver(editingDriver.id, {
          full_name: driverForm.full_name,
          mobile_number: driverForm.mobile_number,
          license_number: driverForm.license_number,
          verification_status: driverForm.verification_status,
          availability_status: driverForm.availability_status,
          notes: driverForm.notes,
        });
      } else {
        await adminService.createDriver({
          full_name: driverForm.full_name,
          mobile_number: driverForm.mobile_number,
          license_number: driverForm.license_number,
          verification_status: driverForm.verification_status,
          availability_status: driverForm.availability_status,
          notes: driverForm.notes,
        });
      }
      setShowDriverModal(false);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save driver partner');
    } finally {
      setSaving(false);
    }
  };

  const getDriverName = (driverId?: string | null) => {
    if (!driverId) return 'None (Dynamic Assignment)';
    const d = drivers.find((drv) => drv.id === driverId);
    return d ? `${d.full_name} (${d.mobile_number})` : driverId;
  };

  const availableTrucksCount = trucks.filter((t) => t.availability_status === 'Available' && t.is_active).length;
  const availableDriversCount = drivers.filter((d) => d.availability_status === 'Available' && d.is_active).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner message="Loading transport fleet and drivers..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Logistics & Fleet Partners</h1>
          <p className="text-xs text-slate-500 mt-1">
            Third-party vehicle partners and decoupled driver registry in Nagpur.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'trucks' ? (
            <button
              onClick={handleOpenCreateTruck}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Partner Truck
            </button>
          ) : (
            <button
              onClick={handleOpenCreateDriver}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Partner Driver
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TruckIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Fleet Trucks</span>
            <span className="text-xl font-bold text-slate-900">{trucks.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Available Trucks</span>
            <span className="text-xl font-bold text-slate-900">{availableTrucksCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Drivers</span>
            <span className="text-xl font-bold text-slate-900">{drivers.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Available Drivers</span>
            <span className="text-xl font-bold text-slate-900">{availableDriversCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('trucks')}
            className={`py-3 px-1 border-b-2 font-medium text-xs flex items-center gap-2 transition ${
              activeTab === 'trucks'
                ? 'border-amber-500 text-amber-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <TruckIcon className="w-4 h-4" />
            Partner Trucks ({trucks.length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`py-3 px-1 border-b-2 font-medium text-xs flex items-center gap-2 transition ${
              activeTab === 'drivers'
                ? 'border-amber-500 text-amber-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            Partner Drivers ({drivers.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: TRUCKS */}
      {activeTab === 'trucks' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="p-3.5 pl-4">Vehicle Reg No</th>
                  <th className="p-3.5">Capacity</th>
                  <th className="p-3.5">Owner & Contact</th>
                  <th className="p-3.5">Default Driver</th>
                  <th className="p-3.5">Materials</th>
                  <th className="p-3.5">Transport Rate</th>
                  <th className="p-3.5">Availability</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trucks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No partner trucks found. Click "Add Partner Truck" to register third-party fleet.
                    </td>
                  </tr>
                ) : (
                  trucks.map((truck) => {
                    let mats: string[] = [];
                    try {
                      mats = JSON.parse(truck.supported_materials);
                    } catch {
                      mats = [truck.supported_materials];
                    }

                    return (
                      <tr key={truck.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-900">
                          {truck.registration_number}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">
                          {truck.capacity_tons} Tons
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-900">{truck.owner_name}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[11px]">
                            <a
                              href={`tel:${truck.owner_mobile}`}
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              {truck.owner_mobile}
                            </a>
                            <a
                              href={`https://wa.me/91${truck.owner_mobile}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {getDriverName(truck.default_driver_id)}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {mats.map((m, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-800">
                          {truck.indicative_transport_rate
                            ? `${formatINR(truck.indicative_transport_rate)}`
                            : '—'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              truck.availability_status === 'Available'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : truck.availability_status === 'Busy'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {truck.availability_status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              truck.verification_status === 'VERIFIED'
                                ? 'bg-blue-50 text-blue-700'
                                : truck.verification_status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {truck.verification_status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <button
                            onClick={() => handleOpenEditTruck(truck)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition"
                            title="Edit Vehicle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVERS */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="p-3.5 pl-4">Driver Name</th>
                  <th className="p-3.5">Mobile Number</th>
                  <th className="p-3.5">License Number</th>
                  <th className="p-3.5">Availability</th>
                  <th className="p-3.5">Verification</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No partner drivers found. Click "Add Partner Driver" to register drivers.
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 pl-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px]">
                          {driver.full_name.charAt(0)}
                        </div>
                        {driver.full_name}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                          <a
                            href={`tel:${driver.mobile_number}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {driver.mobile_number}
                          </a>
                          <a
                            href={`https://wa.me/91${driver.mobile_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {driver.license_number || '—'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            driver.availability_status === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : driver.availability_status === 'Busy'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {driver.availability_status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            driver.verification_status === 'VERIFIED'
                              ? 'bg-blue-50 text-blue-700'
                              : driver.verification_status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {driver.verification_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">
                        {driver.notes || '—'}
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <button
                          onClick={() => handleOpenEditDriver(driver)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition"
                          title="Edit Driver"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TRUCK CREATE / EDIT MODAL */}
      {showTruckModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingTruck ? 'Edit Partner Truck' : 'Add Partner Truck'}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Maintain vehicle payload capacity, owner contacts, and materials.
            </p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleTruckSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH 31 AB 1234"
                    value={truckForm.registration_number}
                    onChange={(e) => setTruckForm({ ...truckForm, registration_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Capacity (Tons) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    placeholder="e.g. 10"
                    value={truckForm.capacity_tons}
                    onChange={(e) => setTruckForm({ ...truckForm, capacity_tons: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Vehicle owner full name"
                    value={truckForm.owner_name}
                    onChange={(e) => setTruckForm({ ...truckForm, owner_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Owner Mobile (10-digit) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={truckForm.owner_mobile}
                    onChange={(e) => setTruckForm({ ...truckForm, owner_mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Default Assigned Driver</label>
                <select
                  value={truckForm.default_driver_id}
                  onChange={(e) => setTruckForm({ ...truckForm, default_driver_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">None (Dynamic Trip Assignment)</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.mobile_number}) — {d.availability_status}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Assigning a default driver auto-populates dispatch during order assignment.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Supported Materials *</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {COMMON_MATERIALS.map((mat) => {
                    const isSelected = truckForm.supported_materials.includes(mat);
                    return (
                      <button
                        type="button"
                        key={mat}
                        onClick={() => {
                          const next = isSelected
                            ? truckForm.supported_materials.filter((m) => m !== mat)
                            : [...truckForm.supported_materials, mat];
                          setTruckForm({ ...truckForm, supported_materials: next });
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                          isSelected
                            ? 'bg-amber-500 border-amber-600 text-slate-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {mat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Availability</label>
                  <select
                    value={truckForm.availability_status}
                    onChange={(e) => setTruckForm({ ...truckForm, availability_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Verification</label>
                  <select
                    value={truckForm.verification_status}
                    onChange={(e) => setTruckForm({ ...truckForm, verification_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Indicative Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2500"
                    value={truckForm.indicative_transport_rate || ''}
                    onChange={(e) =>
                      setTruckForm({ ...truckForm, indicative_transport_rate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes about vehicle fitness, preferred routes, etc."
                  value={truckForm.notes}
                  onChange={(e) => setTruckForm({ ...truckForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTruckModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || truckForm.supported_materials.length === 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition"
                >
                  {saving ? 'Saving...' : editingTruck ? 'Update Truck' : 'Add Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER CREATE / EDIT MODAL */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingDriver ? 'Edit Partner Driver' : 'Add Partner Driver'}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Register commercial driver partner for order fulfillment.
            </p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleDriverSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={driverForm.full_name}
                  onChange={(e) => setDriverForm({ ...driverForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mobile Number (10-digit) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={driverForm.mobile_number}
                    onChange={(e) => setDriverForm({ ...driverForm, mobile_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Driving License No</label>
                  <input
                    type="text"
                    placeholder="MH31 20180012345"
                    value={driverForm.license_number}
                    onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Availability</label>
                  <select
                    value={driverForm.availability_status}
                    onChange={(e) => setDriverForm({ ...driverForm, availability_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Verification</label>
                  <select
                    value={driverForm.verification_status}
                    onChange={(e) => setDriverForm({ ...driverForm, verification_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Reliability, shift preference, experience with heavy materials..."
                  value={driverForm.notes}
                  onChange={(e) => setDriverForm({ ...driverForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition"
                >
                  {saving ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
