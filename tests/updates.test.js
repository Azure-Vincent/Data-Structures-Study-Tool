import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { compareVersions } = createRequire(import.meta.url)('../electron/version.cjs');

test('compareVersions orders release versions numerically', () => {
  assert.equal(compareVersions('1.0.1', '1.0.0'), 1);
  assert.equal(compareVersions('1.0.0', '1.0.1'), -1);
  assert.equal(compareVersions('1.10.0', '1.9.9'), 1);
  assert.equal(compareVersions('2.0', '1.99.99'), 1);
  assert.equal(compareVersions('v1.2.0', '1.2.0'), 0);
  assert.equal(compareVersions('1.2', '1.2.0'), 0);
  assert.equal(compareVersions('1.2.0-beta.1', '1.2.0'), 0);
});
