import assert from 'node:assert';
import test from 'node:test';
import { gitlabApiRequest } from '../dist/nodes/GitlabExtended/GenericFunctions.js';
import { NodeOperationError } from 'n8n-workflow/dist/errors/index.js';
import createContext from './helpers/createContext.js';

test('gitlabApiRequest throws when server URL is missing', async () => {
  const creds = { server: '', accessToken: 'token' };
  const ctx = createContext({});
  ctx.getCredentials = async (name) => {
    if (name !== 'gitlabExtendedApi') throw new Error('Unexpected credentials name');
    return creds;
  };
  ctx.helpers.requestWithAuthentication = async () => {
    throw new Error('Should not reach request');
  };
  await assert.rejects(
    () => gitlabApiRequest.call(ctx, 'GET', '/foo', {}, undefined),
    (err) => {
      assert(err instanceof NodeOperationError);
      assert.match(err.message, /GitLab server URL is missing in credentials/);
      return true;
    },
  );
});

test('gitlabApiRequest throws when server is undefined', async () => {
  const creds = { accessToken: 'token' };
  const ctx = createContext({});
  ctx.getCredentials = async (name) => {
    if (name !== 'gitlabExtendedApi') throw new Error('Unexpected credentials name');
    return creds;
  };
  ctx.helpers.requestWithAuthentication = async () => {
    throw new Error('Should not reach request');
  };
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
  const creds = { server: 'https://gitlab.example.com', accessToken: '' };
  const ctx = createContext({});
  ctx.getCredentials = async (name) => {
    if (name !== 'gitlabExtendedApi') throw new Error('Unexpected credentials name');
    return creds;
  };
  ctx.helpers.requestWithAuthentication = async () => {
    throw new Error('Should not reach request');
  };
  await assert.rejects(
    () => gitlabApiRequest.call(ctx, 'GET', '/foo', {}, undefined),
    (err) => {
      assert(err instanceof NodeOperationError);
      assert.match(err.message, /Access token is missing in GitLab credentials/);
      return true;
    },
  );
});

