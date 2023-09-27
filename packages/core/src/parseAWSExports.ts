// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { OAuthConfig } from './singleton/Auth/types';
import { ResourcesConfig } from './singleton/types';

const authTypeMapping: Record<any, any> = {
	API_KEY: 'apiKey',
	AWS_IAM: 'iam',
	AMAZON_COGNITO_USER_POOLS: 'jwt',
};

/**
 * This utility converts the `aws-exports.js` file generated by the Amplify CLI into a {@link ResourcesConfig} object
 * consumable by Amplify.
 *
 * @param config A configuration object from `aws-exports.js`.
 *
 * @returns A {@link ResourcesConfig} object.
 */

export const parseAWSExports = (
	config: Record<string, any> = {}
): ResourcesConfig => {
	const {
		aws_appsync_apiKey,
		aws_appsync_authenticationType,
		aws_appsync_graphqlEndpoint,
		aws_appsync_region,
		aws_cognito_identity_pool_id,
		aws_cognito_sign_up_verification_method,
		aws_mandatory_sign_in,
		aws_mobile_analytics_app_id,
		aws_mobile_analytics_app_region,
		aws_user_files_s3_bucket,
		aws_user_files_s3_bucket_region,
		aws_user_files_s3_dangerously_connect_to_http_endpoint_for_testing,
		aws_user_pools_id,
		aws_user_pools_web_client_id,
		geo,
		oauth,
		aws_cloud_logic_custom,
	} = config;
	const amplifyConfig: ResourcesConfig = {};

	// Analytics
	if (aws_mobile_analytics_app_id) {
		amplifyConfig.Analytics = {
			Pinpoint: {
				appId: aws_mobile_analytics_app_id,
				region: aws_mobile_analytics_app_region,
			},
		};
	}

	// TODO: Need to support all API configurations
	// API
	if (aws_appsync_graphqlEndpoint) {
		amplifyConfig.API = {
			AppSync: {
				defaultAuthMode: {
					type: authTypeMapping[aws_appsync_authenticationType],
					apiKey: aws_appsync_apiKey,
				} as any,
				endpoint: aws_appsync_graphqlEndpoint,
				region: aws_appsync_region,
			},
		};
	}

	// Auth
	if (aws_cognito_identity_pool_id || aws_user_pools_id) {
		amplifyConfig.Auth = {
			Cognito: {
				identityPoolId: aws_cognito_identity_pool_id,
				allowGuestAccess: aws_mandatory_sign_in !== 'enable',
				signUpVerificationMethod: aws_cognito_sign_up_verification_method,
				userPoolClientId: aws_user_pools_web_client_id,
				userPoolId: aws_user_pools_id,
				...(oauth &&
					Object.keys(oauth).length > 0 && {
						loginWith: getOAuthConfig(oauth),
					}),
			},
		};
	}

	// Storage
	if (aws_user_files_s3_bucket) {
		amplifyConfig.Storage = {
			S3: {
				bucket: aws_user_files_s3_bucket,
				region: aws_user_files_s3_bucket_region,
				dangerouslyConnectToHttpEndpointForTesting:
					aws_user_files_s3_dangerously_connect_to_http_endpoint_for_testing,
			},
		};
	}

	// Geo
	if (geo) {
		const { amazon_location_service } = geo;
		(amplifyConfig as any).Geo = amazon_location_service
			? {
					LocationService: {
						...amazon_location_service,
						searchIndices: amazon_location_service.search_indices,
						region: amazon_location_service.region,
					},
			  }
			: { ...geo };
	}

	// REST API
	if (aws_cloud_logic_custom) {
		amplifyConfig.API = {
			...amplifyConfig.API,
			REST: (aws_cloud_logic_custom as any[]).reduce(
				(acc, api: Record<string, any>) => {
					const { name, endpoint, region, service } = api;
					return {
						...acc,
						[name]: {
							endpoint,
							defaultAuthMode: {
								type: authTypeMapping.AWS_IAM,
								...(service ? { service } : undefined),
								...(region ? { region } : undefined),
							},
						},
					};
				},
				{}
			),
		};
	}

	return amplifyConfig;
};

const getRedirectUrl = (redirectStr: string): string[] =>
	redirectStr.split(',');

const getOAuthConfig = ({
	domain,
	scope,
	redirectSignIn,
	redirectSignOut,
	responseType,
}: Record<string, any>): { oauth: OAuthConfig } => ({
	oauth: {
		domain,
		scopes: scope,
		redirectSignIn: getRedirectUrl(redirectSignIn),
		redirectSignOut: getRedirectUrl(redirectSignOut),
		responseType,
	},
});
