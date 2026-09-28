import React, { useState } from 'react';
import { Layers, Package, Truck } from 'lucide-react';

interface VariantImageProps {
  src?: string | null;
  alt: string;
  categorySlug?: string;
  className?: string;
}

export const VariantImage: React.FC<VariantImageProps> = ({
  src,
  alt,
  categorySlug,
  className = 'w-full h-48 object-cover',
}) => {
  const [hasError, setHasError] = useState(false);

  // Return fallback placeholder if src is missing or failed to load
  if (!src || hasError) {
    const getCategoryTheme = (slug?: string) => {
      switch (slug) {
        case 'sand':
          return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: '🏖️' };
        case 'bricks':
          return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', icon: '🧱' };
        case 'black-stone-aggregate':
        case 'aggregate':
          return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', icon: '🪨' };
        case 'murum':
          return { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', icon: '🚜' };
        default:
          return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: '🏗️' };
      }
    };

    const theme = getCategoryTheme(categorySlug);

    return (
      <div
        className={`flex flex-col items-center justify-center p-4 border rounded-2xl ${theme.bg} ${theme.border} text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-3xl mb-1">{theme.icon}</span>
        <span className={`text-xs font-bold ${theme.text} line-clamp-1`}>{alt}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
          Nagpur Verified Supply
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`rounded-2xl border border-slate-200 ${className}`}
    />
  );
};
