import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';
import createContext from './helpers/createContext.js';

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

test('update throws on invalid assets', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'update', tagName: 'v1.0', name: '1.1', releaseDescription: 'new', assets: '{' });
  await assert.rejects(() => node.execute.call(ctx), /Invalid JSON in 'assets' parameter/);
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

test('create handles optional parameters correctly', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'create', tagName: 'v1.0', name: '1.0', releaseDescription: 'desc' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/releases');
  assert.deepStrictEqual(ctx.calls.options.body, { tag_name: 'v1.0', name: '1.0', description: 'desc' });
});

test('create throws on missing required parameters', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'create', tagName: '', name: '1.0', releaseDescription: 'desc' });
  await assert.rejects(() => node.execute.call(ctx), /tagName must not be empty/);
});

test('create uses default values correctly', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'create', tagName: 'v1.0', name: '1.0' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/releases');
  assert.deepStrictEqual(ctx.calls.options.body, { tag_name: 'v1.0', name: '1.0' });
});

test('create throws on invalid parameters', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'create', tagName: 'v1.0', name: '1.0', releaseDescription: 'desc', assets: '{' });
  await assert.rejects(() => node.execute.call(ctx), /Invalid JSON in 'assets' parameter/);
});

test('create handles different HTTP methods and response formats', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'release', operation: 'create', tagName: 'v1.0', name: '1.0', releaseDescription: 'desc', assets: '{"links":[]}' });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/1/releases');
  assert.deepStrictEqual(ctx.calls.options.body, { tag_name: 'v1.0', name: '1.0', description: 'desc', assets: { links: [] } });
});
