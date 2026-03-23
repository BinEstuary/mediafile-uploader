import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildQueuedFiles,
  formatFileSize,
  isSupportedBackendUrl,
  normalizeUploadResult,
  resolveInitialBackendUrl,
  summarizeUploads,
} from './upload-utils.ts';

test('buildQueuedFiles creates pending queue items from dropped files', () => {
  const file = new File(['hello world'], 'banner.png', {
    type: 'image/png',
    lastModified: 1,
  });

  const [item] = buildQueuedFiles([file]);

  assert.equal(item.name, 'banner.png');
  assert.equal(item.size, file.size);
  assert.equal(item.progress, 0);
  assert.equal(item.status, 'pending');
  assert.equal(item.file, file);
  assert.ok(item.id.length > 0);
});

test('formatFileSize returns human readable values', () => {
  assert.equal(formatFileSize(0), '0 Bytes');
  assert.equal(formatFileSize(1024), '1 KB');
  assert.equal(formatFileSize(1536), '1.5 KB');
});

test('summarizeUploads returns queue counts and total size', () => {
  const queue = [
    {
      id: 'one',
      file: new File(['a'], 'one.png', { type: 'image/png', lastModified: 1 }),
      name: 'one.png',
      size: 1024,
      status: 'pending' as const,
      progress: 0,
    },
    {
      id: 'two',
      file: new File(['ab'], 'two.png', { type: 'image/png', lastModified: 2 }),
      name: 'two.png',
      size: 2048,
      status: 'success' as const,
      progress: 100,
    },
    {
      id: 'three',
      file: new File(['abc'], 'three.png', { type: 'image/png', lastModified: 3 }),
      name: 'three.png',
      size: 3072,
      status: 'error' as const,
      progress: 100,
    },
  ];

  const summary = summarizeUploads(queue);

  assert.deepEqual(summary, {
    total: 3,
    pending: 1,
    uploading: 0,
    success: 1,
    error: 1,
    completed: 1,
    totalSize: 6144,
  });
});

test('normalizeUploadResult preserves flattened uploader responses', () => {
  const normalized = normalizeUploadResult({
    thumb: { id: 'thumb-1', size: 120 },
    original: { id: 'original-1', size: 240 },
  });

  assert.deepEqual(normalized, {
    thumb: { id: 'thumb-1', size: 120 },
    original: { id: 'original-1', size: 240 },
  });
});

test('normalizeUploadResult reshapes raw mediafile API responses', () => {
  const normalized = normalizeUploadResult({
    id: 'original-2',
    size: 512,
    variants: {
      thumb: { id: 'thumb-2', size: 128 },
    },
  });

  assert.deepEqual(normalized, {
    thumb: { id: 'thumb-2', size: 128 },
    original: { id: 'original-2', size: 512 },
  });
});

test('isSupportedBackendUrl only accepts http and https URLs', () => {
  assert.equal(isSupportedBackendUrl('http://localhost:3001'), true);
  assert.equal(isSupportedBackendUrl('https://api.example.com'), true);
  assert.equal(isSupportedBackendUrl('ftp://files.example.com'), false);
  assert.equal(isSupportedBackendUrl('javascript:alert(1)'), false);
  assert.equal(isSupportedBackendUrl('notaurl'), false);
});

test('resolveInitialBackendUrl prefers saved and configured URLs before localhost fallback', () => {
  assert.equal(
    resolveInitialBackendUrl({
      savedUrl: 'https://saved.example.com',
      envUrl: 'https://env.example.com',
      hostname: 'media.binestuary.com',
    }),
    'https://saved.example.com',
  );

  assert.equal(
    resolveInitialBackendUrl({
      savedUrl: '   ',
      envUrl: 'https://env.example.com',
      hostname: 'media.binestuary.com',
    }),
    'https://env.example.com',
  );

  assert.equal(
    resolveInitialBackendUrl({
      hostname: 'localhost',
    }),
    'http://localhost:3001',
  );

  assert.equal(
    resolveInitialBackendUrl({
      hostname: 'media.binestuary.com',
    }),
    '',
  );
});
