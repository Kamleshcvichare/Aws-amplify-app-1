jest.mock('aws-sdk/clients/firehose', () => {
	const Firehose = () => {
		const firehose = null;
		return firehose;
	};

	Firehose.prototype.putRecordBatch = (params, callback) => {
		console.log('putRecordsBatch called');
		callback(null, 'data');
	};

	return Firehose;
});

import * as Firehose from 'aws-sdk/clients/firehose';
import { Credentials } from '@aws-amplify/core';
import KinesisFirehoseProvider from '../../src/Providers/AWSKinesisFirehoseProvider';

const credentials = {
	accessKeyId: 'accessKeyId',
	sessionToken: 'sessionToken',
	secretAccessKey: 'secretAccessKey',
	identityId: 'identityId',
	authenticated: true,
};

jest.useFakeTimers();

describe('kinesis firehose provider test', () => {
	describe('getCategory test', () => {
		test('happy case', () => {
			const analytics = new KinesisFirehoseProvider();

			expect(analytics.getCategory()).toBe('Analytics');
		});
	});

	describe('getProviderName test', () => {
		test('happy case', () => {
			const analytics = new KinesisFirehoseProvider();

			expect(analytics.getProviderName()).toBe('AWSKinesisFirehose');
		});
	});

	describe('configure test', () => {
		test('happy case', () => {
			const analytics = new KinesisFirehoseProvider();

			expect(analytics.configure({ region: 'region1' })).toEqual({
				bufferSize: 1000,
				flushInterval: 5000,
				flushSize: 100,
				region: 'region1',
				resendLimit: 5,
			});
		});
	});

	describe('record test', () => {
		test('record without credentials', async () => {
			const analytics = new KinesisFirehoseProvider();

			const spyon = jest
				.spyOn(Credentials, 'get')
				.mockImplementationOnce(() => {
					return Promise.reject('err');
				});

			expect(await analytics.record('params')).toBe(false);
			spyon.mockRestore();
		});

		test('record happy case', async () => {
			const analytics = new KinesisFirehoseProvider();
			analytics.configure({ region: 'region1' });

			const spyon = jest.spyOn(Firehose.prototype, 'putRecordBatch');

			jest.spyOn(Credentials, 'get').mockImplementationOnce(() => {
				return Promise.resolve(credentials);
			});

			await analytics.record({
				event: {
					data: {
						data: 'data',
					},
					streamName: 'stream',
				},
				config: {},
			});

			jest.advanceTimersByTime(6000);

			expect(spyon).toBeCalled();

			spyon.mockRestore();
		});
	});
});
