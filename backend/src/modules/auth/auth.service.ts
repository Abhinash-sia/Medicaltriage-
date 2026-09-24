import { User } from '../users/user.model.js';
import { UserRole, IUser } from '../users/user.types.js';
import { RegisterInput, LoginInput } from './auth.schemas.js';
import { hashPassword, comparePassword, signToken } from './auth.utils.js';
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

