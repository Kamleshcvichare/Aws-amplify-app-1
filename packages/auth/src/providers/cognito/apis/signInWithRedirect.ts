// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AmplifyV6, Hub, LocalStorage, OAuthConfig } from '@aws-amplify/core';
import {
	AmplifyError,
	assertOAuthConfig,
	urlSafeEncode,
	USER_AGENT_HEADER,
} from '@aws-amplify/core/internals/utils';
import { SignInWithRedirectRequest } from '../../../types/requests';
import { cacheCognitoTokens } from '../tokenProvider/cacheTokens';
import { CognitoUserPoolsTokenProvider } from '../tokenProvider';
import {
	generateChallenge,
	generateRandom,
	generateState,
} from '../utils/signInWithRedirectHelpers';
import { cognitoHostedUIIdentityProviderMap } from '../types/models';
import { DefaultOAuthStore } from '../utils/signInWithRedirectStore';
import { AuthError } from '../../../Errors';
import { AuthErrorTypes } from '../../../types';

const SELF = '_self';

/**
 * Signs in a user with OAuth. Redirects the application to an Identity Provider.
 *
 * @param signInRedirectRequest - The SignInRedirectRequest object, if empty it will redirect to Cognito HostedUI
 *
 * TODO: add config errors
 */
export function signInWithRedirect(
	signInWithRedirectRequest?: SignInWithRedirectRequest
): void {
	const authConfig = AmplifyV6.getConfig().Auth;
	assertOAuthConfig(authConfig);

	let provider = 'COGNITO'; // Default

	if (typeof signInWithRedirectRequest?.provider === 'string') {
		provider =
			cognitoHostedUIIdentityProviderMap[signInWithRedirectRequest.provider];
	} else if (signInWithRedirectRequest?.provider?.custom) {
		provider = signInWithRedirectRequest.provider.custom;
	}

	oauthSignIn({
		oauthConfig: authConfig.oauth,
		clientId: authConfig.userPoolWebClientId,
		provider,
		customState: signInWithRedirectRequest?.customState,
	});
}

const store = new DefaultOAuthStore(LocalStorage);

function oauthSignIn({
	oauthConfig,
	provider,
	clientId,
	customState,
}: {
	oauthConfig: OAuthConfig;
	provider: string;
	clientId: string;
	customState?: string;
}) {
	const generatedState = generateState(32);

	/* encodeURIComponent is not URL safe, use urlSafeEncode instead. Cognito 
	single-encodes/decodes url on first sign in and double-encodes/decodes url
	when user already signed in. Using encodeURIComponent, Base32, Base64 add 
	characters % or = which on further encoding becomes unsafe. '=' create issue 
	for parsing query params. 
	Refer: https://github.com/aws-amplify/amplify-js/issues/5218 */
	const state = customState
		? `${generatedState}-${urlSafeEncode(customState)}`
		: generatedState;

	store.storeOAuthInFlight(true);
	store.storeOAuthState(state);

	const pkce_key = generateRandom(128);
	store.storePKCE(pkce_key);

	const code_challenge = generateChallenge(pkce_key);
	const code_challenge_method = 'S256';

	const scopesString = oauthConfig.scopes.join(' ');

	const queryString = Object.entries({
		redirect_uri: oauthConfig.redirectSignIn,
		response_type: oauthConfig.responseType,
		client_id: clientId,
		identity_provider: provider,
		scope: scopesString,
		state,
		...(oauthConfig.responseType === 'code' ? { code_challenge } : {}),
		...(oauthConfig.responseType === 'code' ? { code_challenge_method } : {}),
	})
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join('&');

	const URL = `https://${oauthConfig.domain}/oauth2/authorize?${queryString}`;
	window.open(URL, SELF);
}

async function handleCodeFlow({
	currentUrl,
	userAgentValue,
	clientId,
	redirectUri,
	domain,
}: {
	currentUrl: string;
	userAgentValue?: string;
	clientId: string;
	redirectUri: string;
	domain: string;
}) {
	/* Convert URL into an object with parameters as keys
{ redirect_uri: 'http://localhost:3000/', response_type: 'code', ...} */
	const url = new URL(currentUrl);
	try {
		await validateStateFromURL(url);
	} catch (err) {
		resolveInflight();

		resolveInflight = () => {};
		// clear temp values
		await store.clearOAuthInflightData();
		return;
	}
	const code = url.searchParams.get('code');

	const currentUrlPathname = url.pathname || '/';
	const redirectUriPathname = new URL(redirectUri).pathname || '/';

	if (!code || currentUrlPathname !== redirectUriPathname) {
		return;
	}

	const oAuthTokenEndpoint = 'https://' + domain + '/oauth2/token';

	// TODO(v6): check hub events
	// dispatchAuthEvent(
	// 	'codeFlow',
	// 	{},
	// 	`Retrieving tokens from ${oAuthTokenEndpoint}`
	// );

	const code_verifier = await store.loadPKCE();

	const oAuthTokenBody = {
		grant_type: 'authorization_code',
		code,
		client_id: clientId,
		redirect_uri: redirectUri,
		...(code_verifier ? { code_verifier } : {}),
	};

	const body = Object.entries(oAuthTokenBody)
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join('&');

	const {
		access_token,
		refresh_token,
		id_token,
		error,
		token_type,
		expires_in,
	} = await (
		(await fetch(oAuthTokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				[USER_AGENT_HEADER]: userAgentValue,
			},
			body,
		})) as any
	).json();

	if (error) {
		resolveInflight();
		resolveInflight = () => {};

		throw new AuthError(AuthErrorTypes.OAuthSignInError, error);
	}

	// clear temp values
	store.clearOAuthInflightData();

	await cacheCognitoTokens({
		AccessToken: access_token,
		IdToken: id_token,
		RefreshToken: refresh_token,
		TokenType: token_type,
		ExpiresIn: expires_in,
	});

	// clear history

	if (window && typeof window.history !== 'undefined') {
		window.history.replaceState({}, null, redirectUri);
	}
	// this communicates Token orchestrator de flow was completed
	resolveInflight();

	resolveInflight = () => {};
	return;
}

