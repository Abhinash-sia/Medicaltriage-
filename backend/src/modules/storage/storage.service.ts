import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { FileValidationResult, StoredFileResult } from './storage.types.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

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
    originalFilename: string
  ): FileValidationResult {
    if (!fileBuffer || fileBuffer.length === 0) {
      return { isValid: false, error: 'File buffer is empty' };
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check extension
    const ext = path.extname(originalFilename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return { isValid: false, error: `Unsupported file extension: ${ext}` };
    }

    // Check declared MIME
    const normalizedDeclaredMime = declaredMimeType.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedDeclaredMime)) {
      return { isValid: false, error: `Unsupported MIME type: ${declaredMimeType}` };
    }

    // Magic byte / File signature validation
    const magicValidation = this.validateMagicBytes(fileBuffer);
    if (!magicValidation.isValid) {
      return magicValidation;
    }

    // Cross-verify magic byte detected type with declared type/extension
    if (magicValidation.detectedMimeType !== normalizedDeclaredMime) {
      // Allow image/jpg vs image/jpeg variations
      const isJpgMismatch =
        (normalizedDeclaredMime === 'image/jpg' || normalizedDeclaredMime === 'image/jpeg') &&
        magicValidation.detectedMimeType === 'image/jpeg';

      if (!isJpgMismatch) {
        return {
          isValid: false,
          error: `File signature (${magicValidation.detectedMimeType}) does not match declared MIME type (${declaredMimeType})`,
        };
      }
    }

    return { isValid: true, detectedMimeType: magicValidation.detectedMimeType };
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

    return { isValid: false, error: 'File content does not match any allowed file signature (PDF, JPEG, PNG)' };
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
    originalFilename: string
  ): Promise<StoredFileResult> {
    const validation = this.validateFile(fileBuffer, declaredMimeType, originalFilename);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.error}`);
    }

    const contentHash = this.computeContentHash(fileBuffer);
    const ext = path.extname(originalFilename).toLowerCase();
    const safeStorageKey = `reports/${crypto.randomUUID()}-${contentHash}${ext}`;

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

    logger.info({ storageKey: safeStorageKey, contentHash }, 'Report file securely saved to storage');

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
