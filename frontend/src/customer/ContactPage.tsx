import React, { useState } from 'react';
import { APP_CONFIG } from '../config/index.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Send,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  usePageMeta(
    'Contact Operations Desk',
    'Contact Nagpur Building Materials operations desk for material quotation requests, truck dispatch status, contractor partnerships, or supplier registration in Nagpur.'
  );

  const [inquiryType, setInquiryType] = useState('Quote Request');
  const [siteArea, setSiteArea] = useState('');
  const [userNote, setUserNote] = useState('');

  const generateWhatsAppUrl = () => {
    let msg = `Hello Nagpur Materials Operations Desk.`;
    if (inquiryType) msg += ` Inquiry: ${inquiryType}.`;
    if (siteArea) msg += ` Site Location: ${siteArea}.`;
    if (userNote) msg += ` Details: ${userNote}`;
    return `https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 mb-3">
          <Phone className="h-3.5 w-3.5" /> Operations & Dispatch Desk
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Connect with Our Nagpur Team
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
          Reach our human-assisted operations desk for urgent material deliveries, contractor bulk quotations, partner truck inquiries, or quarry registrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct Channels */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900">Direct Contact Channels</h2>

          <div className="space-y-3.5 text-xs">
            <a
              href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Nagpur%20Materials,%20I%20have%20an%20inquiry.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-sm block">WhatsApp Operations (Primary)</span>
                <span className="text-emerald-700">{APP_CONFIG.whatsappNumber}</span>
                <span className="text-[11px] text-emerald-600 block mt-0.5">Fastest response for delivered quotes & site dispatch</span>
              </div>
            </a>

            <a
              href={`tel:${APP_CONFIG.phone}`}
              className="flex items-center gap-3.5 p-4 bg-amber-50 text-amber-900 rounded-2xl border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Phone className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-sm block">Direct Phone Line</span>
                <span className="text-amber-800">{APP_CONFIG.phone}</span>
                <span className="text-[11px] text-amber-700 block mt-0.5">Voice calls during operations hours</span>
              </div>
            </a>

            <div className="flex items-center gap-3.5 p-4 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200">
              <Mail className="h-6 w-6 text-slate-500 shrink-0" />
              <div>
                <span className="font-bold text-sm block text-slate-900">Operations Email</span>
                <span>{APP_CONFIG.supportEmail}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Commercial proposals & formal vendor communications</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Schedule & Quick WhatsApp Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 text-xs text-slate-600">
            <h2 className="text-base font-bold text-slate-900">Operating Hours & Service Zone</h2>
            <div className="space-y-3.5">
              <div className="flex gap-3 items-start">
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Dispatch & Coordination Hours:</span>
                  <span>Monday – Sunday: 7:00 AM – 8:00 PM</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Early morning dispatch coordination starts at 6:30 AM for scheduled deliveries.</span>
                </div>
              </div>

              <div className="flex gap-3 items-start pt-2 border-t border-slate-100">
                <MapPin className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Primary Market Area:</span>
                  <span>{APP_CONFIG.serviceArea}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Covering all urban, suburban, and industrial corridors.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Inquiry Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Quick WhatsApp Message Builder
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Inquiry Purpose</label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Material Delivered Quote">Material Delivered Quote</option>
                  <option value="Urgent Site Delivery">Urgent Site Delivery</option>
                  <option value="Contractor Bulk Sourcing">Contractor Bulk Sourcing</option>
                  <option value="Truck Owner / Fleet Partnership">Truck Owner / Fleet Partnership</option>
                  <option value="Quarry / Supplier Registration">Quarry / Supplier Registration</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Site Area / Location</label>
                <input
                  type="text"
                  placeholder="e.g., Wardha Road, Hingna, Manish Nagar"
                  value={siteArea}
                  onChange={(e) => setSiteArea(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2">
                <a
                  href={generateWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send Inquiry to WhatsApp Desk</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
