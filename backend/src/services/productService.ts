import { ProductRepository } from '../repositories/productRepository.js';
import { Product } from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

export class ProductService {
  private productRepo: ProductRepository;

  constructor(productRepo?: ProductRepository) {
    this.productRepo = productRepo ?? new ProductRepository();
  }

  getActiveProducts(): Product[] {
    return this.productRepo.findAllActive();
  }

  getProductBySlug(slug: string): Product {
    const product = this.productRepo.findBySlug(slug);
    if (!product) {
      throw new NotFoundError(`Product '${slug}'`);
    }
    return product;
  }

  getProductById(id: string): Product {
    const product = this.productRepo.findById(id);
    if (!product) {
      throw new NotFoundError(`Product '${id}'`);
    }
    return product;
  }
}
