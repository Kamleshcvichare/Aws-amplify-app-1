// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Amplify, fetchAuthSession } from '@aws-amplify/core';

import { resolveS3ConfigAndInput } from '../../../../../src/providers/s3/utils';
import { resolvePrefix } from '../../../../../src/utils/resolvePrefix';
import {
	StorageValidationErrorCode,
	validationErrorMap,
} from '../../../../../src/errors/types/validation';

jest.mock('@aws-amplify/core', () => ({
	fetchAuthSession: jest.fn(),
	Amplify: {
		getConfig: jest.fn(),
	},
}));
jest.mock('../../../../../src/utils/resolvePrefix');

const mockFetchAuthSession = fetchAuthSession as jest.Mock;
const mockGetConfig = Amplify.getConfig as jest.Mock;
const mockDefaultResolvePrefix = resolvePrefix as jest.Mock;

const bucket = 'bucket';
const region = 'region';
const credentials = {
	accessKeyId: 'accessKeyId',
	sessionToken: 'sessionToken',
	secretAccessKey: 'secretAccessKey',
};
const targetIdentityId = 'targetIdentityId';

describe('resolveS3ConfigAndInput', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Amplify.libraryOptions = {};
	});
	mockFetchAuthSession.mockResolvedValue({
		credentials,
		identityId: targetIdentityId,
	});

	mockGetConfig.mockReturnValue({
		Storage: {
			S3: {
				bucket,
				region,
			},
		},
	});

	it('should call fetchAuthSession with forceRefresh false for credentials and identityId', async () => {
		await resolveS3ConfigAndInput(Amplify, {});
		expect(mockFetchAuthSession).toHaveBeenCalledWith({
			forceRefresh: false,
		});
	});

	it('should throw if credentials are not available', async () => {
		mockFetchAuthSession.mockResolvedValueOnce({
			identityId: targetIdentityId,
		});
		await expect(resolveS3ConfigAndInput(Amplify, {})).rejects.toMatchObject(
			validationErrorMap[StorageValidationErrorCode.NoCredentials]
		);
	});

	it('should throw if identityId is not available', async () => {
		mockFetchAuthSession.mockResolvedValueOnce({
			credentials,
		});
		await expect(resolveS3ConfigAndInput(Amplify, {})).rejects.toMatchObject(
			validationErrorMap[StorageValidationErrorCode.NoIdentityId]
		);
	});

	it('should resolve bucket from S3 config', async () => {
		const { bucket: resolvedBucket } = await resolveS3ConfigAndInput(
			Amplify,
			{}
		);
		expect(resolvedBucket).toEqual(bucket);
		expect(mockGetConfig).toBeCalled();
	});

	it('should throw if bucket is not available', async () => {
		mockGetConfig.mockReturnValueOnce({
			Storage: {
				S3: {
					region,
				},
			},
		});
		await expect(resolveS3ConfigAndInput(Amplify, {})).rejects.toMatchObject(
			validationErrorMap[StorageValidationErrorCode.NoBucket]
		);
	});

	it('should resolve region from S3 config', async () => {
		const { s3Config } = await resolveS3ConfigAndInput(Amplify, {});
		expect(s3Config.region).toEqual(region);
		expect(mockGetConfig).toBeCalled();
	});

	it('should throw if region is not available', async () => {
		mockGetConfig.mockReturnValueOnce({
			Storage: {
				S3: {
					bucket,
				},
			},
		});
		await expect(resolveS3ConfigAndInput(Amplify, {})).rejects.toMatchObject(
			validationErrorMap[StorageValidationErrorCode.NoRegion]
		);
	});

	it('should set customEndpoint and forcePathStyle to true if dangerouslyConnectToHttpEndpointForTesting is set from S3 config', async () => {
		mockGetConfig.mockReturnValueOnce({
			Storage: {
				S3: {
					bucket,
					region,
					dangerouslyConnectToHttpEndpointForTesting: true,
				},
			},
		});
		const { s3Config } = await resolveS3ConfigAndInput(Amplify, {});
		expect(s3Config.customEndpoint).toEqual('http://localhost:20005');
		expect(s3Config.forcePathStyle).toEqual(true);
		expect(mockGetConfig).toBeCalled();
	});

	it('should resolve isObjectLockEnabled from S3 library options', async () => {
		Amplify.libraryOptions = {
			Storage: {
				S3: {
					isObjectLockEnabled: true,
				},
			},
		};
		const { isObjectLockEnabled } = await resolveS3ConfigAndInput(Amplify, {});
		expect(isObjectLockEnabled).toEqual(true);
	});

	it('should use default prefix resolver', async () => {
		mockDefaultResolvePrefix.mockResolvedValueOnce('prefix');
		const { keyPrefix } = await resolveS3ConfigAndInput(Amplify, {});
		expect(mockDefaultResolvePrefix).toBeCalled();
		expect(keyPrefix).toEqual('prefix');
	});

	it('should use prefix resolver from S3 library options if supplied', async () => {
		const customResolvePrefix = jest.fn().mockResolvedValueOnce('prefix');
		Amplify.libraryOptions = {
			Storage: {
				S3: {
					prefixResolver: customResolvePrefix,
				},
			},
		};
		const { keyPrefix } = await resolveS3ConfigAndInput(Amplify, {});
		expect(customResolvePrefix).toBeCalled();
		expect(keyPrefix).toEqual('prefix');
		expect(mockDefaultResolvePrefix).not.toBeCalled();
	});

	it('should resolve prefix with given access level', async () => {
		mockDefaultResolvePrefix.mockResolvedValueOnce('prefix');
		const { keyPrefix } = await resolveS3ConfigAndInput(Amplify, {
			accessLevel: 'someLevel' as any,
		});
		expect(mockDefaultResolvePrefix).toBeCalledWith({
			accessLevel: 'someLevel',
			targetIdentityId,
		});
		expect(keyPrefix).toEqual('prefix');
	});

	it('should resolve prefix with default access level from S3 library options', async () => {
		mockDefaultResolvePrefix.mockResolvedValueOnce('prefix');
		Amplify.libraryOptions = {
			Storage: {
				S3: {
					defaultAccessLevel: 'someLevel' as any,
				},
			},
		};
		const { keyPrefix } = await resolveS3ConfigAndInput(Amplify, {});
		expect(mockDefaultResolvePrefix).toBeCalledWith({
			accessLevel: 'someLevel',
			targetIdentityId,
		});
		expect(keyPrefix).toEqual('prefix');
	});

	it('should resolve prefix with `guest` access level if no access level is given', async () => {
		mockDefaultResolvePrefix.mockResolvedValueOnce('prefix');
		const { keyPrefix } = await resolveS3ConfigAndInput(Amplify, {});
		expect(mockDefaultResolvePrefix).toBeCalledWith({
			accessLevel: 'guest', // default access level
			targetIdentityId,
		});
		expect(keyPrefix).toEqual('prefix');
	});
});
