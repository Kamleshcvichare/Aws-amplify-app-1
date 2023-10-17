// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { nativeModule } from '../nativeModule';
import { PushNotificationPermissions } from '../types';

export const requestPermissions = async (
	permissions: PushNotificationPermissions = {
		alert: true,
		badge: true,
		sound: true,
	}
): Promise<boolean> => nativeModule.requestPermissions(permissions);
