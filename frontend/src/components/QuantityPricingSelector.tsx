import React from 'react';
import { getProductPricingTiers, QuantityTier } from '../utils/pricingTiers.js';
import { Tag, Sparkles, Truck, Check } from 'lucide-react';

interface QuantityPricingSelectorProps {
  indicativePrice: number | null | undefined;
  unit: string;
  minQuantity?: number;
  slugOrId?: string;
  selectedQuantity?: number;
  onSelectQuantity?: (qty: number) => void;
  showSelectorOnly?: boolean;
}

export const QuantityPricingSelector: React.FC<QuantityPricingSelectorProps> = ({
  indicativePrice,
  unit,
  minQuantity = 1,
  slugOrId,
  selectedQuantity,
  onSelectQuantity,
}) => {
  const pricing = getProductPricingTiers(indicativePrice, unit, minQuantity, slugOrId);

  if (!pricing) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-amber-50/30 rounded-2xl border border-amber-200/80 p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-600 text-white rounded-lg">
            <Tag className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>D2C Wholesale Quantity Pricing</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                Direct Dispatch
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {pricing.unitEquivalentNote}
            </p>
          </div>
        </div>
        <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto">
          Save up to 10% on Full Truckloads
        </span>
      </div>

      {/* Pricing Tier Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {pricing.tiers.map((tier: QuantityTier) => {
          const isSelected = selectedQuantity === tier.quantity;
          return (
            <button
              key={tier.quantity}
              type="button"
              onClick={() => onSelectQuantity && onSelectQuantity(tier.quantity)}
              className={`relative text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400 ring-offset-1'
                  : tier.popular
                  ? 'bg-white border-amber-300 hover:border-amber-500 shadow-xs'
                  : 'bg-white/80 border-slate-200 hover:border-slate-400'
              }`}
            >
              {/* Badges */}
              {tier.badge && (
                <span
                  className={`absolute -top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                    isSelected
                      ? 'bg-amber-900 text-amber-100'
                      : tier.popular
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {tier.badge}
                </span>
              )}

              <div>
                <span className={`text-[11px] font-bold block ${isSelected ? 'text-amber-100' : 'text-slate-700'}`}>
                  {tier.label}
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`text-sm sm:text-base font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    ₹{tier.perUnitPrice.toLocaleString('en-IN')}
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                    /{unit}
                  </span>
                </div>
              </div>

              <div className={`mt-2 pt-1.5 border-t text-[10px] flex items-center justify-between ${isSelected ? 'border-amber-500/50 text-amber-100' : 'border-slate-100 text-slate-500'}`}>
                <span>Total: ₹{tier.totalEstimatedPrice.toLocaleString('en-IN')}</span>
                {tier.discountPercent > 0 && (
                  <span className={`font-bold ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`}>
                    Save {tier.discountPercent}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
        <Truck className="h-3 w-3 text-amber-600 shrink-0" />
        <span>
          Ex-quarry benchmark rate. Delivery is fulfilled via dedicated 6-wheeler / 10-wheeler tipper trucks anywhere in Nagpur.
        </span>
      </div>
    </div>
  );
};
