// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
	AWSCredentialsAndIdentityId,
	AuthConfig,
	AuthSession,
	AuthTokens,
	FetchAuthSessionOptions,
	LibraryAuthOptions,
} from './types';
import { asserts } from '../../Util/errors/AssertError';
import { AUTH_CONFING_EXCEPTION } from '../../Util/Constants';

export function isTokenExpired({
	expiresAt,
	clockDrift,
}: {
	expiresAt: number;
	clockDrift: number;
}): boolean {
	const currentTime = Date.now();
	return currentTime + clockDrift > expiresAt;
}

export class AuthClass {
	private authConfig?: AuthConfig;
	private authOptions?: LibraryAuthOptions;

	constructor() {}

	/**
	 * Configure Auth category
	 *
	 * @internal
	 *
	 * @param authResourcesConfig - Resources configurations required by Auth providers.
	 * @param authOptions - Client options used by library
	 *
	 * @returns void
	 */
	configure(
		authResourcesConfig: AuthConfig,
		authOptions?: LibraryAuthOptions
	): void {
		this.authConfig = authResourcesConfig;
		this.authOptions = authOptions;
	}

	async fetchAuthSession(
		options: FetchAuthSessionOptions = {}
	): Promise<AuthSession> {
		let tokens: AuthTokens | undefined;
		let credentialsAndIdentityId: AWSCredentialsAndIdentityId | undefined;
		let userSub: string | undefined;

		asserts(!!this.authConfig, {
			name: AUTH_CONFING_EXCEPTION,
			message: 'AuthConfig is required',
			recoverySuggestion:
				'call Amplify.configure in your app with a valid AuthConfig',
		});

		// Get tokens will throw if session cannot be refreshed (network or service error) or return null if not available
		tokens =
			(await this.authOptions?.tokenProvider?.getTokens(options)) ?? undefined;

		if (tokens) {
			userSub = tokens.accessToken?.payload?.sub;

			// getCredentialsAndIdentityId will throw if cannot get credentials (network or service error)
			credentialsAndIdentityId =
				await this.authOptions?.credentialsProvider?.getCredentialsAndIdentityId(
					{
						authConfig: this.authConfig,
						tokens,
						authenticated: true,
						forceRefresh: options.forceRefresh,
					}
				);
		} else if (this.authConfig.Cognito.allowGuestAccess) {
			// getCredentialsAndIdentityId will throw if cannot get credentials (network or service error)
			credentialsAndIdentityId =
				await this.authOptions?.credentialsProvider?.getCredentialsAndIdentityId(
					{
						authConfig: this.authConfig,
						authenticated: false,
						forceRefresh: options.forceRefresh,
					}
				);
		}

		return {
			tokens,
			credentials: credentialsAndIdentityId?.credentials,
			identityId: credentialsAndIdentityId?.identityId,
			userSub,
		};
	}

	async clearCredentials(): Promise<void> {
		if (this.authOptions?.credentialsProvider) {
			return await this.authOptions.credentialsProvider.clearCredentials();
		}
	}
}
