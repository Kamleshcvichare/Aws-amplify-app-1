import { API, GraphQLResult, GRAPHQL_AUTH_MODE } from '@aws-amplify/api';
import Observable from 'zen-observable-ts';
import {
	InternalSchema,
	ModelInstanceMetadata,
	SchemaModel,
	ModelPredicate,
	PredicatesGroup,
	GraphQLFilter,
	AuthModeStrategy,
	ErrorHandler,
	ProcessName,
	AmplifyContext,
} from '../../types';
import {
	buildGraphQLOperation,
	getModelAuthModes,
	getClientSideAuthError,
	getForbiddenError,
	predicateToGraphQLFilter,
	getTokenForCustomAuth,
} from '../utils';
import { USER_AGENT_SUFFIX_DATASTORE } from '../../util';
import {
	jitteredExponentialRetry,
	ConsoleLogger as Logger,
	Hub,
	NonRetryableError,
	BackgroundProcessManager,
} from '@aws-amplify/core';
import { ModelPredicateCreator } from '../../predicates';
import { getSyncErrorType } from './errorMaps';
const opResultDefaults = {
	items: [],
	nextToken: null,
	startedAt: null,
};

const logger = new Logger('DataStore');

class SyncProcessor {
	private readonly typeQuery = new WeakMap<SchemaModel, [string, string]>();

	private runningProcesses = new BackgroundProcessManager();

	constructor(
		private readonly schema: InternalSchema,
		private readonly syncPredicates: WeakMap<
			SchemaModel,
			ModelPredicate<any> | null
		>,
		private readonly amplifyConfig: Record<string, any> = {},
		private readonly authModeStrategy: AuthModeStrategy,
		private readonly errorHandler: ErrorHandler,
		private readonly amplifyContext: AmplifyContext
	) {
		amplifyContext.API = amplifyContext.API || API;
		this.generateQueries();
	}

	private generateQueries() {
		Object.values(this.schema.namespaces).forEach(namespace => {
			Object.values(namespace.models)
				.filter(({ syncable }) => syncable)
				.forEach(model => {
					const [[, ...opNameQuery]] = buildGraphQLOperation(
						namespace,
						model,
						'LIST'
					);

					this.typeQuery.set(model, opNameQuery);
				});
		});
	}

	private graphqlFilterFromPredicate(model: SchemaModel): GraphQLFilter {
		if (!this.syncPredicates) {
			return null!;
		}
		const predicatesGroup: PredicatesGroup<any> =
			ModelPredicateCreator.getPredicates(
				this.syncPredicates.get(model)!,
				false
			)!;

		if (!predicatesGroup) {
			return null!;
		}

		return predicateToGraphQLFilter(predicatesGroup);
	}

	// happening after cleanup? not existing in fake service?
	private async retrievePage<T extends ModelInstanceMetadata>(
		modelDefinition: SchemaModel,
		lastSync: number,
		nextToken: string,
		limit: number = null!,
		filter: GraphQLFilter,
		onTerminate: Promise<void>
	): Promise<{ nextToken: string; startedAt: number; items: T[] }> {
		const [opName, query] = this.typeQuery.get(modelDefinition)!;

		const variables = {
			limit,
			nextToken,
			lastSync,
			filter,
		};

		const modelAuthModes = await getModelAuthModes({
			authModeStrategy: this.authModeStrategy,
			defaultAuthMode: this.amplifyConfig.aws_appsync_authenticationType,
			modelName: modelDefinition.name,
			schema: this.schema,
		});

		// sync only needs the READ auth mode(s)
		const readAuthModes = modelAuthModes.READ;

		let authModeAttempts = 0;
		const authModeRetry = async () => {
			if (!this.runningProcesses.isOpen) {
				throw new Error(
					'sync.retreievePage termination was requested. Exiting.'
				);
			}

			// TODO: otherwise, way too much info, Comment is one of the ones that
			modelDefinition.name === 'Comment' && console.log('trying Comment');
			if (modelDefinition.name === 'Post') {
				// THIS SHOULD HAPPEN TWICE, AND RETRIEVE PAGE SHOULD RETURN TWICE
				// debugger;
			}

			try {
				// debugger;
				logger.debug(
					`Attempting sync with authMode: ${readAuthModes[authModeAttempts]}`
				);
				if (modelDefinition.name === 'Post') {
					// do we enter jittered retry?
					// debugger;
				}
				const response = await this.jitteredRetry<T>({
					query,
					variables,
					opName,
					modelDefinition,
					authMode: readAuthModes[authModeAttempts],
					onTerminate,
				});
				logger.debug(
					`Sync successful with authMode: ${readAuthModes[authModeAttempts]}`
				);
				if (modelDefinition.name === 'Post') {
					// debugger;
				}
				return response;
			} catch (error) {
				modelDefinition.name === 'Comment' &&
					console.log('Comment error', error);
				if (modelDefinition.name === 'Post') {
					// debugger;
				}
				authModeAttempts++;
				if (authModeAttempts >= readAuthModes.length) {
					const authMode = readAuthModes[authModeAttempts - 1];
					logger.debug(`Sync failed with authMode: ${authMode}`, error);
					if (getClientSideAuthError(error) || getForbiddenError(error)) {
						// return empty list of data so DataStore will continue to sync other models
						logger.warn(
							`User is unauthorized to query ${opName} with auth mode ${authMode}. No data could be returned.`
						);

						return {
							data: {
								[opName]: opResultDefaults,
							},
						};
					}
					throw error;
				}
				logger.debug(
					`Sync failed with authMode: ${
						readAuthModes[authModeAttempts - 1]
					}. Retrying with authMode: ${readAuthModes[authModeAttempts]}`
				);
				return await authModeRetry();
			}
		};

		const { data } = await authModeRetry();

		const { [opName]: opResult } = data;

		const { items, nextToken: newNextToken, startedAt } = opResult;

		return {
			nextToken: newNextToken,
			startedAt,
			items,
		};
	}

