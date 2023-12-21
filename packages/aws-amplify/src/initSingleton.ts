// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
	Amplify,
	CookieStorage,
	LibraryOptions,
	ResourcesConfig,
	defaultStorage,
	consoleProvider,
} from '@aws-amplify/core';
import {
	LegacyConfig,
	parseAWSExports,
} from '@aws-amplify/core/internals/utils';
import {
	cognitoUserPoolsTokenProvider,
	cognitoCredentialsProvider,
} from './auth/cognito';

export const DefaultAmplify = {
	configure(
		resourceConfig: ResourcesConfig | LegacyConfig,
		libraryOptions?: LibraryOptions
	) {
		let resolvedResourceConfig: ResourcesConfig;

		// add console logger provider by default
		if (!Amplify.libraryOptions?.Logger) {
			const customProviders = libraryOptions?.Logger?.providers ?? [];
			libraryOptions = {
				...libraryOptions,
				Logger: {
					...libraryOptions?.Logger,
					providers: [consoleProvider, ...customProviders],
				},
			};
		}

		if (Object.keys(resourceConfig).some(key => key.startsWith('aws_'))) {
			resolvedResourceConfig = parseAWSExports(resourceConfig);
		} else {
			resolvedResourceConfig = resourceConfig as ResourcesConfig;
		}

		// If no Auth config is provided, no special handling will be required, configure as is.
		// Otherwise, we can assume an Auth config is provided from here on.
		if (!resolvedResourceConfig.Auth) {
			return Amplify.configure(resolvedResourceConfig, libraryOptions);
		}

		// If Auth options are provided, always just configure as is.
		// Otherwise, we can assume no Auth libraryOptions were provided from here on.
		if (libraryOptions?.Auth) {
			return Amplify.configure(resolvedResourceConfig, libraryOptions);
		}

		// If no Auth libraryOptions were previously configured, then always add default providers.
		if (!Amplify.libraryOptions.Auth) {
			cognitoUserPoolsTokenProvider.setAuthConfig(resolvedResourceConfig.Auth);
			cognitoUserPoolsTokenProvider.setKeyValueStorage(
				// TODO: allow configure with a public interface
				libraryOptions?.ssr
					? new CookieStorage({ sameSite: 'lax' })
					: defaultStorage
			);
			return Amplify.configure(resolvedResourceConfig, {
				...libraryOptions,
				Auth: {
					tokenProvider: cognitoUserPoolsTokenProvider,
					credentialsProvider: cognitoCredentialsProvider,
				},
			});
		}

		// At this point, Auth libraryOptions would have been previously configured and no overriding
		// Auth options were given, so we should preserve the currently configured Auth libraryOptions.
		if (libraryOptions) {
			// If ssr is provided through libraryOptions, we should respect the intentional reconfiguration.
			if (libraryOptions.ssr !== undefined) {
				cognitoUserPoolsTokenProvider.setKeyValueStorage(
					// TODO: allow configure with a public interface
					libraryOptions.ssr
						? new CookieStorage({ sameSite: 'lax' })
						: defaultStorage
				);
			}
			return Amplify.configure(resolvedResourceConfig, {
				Auth: Amplify.libraryOptions.Auth,
				...libraryOptions,
			});
		}

		// Finally, if there were no libraryOptions given at all, we should simply not touch the currently
		// configured libraryOptions.
		Amplify.configure(resolvedResourceConfig);
	},
	getConfig(): ResourcesConfig {
		return Amplify.getConfig();
	},
};
