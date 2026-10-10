export interface QuantityTier {
  quantity: number;
  label: string;
  discountPercent: number;
  perUnitPrice: number;
  totalEstimatedPrice: number;
  savings: number;
  badge?: string;
  popular?: boolean;
}

export interface PricingBreakdown {
  basePrice: number;
  unit: string;
  unitEquivalentNote: string;
  tiers: QuantityTier[];
}

/**
 * Calculates D2C-style volume pricing tiers based on standard Indian commercial construction units.
 * For bulk materials (Sand, Aggregates, Murum), orders are in Brass (1 Brass = 100 CFT ~ 3.8 - 4.2 Tonnes).
 * Standard Tipper truck sizes in Nagpur:
 * - 2 Brass (Mini Tipper / 6-Wheeler)
 * - 4 Brass (Standard Tipper / 10-Wheeler)
 * - 6 Brass (Multi-Axle / 12-Wheeler Heavy Dumper)
 * - 10 Brass (Wholesale / Bulk Foundation Project)
 *
 * For Bricks:
 * - 1,000 Pcs (Trolley load / Small repair)
 * - 3,000 Pcs (Mini Truck / Half load)
 * - 5,000 Pcs (Standard Tipper / Full truck load - Best value)
 * - 10,000 Pcs (Commercial / Multi-floor construction)
 */
export function getProductPricingTiers(
  indicativePrice: number | null | undefined,
  unit: string,
  minQuantity = 1
): PricingBreakdown | null {
  if (!indicativePrice || indicativePrice <= 0) return null;

  const isBricks = unit.toLowerCase().includes('piece');

  if (isBricks) {
    const base = Number(indicativePrice); // e.g. 9 or 6.5 per piece
    const tiers: QuantityTier[] = [
      {
        quantity: 1000,
        label: '1,000 Pcs (Mini Lot)',
        discountPercent: 0,
        perUnitPrice: base,
        totalEstimatedPrice: Math.round(1000 * base),
        savings: 0,
        badge: 'Small Project / Repairs',
      },
      {
        quantity: 3000,
        label: '3,000 Pcs (Half Truck)',
        discountPercent: 3,
        perUnitPrice: Number((base * 0.97).toFixed(2)),
        totalEstimatedPrice: Math.round(3000 * (base * 0.97)),
        savings: Math.round(3000 * (base * 0.03)),
        badge: 'Single Floor Work',
      },
      {
        quantity: 5000,
        label: '5,000 Pcs (Full Tipper)',
        discountPercent: 6,
        perUnitPrice: Number((base * 0.94).toFixed(2)),
        totalEstimatedPrice: Math.round(5000 * (base * 0.94)),
        savings: Math.round(5000 * (base * 0.06)),
        badge: 'Most Popular',
        popular: true,
      },
      {
        quantity: 10000,
        label: '10,000+ Pcs (Builder Bulk)',
        discountPercent: 10,
        perUnitPrice: Number((base * 0.90).toFixed(2)),
        totalEstimatedPrice: Math.round(10000 * (base * 0.90)),
        savings: Math.round(10000 * (base * 0.10)),
        badge: 'Max Savings',
      },
    ];

    return {
      basePrice: base,
      unit,
      unitEquivalentNote: '1 Pallet / Lot = 1,000 Bricks (delivered directly from approved kilns)',
      tiers,
    };
  }

  // Bulk aggregates, sand, and murum (Unit: Brass = 100 CFT)
  const base = Number(indicativePrice);
  const tiers: QuantityTier[] = [
    {
      quantity: 1,
      label: '1 Brass (Small Lot)',
      discountPercent: 0,
      perUnitPrice: base,
      totalEstimatedPrice: Math.round(1 * base),
      savings: 0,
      badge: 'Single Lot / Top-Up',
    },
    {
      quantity: 2,
      label: '2 Brass (6-Wheeler Tipper)',
      discountPercent: 2.5,
      perUnitPrice: Math.round(base * 0.975),
      totalEstimatedPrice: Math.round(2 * (base * 0.975)),
      savings: Math.round(2 * (base * 0.025)),
      badge: 'Residential Repair',
    },
    {
      quantity: 4,
      label: '4 Brass (10-Wheeler Full Dumper)',
      discountPercent: 5,
      perUnitPrice: Math.round(base * 0.95),
      totalEstimatedPrice: Math.round(4 * (base * 0.95)),
      savings: Math.round(4 * (base * 0.05)),
      badge: 'Best Value',
      popular: true,
    },
    {
      quantity: 8,
      label: '8+ Brass (Multi-Truck Commercial)',
      discountPercent: 8,
      perUnitPrice: Math.round(base * 0.92),
      totalEstimatedPrice: Math.round(8 * (base * 0.92)),
      savings: Math.round(8 * (base * 0.08)),
      badge: 'Direct Quarry Wholesale',
    },
  ];

  return {
    basePrice: base,
    unit,
    unitEquivalentNote: '1 Brass = 100 CFT (approx. 3.8 - 4.2 Metric Tonnes based on material density)',
    tiers,
  };
}

/**
 * Calculates estimated dynamic price for any custom quantity entered by customer
 */
export function calculateDynamicQuoteEstimate(
  indicativePrice: number | null | undefined,
  quantity: number,
  unit: string
) {
  if (!indicativePrice || !quantity || quantity <= 0) return null;

  const isBricks = unit.toLowerCase().includes('piece');
  let discountRate = 0;

  if (isBricks) {
    if (quantity >= 10000) discountRate = 0.10;
    else if (quantity >= 5000) discountRate = 0.06;
    else if (quantity >= 3000) discountRate = 0.03;
  } else {
    if (quantity >= 8) discountRate = 0.08;
    else if (quantity >= 4) discountRate = 0.05;
    else if (quantity >= 2) discountRate = 0.025;
  }

  const effectiveRate = Number((indicativePrice * (1 - discountRate)).toFixed(2));
  const rawTotal = Math.round(quantity * effectiveRate);
  const baseTotal = Math.round(quantity * indicativePrice);
  const totalSavings = baseTotal - rawTotal;

  return {
    effectiveRate,
    baseTotal,
    estimatedTotal: rawTotal,
    discountRate,
    discountPercent: Math.round(discountRate * 100),
    totalSavings,
  };
}
