import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/modules/users/user.model.js';
import { UserRole, IUser } from '../src/modules/users/user.types.js';
import { signToken, hashPassword } from '../src/modules/auth/auth.utils.js';

describe('Phase 3 Authentication & Authorization API Tests', () => {
  const app = createApp();
  let mockDbUsers: Map<string, IUser & { passwordHash?: string }>;

  beforeEach(() => {
    mockDbUsers = new Map();

    // Mock User.findOne
    vi.spyOn(User, 'findOne').mockImplementation((query: unknown) => {
      const q = query as {
        $or?: Array<{ email?: string; phone?: string }>;
        _id?: string | mongoose.Types.ObjectId;
        email?: string;
        phone?: string;
        isDeleted?: boolean;
        isActive?: boolean;
      };

      let foundUser: (IUser & { passwordHash?: string }) | undefined;

      for (const u of mockDbUsers.values()) {
        if (q.isDeleted !== undefined && u.isDeleted !== q.isDeleted) continue;
        if (q.isActive !== undefined && u.isActive !== q.isActive) continue;

        if (q._id && u._id?.toString() === q._id.toString()) {
          foundUser = u;
          break;
        }

        if (q.email && u.email?.toLowerCase() === q.email.toLowerCase()) {
          foundUser = u;
          break;
        }

        if (q.phone && u.phone === q.phone) {
          foundUser = u;
          break;
        }

        if (q.$or) {
          const matched = q.$or.some(
            (cond) =>
              (cond.email && u.email?.toLowerCase() === cond.email.toLowerCase()) ||
              (cond.phone && u.phone === cond.phone)
          );
          if (matched) {
            foundUser = u;
            break;
          }
        }
      }

      // Mongoose query chain helper mock (supports .select('+passwordHash'))
      const mockQueryChain = {
        select: (fields: string) => {
          if (!foundUser) return Promise.resolve(null);
          const doc = {
            ...foundUser,
            _id: foundUser._id || new mongoose.Types.ObjectId(),
          };
          if (!fields.includes('+passwordHash')) {
            delete doc.passwordHash;
          }
          return Promise.resolve(doc);
        },
        then: (resolve: (val: unknown) => void) => {
          if (!foundUser) return resolve(null);
          const doc = { ...foundUser, _id: foundUser._id || new mongoose.Types.ObjectId() };
          delete doc.passwordHash;
          return resolve(doc);
        },
      };

      return mockQueryChain as unknown as ReturnType<typeof User.findOne>;
    });

    // Mock User.create
    vi.spyOn(User, 'create').mockImplementation((data: unknown) => {
      const docData = data as IUser & { passwordHash?: string };
      const newId = new mongoose.Types.ObjectId();
      const newDoc = {
        ...docData,
        _id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDbUsers.set(newId.toString(), newDoc);
      return Promise.resolve(newDoc) as unknown as ReturnType<typeof User.create>;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new patient user successfully and return accessToken', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Anita Verma',
        email: 'anita.verma@example.com',
        phone: '+919876543210',
        password: 'securePassword123!',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user).toEqual({
        id: expect.any(String),
        name: 'Anita Verma',
        email: 'anita.verma@example.com',
        phone: '+919876543210',
        role: UserRole.PATIENT,
        preferredLanguage: expect.any(String),
        createdAt: expect.any(String),
      });

      // Verify stored document in database
      const savedUser = Array.from(mockDbUsers.values()).find(
        (u) => u.email === 'anita.verma@example.com'
      );
      expect(savedUser).toBeDefined();
      expect(savedUser?.passwordHash).not.toBe('securePassword123!');
      expect(savedUser?.passwordHash?.startsWith('$2')).toBe(true);
    });

    it('should reject self-registration attempt with privileged ADMIN role', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Malicious User',
        email: 'attacker@example.com',
        password: 'password123',
        role: UserRole.ADMIN,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_VALIDATION_ERROR');
    });

    it('should reject registration with password shorter than 8 characters', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Short Pass User',
        email: 'shortpass@example.com',
        password: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_VALIDATION_ERROR');
    });

    it('should handle duplicate email registration safely', async () => {
      const existingId = new mongoose.Types.ObjectId();
      mockDbUsers.set(existingId.toString(), {
        _id: existingId,
        name: 'Existing User',
        email: 'duplicate@example.com',
        role: UserRole.PATIENT,
        passwordHash: '$2a$10$hashed',
        isActive: true,
        isDeleted: false,
      });

      const response = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Registrant',
        email: 'duplicate@example.com',
        password: 'newPassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_DUPLICATE_IDENTITY');
    });

    it('should handle duplicate phone registration safely', async () => {
      const existingId = new mongoose.Types.ObjectId();
      mockDbUsers.set(existingId.toString(), {
        _id: existingId,
        name: 'Existing Phone User',
        phone: '+919999999999',
        role: UserRole.PATIENT,
        passwordHash: '$2a$10$hashed',
        isActive: true,
        isDeleted: false,
      });

      const response = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Phone Registrant',
        phone: '+919999999999',
        password: 'newPassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_DUPLICATE_IDENTITY');
    });
  });

  describe('POST /api/auth/login', () => {
    let testPasswordHash: string;

    beforeEach(async () => {
      testPasswordHash = await hashPassword('ValidPassword123!');
      const userId = new mongoose.Types.ObjectId();
      mockDbUsers.set(userId.toString(), {
        _id: userId,
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        passwordHash: testPasswordHash,
        role: UserRole.PATIENT,
        isActive: true,
        isDeleted: false,
      });
    });

    it('should authenticate valid credentials, issue token, and minimize JWT payload', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'rajesh.kumar@example.com',
        password: 'ValidPassword123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe('rajesh.kumar@example.com');

      // Verify minimized JWT token payload explicitly (Phase 3 & Phase 19 Security Invariant)
      const token = response.body.data.accessToken;
      const decoded = jwt.decode(token) as Record<string, unknown>;

      expect(decoded).toBeDefined();
      expect(decoded.id).toBeDefined();
      expect(decoded.role).toBe(UserRole.PATIENT);
      expect(decoded.iat).toBeTypeOf('number');
      expect(decoded.exp).toBeTypeOf('number');

      // Strict claims invariant: ONLY id, role, iat, exp are present
      expect(Object.keys(decoded).sort()).toEqual(['exp', 'iat', 'id', 'role']);

      // Explicit negative checks for profile/preference leakage
      expect(decoded).not.toHaveProperty('preferredLanguage');
      expect(decoded).not.toHaveProperty('email');
      expect(decoded).not.toHaveProperty('phone');
      expect(decoded).not.toHaveProperty('password');
      expect(decoded).not.toHaveProperty('passwordHash');
      expect(decoded).not.toHaveProperty('name');
      expect(decoded).not.toHaveProperty('facilityId');
    });

    it('should fail generically with invalid password without leaking error details', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'rajesh.kumar@example.com',
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email/phone or password');
    });

    it('should fail generically for nonexistent email account', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'AnyPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should reject login for inactive user accounts', async () => {
      const inactiveId = new mongoose.Types.ObjectId();
      mockDbUsers.set(inactiveId.toString(), {
        _id: inactiveId,
        name: 'Inactive User',
        email: 'inactive@example.com',
        passwordHash: testPasswordHash,
        role: UserRole.PATIENT,
        isActive: false,
        isDeleted: false,
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'inactive@example.com',
        password: 'ValidPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should reject login for soft-deleted user accounts', async () => {
      const deletedId = new mongoose.Types.ObjectId();
      mockDbUsers.set(deletedId.toString(), {
        _id: deletedId,
        name: 'Deleted User',
        email: 'deleted@example.com',
        passwordHash: testPasswordHash,
        role: UserRole.PATIENT,
        isActive: true,
        isDeleted: true,
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'deleted@example.com',
        password: 'ValidPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    let meUserId: mongoose.Types.ObjectId;
    let meToken: string;

    beforeEach(() => {
      meUserId = new mongoose.Types.ObjectId();
      mockDbUsers.set(meUserId.toString(), {
        _id: meUserId,
        name: 'Me Route User',
        email: 'meroute@example.com',
        role: UserRole.PATIENT,
        isActive: true,
        isDeleted: false,
      });
      meToken = signToken({ id: meUserId.toString(), role: UserRole.PATIENT });
    });

    it('should return current authenticated user public profile with valid JWT', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${meToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('meroute@example.com');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should return 401 when Authorization header is malformed', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic dXNlcjpwYXNz');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should return 401 when JWT token is invalid or tampered', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_tampered_token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should return 401 when JWT token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: meUserId.toString(), role: UserRole.PATIENT },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_EXPIRED');
    });

    it('should return 401 for valid token if underlying user account is inactive', async () => {
      const inactiveUser = new mongoose.Types.ObjectId();
      mockDbUsers.set(inactiveUser.toString(), {
        _id: inactiveUser,
        name: 'Inactive Token User',
        email: 'inactivetoken@example.com',
        role: UserRole.PATIENT,
        isActive: false,
        isDeleted: false,
      });

      const token = signToken({ id: inactiveUser.toString(), role: UserRole.PATIENT });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_ACCOUNT_INACTIVE');
    });

    it('should return 401 for valid token if underlying user account is deleted', async () => {
      const deletedUser = new mongoose.Types.ObjectId();
      mockDbUsers.set(deletedUser.toString(), {
        _id: deletedUser,
        name: 'Deleted Token User',
        email: 'deletedtoken@example.com',
        role: UserRole.PATIENT,
        isActive: true,
        isDeleted: true,
      });

      const token = signToken({ id: deletedUser.toString(), role: UserRole.PATIENT });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_ACCOUNT_INACTIVE');
    });
  });

  describe('RBAC Authorization Middleware', () => {
    it('should allow access to users with authorized role', async () => {
      const doctorId = new mongoose.Types.ObjectId();
      mockDbUsers.set(doctorId.toString(), {
        _id: doctorId,
        name: 'Dr. Test',
        email: 'doctor@example.com',
        role: UserRole.DOCTOR,
        isActive: true,
        isDeleted: false,
      });

      const doctorToken = signToken({ id: doctorId.toString(), role: UserRole.DOCTOR });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.role).toBe(UserRole.DOCTOR);
    });
  });

  describe('Rate Limiter Protection on POST /api/auth/login', () => {
    it('should rate limit excessive login attempts from same IP', async () => {
      // Perform 10 failed login requests to exhaust limit threshold (10 max)
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/auth/login').send({
          email: `test_${i}@example.com`,
          password: 'invalid',
        });
      }

      // 11th request should be rate-limited by loginLimiter (429)
      const response = await request(app).post('/api/auth/login').send({
        email: 'test_11@example.com',
        password: 'invalid',
      });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOO_MANY_ATTEMPTS');
    });
  });
});
