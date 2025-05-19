import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';

function createContext(params) {
  const calls = {};
  return {
    calls,
    getInputData() { return [{ json: {} }]; },
    getNodeParameter(name) { return params[name]; },
    async getCredentials() {
      return { server: 'https://gitlab.example.com', accessToken: 't', projectId: 1 };
    },
    helpers: {
      async requestWithAuthentication(name, options) { calls.options = options; return {}; },
      constructExecutionMetaData(data) { return data; },
      returnJsonArray(data) { return [{ json: data }]; },
    },
    getNode() { return {}; },
  };
}

test('merge builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'mergeRequest',
    operation: 'merge',
    mergeRequestIid: 10,
    mergeCommitMessage: 'done',
    mergeStrategy: 'squash',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/10/merge'
  );
  assert.deepStrictEqual(ctx.calls.options.body, {
    merge_commit_message: 'done',
    squash: true,
  });
});

test('rebase builds correct endpoint with skip_ci', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'mergeRequest',
    operation: 'rebase',
    mergeRequestIid: 7,
    skipCi: true,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/7/rebase'
  );
  assert.strictEqual(ctx.calls.options.qs.skip_ci, true);
});

test('close builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'mergeRequest', operation: 'close', mergeRequestIid: 2 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/2'
  );
  assert.deepStrictEqual(ctx.calls.options.body, { state_event: 'close' });
});

test('reopen builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'mergeRequest', operation: 'reopen', mergeRequestIid: 3 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/3'
  );
  assert.deepStrictEqual(ctx.calls.options.body, { state_event: 'reopen' });
});
