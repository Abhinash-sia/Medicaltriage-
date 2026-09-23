import { Router } from 'express';
import multer from 'multer';
import { authenticateJwt } from '../auth/auth.middleware.js';
import { visualInputController } from './visual-input.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const visualInputRouter = Router();

// Case-level visual input endpoints
visualInputRouter.post('/cases/:caseId/visual-inputs', authenticateJwt as any, upload.single('file'), visualInputController.uploadVisualInput as any);
visualInputRouter.get('/cases/:caseId/visual-inputs', authenticateJwt as any, visualInputController.getVisualInputsByCase as any);

// Direct visual input endpoints
visualInputRouter.get('/visual-inputs/:visualInputId', authenticateJwt as any, visualInputController.getVisualInput as any);
visualInputRouter.get('/visual-inputs/:visualInputId/file', authenticateJwt as any, visualInputController.downloadVisualInputFile as any);
visualInputRouter.post('/visual-inputs/:visualInputId/verify', authenticateJwt as any, visualInputController.verifyVisualInput as any);

export default visualInputRouter;
