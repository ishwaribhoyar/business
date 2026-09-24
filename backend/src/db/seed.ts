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
