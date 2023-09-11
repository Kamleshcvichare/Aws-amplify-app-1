// TODO V6: dependency not yet added.
// import type { ModelIntrospectionSchema as InternalModelIntrospectionSchema } from '@aws-amplify/appsync-modelgen-plugin';

export type LibraryAPIOptions = {
	AppSync: {
		query: string;
		variables?: object;
		authMode?: any;
		authToken?: string;
		/**
		 * @deprecated This property should not be used
		 */
		userAgentSuffix?: string; // TODO: remove in v6
	};
	customHeaders: Function; //
};

export type APIConfig = {
	AppSync?: {
		defaultAuthMode?: GraphQLAuthMode;
		region?: string;
		endpoint?: string;
		// TODO: switch this when dependency is added:
		// modelIntrospectionSchema: InternalModelIntrospectionSchema;
		modelIntrospectionSchema?: any;
	};
};

export type GraphQLAuthMode =
	| { type: 'apiKey'; apiKey: string }
	| { type: 'jwt'; token: 'id' | 'access' }
	| { type: 'iam' }
	| { type: 'lambda' }
	| { type: 'custom' };

// Francisco's type draft for reference:

// import type { ModelIntrospectionSchema as InternalModelIntrospectionSchema } from '@aws-amplify/appsync-modelgen-plugin';
// import { REGION_SET_PARAM } from '../../clients/middleware/signing/signer/signatureV4/constants';
// export namespace Amplify {
// 	export function configure<Config extends Backend.Config>(
// 		config: Config,
// 		frontendConfig: Frontend.Config<Config>
// 	): void {
// 		console.log('Configure', config, frontendConfig);
// 	}
// 	export namespace Backend {
// 		export type Config = {
// 			API?: APIConfig;
// 		};
// 		export type APIConfig = {
// 			graphQL?: GraphQLConfig;
// 		};
// 		export type GraphQLConfig = {
// 			region: string;
// 			endpoint: string;
// 			// TODO V6
// 			// modelIntrospection?: ModelIntrospectionSchema;
// 			defaultAuthMode: GraphQLAuthMode;
// 		};
// 		export type GraphQLAuthMode =
// 			| { type: 'apiKey'; apiKey: string }
// 			| { type: 'jwt'; token: 'id' | 'access' }
// 			| { type: 'iam' }
// 			| { type: 'lambda' }
// 			| { type: 'custom' };
// 		// TODO V6
// 		// export type ModelIntrospectionSchema = InternalModelIntrospectionSchema;
// 	}

// 	export namespace Frontend {
// 		export type Config<Config extends Backend.Config> = ExcludeNever<{
// 			API: APIFrontendConfig<NonNullable<Config['API']>>;
// 		}>;
// 		export type APIFrontendConfig<Config extends Backend.APIConfig> =
// 			ExcludeNever<{
// 				graphQL: GraphQLFrontendConfig<NonNullable<Config['graphQL']>>;
// 			}>;
// 		export type CommonGraphQLFrontendConfig = {
// 			debugLogging?: boolean;
// 			customHeaders?:
// 				| Record<string, string>
// 				| (() => Record<string, string>)
// 				| (() => Promise<Record<string, string>>);
// 		};
// 		export type GraphQLFrontendConfig<Config extends Backend.GraphQLConfig> =
// 			Prettify<
// 				CommonGraphQLFrontendConfig &
// 					(Config['defaultAuthMode'] extends { type: 'custom' }
// 						? Pick<Required<CommonGraphQLFrontendConfig>, 'customHeaders'>
// 						: {})
// 			>;
// 	}
// }

// type ExcludeNever<T> = {
// 	[K in keyof T as T[K] extends never ? never : K]: T[K];
// } extends infer X
// 	? [keyof X][number] extends never
// 		? never
// 		: X
// 	: never;

// type Prettify<T> = { [K in keyof T]: T[K] } & {};