async function handleImplicitFlow({
	currentUrl,
	redirectUri,
}: {
	currentUrl: string;
	redirectUri: string;
}) {
	// hash is `null` if `#` doesn't exist on URL

	const url = new URL(currentUrl);

	const { id_token, access_token, state, token_type, expires_in } = (
		url.hash || '#'
	)
		.substr(1) // Remove # from returned code
		.split('&')
		.map(pairings => pairings.split('='))
		.reduce((accum, [k, v]) => ({ ...accum, [k]: v }), {
			id_token: undefined,
			access_token: undefined,
			state: undefined,
			token_type: undefined,
			expires_in: undefined,
		});

	try {
		await validateState(state);
	} catch (error) {
		store.clearOAuthInflightData();

		resolveInflight();

		resolveInflight = () => {};
		return;
	} finally {
	}

	await cacheCognitoTokens({
		AccessToken: access_token,
		IdToken: id_token,
		RefreshToken: undefined,
		TokenType: token_type,
		ExpiresIn: expires_in,
	});

	// clear history

	if (window && typeof window.history !== 'undefined') {
		window.history.replaceState({}, null, redirectUri);
	}

	resolveInflight();

	resolveInflight = () => {};
}

async function handleAuthResponse({
	currentUrl,
	userAgentValue,
	clientId,
	redirectUri,
	responseType,
	domain,
}: {
	currentUrl?: string;
	userAgentValue?: string;
	clientId: string;
	redirectUri: string;
	responseType: string;
	domain: string;
}) {
	try {
		const urlParams = new URL(currentUrl);
		const error = urlParams.searchParams.get('error');
		const error_description = urlParams.searchParams.get('error_description');

		if (error) {
			throw new AuthError(AuthErrorTypes.OAuthSignInError, error_description);
		}

		if (responseType === 'code') {
			return await handleCodeFlow({
				currentUrl,
				userAgentValue,
				clientId,
				redirectUri,
				domain,
			});
		} else {
			return await handleImplicitFlow({
				currentUrl,
				redirectUri,
			});
		}
	} catch (e) {
		throw e;
	}
}

async function validateStateFromURL(urlParams: URL): Promise<string> {
	if (!urlParams) {
		return;
	}
	const returnedState = urlParams.searchParams.get('state');

	await validateState(returnedState);
	return returnedState;
}

async function validateState(state: string) {
	const savedState = await store.loadOAuthState();

	// This is because savedState only exists if the flow was initiated by Amplify
	if (savedState && savedState !== state) {
		throw new AmplifyError({
			name: '',
			message: '',
			recoverySuggestion: '',
		});
	}
}

function urlListener() {
	// Listen configure to parse url
	// TODO(v6): what happens if configure gets called multiple times during code exchange
	Hub.listen('core', async capsule => {
		if (capsule.payload.event === 'configure') {
			const authConfig = AmplifyV6.getConfig().Auth;
			store.setAuthConfig(authConfig);

			// No OAuth inflight doesnt need to parse the url
			if (!(await store.loadOAuthInFlight())) {
				return;
			}
			try {
				assertOAuthConfig(authConfig);
			} catch (err) {
				// TODO(v6): this should warn you have signInWithRedirect but is not configured
				return;
			}

			try {
				const url = window.location.href;

				handleAuthResponse({
					currentUrl: url,
					clientId: authConfig.userPoolWebClientId,
					domain: authConfig.oauth.domain,
					redirectUri: authConfig.oauth.redirectSignIn,
					responseType: authConfig.oauth.responseType,
				});
			} catch (err) {
				// is ok if there is not OAuthConfig
			}
		}
	});
}

urlListener();

// This has a reference for listeners that requires to be notified, TokenOrchestrator use this for load tokens
let resolveInflight = () => {};

CognitoUserPoolsTokenProvider.setWaitForInflightOAuth(
	() =>
		new Promise(async (res, _rej) => {
			if (!(await store.loadOAuthInFlight())) {
				res();
			} else {
				resolveInflight = res;
			}
			return;
		})
);
