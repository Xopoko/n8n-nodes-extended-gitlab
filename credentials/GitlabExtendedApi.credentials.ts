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
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'Project owner',
			name: 'projectOwner',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Project name',
			name: 'projectName',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Project ID',
			name: 'projectId',
			type: 'number',
			default: 0,
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
			url: '/personal_access_tokens/self',
		},
	};
}
