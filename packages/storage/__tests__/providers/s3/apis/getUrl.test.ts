// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getUrl } from '../../../../src/providers/s3/apis';
import { Credentials } from '@aws-sdk/types';
import {
	Amplify,
	StorageAccessLevel,
	fetchAuthSession,
} from '@aws-amplify/core';
import {
	getPresignedGetObjectUrl,
	headObject,
} from '../../../../src/providers/s3/utils/client';
import { StorageOptions } from '../../../../src/types';
import { buildClientRequestKey } from './__utils__/buildClientRequestKey';

jest.mock('../../../../src/providers/s3/utils/client');
jest.mock('@aws-amplify/core', () => ({
	fetchAuthSession: jest.fn(),
	Amplify: {
		getConfig: jest.fn(),
	},
}));

const bucket = 'bucket';
const region = 'region';
const mockFetchAuthSession = fetchAuthSession as jest.Mock;
const mockGetConfig = Amplify.getConfig as jest.Mock;
const credentials: Credentials = {
	accessKeyId: 'accessKeyId',
	sessionToken: 'sessionToken',
	secretAccessKey: 'secretAccessKey',
};
const targetIdentityId = 'targetIdentityId';

describe('getUrl test', () => {
	beforeAll(() => {
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
	});
	describe('getUrl happy path', () => {
		const config = {
			credentials,
			region: 'region',
		};
		const key = 'key';
		beforeEach(() => {
			(headObject as jest.Mock).mockImplementation(() => {
				return {
					Key: 'key',
					ContentLength: '100',
					ContentType: 'text/plain',
					ETag: 'etag',
					LastModified: 'last-modified',
					Metadata: { key: 'value' },
				};
			});
			(getPresignedGetObjectUrl as jest.Mock).mockReturnValueOnce({
				url: new URL('https://google.com'),
			});
		});
		afterEach(() => {
			jest.clearAllMocks();
		});
		it.each([
			{
				accessLevel: 'guest',
			},
			{
				accessLevel: 'protected',
			},
			{
				accessLevel: 'private',
			},
		])('getUrl with $options.accessLevel', async ({ accessLevel }) => {
			const headObjectOptions = {
				Bucket: 'bucket',
				Key: buildClientRequestKey(
					key,
					'destination',
					accessLevel as StorageAccessLevel
				),
			};
			const options =
				accessLevel === 'protected'
					? {
							accessLevel,
							targetIdentityId,
							validateObjectExistence: true,
					  }
					: {
							accessLevel,
							validateObjectExistence: true,
					  };
			expect.assertions(4);
			const result = await getUrl({
				key,
				options: options as StorageOptions,
			});
			expect(getPresignedGetObjectUrl).toBeCalledTimes(1);
			expect(headObject).toBeCalledTimes(1);
			expect(headObject).toHaveBeenCalledWith(config, headObjectOptions);
			expect(result.url).toEqual({
				url: new URL('https://google.com'),
			});
		});
	});
	describe('getUrl error path', () => {
		afterAll(() => {
			jest.clearAllMocks();
		});
		it('Should return not found error when the object is not found', async () => {
			(headObject as jest.Mock).mockImplementation(() =>
				Object.assign(new Error(), {
					$metadata: { httpStatusCode: 404 },
					name: 'NotFound',
				})
			);
			try {
				await getUrl({
					key: 'invalid_key',
					options: { validateObjectExistence: true },
				});
			} catch (error) {
				expect.assertions(2);
				expect(headObject).toBeCalledTimes(1);
				expect(error.$metadata?.httpStatusCode).toBe(404);
			}
		});
	});
});
