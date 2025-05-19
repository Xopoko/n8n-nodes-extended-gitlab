import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';

function createContext(params) {
  const calls = {};
  return {
    calls,
    getInputData() {
      return [{ json: {} }];
    },
    getNodeParameter(name) {
      return params[name];
    },
    async getCredentials() {
      return { server: 'https://gitlab.example.com', accessToken: 't', projectId: 1 };
    },
    helpers: {
      async requestWithAuthentication(name, options) {
        calls.options = options;
        return {};
      },
      constructExecutionMetaData(data) { return data; },
      returnJsonArray(data) { return [{ json: data }]; },
    },
    getNode() { return {}; },
  };
}

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
