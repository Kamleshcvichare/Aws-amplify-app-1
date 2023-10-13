// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SessionTracker from '../../../sessionTracker';
import { InAppMessage, InAppMessagingEvent } from '../../../types';
import { addEventListener } from '../../../../common';
import { recordAnalyticsEvent } from '../utils/helpers';
import { PinpointMessageEvent } from '../types';
import { Hub, HubCapsule } from '@aws-amplify/core';
import { dispatchEvent } from './dispatchEvent';
import { incrementMessageCounts, sessionStateChangeHandler } from '../utils';
import { isInitialized, initialize } from '../../../utils';

/**
 * Initialize and set up in-app messaging category. This API needs to be called to enable other InAppMessaging APIs.
 *
 * @remarks
 * Make sure to call this early in your app at the root entry point after configuring Amplify.
 * @example
 * ```ts
 * Amplify.configure(config);
 * initializeInAppMessaging();
 * ```
 */
export function initializeInAppMessaging(): void {
	if (isInitialized()) {
		return;
	}
	// set up the session tracker and start it
	const sessionTracker = new SessionTracker(sessionStateChangeHandler);
	sessionTracker.start();

	// wire up default Pinpoint message event handling
	addEventListener('messageDisplayed', (message: InAppMessage) => {
		console.log('Recording message displayed event');
		recordAnalyticsEvent(PinpointMessageEvent.MESSAGE_DISPLAYED, message);
		incrementMessageCounts(message.id);
	});
	addEventListener('messageDismissed', (message: InAppMessage) => {
		recordAnalyticsEvent(PinpointMessageEvent.MESSAGE_DISMISSED, message);
	});
	addEventListener('messageActionTaken', (message: InAppMessage) => {
		recordAnalyticsEvent(PinpointMessageEvent.MESSAGE_ACTION_TAKEN, message);
	});

	// listen to analytics hub events
	Hub.listen('analytics', analyticsListener);

	initialize();
}

function analyticsListener({
	payload,
}: HubCapsule<string, { event: string; data: InAppMessagingEvent }>) {
	const { event, data } = payload;
	switch (event) {
		case 'record': {
			dispatchEvent(data);
			break;
		}
		default:
			break;
	}
}