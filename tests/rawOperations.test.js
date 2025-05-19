import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';
import createContext from './helpers/createContext.js';

// Test GET request with query parameters
test('raw GET forwards query parameters', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'raw',
    operation: 'request',
    httpMethod: 'GET',
    endpoint: '/projects/1/issues',
    queryParameters: { state: 'opened' },
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/issues',
  );
  assert.deepStrictEqual(ctx.calls.options.qs, { state: 'opened' });
});

// Test POST request with JSON body
test('raw POST forwards JSON body and query', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'raw',
    operation: 'request',
    httpMethod: 'POST',
    endpoint: '/projects/1/issues',
    content: { title: 'hello' },
    queryParameters: { labels: 'bug' },
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/issues',
  );
  assert.deepStrictEqual(ctx.calls.options.body, { title: 'hello' });
  assert.deepStrictEqual(ctx.calls.options.qs, { labels: 'bug' });
});
