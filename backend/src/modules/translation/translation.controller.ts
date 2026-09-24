import { Request, Response } from 'express';
import { translationService } from './translation.service.js';
import { Case } from '../cases/case.model.js';
import { createTranslationSchema } from './translation.types.js';
import { logger } from '../../lib/logger.js';
import { UserRole } from '../users/user.types.js';

const REVIEWER_ROLES: string[] = [
  UserRole.NURSE,
  UserRole.HEALTH_WORKER,
  UserRole.DOCTOR,
  UserRole.MEDICAL_OFFICER,
  UserRole.ADMIN,
];

export class TranslationController {
  /**
   * Request a new translation for a case content item.
   */
  public async requestTranslation(req: Request, res: Response): Promise<void> {
    try {
      const caseId = req.params.caseId as string;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const caseDoc = await Case.findById(caseId);
      if (!caseDoc) {
        res.status(404).json({ success: false, error: 'Case not found' });
        return;
      }

      // Authorization check
      if (user.role === 'PATIENT') {
        if (caseDoc.patientId?.toString() !== user.id) {
          res.status(403).json({ success: false, error: 'Access denied to this case' });
          return;
        }
      } else {
        if (user.role !== 'ADMIN' && user.facilityId && caseDoc.facilityId) {
          if (user.facilityId.toString() !== caseDoc.facilityId.toString()) {
            res.status(403).json({ success: false, error: 'Access denied to facility case' });
            return;
          }
        }
      }

      const parseResult = createTranslationSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parseResult.error.format(),
        });
        return;
      }

      const { sourceType, sourceId, targetLanguage, sourceLanguage } = parseResult.data;

      const translation = await translationService.translateContent({
        caseId,
        sourceType,
        sourceId,
        targetLanguage,
        sourceLanguage,
        requestedByUserId: user.id,
      });

      res.status(201).json({
        success: true,
        data: translation,
      });
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Error in requestTranslation controller');
      const statusCode = err?.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        error: err?.message || 'Translation request could not be processed.',
      });
    }
  }

  /**
   * Get all translations for a case.
   */
  public async getCaseTranslations(req: Request, res: Response): Promise<void> {
    try {
      const caseId = req.params.caseId as string;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const caseDoc = await Case.findById(caseId);
      if (!caseDoc) {
        res.status(404).json({ success: false, error: 'Case not found' });
        return;
      }

      if (user.role === 'PATIENT') {
        if (caseDoc.patientId?.toString() !== user.id) {
          res.status(403).json({ success: false, error: 'Access denied to this case' });
          return;
        }
      } else {
        if (user.role !== 'ADMIN' && user.facilityId && caseDoc.facilityId) {
          if (user.facilityId.toString() !== caseDoc.facilityId.toString()) {
            res.status(403).json({ success: false, error: 'Access denied to facility case' });
            return;
          }
        }
      }

      const translations = await translationService.getTranslationsForCase(caseId);

      res.status(200).json({
        success: true,
        data: translations,
      });
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Error in getCaseTranslations controller');
      const statusCode = err?.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: err?.message || 'Could not retrieve translations.',
      });
    }
  }

  /**
   * Get translation record by ID.
   */
  public async getTranslationById(req: Request, res: Response): Promise<void> {
    try {
      const translationId = req.params.translationId as string;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const translation = await translationService.getTranslationById(translationId);
      const caseDoc = await Case.findById(translation.caseId);

      if (!caseDoc) {
        res.status(404).json({ success: false, error: 'Case not found' });
        return;
      }

      if (user.role === 'PATIENT') {
        if (caseDoc.patientId?.toString() !== user.id) {
          res.status(403).json({ success: false, error: 'Access denied to this translation' });
          return;
        }
      } else {
        if (user.role !== 'ADMIN' && user.facilityId && caseDoc.facilityId) {
          if (user.facilityId.toString() !== caseDoc.facilityId.toString()) {
            res.status(403).json({ success: false, error: 'Access denied to facility translation' });
            return;
          }
        }
      }

      res.status(200).json({
        success: true,
        data: translation,
      });
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Error in getTranslationById controller');
      const statusCode = err?.statusCode || 404;
      res.status(statusCode).json({
        success: false,
        error: err?.message || 'Translation not found.',
      });
    }
  }

  /**
   * Verify a translation (Reviewers only).
   */
  public async verifyTranslation(req: Request, res: Response): Promise<void> {
    try {
      const translationId = req.params.translationId as string;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      if (!REVIEWER_ROLES.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: 'Only authorized reviewers can verify translations',
        });
        return;
      }

      const translation = await translationService.getTranslationById(translationId);
      const caseDoc = await Case.findById(translation.caseId);

      if (!caseDoc) {
        res.status(404).json({ success: false, error: 'Case not found' });
        return;
      }

      if (user.role !== 'ADMIN' && user.facilityId && caseDoc.facilityId) {
        if (user.facilityId.toString() !== caseDoc.facilityId.toString()) {
          res.status(403).json({ success: false, error: 'Access denied to facility translation' });
          return;
        }
      }

      const updated = await translationService.verifyTranslation(translationId, user.id);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Error in verifyTranslation controller');
      const statusCode = err?.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        error: err?.message || 'Could not verify translation.',
      });
    }
  }
}

export const translationController = new TranslationController();
