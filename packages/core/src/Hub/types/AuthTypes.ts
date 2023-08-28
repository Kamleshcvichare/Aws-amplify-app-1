// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type AuthHubEventData =
	/** Dispatched when a user signs in with a oauth provider such as Google.*/
	| { event: 'signInWithRedirect' }
	/** Dispatched when there is an error in the oauth flow process.*/
	| { event: 'signInWithRedirect_failure' }
	/** Dispatched when auth tokens are successfully refreshed.*/
	| { event: 'tokenRefresh' }
	/** Dispatched when there is an error in the refresh of tokens.*/
	| { event: 'tokenRefresh_failure' };
