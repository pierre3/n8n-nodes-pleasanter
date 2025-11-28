import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PleasanterApi implements ICredentialType {
	name = 'pleasanterApi';
	displayName = 'Pleasanter API';
	documentationUrl = 'https://pleasanter.org/manual/api';
	icon = 'file:../nodes/pleasanter/pleasanter.svg' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://pleasanter.net',
			placeholder: 'https://your-pleasanter-server.com',
			description: 'The base URL of your Pleasanter server (without /api path)',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];

	// APIキーはリクエストボディに含めるため、authenticateは使用しない
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/items/0/get',
			method: 'POST',
			body: {
				ApiVersion: '1.1',
				ApiKey: '={{$credentials.apiKey}}',
			},
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};
}
