import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';

import { getBaseUrl } from '../../credentials/StairoidsApi.credentials';

export class Stairoids implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Stairoids',
		name: 'stairoids',
		icon: 'file:stairoids-icon.png',
		group: ['transform'],
		version: 1,
		subtitle: 'Add Activity',
		description: 'Interact with Stairoids lead generation platform',
		defaults: {
			name: 'Stairoids',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'stairoidsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Display Name',
				name: 'displayName',
				type: 'string',
				required: true,
				default: '',
				description: 'The name of the activity (e.g., "Has raised a lot of funding")',
			},
			{
				displayName: 'LinkedIn URL',
				name: 'linkedInUrl',
				type: 'string',
				default: '',
				description: 'LinkedIn URL of the person or company (preferred). Provide this or Website URL to link the activity to a lead.',
			},
			{
				displayName: 'Website URL',
				name: 'websiteUrl',
				type: 'string',
				default: '',
				description: 'Website URL of the company. Used if LinkedIn URL is not provided.',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Score',
						name: 'score',
						type: 'number',
						default: 0,
						description: 'Points to assign for this activity (only used on first occurrence of this display name)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('stairoidsApi');
		const baseUrl = getBaseUrl(credentials as { apiUrl?: string });

		for (let i = 0; i < items.length; i++) {
			try {
				const displayName = this.getNodeParameter('displayName', i) as string;
				const linkedInUrl = this.getNodeParameter('linkedInUrl', i) as string;
				const websiteUrl = this.getNodeParameter('websiteUrl', i) as string;
				const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

				const body: IDataObject = {
					displayName,
				};

				if (linkedInUrl) {
					body.linkedInUrl = linkedInUrl;
				}
				if (websiteUrl) {
					body.websiteUrl = websiteUrl;
				}
				if (additionalFields.score) {
					body.score = additionalFields.score;
				}

				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'stairoidsApi',
					{
						method: 'POST',
						url: `${baseUrl}/integrations/webhook/n8n/actions/add_activity`,
						body,
						json: true,
					},
				);

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject),
					{ itemData: { item: i } }
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message }),
						{ itemData: { item: i } }
					);
					returnData.push(...executionData);
					continue;
				}
				throw new NodeApiError(this.getNode(), { message: (error as Error).message }, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
