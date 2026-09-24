import { Router } from 'express';
import { authenticateJwt } from '../auth/auth.middleware.js';
import { translationController } from './translation.controller.js';

const translationRouter = Router();

// Case-scoped translation endpoints
translationRouter.post(
  '/cases/:caseId/translations',
  authenticateJwt as any,
  translationController.requestTranslation as any
);

translationRouter.get(
  '/cases/:caseId/translations',
  authenticateJwt as any,
  translationController.getCaseTranslations as any
);

// Direct translation item endpoints
translationRouter.get(
  '/translations/:translationId',
  authenticateJwt as any,
  translationController.getTranslationById as any
);

translationRouter.post(
  '/translations/:translationId/verify',
  authenticateJwt as any,
  translationController.verifyTranslation as any
);

export default translationRouter;
