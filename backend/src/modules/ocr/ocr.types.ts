export interface OcrResult {
  text: string;
  confidence?: number;
  usable: boolean;
  error?: string;
}

export interface OcrProvider {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<OcrResult>;
}
