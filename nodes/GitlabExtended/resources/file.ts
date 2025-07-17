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
	getCredentialData,
} from '../GenericFunctions';

export async function handleFile(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex);
	const credential = await getCredentialData.call(this);
	assertValidProjectCredentials.call(this, credential);

	const base = buildProjectBase(credential);

	let requestMethod: IHttpRequestMethods = 'GET';
	let endpoint = '';
	let body: IDataObject = {};
	let qs: IDataObject = {};
	let returnAll = false;

	if (operation === 'get') {
		requestMethod = 'GET';
		const path = this.getNodeParameter('path', itemIndex);
		qs.ref = this.getNodeParameter('fileRef', itemIndex);
		endpoint = `${base}/repository/files/${encodeURIComponent(path as string)}`;
	} else if (operation === 'list') {
		requestMethod = 'GET';
		const path = this.getNodeParameter('path', itemIndex);
		qs.ref = this.getNodeParameter('fileRef', itemIndex);
		returnAll = this.getNodeParameter('returnAll', itemIndex);
		if (!returnAll) qs.per_page = this.getNodeParameter('limit', itemIndex);
		if (path) qs.path = path;
		endpoint = `${base}/repository/tree`;
	} else if (operation === 'create' || operation === 'update') {
		requestMethod = operation === 'create' ? 'POST' : 'PUT';
		const path = this.getNodeParameter('path', itemIndex);
		body.branch = this.getNodeParameter('fileBranch', itemIndex);
		body.commit_message = this.getNodeParameter('commitMessage', itemIndex);
		body.content = this.getNodeParameter('fileContent', itemIndex);
		endpoint = `${base}/repository/files/${encodeURIComponent(path as string)}`;
	} else if (operation === 'delete') {
		requestMethod = 'DELETE';
		const path = this.getNodeParameter('path', itemIndex);
		body.branch = this.getNodeParameter('fileBranch', itemIndex);
		body.commit_message = this.getNodeParameter('commitMessage', itemIndex);
		endpoint = `${base}/repository/files/${encodeURIComponent(path as string)}`;
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
