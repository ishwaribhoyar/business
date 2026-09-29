import { dbAdapter } from '../db/dbAdapter.js';
import { ProductVariant } from '../models/index.js';

export class VariantRepository {
  findByCategory(categoryId: string, activeOnly = true): Promise<ProductVariant[]> | ProductVariant[] {
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

    return dbAdapter.all<ProductVariant>(query, [categoryId]);
  }

  findByCategorySlug(categorySlug: string, activeOnly = true): Promise<ProductVariant[]> | ProductVariant[] {
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

    return dbAdapter.all<ProductVariant>(query, [searchSlug, categorySlug]);
  }

  findById(id: string): Promise<ProductVariant | null> | (ProductVariant | null) {
    const query = `
      SELECT v.*, c.name as category_name, c.slug as category_slug
      FROM product_variants v
      JOIN product_categories c ON v.category_id = c.id
      WHERE v.id = ?
    `;
    return dbAdapter.get<ProductVariant>(query, [id]);
  }

  findBySlug(slug: string, categoryIdOrSlug?: string): Promise<ProductVariant | null> | (ProductVariant | null) {
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
      return dbAdapter.get<ProductVariant>(query, [searchSlug, slug, catSlug, categoryIdOrSlug]);
    }

    const query = `
      SELECT v.*, c.name as category_name, c.slug as category_slug
      FROM product_variants v
      JOIN product_categories c ON v.category_id = c.id
      WHERE v.slug = ? OR v.id = ?
    `;
    return dbAdapter.get<ProductVariant>(query, [searchSlug, slug]);
  }

  findAllActive(): Promise<ProductVariant[]> | ProductVariant[] {
    const query = `
      SELECT v.*, c.name as category_name, c.slug as category_slug
      FROM product_variants v
      JOIN product_categories c ON v.category_id = c.id
      WHERE v.is_active = 1 AND c.is_active = 1
      ORDER BY c.display_order ASC, v.display_order ASC
    `;
    return dbAdapter.all<ProductVariant>(query);
  }

  findAllAdmin(): Promise<ProductVariant[]> | ProductVariant[] {
    const query = `
      SELECT v.*, c.name as category_name, c.slug as category_slug
      FROM product_variants v
      JOIN product_categories c ON v.category_id = c.id
      ORDER BY c.display_order ASC, v.display_order ASC
    `;
    return dbAdapter.all<ProductVariant>(query);
  }

  create(variant: ProductVariant): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO product_variants (
        id, category_id, name, slug, short_description, detailed_description,
        image_url, unit, min_quantity, indicative_price, specifications_schema,
        is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
      typeof variant.specifications_schema === 'object' ? JSON.stringify(variant.specifications_schema) : (variant.specifications_schema ?? '[]'),
      variant.is_active ?? 1,
      variant.display_order ?? 0,
      variant.created_at,
      variant.updated_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  update(id: string, updates: Partial<ProductVariant>): Promise<void> | void {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

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
      values.push(typeof updates.specifications_schema === 'object' ? JSON.stringify(updates.specifications_schema) : updates.specifications_schema);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active);
    }
    if (updates.display_order !== undefined) {
      fields.push('display_order = ?');
      values.push(updates.display_order);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const query = `UPDATE product_variants SET ${fields.join(', ')} WHERE id = ?`;
    const res = dbAdapter.run(query, values);
    if (res instanceof Promise) return res.then(() => {});
  }
}
