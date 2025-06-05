import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	IHttpRequestMethods,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	gitlabApiRequest,
	gitlabApiRequestAllItems,
	buildProjectBase,
	assertValidProjectCredentials,
} from '../GenericFunctions';
import { requirePositive } from '../validators';

export async function handleMergeRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex);
	const credential = await this.getCredentials('gitlabExtendedApi');
	assertValidProjectCredentials.call(this, credential);

	const base = buildProjectBase(credential);

	let requestMethod: IHttpRequestMethods = 'GET';
	let endpoint = '';
	let body: IDataObject = {};
	let qs: IDataObject = {};
	let returnAll = false;

	if (operation === 'create') {
		requestMethod = 'POST';
		body.source_branch = this.getNodeParameter('source', itemIndex);
		body.target_branch = this.getNodeParameter('target', itemIndex);
		body.title = this.getNodeParameter('title', itemIndex);
		body.description = this.getNodeParameter('description', itemIndex);
		endpoint = `${base}/merge_requests`;
	} else if (operation === 'get') {
		requestMethod = 'GET';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		endpoint = `${base}/merge_requests/${iid}`;
	} else if (operation === 'getAll') {
		requestMethod = 'GET';
		returnAll = this.getNodeParameter('returnAll', itemIndex);
		if (!returnAll) qs.per_page = this.getNodeParameter('limit', itemIndex);
		endpoint = `${base}/merge_requests`;
	} else if (operation === 'createNote') {
		requestMethod = 'POST';
		body.body = this.getNodeParameter('body', itemIndex);
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/notes`;
	} else if (operation === 'postDiscussionNote') {
		requestMethod = 'POST';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const newDiscussion = this.getNodeParameter('startDiscussion', itemIndex, false);
		const note = this.getNodeParameter('body', itemIndex) as string;
		body.body = note;
		const commitId = this.getNodeParameter('commitId', itemIndex, '') as string;
		const createdAt = this.getNodeParameter('createdAt', itemIndex, '') as string;
		if (commitId) body.commit_id = commitId;
		if (createdAt) body.created_at = createdAt;

		const positionType = this.getNodeParameter('positionType', itemIndex, '') as string;
		const newPath = this.getNodeParameter('newPath', itemIndex, '') as string;
		const oldPath = this.getNodeParameter('oldPath', itemIndex, '') as string;
		const newLine = this.getNodeParameter('newLine', itemIndex, null) as number | null;
		const baseSha = this.getNodeParameter('baseSha', itemIndex, '') as string;
		const headSha = this.getNodeParameter('headSha', itemIndex, '') as string;
		const startSha = this.getNodeParameter('startSha', itemIndex, '') as string;
		const oldLine = this.getNodeParameter('oldLine', itemIndex, null) as number | null;
		const lineRangeStartLineCode = this.getNodeParameter(
			'lineRangeStartLineCode',
			itemIndex,
			'',
		) as string;
		const lineRangeStartType = this.getNodeParameter('lineRangeStartType', itemIndex, '') as string;
		const lineRangeStartOldLine = this.getNodeParameter(
			'lineRangeStartOldLine',
			itemIndex,
			null,
		) as number | null;
		const lineRangeStartNewLine = this.getNodeParameter(
			'lineRangeStartNewLine',
			itemIndex,
			null,
		) as number | null;
		const lineRangeEndLineCode = this.getNodeParameter(
			'lineRangeEndLineCode',
			itemIndex,
			'',
		) as string;
		const lineRangeEndType = this.getNodeParameter('lineRangeEndType', itemIndex, '') as string;
		const lineRangeEndOldLine = this.getNodeParameter('lineRangeEndOldLine', itemIndex, null) as
			| number
			| null;
		const lineRangeEndNewLine = this.getNodeParameter('lineRangeEndNewLine', itemIndex, null) as
			| number
			| null;

		const hasPosition =
			newPath !== '' && oldPath !== '' && baseSha !== '' && headSha !== '' && startSha !== '';

		if (hasPosition) {
			if (oldLine !== null && oldLine < 0) {
				throw new NodeOperationError(
					this.getNode(),
					'The "oldLine" parameter must be a non-negative number.',
				);
			}
			const position: IDataObject = {
				position_type: positionType || 'text',
				new_path: newPath,
				old_path: oldPath,
				base_sha: baseSha,
				head_sha: headSha,
				start_sha: startSha,
			};
			if (newLine !== null) {
				position.new_line = newLine;
			}
			if (oldLine !== null && oldLine !== 0) {
				position.old_line = oldLine;
			}
			const hasLineRange =
				lineRangeStartLineCode !== '' &&
				lineRangeStartType !== '' &&
				lineRangeEndLineCode !== '' &&
				lineRangeEndType !== '';
			if (hasLineRange) {
				const lineRange: IDataObject = {
					start: {
						line_code: lineRangeStartLineCode,
						type: lineRangeStartType,
					} as IDataObject,
					end: {
						line_code: lineRangeEndLineCode,
						type: lineRangeEndType,
					} as IDataObject,
				};
				if (lineRangeStartOldLine !== null) {
					(lineRange.start as IDataObject).old_line = lineRangeStartOldLine;
				}
				if (lineRangeStartNewLine !== null) {
					(lineRange.start as IDataObject).new_line = lineRangeStartNewLine;
				}
				if (lineRangeEndOldLine !== null) {
					(lineRange.end as IDataObject).old_line = lineRangeEndOldLine;
				}
				if (lineRangeEndNewLine !== null) {
					(lineRange.end as IDataObject).new_line = lineRangeEndNewLine;
				}
				position.line_range = lineRange;
			}
			body.position = position;
		}

		if (newDiscussion) {
			endpoint = `${base}/merge_requests/${iid}/discussions`;
		} else {
			const discussionId = this.getNodeParameter('discussionId', itemIndex);
			if (!discussionId) {
				throw new NodeOperationError(
					this.getNode(),
					'Discussion ID must be provided when replying to a discussion.',
				);
			}
			endpoint = `${base}/merge_requests/${iid}/discussions/${discussionId}/notes`;
		}
	} else if (operation === 'updateNote') {
		requestMethod = 'PUT';
		const noteId = this.getNodeParameter('noteId', itemIndex) as number;
		requirePositive.call(this, noteId, 'noteId', itemIndex);
		body.body = this.getNodeParameter('body', itemIndex);
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/notes/${noteId}`;
	} else if (operation === 'updateDiscussionNote') {
		requestMethod = 'PUT';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const discussionId = this.getNodeParameter('discussionId', itemIndex);
		const noteId = this.getNodeParameter('noteId', itemIndex) as number;
		requirePositive.call(this, noteId, 'noteId', itemIndex);
		const newBody = this.getNodeParameter('body', itemIndex, '') as string;
		if (newBody) body.body = newBody;
		const resolved = this.getNodeParameter('resolved', itemIndex, false) as boolean;
		body.resolved = resolved;
		endpoint = `${base}/merge_requests/${iid}/discussions/${discussionId}/notes/${noteId}`;
	} else if (operation === 'getChanges') {
		requestMethod = 'GET';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/changes`;
	} else if (operation === 'getDiscussions') {
		requestMethod = 'GET';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		returnAll = this.getNodeParameter('returnAll', itemIndex);
		if (!returnAll) qs.per_page = this.getNodeParameter('limit', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/discussions`;
	} else if (operation === 'getDiscussion') {
		requestMethod = 'GET';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const discussionId = this.getNodeParameter('discussionId', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/discussions/${discussionId}`;
	} else if (operation === 'updateDiscussion') {
		requestMethod = 'PUT';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const discussionId = this.getNodeParameter('discussionId', itemIndex);
		body.resolved = this.getNodeParameter('resolved', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/discussions/${discussionId}`;
	} else if (operation === 'deleteDiscussion') {
		requestMethod = 'DELETE';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const discussionId = this.getNodeParameter('discussionId', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/discussions/${discussionId}`;
	} else if (operation === 'getNote') {
		requestMethod = 'GET';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const noteId = this.getNodeParameter('noteId', itemIndex) as number;
		requirePositive.call(this, noteId, 'noteId', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/notes/${noteId}`;
	} else if (operation === 'deleteNote') {
		requestMethod = 'DELETE';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const noteId = this.getNodeParameter('noteId', itemIndex) as number;
		requirePositive.call(this, noteId, 'noteId', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/notes/${noteId}`;
	} else if (operation === 'deleteDiscussionNote') {
		requestMethod = 'DELETE';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const discussionId = this.getNodeParameter('discussionId', itemIndex);
		const noteId = this.getNodeParameter('noteId', itemIndex) as number;
		requirePositive.call(this, noteId, 'noteId', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/discussions/${discussionId}/notes/${noteId}`;
	} else if (operation === 'resolveDiscussion') {
		requestMethod = 'PUT';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const discussionId = this.getNodeParameter('discussionId', itemIndex);
		body.resolved = this.getNodeParameter('resolved', itemIndex);
		endpoint = `${base}/merge_requests/${iid}/discussions/${discussionId}`;
	} else if (operation === 'merge') {
		requestMethod = 'PUT';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const message = this.getNodeParameter('mergeCommitMessage', itemIndex, '');
		const strategy = this.getNodeParameter('mergeStrategy', itemIndex, 'merge') as string;
		if (message) body.merge_commit_message = message;
		if (strategy === 'squash') body.squash = true;
		endpoint = `${base}/merge_requests/${iid}/merge`;
	} else if (operation === 'rebase') {
		requestMethod = 'PUT';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const skipCi = this.getNodeParameter('skipCi', itemIndex, false);
		if (skipCi) qs.skip_ci = true;
		endpoint = `${base}/merge_requests/${iid}/rebase`;
	} else if (operation === 'close' || operation === 'reopen') {
		requestMethod = 'PUT';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		body.state_event = operation === 'close' ? 'close' : 'reopen';
		endpoint = `${base}/merge_requests/${iid}`;
	} else if (operation === 'labels') {
		requestMethod = 'PUT';
		const iid = this.getNodeParameter('mergeRequestIid', itemIndex) as number;
		requirePositive.call(this, iid, 'mergeRequestIid', itemIndex);
		const action = this.getNodeParameter('labelAction', itemIndex) as string;
		const labels = this.getNodeParameter('labels', itemIndex);
		if (action === 'add') {
			body.add_labels = labels;
		} else {
			body.remove_labels = labels;
		}
		endpoint = `${base}/merge_requests/${iid}`;
	} else {
		throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported.`, {
			itemIndex,
		});
	}

	const response = returnAll
		? await gitlabApiRequestAllItems.call(this, requestMethod, endpoint, body, qs)
		: await gitlabApiRequest.call(this, requestMethod, endpoint, body, qs);

	return this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(response as IDataObject),
		{ itemData: { item: itemIndex } },
	);
}
