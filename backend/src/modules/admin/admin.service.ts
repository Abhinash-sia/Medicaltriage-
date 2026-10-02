import mongoose from 'mongoose';
import { User } from '../users/user.model.js';
import { UserRole } from '../users/user.types.js';
import { Case } from '../cases/case.model.js';
import { CaseStatus } from '../cases/case.types.js';
import { Notification } from '../notifications/notification.model.js';
import { NotificationStatus } from '../notifications/notification.types.js';
import { Facility } from '../facilities/facility.model.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { AuditEventType } from '../audit/audit-log.types.js';
import { hashPassword } from '../auth/auth.utils.js';
import {
  AdminUsersQuery,
  PaginatedAdminUsersResponse,
  AdminUserItem,
  AdminDashboardMetrics,
  CreateStaffUserInput,
} from './admin.types.js';
import { AppError } from '../../middleware/error-handler.js';

const REVIEWER_ROLES = [
  UserRole.NURSE,
  UserRole.HEALTH_WORKER,
  UserRole.DOCTOR,
  UserRole.MEDICAL_OFFICER,
];

export class AdminService {
  /**
   * Retrieves paginated users list for admin review, strictly excluding password hashes.
   */
  static async listUsers(query: AdminUsersQuery): Promise<PaginatedAdminUsersResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isDeleted: false };

    if (query.role) {
      filter.role = query.role;
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    if (query.facilityId) {
      filter.facilityId = query.facilityId;
    }

    const [total, docs] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const users: AdminUserItem[] = docs.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      facilityId: u.facilityId,
      preferredLanguage: u.preferredLanguage || 'en',
      isActive: u.isActive,
      isDeleted: u.isDeleted,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Deactivates a user account.
   */
  static async deactivateUser(
    targetUserId: string,
    adminId: string,
    requestId?: string
  ): Promise<AdminUserItem> {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      const error: AppError = new Error('Invalid user ID format');
      error.statusCode = 400;
      error.code = 'INVALID_USER_ID';
      throw error;
    }

    if (targetUserId === adminId) {
      const error: AppError = new Error('Administrators cannot deactivate their own account');
      error.statusCode = 400;
      error.code = 'ADMIN_SELF_DEACTIVATION_PROHIBITED';
      throw error;
    }

    const targetUser = await User.findOne({ _id: targetUserId, isDeleted: false }).select(
      '-passwordHash'
    );
    if (!targetUser) {
      const error: AppError = new Error('User account not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    targetUser.isActive = false;
    await targetUser.save();

    const audit = new AuditLog({
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      action: AuditEventType.USER_DEACTIVATED,
      resourceType: 'User',
      resourceId: targetUser._id.toString(),
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'ADMIN_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        targetUserId: targetUser._id.toString(),
        targetUserRole: targetUser.role,
      },
    });
    await audit.save();

    return {
      id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      role: targetUser.role,
      facilityId: targetUser.facilityId,
      preferredLanguage: targetUser.preferredLanguage || 'en',
      isActive: targetUser.isActive,
      isDeleted: targetUser.isDeleted,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
    };
  }

  /**
   * Reactivates a user account.
   */
  static async reactivateUser(
    targetUserId: string,
    adminId: string,
    requestId?: string
  ): Promise<AdminUserItem> {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      const error: AppError = new Error('Invalid user ID format');
      error.statusCode = 400;
      error.code = 'INVALID_USER_ID';
      throw error;
    }

    const targetUser = await User.findOne({ _id: targetUserId, isDeleted: false }).select(
      '-passwordHash'
    );
    if (!targetUser) {
      const error: AppError = new Error('User account not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    targetUser.isActive = true;
    await targetUser.save();

    const audit = new AuditLog({
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      action: AuditEventType.USER_REACTIVATED,
      resourceType: 'User',
      resourceId: targetUser._id.toString(),
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'ADMIN_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        targetUserId: targetUser._id.toString(),
        targetUserRole: targetUser.role,
      },
    });
    await audit.save();

    return {
      id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      role: targetUser.role,
      facilityId: targetUser.facilityId,
      preferredLanguage: targetUser.preferredLanguage || 'en',
      isActive: targetUser.isActive,
      isDeleted: targetUser.isDeleted,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
    };
  }

  /**
   * Returns high-level operational counts for admin dashboard.
   */
  static async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const now = new Date();

    const [
      openCases,
      inReviewCases,
      escalatedCases,
      referredCases,
      overdueCases,
      unreadNotifications,
      activeReviewers,
      activeFacilities,
    ] = await Promise.all([
      Case.countDocuments({ status: CaseStatus.OPEN, isDeleted: false }),
      Case.countDocuments({ status: CaseStatus.IN_REVIEW, isDeleted: false }),
      Case.countDocuments({
        $or: [{ escalatedAt: { $ne: null } }, { status: 'ESCALATED' as any }],
        isDeleted: false,
      }),
      Case.countDocuments({ status: CaseStatus.REFERRED, isDeleted: false }),
      Case.countDocuments({
        status: { $in: [CaseStatus.OPEN, CaseStatus.IN_REVIEW] },
        slaDueAt: { $lte: now },
        escalatedAt: null,
        isDeleted: false,
      }),
      Notification.countDocuments({
        status: { $in: [NotificationStatus.SENT, NotificationStatus.PENDING] },
      }),
      User.countDocuments({
        role: { $in: REVIEWER_ROLES },
        isActive: true,
        isDeleted: false,
      }),
      Facility.countDocuments({ active: true }),
    ]);

    return {
      openCases,
      inReviewCases,
      escalatedCases,
      referredCases,
      overdueCases,
      unreadNotifications,
      activeReviewers,
      activeFacilities,
    };
  }

  /**
   * Provisions a clinical or administrative staff user (Doctor, Nurse, Medical Officer, Admin).
   * Hashes the password, persists user, and records an audit log.
   */
  static async createStaffUser(
    input: CreateStaffUserInput,
    adminId: string,
    requestId?: string
  ): Promise<AdminUserItem> {
    const email = input.email && input.email.trim() ? input.email.trim().toLowerCase() : undefined;
    const phone = input.phone && input.phone.trim() ? input.phone.trim() : undefined;

    if (email) {
      const existingEmail = await User.findOne({ email, isDeleted: false });
      if (existingEmail) {
        const error: AppError = new Error(`A user with email '${email}' already exists.`);
        error.statusCode = 409;
        error.code = 'USER_ALREADY_EXISTS';
        throw error;
      }
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone, isDeleted: false });
      if (existingPhone) {
        const error: AppError = new Error(`A user with phone '${phone}' already exists.`);
        error.statusCode = 409;
        error.code = 'USER_ALREADY_EXISTS';
        throw error;
      }
    }

    const passwordHash = await hashPassword(input.password);

    const newUser = await User.create({
      name: input.name.trim(),
      email,
      phone,
      passwordHash,
      role: input.role,
      facilityId: input.facilityId && input.facilityId.trim() ? input.facilityId.trim() : undefined,
      preferredLanguage: input.preferredLanguage || 'en',
      isActive: true,
      isDeleted: false,
    });

    const audit = new AuditLog({
      actorId: adminId,
      actorRole: UserRole.ADMIN,
      action: AuditEventType.USER_PROVISIONED,
      resourceType: 'User',
      resourceId: newUser._id.toString(),
      requestId: requestId || null,
      timestamp: new Date(),
      source: 'ADMIN_SERVICE',
      outcome: 'SUCCESS',
      metadata: {
        provisionedUserId: newUser._id.toString(),
        provisionedRole: newUser.role,
        provisionedEmail: newUser.email,
        facilityId: newUser.facilityId,
      },
    });
    await audit.save().catch(() => {});

    return {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      facilityId: newUser.facilityId,
      preferredLanguage: newUser.preferredLanguage,
      isActive: newUser.isActive,
      isDeleted: newUser.isDeleted,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }
}
