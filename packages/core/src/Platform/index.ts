// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CustomUserAgent, Framework } from './types';
import { version } from './version';
import { detectFramework } from './detectFramework';
import { UserAgent as AWSUserAgent } from '@aws-sdk/types';

const BASE_USER_AGENT = `aws-amplify`;

let framework = detectFramework();
let frameworkHasBeenRerun = false;
export const Platform = {
	userAgent: `${BASE_USER_AGENT}/${version}`,
	framework,
	isReactNative: framework === Framework.ReactNative,
};

// Rerun framework detection once when getAmplifyUserAgent is called if framework is None:
// ReactNative framework must be detected initially, however
// Other frameworks may not be detected in cases where DOM is not yet loaded
const rerunFrameworkDetection = () => {
	if (Platform.framework === Framework.None && !frameworkHasBeenRerun) {
		frameworkHasBeenRerun = true;
		framework = detectFramework();
		Platform.framework = framework;
	}
};

export const getAmplifyUserAgent = ({
	category,
	framework,
	rerunFrameworkDetection();
	const userAgent: AWSUserAgent = [[BASE_USER_AGENT, version]];
	if (category) {
		/** TODO: add action as second element */
		userAgent.push([category, undefined]);
	}
	userAgent.push(['framework', framework ? framework : Platform.framework]);

	return userAgent;
};

export const getAmplifyUserAgentString = (
	customUserAgent?: CustomUserAgent
): string => {
	const userAgent = getAmplifyUserAgent(customUserAgent);
	const userAgentDetailsString = userAgent
		.map(([agentKey, agentValue]) => `${agentKey}/${agentValue ?? ''}`)
		.join(' ');

	return userAgentDetailsString.trimEnd();
};
