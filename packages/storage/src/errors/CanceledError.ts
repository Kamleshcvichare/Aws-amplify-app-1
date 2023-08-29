// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ErrorParams } from '@aws-amplify/core/internals/utils';
import { StorageError } from './StorageError';

/**
 * Internal-only class for CanceledError thrown by XHR handler or multipart upload when cancellation is invoked
 * without overwriting behavior.
 *
 * @internal
 */
export class CanceledError extends StorageError {
	constructor(params: ErrorParams) {
		super(params);

		// TODO: Delete the following 2 lines after we change the build target to >= es2015
		this.constructor = CanceledError;
		Object.setPrototypeOf(this, CanceledError.prototype);
	}
}

/**
 * Check if an error is caused by user calling `cancel()` on a upload/download task. If an overwriting error is
 * supplied to `task.cancel(errorOverwrite)`, this function will return `false`.
 */
export const isCancelError = (error: unknown): boolean =>
	!!error && error instanceof CanceledError;
