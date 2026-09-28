import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { ProductVariant } from '../models/index.js';

export class VariantRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  findByCategory(categoryId: string, activeOnly = true): ProductVariant[] {
    const query = activeOnly
      ? `SELECT v.*, c.name as category_name, c.slug as category_slug
         FROM product_variants v
         JOIN product_categories c ON v.category_id = c.id
         WHERE v.category_id = ? AND v.is_active = 1
         ORDER BY v.display_order ASC, v.created_at ASC`
      : `SELECT v.*, c.name as category_name, c.slug as category_slug
         FROM product_variants v
         JOIN product_categories c ON v.category_id = c.id
         WHERE v.category_id = ?
         ORDER BY v.display_order ASC, v.created_at ASC`;

    const stmt = this.db.prepare(query);
    return (stmt.all(categoryId) as unknown as ProductVariant[]) || [];
  }

  findByCategorySlug(categorySlug: string, activeOnly = true): ProductVariant[] {
    let searchSlug = categorySlug.toLowerCase().trim();
    if (
      searchSlug === 'black-stone' ||
      searchSlug === 'aggregate' ||
      searchSlug === 'black-metal' ||
      searchSlug === 'stone'
    ) {
      searchSlug = 'black-stone-aggregate';
    }

    const query = activeOnly
      ? `SELECT v.*, c.name as category_name, c.slug as category_slug
         FROM product_variants v
         JOIN product_categories c ON v.category_id = c.id
         WHERE (c.slug = ? OR c.id = ?) AND v.is_active = 1 AND c.is_active = 1
         ORDER BY v.display_order ASC, v.created_at ASC`
      : `SELECT v.*, c.name as category_name, c.slug as category_slug
         FROM product_variants v
         JOIN product_categories c ON v.category_id = c.id
         WHERE (c.slug = ? OR c.id = ?)
         ORDER BY v.display_order ASC, v.created_at ASC`;

    const stmt = this.db.prepare(query);
    return (stmt.all(searchSlug, categorySlug) as unknown as ProductVariant[]) || [];
  }

  findById(id: string): ProductVariant | null {
    const query = `
      SELECT v.*, c.name as category_name, c.slug as category_slug
      FROM product_variants v
      JOIN product_categories c ON v.category_id = c.id
      WHERE v.id = ?
    `;
    const stmt = this.db.prepare(query);
    const result = stmt.get(id);
    return (result as unknown as ProductVariant) || null;
  }

  findBySlug(slug: string, categoryIdOrSlug?: string): ProductVariant | null {
    const searchSlug = slug.toLowerCase().trim();
    if (categoryIdOrSlug) {
      let catSlug = categoryIdOrSlug.toLowerCase().trim();
      if (
        catSlug === 'black-stone' ||
        catSlug === 'aggregate' ||
        catSlug === 'black-metal' ||
        catSlug === 'stone'
      ) {
        catSlug = 'black-stone-aggregate';
      }
      const query = `
        SELECT v.*, c.name as category_name, c.slug as category_slug
        FROM product_variants v
        JOIN product_categories c ON v.category_id = c.id
        WHERE (v.slug = ? OR v.id = ?) AND (c.slug = ? OR c.id = ?)
      `;
      const stmt = this.db.prepare(query);
      const result = stmt.get(searchSlug, slug, catSlug, categoryIdOrSlug);
      return (result as unknown as ProductVariant) || null;
    }

    const query = `
      SELECT v.*, c.name as category_name, c.slug as category_slug
      FROM product_variants v
      JOIN product_categories c ON v.category_id = c.id
      WHERE v.slug = ? OR v.id = ?
    `;
    const stmt = this.db.prepare(query);
    const result = stmt.get(searchSlug, slug);
    return (result as unknown as ProductVariant) || null;
  }

  findAllActive(): ProductVariant[] {
    const query = `
      SELECT v.*, c.name as category_name, c.slug as category_slug
      FROM product_variants v
      JOIN product_categories c ON v.category_id = c.id
      WHERE v.is_active = 1 AND c.is_active = 1
      ORDER BY c.display_order ASC, v.display_order ASC
    `;
    const stmt = this.db.prepare(query);
    return (stmt.all() as unknown as ProductVariant[]) || [];
  }

  findAllAdmin(): ProductVariant[] {
    const query = `
      SELECT v.*, c.name as category_name, c.slug as category_slug
      FROM product_variants v
      JOIN product_categories c ON v.category_id = c.id
      ORDER BY c.display_order ASC, v.display_order ASC
    `;
    const stmt = this.db.prepare(query);
    return (stmt.all() as unknown as ProductVariant[]) || [];
  }

  create(variant: ProductVariant): void {
    const stmt = this.db.prepare(`
      INSERT INTO product_variants (
        id, category_id, name, slug, short_description, detailed_description,
        image_url, unit, min_quantity, indicative_price, specifications_schema,
        is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      variant.id,
      variant.category_id,
      variant.name,
      variant.slug,
      variant.short_description,
      variant.detailed_description ?? null,
      variant.image_url ?? null,
      variant.unit,
      variant.min_quantity ?? 1,
      variant.indicative_price ?? null,
      variant.specifications_schema ?? '[]',
      variant.is_active ?? 1,
      variant.display_order ?? 0,
      variant.created_at,
      variant.updated_at
    );
  }

  update(id: string, updates: Partial<ProductVariant>): void {
    const existing = this.findById(id);
    if (!existing) return;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(updates.category_id);
    }
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.slug !== undefined) {
      fields.push('slug = ?');
      values.push(updates.slug);
    }
    if (updates.short_description !== undefined) {
      fields.push('short_description = ?');
      values.push(updates.short_description);
    }
    if (updates.detailed_description !== undefined) {
      fields.push('detailed_description = ?');
      values.push(updates.detailed_description);
    }
    if (updates.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(updates.image_url);
    }
    if (updates.unit !== undefined) {
      fields.push('unit = ?');
      values.push(updates.unit);
    }
    if (updates.min_quantity !== undefined) {
      fields.push('min_quantity = ?');
      values.push(updates.min_quantity);
    }
    if (updates.indicative_price !== undefined) {
      fields.push('indicative_price = ?');
      values.push(updates.indicative_price);
    }
    if (updates.specifications_schema !== undefined) {
      fields.push('specifications_schema = ?');
      values.push(updates.specifications_schema);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active);
    }
    if (updates.display_order !== undefined) {
      fields.push('display_order = ?');
      values.push(updates.display_order);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const query = `UPDATE product_variants SET ${fields.join(', ')} WHERE id = ?`;
    this.db.prepare(query).run(...values);
  }
}
