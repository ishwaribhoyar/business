import bcrypt from 'bcryptjs';
import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './connection.js';
import { config } from '../config/index.js';
import { Logger } from '../utils/logger.js';
import { runMigrations } from './migrate.js';

export function runSeeds(db?: DatabaseSync): void {
  const activeDb = db ?? getDatabase();

  // Ensure tables exist before seeding
  runMigrations(activeDb);

  Logger.info('Starting database seeding...');

  // 1. Seed Initial Super Admin User
  const existingAdmin = activeDb.prepare('SELECT id FROM admin_users WHERE email = ?').get(config.initialAdmin.email) as { id: string } | undefined;

  if (!existingAdmin) {
    Logger.info(`Seeding default admin user: ${config.initialAdmin.email}`);
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(config.initialAdmin.password, salt);
    const adminId = 'usr_admin_initial';
    const now = new Date().toISOString();

    const insertAdmin = activeDb.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAdmin.run(
      adminId,
      config.initialAdmin.email,
      passwordHash,
      config.initialAdmin.name,
      'SUPER_ADMIN',
      1,
      now,
      now
    );
    Logger.info('Default admin user successfully seeded.');
  } else {
    Logger.info(`Admin user ${config.initialAdmin.email} already exists.`);
  }

  // 2. Seed Authoritative MVP Materials (Strictly 4 categories from PRD/BRD)
  const mvpProducts = [
    {
      id: 'prod_sand_01',
      name: 'Sand',
      slug: 'sand',
      category: 'Bulk Aggregate',
      description: 'Clean, quality construction sand suitable for masonry, plastering, and RCC concrete works in Nagpur and surrounding regions.',
      unit: 'Brass',
      min_quantity: 1,
      typical_use_cases: 'RCC construction, plastering, masonry, flooring and tiling base.',
      quality_specifications: 'Filtered river / manufactured sand as per regional construction norms.',
      availability_disclaimer: 'Delivered price calculated per order based on site distance and vehicle access.',
      display_order: 1,
    },
    {
      id: 'prod_bricks_02',
      name: 'Bricks',
      slug: 'bricks',
      category: 'Masonry',
      description: 'Standard red clay kiln bricks and fly ash bricks for residential and commercial masonry construction.',
      unit: 'Pieces',
      min_quantity: 1000,
      typical_use_cases: 'Load-bearing walls, partition walls, boundary walls, foundation works.',
      quality_specifications: 'Well-burnt uniform bricks with sharp edges and high compressive strength.',
      availability_disclaimer: 'Delivered price calculated per order based on site distance and vehicle access.',
      display_order: 2,
    },
    {
      id: 'prod_stone_03',
      name: 'Black Stone / Aggregate',
      slug: 'black-stone-aggregate',
      category: 'Crushed Stone',
      description: 'Crushed basalt black metal stone / coarse aggregates (10mm, 20mm, 40mm) for concrete mixes and road works.',
      unit: 'Brass',
      min_quantity: 1,
      typical_use_cases: 'RCC columns, beams, slabs, foundations, road sub-base, and heavy concrete work.',
      quality_specifications: 'Clean crushed angular basalt stone from verified local Nagpur quarries.',
      availability_disclaimer: 'Delivered price calculated per order based on site distance and vehicle access.',
      display_order: 3,
    },
    {
      id: 'prod_murum_04',
      name: 'Murum',
      slug: 'murum',
      category: 'Earth & Fill',
      description: 'Natural excavated murum soil for construction site leveling, foundation plinth filling, and road embankments.',
      unit: 'Brass',
      min_quantity: 1,
      typical_use_cases: 'Plinth filling, site leveling, ground compaction, road subgrade preparation.',
      quality_specifications: 'Good compaction quality murum free from excessive debris or organic waste.',
      availability_disclaimer: 'Delivered price calculated per order based on site distance and vehicle access.',
      display_order: 4,
    },
  ];

  const insertProduct = activeDb.prepare(`
    INSERT OR IGNORE INTO products (
      id, name, slug, category, description, unit, min_quantity, is_active,
      typical_use_cases, quality_specifications, availability_disclaimer, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const product of mvpProducts) {
    insertProduct.run(
      product.id,
      product.name,
      product.slug,
      product.category,
      product.description,
      product.unit,
      product.min_quantity,
      product.typical_use_cases,
      product.quality_specifications,
      product.availability_disclaimer,
      product.display_order,
      now,
      now
    );
  }

  Logger.info('MVP products successfully seeded (Sand, Bricks, Black Stone / Aggregate, Murum).');

  // 3. Seed Phase 3 Hierarchical Categories (Sand, Bricks, Black Stone / Aggregate, Murum)
  const mvpCategories = [
    {
      id: 'cat_sand_01',
      name: 'Sand',
      slug: 'sand',
      description: 'Clean construction sand and manufactured sand options suitable for plastering, masonry, and RCC concrete in Nagpur.',
      image_url: '/images/categories/sand.jpg',
      display_order: 1,
    },
    {
      id: 'cat_bricks_02',
      name: 'Bricks',
      slug: 'bricks',
      description: 'Red clay kiln bricks and fly ash bricks for residential and commercial masonry construction in Nagpur.',
      image_url: '/images/categories/bricks.jpg',
      display_order: 2,
    },
    {
      id: 'cat_stone_03',
      name: 'Black Stone / Aggregate',
      slug: 'black-stone-aggregate',
      description: 'Crushed basalt black metal stone aggregates (10mm, 20mm, 40mm) and GSB mix for RCC concrete and road sub-base.',
      image_url: '/images/categories/aggregate.jpg',
      display_order: 3,
    },
    {
      id: 'cat_murum_04',
      name: 'Murum',
      slug: 'murum',
      description: 'Natural excavated yellow murum and hard red murum (bharda) for foundation filling, plinth packing, and site leveling.',
      image_url: '/images/categories/murum.jpg',
      display_order: 4,
    },
  ];

  const insertCategory = activeDb.prepare(`
    INSERT OR IGNORE INTO product_categories (
      id, name, slug, description, image_url, is_active, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);

  for (const cat of mvpCategories) {
    insertCategory.run(
      cat.id,
      cat.name,
      cat.slug,
      cat.description,
      cat.image_url,
      cat.display_order,
      now,
      now
    );
  }

  // 4. Seed Phase 3 Subtypes / Variants
  const mvpVariants = [
    // Sand Variants
    {
      id: 'var_sand_river',
      category_id: 'cat_sand_01',
      name: 'River Sand',
      slug: 'river-sand',
      short_description: 'Natural river bed sand screened for civil construction and plastering.',
      detailed_description: 'Clean natural river sand free from organic matter and excessive silt. Ideal for RCC slab casting, brickwork masonry, and high-finish wall plastering.',
      image_url: '/images/variants/river-sand.jpg',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: null,
      specifications_schema: JSON.stringify([
        {
          key: 'silt_grade',
          label: 'Washing & Silt Grade',
          type: 'select',
          required: true,
          options: ['Standard Screened Sand', 'Double Washed Plaster Sand'],
        },
      ]),
      display_order: 1,
    },
    {
      id: 'var_sand_msand',
      category_id: 'cat_sand_01',
      name: 'M-Sand (Manufactured Sand)',
      slug: 'm-sand',
      short_description: 'Manufactured crushed stone sand for RCC concrete and masonry works.',
      detailed_description: 'Engineered crushed granite/basalt sand produced by VSI crushers with cubical grain particle shape for optimal cement bonding.',
      image_url: '/images/variants/m-sand.jpg',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: null,
      specifications_schema: JSON.stringify([
        {
          key: 'application_grade',
          label: 'Application Grade',
          type: 'select',
          required: true,
          options: ['Zone II Concrete Grade', 'Plastering Fine Grade'],
        },
      ]),
      display_order: 2,
    },
    {
      id: 'var_sand_dust',
      category_id: 'cat_sand_01',
      name: 'Crushed Stone Dust',
      slug: 'stone-dust',
      short_description: 'Fine quarry dust suitable for paver base, flooring bedding, and non-structural civil works.',
      detailed_description: 'Screened crusher stone dust for leveling, sub-base compaction under paving blocks, and trench backfilling.',
      image_url: '/images/variants/stone-dust.jpg',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: null,
      specifications_schema: '[]',
      display_order: 3,
    },

    // Bricks Variants
    {
      id: 'var_brick_red',
      category_id: 'cat_bricks_02',
      name: 'Red Clay Bricks',
      slug: 'red-clay-bricks',
      short_description: 'Traditional kiln-burnt red clay bricks for masonry walls and structural partition works.',
      detailed_description: 'Standard local kiln-fired red clay bricks with uniform dimensions and sharp edges, suitable for load-bearing and partition wall construction.',
      image_url: '/images/variants/red-clay-bricks.jpg',
      unit: 'Pieces',
      min_quantity: 1000,
      indicative_price: null,
      specifications_schema: JSON.stringify([
        {
          key: 'brick_class',
          label: 'Quality Grade',
          type: 'select',
          required: true,
          options: ['Class A (Standard Kiln Burnt)', 'Class B (Local Masonry)'],
        },
      ]),
      display_order: 1,
    },
    {
      id: 'var_brick_flyash',
      category_id: 'cat_bricks_02',
      name: 'Fly Ash Bricks',
      slug: 'fly-ash-bricks',
      short_description: 'Machine-pressed cement fly ash bricks for commercial partitions and compound walls.',
      detailed_description: 'Environment-friendly hydraulically compressed fly ash bricks with precise edges, reducing plaster mortar consumption.',
      image_url: '/images/variants/fly-ash-bricks.jpg',
      unit: 'Pieces',
      min_quantity: 1000,
      indicative_price: null,
      specifications_schema: JSON.stringify([
        {
          key: 'strength_grade',
          label: 'Compressive Strength',
          type: 'select',
          required: true,
          options: ['Standard Grade', 'High Strength Grade'],
        },
      ]),
      display_order: 2,
    },

    // Black Stone / Aggregate Variants
    {
      id: 'var_stone_20mm',
      category_id: 'cat_stone_03',
      name: '20mm Black Stone Metal',
      slug: '20mm-aggregate',
      short_description: 'Coarse angular crushed basalt aggregate for RCC slabs, beams, and columns.',
      detailed_description: 'Machine-crushed hard black basalt coarse aggregate sized at 20mm nominal for all structural reinforced cement concrete (RCC) mixes.',
      image_url: '/images/variants/20mm-aggregate.jpg',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: null,
      specifications_schema: JSON.stringify([
        {
          key: 'crusher_type',
          label: 'Crusher Type',
          type: 'select',
          required: false,
          options: ['Standard Jaw Crusher', 'Cone Crusher (Cubical)'],
        },
      ]),
      display_order: 1,
    },
    {
      id: 'var_stone_10mm',
      category_id: 'cat_stone_03',
      name: '10mm Black Stone Metal',
      slug: '10mm-aggregate',
      short_description: 'Fine aggregate metal for RCC work, concrete precast, and flooring mix.',
      detailed_description: 'Crushed 10mm basalt aggregate commonly blended with 20mm metal in 1:2 ratio for dense concrete packing.',
      image_url: '/images/variants/10mm-aggregate.jpg',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: null,
      specifications_schema: JSON.stringify([
        {
          key: 'crusher_type',
          label: 'Crusher Type',
          type: 'select',
          required: false,
          options: ['Standard Jaw Crusher', 'Cone Crusher (Cubical)'],
        },
      ]),
      display_order: 2,
    },
    {
      id: 'var_stone_40mm',
      category_id: 'cat_stone_03',
      name: '40mm Black Stone Metal',
      slug: '40mm-aggregate',
      short_description: 'Heavy stone metal for foundation mass concrete, road sub-base, and PCC flooring.',
      detailed_description: 'Heavy gauge 40mm angular aggregate for foundation mass concrete, plain cement concrete (PCC) beds, and water bound macadam (WBM) road base.',
      image_url: '/images/variants/40mm-aggregate.jpg',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: null,
      specifications_schema: '[]',
      display_order: 3,
    },
    {
      id: 'var_stone_gsb',
      category_id: 'cat_stone_03',
      name: 'GSB / Wet Mix (Crushed Aggregate Mix)',
      slug: 'gsb-crushed-mix',
      short_description: 'Granular sub-base blend of crushed aggregate and dust for site approach roads and pavement base.',
      detailed_description: 'Graded aggregate blend for foundation road compaction and internal site haul road preparation.',
      image_url: '/images/variants/gsb-crushed-mix.jpg',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: null,
      specifications_schema: '[]',
      display_order: 4,
    },

    // Murum Variants
    {
      id: 'var_murum_yellow',
      category_id: 'cat_murum_04',
      name: 'Yellow Murum',
      slug: 'yellow-murum',
      short_description: 'Natural excavated yellow murum soil for plinth filling, foundation packing, and site leveling.',
      detailed_description: 'Natural yellow compaction murum with excellent binding qualities when watered and rolled, ideal for plinth backfilling.',
      image_url: '/images/variants/yellow-murum.jpg',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: null,
      specifications_schema: JSON.stringify([
        {
          key: 'compaction_type',
          label: 'Soil Texture',
          type: 'select',
          required: false,
          options: ['Fine Packing Murum', 'Heavy Coarse Murum'],
        },
      ]),
      display_order: 1,
    },
    {
      id: 'var_murum_red',
      category_id: 'cat_murum_04',
      name: 'Red / Hard Murum (Bharda)',
      slug: 'red-bharda-murum',
      short_description: 'Rocky coarse murum with gravel composition for road subgrade preparation and heavy filling.',
      detailed_description: 'Gravel-rich coarse hard murum for stabilizing waterlogged grounds, site entrances, and heavy truck access paths.',
      image_url: '/images/variants/red-bharda-murum.jpg',
      unit: 'Brass',
      min_quantity: 1,
      indicative_price: null,
      specifications_schema: '[]',
      display_order: 2,
    },
  ];

  const insertVariant = activeDb.prepare(`
    INSERT OR IGNORE INTO product_variants (
      id, category_id, name, slug, short_description, detailed_description,
      image_url, unit, min_quantity, indicative_price, specifications_schema,
      is_active, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);

  for (const variant of mvpVariants) {
    insertVariant.run(
      variant.id,
      variant.category_id,
      variant.name,
      variant.slug,
      variant.short_description,
      variant.detailed_description,
      variant.image_url,
      variant.unit,
      variant.min_quantity,
      variant.indicative_price,
      variant.specifications_schema,
      variant.display_order,
      now,
      now
    );
  }

  Logger.info('Phase 3 Hierarchical Categories and Variants successfully seeded.');
}

// Direct execution from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  try {
    runSeeds();
    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}
