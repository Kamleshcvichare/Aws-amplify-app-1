// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	Endpoint,
	HttpRequest,
} from '@aws-amplify/core/internals/aws-client-utils';
import { composeServiceApi } from '@aws-amplify/core/internals/aws-client-utils/composers';
import { defaultConfig } from './base';
import type {
	CompatibleHttpResponse,
	HeadObjectCommandInput,
	HeadObjectCommandOutput,
} from './types';
import {
	deserializeNumber,
	deserializeTimestamp,
	map,
	parseXmlError,
	s3TransferHandler,
	serializePathnameObjectKey,
} from './utils';
import { StorageError } from '../../errors/StorageError';

export type HeadObjectInput = Pick<
	HeadObjectCommandInput,
	| 'Bucket'
	| 'Key'
	| 'SSECustomerKey'
	// TODO(AllanZhengYP): remove in V6.
	| 'SSECustomerKeyMD5'
	| 'SSECustomerAlgorithm'
>;

export type HeadObjectOutput = Pick<
	HeadObjectCommandOutput,
	| 'ContentLength'
	| 'ContentType'
	| 'ETag'
	| 'LastModified'
	| 'Metadata'
	| 'VersionId'
>;

const headObjectSerializer = async (
	input: HeadObjectInput,
	endpoint: Endpoint
): Promise<HttpRequest> => {
	const url = new URL(endpoint.url.toString());
	url.pathname = serializePathnameObjectKey(url, input.Key!);
	return {
		method: 'HEAD',
		// TODO need to check with BR for headers
		headers: {},
		url,
	};
};

const headObjectDeserializer = async (
	response: CompatibleHttpResponse
): Promise<HeadObjectOutput> => {
	if (response.statusCode >= 300) {
		const error = await parseXmlError(response);
		// TODO need to assert service error
		throw new StorageError({ ...error }); // basically create `StorageError` with name and message
	} else {
		const contents = {
			...map(response.headers, {
				ContentLength: ['content-length', deserializeNumber],
				ContentType: 'content-type',
				ETag: 'etag',
				LastModified: ['last-modified', deserializeTimestamp],
				VersionId: 'x-amz-version-id',
			}),
		};
		return {
			...contents,
		};
	}
};

export const headObject = composeServiceApi(
	s3TransferHandler,
	headObjectSerializer,
	headObjectDeserializer,
	{ ...defaultConfig, responseType: 'text' }
);
