import type {
	IExecuteFunctions,
	IHookFunctions,
	IDataObject,
	JsonObject,
	IHttpRequestMethods,
	IRequestOptions,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

export async function getCredentialData(
	this: IHookFunctions | IExecuteFunctions,
): Promise<IDataObject> {
	const useCustom = this.getNodeParameter('useCustomCredentials', 0, false) as boolean;
	if (useCustom) {
		return this.getNodeParameter('customCredentials', 0) as IDataObject;
	}
	return (await this.getCredentials('gitlabExtendedApi')) as IDataObject;
}

/**
 * Make an API request to Gitlab
 *
 * @param {IHookFunctions | IExecuteFunctions} this - The context of the function
 * @param {IHttpRequestMethods} method - The HTTP method to use for the request
 * @param {string} endpoint - The API endpoint to call
 * @param {object} body - The request body
 * @param {IDataObject} [query] - The query parameters
 * @param {IDataObject} [option] - Additional options for the request
 * @returns {Promise<any>} The response from the API
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

	const credential = await getCredentialData.call(this);
	const server = credential.server as string | undefined;
	if (!server) {
		throw new NodeOperationError(this.getNode(), 'GitLab server URL is missing in credentials');
	}
	const host = server.replace(/\/$/, '');
	if (!credential.accessToken) {
		throw new NodeOperationError(this.getNode(), 'Access token is missing in GitLab credentials');
	}
	const baseUrl = `${host}/api/v4`;

	try {
		const url = `${baseUrl}${endpoint}`;
		options.uri = url;
		const useCustom = this.getNodeParameter('useCustomCredentials', 0, false) as boolean;
		if (useCustom) {
			options.headers!['Private-Token'] = credential.accessToken as string;
			return await this.helpers.httpRequest.call(this, {
				...(options as unknown as IHttpRequestOptions),
				url,
			});
		}
		return await this.helpers.requestWithAuthentication.call(this, 'gitlabExtendedApi', options);
	} catch (error) {
		let description;
		let message: string | undefined;
		const responseData = (error as JsonObject as { response?: { data?: unknown } }).response?.data;
		if (responseData !== undefined) {
			description = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
			message = description;
		} else {
			message = (error as Error).message;
		}
		throw new NodeApiError(this.getNode(), error as JsonObject, { message, description });
	}
}

/**
 * Make an API request to Gitlab and retrieve all items
 *
 * @param {IHookFunctions | IExecuteFunctions} this - The context of the function
 * @param {IHttpRequestMethods} method - The HTTP method to use for the request
 * @param {string} endpoint - The API endpoint to call
 * @param {object} [body] - The request body
 * @param {IDataObject} [query] - The query parameters
 * @returns {Promise<any>} The response from the API
 */
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
	} while (responseData.headers['x-next-page']);
	return returnData;
}

/**
 * Build the base URL for a project
 *
 * @param {IDataObject} cred - The credentials object
 * @returns {string} The base URL for the project
 */
export function buildProjectBase(cred: IDataObject): string {
	return cred.projectId
		? `/projects/${cred.projectId}`
		: `/projects/${encodeURIComponent(cred.projectOwner as string)}%2F${encodeURIComponent(
				cred.projectName as string,
			)}`;
}

/**
 * Ensure credentials contain enough information to identify a project.
 */
export function assertValidProjectCredentials(
	this: IHookFunctions | IExecuteFunctions,
	cred: IDataObject,
): void {
	if (!cred.projectId) {
		const owner = cred.projectOwner as string;
		const name = cred.projectName as string;
		if (!owner || !name) {
			throw new NodeOperationError(
				this.getNode(),
				'Credentials must include either projectId or both projectOwner and projectName',
			);
		}
	}
}

/**
 * Get a merge request discussion by ID
 *
 * @param {IHookFunctions | IExecuteFunctions} this - The context of the function
 * @param {number} mergeRequestIid - The IID of the merge request
 * @param {string} discussionId - The ID of the discussion
 * @param {IDataObject} [query] - The query parameters
 * @returns {Promise<any>} The response from the API
 */
export async function getMergeRequestDiscussion(
	this: IHookFunctions | IExecuteFunctions,
	mergeRequestIid: number,
	discussionId: string,
	query: IDataObject = {},
): Promise<any> {
	if (mergeRequestIid <= 0) {
		throw new NodeOperationError(this.getNode(), 'mergeRequestIid must be a positive number');
	}
	const credential = await getCredentialData.call(this);
	const base = buildProjectBase(credential);
	const endpoint = `${base}/merge_requests/${mergeRequestIid}/discussions/${encodeURIComponent(discussionId)}`;
	return gitlabApiRequest.call(this, 'GET', endpoint, {}, query);
}

/**
 * Add a string parameter to the request body if it has a non-empty value.
 */
export function addOptionalStringParam(
	this: IHookFunctions | IExecuteFunctions,
	body: IDataObject,
	paramName: string,
	bodyKey: string,
	itemIndex: number,
): void {
	const value = this.getNodeParameter(paramName, itemIndex, '') as string;
	if (value) {
		body[bodyKey] = value;
	}
}
