// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Amplify } from '@aws-amplify/core';
import { assertTokenProviderConfig } from '@aws-amplify/core/internals/utils';
import { fetchAuthSession } from '../../..';
import {
	// AuthCodeDeliveryDetails,
	// AuthStandardAttributeKey,
	AuthDeliveryMedium,
} from '../../../types';
import {
	SendUserAttributeVerificationCodeInput,
	SendUserAttributeVerificationCodeOutput,
} from '../types';
import { getUserAttributeVerificationCode } from '../utils/clients/CognitoIdentityProvider';
import { assertAuthTokens } from '../utils/types';
import { getRegion } from '../utils/clients/CognitoIdentityProvider/utils';
import { GetUserAttributeVerificationException } from '../types/errors';

/**
 * Resends user's confirmation code when updating attributes while authenticated.
 *
 * @param input - The SendUserAttributeVerificationCodeInput object
 * @returns SendUserAttributeVerificationCodeOutput
 * @throws - {@link GetUserAttributeVerificationException}
 * @throws AuthTokenConfigException - Thrown when the token provider config is invalid.
 */
export const sendUserAttributeVerificationCode = async (
	input: SendUserAttributeVerificationCodeInput
): Promise<SendUserAttributeVerificationCodeOutput> => {
	const { userAttributeKey, options } = input;
	const authConfig = Amplify.getConfig().Auth?.Cognito;
	const clientMetadata = options?.serviceOptions?.clientMetadata;
	assertTokenProviderConfig(authConfig);
	const { tokens } = await fetchAuthSession({ forceRefresh: false });
	assertAuthTokens(tokens);
	const { CodeDeliveryDetails } = await getUserAttributeVerificationCode(
		{ region: getRegion(authConfig.userPoolId) },
		{
			AccessToken: tokens.accessToken.toString(),
			ClientMetadata: clientMetadata,
			AttributeName: userAttributeKey,
		}
	);
	const { DeliveryMedium, AttributeName, Destination } = {
		...CodeDeliveryDetails,
	};
	return {
		destination: Destination,
		deliveryMedium: DeliveryMedium as AuthDeliveryMedium,
		attributeName: AttributeName,
	};
};
