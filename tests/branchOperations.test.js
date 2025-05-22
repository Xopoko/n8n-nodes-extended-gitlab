import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';
import createContext from './helpers/createContext.js';

test('rename builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'branch',
    operation: 'rename',
    branch: 'old',
    newBranch: 'new',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/branches/old',
  );
  assert.strictEqual(ctx.calls.options.body.new_branch, 'new');
});

test('protect builds correct endpoint with flags', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'branch',
    operation: 'protect',
    branch: 'main',
    developersCanPush: true,
    developersCanMerge: false,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/protected_branches',
  );
  assert.deepStrictEqual(ctx.calls.options.body, {
    name: 'main',
    developers_can_push: true,
    developers_can_merge: false,
  });
});

test('unprotect builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'branch',
    operation: 'unprotect',
    branch: 'dev',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'DELETE');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/protected_branches/dev',
  );
});

test('merge builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'branch',
    operation: 'merge',
    branch: 'feature',
    targetBranch: 'main',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/merges',
  );
  assert.deepStrictEqual(ctx.calls.options.body, {
    source_branch: 'feature',
    target_branch: 'main',
  });
});

test('rename without newBranch throws', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'branch',
    operation: 'rename',
    branch: 'old',
    newBranch: '',
  });
  await assert.rejects(() => node.execute.call(ctx), /newBranch must not be empty/);
});

test('create builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'branch',
    operation: 'create',
    branch: 'feature',
    ref: 'main',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/branches',
  );
  assert.deepStrictEqual(ctx.calls.options.body, { branch: 'feature', ref: 'main' });
});

test('get builds correct endpoint and encodes branch', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'branch', operation: 'get', branch: 'feat/one 2' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/branches/feat%2Fone%202',
  );
});

test('getAll builds correct endpoint with limit', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'branch', operation: 'getAll', returnAll: false, limit: 2 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/branches',
  );
  assert.strictEqual(ctx.calls.options.qs.per_page, 2);
});

test('getAll builds correct endpoint when returnAll true', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'branch', operation: 'getAll', returnAll: true });
  ctx.helpers.requestWithAuthentication = async (name, options) => {
    ctx.calls.options = JSON.parse(JSON.stringify(options));
    return { body: [], headers: { 'x-next-page': '' } };
  };
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/branches',
  );
  assert.strictEqual(ctx.calls.options.qs.per_page, 100);
  assert.strictEqual(ctx.calls.options.qs.page, 1);
});

test('delete builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'branch', operation: 'delete', branch: 'obsolete' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'DELETE');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/branches/obsolete',
  );
});

test('checkout builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'branch', operation: 'checkout', ref: 'main' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/archive'
  );
  assert.strictEqual(ctx.calls.options.qs.sha, 'main');
});

test('applyPatch builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'branch',
    operation: 'applyPatch',
    branch: 'main',
    patch: 'diff --git a/a b/a',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/apply_patch'
  );
  assert.deepStrictEqual(ctx.calls.options.body, { branch: 'main', patch: 'diff --git a/a b/a' });
});
