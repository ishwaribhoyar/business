export const APP_CONFIG = {
  appName: 'Nagpur Building Materials',
  tagline: 'Bulk Construction Material Delivery in Nagpur',
  serviceArea: 'Nagpur & nearby serviceable areas',
  phone: '+917120000000',
  whatsappNumber: '+919876543210',
  supportEmail: 'support@nagpurmaterials.local',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  mvpMaterials: [
    { id: 'prod_sand_01', name: 'Sand', slug: 'sand', unit: 'Brass' },
    { id: 'prod_bricks_02', name: 'Bricks', slug: 'bricks', unit: 'Pieces' },
    { id: 'prod_stone_03', name: 'Black Stone / Aggregate', slug: 'black-stone-aggregate', unit: 'Brass' },
    { id: 'prod_murum_04', name: 'Murum', slug: 'murum', unit: 'Brass' },
  ],
};
