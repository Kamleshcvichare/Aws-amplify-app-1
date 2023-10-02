// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DocumentType } from '@aws-amplify/core/internals/utils';

export type GetOptions = RestApiOptionsBase;
export type PostOptions = RestApiOptionsBase;
export type PutOptions = RestApiOptionsBase;
export type PatchOptions = RestApiOptionsBase;
export type DeleteOptions = Omit<RestApiOptionsBase, 'body'>;
export type HeadOptions = Omit<RestApiOptionsBase, 'body'>;

export type GetOperation = Operation<RestApiResponse>;
export type PostOperation = Operation<RestApiResponse>;
export type PutOperation = Operation<RestApiResponse>;
export type PatchOperation = Operation<RestApiResponse>;
export type DeleteOperation = Operation<Omit<RestApiResponse, 'body'>>;
export type HeadOperation = Operation<Omit<RestApiResponse, 'body'>>;

type RestApiOptionsBase = {
	headers?: Headers;
	queryParams?: Record<string, string>;
	body?: DocumentType | FormData;
	/**
	 * Option controls whether or not cross-site Access-Control requests should be made using credentials
	 * such as cookies, authorization headers or TLS client certificates. It has no effect on same-origin requests.
	 * If set to `true`, the request will include credentials such as cookies, authorization headers, TLS
	 * client certificates, and so on. Moreover the response cookies will also be set.
	 * If set to `false`, the cross-site request will not include credentials, and the response cookies from a different
	 * domain will be ignored.
	 *
	 * @default false
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials}
	 */
	withCredentials?: boolean;
};

type Headers = Record<string, string>;

/**
 * Type representing an operation that can be cancelled.
 *
 * @internal
 */
export type Operation<Response> = {
	response: Promise<Response>;
	cancel: (abortMessage?: string) => void;
};

type ResponsePayload = {
	blob: () => Promise<Blob>;
	json: () => Promise<DocumentType>;
	text: () => Promise<string>;
};

/**
 * Basic response type of REST API.
 *
 * @internal
 */
export interface RestApiResponse {
	body: ResponsePayload;
	statusCode: number;
	headers: Headers;
}

/**
 * Input type of REST API.
 * @internal
 */
export type ApiInput<Options> = {
	apiName: string;
	path: string;
	options?: Options;
};

/**
 * Input type to invoke REST POST API from GraphQl client.
 * @internal
 */
export type InternalPostInput = {
	// Resolved GraphQl endpoint url
	url: URL;
	options?: RestApiOptionsBase & {
		/**
		 * Internal-only option for GraphQL client to provide the IAM signing service and region.
		 * * If auth mode is 'iam', you MUST set this value.
		 * * If auth mode is 'none', you MUST NOT set this value;
		 * * If auth mode is 'apiKey' or 'oidc' or 'lambda' or 'userPool' because associated
		 *   headers are provided, this value is ignored.
		 */
		signingServiceInfo?: {
			service?: string;
			region?: string;
		};
	};
	/**
	 * The abort controller to cancel the in-flight POST request.
	 * The same controller reference needs to be used to call `updateRequestToBeCancellable()` to make a promise
	 * with internal post call cancellable.
	 */
	abortController: AbortController;
};
