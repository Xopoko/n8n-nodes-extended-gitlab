import assert from 'node:assert';
import test from 'node:test';
import { GitlabExtended } from '../dist/nodes/GitlabExtended/GitlabExtended.node.js';
import createContext from './helpers/createContext.js';

function createTrackedContext(params) {
	const ctx = createContext(params);
	ctx.getNodeParameter = (name, _index, defaultValue) => {
		if (!ctx.calls.params) ctx.calls.params = [];
		ctx.calls.params.push(name);
		if (Object.prototype.hasOwnProperty.call(params, name)) {
			return params[name];
		}
		if (defaultValue !== undefined) return defaultValue;
		throw new Error(`Could not get parameter ${name}`);
	};
	return ctx;
}

test('merge builds correct endpoint and body', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
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
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/10/merge',
	);
	assert.deepStrictEqual(ctx.calls.options.body, {
		merge_commit_message: 'done',
		squash: true,
	});
});

test('rebase builds correct endpoint with skip_ci', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'rebase',
		mergeRequestIid: 7,
		skipCi: true,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'PUT');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/7/rebase',
	);
	assert.strictEqual(ctx.calls.options.qs.skip_ci, true);
});

test('close builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'close',
		mergeRequestIid: 2,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'PUT');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/2',
	);
	assert.deepStrictEqual(ctx.calls.options.body, { state_event: 'close' });
});

test('reopen builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'reopen',
		mergeRequestIid: 3,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'PUT');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/3',
	);
	assert.deepStrictEqual(ctx.calls.options.body, { state_event: 'reopen' });
});

test('postDiscussionNote works without position parameters', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
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
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/11/discussions',
	);
	assert.deepStrictEqual(ctx.calls.options.body, { body: 'hello' });
});

test('postDiscussionNote builds note with position', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'postDiscussionNote',
		mergeRequestIid: 12,
		body: 'change',
		startDiscussion: true,
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
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/12/discussions',
	);
	assert.deepStrictEqual(ctx.calls.options.body, {
		body: 'change',
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

test('postDiscussionNote allows omitting line numbers', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'postDiscussionNote',
		mergeRequestIid: 13,
		body: 'nolines',
		startDiscussion: true,
		positionType: 'text',
		newPath: 'a.ts',
		oldPath: 'a.ts',
		baseSha: '111',
		headSha: '222',
		startSha: '333',
	});
	await node.execute.call(ctx);
	assert.deepStrictEqual(ctx.calls.options.body, {
		body: 'nolines',
		position: {
			position_type: 'text',
			new_path: 'a.ts',
			old_path: 'a.ts',
			base_sha: '111',
			head_sha: '222',
			start_sha: '333',
		},
	});
});

test('postDiscussionNote includes line range for multiline note', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'postDiscussionNote',
		mergeRequestIid: 14,
		body: 'multi',
		startDiscussion: true,
		positionType: 'text',
		newPath: 'a.ts',
		oldPath: 'a.ts',
		baseSha: '111',
		headSha: '222',
		startSha: '333',
		lineRangeStartLineCode: 'code1',
		lineRangeStartType: 'new',
		lineRangeEndLineCode: 'code2',
		lineRangeEndType: 'old',
		lineRangeStartOldLine: 5,
		lineRangeEndNewLine: 7,
	});
	await node.execute.call(ctx);
	assert.deepStrictEqual(ctx.calls.options.body, {
		body: 'multi',
		position: {
			position_type: 'text',
			new_path: 'a.ts',
			old_path: 'a.ts',
			base_sha: '111',
			head_sha: '222',
			start_sha: '333',
			line_range: {
				start: { line_code: 'code1', type: 'new', old_line: 5 },
				end: { line_code: 'code2', type: 'old', new_line: 7 },
			},
		},
	});
});

test('get builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'get',
		mergeRequestIid: 1,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/1',
	);
});

test('getAll builds correct endpoint with limit', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'getAll',
		returnAll: false,
		limit: 3,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests',
	);
	assert.strictEqual(ctx.calls.options.qs.per_page, 3);
});

test('getAll builds correct endpoint when returnAll true', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'getAll',
		returnAll: true,
	});
	ctx.helpers.requestWithAuthentication = async (name, options) => {
		ctx.calls.options = JSON.parse(JSON.stringify(options));
		return { body: [], headers: { 'x-next-page': '' } };
	};
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests',
	);
	assert.strictEqual(ctx.calls.options.qs.per_page, 100);
	assert.strictEqual(ctx.calls.options.qs.page, 1);
});

test('getChanges builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'getChanges',
		mergeRequestIid: 11,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/11/changes',
	);
});

test('getDiscussions builds correct endpoint with limit', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'getDiscussions',
		mergeRequestIid: 12,
		returnAll: false,
		limit: 2,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/12/discussions',
	);
	assert.strictEqual(ctx.calls.options.qs.per_page, 2);
});

test('getDiscussions builds correct endpoint when returnAll true', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'getDiscussions',
		mergeRequestIid: 13,
		returnAll: true,
	});
	ctx.helpers.requestWithAuthentication = async (name, options) => {
		ctx.calls.options = JSON.parse(JSON.stringify(options));
		return { body: [], headers: { 'x-next-page': '' } };
	};
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/13/discussions',
	);
	assert.strictEqual(ctx.calls.options.qs.per_page, 100);
	assert.strictEqual(ctx.calls.options.qs.page, 1);
});

test('getDiscussion builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'getDiscussion',
		mergeRequestIid: 14,
		discussionId: 'd1',
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/14/discussions/d1',
	);
});

