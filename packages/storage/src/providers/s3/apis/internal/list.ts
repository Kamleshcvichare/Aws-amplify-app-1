// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AmplifyClassV6 } from '@aws-amplify/core';
import { StorageAction } from '@aws-amplify/core/internals/utils';

import {
	ListAllInput,
	ListAllOutput,
	ListAllOutputWithPath,
	ListAllOutputWithPrefix,
	ListOutputItemWithKey,
	ListOutputItemWithPath,
	ListPaginateInput,
	ListPaginateOutput,
	ListPaginateOutputWithPath,
	ListPaginateOutputWithPrefix,
} from '../../types';
import {
	resolveS3ConfigAndInput,
	validateStorageOperationInputWithPrefix,
} from '../../utils';
import { ResolvedS3Config } from '../../types/options';
import {
	ListObjectsV2Input,
	ListObjectsV2Output,
	listObjectsV2,
} from '../../utils/client';
import { getStorageUserAgentValue } from '../../utils/userAgent';
import { logger } from '../../../../utils';
import { STORAGE_INPUT_PREFIX } from '../../utils/constants';

const MAX_PAGE_SIZE = 1000;

interface ListInputArgs {
	s3Config: ResolvedS3Config;
	listParams: ListObjectsV2Input;
	generatedPrefix?: string;
}

export const list = async (
	amplify: AmplifyClassV6,
	input: ListAllInput | ListPaginateInput,
): Promise<ListAllOutput | ListPaginateOutput> => {
	const { options = {} } = input;
	const {
		s3Config,
		bucket,
		keyPrefix: generatedPrefix,
		identityId,
	} = await resolveS3ConfigAndInput(amplify, options);

	const { inputType, objectKey } = validateStorageOperationInputWithPrefix(
		input,
		identityId,
	);
	const isInputWithPrefix = inputType === STORAGE_INPUT_PREFIX;

	// @ts-expect-error pageSize and nextToken should not coexist with listAll
	if (options?.listAll && (options?.pageSize || options?.nextToken)) {
		const anyOptions = options as any;
		logger.debug(
			`listAll is set to true, ignoring ${
				anyOptions?.pageSize ? `pageSize: ${anyOptions?.pageSize}` : ''
			} ${anyOptions?.nextToken ? `nextToken: ${anyOptions?.nextToken}` : ''}.`,
		);
	}
	const listParams = {
		Bucket: bucket,
		Prefix: isInputWithPrefix ? `${generatedPrefix}${objectKey}` : objectKey,
		MaxKeys: options?.listAll ? undefined : options?.pageSize,
		ContinuationToken: options?.listAll ? undefined : options?.nextToken,
	};
	logger.debug(`listing items from "${listParams.Prefix}"`);

	const listInputArgs: ListInputArgs = {
		s3Config,
		listParams,
	};
	if (options.listAll) {
		if (isInputWithPrefix) {
			return _listAllWithPrefix({
				...listInputArgs,
				generatedPrefix,
			});
		} else {
			return _listAllWithPath(listInputArgs);
		}
	} else {
		if (inputType === STORAGE_INPUT_PREFIX) {
			return _listWithPrefix({ ...listInputArgs, generatedPrefix });
		} else {
			return _listWithPath(listInputArgs);
		}
	}
};

/** @deprecated Use {@link _listAllWithPath} instead. */
const _listAllWithPrefix = async ({
	s3Config,
	listParams,
	generatedPrefix,
}: ListInputArgs): Promise<ListAllOutputWithPrefix> => {
	const listResult: ListOutputItemWithKey[] = [];
	let continuationToken = listParams.ContinuationToken;
	do {
		const { items: pageResults, nextToken: pageNextToken } =
			await _listWithPrefix({
				generatedPrefix,
				s3Config,
				listParams: {
					...listParams,
					ContinuationToken: continuationToken,
					MaxKeys: MAX_PAGE_SIZE,
				},
			});
		listResult.push(...pageResults);
		continuationToken = pageNextToken;
	} while (continuationToken);

	return {
		items: listResult,
	};
};

/** @deprecated Use {@link _listWithPath} instead. */
const _listWithPrefix = async ({
	s3Config,
	listParams,
	generatedPrefix,
}: ListInputArgs): Promise<ListPaginateOutputWithPrefix> => {
	const listParamsClone = { ...listParams };
	if (!listParamsClone.MaxKeys || listParamsClone.MaxKeys > MAX_PAGE_SIZE) {
		logger.debug(`defaulting pageSize to ${MAX_PAGE_SIZE}.`);
		listParamsClone.MaxKeys = MAX_PAGE_SIZE;
	}

	const response: ListObjectsV2Output = await listObjectsV2(
		{
			...s3Config,
			userAgentValue: getStorageUserAgentValue(StorageAction.List),
		},
		listParamsClone,
	);

	if (!response?.Contents) {
		return {
			items: [],
		};
	}

	return {
		items: response.Contents.map(item => ({
			key: generatedPrefix
				? item.Key!.substring(generatedPrefix.length)
				: item.Key!,
			eTag: item.ETag,
			lastModified: item.LastModified,
			size: item.Size,
		})),
		nextToken: response.NextContinuationToken,
	};
};

const _listAllWithPath = async ({
	s3Config,
	listParams,
}: ListInputArgs): Promise<ListAllOutputWithPath> => {
	const listResult: ListOutputItemWithPath[] = [];
	let continuationToken = listParams.ContinuationToken;
	do {
		const { items: pageResults, nextToken: pageNextToken } =
			await _listWithPath({
				s3Config,
				listParams: {
					...listParams,
					ContinuationToken: continuationToken,
					MaxKeys: MAX_PAGE_SIZE,
				},
			});
		listResult.push(...pageResults);
		continuationToken = pageNextToken;
	} while (continuationToken);

	return {
		items: listResult,
	};
};

const _listWithPath = async ({
	s3Config,
	listParams,
}: ListInputArgs): Promise<ListPaginateOutputWithPath> => {
	const listParamsClone = { ...listParams };
	if (!listParamsClone.MaxKeys || listParamsClone.MaxKeys > MAX_PAGE_SIZE) {
		logger.debug(`defaulting pageSize to ${MAX_PAGE_SIZE}.`);
		listParamsClone.MaxKeys = MAX_PAGE_SIZE;
	}

	const response: ListObjectsV2Output = await listObjectsV2(
		{
			...s3Config,
			userAgentValue: getStorageUserAgentValue(StorageAction.List),
		},
		listParamsClone,
	);

	if (!response?.Contents) {
		return {
			items: [],
		};
	}

	return {
		items: response.Contents.map(item => ({
			path: item.Key!,
			eTag: item.ETag,
			lastModified: item.LastModified,
			size: item.Size,
		})),
		nextToken: response.NextContinuationToken,
	};
};
