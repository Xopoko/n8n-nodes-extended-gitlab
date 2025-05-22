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
import { requireString } from '../validators';

/**
 * Handles branch-related operations in a GitLab project, such as creating, retrieving,
 * listing, deleting, or renaming branches.
 *
 * @param {IExecuteFunctions} this - The execution context, providing access to workflow utilities.
 * @param {number} itemIndex - The index of the current item being processed.
 * @returns {Promise<INodeExecutionData[]>} A promise that resolves to an array of node execution data.
 */
export async function handleBranch(
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
		body.branch = this.getNodeParameter('branch', itemIndex);
		body.ref = this.getNodeParameter('ref', itemIndex);
		endpoint = `${base}/repository/branches`;
	} else if (operation === 'get') {
		requestMethod = 'GET';
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		endpoint = `${base}/repository/branches/${encodeURIComponent(branch)}`;
	} else if (operation === 'getAll') {
		requestMethod = 'GET';
		returnAll = this.getNodeParameter('returnAll', itemIndex);
		if (!returnAll) qs.per_page = this.getNodeParameter('limit', itemIndex);
		endpoint = `${base}/repository/branches`;
	} else if (operation === 'delete') {
		requestMethod = 'DELETE';
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		endpoint = `${base}/repository/branches/${encodeURIComponent(branch)}`;
	} else if (operation === 'rename') {
		requestMethod = 'PUT';
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		const newBranch = this.getNodeParameter('newBranch', itemIndex) as string;
		requireString.call(this, branch, 'branch', itemIndex);
		requireString.call(this, newBranch, 'newBranch', itemIndex);
		body.new_branch = newBranch;
		endpoint = `${base}/repository/branches/${encodeURIComponent(branch)}`;
	} else if (operation === 'protect') {
		requestMethod = 'POST';
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		requireString.call(this, branch, 'branch', itemIndex);
		body.name = branch;
		body.developers_can_push = this.getNodeParameter('developersCanPush', itemIndex, false);
		body.developers_can_merge = this.getNodeParameter('developersCanMerge', itemIndex, false);
		endpoint = `${base}/protected_branches`;
	} else if (operation === 'unprotect') {
		requestMethod = 'DELETE';
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		requireString.call(this, branch, 'branch', itemIndex);
		endpoint = `${base}/protected_branches/${encodeURIComponent(branch)}`;
	} else if (operation === 'merge') {
		requestMethod = 'POST';
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		const target = this.getNodeParameter('targetBranch', itemIndex) as string;
		requireString.call(this, branch, 'branch', itemIndex);
		requireString.call(this, target, 'targetBranch', itemIndex);
		body.source_branch = branch;
		body.target_branch = target;
		endpoint = `${base}/repository/merges`;
        } else if (operation === "checkout") {
                requestMethod = "GET";
                const ref = this.getNodeParameter("ref", itemIndex) as string;
                requireString.call(this, ref, "ref", itemIndex);
                qs.sha = ref;
                endpoint = `${base}/repository/archive`;
        } else if (operation === "applyPatch") {
                requestMethod = "POST";
                const branch = this.getNodeParameter("branch", itemIndex) as string;
                const patch = this.getNodeParameter("patch", itemIndex) as string;
                requireString.call(this, branch, "branch", itemIndex);
                requireString.call(this, patch, "patch", itemIndex);
                body.branch = branch;
                body.patch = patch;
                endpoint = `${base}/apply_patch`;
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
