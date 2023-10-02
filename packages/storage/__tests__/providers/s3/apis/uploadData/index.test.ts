// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { upload } from '../../../../../src/providers/s3/apis';
import { MAX_OBJECT_SIZE } from '../../../../../src/providers/s3/utils/constants';
import { createUploadTask } from '../../../../../src/providers/s3/utils';
import {
	validationErrorMap,
	StorageValidationErrorCode,
} from '../../../../../src/errors/types/validation';
import { putObjectJob } from '../../../../../src/providers/s3/apis/upload/putObjectJob';
import { getMultipartUploadHandlers } from '../../../../../src/providers/s3/apis/upload/multipart';

jest.mock('../../../../../src/providers/s3/utils/');
jest.mock('../../../../../src/providers/s3/apis/upload/putObjectJob');
jest.mock('../../../../../src/providers/s3/apis/upload/multipart');

const mockCreateUploadTask = createUploadTask as jest.Mock;
const mockPutObjectJob = putObjectJob as jest.Mock;
const mockGetMultipartUploadHandlers = (
	getMultipartUploadHandlers as jest.Mock
).mockReturnValue({
	multipartUploadJob: jest.fn(),
	onPause: jest.fn(),
	onResume: jest.fn(),
	onCancel: jest.fn(),
});

describe('upload', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validation', () => {
		it('should throw if data size is too big', async () => {
			expect(() =>
				upload({
					key: 'key',
					data: { size: MAX_OBJECT_SIZE + 1 } as any,
				})
			).toThrowError(
				expect.objectContaining(
					validationErrorMap[StorageValidationErrorCode.ObjectIsTooLarge]
				)
			);
		});

		it('should NOT throw if data size is unknown', async () => {
			upload({
				key: 'key',
				data: {} as any,
			});
			expect(mockCreateUploadTask).toBeCalled();
		});

		// TODO[AllanZhengYP]: Make sure common S3 configs and input validation utility is called.
	});

	describe('use putObject', () => {
		const smallData = { size: 5 * 1024 * 1024 } as any;
		it('should use putObject if data size is <= 5MB', async () => {
			upload({
				key: 'key',
				data: smallData,
			});
			expect(mockPutObjectJob).toBeCalled();
			expect(mockGetMultipartUploadHandlers).not.toBeCalled();
		});

		it('should use uploadTask', async () => {
			mockPutObjectJob.mockReturnValueOnce('putObjectJob');
			mockCreateUploadTask.mockReturnValueOnce('uploadTask');
			const task = upload({
				key: 'key',
				data: smallData,
			});
			expect(task).toBe('uploadTask');
			expect(mockCreateUploadTask).toBeCalledWith(
				expect.objectContaining({
					job: 'putObjectJob',
					onCancel: expect.any(Function),
					isMultipartUpload: false,
				})
			);
		});
	});

	describe('use multipartUpload', () => {
		const biggerData = { size: 5 * 1024 * 1024 + 1 } as any;
		it('should use multipartUpload if data size is > 5MB', async () => {
			upload({
				key: 'key',
				data: biggerData,
			});
			expect(mockPutObjectJob).not.toBeCalled();
			expect(mockGetMultipartUploadHandlers).toBeCalled();
		});

		it('should use uploadTask', async () => {
			mockCreateUploadTask.mockReturnValueOnce('uploadTask');
			const task = upload({
				key: 'key',
				data: biggerData,
			});
			expect(task).toBe('uploadTask');
			expect(mockCreateUploadTask).toBeCalledWith(
				expect.objectContaining({
					job: expect.any(Function),
					onCancel: expect.any(Function),
					onResume: expect.any(Function),
					onPause: expect.any(Function),
					isMultipartUpload: true,
				})
			);
		});

		it('should call getMultipartUploadHandlers', async () => {
			upload({
				key: 'key',
				data: biggerData,
			});
			expect(mockGetMultipartUploadHandlers).toBeCalled();
		});
	});
});
