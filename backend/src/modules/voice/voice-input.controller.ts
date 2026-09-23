import { Request, Response } from 'express';
import { voiceInputService } from './voice-input.service.js';
import { Case } from '../cases/case.model.js';
import { logger } from '../../lib/logger.js';

/**
 * Controller handling voice input REST endpoints.
 */
export class VoiceInputController {
  /**
   * Upload voice audio for a case.
   */
  public async uploadVoiceInput(req: Request, res: Response): Promise<void> {
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

      // Access control: Patient can only upload to own case
      if (user.role === 'PATIENT') {
        const patientIdStr = caseDoc.patientId?.toString();
        if (patientIdStr !== user.id) {
          res.status(403).json({ success: false, error: 'Access denied to this case' });
          return;
        }
      } else {
        // Staff check facility access
        if (user.role !== 'ADMIN' && user.facilityId && caseDoc.facilityId) {
          if (user.facilityId.toString() !== caseDoc.facilityId.toString()) {
            res.status(403).json({ success: false, error: 'Access denied to facility case' });
            return;
          }
        }
      }

      let fileBuffer: Buffer | null = null;
      let declaredMimeType = '';
      let originalFilename = '';

      // Handle multipart file upload or JSON base64 upload
      if (req.file) {
        fileBuffer = req.file.buffer;
        declaredMimeType = req.file.mimetype;
        originalFilename = req.file.originalname;
      } else if (req.body?.audioBase64) {
        fileBuffer = Buffer.from(req.body.audioBase64, 'base64');
        declaredMimeType = req.body.mimeType || 'audio/wav';
        originalFilename = req.body.originalFilename || 'recording.wav';
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        res.status(400).json({ success: false, error: 'No audio file or base64 payload provided' });
        return;
      }

      const requestedLanguage = req.body?.language || req.body?.requestedLanguage;

      const result = await voiceInputService.uploadVoiceInput(
        caseId,
        fileBuffer,
        declaredMimeType,
        originalFilename,
        user.id,
        requestedLanguage
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Error in uploadVoiceInput controller');
      res.status(400).json({
        success: false,
        error: err?.message || 'Audio transcription could not be completed.',
      });
    }
  }

  /**
   * Get all voice inputs for a case.
   */
  public async getVoiceInputsForCase(req: Request, res: Response): Promise<void> {
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

      // Authorization
      if (user.role === 'PATIENT') {
        if (caseDoc.patientId?.toString() !== user.id) {
          res.status(403).json({ success: false, error: 'Access denied to this case' });
          return;
        }
      } else if (user.role !== 'ADMIN' && user.facilityId && caseDoc.facilityId) {
        if (user.facilityId.toString() !== caseDoc.facilityId.toString()) {
          res.status(403).json({ success: false, error: 'Access denied to facility case' });
          return;
        }
      }

      const items = await voiceInputService.getVoiceInputsForCase(caseId);
      res.status(200).json({ success: true, data: items });
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Error in getVoiceInputsForCase controller');
      res.status(500).json({ success: false, error: 'Failed to retrieve voice inputs' });
    }
  }

  /**
   * Get single voice input metadata by ID.
   */
  public async getVoiceInputById(req: Request, res: Response): Promise<void> {
    try {
      const voiceInputId = req.params.voiceInputId as string;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const voiceInput = await voiceInputService.getVoiceInputById(voiceInputId);
      if (!voiceInput) {
        res.status(404).json({ success: false, error: 'Voice input not found' });
        return;
      }

      const caseDoc = await Case.findById(voiceInput.caseId);
      if (!caseDoc) {
        res.status(404).json({ success: false, error: 'Associated case not found' });
        return;
      }

      // Authorization
      if (user.role === 'PATIENT') {
        if (caseDoc.patientId?.toString() !== user.id) {
          res.status(403).json({ success: false, error: 'Access denied to this voice input' });
          return;
        }
      } else if (user.role !== 'ADMIN' && user.facilityId && caseDoc.facilityId) {
        if (user.facilityId.toString() !== caseDoc.facilityId.toString()) {
          res.status(403).json({ success: false, error: 'Access denied to facility case' });
          return;
        }
      }

      res.status(200).json({ success: true, data: voiceInput });
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Error in getVoiceInputById controller');
      res.status(500).json({ success: false, error: 'Failed to retrieve voice input' });
    }
  }

  /**
   * Stream audio file for playback or download.
   */
  public async getAudioFileStream(req: Request, res: Response): Promise<void> {
    try {
      const voiceInputId = req.params.voiceInputId as string;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const voiceInput = await voiceInputService.getVoiceInputById(voiceInputId);
      if (!voiceInput) {
        res.status(404).json({ success: false, error: 'Voice input not found' });
        return;
      }

      const caseDoc = await Case.findById(voiceInput.caseId);
      if (!caseDoc) {
        res.status(404).json({ success: false, error: 'Associated case not found' });
        return;
      }

      // Authorization
      if (user.role === 'PATIENT') {
        if (caseDoc.patientId?.toString() !== user.id) {
          res.status(403).json({ success: false, error: 'Access denied to audio stream' });
          return;
        }
      } else if (user.role !== 'ADMIN' && user.facilityId && caseDoc.facilityId) {
        if (user.facilityId.toString() !== caseDoc.facilityId.toString()) {
          res.status(403).json({ success: false, error: 'Access denied to facility case audio' });
          return;
        }
      }

      const { readStream, mimeType, fileSize, originalFilename } =
        await voiceInputService.getAudioReadStream(voiceInputId);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Disposition', `inline; filename="${originalFilename}"`);

      readStream.pipe(res);
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Error streaming audio file');
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to stream audio file' });
      }
    }
  }

  /**
   * Verify transcript (reviewer action).
   */
  public async verifyVoiceInput(req: Request, res: Response): Promise<void> {
    try {
      const voiceInputId = req.params.voiceInputId as string;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      // Only staff/reviewers can verify transcripts
      if (user.role === 'PATIENT') {
        res.status(403).json({ success: false, error: 'Patients cannot verify transcripts' });
        return;
      }

      const voiceInput = await voiceInputService.getVoiceInputById(voiceInputId);
      if (!voiceInput) {
        res.status(404).json({ success: false, error: 'Voice input not found' });
        return;
      }

      const caseDoc = await Case.findById(voiceInput.caseId);
      if (!caseDoc) {
        res.status(404).json({ success: false, error: 'Associated case not found' });
        return;
      }

      // Check facility scope
      if (user.role !== 'ADMIN' && user.facilityId && caseDoc.facilityId) {
        if (user.facilityId.toString() !== caseDoc.facilityId.toString()) {
          res.status(403).json({ success: false, error: 'Access denied to facility case' });
          return;
        }
      }

      const updated = await voiceInputService.verifyVoiceInput(voiceInputId, user.id, user.role);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      logger.error({ error: err?.message }, 'Error verifying voice input transcript');
      res.status(400).json({ success: false, error: err?.message || 'Verification failed' });
    }
  }
}

export const voiceInputController = new VoiceInputController();
