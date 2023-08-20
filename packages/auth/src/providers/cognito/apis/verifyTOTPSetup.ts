// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AuthValidationErrorCode } from '../../../errors/types/validation';
import { assertValidationError } from '../../../errors/utils/assertValidationError';
import { VerifyTOTPSetupRequest } from '../../../types/requests';
import { CogntioVerifyTOTPSetupOptions } from '../types/options';
import { verifySoftwareToken } from '../utils/clients/CognitoIdentityProvider';
import { VerifySoftwareTokenException } from '../types/errors';
import { AmplifyV6 } from '@aws-amplify/core';
import { assertTokenProviderConfig } from '@aws-amplify/core/internals/library-utils';
import { fetchAuthSession } from '../../../';
import { getRegion } from '../utils/clients/CognitoIdentityProvider/utils';
import { assertAuthTokens } from '../utils/types';

/**
 * Verifies an OTP code retrieved from an associated authentication app.
 *
 * @param verifyTOTPSetupRequest - The VerifyTOTPSetupRequest
 *
 * @throws  -{@link VerifySoftwareTokenException }:
 * Thrown due to an invalid MFA token.
 *
 * @throws  -{@link AuthValidationErrorCode }:
 * Thrown when `code` is not defined.
 *
 * @throws AuthTokenConfigException - Thrown when the token provider config is invalid.
 */
export async function verifyTOTPSetup(
	verifyTOTPSetupRequest: VerifyTOTPSetupRequest<CogntioVerifyTOTPSetupOptions>
): Promise<void> {
	const authConfig = AmplifyV6.getConfig().Auth;
	assertTokenProviderConfig(authConfig);
	const { code, options } = verifyTOTPSetupRequest;
	assertValidationError(
		!!code,
		AuthValidationErrorCode.EmptyVerifyTOTPSetupCode
	);
	const { tokens } = await fetchAuthSession({ forceRefresh: false });
	assertAuthTokens(tokens);
	await verifySoftwareToken(
		{ region: getRegion(authConfig.userPoolId) },
		{
			AccessToken: tokens.accessToken.toString(),
			UserCode: code,
			FriendlyDeviceName: options?.serviceOptions?.friendlyDeviceName,
		}
	);
}
