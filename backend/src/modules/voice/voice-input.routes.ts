import { Router } from 'express';
import multer from 'multer';
import { authenticateJwt } from '../auth/auth.middleware.js';
import { voiceInputController } from './voice-input.controller.js';
import { env } from '../../config/env.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_AUDIO_UPLOAD_MB * 1024 * 1024,
  },
});

const voiceInputRouter = Router();

// Case-scoped voice input endpoints
voiceInputRouter.post('/cases/:caseId/voice-inputs', authenticateJwt as any, upload.single('file'), voiceInputController.uploadVoiceInput as any);
voiceInputRouter.get('/cases/:caseId/voice-inputs', authenticateJwt as any, voiceInputController.getVoiceInputsForCase as any);

// Voice input item endpoints
voiceInputRouter.get('/voice-inputs/:voiceInputId', authenticateJwt as any, voiceInputController.getVoiceInputById as any);
voiceInputRouter.get('/voice-inputs/:voiceInputId/file', authenticateJwt as any, voiceInputController.getAudioFileStream as any);
voiceInputRouter.post('/voice-inputs/:voiceInputId/verify', authenticateJwt as any, voiceInputController.verifyVoiceInput as any);

export default voiceInputRouter;
