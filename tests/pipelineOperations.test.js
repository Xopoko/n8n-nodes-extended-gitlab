import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';

function createContext(params) {
  const calls = {};
  return {
    calls,
    getInputData() {
      return [{ json: {} }];
    },
    getNodeParameter(name) {
      return params[name];
    },
    async getCredentials() {
      return { server: 'https://gitlab.example.com', accessToken: 't', projectId: 1 };
    },
    helpers: {
      async requestWithAuthentication(name, options) {
        calls.options = options;
        return {};
      },
      constructExecutionMetaData(data) { return data; },
      returnJsonArray(data) { return [{ json: data }]; },
    },
    getNode() { return {}; },
  };
}

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

test('getAll builds correct endpoint with limit', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'getAll',
    returnAll: false,
    limit: 5,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines'
  );
  assert.strictEqual(ctx.calls.options.qs.per_page, 5);
});

test('cancel builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'cancel',
    pipelineId: 12,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines/12/cancel'
  );
});

test('retry builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'retry',
    pipelineId: 15,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines/15/retry'
  );
});
