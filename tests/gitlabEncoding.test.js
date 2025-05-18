import assert from 'node:assert';
import test from 'node:test';
function computeBase(ownerValue, repoValue) {
  const owner = encodeURIComponent(ownerValue);
  const repo = encodeURIComponent(repoValue);
  return `/projects/${owner}%2F${repo}`;
}

test('encodes spaces in owner and repo', () => {
  const base = computeBase('my group', 'my repo');
  assert.strictEqual(base, '/projects/my%20group%2Fmy%20repo');
});

test('encodes slashes in owner', () => {
  const base = computeBase('group/sub', 'my repo');
  assert.strictEqual(base, '/projects/group%2Fsub%2Fmy%20repo');
});

test('encodes special characters', () => {
  const base = computeBase('A&B', 'C # repo');
  assert.strictEqual(base, '/projects/A%26B%2FC%20%23%20repo');
});

test('encodes slashes in repository', () => {
  const base = computeBase('mygroup', 'sub/repo');
  assert.strictEqual(base, '/projects/mygroup%2Fsub%2Frepo');
});

test('encodes slashes and spaces in both parts', () => {
  const base = computeBase('group/sub name', 'repo/with space');
  assert.strictEqual(base, '/projects/group%2Fsub%20name%2Frepo%2Fwith%20space');
});
