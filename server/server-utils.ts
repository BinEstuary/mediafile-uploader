import path from 'path';

export function buildResultFileName(
  originalName: string,
  uploadId: string,
): string {
  const baseName = path.basename(originalName, path.extname(originalName));
  const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '-');

  return `${baseName}-${safeUploadId}.json`;
}