	private async jitteredRetry<T>({
		query,
		variables,
		opName,
		modelDefinition,
		authMode,
		onTerminate,
	}: {
		query: string;
		variables: { limit: number; lastSync: number; nextToken: string };
		opName: string;
		modelDefinition: SchemaModel;
		authMode: GRAPHQL_AUTH_MODE;
		onTerminate: Promise<void>;
	}): Promise<
		GraphQLResult<{
			[opName: string]: {
				items: T[];
				nextToken: string;
				startedAt: number;
			};
		}>
	> {
		return await jitteredExponentialRetry(
			async (query, variables) => {
				try {
					if (modelDefinition.name === 'Post') {
						// THIS FAILS, WHY?
						// debugger;
					}
					const authToken = await getTokenForCustomAuth(
						authMode,
						this.amplifyConfig
					);

					return await this.amplifyContext.API.graphql({
						query,
						variables,
						authMode,
						authToken,
						userAgentSuffix: USER_AGENT_SUFFIX_DATASTORE,
					});

					// TODO: onTerminate.then(() => API.cancel(...))
				} catch (error) {
					console.log(error);
					// TODO: AHA! WTF IS HAPPENING!
					// "TypeError: Cannot read property '2' of null"
					// debugger;
					// Catch client-side (GraphQLAuthError) & 401/403 errors here so that we don't continue to retry
					const clientOrForbiddenErrorMessage =
						getClientSideAuthError(error) || getForbiddenError(error);
					if (clientOrForbiddenErrorMessage) {
						// WE GET HERE
						// debugger;
						// THIS WILL FAIL THE TEST:
						logger.error('test', error);
						throw new NonRetryableError(clientOrForbiddenErrorMessage);
					}

					const hasItems = Boolean(error?.data?.[opName]?.items);

					const unauthorized =
						error?.errors &&
						(error.errors as [any]).some(
							err => err.errorType === 'Unauthorized'
						);

					const otherErrors =
						error?.errors &&
						(error.errors as [any]).filter(
							err => err.errorType !== 'Unauthorized'
						);

					const result = error;

					if (hasItems) {
						result.data[opName].items = result.data[opName].items.filter(
							item => item !== null
						);
					}

					// debugger;
					if (hasItems && otherErrors?.length) {
						await Promise.all(
							otherErrors.map(async err => {
								try {
									await this.errorHandler({
										recoverySuggestion:
											'Ensure app code is up to date, auth directives exist and are correct on each model, and that server-side data has not been invalidated by a schema change. If the problem persists, search for or create an issue: https://github.com/aws-amplify/amplify-js/issues',
										localModel: null!,
										message: err.message,
										model: modelDefinition.name,
										operation: opName,
										errorType: getSyncErrorType(err),
										process: ProcessName.sync,
										remoteModel: null!,
										cause: err,
									});
								} catch (e) {
									// debugger;
									logger.error('Sync error handler failed with:', e);
								}
							})
						);
						Hub.dispatch('datastore', {
							event: 'nonApplicableDataReceived',
							data: {
								errors: otherErrors,
								modelName: modelDefinition.name,
							},
						});
					}

					if (unauthorized) {
						logger.warn(
							'queryError',
							`User is unauthorized to query ${opName}, some items could not be returned.`
						);

						result.data = result.data || {};

						result.data[opName] = {
							...opResultDefaults,
							...result.data[opName],
						};

						// debugger;
						return result;
					}

					if (result.data?.[opName].items?.length) {
						// debugger;
						return result;
					}

					// debugger;
					throw error;
				}
			},
			[query, variables],
			undefined,
			onTerminate
		);
	}

	private startcount = 0;

