import { ProductRepository } from '../repositories/productRepository.js';
import { Product } from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

export class ProductService {
  private productRepo: ProductRepository;

  constructor(productRepo?: ProductRepository) {
    this.productRepo = productRepo ?? new ProductRepository();
  }

  async getActiveProducts(): Promise<Product[]> {
    return (await this.productRepo.findAllActive()) as Product[];
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const product = (await this.productRepo.findBySlug(slug)) as Product | null;
    if (!product) {
      throw new NotFoundError(`Product '${slug}'`);
    }
    return product;
  }

  async getProductById(id: string): Promise<Product> {
    const product = (await this.productRepo.findById(id)) as Product | null;
    if (!product) {
      throw new NotFoundError(`Product '${id}'`);
    }
    return product;
  }
}
