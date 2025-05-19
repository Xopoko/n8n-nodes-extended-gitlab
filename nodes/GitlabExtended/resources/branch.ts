import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	IHttpRequestMethods,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { gitlabApiRequest, gitlabApiRequestAllItems, buildProjectBase } from '../GenericFunctions';

export async function handleBranch(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex);
	const credential = await this.getCredentials('gitlabExtendedApi');

	if (!credential.projectId) {
		const owner = credential.projectOwner as string;
		const name = credential.projectName as string;
		if (!owner || !name) {
			throw new NodeOperationError(
				this.getNode(),
				'Credentials must include either projectId or both projectOwner and projectName',
			);
		}
	}

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
		if (!branch) {
			throw new NodeOperationError(this.getNode(), 'branch must not be empty', { itemIndex });
		}
		if (!newBranch) {
			throw new NodeOperationError(this.getNode(), 'newBranch must not be empty', { itemIndex });
		}
		body.new_branch = newBranch;
		endpoint = `${base}/repository/branches/${encodeURIComponent(branch)}`;
	} else if (operation === 'protect') {
		requestMethod = 'POST';
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		if (!branch) {
			throw new NodeOperationError(this.getNode(), 'branch must not be empty', { itemIndex });
		}
		body.name = branch;
		body.developers_can_push = this.getNodeParameter('developersCanPush', itemIndex, false);
		body.developers_can_merge = this.getNodeParameter('developersCanMerge', itemIndex, false);
		endpoint = `${base}/protected_branches`;
	} else if (operation === 'unprotect') {
		requestMethod = 'DELETE';
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		if (!branch) {
			throw new NodeOperationError(this.getNode(), 'branch must not be empty', { itemIndex });
		}
		endpoint = `${base}/protected_branches/${encodeURIComponent(branch)}`;
	} else if (operation === 'merge') {
		requestMethod = 'POST';
		const branch = this.getNodeParameter('branch', itemIndex) as string;
		const target = this.getNodeParameter('targetBranch', itemIndex) as string;
		if (!branch) {
			throw new NodeOperationError(this.getNode(), 'branch must not be empty', { itemIndex });
		}
		if (!target) {
			throw new NodeOperationError(this.getNode(), 'targetBranch must not be empty', { itemIndex });
		}
		body.source_branch = branch;
		body.target_branch = target;
		endpoint = `${base}/repository/merges`;
	}

	const response = returnAll
		? await gitlabApiRequestAllItems.call(this, requestMethod, endpoint, body, qs)
		: await gitlabApiRequest.call(this, requestMethod, endpoint, body, qs);

	return this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(response as IDataObject),
		{ itemData: { item: itemIndex } },
	);
}
