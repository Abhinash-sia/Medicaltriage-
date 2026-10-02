import { User } from '../users/user.model.js';
import { UserRole } from '../users/user.types.js';
import { hashPassword } from '../auth/auth.utils.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

/**
 * Ensures a root hospital system administrator account is provisioned upon startup.
 * If no admin with the configured INITIAL_ADMIN_EMAIL exists, it automatically provisions one.
 */
export async function bootstrapInitialAdmin(): Promise<void> {
  try {
    const adminEmail = env.INITIAL_ADMIN_EMAIL.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: adminEmail, isDeleted: false });

    if (existingAdmin) {
      if (existingAdmin.role !== UserRole.ADMIN) {
        existingAdmin.role = UserRole.ADMIN;
        await existingAdmin.save();
        logger.info(`[Bootstrap] Updated existing user ${adminEmail} to ADMIN role.`);
      }
      return;
    }

    const passwordHash = await hashPassword(env.INITIAL_ADMIN_PASSWORD);
    await User.create({
      name: 'Hospital System Administrator',
      email: adminEmail,
      role: UserRole.ADMIN,
      passwordHash,
      facilityId: 'FAC-HQ-ADMIN',
      preferredLanguage: 'en',
      isActive: true,
      isDeleted: false,
    });

    logger.info(
      `[Bootstrap] Successfully provisioned initial root hospital administrator (${adminEmail}).`
    );
  } catch (error) {
    logger.error({ error }, '[Bootstrap] Failed to bootstrap initial root administrator account');
  }
}
