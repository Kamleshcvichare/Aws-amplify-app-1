// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AuthUserAttribute } from '../../../types';
import { ClientMetadata, AuthFlowType, ValidationData } from './models';

/**
 * Options specific to Cognito Confirm Reset Password.
 */
export type ConfirmResetPasswordOptions = {
	clientMetadata?: ClientMetadata;
};

/**
 * Options specific to Cognito Resend Sign Up code.
 */
export type ResendSignUpCodeOptions = {
	clientMetadata?: ClientMetadata;
};

/**
 * Options specific to Cognito Reset Password.
 */
export type ResetPasswordOptions = {
	clientMetadata?: ClientMetadata;
};

/**
 * Options specific to Cognito Sign In.
 */
export type SignInOptions = {
	authFlowType?: AuthFlowType;
	clientMetadata?: ClientMetadata;
};

/**
 * Options specific to Cognito Sign Up.
 */
export type SignUpOptions = {
	validationData?: ValidationData;
	clientMetadata?: ClientMetadata;
	// autoSignIn?: AutoSignInOptions;
};

/**
 * Options specific to Cognito Confirm Sign Up.
 */
export type ConfirmSignUpOptions = {
	clientMetadata?: ClientMetadata;
	forceAliasCreation?: boolean;
};

/**
 * Options specific to Cognito Confirm Sign In.
 */
export type ConfirmSignInOptions<
	UserAttribute extends AuthUserAttribute = AuthUserAttribute
> = {
	userAttributes?: UserAttribute;
	clientMetadata?: ClientMetadata;
	friendlyDeviceName?: string;
};

/**
 * Options specific to Cognito Verify TOTP Setup.
 */
export type VerifyTOTPSetupOptions = {
	friendlyDeviceName?: string;
};

/**
 * Options specific to Cognito Update User Attributes.
 */
export type UpdateUserAttributesOptions = {
	clientMetadata?: ClientMetadata;
};