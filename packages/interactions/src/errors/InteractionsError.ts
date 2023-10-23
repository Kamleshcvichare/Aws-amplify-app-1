// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	AmplifyError,
	AmplifyErrorParams,
} from '@aws-amplify/core/internals/utils';

export class InteractionsError extends AmplifyError {
	constructor(params: AmplifyErrorParams) {
		super(params);
	}
}
