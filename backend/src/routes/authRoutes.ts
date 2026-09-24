import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { loginSchema } from '../schemas/index.js';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

export default router;
