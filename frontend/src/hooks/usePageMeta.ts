import { useEffect } from 'react';

/**
 * Lightweight custom hook to set document title and meta description dynamically
 * for SEO without heavy external libraries.
 */
export function usePageMeta(title: string, description?: string): void {
  useEffect(() => {
    // Update title
    const fullTitle = title 
      ? `${title} | Nagpur Building Materials` 
      : 'Nagpur Building Materials | Bulk Construction Material Delivery';
    document.title = fullTitle;

    // Update meta description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);
}
