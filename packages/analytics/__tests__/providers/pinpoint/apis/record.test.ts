import { record as pinpointRecord } from '@aws-amplify/core/internals/providers/pinpoint';
import { ConsoleLogger as Logger } from '@aws-amplify/core/internals/utils';
import { record } from '../../../../src/providers/pinpoint';
import { PinpointRecordParameters } from '../../../../src/providers/pinpoint/types/parameters';
import {
	resolveConfig,
	resolveCredentials,
} from '../../../../src/providers/pinpoint/utils';
import { AnalyticsValidationErrorCode } from '../../../../src/errors';
import { RecordParameters } from '../../../../src/types';
import {
	appId,
	identityId,
	region,
	event,
	credentials,
	config,
} from './testUtils/data';

jest.mock('../../../../src/providers/pinpoint/utils');
jest.mock('@aws-amplify/core/internals/providers/pinpoint');

describe('Pinpoint API: record', () => {
	const mockPinpointRecord = pinpointRecord as jest.Mock;
	const mockResolveConfig = resolveConfig as jest.Mock;
	const mockResolveCredentials = resolveCredentials as jest.Mock;
	const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');

	beforeEach(() => {
		mockPinpointRecord.mockReset();
		mockPinpointRecord.mockResolvedValue(undefined);
		mockResolveConfig.mockReset();
		mockResolveConfig.mockReturnValue(config);
		mockResolveCredentials.mockReset();
		mockResolveCredentials.mockResolvedValue({
			credentials,
			identityId,
		});
	});

	it('invokes the core record implementation', async () => {
		record({
			event,
		});

		expect(mockResolveCredentials).toBeCalledTimes(1);
		expect(mockResolveConfig).toBeCalledTimes(1);

		await new Promise(process.nextTick);

		expect(mockPinpointRecord).toBeCalledTimes(1);
		expect(mockPinpointRecord).toBeCalledWith({
			appId,
			category: 'Analytics',
			credentials,
			event,
			identityId,
			region,
			userAgentValue: expect.any(String),
		});
	});

	it('logs an error when credentials can not be fetched', async () => {
		mockResolveCredentials.mockRejectedValue(new Error('Mock Error'));

		record({
			event,
		});

		await new Promise(process.nextTick);

		expect(mockPinpointRecord).toBeCalledTimes(0);
		expect(loggerWarnSpy).toBeCalledWith(expect.any(String), expect.any(Error));
	});

	it('throws a validation error when no event is provided', () => {
		const mockParams = {} as RecordParameters;

		try {
			record(mockParams);
		} catch (e) {
			expect(e.name).toEqual(AnalyticsValidationErrorCode.NoEvent);
		}

		expect.assertions(1);
	});

	it('throws a validation error when event does not specify a name', () => {
		const mockParams = {
			event: {},
		};

		try {
			record(mockParams as PinpointRecordParameters);
		} catch (e) {
			expect(e.name).toEqual(AnalyticsValidationErrorCode.NoEventName);
		}

		expect.assertions(1);
	});
});
