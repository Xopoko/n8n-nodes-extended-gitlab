import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestMethods,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

import {
	gitlabApiRequest,
	gitlabApiRequestAllItems,
	buildProjectBase,
	assertValidProjectCredentials,
	addOptionalStringParam,
	resolveCredential,
} from './GenericFunctions';
import { requirePositive } from './validators';
import { handleBranch } from './resources/branch';
import { handlePipeline } from './resources/pipeline';
import { handleFile } from './resources/file';
import { handleMergeRequest } from './resources/mergeRequest';
import { branchOperations } from './operations';

export class GitlabExtended implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitLab Extended',
		name: 'gitlabExtended',
		icon: 'file:gitlab.svg',
		group: ['input'],
		version: 1,
		description: 'Extended GitLab node',
		defaults: { name: 'GitLab Extended' },
		subtitle: '={{$parameter.resource}} {{$parameter.operation}}',
		usableAsTool: true,
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'gitlabExtendedApi',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'Credential', value: 'credential' },
					{ name: 'Custom', value: 'custom' },
				],
				default: 'credential',
				description: 'Select whether to use saved credentials or custom fields for this node',
			},
			{
				displayName: 'GitLab Server',
				name: 'server',
				type: 'string',
				default: 'https://gitlab.com',
				displayOptions: { show: { authentication: ['custom'] } },
				description: 'Base URL of your GitLab instance, for example "https://gitlab.com"',
			},
			{
				displayName: 'Access Token',
				name: 'accessToken',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				displayOptions: { show: { authentication: ['custom'] } },
				description: 'Personal access token with API permissions',
			},
			{
				displayName: 'Project Owner',
				name: 'projectOwner',
				type: 'string',
				default: '',
				displayOptions: { show: { authentication: ['custom'] } },
				description: 'Namespace or owner of the project. Ignored if "Project ID" is set.',
			},
			{
				displayName: 'Project Name',
				name: 'projectName',
				type: 'string',
				default: '',
				displayOptions: { show: { authentication: ['custom'] } },
				description: 'Project slug or name. Ignored if "Project ID" is set.',
			},
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'number',
				default: 0,
				displayOptions: { show: { authentication: ['custom'] } },
				description: 'Numeric project ID. Takes precedence over owner and name if provided.',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				description: "Choose the resource to work with, for example 'file' or 'pipeline'",
				options: [
					{ name: 'Branch', value: 'branch' },
					{ name: 'File', value: 'file' },
					{ name: 'Group', value: 'group' },
					{ name: 'Issue', value: 'issue' },
					{ name: 'Merge Request', value: 'mergeRequest' },
					{ name: 'Pipeline', value: 'pipeline' },
					{ name: 'Project', value: 'project' },
					{ name: 'Raw API', value: 'raw' },
					{ name: 'Release', value: 'release' },
					{ name: 'Tag', value: 'tag' },
				],
				default: 'branch',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['branch'] } },
				description:
					"Select how to manage branches; for example choose 'create' to add a new branch",
				options: Object.values(branchOperations),
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
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
					{ name: 'Cancel', value: 'cancel', action: 'Cancel a pipeline' },
					{ name: 'Create', value: 'create', action: 'Create a pipeline' },
					{ name: 'Delete', value: 'delete', action: 'Delete a pipeline' },
					{ name: 'Download Artifacts', value: 'downloadArtifacts', action: 'Download artifacts' },
					{ name: 'Get', value: 'get', action: 'Get a pipeline' },
					{ name: 'Get Jobs', value: 'getJobs', action: 'List pipeline jobs' },
					{ name: 'Get Many', value: 'getAll', action: 'List pipelines' },
					{ name: 'Retry', value: 'retry', action: 'Retry a pipeline' },
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['tag'] } },
				description: 'Select how to manage tags',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a tag' },
					{ name: 'Get', value: 'get', action: 'Get a tag' },
					{ name: 'Get Many', value: 'getAll', action: 'List tags' },
					{ name: 'Delete', value: 'delete', action: 'Delete a tag' },
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['release'] } },
				description: 'Select how to manage releases',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a release' },
					{ name: 'Delete', value: 'delete', action: 'Delete a release' },
					{ name: 'Get', value: 'get', action: 'Get a release' },
					{ name: 'Get Many', value: 'getAll', action: 'List releases' },
					{ name: 'Update', value: 'update', action: 'Update a release' },
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['group'] } },
				description: 'Select how to manage groups',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a group' },
					{ name: 'Delete', value: 'delete', action: 'Delete a group' },
					{ name: 'Get', value: 'get', action: 'Get a group' },
					{ name: 'List Members', value: 'getMembers', action: 'List group members' },
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['project'] } },
				description: 'Select how to manage projects',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a project' },
					{ name: 'Get', value: 'get', action: 'Get a project' },
					{ name: 'Get Many', value: 'getAll', action: 'List projects' },
					{ name: 'Search', value: 'search', action: 'Search projects' },
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['file'] } },
				description:
					"Select how to work with files, such as choosing 'list' to view repository files",
				options: [
					{ name: 'Create', value: 'create', action: 'Create a file' },
					{ name: 'Delete', value: 'delete', action: 'Delete a file' },
					{ name: 'Get', value: 'get', action: 'Get a file' },
					{ name: 'List', value: 'list', action: 'List files' },
					{ name: 'Update', value: 'update', action: 'Update a file' },
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
					{ name: 'Close', value: 'close', action: 'Close an issue' },
					{ name: 'Create', value: 'create', action: 'Create an issue' },
					{ name: 'Get', value: 'get', action: 'Get an issue' },
					{ name: 'Get Many', value: 'getAll', action: 'List issues' },
					{ name: 'Reopen', value: 'reopen', action: 'Reopen an issue' },
					{ name: 'Update', value: 'update', action: 'Update an issue' },
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['mergeRequest'] } },
				description:
					"Choose an action on merge requests, such as 'create' to start a merge request",
				options: [
					{ name: 'Close', value: 'close', action: 'Close a merge request' },
					{ name: 'Create', value: 'create', action: 'Create a merge request' },
					{ name: 'Create Note', value: 'createNote', action: 'Create a note' },
					{ name: 'Delete Discussion', value: 'deleteDiscussion', action: 'Delete a discussion' },
					{
						name: 'Delete Discussion Note',
						value: 'deleteDiscussionNote',
						action: 'Delete a discussion note',
					},
					{ name: 'Delete Note', value: 'deleteNote', action: 'Delete a note' },
					{ name: 'Get', value: 'get', action: 'Get a merge request' },
					{ name: 'Get Changes', value: 'getChanges', action: 'Get merge request changes' },
					{ name: 'Get Discussion', value: 'getDiscussion', action: 'Get a discussion by ID' },
					{ name: 'Get Discussions', value: 'getDiscussions', action: 'List discussions' },
					{ name: 'Get Many', value: 'getAll', action: 'List merge requests' },
					{ name: 'Get Note', value: 'getNote', action: 'Get a note' },
					{ name: 'Labels', value: 'labels', action: 'Add or remove labels' },
					{ name: 'Merge', value: 'merge', action: 'Merge a merge request' },
					{
						name: 'Post Discussion Note',
						value: 'postDiscussionNote',
						action: 'Post to discussion',
					},
					{ name: 'Rebase', value: 'rebase', action: 'Rebase a merge request' },
					{ name: 'Reopen', value: 'reopen', action: 'Reopen a merge request' },
					{
						name: 'Resolve Discussion',
						value: 'resolveDiscussion',
						action: 'Resolve a discussion',
					},
					{ name: 'Update Discussion', value: 'updateDiscussion', action: 'Update a discussion' },
					{
						name: 'Update Discussion Note',
						value: 'updateDiscussionNote',
						action: 'Update a discussion note',
					},
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
				description:
					"Select the raw GitLab API action, for example choose 'request' to call an endpoint",
				options: [{ name: 'Request', value: 'request', action: 'Make an API request' }],
				default: 'request',
			},
			{
				displayName: 'Branch',
				name: 'branch',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['branch'],
						operation: ['create', 'get', 'delete', 'rename', 'protect', 'unprotect', 'merge'],
					},
				},
				description: "Branch name, for example 'feature/login'",
				default: '',
			},
			{
				displayName: 'Branch',
				name: 'branch',
				type: 'string',
				displayOptions: { show: { resource: ['branch'], operation: ['getAll'] } },
				description: "Branch name, for example 'feature/login'",
				default: '',
			},
			{
				displayName: 'New Branch',
				name: 'newBranch',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['branch'], operation: ['rename'] } },
				description: 'New branch name',
				default: '',
			},
			{
				displayName: 'Target Branch',
				name: 'targetBranch',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['branch'], operation: ['merge'] } },
				description: 'Target branch to merge into',
				default: '',
			},
			{
				displayName: 'Developers Can Push',
				name: 'developersCanPush',
				type: 'boolean',
				displayOptions: { show: { resource: ['branch'], operation: ['protect'] } },
				description: 'Whether developers can push',
				default: false,
			},
			{
				displayName: 'Developers Can Merge',
				name: 'developersCanMerge',
				type: 'boolean',
				displayOptions: { show: { resource: ['branch'], operation: ['protect'] } },
				description: 'Whether developers can merge',
				default: false,
			},
			{
				displayName: 'Ref',
				name: 'ref',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['branch', 'file', 'tag'],
						operation: ['create', 'get', 'list'],
					},
				},
				description:
					"Existing branch or commit to create the new branch from, e.g. 'main' or a commit SHA",
				default: 'main',
			},
			{
				displayName: 'Pipeline ID',
				name: 'pipelineId',
				type: 'number',
				required: true,
				typeOptions: { minValue: 1 },
				displayOptions: {
					show: {
						resource: ['pipeline'],
						operation: ['get', 'cancel', 'retry', 'getJobs', 'delete', 'downloadArtifacts'],
					},
				},
				description: 'Numeric ID of the pipeline (must be positive)',
				default: 1,
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: [
							'branch',
							'pipeline',
							'file',
							'mergeRequest',
							'issue',
							'group',
							'tag',
							'release',
						],
						operation: ['getAll', 'list', 'getDiscussions', 'getJobs', 'getMembers'],
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
						resource: [
							'branch',
							'pipeline',
							'file',
							'mergeRequest',
							'issue',
							'group',
							'tag',
							'release',
						],
						operation: ['getAll', 'list', 'getDiscussions', 'getJobs', 'getMembers'],
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
				displayOptions: {
					show: { resource: ['pipeline'], operation: ['create', 'downloadArtifacts'] },
				},
				description: "Branch or tag that triggers the pipeline, such as 'main'",
				default: 'main',
			},
			{
				displayName: 'Tag Name',
				name: 'tagName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['tag'],
						operation: ['create', 'get', 'delete'],
					},
				},
				description: 'Name of the tag',
				default: '',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				displayOptions: { show: { resource: ['tag'], operation: ['create'] } },
				description: 'Optional message for the tag',
				default: '',
			},
			{
				displayName: 'Tag Name',
				name: 'tagName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['release'],
						operation: ['create', 'update', 'get', 'delete'],
					},
				},
				description: 'Release tag name',
				default: '',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['release'], operation: ['create', 'update'] } },
				description: 'Release name',
				default: '',
			},
			{
				displayName: 'Description',
				name: 'releaseDescription',
				type: 'string',
				displayOptions: { show: { resource: ['release'], operation: ['create', 'update'] } },
				description: 'Release description',
				default: '',
			},
			{
				displayName: 'Assets',
				name: 'assets',
				type: 'json',
				displayOptions: { show: { resource: ['release'], operation: ['create', 'update'] } },
				description: 'JSON with assets links',
				default: '',
			},
			{
				displayName: 'Source Branch',
				name: 'source',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['mergeRequest'], operation: ['create'] } },
				description: "Source branch name, e.g. 'feature/api'",
				default: '',
			},
			{
				displayName: 'Target Branch',
				name: 'target',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['mergeRequest'], operation: ['create'] } },
				description: "Target branch name, e.g. 'main'",
				default: 'main',
			},
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['file'], operation: ['get', 'list', 'create', 'update', 'delete'] },
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
				displayName: 'Branch',
				name: 'fileBranch',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['file'], operation: ['create', 'update', 'delete'] } },
				description: 'Branch to commit to',
				default: 'main',
			},
			{
				displayName: 'Commit Message',
				name: 'commitMessage',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['file'], operation: ['create', 'update', 'delete'] } },
				description: 'Commit message for the change',
				default: '',
			},
			{
				displayName: 'Content',
				name: 'fileContent',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['file'], operation: ['create', 'update'] } },
				description: 'File content',
				default: '',
			},
			{
				displayName: 'Group ID',
				name: 'groupId',
				type: 'number',
				required: true,
				typeOptions: { minValue: 1 },
				displayOptions: {
					show: { resource: ['group'], operation: ['get', 'delete', 'getMembers'] },
				},
				description: 'Numeric ID of the group',
				default: 1,
			},
			{
				displayName: 'Group Name',
				name: 'groupName',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['group'], operation: ['create'] } },
				description: 'Name of the new group',
				default: '',
			},
			{
				displayName: 'Group Path',
				name: 'groupPath',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['group'], operation: ['create'] } },
				description: 'URL path of the new group',
				default: '',
			},
			{
				displayName: 'Parent ID',
				name: 'parentId',
				type: 'number',
				typeOptions: { minValue: 1 },
				displayOptions: { show: { resource: ['group'], operation: ['create'] } },
				description: 'Numeric ID of the parent group',
				default: 0,
			},
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'number',
				required: true,
				typeOptions: { minValue: 1 },
				displayOptions: { show: { resource: ['project'], operation: ['get'] } },
				description: 'Numeric ID of the project',
				default: 1,
			},
			{
				displayName: 'Search Term',
				name: 'searchTerm',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['project'], operation: ['search'] } },
				description: 'Term to search for',
				default: '',
			},
			{
				displayName: 'Project Name',
				name: 'projectName',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['project'], operation: ['create'] } },
				description: 'Name of the new project',
				default: '',
			},
			{
				displayName: 'Project Path',
				name: 'projectPath',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['project'], operation: ['create'] } },
				description: 'URL path of the new project',
				default: '',
			},
			{
				displayName: 'Namespace ID',
				name: 'namespaceId',
				type: 'number',
				typeOptions: { minValue: 1 },
				displayOptions: { show: { resource: ['project'], operation: ['create'] } },
				description: 'ID of the namespace for the new project',
				default: 0,
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['issue', 'mergeRequest'], operation: ['create', 'update'] },
				},
				description: "Title text, for instance 'Fix login bug'",
				default: '',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: { resource: ['issue', 'mergeRequest'], operation: ['create', 'update'] },
				},
				description: "Detailed description, like 'Steps to reproduce the bug'",
				default: '',
			},
			{
				displayName: 'Issue IID',
				name: 'issueIid',
				type: 'number',
				required: true,
				typeOptions: { minValue: 1 },
				displayOptions: {
					show: { resource: ['issue'], operation: ['get', 'update', 'close', 'reopen'] },
				},
				description: 'Issue number to fetch (must be positive)',
				default: 1,
			},
			{
				displayName: 'Labels',
				name: 'issueLabels',
				type: 'string',
				displayOptions: { show: { resource: ['issue'], operation: ['create', 'update'] } },
				description: 'Comma-separated label names to apply',
				default: '',
			},
			{
				displayName: 'State',
				name: 'issueState',
				type: 'options',
				displayOptions: { show: { resource: ['issue'], operation: ['update'] } },
				options: [
					{ name: 'Open', value: 'reopen' },
					{ name: 'Close', value: 'close' },
				],
				description: 'Desired issue state',
				default: 'reopen',
			},
			{
				displayName: 'Merge Request IID',
				name: 'mergeRequestIid',
				type: 'number',
				required: true,
				typeOptions: { minValue: 1 },
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: [
							'createNote',
							'deleteDiscussion',
							'deleteNote',
							'get',
							'getChanges',
							'getDiscussion',
							'getDiscussions',
							'getNote',
							'labels',
							'postDiscussionNote',
							'resolveDiscussion',
							'updateDiscussion',
							'updateNote',
							'updateDiscussionNote',
						],
					},
				},
				description: 'The merge request IID (must be positive)',
				default: 1,
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['labels'],
					},
				},
				description: 'Comma-separated label names to apply',
				default: '',
			},
			{
				displayName: 'Action',
				name: 'labelAction',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['labels'],
					},
				},
				options: [
					{ name: 'Add', value: 'add' },
					{ name: 'Remove', value: 'remove' },
				],
				default: 'add',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['createNote', 'postDiscussionNote', 'updateNote', 'updateDiscussionNote'],
					},
				},
				description: "Note text, e.g. 'Looks good to me'",
				default: '',
			},
			{
				displayName: 'Start New Discussion',
				name: 'startDiscussion',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Whether to start a new discussion instead of replying to an existing one',
				default: false,
			},
			{
				displayName: 'Discussion ID',
				name: 'discussionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: [
							'deleteDiscussion',
							'deleteDiscussionNote',
							'getDiscussion',
							'postDiscussionNote',
							'resolveDiscussion',
							'updateDiscussion',
							'updateDiscussionNote',
						],
					},
					hide: {
						startDiscussion: [true],
					},
				},
				description: "Discussion ID to reply to or fetch, e.g. '123abc'",
				default: '',
			},
			{
				displayName: 'Resolved',
				name: 'resolved',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['resolveDiscussion', 'updateDiscussion', 'updateDiscussionNote'],
					},
				},
				options: [
					{ name: 'Do Not Change', value: 'none' },
					{ name: 'Resolve', value: 'true' },
					{ name: 'Unresolve', value: 'false' },
				],
				description: 'Whether the discussion should be resolved',
				default: 'none',
			},
			{
				displayName: 'Note ID',
				name: 'noteId',
				type: 'number',
				required: true,
				typeOptions: { minValue: 1 },
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: [
							'deleteNote',
							'getNote',
							'updateNote',
							'updateDiscussionNote',
							'deleteDiscussionNote',
						],
					},
				},
				description: 'Existing note ID (must be positive)',
				default: 1,
			},
			{
				displayName: 'Position Type',
				name: 'positionType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
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
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Path to the new file',
				default: '',
			},
			{
				displayName: 'Old Path',
				name: 'oldPath',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Path to the old file',
				default: '',
			},
			{
				displayName: 'New Line',
				name: 'newLine',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Line number in the new file',
				default: null,
			},
			{
				displayName: 'Old Line',
				name: 'oldLine',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Line number in the old file',
				default: null,
			},
			{
				displayName: 'Line Range Start Line Code',
				name: 'lineRangeStartLineCode',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Line code for the start of a multiline note',
				default: '',
			},
			{
				displayName: 'Line Range Start Type',
				name: 'lineRangeStartType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				options: [
					{ name: 'New', value: 'new' },
					{ name: 'Old', value: 'old' },
				],
				description: 'Use `new` for lines added by this commit, otherwise `old`',
				default: 'new',
			},
			{
				displayName: 'Line Range Start Old Line',
				name: 'lineRangeStartOldLine',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Old line number of the start line',
				default: null,
			},
			{
				displayName: 'Line Range Start New Line',
				name: 'lineRangeStartNewLine',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'New line number of the start line',
				default: null,
			},
			{
				displayName: 'Line Range End Line Code',
				name: 'lineRangeEndLineCode',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Line code for the end of a multiline note',
				default: '',
			},
			{
				displayName: 'Line Range End Type',
				name: 'lineRangeEndType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				options: [
					{ name: 'New', value: 'new' },
					{ name: 'Old', value: 'old' },
				],
				description: 'Use `new` for lines added by this commit, otherwise `old`',
				default: 'new',
			},
			{
				displayName: 'Line Range End Old Line',
				name: 'lineRangeEndOldLine',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Old line number of the end line',
				default: null,
			},
			{
				displayName: 'Line Range End New Line',
				name: 'lineRangeEndNewLine',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'New line number of the end line',
				default: null,
			},
			{
				displayName: 'Base SHA',
				name: 'baseSha',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Base commit SHA',
				default: '',
			},
			{
				displayName: 'Head SHA',
				name: 'headSha',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Head commit SHA',
				default: '',
			},
			{
				displayName: 'Start SHA',
				name: 'startSha',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Start commit SHA',
				default: '',
			},
			{
				displayName: 'Commit ID',
				name: 'commitId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'SHA referencing commit to start this thread on',
				default: '',
			},
			{
				displayName: 'Created At',
				name: 'createdAt',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['mergeRequest'],
						operation: ['postDiscussionNote'],
					},
				},
				description: 'Date time string in ISO 8601 format',
				default: '',
			},
			{
				displayName: 'Merge Commit Message',
				name: 'mergeCommitMessage',
				type: 'string',
				displayOptions: { show: { resource: ['mergeRequest'], operation: ['merge'] } },
				description: 'Optional commit message used when merging',
				default: '',
			},
			{
				displayName: 'Merge Strategy',
				name: 'mergeStrategy',
				type: 'options',
				displayOptions: { show: { resource: ['mergeRequest'], operation: ['merge'] } },
				options: [
					{ name: 'Merge', value: 'merge' },
					{ name: 'Squash', value: 'squash' },
				],
				description: 'How to merge the changes',
				default: 'merge',
			},
			{
				displayName: 'Skip CI',
				name: 'skipCi',
				type: 'boolean',
				displayOptions: { show: { resource: ['mergeRequest'], operation: ['rebase'] } },
				description: 'Whether to skip CI when rebasing',
				default: false,
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
				name: 'endpoint',
				type: 'string',
				displayOptions: { show: { resource: ['raw'], operation: ['request'] } },
				description: "Endpoint path like '/projects/1/issues'",
				default: '/',
				required: true,
			},
			{
				displayName: 'Content',
				name: 'content',
				type: 'json',
				displayOptions: {
					show: { resource: ['raw'], operation: ['request'], httpMethod: ['POST', 'PUT', 'PATCH'] },
				},
				description: 'Request body payload, for example \'{"title":"New Issue"}\'',
				default: '',
			},
			{
				displayName: 'Query Parameters',
				name: 'queryParameters',
				type: 'json',
				displayOptions: { show: { resource: ['raw'], operation: ['request'] } },
				description: 'Query parameters as JSON, e.g. \'{"state":"opened"}\'',
				default: '',
			},
		],
	};

	constructor() {
		this.description.properties.forEach((property) => {
			const prop: any = property as any;
			const required = prop.required === true;
			const defaultValue = prop.default;
			const hasDefault = defaultValue !== undefined && defaultValue !== '' && defaultValue !== null;
			let desc = prop.description as string | undefined;
			desc = desc ?? '';

			if (!required) {
				desc += desc ? ' (Optional' : 'Optional';
				if (hasDefault) desc += `, default: ${defaultValue}`;
				desc += ')';
			} else if (hasDefault) {
				desc += (desc ? ' ' : '') + `Default: ${defaultValue}`;
			}

			prop.description = desc;
		});
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);
		const resource = this.getNodeParameter('resource', 0);
		const authCheck = await resolveCredential.call(this, 0);
		assertValidProjectCredentials.call(this, authCheck);

		for (let i = 0; i < items.length; i++) {
			const credential = await resolveCredential.call(this, i);
			assertValidProjectCredentials.call(this, credential);
			const base = buildProjectBase(credential);

			let requestMethod: IHttpRequestMethods = 'GET';
			let endpoint = '';
			let body: IDataObject = {};
			let qs: IDataObject = {};
			let returnAll = false;

			if (resource === 'branch') {
				const executionData = await handleBranch.call(this, i);
				returnData.push(...executionData);
				continue;
			} else if (resource === 'pipeline') {
				const executionData = await handlePipeline.call(this, i);
				returnData.push(...executionData);
				continue;
			} else if (resource === 'tag') {
				if (operation === 'create') {
					requestMethod = 'POST';
					body.tag_name = this.getNodeParameter('tagName', i);
					body.ref = this.getNodeParameter('ref', i);
					const message = this.getNodeParameter('message', i, '');
					if (message) body.message = message;
					endpoint = `${base}/repository/tags`;
				} else if (operation === 'get') {
					requestMethod = 'GET';
					const tag = this.getNodeParameter('tagName', i) as string;
					endpoint = `${base}/repository/tags/${encodeURIComponent(tag)}`;
				} else if (operation === 'getAll') {
					requestMethod = 'GET';
					returnAll = this.getNodeParameter('returnAll', i);
					if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
					endpoint = `${base}/repository/tags`;
				} else if (operation === 'delete') {
					requestMethod = 'DELETE';
					const tag = this.getNodeParameter('tagName', i) as string;
					endpoint = `${base}/repository/tags/${encodeURIComponent(tag)}`;
				}
			} else if (resource === 'release') {
				if (operation === 'create') {
					requestMethod = 'POST';
					body.tag_name = this.getNodeParameter('tagName', i) as string;
					if (!body.tag_name) {
						throw new NodeOperationError(this.getNode(), 'tagName must not be empty', {
							itemIndex: i,
						});
					}
					body.name = this.getNodeParameter('name', i);
					addOptionalStringParam.call(this, body, 'releaseDescription', 'description', i);
					const assets = this.getNodeParameter('assets', i, '');
					if (assets) {
						try {
							body.assets = JSON.parse(assets as string);
						} catch (error) {
							throw new NodeOperationError(this.getNode(), "Invalid JSON in 'assets' parameter", {
								itemIndex: i,
							});
						}
					}
					endpoint = `${base}/releases`;
				} else if (operation === 'update') {
					requestMethod = 'PUT';
					const tag = this.getNodeParameter('tagName', i) as string;
					body.name = this.getNodeParameter('name', i);
					addOptionalStringParam.call(this, body, 'releaseDescription', 'description', i);
					const assets = this.getNodeParameter('assets', i, '');
					if (assets) {
						try {
							body.assets = JSON.parse(assets as string);
						} catch (error) {
							throw new NodeOperationError(this.getNode(), "Invalid JSON in 'assets' parameter", {
								itemIndex: i,
							});
						}
					}
					endpoint = `${base}/releases/${encodeURIComponent(tag)}`;
				} else if (operation === 'get') {
					requestMethod = 'GET';
					const tag = this.getNodeParameter('tagName', i) as string;
					endpoint = `${base}/releases/${encodeURIComponent(tag)}`;
				} else if (operation === 'getAll') {
					requestMethod = 'GET';
					returnAll = this.getNodeParameter('returnAll', i);
					if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
					endpoint = `${base}/releases`;
				} else if (operation === 'delete') {
					requestMethod = 'DELETE';
					const tag = this.getNodeParameter('tagName', i) as string;
					endpoint = `${base}/releases/${encodeURIComponent(tag)}`;
				}
			} else if (resource === 'group') {
				if (operation === 'create') {
					requestMethod = 'POST';
					body.name = this.getNodeParameter('groupName', i);
					body.path = this.getNodeParameter('groupPath', i);
					const parent = this.getNodeParameter('parentId', i, 0) as number;
					if (parent) body.parent_id = parent;
					endpoint = `/groups`;
				} else if (operation === 'get') {
					requestMethod = 'GET';
					const id = this.getNodeParameter('groupId', i) as number;
					requirePositive.call(this, id, 'groupId', i);
					endpoint = `/groups/${id}`;
				} else if (operation === 'delete') {
					requestMethod = 'DELETE';
					const id = this.getNodeParameter('groupId', i) as number;
					requirePositive.call(this, id, 'groupId', i);
					endpoint = `/groups/${id}`;
				} else if (operation === 'getMembers') {
					requestMethod = 'GET';
					const id = this.getNodeParameter('groupId', i) as number;
					requirePositive.call(this, id, 'groupId', i);
					returnAll = this.getNodeParameter('returnAll', i);
					if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
					endpoint = `/groups/${id}/members`;
				}
			} else if (resource === 'project') {
				if (operation === 'create') {
					requestMethod = 'POST';
					body.name = this.getNodeParameter('projectName', i);
					body.path = this.getNodeParameter('projectPath', i);
					const ns = this.getNodeParameter('namespaceId', i, 0) as number;
					if (ns) body.namespace_id = ns;
					endpoint = '/projects';
				} else if (operation === 'get') {
					requestMethod = 'GET';
					const id = this.getNodeParameter('projectId', i) as number;
					requirePositive.call(this, id, 'projectId', i);
					endpoint = `/projects/${id}`;
				} else if (operation === 'getAll' || operation === 'search') {
					requestMethod = 'GET';
					returnAll = this.getNodeParameter('returnAll', i);
					if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
					if (operation === 'search') {
						qs.search = this.getNodeParameter('searchTerm', i);
					}
					endpoint = '/projects';
				}
			} else if (resource === 'file') {
				const executionData = await handleFile.call(this, i);
				returnData.push(...executionData);
				continue;
			} else if (resource === 'issue') {
				if (operation === 'create') {
					requestMethod = 'POST';
					body.title = this.getNodeParameter('title', i);
					addOptionalStringParam.call(this, body, 'description', 'description', i);
					const labels = this.getNodeParameter('issueLabels', i, '');
					if (labels) body.labels = labels;
					endpoint = `${base}/issues`;
				} else if (operation === 'get') {
					requestMethod = 'GET';
					const id = this.getNodeParameter('issueIid', i) as number;
					requirePositive.call(this, id, 'issueIid', i);
					endpoint = `${base}/issues/${id}`;
				} else if (operation === 'getAll') {
					requestMethod = 'GET';
					returnAll = this.getNodeParameter('returnAll', i);
					if (!returnAll) qs.per_page = this.getNodeParameter('limit', i);
					endpoint = `${base}/issues`;
				} else if (operation === 'update') {
					requestMethod = 'PUT';
					const id = this.getNodeParameter('issueIid', i) as number;
					requirePositive.call(this, id, 'issueIid', i);
					body.title = this.getNodeParameter('title', i);
					addOptionalStringParam.call(this, body, 'description', 'description', i);
					const labels = this.getNodeParameter('issueLabels', i, '');
					if (labels) body.labels = labels;
					if (Object.prototype.hasOwnProperty.call(this.getNode().parameters, 'issueState')) {
						body.state_event = this.getNodeParameter('issueState', i);
					}
					endpoint = `${base}/issues/${id}`;
				} else if (operation === 'close' || operation === 'reopen') {
					requestMethod = 'PUT';
					const id = this.getNodeParameter('issueIid', i) as number;
					requirePositive.call(this, id, 'issueIid', i);
					body.state_event = operation === 'close' ? 'close' : 'reopen';
					endpoint = `${base}/issues/${id}`;
				}
			} else if (resource === 'mergeRequest') {
				const executionData = await handleMergeRequest.call(this, i);
				returnData.push(...executionData);
				continue;
			} else if (resource === 'raw') {
				if (operation === 'request') {
					requestMethod = this.getNodeParameter('httpMethod', i) as IHttpRequestMethods;
					endpoint = this.getNodeParameter('endpoint', i) as string;
					body = this.getNodeParameter('content', i, {}) as IDataObject;
					qs = this.getNodeParameter('queryParameters', i, {}) as IDataObject;
				}
			} else {
				throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
					itemIndex: i,
				});
			}

			const response = returnAll
				? await gitlabApiRequestAllItems.call(this, requestMethod, endpoint, body, qs, i)
				: await gitlabApiRequest.call(this, requestMethod, endpoint, body, qs, {}, i);

			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(response as IDataObject),
				{ itemData: { item: i } },
			);
			returnData.push(...executionData);
		}

		return [returnData];
	}
}
