import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../config/index.js';
import { Phone, MessageCircle, Menu, X, Truck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Materials', path: '/products' },
    { label: 'Get Quote', path: '/get-quote' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/get-quote') {
      return location.pathname === '/get-quote' || location.pathname === '/order';
    }
    if (path === '/products') {
      return location.pathname.startsWith('/products');
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-amber-600 text-white p-2 rounded-lg shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight block leading-tight">
                Nagpur Materials
              </span>
              <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider block">
                Direct Site Delivery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-amber-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Direct WhatsApp & Phone CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={`tel:${APP_CONFIG.phone}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200"
            >
              <Phone className="h-3.5 w-3.5 text-amber-600" />
              <span>{APP_CONFIG.phone}</span>
            </a>
            <a
              href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Nagpur%20Materials,%20I%20need%20a%20quotation%20for%20construction%20materials.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg shadow-xs transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
              aria-label="WhatsApp Us"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive(link.path)
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={`tel:${APP_CONFIG.phone}`}
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-800"
            >
              <Phone className="h-4 w-4 text-amber-600" />
              Call Operations: {APP_CONFIG.phone}
            </a>
            <a
              href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Nagpur%20Materials,%20I%20need%20a%20quotation.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg"
            >
              <MessageCircle className="h-4 w-4" />
              Direct WhatsApp Support
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
