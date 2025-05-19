import assert from 'node:assert';
import test from 'node:test';
import { gitlabApiRequest } from '../dist/nodes/GitlabExtended/GenericFunctions.js';
import { NodeOperationError } from 'n8n-workflow/dist/errors/index.js';

function createContext(cred) {
  return {
    async getCredentials(name) {
      if (name !== 'gitlabExtendedApi') throw new Error('Unexpected credentials name');
      return cred;
    },
    helpers: {
      async requestWithAuthentication() {
        throw new Error('Should not reach request');
      },
    },
    getNode() {
      return {};
    },
  };
}

test('gitlabApiRequest throws when server URL is missing', async () => {
  const ctx = createContext({ server: '', accessToken: 'token' });
  await assert.rejects(
    () => gitlabApiRequest.call(ctx, 'GET', '/foo', {}, undefined),
    (err) => {
      assert(err instanceof NodeOperationError);
      assert.match(err.message, /GitLab server URL is missing in credentials/);
      return true;
    },
  );
});

test('gitlabApiRequest throws when access token is missing', async () => {
  const ctx = createContext({ server: 'https://gitlab.example.com', accessToken: '' });
  await assert.rejects(
    () => gitlabApiRequest.call(ctx, 'GET', '/foo', {}, undefined),
    (err) => {
      assert(err instanceof NodeOperationError);
      assert.match(err.message, /Access token is missing in GitLab credentials/);
      return true;
    },
  );
});

