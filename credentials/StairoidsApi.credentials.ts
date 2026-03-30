import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

const DEFAULT_URL = 'http://localhost:8080/api';
const CLIENT_ID = 'stairoids-integration';

export class StairoidsApi implements ICredentialType {
	name = 'stairoidsApi';
	displayName = 'Stairoids API';
	documentationUrl = 'https://docs.stairoids.com/integrations/n8n';
	extends = ['oAuth2Api'];


	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: DEFAULT_URL,
			description: 'The Stairoids API URL',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'hidden',
			default: CLIENT_ID,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'pkce',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: `={{ $self.apiUrl + '/oauth/authorize' }}`,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: `={{ $self.apiUrl + '/oauth/token' }}`,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'integrations',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}

/**
 * Helper function to get the base URL from credentials.
 */
export function getBaseUrl(credentials: { apiUrl?: string }): string {
	return credentials.apiUrl || DEFAULT_URL;
}
