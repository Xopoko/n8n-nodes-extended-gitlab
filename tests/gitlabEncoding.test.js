import assert from 'node:assert';
import test from 'node:test';
import { buildProjectBase } from '../dist/nodes/GitlabExtended/GenericFunctions.js';

test('encodes spaces in owner and repo', () => {
  const base = buildProjectBase({ projectOwner: 'my group', projectName: 'my repo' });
  assert.strictEqual(base, '/projects/my%20group%2Fmy%20repo');
});

test('encodes slashes in owner', () => {
  const base = buildProjectBase({ projectOwner: 'group/sub', projectName: 'my repo' });
  assert.strictEqual(base, '/projects/group%2Fsub%2Fmy%20repo');
});

test('encodes special characters', () => {
  const base = buildProjectBase({ projectOwner: 'A&B', projectName: 'C # repo' });
  assert.strictEqual(base, '/projects/A%26B%2FC%20%23%20repo');
});

test('encodes slashes in repository', () => {
  const base = buildProjectBase({ projectOwner: 'mygroup', projectName: 'sub/repo' });
  assert.strictEqual(base, '/projects/mygroup%2Fsub%2Frepo');
});

test('encodes slashes and spaces in both parts', () => {
  const base = buildProjectBase({ projectOwner: 'group/sub name', projectName: 'repo/with space' });
  assert.strictEqual(base, '/projects/group%2Fsub%20name%2Frepo%2Fwith%20space');
});

test('uses project ID when provided', () => {
  const base = buildProjectBase({ projectOwner: 'ignored', projectName: 'ignored', projectId: 123 });
  assert.strictEqual(base, '/projects/123');
});
