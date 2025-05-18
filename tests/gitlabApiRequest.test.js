import assert from 'node:assert';
import test from 'node:test';
import { gitlabApiRequest } from '../dist/nodes/GitlabExtended/GenericFunctions.js';

function mockContext({ server = 'https://gitlab.example.com/' } = {}) {
  const calls = {};
  return {
    calls,
    getNodeParameter() {
      throw new Error('Unexpected parameter');
    },
    async getCredentials(name) {
      calls.credentials = name;
      if (name === 'gitlabExtendedApi') {
        return { accessToken: 'mockToken', server };
      }
      throw new Error('Unexpected credentials name: ' + name);
    },
    helpers: {
      async requestWithAuthentication(name, options) {
        calls.name = name;
        calls.options = options;
        return { ok: true };
      },
    },
    getNode() {
      return {};
    },
  };
}

test('uses Gitlab Extended credentials and builds correct URL', async () => {
  const ctx = mockContext({ server: 'https://gitlab.example.com/' });
  const result = await gitlabApiRequest.call(ctx, 'GET', '/projects', {}, undefined);
  assert.strictEqual(ctx.calls.name, 'gitlabExtendedApi');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects');
  assert.deepStrictEqual(result, { ok: true });
});


test('builds URL correctly when server lacks trailing slash', async () => {
  const ctx = mockContext({ server: 'https://gitlab.example.com' });
  await gitlabApiRequest.call(ctx, 'GET', '/bar', {}, undefined);
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/bar');
});
