import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';

function createContext(params) {
  const calls = {};
  return {
    calls,
    getInputData() { return [{ json: {} }]; },
    getNodeParameter(name, _index, defaultValue) {
      if (!calls.params) calls.params = [];
      calls.params.push(name);
      if (Object.prototype.hasOwnProperty.call(params, name)) {
        return params[name];
      }
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Could not get parameter ${name}`);
    },
    async getCredentials() {
      return { server: 'https://gitlab.example.com', accessToken: 't', projectId: 1 };
    },
    helpers: {
      async requestWithAuthentication(name, options) { calls.options = options; return {}; },
      constructExecutionMetaData(data) { return data; },
      returnJsonArray(data) { return [{ json: data }]; },
    },
    getNode() { return {}; },
  };
}

test('merge builds correct endpoint and body', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'mergeRequest',
    operation: 'merge',
    mergeRequestIid: 10,
    mergeCommitMessage: 'done',
    mergeStrategy: 'squash',
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/10/merge'
  );
  assert.deepStrictEqual(ctx.calls.options.body, {
    merge_commit_message: 'done',
    squash: true,
  });
});

test('rebase builds correct endpoint with skip_ci', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'mergeRequest',
    operation: 'rebase',
    mergeRequestIid: 7,
    skipCi: true,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/7/rebase'
  );
  assert.strictEqual(ctx.calls.options.qs.skip_ci, true);
});

test('close builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'mergeRequest', operation: 'close', mergeRequestIid: 2 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/2'
  );
  assert.deepStrictEqual(ctx.calls.options.body, { state_event: 'close' });
});

test('reopen builds correct endpoint', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'mergeRequest', operation: 'reopen', mergeRequestIid: 3 });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'PUT');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/3'
  );
  assert.deepStrictEqual(ctx.calls.options.body, { state_event: 'reopen' });
});

test('postDiscussionNote works without suggestion parameters', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'mergeRequest',
    operation: 'postDiscussionNote',
    mergeRequestIid: 11,
    body: 'hello',
    startDiscussion: true,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/11/discussions'
  );
  assert.deepStrictEqual(ctx.calls.options.body, { body: 'hello' });
  assert.ok(!ctx.calls.params.includes('positionType'));
});

test('postDiscussionNote builds suggestion with position', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'mergeRequest',
    operation: 'postDiscussionNote',
    mergeRequestIid: 12,
    body: 'change',
    startDiscussion: true,
    asSuggestion: true,
    positionType: 'text',
    newPath: 'a.ts',
    oldPath: 'a.ts',
    newLine: 5,
    baseSha: '111',
    headSha: '222',
    startSha: '333',
    oldLine: 2,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.method, 'POST');
  assert.strictEqual(
    ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/merge_requests/12/discussions'
  );
  assert.deepStrictEqual(ctx.calls.options.body, {
    body: '```suggestion:-0+0\nchange\n```',
    position: {
      position_type: 'text',
      new_path: 'a.ts',
      old_path: 'a.ts',
      new_line: 5,
      base_sha: '111',
      head_sha: '222',
      start_sha: '333',
      old_line: 2,
    },
  });
  assert.ok(ctx.calls.params.includes('positionType'));
});

test('get throws on invalid mergeRequestIid', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({ resource: 'mergeRequest', operation: 'get', mergeRequestIid: 0 });
  await assert.rejects(() => node.execute.call(ctx), /mergeRequestIid must be a positive number/);
});
