// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { TransferTaskState } from '../../src/types/common';
import { createDownloadTask } from '../../src/providers/s3/utils';

describe('createDownloadTask', () => {
	it('should create a download task', async () => {
		const task = createDownloadTask({
			job: jest.fn().mockResolvedValueOnce('test'),
			onCancel: jest.fn(),
		});
		expect(task.state).toBe(TransferTaskState.IN_PROGRESS);
		expect(await task.result).toEqual('test');
	});

	it('should set status to canceled after calling cancel', () => {
		const task = createDownloadTask({
			job: jest.fn(),
			onCancel: jest.fn(),
		});
		task.cancel();
		expect(task.state).toBe(TransferTaskState.CANCELED);
	});

	it('should set overwriting abort error to the onCancel callback', () => {
		const onCancel = jest.fn();
		const task = createDownloadTask({
			job: jest.fn(),
			onCancel,
		});
		const customError = new Error('Custom Error');
		task.cancel(customError);
		expect(task.state).toBe(TransferTaskState.CANCELED);
		expect(onCancel).toHaveBeenCalledWith(customError);
	});

	it('should set status to error after calling error', async () => {
		expect.assertions(2);
		const rejectedError = new Error('rejected');
		const task = createDownloadTask({
			job: jest.fn().mockRejectedValueOnce(rejectedError),
			onCancel: jest.fn(),
		});
		try {
			await task.result;
		} catch (e) {
			expect(e).toBe(rejectedError);
			expect(task.state).toBe(TransferTaskState.ERROR);
		}
	});

	it('should set status to completed after calling complete', async () => {
		const task = createDownloadTask({
			job: jest.fn(),
			onCancel: jest.fn(),
		});
		await task.result;
		expect(task.state).toBe(TransferTaskState.SUCCESS);
	});

	it.each([
		TransferTaskState.CANCELED,
		TransferTaskState.ERROR,
		TransferTaskState.SUCCESS,
	])(
		'should not call the onCancel callback if the task is already in status of %s',
		async state => {
			const onCancel = jest.fn();
			const task = createDownloadTask({
				job: jest.fn(),
				onCancel,
			});
			// TODO[AllanZhengYP]: Use ts-expect-error instead after upgrading Jest.
			// @ts-ignore
			task.state = state;
			task.cancel();
			expect(onCancel).not.toHaveBeenCalled();
			expect(task.state).toBe(state);
		}
	);
});
