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

export async function handlePipeline(
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
		body.ref = this.getNodeParameter('pipelineRef', itemIndex);
		endpoint = `${base}/pipeline`;
	} else if (operation === 'get') {
		requestMethod = 'GET';
		const id = this.getNodeParameter('pipelineId', itemIndex) as number;
		requirePositive.call(this, id, 'pipelineId', itemIndex);
		endpoint = `${base}/pipelines/${id}`;
	} else if (operation === 'getAll') {
		requestMethod = 'GET';
		returnAll = this.getNodeParameter('returnAll', itemIndex);
		if (!returnAll) qs.per_page = this.getNodeParameter('limit', itemIndex);
		endpoint = `${base}/pipelines`;
	} else if (operation === 'getJobs') {
		requestMethod = 'GET';
		const id = this.getNodeParameter('pipelineId', itemIndex) as number;
		requirePositive.call(this, id, 'pipelineId', itemIndex);
		returnAll = this.getNodeParameter('returnAll', itemIndex);
		if (!returnAll) qs.per_page = this.getNodeParameter('limit', itemIndex);
		endpoint = `${base}/pipelines/${id}/jobs`;
	} else if (operation === 'cancel' || operation === 'retry') {
		requestMethod = 'POST';
		const id = this.getNodeParameter('pipelineId', itemIndex) as number;
		requirePositive.call(this, id, 'pipelineId', itemIndex);
		endpoint = `${base}/pipelines/${id}/${operation}`;
	} else if (operation === 'delete') {
		requestMethod = 'DELETE';
		const id = this.getNodeParameter('pipelineId', itemIndex) as number;
		requirePositive.call(this, id, 'pipelineId', itemIndex);
		endpoint = `${base}/pipelines/${id}`;
	} else if (operation === 'downloadArtifacts') {
		requestMethod = 'GET';
		const id = this.getNodeParameter('pipelineId', itemIndex) as number;
		requirePositive.call(this, id, 'pipelineId', itemIndex);
		const ref = this.getNodeParameter('pipelineRef', itemIndex) as string;
		endpoint = `${base}/pipelines/${id}/jobs/artifacts/${ref}/download`;
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
