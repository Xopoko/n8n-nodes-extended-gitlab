import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';
import createContext from './helpers/createContext.js';

test('create builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const params = { resource: 'group', operation: 'create', groupName: 'Dev', groupPath: 'dev' };
  const ctx = createContext(params);
  ctx.helpers.requestWithAuthentication = async (name, options) => {
    ctx.calls.name = name;
    ctx.calls.options = options;
    return {};
  };
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.name, 'gitlabExtendedApi');
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/groups');
  assert.deepStrictEqual(ctx.calls.options.body, { name: 'Dev', path: 'dev' });
});

test('create with parentId builds correct body', async () => {
  const node = new GitlabExtended();
  const params = { resource: 'group', operation: 'create', groupName: 'Sub', groupPath: 'sub', parentId: 3 };
  const ctx = createContext(params);
  ctx.helpers.requestWithAuthentication = async (name, options) => {
    ctx.calls.name = name;
    ctx.calls.options = options;
    return {};
  };
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.deepStrictEqual(ctx.calls.options.body, { name: 'Sub', path: 'sub', parent_id: 3 });
});

test('get builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const params = { resource: 'group', operation: 'get', groupId: 5 };
  const ctx = createContext(params);
  ctx.helpers.requestWithAuthentication = async (name, options) => {
    ctx.calls.name = name;
    ctx.calls.options = options;
    return {};
  };
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/groups/5');
});

test('delete builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const params = { resource: 'group', operation: 'delete', groupId: 7 };
  const ctx = createContext(params);
  ctx.helpers.requestWithAuthentication = async (name, options) => {
    ctx.calls.name = name;
    ctx.calls.options = options;
    return {};
  };
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'DELETE');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/groups/7');
});

test('getMembers builds correct endpoint and respects limit', async () => {
  const node = new GitlabExtended();
  const params = { resource: 'group', operation: 'getMembers', groupId: 9, returnAll: false, limit: 2 };
  const ctx = createContext(params);
  ctx.helpers.requestWithAuthentication = async (name, options) => {
    ctx.calls.name = name;
    ctx.calls.options = options;
    return {};
  };
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/groups/9/members');
  assert.strictEqual(ctx.calls.options.qs.per_page, 2);
});
