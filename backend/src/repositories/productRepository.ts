import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Product } from '../models/index.js';

export class ProductRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  findAllActive(): Product[] {
    const stmt = this.db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY display_order ASC');
    return (stmt.all() as unknown as Product[]) || [];
  }

  findBySlug(slug: string): Product | null {
    const stmt = this.db.prepare('SELECT * FROM products WHERE slug = ? AND is_active = 1');
    const result = stmt.get(slug);
    return (result as unknown as Product) || null;
  }

  findById(id: string): Product | null {
    const stmt = this.db.prepare('SELECT * FROM products WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Product) || null;
  }
}
