import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { SafeAdminUser, AdminRole } from '../models/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: SafeAdminUser;
    }
  }
}

const authService = new AuthService();

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Authorization token required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyToken(token);
    const user = await authService.getUserById(payload.userId);
    if (!user || user.is_active === 0 || (user.is_active as any) === false) {
      return next(new AuthenticationError('User account not found or deactivated'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Invalid or expired authentication token'));
    }
  }
}

export function authorize(...allowedRoles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('User authentication required before authorization'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(`Role '${req.user.role}' is not authorized to access this resource`));
    }

    next();
  };
}
