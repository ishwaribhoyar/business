import { Router } from 'express';
import { CatalogController } from '../controllers/catalogController.js';

const router = Router();

// Public Customer Catalog Routes
router.get('/categories', CatalogController.getCategories);
router.get('/categories/:slug', CatalogController.getCategoryBySlug);
router.get('/categories/:categorySlug/variants', CatalogController.getVariantsForCategory);
router.get('/categories/:categorySlug/variants/:variantSlug', CatalogController.getVariantBySlug);
router.get('/variants/:id', CatalogController.getVariantById);

export default router;
