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

test('update builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'issue',
    operation: 'update',
    issueIid: 10,
    title: 'new',
    description: 'desc',
    issueLabels: 'bug,urgent',
    issueState: 'close',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/issues/10',
  );
  assert.deepStrictEqual(ctx.calls.options.body, {
    title: 'new',
    description: 'desc',
    labels: 'bug,urgent',
    state_event: 'close',
  });
});

test('close builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'issue', operation: 'close', issueIid: 3 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/issues/3',
  );
  assert.deepStrictEqual(ctx.calls.options.body, { state_event: 'close' });
});

test('reopen builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'issue', operation: 'reopen', issueIid: 5 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/issues/5',
  );
  assert.deepStrictEqual(ctx.calls.options.body, { state_event: 'reopen' });
});

test('getAll builds correct endpoint with limit', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'issue',
    operation: 'getAll',
    returnAll: false,
    limit: 2,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/issues',
  );
  assert.strictEqual(ctx.calls.options.qs.per_page, 2);
});
