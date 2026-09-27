import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls window to top on route change.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
