import {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeApiError,
} from 'n8n-workflow';

import { getBaseUrl } from '../../credentials/StairoidsApi.credentials';

export class StairoidsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Stairoids Trigger',
		name: 'stairoidsTrigger',
		icon: 'file:stairoids-icon.png',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Triggers when events occur in Stairoids',
		defaults: {
			name: 'Stairoids Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'stairoidsApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'funnel_change',
				options: [
					{
						name: 'Funnel Change',
						value: 'funnel_change',
						description: 'Triggers when a company\'s funnel state changed',
					},
					{
						name: 'Score Change',
						value: 'score_change',
						description: 'Triggers when a company\'s lead score changes',
					},
					{
						name: 'ICP Change',
						value: 'icp_change',
						description: 'Triggers when a company\'s ICP assignment changes',
					},
					{
						name: 'New Activity',
						value: 'new_activity',
						description: 'Triggers when a company has new engagement activities',
					},
				],
				description: 'The event to listen for',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;
				const credentials = await this.getCredentials('stairoidsApi');
				const baseUrl = getBaseUrl(credentials as { apiUrl?: string });

				// Check if we have a stored subscription
				if (webhookData.webhookId !== undefined) {
					try {
						// Verify the webhook still exists in Stairoids
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'stairoidsApi',
							{
								method: 'GET',
								url: `${baseUrl}/integrations/webhook/n8n/hooks/${webhookData.webhookId}`,
								json: true,
							},
						);

						if (response && response.id && response.webhookUrl === webhookUrl) {
							return true;
						}
					} catch (error) {
						// Webhook doesn't exist anymore, will be recreated
						delete webhookData.webhookId;
					}
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;
				const credentials = await this.getCredentials('stairoidsApi');
				const baseUrl = getBaseUrl(credentials as { apiUrl?: string });

				const body: IDataObject = {
					webhookUrl,
					event,
				};

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'stairoidsApi',
						{
							method: 'POST',
							url: `${baseUrl}/integrations/webhook/n8n/hooks/${event}/subscribe`,
							body,
							json: true,
						},
					);

					if (response.id === undefined) {
						throw new NodeApiError(this.getNode(), { message: 'Stairoids did not return a webhook ID' });
					}

					webhookData.webhookId = response.id;
					return true;
				} catch (error) {
					throw new NodeApiError(this.getNode(), { message: (error as Error).message || 'Failed to create Stairoids webhook subscription' });
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const credentials = await this.getCredentials('stairoidsApi');
				const baseUrl = getBaseUrl(credentials as { apiUrl?: string });

				if (webhookData.webhookId !== undefined) {
					try {
						await this.helpers.httpRequestWithAuthentication.call(
							this,
							'stairoidsApi',
							{
								method: 'DELETE',
								url: `${baseUrl}/integrations/webhook/n8n/hooks/${webhookData.webhookId}`,
								json: true,
							},
						);
					} catch {
						// Ignore errors on deletion - webhook may already be gone
					}

					delete webhookData.webhookId;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();

		// Validate the incoming webhook (optional: add signature verification)
		if (!body || Object.keys(body).length === 0) {
			return {
				workflowData: [
					this.helpers.returnJsonArray({ error: 'Empty webhook payload received' }),
				],
			};
		}

		// Return the webhook data
		return {
			workflowData: [this.helpers.returnJsonArray(body as IDataObject)],
		};
	}
}
