// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { fetchTransferHandler } from '../../../src/clients/handlers/fetch';
import {
	updateEndpoint,
	UpdateEndpointInput,
	UpdateEndpointOutput,
} from '../../../src/awsClients/pinpoint';
import {
	mockApplicationId,
	mockEndpointId,
	mockEndpointRequest,
	mockFailureResponse,
	mockJsonResponse,
	mockRequestId,
	pinpointHandlerOptions,
} from '../testUtils/data';

jest.mock('../../../src/clients/handlers/fetch');

// API reference: https://docs.aws.amazon.com/pinpoint/latest/apireference/apps-application-id-endpoints-endpoint-id.html#UpdateEndpoint
describe('Pinpoint - updateEndpoint', () => {
	const MessageBody = {
		Message: 'success',
		RequestID: mockRequestId,
	};
	const params: UpdateEndpointInput = {
		ApplicationId: mockApplicationId,
		EndpointId: mockEndpointId,
		EndpointRequest: mockEndpointRequest,
	};

	test('happy case', async () => {
		const expectedRequest = expect.objectContaining({
			url: expect.objectContaining({
				href: `https://pinpoint.us-east-1.amazonaws.com/v1/apps/${mockApplicationId}/endpoints/${mockEndpointId}`,
			}),
			method: 'PUT',
			headers: expect.objectContaining({
				authorization: expect.stringContaining('Signature'),
				'content-type': 'application/json',
				host: 'pinpoint.us-east-1.amazonaws.com',
				'x-amz-date': expect.stringMatching(/^\d{8}T\d{6}Z/),
				'x-amz-user-agent': expect.stringContaining('aws-amplify'),
			}),
			body: JSON.stringify(mockEndpointRequest),
		});
		const successfulResponse = {
			status: 200,
			headers: {
				'x-amzn-requestid': mockRequestId,
			},
			body: { ...MessageBody },
		};
		const expectedOutput: UpdateEndpointOutput = {
			MessageBody,
			$metadata: expect.objectContaining({
				attempts: 1,
				requestId: mockRequestId,
				httpStatusCode: 200,
			}),
		};
		(fetchTransferHandler as jest.Mock).mockResolvedValue(
			mockJsonResponse(successfulResponse),
		);
		const response = await updateEndpoint(pinpointHandlerOptions, params);
		expect(response).toEqual(expectedOutput);
		expect(fetchTransferHandler).toHaveBeenCalledWith(
			expectedRequest,
			expect.anything(),
		);
	});

	test('error case', async () => {
		const expectedError = {
			name: 'ForbiddenException',
			message: mockFailureResponse.body.message,
		};
		(fetchTransferHandler as jest.Mock).mockResolvedValue(
			mockJsonResponse(mockFailureResponse),
		);
		expect.assertions(1);
		try {
			await updateEndpoint(pinpointHandlerOptions, params);
			fail('test should fail');
		} catch (e) {
			expect(e).toEqual(expect.objectContaining(expectedError));
		}
	});
});
