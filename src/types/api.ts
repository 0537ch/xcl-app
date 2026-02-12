/**
 * API related types
 */

export interface Upload {
  id: number;
  filename: string;
  upload_date: string;
  total_rows: number;
  status: string;
  is_active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  recordCount?: number;
  uploadId?: number;
  total?: any;
  error?: string;
}




export function isApiResponse(data: unknown): data is ApiResponse<unknown> {
  return typeof data === 'object' && data !== null && 'success' in data;
}
