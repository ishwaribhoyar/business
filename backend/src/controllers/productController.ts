import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService.js';
import { ResponseFormatter } from '../utils/response.js';

const productService = new ProductService();

export class ProductController {
  static getAll(_req: Request, res: Response, next: NextFunction): void {
    try {
      const products = productService.getActiveProducts();
      ResponseFormatter.success(res, products);
    } catch (error) {
      next(error);
    }
  }

  static getBySlug(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawSlug = req.params.slug;
      const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
      const product = productService.getProductBySlug(slug);
      ResponseFormatter.success(res, product);
    } catch (error) {
      next(error);
    }
  }
}
