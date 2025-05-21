import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';
import createContext from './helpers/createContext.js';

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
