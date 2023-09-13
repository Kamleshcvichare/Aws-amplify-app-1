// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
	DocumentNode,
	OperationDefinitionNode,
	print,
	parse,
	GraphQLError,
	OperationTypeNode,
} from 'graphql';
import Observable from 'zen-observable-ts';
import { Amplify, fetchAuthSession } from '@aws-amplify/core';
import {
	CustomUserAgentDetails,
	ConsoleLogger as Logger,
	getAmplifyUserAgent,
} from '@aws-amplify/core/internals/utils';
import { Cache } from '@aws-amplify/core';
import {
	GraphQLAuthError,
	GraphQLResult,
	GraphQLOperation,
	GraphQLOptionsV6,
} from '../types';
import { post } from '@aws-amplify/api-rest';
import { AWSAppSyncRealTimeProvider } from '../Providers/AWSAppSyncRealTimeProvider';

const USER_AGENT_HEADER = 'x-amz-user-agent';

const logger = new Logger('GraphQLAPI');

export const graphqlOperation = (
	query,
	variables = {},
	authToken?: string
) => ({
	query,
	variables,
	authToken,
});

/**
 * Export Cloud Logic APIs
 */
export class InternalGraphQLAPIClass {
	/**
	 * @private
	 */
	private _options;
	private appSyncRealTime: AWSAppSyncRealTimeProvider | null;

	Cache = Cache;

	/**
	 * Initialize GraphQL API with AWS configuration
	 * @param {Object} options - Configuration object for API
	 */
	constructor(options) {
		this._options = options;
		logger.debug('API Options', this._options);
	}

	public getModuleName() {
		return 'InternalGraphQLAPI';
	}

	private async _headerBasedAuth(
		defaultAuthenticationType?,
		additionalHeaders: { [key: string]: string } = {},
		customUserAgentDetails?: CustomUserAgentDetails
	) {
		const config = Amplify.getConfig();
		const {
			region: region,
			endpoint: appSyncGraphqlEndpoint,
			defaultAuthMode: authenticationType,
			// TODO V6: needed?
			// graphql_headers = () => ({}),
			// TODO V6: verify only for custom domains
			// graphql_endpoint: customGraphqlEndpoint,
			// TODO V6: verify only for custom domains
			// graphql_endpoint_iam_region: customEndpointRegion,
		} = config.API.AppSync;

		let headers = {};

		switch (authenticationType.type) {
			case 'apiKey':
				if (!authenticationType.apiKey) {
					throw new Error(GraphQLAuthError.NO_API_KEY);
				}
				headers = {
					'X-Api-Key': authenticationType.apiKey,
				};
				break;
			case 'iam':
				const session = await fetchAuthSession();
				if (session.credentials === undefined) {
					// TODO V6: (error not thrown to assist debugging)
					// throw new Error(GraphQLAuthError.NO_CREDENTIALS);
					console.warn(GraphQLAuthError.NO_CREDENTIALS);
				}
				break;
			case 'jwt':
				try {
					let token;

					token = (await fetchAuthSession()).tokens?.accessToken.toString();

					if (!token) {
						throw new Error(GraphQLAuthError.NO_FEDERATED_JWT);
					}
					headers = {
						Authorization: token,
					};
				} catch (e) {
					throw new Error(GraphQLAuthError.NO_CURRENT_USER);
				}
				break;
			case 'custom':
				if (!additionalHeaders.Authorization) {
					throw new Error(GraphQLAuthError.NO_AUTH_TOKEN);
				}
				headers = {
					Authorization: additionalHeaders.Authorization,
				};
				break;
			default:
				headers = {
					Authorization: null,
				};
				break;
		}

		return headers;
	}

	/**
	 * to get the operation type
	 * @param operation
	 */
	getGraphqlOperationType(operation: GraphQLOperation): OperationTypeNode {
		const doc = parse(operation);
		const definitions =
			doc.definitions as ReadonlyArray<OperationDefinitionNode>;
		const [{ operation: operationType }] = definitions;

		return operationType;
	}

	/**
	 * Executes a GraphQL operation
	 *
	 * @param options - GraphQL Options
	 * @param [additionalHeaders] - headers to merge in after any `graphql_headers` set in the config
	 * @returns An Observable if the query is a subscription query, else a promise of the graphql result.
	 */
	graphql<T = any>(
		{
			query: paramQuery,
			variables = {},
			authMode,
			authToken,
		}: GraphQLOptionsV6,
		additionalHeaders?: { [key: string]: string },
		customUserAgentDetails?: CustomUserAgentDetails
	): Observable<GraphQLResult<T>> | Promise<GraphQLResult<T>> {
		const query =
			typeof paramQuery === 'string'
				? parse(paramQuery)
				: parse(print(paramQuery));

		const [operationDef = {}] = query.definitions.filter(
			def => def.kind === 'OperationDefinition'
		);
		const { operation: operationType } =
			operationDef as OperationDefinitionNode;

		const headers = additionalHeaders || {};

		// if an authorization header is set, have the explicit authToken take precedence
		if (authToken) {
			headers.Authorization = authToken;
		}

		switch (operationType) {
			case 'query':
			case 'mutation':
				const responsePromise = this._graphql<T>(
					{ query, variables, authMode },
					headers,
					// initParams,
					customUserAgentDetails
				);

				return responsePromise;
			case 'subscription':
				return this._graphqlSubscribe(
					{ query, variables, authMode },
					headers,
					customUserAgentDetails
				);
			default:
				throw new Error(`invalid operation type: ${operationType}`);
		}
	}