	start(
		typesLastSync: Map<SchemaModel, [string, number]>
	): Observable<SyncModelPage> {
		this.startcount++;
		// try {
		// 	if (this.startcount == 2) throw new Error('ha!');
		// } catch (e) {
		// 	console.error(e);
		// }
		console.log('sync.ts start!!!');
		const { maxRecordsToSync, syncPageSize } = this.amplifyConfig;
		const parentPromises = new Map<string, Promise<void>>();
		const observable = new Observable<SyncModelPage>(observer => {
			const sortedTypesLastSyncs = Object.values(this.schema.namespaces).reduce(
				(map, namespace) => {
					for (const modelName of Array.from(
						namespace.modelTopologicalOrdering!.keys()
					)) {
						const typeLastSync = typesLastSync.get(namespace.models[modelName]);
						map.set(namespace.models[modelName], typeLastSync!);
					}
					return map;
				},
				new Map<SchemaModel, [string, number]>()
			);

			const allModelsReady = Array.from(sortedTypesLastSyncs.entries())
				.filter(([{ syncable }]) => syncable)
				.map(
					([modelDefinition, [namespace, lastSync]]) =>
						this.runningProcesses.isOpen &&
						this.runningProcesses.add(async onTerminate => {
							modelDefinition.name === 'Comment' &&
								console.log(`starting adding model ${modelDefinition.name}`);
							if (modelDefinition.name === 'Post') {
								// debugger;
							}
							let done = false;
							let nextToken: string = null!;
							let startedAt: number = null!;
							let items: ModelInstanceMetadata[] = null!;

							let recordsReceived = 0;
							const filter = this.graphqlFilterFromPredicate(modelDefinition);

							const parents = this.schema.namespaces[
								namespace
							].modelTopologicalOrdering!.get(modelDefinition.name);
							const promises = parents!.map(parent =>
								parentPromises.get(`${namespace}_${parent}`)
							);

							const promise = new Promise<void>(async res => {
								await Promise.all(promises);

								do {
									modelDefinition.name === 'Comment' && console.log('ping');
									if (modelDefinition.name === 'Post') {
										// debugger;
									}
									if (!this.runningProcesses.isOpen) {
										return;
									}

									modelDefinition.name === 'Comment' && console.log('pang');
									if (modelDefinition.name === 'Post') {
										// debugger;
									}

									// TODO: START HERE:
									// TODO: make sure the following are numbers:

									/**
									 * Records received: 0
									 * Max records to sync: 1000
									 * Sync page size: 1000
									 * Limit: 1000
									 */
									const limit = Math.min(
										maxRecordsToSync - recordsReceived,
										syncPageSize
									);

									// check here, is math right?
									if (modelDefinition.name === 'Post') {
										// debugger;
									}

									// TODO: Why are we getting lost in here!!!
									// TODO: throwing exception? never returning?
									// if exception, try catch, and maybe not resolve but also reject above
									// if never returning, then take a look there
									/**
									 * items: 0
									 * nextToken: null
									 * startedAt: null
									 * modelDefinition: (a model definition)
									 * lastSync: 0
									 * limit: 0
									 * filter: null
									 * onTerminate: (pending Promise)
									 */
									({ items, nextToken, startedAt } = await this.retrievePage(
										modelDefinition,
										lastSync,
										nextToken,
										limit,
										filter,
										onTerminate
									));

									if (modelDefinition.name === 'Post') {
										// debugger;
									}
									// START HERE
									// TODO: do we get here?
									// TODO: do we get here?

									// hangs on second sync
									if (modelDefinition.name === 'Post') {
										// debugger;
									}

									recordsReceived += items.length;

									done =
										nextToken === null || recordsReceived >= maxRecordsToSync;

									observer.next({
										namespace,
										modelDefinition,
										items,
										done,
										startedAt,
										isFullSync: !lastSync,
									});
									modelDefinition.name === 'Comment' && console.log('pong');
									if (modelDefinition.name === 'Post') {
										// debugger;
									}
								} while (!done);

								res();
							});

							parentPromises.set(
								`${namespace}_${modelDefinition.name}`,
								promise
							);

							modelDefinition.name === 'Comment' &&
								console.log(
									`awaitting promise adding model ${modelDefinition.name}`
								);
							if (modelDefinition.name === 'Post') {
								// debugger;
							}
							await promise;
							modelDefinition.name === 'Comment' &&
								console.log(`done adding model ${modelDefinition.name}`);
							if (modelDefinition.name === 'Post') {
								// debugger;
							}
						}, `adding model ${modelDefinition.name}`)
				);

			Promise.all(allModelsReady as Promise<any>[]).then(() => {
				observer.complete();
			});
		});

		return observable;
	}

	async stop() {
		// debugger;
		logger.debug('stopping sync processor');
		// console.log('sync.ts stop running procs', this.runningProcesses);
		// TODO: CURRENT: WHY DOES THIS BAIL???
		// background process manager has models hanging out in it
		// debugger;
		await this.runningProcesses.close();
		// debugger;
		console.log('sync.ts stop middle');
		// debugger;
		await this.runningProcesses.open();
		logger.debug('sync processor stopped');
	}
}

export type SyncModelPage = {
	namespace: string;
	modelDefinition: SchemaModel;
	items: ModelInstanceMetadata[];
	startedAt: number;
	done: boolean;
	isFullSync: boolean;
};

export { SyncProcessor };
