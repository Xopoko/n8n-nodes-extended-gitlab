import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';
import createContext from './helpers/createContext.js';

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

test('get throws on invalid issueIid', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'issue', operation: 'get', issueIid: 0 });
  await assert.rejects(() => node.execute.call(ctx), /issueIid must be a positive number/);
});
