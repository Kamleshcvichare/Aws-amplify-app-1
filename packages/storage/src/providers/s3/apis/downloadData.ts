// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Amplify } from '@aws-amplify/core';

import { DownloadDataInput, DownloadDataOutput, S3Exception } from '../types';
import { resolveS3ConfigAndInput } from '../utils/resolveS3ConfigAndInput';
import { StorageValidationErrorCode } from '../../../errors/types/validation';
import { createDownloadTask } from '../utils';
import { getObject } from '../utils/client';

/**
 * Download S3 object data to memory
 *
 * @param input - The DownloadDataInput object.
 * @returns A cancelable task exposing result promise from `result` property.
 * @throws service: {@link S3Exception} - thrown when checking for existence of the object
 * @throws validation: {@link StorageValidationErrorCode } - Validation errors
 *
 * @example
 * ```ts
 * // Download a file from s3 bucket
 * const { body, eTag } = await downloadData({ key, data: file, options: {
 *   onProgress, // Optional progress callback.
 * } }).result;
 * ```
 * @example
 * ```ts
 * // Cancel a task
 * const downloadTask = downloadData({ key, data: file });
 * //...
 * downloadTask.cancel();
 * try {
 * 	await downloadTask.result;
 * } catch (error) {
 * 	if(isCancelError(error)) {
 *    // Handle error thrown by task cancelation.
 * 	}
 * }
 *```
 */
export const downloadData = (input: DownloadDataInput): DownloadDataOutput => {
	const abortController = new AbortController();

	const downloadTask = createDownloadTask({
		job: downloadDataJob(input, abortController.signal),
		onCancel: (abortErrorOverwrite?: Error) => {
			abortController.abort(abortErrorOverwrite);
		},
	});
	return downloadTask;
};

const downloadDataJob =
	(
		{ options: downloadDataOptions, key }: DownloadDataInput,
		abortSignal: AbortSignal
	) =>
	async () => {
		const { bucket, keyPrefix, s3Config } = await resolveS3ConfigAndInput(
			Amplify,
			downloadDataOptions
		);
		// TODO[AllanZhengYP]: support excludeSubPaths option to exclude sub paths
		const finalKey = keyPrefix + key;

		const {
			Body: body,
			LastModified: lastModified,
			ContentLength: size,
			ETag: eTag,
			Metadata: metadata,
			VersionId: versionId,
			ContentType: contentType,
		} = await getObject(
			{
				...s3Config,
				abortSignal,
				onDownloadProgress: downloadDataOptions?.onProgress,
			},
			{
				Bucket: bucket,
				Key: finalKey,
			}
		);
		return {
			// Casting with ! as body always exists for getObject API.
			// TODO[AllanZhengYP]: remove casting when we have better typing for getObject API
			key,
			body: body!,
			lastModified,
			size,
			contentType,
			eTag,
			metadata,
			versionId,
		};
	};
