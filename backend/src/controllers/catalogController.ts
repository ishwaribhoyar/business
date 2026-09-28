import { Request, Response, NextFunction } from 'express';
import { CatalogService } from '../services/catalogService.js';
import { ResponseFormatter } from '../utils/response.js';

const catalogService = new CatalogService();

export class CatalogController {
  // -------------------------------------------------------------
  // Public Customer Catalog Endpoints
  // -------------------------------------------------------------
  static getCategories(req: Request, res: Response, next: NextFunction): void {
    try {
      const includeVariants = req.query.include_variants === 'true';
      const categories = catalogService.getCategories(includeVariants);
      ResponseFormatter.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  static getCategoryBySlug(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawSlug = req.params.slug;
      const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
      const category = catalogService.getCategoryBySlug(slug);
      ResponseFormatter.success(res, category);
    } catch (error) {
      next(error);
    }
  }

  static getVariantsForCategory(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawSlug = req.params.categorySlug;
      const categorySlug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
      const variants = catalogService.getVariantsForCategory(categorySlug, true);
      ResponseFormatter.success(res, variants);
    } catch (error) {
      next(error);
    }
  }

  static getVariantBySlug(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawCatSlug = req.params.categorySlug;
      const categorySlug = Array.isArray(rawCatSlug) ? rawCatSlug[0] : rawCatSlug;
      const rawVarSlug = req.params.variantSlug;
      const variantSlug = Array.isArray(rawVarSlug) ? rawVarSlug[0] : rawVarSlug;

      const variant = catalogService.getVariantBySlug(categorySlug, variantSlug);
      ResponseFormatter.success(res, variant);
    } catch (error) {
      next(error);
    }
  }

  static getVariantById(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const variant = catalogService.getVariantById(id);
      ResponseFormatter.success(res, variant);
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Admin Catalog Endpoints
  // -------------------------------------------------------------
  static getAdminCategories(_req: Request, res: Response, next: NextFunction): void {
    try {
      const categories = catalogService.getAllCategoriesAdmin();
      ResponseFormatter.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  static createCategory(req: Request, res: Response, next: NextFunction): void {
    try {
      const category = catalogService.createCategory(req.body);
      ResponseFormatter.success(res, category, 201);
    } catch (error) {
      next(error);
    }
  }

  static updateCategory(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const updated = catalogService.updateCategory(id, req.body);
      ResponseFormatter.success(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static getAdminVariants(_req: Request, res: Response, next: NextFunction): void {
    try {
      const variants = catalogService.getAllVariantsAdmin();
      ResponseFormatter.success(res, variants);
    } catch (error) {
      next(error);
    }
  }

  static createVariant(req: Request, res: Response, next: NextFunction): void {
    try {
      const variant = catalogService.createVariant(req.body);
      ResponseFormatter.success(res, variant, 201);
    } catch (error) {
      next(error);
    }
  }

  static updateVariant(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const updated = catalogService.updateVariant(id, req.body);
      ResponseFormatter.success(res, updated);
    } catch (error) {
      next(error);
    }
  }
}
