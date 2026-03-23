export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadAsset {
  id: string;
  size: number;
  [key: string]: unknown;
}

export type UploadResult = Record<string, UploadAsset> & {
  original: UploadAsset;
};

export interface RawUploadResponse {
  id: string;
  size: number;
  variants: Record<string, UploadAsset>;
}

export type UploadResponsePayload = UploadResult | RawUploadResponse;

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: UploadStatus;
  progress: number;
  error?: string;
  result?: UploadResult;
}

export interface UploadSummary {
  total: number;
  pending: number;
  uploading: number;
  success: number;
  error: number;
  completed: number;
  totalSize: number;
}

export function buildQueuedFiles(files: File[]): UploadedFile[] {
  return files.map((file, index) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${index}-${crypto.randomUUID()}`,
    file,
    name: file.name,
    size: file.size,
    status: 'pending',
    progress: 0,
  }));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** unitIndex;
  const precision = unitIndex === 0 || value >= 10 ? 0 : 1;

  return `${Number(value.toFixed(precision))} ${units[unitIndex]}`;
}

export function normalizeUploadResult(
  payload: UploadResponsePayload,
): UploadResult {
  if ('original' in payload) {
    return payload;
  }

  return {
    ...payload.variants,
    original: {
      id: payload.id,
      size: payload.size,
    },
  };
}

export function isSupportedBackendUrl(value: string): boolean {
  if (!URL.canParse(value)) {
    return false;
  }

  const protocol = new URL(value).protocol;

  return protocol === 'http:' || protocol === 'https:';
}

export function summarizeUploads(files: UploadedFile[]): UploadSummary {
  return files.reduce<UploadSummary>(
    (summary, file) => {
      summary.total += 1;
      summary.totalSize += file.size;
      summary[file.status] += 1;

      if (file.status === 'success') {
        summary.completed += 1;
      }

      return summary;
    },
    {
      total: 0,
      pending: 0,
      uploading: 0,
      success: 0,
      error: 0,
      completed: 0,
      totalSize: 0,
    },
  );
}
