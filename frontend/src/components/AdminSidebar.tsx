import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Building2,
  Truck,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Layers,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Catalog & Variants', path: '/admin/catalog', icon: Layers },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Suppliers', path: '/admin/suppliers', icon: Building2 },
    { label: 'Trucks / Drivers', path: '/admin/trucks', icon: Truck },
    { label: 'Quotations', path: '/admin/quotations', icon: FileText },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen text-slate-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800">
        <div className="bg-amber-600 text-white p-1.5 rounded-lg">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight leading-tight">Operations Portal</h2>
          <span className="text-[10px] text-amber-500 font-medium">Nagpur Delivery MVP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-400">Human-Assisted Ops</p>
        <p>No automated driver/supplier apps</p>
      </div>
    </aside>
  );
};
