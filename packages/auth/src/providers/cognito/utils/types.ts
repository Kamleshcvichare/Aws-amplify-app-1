// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AuthConfig, AuthTokens, AuthUserPoolConfig } from '@aws-amplify/core';

import { AuthError } from '../../../errors/AuthError';
import { CognitoUserPoolConfig } from '@aws-amplify/core';

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
	tokens?: AuthTokens
): asserts tokens is AuthTokens {
	if (!tokens || !tokens.accessToken) {
		throw new AuthError({
			name: 'Invalid Auth Tokens',
			message: 'No Auth Tokens were found',
		});
	}
}

export function assertIdTokenInAuthTokens(
	tokens?: AuthTokens
): asserts tokens is AuthTokens {
	if (!tokens || !tokens.idToken) {
		throw new AuthError({
			name: 'IdToken not present in Auth Tokens',
			message: 'No IdToken in Auth Tokens',
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
	loadOAuthState(): Promise<string>;
	storeOAuthState(state: string): Promise<void>;
	loadPKCE(): Promise<string>;
	storePKCE(pkce: string): Promise<void>;
	clearOAuthInflightData(): Promise<void>;
	clearOAuthData(): Promise<void>;
}
