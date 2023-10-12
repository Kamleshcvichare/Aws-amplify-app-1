// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	PageViewTrackingOpts,
	TrackerEventRecorder,
	TrackerInterface,
} from '../types/trackers';
import { Logger as ConsoleLogger } from '@aws-amplify/core/internals/utils';

const logger = new ConsoleLogger('PageViewTracker');

const DEFAULT_EVENT_NAME = 'pageView';
const DEFAULT_APP_TYPE = 'singlePage';
const DEFAULT_URL_PROVIDER = () => {
	return window.location.origin + window.location.pathname;
};
const PREV_URL_STORAGE_KEY = 'aws-amplify-analytics-prevUrl';

export class PageViewTracker implements TrackerInterface {
	private options: PageViewTrackingOpts;
	private eventRecoder: TrackerEventRecorder;

	// SPA tracking helpers
	private spaTrackingActive: boolean;
	private pushStateProxy?: any;
	private replaceStateProxy?: any;

	constructor(
		eventRecorder: TrackerEventRecorder,
		options?: PageViewTrackingOpts
	) {
		this.options = {};
		this.eventRecoder = eventRecorder;
		this.spaTrackingActive = false;
		this.pushStateProxy = undefined;
		this.replaceStateProxy = undefined;

		this.configure(eventRecorder, options);
	}

	public configure(
		eventRecorder: TrackerEventRecorder,
		options?: PageViewTrackingOpts
	) {
		this.eventRecoder = eventRecorder;

		// Clean up any existing listeners
		this.cleanup();

		// Apply defaults
		this.options = {
			appType: options?.appType || DEFAULT_APP_TYPE,
			attributes: options?.attributes || undefined,
			eventName: this.options?.eventName || DEFAULT_EVENT_NAME,
			urlProvider: this.options?.urlProvider || DEFAULT_URL_PROVIDER,
		};

		// Configure SPA or MPA page view tracking
		if (this.options.appType === 'singlePage') {
			this.setupSPATracking();
		} else {
			this.setupMPATracking();
		}
	}

	public cleanup() {
		// Clean up SPA page view listeners
		if (this.spaTrackingActive) {
			this.pushStateProxy.revoke();
			this.replaceStateProxy.revoke();
			window.removeEventListener('popstate', this.handleLocationChange);

			this.spaTrackingActive = false;
		}
	}

	private setupSPATracking() {
		if (!this.spaTrackingActive) {
			// Configure proxies on History APIs
			this.pushStateProxy = Proxy.revocable(window.history.pushState, {
				apply: (target, thisArg, args) => {
					let proxiedResult = target.apply(thisArg, args as any);

					this.handleLocationChange();

					return proxiedResult;
				},
			});
			this.replaceStateProxy = Proxy.revocable(window.history.replaceState, {
				apply: (target, thisArg, args) => {
					let proxiedResult = target.apply(thisArg, args as any);

					this.handleLocationChange();

					return proxiedResult;
				},
			});

			// TODO Make this work with multiple providers at once somehow
			window.history.pushState = this.pushStateProxy.proxy;
			window.history.replaceState = this.replaceStateProxy.proxy;
			window.addEventListener('popstate', this.handleLocationChange);
			sessionStorage.clear();

			this.spaTrackingActive = true;
		}
	}

	private setupMPATracking() {
		this.handleLocationChange();
	}

	private handleLocationChange() {
		const currentUrl = this.options.urlProvider!();
		const eventName = this.options.eventName || DEFAULT_EVENT_NAME;

		if (this.urlHasChanged()) {
			sessionStorage.setItem(PREV_URL_STORAGE_KEY, currentUrl);

			// Assemble attribute list
			const attributes = Object.assign(
				{
					url: currentUrl,
				},
				this.options.attributes
			);

			logger.debug('Recording automatically tracked page view event', {
				eventName,
				attributes,
			});

			this.eventRecoder(eventName, attributes);
		}
	}

	private urlHasChanged() {
		const prevUrl = sessionStorage.getItem(PREV_URL_STORAGE_KEY);
		const currUrl = this.options.urlProvider!();

		if (currUrl !== prevUrl) {
			return true;
		}

		return false;
	}
}