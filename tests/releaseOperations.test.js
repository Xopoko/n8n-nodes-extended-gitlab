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
  const ctx = createContext({ resource: 'release', operation: 'create', tagName: 'v1.0', name: '1.0', releaseDescription: 'desc', assets: '{"links":[]}' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/releases');
  assert.deepStrictEqual(ctx.calls.options.body, { tag_name: 'v1.0', name: '1.0', description: 'desc', assets: { links: [] } });
});

test('update builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'update', tagName: 'v1.0', name: '1.1', releaseDescription: 'new', assets: '' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/releases/v1.0');
  assert.deepStrictEqual(ctx.calls.options.body, { name: '1.1', description: 'new' });
});

test('get builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'get', tagName: 'v1.0' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/releases/v1.0');
});

test('getAll builds correct endpoint with limit', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'getAll', returnAll: false, limit: 2 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/releases');
  assert.strictEqual(ctx.calls.options.qs.per_page, 2);
});

test('delete builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'delete', tagName: 'v1.0' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'DELETE');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/releases/v1.0');
});

test('create throws error for invalid JSON in assets', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'create', tagName: 'v1.0', name: '1.0', releaseDescription: 'desc', assets: 'invalid json' });
  await assert.rejects(async () => {
    await node.execute.call(ctx);
  }, {
    message: 'Invalid JSON in "assets" parameter',
  });
});

test('update handles deep equality correctly', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'update', tagName: 'v1.0', name: '1.1', releaseDescription: 'new', assets: '{"links":[]}' });
  await node.execute.call(ctx);
  console.log(ctx.calls.options.body);
  assert.deepStrictEqual(ctx.calls.options.body, { name: '1.1', description: 'new', assets: { links: [] } });
});
