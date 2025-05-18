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
      returnJsonArray(data) {
        return [{ json: data }];
      },
    },
    getNode() { return {}; },
  };
}

test('getJobs builds correct endpoint and respects limit', async () => {
  const node = new GitlabExtended();
  const ctx = createContext({
    resource: 'pipeline',
    operation: 'getJobs',
    pipelineId: 5,
    returnAll: false,
    limit: 3,
  });
  await node.execute.call(ctx);
  assert.strictEqual(ctx.calls.options.uri,
    'https://gitlab.example.com/api/v4/projects/1/pipelines/5/jobs');
  assert.strictEqual(ctx.calls.options.qs.per_page, 3);
});
