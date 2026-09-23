import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { FileValidationResult, StoredFileResult } from './storage.types.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB default limit for docs/images

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/webm',
  'audio/ogg',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.wav', '.mp3', '.webm', '.ogg']);

export class StorageService {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    const rawDir = customBaseDir || env.REPORT_STORAGE_DIR;
    this.baseDir = path.resolve(process.cwd(), rawDir);
    this.ensureBaseDir();
  }

  private ensureBaseDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Validates file declared MIME, extension, size, and magic byte file signature.
   */
  public validateFile(
    fileBuffer: Buffer,
    declaredMimeType: string,
    originalFilename: string,
    customMaxSizeBytes?: number
  ): FileValidationResult {
    if (!fileBuffer || fileBuffer.length === 0) {
      return { isValid: false, error: 'File buffer is empty' };
    }

    const normalizedDeclaredMime = declaredMimeType.toLowerCase().trim();
    const isAudio = normalizedDeclaredMime.startsWith('audio/');
    const maxAllowedBytes =
      customMaxSizeBytes ||
      (isAudio ? env.MAX_AUDIO_UPLOAD_MB * 1024 * 1024 : MAX_FILE_SIZE_BYTES);

    if (fileBuffer.length > maxAllowedBytes) {
      const maxMb = Math.round(maxAllowedBytes / (1024 * 1024));
      return { isValid: false, error: `File size exceeds configured limit of ${maxMb}MB` };
    }

    // Check extension
    const ext = path.extname(originalFilename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return { isValid: false, error: `Unsupported file extension: ${ext}` };
    }

    // Check declared MIME
    if (!ALLOWED_MIME_TYPES.has(normalizedDeclaredMime)) {
      return { isValid: false, error: `Unsupported MIME type: ${declaredMimeType}` };
    }

    // Magic byte / File signature validation
    const magicValidation = this.validateMagicBytes(fileBuffer);
    if (!magicValidation.isValid) {
      return magicValidation;
    }

    const detected = magicValidation.detectedMimeType!;

    // Cross-verify magic byte detected type with declared type/extension
    if (detected !== normalizedDeclaredMime) {
      // Allow image/jpg vs image/jpeg variations
      const isJpgMismatch =
        (normalizedDeclaredMime === 'image/jpg' || normalizedDeclaredMime === 'image/jpeg') &&
        detected === 'image/jpeg';

      // Allow audio/mp3 vs audio/mpeg
      const isMp3Mismatch =
        (normalizedDeclaredMime === 'audio/mp3' || normalizedDeclaredMime === 'audio/mpeg') &&
        detected === 'audio/mpeg';

      // Allow audio/x-wav vs audio/wav
      const isWavMismatch =
        (normalizedDeclaredMime === 'audio/x-wav' || normalizedDeclaredMime === 'audio/wav') &&
        detected === 'audio/wav';

      if (!isJpgMismatch && !isMp3Mismatch && !isWavMismatch) {
        return {
          isValid: false,
          error: `File signature (${detected}) does not match declared MIME type (${declaredMimeType})`,
        };
      }
    }

    return { isValid: true, detectedMimeType: detected };
  }

  private validateMagicBytes(buffer: Buffer): FileValidationResult {
    if (buffer.length < 4) {
      return { isValid: false, error: 'File is too small to contain valid magic bytes' };
    }

    // Check PDF: %PDF- (0x25, 0x50, 0x44, 0x46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return { isValid: true, detectedMimeType: 'application/pdf' };
    }

    // Check PNG: 0x89, 0x50, 0x4E, 0x47 (\x89PNG)
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return { isValid: true, detectedMimeType: 'image/png' };
    }

    // Check JPEG: 0xFF, 0xD8, 0xFF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { isValid: true, detectedMimeType: 'image/jpeg' };
    }

    // Check WAV: RIFF at 0 (0x52, 0x49, 0x46, 0x46) and WAVE at 8 (0x57, 0x41, 0x56, 0x45)
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x41 &&
      buffer[10] === 0x56 &&
      buffer[11] === 0x45
    ) {
      return { isValid: true, detectedMimeType: 'audio/wav' };
    }

    // Check MP3 ID3 header: ID3 (0x49, 0x44, 0x33)
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return { isValid: true, detectedMimeType: 'audio/mpeg' };
    }

    // Check MP3 raw MPEG sync bits (0xFF 0xFB, 0xFF 0xF3, 0xFF 0xF2, 0xFF 0xE3)
    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
      return { isValid: true, detectedMimeType: 'audio/mpeg' };
    }

    // Check OGG: OggS (0x4F, 0x67, 0x67, 0x53)
    if (
      buffer[0] === 0x4f &&
      buffer[1] === 0x67 &&
      buffer[2] === 0x67 &&
      buffer[3] === 0x53
    ) {
      return { isValid: true, detectedMimeType: 'audio/ogg' };
    }

    // Check WebM: EBML header (0x1A, 0x45, 0xDF, 0xA3)
    if (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    ) {
      return { isValid: true, detectedMimeType: 'audio/webm' };
    }

    return { isValid: false, error: 'File content does not match any allowed file signature (PDF, JPEG, PNG, WAV, MP3, OGG, WebM)' };
  }

  /**
   * Computes SHA-256 hash of buffer.
   */
  public computeContentHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Saves file to server-controlled location and key.
   */
  public async saveFile(
    fileBuffer: Buffer,
    declaredMimeType: string,
    originalFilename: string,
    customCategory?: string
  ): Promise<StoredFileResult> {
    const validation = this.validateFile(fileBuffer, declaredMimeType, originalFilename);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.error}`);
    }

    const contentHash = this.computeContentHash(fileBuffer);
    const ext = path.extname(originalFilename).toLowerCase();
    const isAudio = (validation.detectedMimeType || declaredMimeType).startsWith('audio/');
    const category = customCategory || (isAudio ? 'voice' : 'reports');
    const safeStorageKey = `${category}/${crypto.randomUUID()}-${contentHash}${ext}`;

    const resolvedPath = path.resolve(this.baseDir, safeStorageKey);

    // Reject path traversal attempt
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error('Path traversal attempt detected');
    }

    // Ensure target directory exists
    const targetSubdir = path.dirname(resolvedPath);
    await fs.promises.mkdir(targetSubdir, { recursive: true });

    // Write file
    await fs.promises.writeFile(resolvedPath, fileBuffer);

    logger.info({ storageKey: safeStorageKey, contentHash }, 'File securely saved to storage');

    return {
      storageKey: safeStorageKey,
      contentHash,
      mimeType: validation.detectedMimeType || declaredMimeType,
      fileSize: fileBuffer.length,
      originalFilename: path.basename(originalFilename),
    };
  }

  /**
   * Retrieves read stream for a stored file, enforcing path safety.
   */
  public getReadStream(storageKey: string): fs.ReadStream {
    const resolvedPath = path.resolve(this.baseDir, storageKey);

    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error('Path traversal attempt detected');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error('Requested file not found in storage');
    }

    return fs.createReadStream(resolvedPath);
  }

  /**
   * Helper to resolve physical path for internal server use only (never expose to client).
   */
  public getResolvedPath(storageKey: string): string {
    const resolvedPath = path.resolve(this.baseDir, storageKey);
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error('Path traversal attempt detected');
    }
    return resolvedPath;
  }
}

export const storageService = new StorageService();
