import {
	Endpoint,
	HttpRequest,
	HttpResponse,
	parseMetadata,
} from '@aws-amplify/core/internals/aws-client-utils';
import { composeServiceApi } from '@aws-amplify/core/internals/aws-client-utils/composers';
import { MetadataBearer } from '@aws-sdk/types';
import type { CopyObjectCommandInput } from './types';
import { defaultConfig } from './base';
import {
	parseXmlBody,
	parseXmlError,
	s3TransferHandler,
	serializeObjectConfigsToHeaders,
} from './utils';
import type { S3ProviderCopyConfig } from '../../types/AWSS3Provider';

/**
 * @see {@link S3ProviderCopyConfig}
 */
export type CopyObjectInput = Pick<
	CopyObjectCommandInput,
	| 'Bucket'
	| 'CopySource'
	| 'Key'
	| 'MetadataDirective'
	| 'CacheControl'
	| 'ContentType'
	| 'Expires'
	| 'ACL'
	| 'ServerSideEncryption'
	| 'SSECustomerAlgorithm'
	| 'SSECustomerKey'
	| 'SSECustomerKeyMD5'
	| 'SSEKMSKeyId'
>;

export type CopyObjectOutput = MetadataBearer;

const copyObjectSerializer = (
	input: CopyObjectInput,
	endpoint: Endpoint
): HttpRequest => {
	const headers = {
		...serializeObjectConfigsToHeaders(input),
		'x-amz-copy-source': input.CopySource, // TODO: url encode the copy source
		'x-amz-metadata-directive': input.MetadataDirective,
	};
	const url = new URL(endpoint.url.toString());
	url.hostname = `${input.Bucket}.${url.hostname}`;
	url.pathname = `/${input.Key}`;
	return {
		method: 'PUT',
		headers,
		url,
	};
};

const copyObjectDeserializer = async (
	response: HttpResponse
): Promise<CopyObjectOutput> => {
	if (response.statusCode >= 300) {
		const error = await parseXmlError(response);
		throw error;
	} else {
		await parseXmlBody(response);
		return {
			$metadata: parseMetadata(response),
		};
	}
};

export const copyObject = composeServiceApi(
	s3TransferHandler,
	copyObjectSerializer,
	copyObjectDeserializer,
	{ ...defaultConfig, responseType: 'text' }
);
