// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Amplify } from '@aws-amplify/core';

import {
	GetPropertiesInput,
	GetPropertiesInputWithKey,
	GetPropertiesInputWithPath,
	GetPropertiesOutput,
	GetPropertiesOutputWithKey,
	GetPropertiesOutputWithPath,
} from '../types';

import { getProperties as getPropertiesInternal } from './internal/getProperties';

interface GetProperties {
	/**
	 * Gets the properties of a file. The properties include S3 system metadata and
	 * the user metadata that was provided when uploading the file.
	 *
	 * @param input - The `GetPropertiesInputWithPath` object.
	 * @returns Requested object properties.
	 * @throws An `S3Exception` when the underlying S3 service returned error.
	 * @throws A `StorageValidationErrorCode` when API call parameters are invalid.
	 */
	(input: GetPropertiesInputWithPath): Promise<GetPropertiesOutputWithPath>;
	/**
	 * @deprecated The `key` and `accessLevel` parameters are deprecated and may be removed in the next major version.
	 * Please use {@link https://docs.amplify.aws/javascript/build-a-backend/storage/get-properties/ | path} instead.
	 *
	 * Gets the properties of a file. The properties include S3 system metadata and
	 * the user metadata that was provided when uploading the file.
	 *
	 * @param input - The `GetPropertiesInputWithKey` object.
	 * @returns Requested object properties.
	 * @throws An `S3Exception` when the underlying S3 service returned error.
	 * @throws A `StorageValidationErrorCode` when API call parameters are invalid.
	 */
	(input: GetPropertiesInputWithKey): Promise<GetPropertiesOutputWithKey>;
	(input: GetPropertiesInput): Promise<GetPropertiesOutput>;
}

export const getProperties: GetProperties = <
	Output extends GetPropertiesOutput,
>(
	input: GetPropertiesInput,
): Promise<Output> => getPropertiesInternal(Amplify, input) as Promise<Output>;
