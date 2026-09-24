import { Router } from 'express';
import { ProductController } from '../controllers/productController.js';

const router = Router();

router.get('/', ProductController.getAll);
router.get('/:slug', ProductController.getBySlug);

export default router;
