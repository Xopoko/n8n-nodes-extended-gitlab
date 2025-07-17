import assert from 'node:assert';
import test from 'node:test';
import {
	gitlabApiRequest,
	gitlabApiRequestAllItems,
	getMergeRequestDiscussion,
} from '../dist/nodes/GitlabExtended/GenericFunctions.js';
import { NodeApiError } from 'n8n-workflow/dist/errors/index.js';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';

function mockContext({
	server = 'https://gitlab.example.com/',
	projectId = 0,
	projectOwner = 'owner',
	projectName = 'repo',
} = {}) {
	const calls = {};
	return {
		calls,
		getNodeParameter(name, _idx, fallback) {
			if (name === 'authentication') return 'credential';
			return fallback;
		},
		async getCredentials(name) {
			calls.credentials = name;
			if (name === 'gitlabExtendedApi') {
				return { accessToken: 'mockToken', server, projectId, projectOwner, projectName };
			}
			throw new Error('Unexpected credentials name: ' + name);
		},
		helpers: {
			async requestWithAuthentication(name, options) {
				calls.name = name;
				calls.options = options;
				return { ok: true };
			},
		},
		getNode() {
			return {};
		},
	};
}

function createNodeContext(params, cred = {}) {
	const calls = {};
	return {
		calls,
		getInputData() {
			return [{ json: {} }];
		},
		getNodeParameter(name, _idx, fallback) {
			return Object.prototype.hasOwnProperty.call(params, name) ? params[name] : fallback;
		},
		async getCredentials() {
			return {
				server: 'https://gitlab.example.com',
				accessToken: 't',
				projectOwner: 'owner',
				projectName: 'repo',
				projectId: 1,
				...cred,
			};
		},
		helpers: {
			async requestWithAuthentication(name, options) {
				calls.options = options;
				return {};
			},
			constructExecutionMetaData(data) {
				return data;
			},
			returnJsonArray(data) {
				return [{ json: data }];
			},
		},
		getNode() {
			return {};
		},
	};
}

test('uses Gitlab Extended credentials and builds correct URL', async () => {
	const ctx = mockContext({ server: 'https://gitlab.example.com/' });
	const result = await gitlabApiRequest.call(ctx, 'GET', '/projects', {}, undefined);
	assert.strictEqual(ctx.calls.name, 'gitlabExtendedApi');
	assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects');
	assert.deepStrictEqual(result, { ok: true });
});

test('builds URL correctly when server lacks trailing slash', async () => {
	const ctx = mockContext({ server: 'https://gitlab.example.com' });
	await gitlabApiRequest.call(ctx, 'GET', '/bar', {}, undefined);
	assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/bar');
});

test('getMergeRequestDiscussion builds correct endpoint', async () => {
	const ctx = mockContext({ projectId: 1 });
	const result = await getMergeRequestDiscussion.call(ctx, 1234, '123abc');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/1234/discussions/123abc',
	);
	assert.deepStrictEqual(result, { ok: true });
});

test('gitlabApiRequest supports DELETE method', async () => {
	const ctx = mockContext();
	await gitlabApiRequest.call(ctx, 'DELETE', '/projects/1/repository/branches/foo', {}, undefined);
	assert.strictEqual(ctx.calls.options.method, 'DELETE');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/repository/branches/foo',
	);
});

test('execute throws when credentials lack project info', async () => {
	const node = new GitlabExtended();
	const ctx = createNodeContext(
		{ resource: 'branch', operation: 'get', branch: 'main' },
		{ projectId: 0, projectOwner: '', projectName: '' },
	);
	await assert.rejects(
		() => node.execute.call(ctx),
		/Credentials must include either projectId or both projectOwner and projectName/,
	);
});

test('execute uses owner and name when projectId missing', async () => {
	const node = new GitlabExtended();
	const ctx = createNodeContext(
		{ resource: 'branch', operation: 'get', branch: 'main' },
		{ projectId: 0, projectOwner: 'alice', projectName: 'repo' },
	);
	await node.execute.call(ctx);
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/alice%2Frepo/repository/branches/main',
	);
});

test('gitlabApiRequestAllItems follows x-next-page header', async () => {
	const responses = [
		{ body: [{ a: 1 }], headers: { 'x-next-page': '2' } },
		{ body: [{ a: 2 }], headers: { 'x-next-page': '' } },
	];
	const calls = [];
	const ctx = {
		calls,
		getNodeParameter(name, _i, fallback) {
			if (name === 'authentication') return 'credential';
			return fallback;
		},
		async getCredentials(name) {
			if (name !== 'gitlabExtendedApi') throw new Error('Unexpected credentials name');
			return { server: 'https://gitlab.example.com', accessToken: 't' };
		},
		helpers: {
			async requestWithAuthentication(name, options) {
				calls.push({ options: JSON.parse(JSON.stringify(options)) });
				return responses.shift();
			},
		},
		getNode() {
			return {};
		},
	};

	const result = await gitlabApiRequestAllItems.call(ctx, 'GET', '/foo', {}, {});
	assert.deepStrictEqual(result, [{ a: 1 }, { a: 2 }]);
	assert.strictEqual(calls.length, 2);
	assert.strictEqual(calls[0].options.qs.page, 1);
	assert.strictEqual(calls[1].options.qs.page, 2);
});

test('gitlabApiRequest surfaces original error message when no response body', async () => {
	const ctx = {
		getNodeParameter(name, _i, fallback) {
			if (name === 'authentication') return 'credential';
			return fallback;
		},
		async getCredentials(name) {
			if (name !== 'gitlabExtendedApi') throw new Error('Unexpected credentials name');
			return { server: 'https://gitlab.example.com', accessToken: 't' };
		},
		helpers: {
			async requestWithAuthentication() {
				const err = new Error('request failed');
				throw err;
			},
		},
		getNode() {
			return {};
		},
	};

	await assert.rejects(
		() => gitlabApiRequest.call(ctx, 'GET', '/foo', {}, undefined),
		(err) => {
			assert(err instanceof NodeApiError);
			assert.match(err.message, /request failed/);
			return true;
		},
	);
});

test('gitlabApiRequest uses custom credentials when selected', async () => {
	const params = {
		authentication: 'custom',
		server: 'https://custom.example.com',
		accessToken: 'abc',
		projectId: 99,
	};
	const ctx = {
		calls: {},
		getNodeParameter(name) {
			return params[name];
		},
		async getCredentials() {
			throw new Error('should not use credentials');
		},
		helpers: {
			async request(options) {
				ctx.calls.options = options;
				return { ok: true };
			},
		},
		getNode() {
			return {};
		},
	};

	await gitlabApiRequest.call(ctx, 'GET', '/projects', {}, undefined, {}, 0);
	assert.strictEqual(ctx.calls.options.uri, 'https://custom.example.com/api/v4/projects');
});
