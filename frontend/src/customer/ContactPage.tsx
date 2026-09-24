import React from 'react';
import { APP_CONFIG } from '../config/index.js';
import { Phone, MessageCircle, Mail, MapPin, Clock } from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
          Contact Us
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-3">Operations & Dispatch Desk</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-xl">
          Connect directly with our Nagpur coordination team for urgent deliveries, bulk contractor quotes, or supplier partnerships.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Direct Contact Channels</h3>

          <div className="space-y-4 text-xs">
            <a
              href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              <div>
                <span className="font-bold block">WhatsApp Support (Primary)</span>
                <span>{APP_CONFIG.whatsappNumber}</span>
              </div>
            </a>

            <a
              href={`tel:${APP_CONFIG.phone}`}
              className="flex items-center gap-3 p-3 bg-amber-50 text-amber-900 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <Phone className="h-5 w-5 text-amber-600" />
              <div>
                <span className="font-bold block">Operations Phone</span>
                <span>{APP_CONFIG.phone}</span>
              </div>
            </a>

            <div className="flex items-center gap-3 p-3 bg-slate-50 text-slate-700 rounded-xl">
              <Mail className="h-5 w-5 text-slate-500" />
              <div>
                <span className="font-bold block">Email Inquiries</span>
                <span>{APP_CONFIG.supportEmail}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs text-slate-600">
          <h3 className="text-base font-bold text-slate-900">Operational Hours & Location</h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Dispatch Coordination:</span>
                <span>Monday – Sunday: 7:00 AM – 8:00 PM</span>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Primary Service Zone:</span>
                <span>{APP_CONFIG.serviceArea}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
