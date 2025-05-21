import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';
import createContext from './helpers/createContext.js';

test('get builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createContext({ resource: 'project', operation: 'get', projectId: 8 });
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects/8');
});

test('getAll builds correct endpoint with limit', async () => {
	const node = new GitlabExtended();
	const ctx = createContext({
		resource: 'project',
		operation: 'getAll',
		returnAll: false,
		limit: 4,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects');
	assert.strictEqual(ctx.calls.options.qs.per_page, 4);
});

test('search builds correct endpoint with query', async () => {
	const node = new GitlabExtended();
	const ctx = createContext({
		resource: 'project',
		operation: 'search',
		searchTerm: 'test',
		returnAll: false,
		limit: 2,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(ctx.calls.options.uri, 'https://gitlab.example.com/api/v4/projects');
	assert.strictEqual(ctx.calls.options.qs.per_page, 2);
	assert.strictEqual(ctx.calls.options.qs.search, 'test');
});
