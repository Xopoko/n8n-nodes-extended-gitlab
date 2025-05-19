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

test('create builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'tag', operation: 'create', tagName: 'v1.0', ref: 'main', message: 'initial' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/repository/tags');
  assert.deepStrictEqual(ctx.calls.options.body, { tag_name: 'v1.0', ref: 'main', message: 'initial' });
});

test('get builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'tag', operation: 'get', tagName: 'v1.0' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/repository/tags/v1.0');
});

test('getAll builds correct endpoint with limit', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'tag', operation: 'getAll', returnAll: false, limit: 3 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/repository/tags');
  assert.strictEqual(ctx.calls.options.qs.per_page, 3);
});

test('delete builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'tag', operation: 'delete', tagName: 'v1.0' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'DELETE');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/repository/tags/v1.0');
});

test('create with ref builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'tag', operation: 'create', tagName: 'v1.1', ref: 'develop', message: 'new tag' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/repository/tags');
  assert.deepStrictEqual(ctx.calls.options.body, { tag_name: 'v1.1', ref: 'develop', message: 'new tag' });
});
