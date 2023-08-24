// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Logging constants
export const AWS_CLOUDWATCH_CATEGORY = 'Logging';
export const NO_CREDS_ERROR_STRING = 'No credentials';
export const RETRY_ERROR_CODES = [
	'ResourceNotFoundException',
	'InvalidSequenceTokenException',
];

/**
 * This Symbol is used to reference an internal-only PubSub provider that
 * is used for AppSync/GraphQL subscriptions in the API category.
 */
const hasSymbol =
	typeof Symbol !== 'undefined' && typeof Symbol.for === 'function';

export const INTERNAL_AWS_APPSYNC_REALTIME_PUBSUB_PROVIDER = hasSymbol
	? Symbol.for('INTERNAL_AWS_APPSYNC_REALTIME_PUBSUB_PROVIDER')
	: '@@INTERNAL_AWS_APPSYNC_REALTIME_PUBSUB_PROVIDER';

export const USER_AGENT_HEADER = 'x-amz-user-agent';

// Error exception code constants
export const AUTH_CONFING_EXCEPTION = 'AuthConfigException';
export const CACHE_LIST_EXCEPTION = 'CacheListException';
export const I18N_EXCEPTION = 'I18NException';
export const SERVICE_WORKER_EXCEPTION = 'ServiceWorkerException';
export const STORAGE_CACHE_EXCEPTION = 'StorageCacheException';
export const APPLICATION_ID_EXCEPTION = 'ApplicationIdException';
export const NO_HUBCALLBACK_PROVIDED_EXCEPTION =
	'NoHubcallbackProvidedException';
