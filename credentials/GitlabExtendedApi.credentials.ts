import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GitlabExtendedApi implements ICredentialType {
	name = 'gitlabExtendedApi';

	displayName = 'Gitlab Extended API';

	documentationUrl = 'gitlab';

	properties: INodeProperties[] = [
		{
			displayName: 'Gitlab Server',
			name: 'server',
			type: 'string',
			default: 'https://gitlab.com',
			description: 'Base URL of your GitLab instance, for example "https://gitlab.com"',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Personal access token with API permissions',
		},
		{
			displayName: 'Project owner',
			name: 'projectOwner',
			type: 'string',
			default: '',
			description: 'Namespace or owner of the project. Ignored if "Project ID" is set.',
		},
		{
			displayName: 'Project name',
			name: 'projectName',
			type: 'string',
			default: '',
			description: 'Project slug or name. Ignored if "Project ID" is set.',
		},
		{
			displayName: 'Project ID',
			name: 'projectId',
			type: 'number',
			default: 0,
			description: 'Numeric project ID. Takes precedence over owner and name if provided.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Private-Token': '={{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.server.replace(new RegExp("/$"), "") + "/api/v4" }}',
			url: '/user',
		},
	};
}
