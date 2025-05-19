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
      return { server: 'https://gitlab.example.com', accessToken: 't' };
    },
    helpers: {
      async requestWithAuthentication(name, options) { calls.name = name; calls.options = options; return {}; },
      constructExecutionMetaData(data) { return data; },
      returnJsonArray(data) { return [{ json: data }]; },
    },
    getNode() { return {}; },
  };
}

test('create builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'group', operation: 'create', groupName: 'Dev', groupPath: 'dev' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.name, 'gitlabExtendedApi');
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/groups');
  assert.deepStrictEqual(ctx.calls.options.body, { name: 'Dev', path: 'dev' });
});

test('get builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'group', operation: 'get', groupId: 5 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/groups/5');
});

test('delete builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'group', operation: 'delete', groupId: 7 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'DELETE');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/groups/7');
});

test('getMembers builds correct endpoint and respects limit', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'group', operation: 'getMembers', groupId: 9, returnAll: false, limit: 2 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/groups/9/members');
  assert.strictEqual(ctx.calls.options.qs.per_page, 2);
});
