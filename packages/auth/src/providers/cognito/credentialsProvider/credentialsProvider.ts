// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { cognitoIdentityIdProvider } from './IdentityIdProvider';
import {
	AuthTokens,
	AWSCredentialsAndIdentityIdProvider,
	AWSCredentialsAndIdentityId,
	getCredentialsForIdentity,
	GetCredentialsOptions,
} from '@aws-amplify/core';
import {
	Logger,
	assertIdentityPooIdConfig,
	decodeJWT,
	CognitoIdentityPoolConfig,
} from '@aws-amplify/core/internals/utils';
import { AuthError } from '../../../errors/AuthError';
import { IdentityIdStore } from './types';
import { getRegionFromIdentityPoolId } from '../utils/clients/CognitoIdentityProvider/utils';
import { assertIdTokenInAuthTokens } from '../utils/types';

const logger = new Logger('CognitoCredentialsProvider');
const CREDENTIALS_TTL = 50 * 60 * 1000; // 50 min, can be modified on config if required in the future

export class CognitoAWSCredentialsAndIdentityIdProvider
	implements AWSCredentialsAndIdentityIdProvider
{
	constructor(identityIdStore: IdentityIdStore) {
		this._identityIdStore = identityIdStore;
	}

	private _identityIdStore: IdentityIdStore;

	private _credentialsAndIdentityId?: AWSCredentialsAndIdentityId & {
		isAuthenticatedCreds: boolean;
		idTokenAssociated?: string;
	};
	private _nextCredentialsRefresh: number = 0;

	async clearCredentialsAndIdentityId(): Promise<void> {
		logger.debug('Clearing out credentials and identityId');
		this._credentialsAndIdentityId = undefined;
		await this._identityIdStore.clearIdentityId();
	}

	async clearCredentials(): Promise<void> {
		logger.debug('Clearing out in-memory credentials');
		this._credentialsAndIdentityId = undefined;
	}

	async getCredentialsAndIdentityId(
		getCredentialsOptions: GetCredentialsOptions
	): Promise<AWSCredentialsAndIdentityId | undefined> {
		const isAuthenticated = getCredentialsOptions.authenticated;
		const tokens = getCredentialsOptions.tokens;
		const authConfig = getCredentialsOptions.authConfig;
		try {
			assertIdentityPooIdConfig(authConfig?.Cognito);
		} catch {
			// No identity pool configured, skipping
			return;
		}

		if (!isAuthenticated && !authConfig.Cognito.allowGuestAccess) {
			// TODO(V6): return partial result like Native platforms
			return;
		}

		const forceRefresh = getCredentialsOptions.forceRefresh;
		const tokenHasChanged = this.hasTokenChanged(tokens);
		const identityId = await cognitoIdentityIdProvider({
			tokens,
			authConfig: authConfig.Cognito,
			identityIdStore: this._identityIdStore,
		});

		if (!identityId) {
			throw new AuthError({
				name: 'IdentityIdConfigException',
				message: 'No Cognito Identity Id provided',
				recoverySuggestion: 'Make sure to pass a valid identityId.',
			});
		}

		if (forceRefresh || tokenHasChanged) {
			this.clearCredentials();
		}
		if (!isAuthenticated) {
			return this.getGuestCredentials(identityId, authConfig.Cognito);
		} else {
			assertIdTokenInAuthTokens(tokens);
			// Tokens will always be present if getCredentialsOptions.authenticated is true as dictated by the type
			return this.credsForOIDCTokens(authConfig.Cognito, tokens!, identityId);
		}
	}

	private async getGuestCredentials(
		identityId: string,
		authConfig: CognitoIdentityPoolConfig
	): Promise<AWSCredentialsAndIdentityId> {
		if (
			this._credentialsAndIdentityId &&
			!this.isPastTTL() &&
			this._credentialsAndIdentityId.isAuthenticatedCreds === false
		) {
			logger.info(
				'returning stored credentials as they neither past TTL nor expired.'
			);
			return this._credentialsAndIdentityId;
		}

		// Clear to discard if any authenticated credentials are set and start with a clean slate
		this.clearCredentials();

		// use identityId to obtain guest credentials
		// save credentials in-memory
		// No logins params should be passed for guest creds:
		// https://docs.aws.amazon.com/cognitoidentity/latest/APIReference/API_GetCredentialsForIdentity.html
		const region = getRegionFromIdentityPoolId(authConfig.identityPoolId);

		const clientResult = await getCredentialsForIdentity(
			{ region },
			{
				IdentityId: identityId,
			}
		);

		if (
			clientResult.Credentials &&
			clientResult.Credentials.AccessKeyId &&
			clientResult.Credentials.SecretKey
		) {
			this._nextCredentialsRefresh = new Date().getTime() + CREDENTIALS_TTL;
			const res: AWSCredentialsAndIdentityId = {
				credentials: {
					accessKeyId: clientResult.Credentials.AccessKeyId,
					secretAccessKey: clientResult.Credentials.SecretKey,
					sessionToken: clientResult.Credentials.SessionToken,
					expiration: clientResult.Credentials.Expiration,
				},
				identityId,
			};
			const identityIdRes = clientResult.IdentityId;
			if (identityIdRes) {
				res.identityId = identityIdRes;
				this._identityIdStore.storeIdentityId({
					id: identityIdRes,
					type: 'guest',
				});
			}
			this._credentialsAndIdentityId = {
				...res,
				isAuthenticatedCreds: false,
			};

			return res;
		} else {
			throw new AuthError({
				name: 'CredentialsException',
				message: `Cognito did not respond with either Credentials, AccessKeyId or SecretKey.`,
			});
		}
	}

	private async credsForOIDCTokens(
		authConfig: CognitoIdentityPoolConfig,
		authTokens: AuthTokens,
		identityId?: string
	): Promise<AWSCredentialsAndIdentityId> {
		if (
			this._credentialsAndIdentityId &&
			!this.isPastTTL() &&
			this._credentialsAndIdentityId.isAuthenticatedCreds === true
		) {
			logger.debug(
				'returning stored credentials as they neither past TTL nor expired'
			);
			return this._credentialsAndIdentityId;
		}

		// Clear to discard if any unauthenticated credentials are set and start with a clean slate
		this.clearCredentials();

		const logins = authTokens.idToken
			? formLoginsMap(authTokens.idToken.toString())
			: {};

		const region = getRegionFromIdentityPoolId(authConfig.identityPoolId);

		const clientResult = await getCredentialsForIdentity(
			{ region },
			{
				IdentityId: identityId,
				Logins: logins,
			}
		);

		if (
			clientResult.Credentials &&
			clientResult.Credentials.AccessKeyId &&
			clientResult.Credentials.SecretKey
		) {
			const res: AWSCredentialsAndIdentityId = {
				credentials: {
					accessKeyId: clientResult.Credentials.AccessKeyId,
					secretAccessKey: clientResult.Credentials.SecretKey,
					sessionToken: clientResult.Credentials.SessionToken,
					expiration: clientResult.Credentials.Expiration,
				},
				identityId,
			};
			// Store the credentials in-memory along with the expiration
			this._credentialsAndIdentityId = {
				...res,
				isAuthenticatedCreds: true,
				idTokenAssociated: authTokens.idToken?.toString(),
			};
			this._nextCredentialsRefresh = new Date().getTime() + CREDENTIALS_TTL;

			const identityIdRes = clientResult.IdentityId;
			if (identityIdRes) {
				res.identityId = identityIdRes;
				this._identityIdStore.storeIdentityId({
					id: identityIdRes,
					type: 'primary',
				});
			}
			return res;
		} else {
			throw new AuthError({
				name: 'CredentialsException',
				message: `Cognito did not respond with either Credentials, AccessKeyId or SecretKey.`,
			});
		}
	}

	private isPastTTL(): boolean {
		return this._nextCredentialsRefresh === undefined
			? true
			: this._nextCredentialsRefresh <= Date.now();
	}
	private hasTokenChanged(tokens?: AuthTokens): boolean {
		return (
			!!tokens &&
			!!this._credentialsAndIdentityId?.idTokenAssociated &&
			tokens.idToken?.toString() !==
				this._credentialsAndIdentityId.idTokenAssociated
		);
	}
}

export function formLoginsMap(idToken: string) {
	const issuer = decodeJWT(idToken).payload.iss;
	const res: Record<string, string> = {};
	if (!issuer) {
		throw new AuthError({
			name: 'InvalidIdTokenException',
			message: 'Invalid Idtoken',
		});
	}
	let domainName: string = issuer.replace(/(^\w+:|^)\/\//, '');

	res[domainName] = idToken;
	return res;
}
