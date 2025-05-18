import type {
	IExecuteFunctions,
	IHookFunctions,
	IDataObject,
	JsonObject,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Make an API request to Gitlab
 *
 */
export async function gitlabApiRequest(
	this: IHookFunctions | IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: object,
	query?: IDataObject,
	option: IDataObject = {},
): Promise<any> {
	const options: IRequestOptions = {
		method,
		headers: {},
		body,
		qs: query,
		uri: '',
		json: true,
	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}
	if (query === undefined) {
		delete options.qs;
	}

	const credential = await this.getCredentials('gitlabExtendedApi');
	const host = (credential.server as string).replace(/\/$/, '');
	const baseUrl = `${host}/api/v4`;

	try {
		options.uri = `${baseUrl}${endpoint}`;
		return await this.helpers.requestWithAuthentication.call(this, 'gitlabExtendedApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function gitlabApiRequestAllItems(
	this: IHookFunctions | IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: any = {},
	query: IDataObject = {},
): Promise<any> {
	const returnData: IDataObject[] = [];

	let responseData;

	query.per_page = 100;
	query.page = 1;

	do {
		responseData = await gitlabApiRequest.call(this, method, endpoint, body as IDataObject, query, {
			resolveWithFullResponse: true,
		});
		query.page++;
		returnData.push.apply(returnData, responseData.body as IDataObject[]);
	} while (responseData.headers.link?.includes('next'));
	return returnData;
}

/**
 * Get a merge request discussion by ID
 */
export async function getMergeRequestDiscussion(
	this: IHookFunctions | IExecuteFunctions,
	mergeRequestIid: number,
	discussionId: string,
	query: IDataObject = {},
): Promise<any> {
	const credential = await this.getCredentials('gitlabExtendedApi');
	const base = credential.projectId
		? `/projects/${credential.projectId}`
		: `/projects/${encodeURIComponent(credential.projectOwner as string)}%2F${encodeURIComponent(
				credential.projectName as string,
			)}`;
	const endpoint = `${base}/merge_requests/${mergeRequestIid}/discussions/${discussionId}`;
	return gitlabApiRequest.call(this, 'GET', endpoint, {}, query);
}
