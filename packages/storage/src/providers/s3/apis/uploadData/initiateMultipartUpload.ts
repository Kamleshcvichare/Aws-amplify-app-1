// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	cacheMultipartUpload,
	findCachedUploadParts,
	getUploadsCacheKey,
} from './cache';
import { createMultipartUpload, Part } from '../../../../AwsClients/S3';
import { ResolvedS3Config } from '../../types/options';
import { UploadSource } from '../../../../types';
import { StorageAccessLevel } from '@aws-amplify/core';

export type InitMultipartUploadOptions = {
	s3Config: ResolvedS3Config;
	data: UploadSource;
	bucket: string;
	accessLevel: StorageAccessLevel;
	keyPrefix: string;
	key: string;
	contentType?: string;
	contentDisposition?: string;
	contentEncoding?: string;
	metadata?: Record<string, string>;
	totalLength?: number;
	abortSignal?: AbortSignal;
};

type InitMultipartUploadResult = {
	uploadId: string;
	cachedParts: Part[];
};

export const initMultipartUpload = async ({
	s3Config,
	data,
	totalLength,
	contentType,
	bucket,
	accessLevel,
	keyPrefix,
	key,
	contentDisposition,
	contentEncoding,
	metadata,
	abortSignal,
}: InitMultipartUploadOptions): Promise<InitMultipartUploadResult> => {
	const resolvedContentType =
		contentType ?? (data instanceof File ? data.type : 'binary/octet-stream');
	const finalKey = keyPrefix + key;

	let cachedUpload: {
		parts: Part[];
		uploadId: string;
		uploadCacheKey: string;
	} | null;
	if (totalLength === undefined) {
		// Cannot determine total length of the data source, so we cannot safely cache the upload
		// TODO: logger message
		cachedUpload = null;
	} else {
		const uploadCacheKey = getUploadsCacheKey({
			size: totalLength,
			contentType: resolvedContentType,
			file: data instanceof File ? data : undefined,
			bucket,
			accessLevel,
			key,
		});
		const cachedUploadParts = await findCachedUploadParts({
			s3Config,
			cacheKey: uploadCacheKey,
			bucket,
			finalKey,
		});
		cachedUpload = cachedUploadParts
			? { ...cachedUploadParts, uploadCacheKey }
			: null;
	}

	if (cachedUpload) {
		return {
			uploadId: cachedUpload.uploadId,
			cachedParts: cachedUpload.parts,
		};
	} else {
		const { UploadId } = await createMultipartUpload(
			{
				...s3Config,
				abortSignal,
			},
			{
				Bucket: bucket,
				Key: finalKey,
				ContentType: resolvedContentType,
				ContentDisposition: contentDisposition,
				ContentEncoding: contentEncoding,
				Metadata: metadata,
			}
		);
		if (totalLength === undefined) {
			// Cannot determine total length of the data source, so we cannot safely cache the upload
			// TODO: logger message
			return {
				uploadId: UploadId!,
				cachedParts: [],
			};
		}
		const uploadCacheKey = getUploadsCacheKey({
			size: totalLength,
			contentType: resolvedContentType,
			file: data instanceof File ? data : undefined,
			bucket,
			accessLevel,
			key,
		});
		await cacheMultipartUpload(uploadCacheKey, {
			uploadId: UploadId!,
			lastTouched: Date.now(),
			bucket,
			key,
			fileName: data instanceof File ? data.name : '',
		});
		return {
			uploadId: UploadId!,
			cachedParts: [],
		};
	}
	// handle cancel;
};
