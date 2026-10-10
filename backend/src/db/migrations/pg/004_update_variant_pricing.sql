-- Migration 004: Update Indian Standard Benchmark Indicative Pricing for all 11 Variants
-- Fixes NULL indicative_price on existing databases where migration 003 was already applied

UPDATE product_variants
SET indicative_price = 6500.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_sand_river';

UPDATE product_variants
SET indicative_price = 3800.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_sand_msand';

UPDATE product_variants
SET indicative_price = 1800.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_sand_dust';

UPDATE product_variants
SET indicative_price = 9.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_brick_red';

UPDATE product_variants
SET indicative_price = 6.50, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_brick_flyash';

UPDATE product_variants
SET indicative_price = 2400.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_stone_20mm';

UPDATE product_variants
SET indicative_price = 2300.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_stone_10mm';

UPDATE product_variants
SET indicative_price = 2600.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_stone_40mm';

UPDATE product_variants
SET indicative_price = 2000.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_stone_gsb';

UPDATE product_variants
SET indicative_price = 1400.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_murum_yellow';

UPDATE product_variants
SET indicative_price = 1600.00, updated_at = CURRENT_TIMESTAMP
WHERE id = 'var_murum_red';
