// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { S3UploadDataResult, S3UploadOptions } from '../../types';
import { createUploadTask } from '../../utils';
import { UploadTask, StorageUploadDataRequest } from '../../../../types';
import { assertValidationError } from '../../../../errors/utils/assertValidationError';
import { StorageValidationErrorCode } from '../../../../errors/types/validation';
import { DEFAULT_PART_SIZE, MAX_OBJECT_SIZE } from '../../utils/constants';
import { byteLength } from './byteLength';
import { putObjectJob } from './putObjectJob';
import { getMultipartUploadHandlers } from './multipart';

/**
 * Upload data to specified S3 object. By default, it uses single PUT operation to upload if the data is less than 5MB.
 * Otherwise, it uses multipart upload to upload the data. If the data length is unknown, it uses multipart upload.
 *
 * Limitations:
 * * Maximum object size is 5TB.
 * * Maximum object size if the size cannot be determined before upload is 50GB.
 *
 * @param {StorageUploadDataRequest<S3UploadOptions>} uploadDataRequest The parameters that are passed to the
 * 	uploadData operation.
 * @returns {UploadTask<S3UploadDataResult>} Cancelable and Resumable task exposing result promise from `result`
 * 	property.
 * @throws service: {@link S3Exception} - thrown when checking for existence of the object
 * @throws validation: {@link StorageValidationErrorCode } - Validation errors
 * thrown either username or key are not defined.
 *
 * TODO: add config errors
 */
export const uploadData = (
	uploadDataRequest: StorageUploadDataRequest<S3UploadOptions>
): UploadTask<S3UploadDataResult> => {
	const { data } = uploadDataRequest;

	const dataByteLength = byteLength(data);
	assertValidationError(
		dataByteLength === undefined || dataByteLength <= MAX_OBJECT_SIZE,
		StorageValidationErrorCode.ObjectTooLarge
	);

	if (dataByteLength && dataByteLength <= DEFAULT_PART_SIZE) {
		const abortController = new AbortController();
		return createUploadTask({
			isMultipartUpload: false,
			job: putObjectJob(
				uploadDataRequest,
				abortController.signal,
				dataByteLength
			),
			onCancel: (abortErrorOverwrite?: Error) => {
				abortController.abort(abortErrorOverwrite);
			},
		});
	} else {
		const { multipartUploadJob, onPause, onResume, onCancel } =
			getMultipartUploadHandlers(uploadDataRequest, dataByteLength);
		return createUploadTask({
			isMultipartUpload: true,
			job: multipartUploadJob,
			onCancel: (abortErrorOverwrite?: Error) => {
				onCancel(abortErrorOverwrite);
			},
			onPause,
			onResume,
		});
	}
};
