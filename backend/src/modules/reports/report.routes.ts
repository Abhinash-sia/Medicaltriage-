import { Router } from 'express';
import multer from 'multer';
import { authenticateJwt } from '../auth/auth.middleware.js';
import { reportController } from './report.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const router = Router();

// Case-level report endpoints
router.post('/cases/:caseId/reports', authenticateJwt as any, upload.single('file'), reportController.uploadReport as any);
router.get('/cases/:caseId/reports', authenticateJwt as any, reportController.getReportsByCase as any);

// Direct report endpoints
router.get('/reports/:reportId', authenticateJwt as any, reportController.getReport as any);
router.get('/reports/:reportId/file', authenticateJwt as any, reportController.downloadReportFile as any);
router.post('/reports/:reportId/verify', authenticateJwt as any, reportController.verifyReport as any);

export default router;
