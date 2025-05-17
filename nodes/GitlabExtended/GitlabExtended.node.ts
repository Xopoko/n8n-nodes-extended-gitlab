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
                    { name: 'Pipeline', value: 'pipeline' },
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
                    show: { resource: ['branch', 'pipeline'], operation: ['getAll'] },
                },
                default: false,
                description: 'Whether to return all results or only up to a given limit',
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                displayOptions: {
                    show: { resource: ['branch', 'pipeline'], operation: ['getAll'], returnAll: [false] },
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
            const owner = (this.getNodeParameter('owner', i) as string).replace(/\//g, '%2F');
            const repo = this.getNodeParameter('repository', i) as string;
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
