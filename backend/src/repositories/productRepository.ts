import { dbAdapter } from '../db/dbAdapter.js';
import { Product } from '../models/index.js';

export class ProductRepository {
  findAllActive(): Promise<Product[]> | Product[] {
    return dbAdapter.all<Product>('SELECT * FROM products WHERE is_active = 1 ORDER BY display_order ASC');
  }

  findBySlug(slug: string): Promise<Product | null> | (Product | null) {
    let searchSlug = slug.toLowerCase().trim();
    if (searchSlug === 'black-stone' || searchSlug === 'aggregate' || searchSlug === 'black-metal' || searchSlug === 'stone') {
      searchSlug = 'black-stone-aggregate';
    }
    return dbAdapter.get<Product>(
      'SELECT * FROM products WHERE (slug = ? OR id = ?) AND is_active = 1',
      [searchSlug, slug]
    );
  }

  findById(id: string): Promise<Product | null> | (Product | null) {
    return dbAdapter.get<Product>('SELECT * FROM products WHERE id = ? OR slug = ?', [id, id]);
  }
}
