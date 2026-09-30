-- Migration 003: Seed MVP Catalog (Categories & 11 Variants)
-- Ensures production PostgreSQL is initialized with authoritative Phase 3 product catalog

-- 1. Seed Categories
INSERT INTO product_categories (id, name, slug, description, image_url, is_active, display_order, created_at, updated_at)
VALUES
  ('cat_sand_01', 'Sand', 'sand', 'Clean construction sand and manufactured sand options suitable for plastering, masonry, and RCC concrete in Nagpur.', '/images/categories/sand.jpg', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_bricks_02', 'Bricks', 'bricks', 'Red clay kiln bricks and fly ash bricks for residential and commercial masonry construction in Nagpur.', '/images/categories/bricks.jpg', TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_stone_03', 'Black Stone / Aggregate', 'black-stone-aggregate', 'Crushed basalt black metal stone aggregates (10mm, 20mm, 40mm) and GSB mix for RCC concrete and road sub-base.', '/images/categories/aggregate.jpg', TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_murum_04', 'Murum', 'murum', 'Natural excavated yellow murum and hard red murum (bharda) for foundation filling, plinth packing, and site leveling.', '/images/categories/murum.jpg', TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed 11 Regional Variants
INSERT INTO product_variants (
  id, category_id, name, slug, short_description, detailed_description,
  image_url, unit, min_quantity, indicative_price, specifications_schema,
  is_active, display_order, created_at, updated_at
)
VALUES
  -- Sand Variants
  (
    'var_sand_river', 'cat_sand_01', 'River Sand', 'river-sand',
    'Natural river bed sand screened for civil construction and plastering.',
    'Clean natural river sand free from organic matter and excessive silt. Ideal for RCC slab casting, brickwork masonry, and high-finish wall plastering.',
    '/images/variants/river-sand.jpg', 'Brass', 1, NULL,
    '[{"key":"silt_grade","label":"Washing & Silt Grade","type":"select","required":true,"options":["Standard Screened Sand","Double Washed Plaster Sand"]}]'::jsonb,
    TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'var_sand_msand', 'cat_sand_01', 'M-Sand (Manufactured Sand)', 'm-sand',
    'Manufactured crushed stone sand for RCC concrete and masonry works.',
    'Engineered crushed granite/basalt sand produced by VSI crushers with cubical grain particle shape for optimal cement bonding.',
    '/images/variants/m-sand.jpg', 'Brass', 1, NULL,
    '[{"key":"application_grade","label":"Application Grade","type":"select","required":true,"options":["Zone II Concrete Grade","Plastering Fine Grade"]}]'::jsonb,
    TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'var_sand_dust', 'cat_sand_01', 'Crushed Stone Dust', 'stone-dust',
    'Fine quarry dust suitable for paver base, flooring bedding, and non-structural civil works.',
    'Screened crusher stone dust for leveling, sub-base compaction under paving blocks, and trench backfilling.',
    '/images/variants/stone-dust.jpg', 'Brass', 1, NULL,
    '[]'::jsonb,
    TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- Bricks Variants
  (
    'var_brick_red', 'cat_bricks_02', 'Red Clay Bricks', 'red-clay-bricks',
    'Traditional kiln-burnt red clay bricks for masonry walls and structural partition works.',
    'Standard local kiln-fired red clay bricks with uniform dimensions and sharp edges, suitable for load-bearing and partition wall construction.',
    '/images/variants/red-clay-bricks.jpg', 'Pieces', 1000, NULL,
    '[{"key":"brick_class","label":"Quality Grade","type":"select","required":true,"options":["Class A (Standard Kiln Burnt)","Class B (Local Masonry)"]}]'::jsonb,
    TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'var_brick_flyash', 'cat_bricks_02', 'Fly Ash Bricks', 'fly-ash-bricks',
    'Machine-pressed cement fly ash bricks for commercial partitions and compound walls.',
    'Environment-friendly hydraulically compressed fly ash bricks with precise edges, reducing plaster mortar consumption.',
    '/images/variants/fly-ash-bricks.jpg', 'Pieces', 1000, NULL,
    '[{"key":"strength_grade","label":"Compressive Strength","type":"select","required":true,"options":["Standard Grade","High Strength Grade"]}]'::jsonb,
    TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- Black Stone / Aggregate Variants
  (
    'var_stone_20mm', 'cat_stone_03', '20mm Black Stone Metal', '20mm-aggregate',
    'Coarse angular crushed basalt aggregate for RCC slabs, beams, and columns.',
    'Machine-crushed hard black basalt coarse aggregate sized at 20mm nominal for all structural reinforced cement concrete (RCC) mixes.',
    '/images/variants/20mm-aggregate.jpg', 'Brass', 1, NULL,
    '[{"key":"crusher_type","label":"Crusher Type","type":"select","required":false,"options":["Standard Jaw Crusher","Cone Crusher (Cubical)"]}]'::jsonb,
    TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'var_stone_10mm', 'cat_stone_03', '10mm Black Stone Metal', '10mm-aggregate',
    'Fine aggregate metal for RCC work, concrete precast, and flooring mix.',
    'Crushed 10mm basalt aggregate commonly blended with 20mm metal in 1:2 ratio for dense concrete packing.',
    '/images/variants/10mm-aggregate.jpg', 'Brass', 1, NULL,
    '[{"key":"crusher_type","label":"Crusher Type","type":"select","required":false,"options":["Standard Jaw Crusher","Cone Crusher (Cubical)"]}]'::jsonb,
    TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'var_stone_40mm', 'cat_stone_03', '40mm Black Stone Metal', '40mm-aggregate',
    'Heavy stone metal for foundation mass concrete, road sub-base, and PCC flooring.',
    'Heavy gauge 40mm angular aggregate for foundation mass concrete, plain cement concrete (PCC) beds, and water bound macadam (WBM) road base.',
    '/images/variants/40mm-aggregate.jpg', 'Brass', 1, NULL,
    '[]'::jsonb,
    TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'var_stone_gsb', 'cat_stone_03', 'GSB / Wet Mix (Crushed Aggregate Mix)', 'gsb-crushed-mix',
    'Granular sub-base blend of crushed aggregate and dust for site approach roads and pavement base.',
    'Graded aggregate blend for foundation road compaction and internal site haul road preparation.',
    '/images/variants/gsb-crushed-mix.jpg', 'Brass', 1, NULL,
    '[]'::jsonb,
    TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),

  -- Murum Variants
  (
    'var_murum_yellow', 'cat_murum_04', 'Yellow Murum', 'yellow-murum',
    'Natural excavated yellow murum soil for plinth filling, foundation packing, and site leveling.',
    'Natural yellow compaction murum with excellent binding qualities when watered and rolled, ideal for plinth backfilling.',
    '/images/variants/yellow-murum.jpg', 'Brass', 1, NULL,
    '[{"key":"compaction_type","label":"Soil Texture","type":"select","required":false,"options":["Fine Packing Murum","Heavy Coarse Murum"]}]'::jsonb,
    TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'var_murum_red', 'cat_murum_04', 'Red / Hard Murum (Bharda)', 'red-bharda-murum',
    'Rocky coarse murum with gravel composition for road subgrade preparation and heavy filling.',
    'Gravel-rich coarse hard murum for stabilizing waterlogged grounds, site entrances, and heavy truck access paths.',
    '/images/variants/red-bharda-murum.jpg', 'Brass', 1, NULL,
    '[]'::jsonb,
    TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Legacy Products (for backward compatibility)
INSERT INTO products (id, name, slug, category, description, unit, min_quantity, is_active, display_order, created_at, updated_at)
VALUES
  ('prod_sand_01', 'Sand', 'sand', 'Bulk Aggregate', 'Clean, quality construction sand suitable for masonry, plastering, and RCC concrete works in Nagpur.', 'Brass', 1, TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('prod_bricks_02', 'Bricks', 'bricks', 'Masonry', 'Standard red clay kiln bricks and fly ash bricks for residential and commercial masonry construction.', 'Pieces', 1000, TRUE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('prod_stone_03', 'Black Stone / Aggregate', 'black-stone-aggregate', 'Coarse Aggregate', 'High-strength crushed black basalt stone metal for RCC foundations, beams, and columns.', 'Brass', 1, TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('prod_murum_04', 'Murum', 'murum', 'Earth & Filling', 'High-compaction yellow and red murum for site leveling and foundation backfilling.', 'Brass', 1, TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
