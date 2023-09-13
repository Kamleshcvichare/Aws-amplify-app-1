// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Amplify } from '@aws-amplify/core';
import { GetPropertiesOutput, GetPropertiesInput } from '../types';
import { getProperties as getPropertiesInternal } from './internal/getProperties';

/**
 * Gets the properties of a file. The properties include S3 system metadata and
 * the user metadata that was provided when uploading the file.
 *
 * @param {GetPropertiesInput} The input to make an API call.
 * @returns {Promise<GetPropertiesOutput>} A promise that resolves the properties.
 * @throws A {@link S3Exception} when the underlying S3 service returned error.
 * @throws A {@link StorageValidationErrorCode} when API call parameters are invalid.
 */
export const getProperties = (
	input: GetPropertiesInput
): Promise<GetPropertiesOutput> => {
	return getPropertiesInternal(Amplify, input);
};
