import { dbAdapter } from '../db/dbAdapter.js';
import { ProductCategory } from '../models/index.js';

export class CategoryRepository {
  findAllActive(): Promise<ProductCategory[]> | ProductCategory[] {
    return dbAdapter.all<ProductCategory>(
      'SELECT * FROM product_categories WHERE is_active = 1 ORDER BY display_order ASC, created_at ASC'
    );
  }

  findAllAdmin(): Promise<ProductCategory[]> | ProductCategory[] {
    return dbAdapter.all<ProductCategory>(
      'SELECT * FROM product_categories ORDER BY display_order ASC, created_at ASC'
    );
  }

  findById(id: string): Promise<ProductCategory | null> | (ProductCategory | null) {
    return dbAdapter.get<ProductCategory>('SELECT * FROM product_categories WHERE id = ?', [id]);
  }

  findBySlug(slug: string): Promise<ProductCategory | null> | (ProductCategory | null) {
    let searchSlug = slug.toLowerCase().trim();
    if (
      searchSlug === 'black-stone' ||
      searchSlug === 'aggregate' ||
      searchSlug === 'black-metal' ||
      searchSlug === 'stone'
    ) {
      searchSlug = 'black-stone-aggregate';
    }
    return dbAdapter.get<ProductCategory>(
      'SELECT * FROM product_categories WHERE slug = ? OR id = ?',
      [searchSlug, slug]
    );
  }

  create(category: ProductCategory): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO product_categories (
        id, name, slug, description, image_url, is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      category.id,
      category.name,
      category.slug,
      category.description,
      category.image_url ?? null,
      category.is_active ?? 1,
      category.display_order ?? 0,
      category.created_at,
      category.updated_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  update(id: string, updates: Partial<ProductCategory>): Promise<void> | void {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.slug !== undefined) {
      fields.push('slug = ?');
      values.push(updates.slug);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(updates.image_url);
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

    const query = `UPDATE product_categories SET ${fields.join(', ')} WHERE id = ?`;
    const res = dbAdapter.run(query, values);
    if (res instanceof Promise) return res.then(() => {});
  }
}