test('updateDiscussion builds correct endpoint and body', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'updateDiscussion',
		mergeRequestIid: 15,
                discussionId: 'd2',
                resolved: 'true',
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'PUT');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/15/discussions/d2',
	);
	assert.deepStrictEqual(ctx.calls.options.body, { resolved: true });
});

test('resolveDiscussion builds correct endpoint and body', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'resolveDiscussion',
		mergeRequestIid: 16,
                discussionId: 'd3',
                resolved: 'false',
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'PUT');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/16/discussions/d3',
	);
        assert.deepStrictEqual(ctx.calls.options.body, { resolved: false });
});

test('deleteDiscussion builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'deleteDiscussion',
		mergeRequestIid: 17,
		discussionId: 'd4',
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'DELETE');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/17/discussions/d4',
	);
});

test('getNote builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'getNote',
		mergeRequestIid: 18,
		noteId: 5,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'GET');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/18/notes/5',
	);
});

test('updateNote builds correct endpoint and body', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'updateNote',
		mergeRequestIid: 19,
		noteId: 6,
		body: 'edit',
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'PUT');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/19/notes/6',
	);
	assert.deepStrictEqual(ctx.calls.options.body, { body: 'edit' });
});

test('updateDiscussionNote builds correct endpoint and body', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'updateDiscussionNote',
		mergeRequestIid: 25,
		discussionId: 'd5',
		noteId: 8,
		body: 'fix',
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'PUT');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/25/discussions/d5/notes/8',
	);
	assert.deepStrictEqual(ctx.calls.options.body, { body: 'fix' });
});

test('updateDiscussionNote can resolve note without body', async () => {
        const node = new GitlabExtended();
        const ctx = createTrackedContext({
                resource: 'mergeRequest',
                operation: 'updateDiscussionNote',
                mergeRequestIid: 30,
                discussionId: 'd9',
                noteId: 14,
                resolved: 'true',
        });
        await node.execute.call(ctx);
        assert.strictEqual(ctx.calls.options.method, 'PUT');
        assert.strictEqual(
                ctx.calls.options.uri,
                'https://gitlab.example.com/api/v4/projects/1/merge_requests/30/discussions/d9/notes/14',
        );
        assert.deepStrictEqual(ctx.calls.options.body, { resolved: true });
});

test('updateDiscussionNote throws when body and resolved provided', async () => {
        const node = new GitlabExtended();
        const ctx = createTrackedContext({
                resource: 'mergeRequest',
                operation: 'updateDiscussionNote',
                mergeRequestIid: 31,
                discussionId: 'd10',
                noteId: 15,
                body: 'x',
                resolved: 'true',
        });
        await assert.rejects(
                () => node.execute.call(ctx),
                /body and resolved are mutually exclusive/,
        );
});

test('deleteNote builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'deleteNote',
		mergeRequestIid: 20,
		noteId: 7,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'DELETE');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/20/notes/7',
	);
});

test('labels add builds correct body', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'labels',
		mergeRequestIid: 21,
		labels: 'bug,urgent',
		labelAction: 'add',
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'PUT');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/21',
	);
	assert.deepStrictEqual(ctx.calls.options.body, { add_labels: 'bug,urgent' });
});

test('labels remove builds correct body', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'labels',
		mergeRequestIid: 22,
		labels: 'bug,urgent',
		labelAction: 'remove',
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'PUT');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/22',
	);
	assert.deepStrictEqual(ctx.calls.options.body, { remove_labels: 'bug,urgent' });
});

test('postDiscussionNote throws if discussionId missing when not starting discussion', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'postDiscussionNote',
		mergeRequestIid: 23,
		body: 'hi',
		startDiscussion: false,
		discussionId: '',
	});
	await assert.rejects(
		() => node.execute.call(ctx),
		/Discussion ID must be provided when replying to a discussion./,
	);
});

test('postDiscussionNote throws on negative oldLine', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'postDiscussionNote',
		mergeRequestIid: 24,
		body: 'bad',
		startDiscussion: true,
		positionType: 'text',
		newPath: 'a.ts',
		oldPath: 'a.ts',
		newLine: 5,
		baseSha: '111',
		headSha: '222',
		startSha: '333',
		oldLine: -1,
	});
	await assert.rejects(
		() => node.execute.call(ctx),
		/The "oldLine" parameter must be a non-negative number./,
	);
});

test('postDiscussionNote includes commitId and createdAt', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'postDiscussionNote',
		mergeRequestIid: 26,
		body: 'meta',
		startDiscussion: true,
		commitId: 'abc123',
		createdAt: '2024-01-01T00:00:00Z',
	});
	await node.execute.call(ctx);
	assert.deepStrictEqual(ctx.calls.options.body, {
		body: 'meta',
		commit_id: 'abc123',
		created_at: '2024-01-01T00:00:00Z',
	});
});

test('deleteDiscussionNote builds correct endpoint', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'deleteDiscussionNote',
		mergeRequestIid: 27,
		discussionId: 'd6',
		noteId: 9,
	});
	await node.execute.call(ctx);
	assert.strictEqual(ctx.calls.options.method, 'DELETE');
	assert.strictEqual(
		ctx.calls.options.uri,
		'https://gitlab.example.com/api/v4/projects/1/merge_requests/27/discussions/d6/notes/9',
	);
});

test('get throws on invalid mergeRequestIid', async () => {
	const node = new GitlabExtended();
	const ctx = createTrackedContext({
		resource: 'mergeRequest',
		operation: 'get',
		mergeRequestIid: 0,
	});
	await assert.rejects(() => node.execute.call(ctx), /mergeRequestIid must be a positive number/);
});
