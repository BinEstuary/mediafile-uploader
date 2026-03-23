import assert from 'node:assert/strict';
import test from 'node:test';

import { buildResultFileName } from './server-utils.ts';

test('buildResultFileName appends upload id to avoid collisions', () => {
  assert.equal(
    buildResultFileName('photo.png', 'abc123'),
    'photo-abc123.json',
  );

  assert.equal(
    buildResultFileName('photo.jpg', 'xyz789'),
    'photo-xyz789.json',
  );
});

test('buildResultFileName strips the original extension before writing json', () => {
  assert.equal(
    buildResultFileName('summer.trip.webp', 'upload-42'),
    'summer.trip-upload-42.json',
  );
});
