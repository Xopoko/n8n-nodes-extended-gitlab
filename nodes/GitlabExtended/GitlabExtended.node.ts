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
        usableAsTool: true,
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'gitlabExtendedApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                description: "Choose the resource to work with, for example 'file' or 'pipeline'",
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
                description: "Select how to manage branches; for example choose 'create' to add a new branch",
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
                description: "Select how to manage pipelines, like using 'get' to fetch pipeline details",
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
                description: "Select how to work with files, such as choosing 'list' to view repository files",
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
                description: "Select how to handle issues, for example choose 'create' to open a new issue",
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
                description: "Choose an action on merge requests, such as 'create' to start a merge request",
                options: [
                    { name: 'Create', value: 'create', action: 'Create a merge request' },
                    { name: 'Create Discussion', value: 'createDiscussion', action: 'Create a discussion' },
                    { name: 'Create Note', value: 'createNote', action: 'Create a note' },
                    { name: 'Get', value: 'get', action: 'Get a merge request' },
                    { name: 'Get Many', value: 'getAll', action: 'List merge requests' },
                    { name: 'Post Discussion Note', value: 'postDiscussionNote', action: 'Post to discussion' },
                    { name: 'Update Note', value: 'updateNote', action: 'Update a note' },
                ],
                default: 'create',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['raw'] } },
                description: "Select the raw GitLab API action, for example choose 'request' to call an endpoint",
                options: [
                    { name: 'Request', value: 'request', action: 'Make an API request' },
                ],
                default: 'request',
            },
            {
                displayName: 'Branch Name',
                name: 'branchName',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['branch'], operation: ['create', 'get'] } },
                description: "Branch name, for example 'feature/login'",
                default: '',
            },
            {
                displayName: 'Ref',
                name: 'ref',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['branch'], operation: ['create'] } },
                description: "Existing branch or commit to create the new branch from, e.g. 'main' or a commit SHA",
                default: 'main',
            },
            {
                displayName: 'Pipeline ID',
                name: 'pipelineId',
                type: 'number',
                required: true,
                displayOptions: { show: { resource: ['pipeline'], operation: ['get'] } },
                description: "Numeric ID of the pipeline, for example '42'",
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
                description: "Branch or tag that triggers the pipeline, such as 'main'",
                default: 'main',
            },
            {
                displayName: 'Source Branch',
                name: 'sourceBranch',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['create'] } },
                description: "Source branch name, e.g. 'feature/api'",
                default: '',
            },
            {
                displayName: 'Target Branch',
                name: 'targetBranch',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['create'] } },
                description: "Target branch name, e.g. 'main'",
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
                description: "Path to the file, for example 'src/index.ts'",
                default: '',
            },
            {
                displayName: 'Reference',
                name: 'fileRef',
                type: 'string',
                displayOptions: { show: { resource: ['file'], operation: ['get', 'list'] } },
                description: "Reference such as a branch or commit SHA, e.g. 'main'",
                default: 'main',
            },
            {
                displayName: 'Title',
                name: 'title',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['issue', 'mergeRequest'], operation: ['create'] } },
                description: "Title text, for instance 'Fix login bug'",
                default: '',
            },
            {
                displayName: 'Description',
                name: 'description',
                type: 'string',
                displayOptions: { show: { resource: ['issue', 'mergeRequest'], operation: ['create'] } },
                description: "Detailed description, like 'Steps to reproduce the bug'",
                default: '',
            },
            {
                displayName: 'Issue Number',
                name: 'issueNumber',
                type: 'number',
                required: true,
                displayOptions: { show: { resource: ['issue'], operation: ['get'] } },
                description: "Issue number to fetch, for example '101'",
                default: 1,
            },
            {
                displayName: 'Merge Request IID',
                name: 'mergeRequestIid',
                type: 'number',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['mergeRequest'],
                        operation: ['get', 'createNote', 'postDiscussionNote', 'updateNote', 'createDiscussion'],
                    },
                },
                description: "The merge request IID, such as '7'",
                default: 1,
            },
            {
                displayName: 'Note Body',
                name: 'noteBody',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['mergeRequest'],
                        operation: ['createNote', 'postDiscussionNote', 'updateNote', 'createDiscussion'],
                    },
                },
                description: "Note text, e.g. 'Looks good to me'",
                default: '',
            },
            {
                displayName: 'Discussion ID',
                name: 'discussionId',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['mergeRequest'],
                        operation: ['postDiscussionNote', 'updateNote'],
                    },
                },
                description: "Discussion ID to reply to, e.g. '123abc'",
                default: '',
            },
            {
                displayName: 'Note ID',
                name: 'noteId',
                type: 'number',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['mergeRequest'],
                        operation: ['updateNote'],
                    },
                },
                description: "Existing note ID to update, for example '50'",
                default: 1,
            },
            {
                displayName: 'Post as Suggestion',
                name: 'asSuggestion',
                type: 'boolean',
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['createDiscussion'] } },
                description: 'Whether to format note as a suggestion',
                default: false,
            },
            {
                displayName: 'Position Type',
                name: 'positionType',
                type: 'options',
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['createDiscussion'] } },
                options: [
                    { name: 'Text', value: 'text' },
                    { name: 'Image', value: 'image' },
                ],
                default: 'text',
            },
            {
                displayName: 'New Path',
                name: 'newPath',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['createDiscussion'] } },
                description: 'Path to the new file',
                default: '',
            },
            {
                displayName: 'Old Path',
                name: 'oldPath',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['createDiscussion'] } },
                description: 'Path to the old file',
                default: '',
            },
            {
                displayName: 'New Line',
                name: 'newLine',
                type: 'number',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['createDiscussion'] } },
                description: 'Line number in the new file',
                default: 1,
            },
            {
                displayName: 'Old Line',
                name: 'oldLine',
                type: 'number',
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['createDiscussion'] } },
                description: 'Line number in the old file',
                default: 0,
            },
            {
                displayName: 'Base SHA',
                name: 'baseSha',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['createDiscussion'] } },
                description: 'Base commit SHA',
                default: '',
            },
            {
                displayName: 'Head SHA',
                name: 'headSha',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['createDiscussion'] } },
                description: 'Head commit SHA',
                default: '',
            },
            {
                displayName: 'Start SHA',
                name: 'startSha',
                type: 'string',
                required: true,
                displayOptions: { show: { resource: ['mergeRequest'], operation: ['createDiscussion'] } },
                description: 'Start commit SHA',
                default: '',
            },
            {
                displayName: 'HTTP Method',
                name: 'httpMethod',
                type: 'options',
                displayOptions: { show: { resource: ['raw'], operation: ['request'] } },
                description: "HTTP method to use, for example 'POST'",
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
                description: "Endpoint path like '/projects/1/issues'",
                default: '/',
                required: true,
            },
            {
                displayName: 'Body Parameters',
                name: 'bodyContent',
                type: 'json',
                displayOptions: { show: { resource: ['raw'], operation: ['request'], httpMethod: ['POST','PUT','PATCH'] } },
                description: "Request body payload, for example '{\"title\":\"New Issue\"}'",
                default: '',
            },
            {
                displayName: 'Query Parameters',
                name: 'queryParameters',
                type: 'json',
                displayOptions: { show: { resource: ['raw'], operation: ['request'] } },
                description: "Query parameters as JSON, e.g. '{\"state\":\"opened\"}'",
                default: '',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const operation = this.getNodeParameter('operation', 0);
        const resource = this.getNodeParameter('resource', 0);
        for (let i = 0; i < items.length; i++) {
            let requestMethod: IHttpRequestMethods = 'GET';
            let endpoint = '';
            let body: IDataObject = {};
            let qs: IDataObject = {};
            let returnAll = false;
            const credential = await this.getCredentials('gitlabExtendedApi');
            const base = credential.projectId
                ? `/projects/${credential.projectId}`
                : `/projects/${encodeURIComponent(credential.projectOwner as string)}%2F${encodeURIComponent(credential.projectName as string)}`;

            if (resource === 'branch') {
                if (operation === 'create') {
                    requestMethod = 'POST';
                    body.branch = this.getNodeParameter('branchName', i);
                    body.ref = this.getNodeParameter('ref', i);
                    endpoint = `${base}/repository/branches`;
                } else if (operation === 'get') {
                    requestMethod = 'GET';
                    const branch = this.getNodeParameter('branchName', i) as string;
                    endpoint = `${base}/repository/branches/${encodeURIComponent(branch)}`;
                } else if (operation === 'getAll') {
                    requestMethod = 'GET';
                    returnAll = this.getNodeParameter('returnAll', i);
                    if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
                    endpoint = `${base}/repository/branches`;
                }
            } else if (resource === 'pipeline') {
                if (operation === 'create') {
                    requestMethod = 'POST';
                    body.ref = this.getNodeParameter('pipelineRef', i);
                    endpoint = `${base}/pipeline`;
                } else if (operation === 'get') {
                    requestMethod = 'GET';
                    const id = this.getNodeParameter('pipelineId', i);
                    endpoint = `${base}/pipelines/${id}`;
                } else if (operation === 'getAll') {
                    requestMethod = 'GET';
                    returnAll = this.getNodeParameter('returnAll', i);
                    if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
                    endpoint = `${base}/pipelines`;
                }
            } else if (resource === 'file') {
                if (operation === 'get') {
                    requestMethod = 'GET';
                    const path = this.getNodeParameter('filePath', i);
                    qs.ref = this.getNodeParameter('fileRef', i);
                    endpoint = `${base}/repository/files/${encodeURIComponent(path as string)}`;
                } else if (operation === 'list') {
                    requestMethod = 'GET';
                    const path = this.getNodeParameter('filePath', i);
                    qs.ref = this.getNodeParameter('fileRef', i);
                    returnAll = this.getNodeParameter('returnAll', i);
                    if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
                    if (path) qs.path = path;
                    endpoint = `${base}/repository/tree`;
                }
            } else if (resource === 'issue') {
                if (operation === 'create') {
                    requestMethod = 'POST';
                    body.title = this.getNodeParameter('title', i);
                    body.description = this.getNodeParameter('description', i);
                    endpoint = `${base}/issues`;
                } else if (operation === 'get') {
                    requestMethod = 'GET';
                    const id = this.getNodeParameter('issueNumber', i);
                    endpoint = `${base}/issues/${id}`;
                }
            } else if (resource === 'mergeRequest') {
                if (operation === 'create') {
                    requestMethod = 'POST';
                    body.source_branch = this.getNodeParameter('sourceBranch', i);
                    body.target_branch = this.getNodeParameter('targetBranch', i);
                    body.title = this.getNodeParameter('title', i);
                    body.description = this.getNodeParameter('description', i);
                    endpoint = `${base}/merge_requests`;
                } else if (operation === 'get') {
                    requestMethod = 'GET';
                    const iid = this.getNodeParameter('mergeRequestIid', i);
                    endpoint = `${base}/merge_requests/${iid}`;
                } else if (operation === 'getAll') {
                    requestMethod = 'GET';
                    returnAll = this.getNodeParameter('returnAll', i);
                    if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
                    endpoint = `${base}/merge_requests`;
                } else if (operation === 'createNote') {
                    requestMethod = 'POST';
                    body.body = this.getNodeParameter('noteBody', i);
                    const iid = this.getNodeParameter('mergeRequestIid', i) as number;
                    endpoint = `${base}/merge_requests/${iid}/notes`;
                } else if (operation === 'postDiscussionNote') {
                    requestMethod = 'POST';
                    const discussionId = this.getNodeParameter('discussionId', i);
                    body.body = this.getNodeParameter('noteBody', i);
                    const iid = this.getNodeParameter('mergeRequestIid', i) as number;
                    endpoint = `${base}/merge_requests/${iid}/discussions/${discussionId}/notes`;
                } else if (operation === 'createDiscussion') {
                    requestMethod = 'POST';
                    const iid = this.getNodeParameter('mergeRequestIid', i) as number;
                    let note = this.getNodeParameter('noteBody', i) as string;
                    if (this.getNodeParameter('asSuggestion', i, false)) {
                        note = `\`\`\`suggestion:-0+0\n${note}\n\`\`\``;
                        // Wrap the note in a suggestion block so GitLab renders a patch
                    }
                    body.body = note;
                    const position: IDataObject = {
                        position_type: this.getNodeParameter('positionType', i),
                        new_path: this.getNodeParameter('newPath', i),
                        old_path: this.getNodeParameter('oldPath', i),
                        new_line: this.getNodeParameter('newLine', i),
                        base_sha: this.getNodeParameter('baseSha', i),
                        head_sha: this.getNodeParameter('headSha', i),
                        start_sha: this.getNodeParameter('startSha', i),
                    };
                    const oldLine = this.getNodeParameter('oldLine', i, 0) as number;
                    if (oldLine !== 0) {
                        position.old_line = oldLine;
                    }
                    body.position = position;
                    endpoint = `${base}/merge_requests/${iid}/discussions`;
                } else if (operation === 'updateNote') {
                    requestMethod = 'PUT';
                    const discussionId = this.getNodeParameter('discussionId', i);
                    const noteId = this.getNodeParameter('noteId', i);
                    body.body = this.getNodeParameter('noteBody', i);
                    const iid = this.getNodeParameter('mergeRequestIid', i) as number;
                    endpoint = `${base}/merge_requests/${iid}/discussions/${discussionId}/notes/${noteId}`;
                }
            } else if (resource === 'raw') {
                if (operation === 'request') {
                    requestMethod = this.getNodeParameter('httpMethod', i) as IHttpRequestMethods;
                    endpoint = this.getNodeParameter('rawEndpoint', i) as string;
                    body = this.getNodeParameter('bodyContent', i, {}) as IDataObject;
                    qs = this.getNodeParameter('queryParameters', i, {}) as IDataObject;
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
