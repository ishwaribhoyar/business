import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { ResponseFormatter } from '../utils/response.js';
import { AuthenticationError } from '../utils/errors.js';

const authService = new AuthService();

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { token, user } = await authService.login(email, password);

      ResponseFormatter.success(res, {
        token,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  static getMe(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) {
        throw new AuthenticationError('User session not found');
      }

      ResponseFormatter.success(res, {
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}
