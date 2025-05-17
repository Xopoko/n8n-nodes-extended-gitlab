import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
    IHttpRequestMethods,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

import { gitlabApiRequest, gitlabApiRequestAllItems } from './GenericFunctions';

export class GitlabExtended implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'GitLab Extended',
        name: 'gitlabExtended',
        icon: 'file:gitlab.svg',
        group: ['input'],
        version: 1,
        description: 'Extended GitLab node',
        defaults: { name: 'GitLab Extended' },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'gitlabApi',
                required: true,
                displayOptions: { show: { authentication: ['accessToken'] } },
            },
            {
                name: 'gitlabOAuth2Api',
                required: true,
                displayOptions: { show: { authentication: ['oAuth2'] } },
            },
        ],
        properties: [
            {
                displayName: 'Authentication',
                name: 'authentication',
                type: 'options',
                options: [
                    { name: 'Access Token', value: 'accessToken' },
                    { name: 'OAuth2', value: 'oAuth2' },
                ],
                default: 'accessToken',
            },
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    { name: 'Branch', value: 'branch' },
                    { name: 'File', value: 'file' },
                    { name: 'Issue', value: 'issue' },
                    { name: 'Merge Request', value: 'mergeRequest' },
                    { name: 'Pipeline', value: 'pipeline' },
                    { name: 'Raw API', value: 'raw' },
                ],
                default: 'branch',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['branch'] } },
                options: [
                    { name: 'Create', value: 'create', action: 'Create a branch' },
                    { name: 'Get', value: 'get', action: 'Get a branch' },
                    { name: 'Get Many', value: 'getAll', action: 'List branches' },
                ],
                default: 'create',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['pipeline'] } },
                options: [
                    { name: 'Create', value: 'create', action: 'Create a pipeline' },
                    { name: 'Get', value: 'get', action: 'Get a pipeline' },
                    { name: 'Get Many', value: 'getAll', action: 'List pipelines' },
                ],
                default: 'create',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['file'] } },
                options: [
                    { name: 'Get', value: 'get', action: 'Get a file' },
                    { name: 'List', value: 'list', action: 'List files' },
                ],
                default: 'get',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['issue'] } },
                options: [
                    { name: 'Create', value: 'create', action: 'Create an issue' },
                    { name: 'Get', value: 'get', action: 'Get an issue' },
                ],
                default: 'create',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['mergeRequest'] } },
                options: [
                    { name: 'Create', value: 'create', action: 'Create a merge request' },
                    { name: 'Get', value: 'get', action: 'Get a merge request' },
                    { name: 'Get Many', value: 'getAll', action: 'List merge requests' },
                ],
                default: 'create',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['raw'] } },
                options: [
                    { name: 'Request', value: 'request', action: 'Make an API request' },
                ],
                default: 'request',
            },
            { displayName: 'Project Owner', name: 'owner', type: 'string', required: true, default: '' },
            { displayName: 'Project Name', name: 'repository', type: 'string', required: true, default: '' },
            {
                displayName: 'Branch Name',
                name: 'branchName',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['branch'], operation: ['create', 'get'] } },
                default: '',
            },
            {
                displayName: 'Ref',
                name: 'ref',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['branch'], operation: ['create'] } },
                default: 'main',
            },
            {
                displayName: 'Pipeline ID',
                name: 'pipelineId',
                type: 'number',
                required: true,
                displayOptions: { show: { resource: ['pipeline'], operation: ['get'] } },
                default: 1,
            },
            {
                displayName: 'Return All',
                name: 'returnAll',
                type: 'boolean',
                displayOptions: {
                    show: {
                        resource: ['branch', 'pipeline', 'file', 'mergeRequest'],
                        operation: ['getAll', 'list'],
                    },
                },
                default: false,
                description: 'Whether to return all results or only up to a given limit',
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['branch', 'pipeline', 'file', 'mergeRequest'],
                        operation: ['getAll', 'list'],
                        returnAll: [false],
                    },
                },
                typeOptions: {
                    minValue: 1,
                },
                default: 50,
                description: 'Max number of results to return',
            },
            {
                displayName: 'Ref',
                name: 'pipelineRef',
                type: 'string',
                displayOptions: { show: { resource: ['pipeline'], operation: ['create'] } },
                default: 'main',
            },
            {
                displayName: 'Source Branch',
                name: 'sourceBranch',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['create'] } },
                default: '',
            },
            {
                displayName: 'Target Branch',
                name: 'targetBranch',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['create'] } },
                default: 'main',
            },
            {
                displayName: 'File Path',
                name: 'filePath',
                type: 'string',
                required: true,
                displayOptions: {
                    show: { resource: ['file'], operation: ['get', 'list'] },
                },
                default: '',
            },
            {
                displayName: 'Reference',
                name: 'fileRef',
                type: 'string',
                displayOptions: { show: { resource: ['file'], operation: ['get', 'list'] } },
                default: 'main',
            },
            {
                displayName: 'Title',
                name: 'title',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['issue', 'mergeRequest'], operation: ['create'] } },
                default: '',
            },
            {
                displayName: 'Description',
                name: 'description',
                type: 'string',
                displayOptions: { show: { resource: ['issue', 'mergeRequest'], operation: ['create'] } },
                default: '',
            },
            {
                displayName: 'Issue Number',
                name: 'issueNumber',
                type: 'number',
                required: true,
                displayOptions: { show: { resource: ['issue'], operation: ['get'] } },
                default: 1,
            },
            {
                displayName: 'Merge Request IID',
                name: 'mergeRequestIid',
                type: 'number',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['get'] } },
                default: 1,
            },
            {
                displayName: 'HTTP Method',
                name: 'httpMethod',
                type: 'options',
                displayOptions: { show: { resource: ['raw'], operation: ['request'] } },
                options: [
                    { name: 'DELETE', value: 'DELETE' },
                    { name: 'GET', value: 'GET' },
                    { name: 'PATCH', value: 'PATCH' },
                    { name: 'POST', value: 'POST' },
                    { name: 'PUT', value: 'PUT' },
                ],
                default: 'GET',
            },
            {
                displayName: 'Endpoint',
                name: 'rawEndpoint',
                type: 'string',
                displayOptions: { show: { resource: ['raw'], operation: ['request'] } },
                default: '/',
                required: true,
            },
            {
                displayName: 'Body Parameters',
                name: 'bodyContent',
                type: 'json',
                displayOptions: { show: { resource: ['raw'], operation: ['request'], httpMethod: ['POST','PUT','PATCH'] } },
                default: '',
            },
            {
                displayName: 'Query Parameters',
                name: 'queryParameters',
                type: 'json',
                displayOptions: { show: { resource: ['raw'], operation: ['request'] } },
                default: '',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const operation = this.getNodeParameter('operation', 0);
        const resource = this.getNodeParameter('resource', 0);
        const overwrite: string[] = [];

        for (let i = 0; i < items.length; i++) {
            let requestMethod: IHttpRequestMethods = 'GET';
            let endpoint = '';
            let body: IDataObject = {};
            let qs: IDataObject = {};
            let returnAll = false;
            const owner = encodeURIComponent(this.getNodeParameter('owner', i) as string);
            const repo = encodeURIComponent(this.getNodeParameter('repository', i) as string);
            const base = `/projects/${owner}%2F${repo}`;

            if (resource === 'branch') {
                if (operation === 'create') {
                    requestMethod = 'POST';
                    body.branch = this.getNodeParameter('branchName', i);
                    body.ref = this.getNodeParameter('ref', i);
                    endpoint = `${base}/repository/branches`;
                    overwrite.push('branch:create');
                } else if (operation === 'get') {
                    requestMethod = 'GET';
                    const branch = this.getNodeParameter('branchName', i) as string;
                    endpoint = `${base}/repository/branches/${encodeURIComponent(branch)}`;
                    overwrite.push('branch:get');
                } else if (operation === 'getAll') {
                    requestMethod = 'GET';
                    returnAll = this.getNodeParameter('returnAll', i);
                    if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
                    endpoint = `${base}/repository/branches`;
                    overwrite.push('branch:getAll');
                }
            } else if (resource === 'pipeline') {
                if (operation === 'create') {
                    requestMethod = 'POST';
                    body.ref = this.getNodeParameter('pipelineRef', i);
                    endpoint = `${base}/pipeline`;
                    overwrite.push('pipeline:create');
                } else if (operation === 'get') {
                    requestMethod = 'GET';
                    const id = this.getNodeParameter('pipelineId', i);
                    endpoint = `${base}/pipelines/${id}`;
                    overwrite.push('pipeline:get');
                } else if (operation === 'getAll') {
                    requestMethod = 'GET';
                    returnAll = this.getNodeParameter('returnAll', i);
                    if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
                    endpoint = `${base}/pipelines`;
                    overwrite.push('pipeline:getAll');
                }
            } else if (resource === 'file') {
                if (operation === 'get') {
                    requestMethod = 'GET';
                    const path = this.getNodeParameter('filePath', i);
                    qs.ref = this.getNodeParameter('fileRef', i);
                    endpoint = `${base}/repository/files/${encodeURIComponent(path as string)}`;
                    overwrite.push('file:get');
                } else if (operation === 'list') {
                    requestMethod = 'GET';
                    const path = this.getNodeParameter('filePath', i);
                    qs.ref = this.getNodeParameter('fileRef', i);
                    returnAll = this.getNodeParameter('returnAll', i);
                    if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
                    if (path) qs.path = path;
                    endpoint = `${base}/repository/tree`;
                    overwrite.push('file:list');
                }
            } else if (resource === 'issue') {
                if (operation === 'create') {
                    requestMethod = 'POST';
                    body.title = this.getNodeParameter('title', i);
                    body.description = this.getNodeParameter('description', i);
                    endpoint = `${base}/issues`;
                    overwrite.push('issue:create');
                } else if (operation === 'get') {
                    requestMethod = 'GET';
                    const id = this.getNodeParameter('issueNumber', i);
                    endpoint = `${base}/issues/${id}`;
                    overwrite.push('issue:get');
                }
            } else if (resource === 'mergeRequest') {
                if (operation === 'create') {
                    requestMethod = 'POST';
                    body.source_branch = this.getNodeParameter('sourceBranch', i);
                    body.target_branch = this.getNodeParameter('targetBranch', i);
                    body.title = this.getNodeParameter('title', i);
                    body.description = this.getNodeParameter('description', i);
                    endpoint = `${base}/merge_requests`;
                    overwrite.push('mergeRequest:create');
                } else if (operation === 'get') {
                    requestMethod = 'GET';
                    const iid = this.getNodeParameter('mergeRequestIid', i);
                    endpoint = `${base}/merge_requests/${iid}`;
                    overwrite.push('mergeRequest:get');
                } else if (operation === 'getAll') {
                    requestMethod = 'GET';
                    returnAll = this.getNodeParameter('returnAll', i);
                    if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
                    endpoint = `${base}/merge_requests`;
                    overwrite.push('mergeRequest:getAll');
                }
            } else if (resource === 'raw') {
                if (operation === 'request') {
                    requestMethod = this.getNodeParameter('httpMethod', i) as IHttpRequestMethods;
                    endpoint = this.getNodeParameter('rawEndpoint', i) as string;
                    body = this.getNodeParameter('bodyContent', i, {}) as IDataObject;
                    qs = this.getNodeParameter('queryParameters', i, {}) as IDataObject;
                    overwrite.push('raw:request');
                }
            } else {
                throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, { itemIndex: i });
            }

            const response = returnAll
                ? await gitlabApiRequestAllItems.call(this, requestMethod, endpoint, body, qs)
                : await gitlabApiRequest.call(this, requestMethod, endpoint, body, qs);

            const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(response as IDataObject), { itemData: { item: i } });
            returnData.push(...executionData);
        }

        return [returnData];
    }
}
