import assert from 'node:assert';
import test from 'node:test';
import { gitlabApiRequest } from '../dist/nodes/GitlabExtended/GenericFunctions.js';

function mockContext({ authentication = 'accessToken', host = 'https://gitlab.example.com/' } = {}) {
  const calls = { };
  return {
    calls,
    getNodeParameter(name) {
      if (name === 'authentication') return authentication;
      if (name === 'host') return host;
      throw new Error('Unexpected parameter ' + name);
    },
    async getCredentials(name) {
      calls.credentials = name;
    },
    helpers: {
      async requestWithAuthentication(name, options) {
        calls.method = 'token';
        calls.name = name;
        calls.options = options;
        return { ok: true };
      },
      async requestOAuth2(name, options) {
        calls.method = 'oauth2';
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

test('uses access token authentication and builds correct URL', async () => {
  const ctx = mockContext({ authentication: 'accessToken', host: 'https://gitlab.example.com/' });
  const result = await gitlabApiRequest.call(ctx, 'GET', '/projects', {}, undefined);
  assert.strictEqual(ctx.calls.method, 'token');
  assert.strictEqual(ctx.calls.name, 'gitlabApi');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects');
  assert.deepStrictEqual(result, { ok: true });
});

test('uses OAuth2 authentication and trims trailing slash', async () => {
  const ctx = mockContext({ authentication: 'oAuth2', host: 'https://gitlab.example.com/' });
  const result = await gitlabApiRequest.call(ctx, 'GET', '/foo', {}, undefined);
  assert.strictEqual(ctx.calls.method, 'oauth2');
  assert.strictEqual(ctx.calls.name, 'gitlabOAuth2Api');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/foo');
  assert.deepStrictEqual(result, { ok: true });
});


test('builds URL correctly when host lacks trailing slash', async () => {
  const ctx = mockContext({ authentication: 'accessToken', host: 'https://gitlab.example.com' });
  await gitlabApiRequest.call(ctx, 'GET', '/bar', {}, undefined);
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/bar');
});
