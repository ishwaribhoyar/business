import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { ProductCategory } from '../models/index.js';

export class CategoryRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  findAllActive(): ProductCategory[] {
    const stmt = this.db.prepare(
      'SELECT * FROM product_categories WHERE is_active = 1 ORDER BY display_order ASC, created_at ASC'
    );
    return (stmt.all() as unknown as ProductCategory[]) || [];
  }

  findAllAdmin(): ProductCategory[] {
    const stmt = this.db.prepare(
      'SELECT * FROM product_categories ORDER BY display_order ASC, created_at ASC'
    );
    return (stmt.all() as unknown as ProductCategory[]) || [];
  }

  findById(id: string): ProductCategory | null {
    const stmt = this.db.prepare('SELECT * FROM product_categories WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as ProductCategory) || null;
  }

  findBySlug(slug: string): ProductCategory | null {
    let searchSlug = slug.toLowerCase().trim();
    // Support common aliases for Black Stone / Aggregate
    if (
      searchSlug === 'black-stone' ||
      searchSlug === 'aggregate' ||
      searchSlug === 'black-metal' ||
      searchSlug === 'stone'
    ) {
      searchSlug = 'black-stone-aggregate';
    }
    const stmt = this.db.prepare('SELECT * FROM product_categories WHERE slug = ? OR id = ?');
    const result = stmt.get(searchSlug, slug);
    return (result as unknown as ProductCategory) || null;
  }

  create(category: ProductCategory): void {
    const stmt = this.db.prepare(`
      INSERT INTO product_categories (
        id, name, slug, description, image_url, is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      category.id,
      category.name,
      category.slug,
      category.description,
      category.image_url ?? null,
      category.is_active ?? 1,
      category.display_order ?? 0,
      category.created_at,
      category.updated_at
    );
  }

  update(id: string, updates: Partial<ProductCategory>): void {
    const existing = this.findById(id);
    if (!existing) return;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

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

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const query = `UPDATE product_categories SET ${fields.join(', ')} WHERE id = ?`;
    this.db.prepare(query).run(...values);
  }
}