	private async _graphql<T = any>(
		{ query, variables, authMode }: GraphQLOptionsV6,
		additionalHeaders = {},
		initParams = {},
		customUserAgentDetails?: CustomUserAgentDetails
	): Promise<GraphQLResult<T>> {
		const config = Amplify.getConfig();

		const {
			region: region,
			endpoint: appSyncGraphqlEndpoint,
			// TODO V6: not needed for Studio:
			// graphql_headers = () => ({}),
			// TODO: V6
			// graphql_endpoint: customGraphqlEndpoint,
			// TODO V6:
			// graphql_endpoint_iam_region: customEndpointRegion,
		} = config.API.AppSync;

		// TODO V6: temporary workaround unti we support custom endpoints
		const customGraphqlEndpoint = null;
		const customEndpointRegion = null;

		const headers = {
			...(!customGraphqlEndpoint &&
				(await this._headerBasedAuth(
					authMode,
					additionalHeaders,
					customUserAgentDetails
				))),
			...(customGraphqlEndpoint &&
				(customEndpointRegion
					? await this._headerBasedAuth(
							authMode,
							additionalHeaders,
							customUserAgentDetails
					  )
					: { Authorization: null })),
			// TODO V6:
			// ...(await graphql_headers({ query, variables })),
			...additionalHeaders,
			...(!customGraphqlEndpoint && {
				[USER_AGENT_HEADER]: getAmplifyUserAgent(customUserAgentDetails),
			}),
		};

		const body = {
			query: print(query as DocumentNode),
			variables,
		};

		// No longer used after Francisco's changes.
		// TODO V6: Do we still need the `signerServiceInfo`?
		// const init = Object.assign(
		// 	{
		// 		headers,
		// 		body,
		// 		signerServiceInfo: {
		// 			service: !customGraphqlEndpoint ? 'appsync' : 'execute-api',
		// 			region: !customGraphqlEndpoint ? region : customEndpointRegion,
		// 		},
		// 	},
		// 	initParams
		// );

		const endpoint = customGraphqlEndpoint || appSyncGraphqlEndpoint;

		if (!endpoint) {
			const error = new GraphQLError('No graphql endpoint provided.');

			throw {
				data: {},
				errors: [error],
			};
		}

		let response;
		try {
			response = await post(endpoint, {
				headers,
				body,
				region,
				serviceName: 'appsync',
			});
		} catch (err) {
			// If the exception is because user intentionally
			// cancelled the request, do not modify the exception
			// so that clients can identify the exception correctly.
			// TODO V6
			// if (this._api.isCancel(err)) {
			// 	throw err;
			// }
			response = {
				data: {},
				errors: [new GraphQLError(err.message, null, null, null, null, err)],
			};
		}

		const { errors } = response;

		if (errors && errors.length) {
			throw response;
		}

		return response;
	}

	// async createInstanceIfNotCreated() {
	// 	if (!this._api) {
	// 		await this.createInstance();
	// 	}
	// }

	/**
	 * Checks to see if an error thrown is from an api request cancellation
	 * @param {any} error - Any error
	 * @return {boolean} - A boolean indicating if the error was from an api request cancellation
	 */
	// TODO V6
	// isCancel(error) {
	// 	return this._api.isCancel(error);
	// }

	/**
	 * Cancels an inflight request. Only applicable for graphql queries and mutations
	 * @param {any} request - request to cancel
	 * @return {boolean} - A boolean indicating if the request was cancelled
	 */
	// TODO V6
	// cancel(request: Promise<any>, message?: string) {
	// 	return this._api.cancel(request, message);
	// }

	/**
	 * Check if the request has a corresponding cancel token in the WeakMap.
	 * @params request - The request promise
	 * @return if the request has a corresponding cancel token.
	 */
	// TODO V6
	// hasCancelToken(request: Promise<any>) {
	// 	return this._api.hasCancelToken(request);
	// }

	private _graphqlSubscribe(
		{
			query,
			variables,
			authMode: defaultAuthenticationType,
			authToken,
		}: GraphQLOptionsV6,
		additionalHeaders = {},
		customUserAgentDetails?: CustomUserAgentDetails
	): Observable<any> {
		if (!this.appSyncRealTime) {
			const { AppSync } = Amplify.getConfig().API ?? {};

			this.appSyncRealTime = new AWSAppSyncRealTimeProvider();

			return this.appSyncRealTime.subscribe({
				query: print(query as DocumentNode),
				variables,
				appSyncGraphqlEndpoint: AppSync.endpoint,
				region: AppSync.region,
				authenticationType: AppSync.defaultAuthMode,
			});
		}
	}
	// if (InternalPubSub && typeof InternalPubSub.subscribe === 'function') {
	// 	return InternalPubSub.subscribe(
	// 		'',
	// 		{
	// 			provider: INTERNAL_AWS_APPSYNC_REALTIME_PUBSUB_PROVIDER,
	// 			appSyncGraphqlEndpoint,
	// 			authenticationType,
	// 			apiKey,
	// 			query: print(query as DocumentNode),
	// 			region,
	// 			variables,
	// 			graphql_headers,
	// 			additionalHeaders,
	// 			authToken,
	// 		},
	// 		customUserAgentDetails
	// 	);
	// } else {
	// 	logger.debug('No pubsub module applied for subscription');
	// 	throw new Error('No pubsub module applied for subscription');
	// }
}

/**
 * @private
 */
// async _ensureCredentials() {
// 	// return this.Credentials.get()
// 	return await fetchAuthSession()
// 		.then(credentials => {
// 			if (!credentials) return false;
// 			// TODO V6
// 			const cred = this.Credentials.shear(credentials);
// 			logger.debug('set credentials for api', cred);

// 			return true;
// 		})
// 		.catch(err => {
// 			logger.warn('ensure credentials error', err);
// 			return false;
// 		});
// }

export const InternalGraphQLAPI = new InternalGraphQLAPIClass(null);
// Amplify.register(InternalGraphQLAPI);
