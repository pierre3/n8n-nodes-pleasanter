import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestMethods,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

async function makeApiRequest(
	context: IExecuteFunctions,
	baseUrl: string,
	endpoint: string,
	method: IHttpRequestMethods,
	body: IDataObject,
): Promise<IDataObject> {
	const options = {
		method,
		body,
		uri: `${baseUrl.replace(/\/$/, '')}${endpoint}`,
		json: true,
	};

	try {
		const response = await context.helpers.request(options);
		return response as IDataObject;
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject);
	}
}

function addFieldsToBody(body: IDataObject, fields: IDataObject): void {
	// Simple fields
	const simpleFields = [
		'Title', 'Body', 'StartTime', 'CompletionTime',
		'WorkValue', 'ProgressRate', 'Status', 'Manager', 'Owner', 'Locked', 'Comments'
	];

	for (const field of simpleFields) {
		if (fields[field] !== undefined && fields[field] !== '') {
			body[field] = fields[field];
		}
	}

	// JSON fields
	const jsonFields = ['ClassHash', 'NumHash', 'DateHash', 'DescriptionHash', 'CheckHash'];

	for (const field of jsonFields) {
		if (fields[field]) {
			try {
				const parsed = typeof fields[field] === 'string'
					? JSON.parse(fields[field] as string)
					: fields[field];
				if (Object.keys(parsed as object).length > 0) {
					body[field] = parsed;
				}
			} catch {
				// ignore parse error
			}
		}
	}
}

