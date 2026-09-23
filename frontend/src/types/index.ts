// Global TypeScript type definitions for Healthcare Triage Assistant frontend

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  requestId?: string;
}
