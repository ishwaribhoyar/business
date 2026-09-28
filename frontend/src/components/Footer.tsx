import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/index.js';
import { Truck, MapPin, Phone, Mail, MessageCircle, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100 text-slate-700 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Company & Model */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-amber-600 text-white p-2 rounded-lg shadow-xs">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                  Nagpur Materials
                </span>
                <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider block">
                  Managed Marketplace
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Managed building-material marketplace coordinating bulk sand, bricks, stone aggregate, and murum delivery directly to construction sites across Nagpur.
            </p>
            <div className="text-xs text-slate-600 flex items-center gap-2 pt-1">
              <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-medium">{APP_CONFIG.serviceArea}</span>
            </div>
          </div>

          {/* Authoritative MVP Materials */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Materials Catalog
            </h4>
            <ul className="space-y-2 text-xs">
              {APP_CONFIG.mvpMaterials.map((mat) => (
                <li key={mat.id}>
                  <Link
                    to={`/products/${mat.slug}`}
                    className="text-slate-600 hover:text-amber-700 font-medium transition-colors"
                  >
                    {mat.name} <span className="text-slate-400 font-normal">({mat.unit})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/get-quote" className="text-slate-600 hover:text-amber-700 font-medium transition-colors">
                  Request Delivered Quote
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-600 hover:text-amber-700 font-medium transition-colors">
                  How Delivery Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-600 hover:text-amber-700 font-medium transition-colors">
                  About Our Network
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-600 hover:text-amber-700 font-medium transition-colors">
                  Contact Operations Desk
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-slate-500 hover:text-slate-800 transition-colors">
                  Internal Operations Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Operations Desk
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600">
              <p>
                <a
                  href={`tel:${APP_CONFIG.phone}`}
                  className="flex items-center gap-2 hover:text-slate-900 font-medium"
                >
                  <Phone className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>{APP_CONFIG.phone}</span>
                </a>
              </p>
              <p>
                <a
                  href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Nagpur%20Materials,%20I%20need%20a%20delivered%20quotation.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>WhatsApp: {APP_CONFIG.whatsappNumber}</span>
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${APP_CONFIG.supportEmail}`}
                  className="flex items-center gap-2 hover:text-slate-900 font-medium"
                >
                  <Mail className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>{APP_CONFIG.supportEmail}</span>
                </a>
              </p>
              <div className="p-3 bg-white rounded-xl border border-slate-200 mt-2 text-[11px] text-slate-500 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Delivered price calculated per request based on site distance and vehicle access.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Nagpur Building Materials Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-slate-800 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-800 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
