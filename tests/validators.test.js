import assert from 'node:assert';
import test from 'node:test';
import { requireString, requirePositive } from '../dist/nodes/GitlabExtended/validators.js';
import { NodeOperationError } from 'n8n-workflow/dist/errors/index.js';

test('requireString throws on empty string', () => {
  const ctx = { getNode: () => ({}) };
  assert.throws(() => requireString.call(ctx, '', 'field', 0), NodeOperationError);
});

test('requireString does not throw on valid string', () => {
  const ctx = { getNode: () => ({}) };
  requireString.call(ctx, 'value', 'field', 0);
});

test('requirePositive throws on non-positive numbers', () => {
  const ctx = { getNode: () => ({}) };
  assert.throws(() => requirePositive.call(ctx, 0, 'num', 0), NodeOperationError);
  assert.throws(() => requirePositive.call(ctx, -1, 'num', 0), NodeOperationError);
});

test('requirePositive does not throw on positive numbers', () => {
  const ctx = { getNode: () => ({}) };
  requirePositive.call(ctx, 1, 'num', 0);
});
