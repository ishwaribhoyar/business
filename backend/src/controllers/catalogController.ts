import { Request, Response, NextFunction } from 'express';
import { CatalogService } from '../services/catalogService.js';
import { ResponseFormatter } from '../utils/response.js';

const catalogService = new CatalogService();

export class CatalogController {
  // -------------------------------------------------------------
  // Public Customer Catalog Endpoints
  // -------------------------------------------------------------
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeVariants = req.query.include_variants === 'true';
      const categories = await catalogService.getCategories(includeVariants);
      ResponseFormatter.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawSlug = req.params.slug;
      const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
      const category = await catalogService.getCategoryBySlug(slug);
      ResponseFormatter.success(res, category);
    } catch (error) {
      next(error);
    }
  }

  static async getVariantsForCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawSlug = req.params.categorySlug;
      const categorySlug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
      const variants = await catalogService.getVariantsForCategory(categorySlug, true);
      ResponseFormatter.success(res, variants);
    } catch (error) {
      next(error);
    }
  }

  static async getVariantBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawCatSlug = req.params.categorySlug;
      const categorySlug = Array.isArray(rawCatSlug) ? rawCatSlug[0] : rawCatSlug;
      const rawVarSlug = req.params.variantSlug;
      const variantSlug = Array.isArray(rawVarSlug) ? rawVarSlug[0] : rawVarSlug;

      const variant = await catalogService.getVariantBySlug(categorySlug, variantSlug);
      ResponseFormatter.success(res, variant);
    } catch (error) {
      next(error);
    }
  }

  static async getVariantById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const variant = await catalogService.getVariantById(id);
      ResponseFormatter.success(res, variant);
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Admin Catalog Endpoints
  // -------------------------------------------------------------
  static async getAdminCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await catalogService.getAllCategoriesAdmin();
      ResponseFormatter.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await catalogService.createCategory(req.body);
      ResponseFormatter.success(res, category, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const updated = await catalogService.updateCategory(id, req.body);
      ResponseFormatter.success(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async getAdminVariants(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variants = await catalogService.getAllVariantsAdmin();
      ResponseFormatter.success(res, variants);
    } catch (error) {
      next(error);
    }
  }

  static async createVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await catalogService.createVariant(req.body);
      ResponseFormatter.success(res, variant, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const updated = await catalogService.updateVariant(id, req.body);
      ResponseFormatter.success(res, updated);
    } catch (error) {
      next(error);
    }
  }
}
