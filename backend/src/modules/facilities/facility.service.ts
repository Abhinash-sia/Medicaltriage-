import mongoose from 'mongoose';
import { Facility } from './facility.model.js';
import {
  CreateFacilityInput,
  UpdateFacilityInput,
  UpdateFacilityLanguagesInput,
  IFacility,
} from './facility.types.js';
import { isLanguageSupported, normalizeLanguageCode } from '../translation/translation.languages.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { UserRole } from '../users/user.types.js';
import { AppError } from '../../middleware/error-handler.js';

export class FacilityService {
  static async createFacility(
    input: CreateFacilityInput,
    actorId: string,
    actorRole: UserRole,
    requestId?: string
  ): Promise<IFacility> {
    const existing = await Facility.findOne({ code: input.code.toUpperCase() });
    if (existing) {
      const error: AppError = new Error(`Facility with code '${input.code}' already exists`);
      error.statusCode = 400;
      error.code = 'FACILITY_DUPLICATE_CODE';
      throw error;
    }

    const validatedLangs = (input.supportedLanguages || ['en', 'hi'])
      .filter((lang) => isLanguageSupported(lang))
      .map((lang) => normalizeLanguageCode(lang));

    const facility = await Facility.create({
      name: input.name,
      code: input.code.toUpperCase(),
      type: input.type,
      district: input.district || null,
      state: input.state || null,
      supportedLanguages: validatedLangs.length > 0 ? validatedLangs : ['en', 'hi'],
      active: input.active !== undefined ? input.active : true,
    });

    const audit = new AuditLog({
      actorId,
      actorRole,
      action: AuditEventType.FACILITY_UPDATED,
      resourceType: 'Facility',
      resourceId: facility._id.toString(),
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'FACILITY_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        actionType: 'CREATE',
        code: facility.code,
        name: facility.name,
      },
    });
    await audit.save();

    return facility.toObject();
  }

  static async getFacilities(activeOnly = false): Promise<IFacility[]> {
    const filter = activeOnly ? { active: true } : {};
    return Facility.find(filter).sort({ name: 1 });
  }

  static async getFacilityById(facilityId: string): Promise<IFacility> {
    let query: Record<string, unknown> = { code: facilityId.toUpperCase() };
    if (mongoose.Types.ObjectId.isValid(facilityId)) {
      query = { $or: [{ _id: facilityId }, { code: facilityId.toUpperCase() }] };
    }

    const facility = await Facility.findOne(query);
    if (!facility) {
      const error: AppError = new Error('Facility not found');
      error.statusCode = 404;
      error.code = 'FACILITY_NOT_FOUND';
      throw error;
    }
    return facility.toObject();
  }

  static async updateFacility(
    facilityId: string,
    input: UpdateFacilityInput,
    actorId: string,
    actorRole: UserRole,
    requestId?: string
  ): Promise<IFacility> {
    let query: Record<string, unknown> = { code: facilityId.toUpperCase() };
    if (mongoose.Types.ObjectId.isValid(facilityId)) {
      query = { $or: [{ _id: facilityId }, { code: facilityId.toUpperCase() }] };
    }

    const facility = await Facility.findOne(query);
    if (!facility) {
      const error: AppError = new Error('Facility not found');
      error.statusCode = 404;
      error.code = 'FACILITY_NOT_FOUND';
      throw error;
    }

    if (input.name) facility.name = input.name;
    if (input.type) facility.type = input.type;
    if (input.district !== undefined) facility.district = input.district;
    if (input.state !== undefined) facility.state = input.state;
    if (input.active !== undefined) facility.active = input.active;

    if (input.supportedLanguages) {
      const validated = input.supportedLanguages
        .filter((l) => isLanguageSupported(l))
        .map((l) => normalizeLanguageCode(l));
      if (validated.length > 0) {
        facility.supportedLanguages = validated;
      }
    }

    await facility.save();

    const audit = new AuditLog({
      actorId,
      actorRole,
      action: AuditEventType.FACILITY_UPDATED,
      resourceType: 'Facility',
      resourceId: facility._id.toString(),
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'FACILITY_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        actionType: 'UPDATE',
        code: facility.code,
        changes: input,
      },
    });
    await audit.save();

    return facility.toObject();
  }

  static async updateFacilityLanguages(
    facilityId: string,
    input: UpdateFacilityLanguagesInput,
    actorId: string,
    actorRole: UserRole,
    requestId?: string
  ): Promise<IFacility> {
    let query: Record<string, unknown> = { code: facilityId.toUpperCase() };
    if (mongoose.Types.ObjectId.isValid(facilityId)) {
      query = { $or: [{ _id: facilityId }, { code: facilityId.toUpperCase() }] };
    }

    const facility = await Facility.findOne(query);
    if (!facility) {
      const error: AppError = new Error('Facility not found');
      error.statusCode = 404;
      error.code = 'FACILITY_NOT_FOUND';
      throw error;
    }

    const validatedLangs: string[] = [];
    const invalidLangs: string[] = [];

    for (const lang of input.supportedLanguages) {
      if (isLanguageSupported(lang)) {
        validatedLangs.push(normalizeLanguageCode(lang));
      } else {
        invalidLangs.push(lang);
      }
    }

    if (invalidLangs.length > 0) {
      const error: AppError = new Error(`Unsupported language code(s): ${invalidLangs.join(', ')}`);
      error.statusCode = 400;
      error.code = 'INVALID_LANGUAGE_CODE';
      throw error;
    }

    facility.supportedLanguages = Array.from(new Set(validatedLangs));
    await facility.save();

    const audit = new AuditLog({
      actorId,
      actorRole,
      action: AuditEventType.FACILITY_LANGUAGE_UPDATED,
      resourceType: 'Facility',
      resourceId: facility._id.toString(),
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'FACILITY_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        code: facility.code,
        supportedLanguages: facility.supportedLanguages,
      },
    });
    await audit.save();

    return facility.toObject();
  }
}
