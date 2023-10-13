// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InteractionsMessage, InteractionsResponse } from '../../types';
import { lexProvider } from '../AWSLexV2Provider';
import { resolveConfig } from '../utils';
import {
	assertValidationError,
	InteractionsValidationErrorCode,
} from '../../errors';

export const sendMessage = (
	botname: string,
	message: string | InteractionsMessage
): Promise<InteractionsResponse> => {
	const botConfig = resolveConfig(botname);
	assertValidationError(
		!!botConfig,
		InteractionsValidationErrorCode.NoBotConfig,
		`Bot ${botname} does not exist.`
	);
	return lexProvider.sendMessage(botConfig, message);
};
