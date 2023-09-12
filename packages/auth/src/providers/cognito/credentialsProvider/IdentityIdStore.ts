// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	AuthConfig,
	Identity,
	KeyValueStorageInterface,
} from '@aws-amplify/core';
import {
	Logger,
	assertIdentityPooIdConfig,
} from '@aws-amplify/core/internals/utils';
import { IdentityIdStorageKeys, IdentityIdStore } from './types';
import { AuthError } from '../../../errors/AuthError';
import { getAuthStorageKeys } from '../tokenProvider/TokenStore';
import { AuthKeys } from '../tokenProvider/types';

const logger = new Logger('DefaultIdentityIdStore');

export class DefaultIdentityIdStore implements IdentityIdStore {
	keyValueStorage: KeyValueStorageInterface;
	authConfig?: AuthConfig;

	// Used as in-memory storage
	_primaryIdentityId: string | undefined;
	_authKeys: AuthKeys<string> = {};
	setAuthConfig(authConfigParam: AuthConfig) {
		assertIdentityPooIdConfig(authConfigParam.Cognito);
		this.authConfig = authConfigParam;
		this._authKeys = createKeysForAuthStorage(
			'Cognito',
			authConfigParam.Cognito.identityPoolId
		);
		return;
	}

	constructor(keyValueStorage: KeyValueStorageInterface) {
		this.keyValueStorage = keyValueStorage;
	}

	async loadIdentityId(): Promise<Identity | null> {
		assertIdentityPooIdConfig(this.authConfig?.Cognito);
		// TODO(v6): migration logic should be here
		try {
			if (!!this._primaryIdentityId) {
				return {
					id: this._primaryIdentityId,
					type: 'primary',
				};
			} else {
				const storedIdentityId = await this.keyValueStorage.getItem(
					this._authKeys.identityId
				);
				if (!!storedIdentityId) {
					return {
						id: storedIdentityId,
						type: 'guest',
					};
				}
				return null;
			}
		} catch (err) {
			// TODO(v6): validate partial results with mobile implementation
			logger.error(`Error loading identityId from storage: ${err}`);
			return null;
		}
	}

	async storeIdentityId(identity: Identity): Promise<void> {
		assertIdentityPooIdConfig(this.authConfig?.Cognito);

		if (identity.type === 'guest') {
			this.keyValueStorage.setItem(this._authKeys.identityId, identity.id);
			// Clear in-memory storage of primary identityId
			this._primaryIdentityId = undefined;
		} else {
			this._primaryIdentityId = identity.id;
			// Clear locally stored guest id
			this.keyValueStorage.removeItem(this._authKeys.identityId);
		}
	}

	async clearIdentityId(): Promise<void> {
		this._primaryIdentityId = undefined;
		await Promise.all([
			this.keyValueStorage.removeItem(this._authKeys.identityId),
		]);
	}
}

const createKeysForAuthStorage = (provider: string, identifier: string) => {
	return getAuthStorageKeys(IdentityIdStorageKeys)(
		`com.amplify.${provider}`,
		identifier
	);
};