export class Pleasanter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pleasanter',
		name: 'pleasanter',
		icon: 'file:pleasanter.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Pleasanter API',
		defaults: {
			name: 'Pleasanter',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'pleasanterApi',
				required: true,
			},
		],
		properties: [
			// Resource
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Item',
						value: 'item',
					},
				],
				default: 'item',
			},
			// Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['item'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new record in the specified table',
						action: 'Create a record',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a record',
						action: 'Delete a record',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a single record or multiple records from a table',
						action: 'Get records',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a record',
						action: 'Update a record',
					},
				],
				default: 'get',
			},
			// Site ID / Record ID for Get operation
			{
				displayName: 'Site ID or Record ID',
				name: 'siteIdOrRecordId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['get'],
					},
				},
				description: 'The Site ID to get multiple records from a table, or Record ID to get a single record',
			},
			// Site ID for Create operation
			{
				displayName: 'Site ID',
				name: 'siteId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['create'],
					},
				},
				description: 'The Site ID of the table to create a record in',
			},
			// Record ID for Update and Delete operations
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['update', 'delete'],
					},
				},
				description: 'The Record ID to update or delete',
			},
			// View Options for Get operation
			{
				displayName: 'View Options',
				name: 'viewOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['get'],
					},
				},
				options: [
					{
						displayName: 'API Column Key Display Type',
						name: 'ApiColumnKeyDisplayType',
						type: 'options',
						options: [
							{
								name: 'Label Text',
								value: 'LabelText',
							},
							{
								name: 'Column Name',
								value: 'ColumnName',
							},
						],
						default: 'ColumnName',
						description: 'How to display column keys',
					},
					{
						displayName: 'API Column Value Display Type',
						name: 'ApiColumnValueDisplayType',
						type: 'options',
						options: [
							{
								name: 'Display Value',
								value: 'DisplayValue',
							},
							{
								name: 'Value',
								value: 'Value',
							},
							{
								name: 'Text',
								value: 'Text',
							},
						],
						default: 'Value',
						description: 'How to display column values',
					},
					{
						displayName: 'API Data Type',
						name: 'ApiDataType',
						type: 'options',
						options: [
							{
								name: 'Default',
								value: 'Default',
							},
							{
								name: 'Key Values',
								value: 'KeyValues',
							},
						],
						default: 'Default',
						description: 'The format of the response data',
					},
					{
						displayName: 'Column Filter (JSON)',
						name: 'ColumnFilterHash',
						type: 'json',
						default: '{}',
						description: 'Column filter as JSON object. Example: {"ClassA": "value1", "NumA": 100}.',
					},
					{
						displayName: 'Column Sorter (JSON)',
						name: 'ColumnSorterHash',
						type: 'json',
						default: '{}',
						description: 'Column sorter as JSON object. Example: {"ClassA": "asc", "NumA": "desc"}.',
					},
					{
						displayName: 'Delay',
						name: 'Delay',
						type: 'boolean',
						default: false,
						description: 'Whether to filter delayed items',
					},
					{
						displayName: 'Incomplete',
						name: 'Incomplete',
						type: 'boolean',
						default: false,
						description: 'Whether to filter incomplete items',
					},
					{
						displayName: 'Near Competition Time',
						name: 'NearCompetitionTime',
						type: 'boolean',
						default: false,
						description: 'Whether to filter items near competition time',
					},
					{
						displayName: 'Overdue',
						name: 'Overdue',
						type: 'boolean',
						default: false,
						description: 'Whether to filter overdue items',
					},
					{
						displayName: 'Own',
						name: 'Own',
						type: 'boolean',
						default: false,
						description: 'Whether to filter own items',
					},
					{
						displayName: 'Search',
						name: 'Search',
						type: 'string',
						default: '',
						description: 'Search keyword',
					},
				],
			},
			// Record Fields for Create and Update
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Body',
						name: 'Body',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Record body',
					},
					{
						displayName: 'Check Hash (JSON)',
						name: 'CheckHash',
						type: 'json',
						default: '{}',
						description: 'Check fields as JSON. Example: {"CheckA": true, "CheckB": false}.',
					},
					{
						displayName: 'Class Hash (JSON)',
						name: 'ClassHash',
						type: 'json',
						default: '{}',
						description: 'Class fields as JSON. Example: {"ClassA": "value1", "ClassB": "value2"}.',
					},
					{
						displayName: 'Comments',
						name: 'Comments',
						type: 'string',
						default: '',
						description: 'Comments to add',
					},
					{
						displayName: 'Completion Time',
						name: 'CompletionTime',
						type: 'dateTime',
						default: '',
					},
					{
						displayName: 'Date Hash (JSON)',
						name: 'DateHash',
						type: 'json',
						default: '{}',
						description: 'Date fields as JSON. Example: {"DateA": "2024-01-01", "DateB": "2024-12-31"}.',
					},
					{
						displayName: 'Description Hash (JSON)',
						name: 'DescriptionHash',
						type: 'json',
						default: '{}',
						description: 'Description fields as JSON. Example: {"DescriptionA": "text1", "DescriptionB": "text2"}.',
					},
					{
						displayName: 'Locked',
						name: 'Locked',
						type: 'boolean',
						default: false,
						description: 'Whether the record is locked',
					},
					{
						displayName: 'Manager',
						name: 'Manager',
						type: 'number',
						default: 0,
						description: 'Manager user ID',
					},
					{
						displayName: 'Num Hash (JSON)',
						name: 'NumHash',
						type: 'json',
						default: '{}',
						description: 'Number fields as JSON. Example: {"NumA": 100, "NumB": 200}.',
					},
					{
						displayName: 'Owner',
						name: 'Owner',
						type: 'number',
						default: 0,
						description: 'Owner user ID',
					},
					{
						displayName: 'Progress Rate',
						name: 'ProgressRate',
						type: 'number',
						default: 0,
						description: 'Progress rate (0-100)',
					},
					{
						displayName: 'Start Time',
						name: 'StartTime',
						type: 'dateTime',
						default: '',
					},
					{
						displayName: 'Status',
						name: 'Status',
						type: 'number',
						default: 100,
						description: 'Status code',
					},
					{
						displayName: 'Title',
						name: 'Title',
						type: 'string',
						default: '',
						description: 'Record title',
					},
					{
						displayName: 'Work Value',
						name: 'WorkValue',
						type: 'number',
						default: 0,
					},
				],
			},
			// API Version
			{
				displayName: 'API Version',
				name: 'apiVersion',
				type: 'options',
				options: [
					{
						name: '1.1',
						value: '1.1',
					},
					{
						name: '1.0',
						value: '1.0',
					},
				],
				default: '1.1',
				description: 'Pleasanter API version',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('pleasanterApi');
		const baseUrl = credentials.baseUrl as string;
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const apiVersion = this.getNodeParameter('apiVersion', i) as string;

				let responseData: IDataObject;

				if (resource === 'item') {
					if (operation === 'get') {
						const siteIdOrRecordId = this.getNodeParameter('siteIdOrRecordId', i) as number;
						const viewOptions = this.getNodeParameter('viewOptions', i, {}) as IDataObject;

						const view: IDataObject = {};

						// Boolean options
						const booleanOptions = ['Incomplete', 'Own', 'NearCompetitionTime', 'Delay', 'Overdue'];
						for (const option of booleanOptions) {
							if (viewOptions[option] !== undefined) {
								view[option] = viewOptions[option];
							}
						}

						// String options
						if (viewOptions.Search) {
							view.Search = viewOptions.Search;
						}

						// Select options
						const selectOptions = ['ApiDataType', 'ApiColumnKeyDisplayType', 'ApiColumnValueDisplayType'];
						for (const option of selectOptions) {
							if (viewOptions[option]) {
								view[option] = viewOptions[option];
							}
						}

						// JSON options
						if (viewOptions.ColumnFilterHash) {
							try {
								view.ColumnFilterHash = typeof viewOptions.ColumnFilterHash === 'string'
									? JSON.parse(viewOptions.ColumnFilterHash)
									: viewOptions.ColumnFilterHash;
							} catch {
								// ignore parse error
							}
						}

						if (viewOptions.ColumnSorterHash) {
							try {
								view.ColumnSorterHash = typeof viewOptions.ColumnSorterHash === 'string'
									? JSON.parse(viewOptions.ColumnSorterHash)
									: viewOptions.ColumnSorterHash;
							} catch {
								// ignore parse error
							}
						}

						const body: IDataObject = {
							ApiVersion: apiVersion,
							ApiKey: apiKey,
						};

						if (Object.keys(view).length > 0) {
							body.View = view;
						}

						responseData = await makeApiRequest(
							this,
							baseUrl,
							`/api/items/${siteIdOrRecordId}/get`,
							'POST',
							body,
						);

						// データを配列として返す
						const response = responseData.Response as IDataObject;
						if (response && Array.isArray(response.Data)) {
							for (const item of response.Data as IDataObject[]) {
								returnData.push({
									json: item,
									pairedItem: { item: i },
								});
							}
						} else {
							returnData.push({
								json: responseData,
								pairedItem: { item: i },
							});
						}
						continue;

					} else if (operation === 'create') {
						const siteId = this.getNodeParameter('siteId', i) as number;
						const fields = this.getNodeParameter('fields', i, {}) as IDataObject;

						const body: IDataObject = {
							ApiVersion: apiVersion,
							ApiKey: apiKey,
						};

						// Add fields to body
						addFieldsToBody(body, fields);

						responseData = await makeApiRequest(
							this,
							baseUrl,
							`/api/items/${siteId}/create`,
							'POST',
							body,
						);

					} else if (operation === 'update') {
						const recordId = this.getNodeParameter('recordId', i) as number;
						const fields = this.getNodeParameter('fields', i, {}) as IDataObject;

						const body: IDataObject = {
							ApiVersion: apiVersion,
							ApiKey: apiKey,
						};

						// Add fields to body
						addFieldsToBody(body, fields);

						responseData = await makeApiRequest(
							this,
							baseUrl,
							`/api/items/${recordId}/update`,
							'POST',
							body,
						);

					} else if (operation === 'delete') {
						const recordId = this.getNodeParameter('recordId', i) as number;

						const body: IDataObject = {
							ApiVersion: apiVersion,
							ApiKey: apiKey,
						};

						responseData = await makeApiRequest(
							this,
							baseUrl,
							`/api/items/${recordId}/delete`,
							'POST',
							body,
						);

					} else {
						throw new NodeApiError(this.getNode(), { message: `Unknown operation: ${operation}` });
					}

					returnData.push({
						json: responseData,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
