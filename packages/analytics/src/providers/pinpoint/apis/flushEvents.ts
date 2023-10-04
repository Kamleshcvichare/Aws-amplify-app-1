// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { resolveConfig, resolveCredentials } from '../utils';
import { flushEvents as flushEventsCore } from '@aws-amplify/core/internals/providers/pinpoint';
import { ConsoleLogger } from '@aws-amplify/core/internals/utils';

const logger = new ConsoleLogger('Analytics');

/**
 * Flushes all buffered Pinpoint events to the service.
 *
 * @note
 * This API will make a best-effort attempt to flush events from the buffer. Events recorded immediately after invoking
 * this API may not be included in the flush.
 */
export const flushEvents = () => {
	const { appId, region } = resolveConfig();
	resolveCredentials()
		.then(({ credentials, identityId }) =>
			flushEventsCore(appId, region, credentials, identityId)
		)
		.catch(e => logger.warn('Failed to flush events', e));
};
