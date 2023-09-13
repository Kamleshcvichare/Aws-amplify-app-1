// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	AuthConfig,
	AuthTokens,
	AuthUserPoolConfig,
	CognitoUserPoolConfig,
} from '@aws-amplify/core';

import { AuthError } from '../../../errors/AuthError';
import { CognitoAuthTokens } from '../tokenProvider/types';
import { USER_UNAUTHENTICATED_EXCEPTION } from '../../../errors/constants';

export function isTypeUserPoolConfig(
	authConfig?: AuthConfig
): authConfig is AuthUserPoolConfig {
	if (
		authConfig &&
		authConfig.Cognito.userPoolId &&
		authConfig.Cognito.userPoolClientId
	) {
		return true;
	}

	return false;
}

export function assertAuthTokens(
	tokens?: AuthTokens | null
): asserts tokens is AuthTokens {
	if (!tokens || !tokens.accessToken) {
		throw new AuthError({
			name: USER_UNAUTHENTICATED_EXCEPTION,
			message: 'User needs to be authenticated to call this API',
			recoverySuggestion:
				'Please try to sign in first before calling this API again',
		});
	}
}

export function assertIdTokenInAuthTokens(
	tokens?: AuthTokens
): asserts tokens is AuthTokens {
	if (!tokens || !tokens.idToken) {
		throw new AuthError({
			name: USER_UNAUTHENTICATED_EXCEPTION,
			message: 'User needs to be authenticated to call this API',
			recoverySuggestion:
				'Please try to sign in first before calling this API again',
		});
	}
}

export function assertAuthTokensWithRefreshToken(
	tokens?: CognitoAuthTokens | null
): asserts tokens is CognitoAuthTokens & { refreshToken: string } {
	if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
		throw new AuthError({
			name: USER_UNAUTHENTICATED_EXCEPTION,
			message: 'User needs to be authenticated to call this API',
			recoverySuggestion:
				'Please try to sign in first before calling this API again',
		});
	}
}

export const OAuthStorageKeys = {
	inflightOAuth: 'inflightOAuth',
	oauthSignIn: 'oauthSignIn',
	oauthPKCE: 'oauthPKCE',
	oauthState: 'oauthState',
};

export interface OAuthStore {
	setAuthConfig(authConfigParam: CognitoUserPoolConfig): void;
	loadOAuthInFlight(): Promise<boolean>;
	storeOAuthInFlight(inflight: boolean): Promise<void>;
	loadOAuthSignIn(): Promise<boolean>;
	storeOAuthSignIn(oauthSignIn: boolean): Promise<void>;
	loadOAuthState(): Promise<string | null>;
	storeOAuthState(state: string): Promise<void>;
	loadPKCE(): Promise<string | null>;
	storePKCE(pkce: string): Promise<void>;
	clearOAuthInflightData(): Promise<void>;
	clearOAuthData(): Promise<void>;
}
