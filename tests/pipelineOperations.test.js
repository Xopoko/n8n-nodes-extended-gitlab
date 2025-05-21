import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';
import createContext from './helpers/createContext.js';

test('delete builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'delete',
    pipelineId: 7,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'DELETE');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines/7'
  );
});

test('downloadArtifacts builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'downloadArtifacts',
    pipelineId: 9,
    pipelineRef: 'main',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines/9/jobs/artifacts/main/download'
  );
});

test('create builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'create',
    pipelineRef: 'main',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipeline'
  );
  assert.deepStrictEqual(ctx.calls.options.body, { ref: 'main' });
});

test('retry builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'retry',
    pipelineId: 4,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines/4/retry'
  );
});

test('cancel builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'cancel',
    pipelineId: 6,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines/6/cancel'
  );
});

test('get builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'get',
    pipelineId: 2,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines/2'
  );
});

test('getAll builds correct endpoint with limit', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'pipeline', operation: 'getAll', returnAll: false, limit: 3 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines'
  );
  assert.strictEqual(ctx.calls.options.qs.per_page, 3);
});

test('getAll builds correct endpoint when returnAll true', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'pipeline', operation: 'getAll', returnAll: true });
  ctx.helpers.requestWithAuthentication = async (name, options) => {
    ctx.calls.options = JSON.parse(JSON.stringify(options));
    return { body: [], headers: { 'x-next-page': '' } };
  };
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines'
  );
  assert.strictEqual(ctx.calls.options.qs.per_page, 100);
  assert.strictEqual(ctx.calls.options.qs.page, 1);
});

test('get throws on invalid pipelineId', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'pipeline', operation: 'get', pipelineId: 0 });
  await assert.rejects(() => node.execute.call(ctx), /pipelineId must be a positive number/);
});

