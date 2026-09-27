import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/index.js';
import { Truck, MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company & Model */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-amber-600 text-white p-1.5 rounded-md">
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Nagpur Materials</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Managed building-material marketplace coordinating bulk sand, bricks, aggregate, and murum delivery directly to construction sites in Nagpur.
            </p>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
              <span>{APP_CONFIG.serviceArea}</span>
            </div>
          </div>

          {/* Authoritative MVP Materials */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Materials</h4>
            <ul className="space-y-2 text-xs">
              {APP_CONFIG.mvpMaterials.map((mat) => (
                <li key={mat.id}>
                  <Link to={`/products/${mat.slug}`} className="hover:text-amber-400 transition-colors">
                    {mat.name} ({mat.unit})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/get-quote" className="hover:text-amber-400 transition-colors">
                  Request Delivered Quote
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-amber-400 transition-colors">
                  How Delivery Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-400 transition-colors">
                  About Our Network
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition-colors">
                  Contact Operations
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-slate-500 hover:text-slate-400 transition-colors">
                  Operations Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Operations Desk</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-amber-500" />
                <span>{APP_CONFIG.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-amber-500" />
                <span>{APP_CONFIG.supportEmail}</span>
              </p>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                Delivered price calculated per request based on site location.
              </p>
            </div>
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Nagpur Building Materials Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-400">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-400">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
