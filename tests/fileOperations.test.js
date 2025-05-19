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

test('create builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'file',
    operation: 'create',
    path: 'README.md',
    fileBranch: 'main',
    commitMessage: 'add file',
    fileContent: 'hello',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/files/README.md',
  );
  assert.deepStrictEqual(ctx.calls.options.body, {
    branch: 'main',
    commit_message: 'add file',
    content: 'hello',
  });
});

test('update builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'file',
    operation: 'update',
    path: 'README.md',
    fileBranch: 'dev',
    commitMessage: 'update file',
    fileContent: 'hi',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/files/README.md',
  );
  assert.deepStrictEqual(ctx.calls.options.body, {
    branch: 'dev',
    commit_message: 'update file',
    content: 'hi',
  });
});

test('delete builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'file',
    operation: 'delete',
    path: 'README.md',
    fileBranch: 'main',
    commitMessage: 'remove file',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'DELETE');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/files/README.md',
  );
  assert.deepStrictEqual(ctx.calls.options.body, {
    branch: 'main',
    commit_message: 'remove file',
  });
});

test('get builds correct endpoint with ref', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'file',
    operation: 'get',
    path: 'README.md',
    fileRef: 'main',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/files/README.md'
  );
  assert.strictEqual(ctx.calls.options.qs.ref, 'main');
});

test('list builds correct endpoint and query', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'file',
    operation: 'list',
    path: 'src',
    fileRef: 'dev',
    returnAll: false,
    limit: 2,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'GET');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/repository/tree'
  );
  assert.strictEqual(ctx.calls.options.qs.per_page, 2);
  assert.strictEqual(ctx.calls.options.qs.ref, 'dev');
  assert.strictEqual(ctx.calls.options.qs.path, 'src');
});
