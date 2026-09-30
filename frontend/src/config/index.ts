const defaultProdApi = 'https://nagpur-marketplace-backend.onrender.com/api/v1';
let rawApiUrl = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? defaultProdApi : '/api/v1')).trim();
if (!rawApiUrl.endsWith('/api/v1') && !rawApiUrl.endsWith('/api/v1/')) {
  rawApiUrl = rawApiUrl.replace(/\/+$/, '') + '/api/v1';
}

export const APP_CONFIG = {
  appName: 'Nagpur Building Materials',
  tagline: 'Bulk Construction Material Delivery in Nagpur',
  serviceArea: 'Nagpur and currently serviceable nearby areas',
  phone: import.meta.env.VITE_OPERATIONS_PHONE || '+917120000000',
  whatsappNumber: import.meta.env.VITE_OPERATIONS_WHATSAPP || '+919876543210',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@nagpurmaterials.local',
  apiBaseUrl: rawApiUrl,
  mvpMaterials: [
    { id: 'prod_sand_01', name: 'Sand', slug: 'sand', unit: 'Brass' },
    { id: 'prod_bricks_02', name: 'Bricks', slug: 'bricks', unit: 'Pieces' },
    { id: 'prod_stone_03', name: 'Black Stone / Aggregate', slug: 'black-stone-aggregate', unit: 'Brass' },
    { id: 'prod_murum_04', name: 'Murum', slug: 'murum', unit: 'Brass' },
  ],
};
