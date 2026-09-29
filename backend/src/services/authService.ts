import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminUserRepository } from '../repositories/adminUserRepository.js';
import { SafeAdminUser } from '../models/index.js';
import { AuthenticationError } from '../utils/errors.js';
import { config } from '../config/index.js';
import { Logger } from '../utils/logger.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  private userRepo: AdminUserRepository;

  constructor(userRepo?: AdminUserRepository) {
    this.userRepo = userRepo ?? new AdminUserRepository();
  }

  async login(email: string, password: string): Promise<{ token: string; user: SafeAdminUser }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || user.is_active === 0 || (user.is_active as any) === false) {
      Logger.warn(`Failed login attempt for email: ${email}`);
      throw new AuthenticationError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      Logger.warn(`Invalid password attempt for email: ${email}`);
      throw new AuthenticationError('Invalid email or password');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const now = new Date().toISOString();
    await this.userRepo.updateLastLogin(user.id, now);
    Logger.info(`Admin user logged in successfully: ${user.email} (${user.role})`);

    const { password_hash, ...safeUser } = user;
    return { token, user: safeUser };
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret as jwt.Secret) as TokenPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired authentication token');
    }
  }

  async getUserById(id: string): Promise<SafeAdminUser | null> {
    const user = await this.userRepo.findById(id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
}
