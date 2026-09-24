import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/modules/users/user.model.js';
import { UserRole } from '../src/modules/users/user.types.js';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_DISPLAY_NAMES,
  getLanguageDisplayName,
  isLanguageSupported,
  normalizeLanguageCode,
} from '../src/modules/translation/translation.languages.js';

const app = createApp();

describe('Phase 19 — India Readiness & Language Support Test Suite', () => {
  let patientUserId: string;
  let patientToken: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_triage_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const patient = await User.create({
      name: 'Debashish Panda',
      email: 'debashish.panda@example.com',
      role: UserRole.PATIENT,
      preferredLanguage: 'en',
      isActive: true,
      isDeleted: false,
    });
    patientUserId = patient._id.toString();
    patientToken = jwt.sign({ id: patientUserId, role: UserRole.PATIENT }, env.JWT_SECRET);
  });

  describe('Centralized Language Registry & Display Names', () => {
    const expectedLanguages = [
      { code: 'en', native: 'English' },
      { code: 'hi', native: 'हिन्दी' },
      { code: 'or', native: 'ଓଡ଼ିଆ' },
      { code: 'bn', native: 'বাংলা' },
      { code: 'ta', native: 'தமிழ்' },
      { code: 'te', native: 'తెలుగు' },
      { code: 'mr', native: 'मराठी' },
      { code: 'kn', native: 'ಕನ್ನಡ' },
      { code: 'ml', native: 'മലയാളം' },
      { code: 'pa', native: 'ਪੰਜਾਬੀ' },
      { code: 'gu', native: 'ગુજરાતી' },
    ];

    it('should support all 11 required Indian language codes', () => {
      for (const item of expectedLanguages) {
        expect(isLanguageSupported(item.code)).toBe(true);
        expect(SUPPORTED_LANGUAGES[item.code]).toBeDefined();
        expect(SUPPORTED_LANGUAGES[item.code].enabled).toBe(true);
      }
    });

    it('should correctly map language codes to native display names', () => {
      for (const item of expectedLanguages) {
        const displayName = getLanguageDisplayName(item.code);
        expect(displayName).toBe(item.native);
      }
    });

    it('should normalize locale variants to base language code', () => {
      expect(normalizeLanguageCode('hi-IN')).toBe('hi');
      expect(normalizeLanguageCode('OR-IN')).toBe('or');
      expect(normalizeLanguageCode('bn-IN')).toBe('bn');
      expect(normalizeLanguageCode('en-US')).toBe('en');
    });

    it('should reject unsupported language codes', () => {
      expect(isLanguageSupported('es')).toBe(false);
      expect(isLanguageSupported('fr')).toBe(false);
      expect(isLanguageSupported('de')).toBe(false);
    });
  });

  describe('User Preferred Language Preference APIs', () => {
    it('GET /api/auth/me should return preferredLanguage default to en', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferredLanguage).toBe('en');
    });

    it('PATCH /api/auth/preferences should explicitly update user language preference', async () => {
      const res = await request(app)
        .patch('/api/auth/preferences')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ preferredLanguage: 'or' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.preferredLanguage).toBe('or');

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(meRes.body.data.preferredLanguage).toBe('or');
    });

    it('PATCH /api/auth/preferences should reject unsupported language codes', async () => {
      const res = await request(app)
        .patch('/api/auth/preferences')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ preferredLanguage: 'xx-invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_LANGUAGE_CODE');
    });
  });
});
