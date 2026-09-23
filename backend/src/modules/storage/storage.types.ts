export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedMimeType?: string;
}

export interface StoredFileResult {
  storageKey: string;
  contentHash: string;
  mimeType: string;
  fileSize: number;
  originalFilename: string;
}
