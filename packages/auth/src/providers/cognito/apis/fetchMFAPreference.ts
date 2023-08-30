// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FetchMFAPreferenceResult } from '../types/results';
import { getMFAType, getMFATypes } from '../utils/signInHelpers';
import { GetUserException } from '../types/errors';
import { getUser } from '../utils/clients/CognitoIdentityProvider';
import { Amplify } from '@aws-amplify/core';
import { assertUserPoolClientIdInConfig } from '@aws-amplify/core/internals/utils';
import { fetchAuthSession } from '../../../';
import { getRegion } from '../utils/clients/CognitoIdentityProvider/utils';
import { assertAuthTokens } from '../utils/types';

/**
 * Fetches the preferred MFA setting and enabled MFA settings for the user.
 * @throws  -{@link GetUserException} : error thrown when the service fails to fetch MFA preference
 * and settings.
 * @throws AuthTokenConfigException - Thrown when the token provider config is invalid.
 *
 * @returns FetchMFAPreferenceResult
 */
export async function fetchMFAPreference(): Promise<FetchMFAPreferenceResult> {
	const authConfig = Amplify.getConfig().Auth?.Cognito;
	assertUserPoolClientIdInConfig(authConfig);
	const { tokens } = await fetchAuthSession({ forceRefresh: false });
	assertAuthTokens(tokens);
	const { PreferredMfaSetting, UserMFASettingList } = await getUser(
		{ region: getRegion(authConfig.userPoolId) },
		{
			AccessToken: tokens.accessToken.toString(),
		}
	);

	return {
		preferred: getMFAType(PreferredMfaSetting),
		enabled: getMFATypes(UserMFASettingList),
	};
}
