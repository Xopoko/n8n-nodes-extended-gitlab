import assert from 'node:assert';
import test from 'node:test';
import { addOptionalStringParam } from '../dist/nodes/GitlabExtended/GenericFunctions.js';

test('addOptionalStringParam adds value when present', () => {
  const ctx = { getNodeParameter: () => 'text' };
  const body = {};
  addOptionalStringParam.call(ctx, body, 'desc', 'description', 0);
  assert.deepStrictEqual(body, { description: 'text' });
});

test('addOptionalStringParam skips empty value', () => {
  const ctx = { getNodeParameter: () => '' };
  const body = {};
  addOptionalStringParam.call(ctx, body, 'desc', 'description', 0);
  assert.deepStrictEqual(body, {});
});

