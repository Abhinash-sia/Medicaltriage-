import { User } from '../users/user.model.js';
import { UserRole, IUser } from '../users/user.types.js';
import { RegisterInput, LoginInput } from './auth.schemas.js';
import { hashPassword, comparePassword, signToken, signRefreshToken, verifyRefreshToken } from './auth.utils.js';
import { isLanguageSupported, normalizeLanguageCode } from '../translation/translation.languages.js';
import { AppError } from '../../middleware/error-handler.js';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: UserRole;
    facilityId?: string;
    preferredLanguage?: string;
    createdAt?: Date;
  };
  accessToken: string;
  refreshToken?: string;
}

export class AuthService {
  static async registerUser(input: RegisterInput): Promise<AuthResponse> {
    const queryConditions: Array<{ email?: string; phone?: string }> = [];
    if (input.email && input.email !== '') queryConditions.push({ email: input.email.toLowerCase() });
    if (input.phone && input.phone !== '') queryConditions.push({ phone: input.phone });

    if (queryConditions.length > 0) {
      const existingUser = await User.findOne({ $or: queryConditions });
      if (existingUser) {
        const error: AppError = new Error('An account with this email or phone number already exists.');
        error.statusCode = 400;
        error.code = 'AUTH_DUPLICATE_IDENTITY';
        throw error;
      }
    }

    const passwordHash = await hashPassword(input.password);

    const newUser = await User.create({
      name: input.name,
      email: input.email && input.email !== '' ? input.email.toLowerCase() : undefined,
      phone: input.phone && input.phone !== '' ? input.phone : undefined,
      passwordHash,
      role: UserRole.PATIENT, // Mandatory PATIENT role for public self-registration
      preferredLanguage: 'en',
      isActive: true,
      isDeleted: false,
    });

    const token = signToken({
      id: newUser._id.toString(),
      role: newUser.role,
    });
    const refreshToken = signRefreshToken(newUser._id.toString());

    return {
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        facilityId: newUser.facilityId,
        preferredLanguage: newUser.preferredLanguage || 'en',
        createdAt: newUser.createdAt,
      },
      accessToken: token,
      refreshToken,
    };
  }

  static async loginUser(input: LoginInput): Promise<AuthResponse> {
    const queryConditions: Array<{ email?: string; phone?: string }> = [];
    if (input.email && input.email !== '') queryConditions.push({ email: input.email.toLowerCase() });
    if (input.phone && input.phone !== '') queryConditions.push({ phone: input.phone });

    if (queryConditions.length === 0) {
      const error: AppError = new Error('Invalid email/phone or password');
      error.statusCode = 401;
      error.code = 'AUTH_INVALID_CREDENTIALS';
      throw error;
    }

    const user = await User.findOne({
      $or: queryConditions,
      isDeleted: false,
    }).select('+passwordHash');

    if (!user || !user.passwordHash || !user.isActive) {
      const error: AppError = new Error('Invalid email/phone or password');
      error.statusCode = 401;
      error.code = 'AUTH_INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      const error: AppError = new Error('Invalid email/phone or password');
      error.statusCode = 401;
      error.code = 'AUTH_INVALID_CREDENTIALS';
      throw error;
    }

    const token = signToken({
      id: user._id.toString(),
      role: user.role,
    });
    const refreshExpiry = user.role === 'PATIENT' ? '7d' : '12h';
    const refreshToken = signRefreshToken(user._id.toString(), refreshExpiry);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        facilityId: user.facilityId,
        preferredLanguage: user.preferredLanguage || 'en',
        createdAt: user.createdAt,
      },
      accessToken: token,
      refreshToken,
    };
  }

  static async refreshSession(refreshTokenStr: string): Promise<AuthResponse> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshTokenStr);
    } catch (err: unknown) {
      const isExpired = err instanceof Error && err.name === 'TokenExpiredError';
      const error: AppError = new Error(isExpired ? 'Refresh token expired' : 'Invalid refresh token');
      error.statusCode = 401;
      error.code = isExpired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID';
      throw error;
    }

    if (!payload || !payload.id || payload.tokenType !== 'refresh') {
      const error: AppError = new Error('Invalid refresh token');
      error.statusCode = 401;
      error.code = 'AUTH_TOKEN_INVALID';
      throw error;
    }

    const user = await User.findOne({ _id: payload.id, isDeleted: false, isActive: true });
    if (!user) {
      const error: AppError = new Error('Account inactive or deleted');
      error.statusCode = 401;
      error.code = 'AUTH_ACCOUNT_INACTIVE';
      throw error;
    }

    const newAccessToken = signToken({
      id: user._id.toString(),
      role: user.role,
    });
    const refreshExpiry = user.role === 'PATIENT' ? '7d' : '12h';
    const newRefreshToken = signRefreshToken(user._id.toString(), refreshExpiry);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        facilityId: user.facilityId,
        preferredLanguage: user.preferredLanguage || 'en',
        createdAt: user.createdAt,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async getCurrentUser(userId: string): Promise<Omit<IUser, 'passwordHash'> & { id: string }> {
    const user = await User.findOne({ _id: userId, isDeleted: false, isActive: true });

    if (!user) {
      const error: AppError = new Error('Account inactive or not found');
      error.statusCode = 401;
      error.code = 'AUTH_ACCOUNT_INACTIVE';
      throw error;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      facilityId: user.facilityId,
      preferredLanguage: user.preferredLanguage || 'en',
      isActive: user.isActive,
      isDeleted: user.isDeleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async updatePreferences(
    userId: string,
    preferredLanguage: string
  ): Promise<Omit<IUser, 'passwordHash'> & { id: string }> {
    if (!isLanguageSupported(preferredLanguage)) {
      const error: AppError = new Error(`Unsupported language code: ${preferredLanguage}`);
      error.statusCode = 400;
      error.code = 'INVALID_LANGUAGE_CODE';
      throw error;
    }

    const normalizedLang = normalizeLanguageCode(preferredLanguage);
    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false, isActive: true },
      { $set: { preferredLanguage: normalizedLang } },
      { new: true }
    );

    if (!user) {
      const error: AppError = new Error('Account inactive or not found');
      error.statusCode = 401;
      error.code = 'AUTH_ACCOUNT_INACTIVE';
      throw error;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      facilityId: user.facilityId,
      preferredLanguage: user.preferredLanguage || 'en',
      isActive: user.isActive,
      isDeleted: user.isDeleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

