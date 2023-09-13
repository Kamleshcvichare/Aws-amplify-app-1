// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	AuthResetPasswordStep,
	AuthSignUpStep,
	AuthUpdateAttributeStep,
} from './enums';

/**
 * Additional data that may be returned from Auth APIs.
 */
export type AdditionalInfo = { [key: string]: string };

export type AnyAttribute = string & {};

/**
 * Denotes the medium over which a confirmation code was sent.
 */
export type DeliveryMedium = 'EMAIL' | 'SMS' | 'PHONE' | 'UNKNOWN';

/**
 * Data describing the dispatch of a confirmation code.
 */
export type AuthCodeDeliveryDetails<
	UserAttributeKey extends AuthUserAttributeKey = AuthUserAttributeKey
> = {
	destination?: string;
	deliveryMedium?: DeliveryMedium;
	attributeName?: UserAttributeKey;
};

export type AuthNextResetPasswordStep<
	UserAttributeKey extends AuthUserAttributeKey = AuthUserAttributeKey
> = {
	resetPasswordStep: AuthResetPasswordStep;
	additionalInfo?: AdditionalInfo;
	codeDeliveryDetails: AuthCodeDeliveryDetails<UserAttributeKey>;
};

export type TOTPSetupDetails = {
	sharedSecret: string;
	getSetupUri: (appName: string, accountName?: string) => URL;
};

export type MFAType = 'SMS' | 'TOTP';

export type AllowedMFATypes = MFAType[];

export type ContinueSignInWithTOTPSetup = {
	/**
	 * Auth step requires user to set up TOTP as multifactor authentication by associating an authenticator app
	 * and retriving an OTP code.
	 *
	 * ```typescript
	 *  // Example
	 *
	 *   // Code retrieved from authenticator app
	 *   const otpCode = '112233'
	 *   await confirmSignIn({challengeResponse: otpCode})
	 *
	 * ```
	 */
	signInStep: 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP';
	totpSetupDetails: TOTPSetupDetails;
};
export type ConfirmSignInWithTOTPCode = {
	/**
	 * Auth step requires user to use TOTP as multifactor authentication by retriving an OTP code from authenticator app.
	 * 
	 * ```typescript
	 *  // Example
	 *  
	 *   // Code retrieved from authenticator app
	 *   const otpCode = '112233'
	 *   await confirmSignIn({challengeResponse: otpCode})
	 
	 * ```
	 */
	signInStep: 'CONFIRM_SIGN_IN_WITH_TOTP_CODE';
};

export type ContinueSignInWithMFASelection = {
	/**
	 * Auth step requires user to select an mfa option(SMS | TOTP) to continue with the sign-in flow.
	 *
	 * ```typescript
	 *  // Example
	 *
	 *   await confirmSignIn({challengeResponse:'TOTP'})
	 *   // OR
	 *   await confirmSignIn({challengeResponse:'SMS'})
	 * ```
	 */
	signInStep: 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION';
	allowedMFATypes?: AllowedMFATypes;
};

export type ConfirmSignInWithCustomChallenge = {
	/**
	 * Auth step requires user to respond to a custom challenge.
	 *
	 * ```typescript
	 *  // Example
	 *
	 *   const challengeAnswer = 'my-custom-response'
	 *   await confirmSignIn({challengeResponse: challengeAnswer})
	 * ```
	 */
	signInStep: 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE';
	additionalInfo?: AdditionalInfo;
};

export type ConfirmSignInWithNewPasswordRequired<
	UserAttributeKey extends AuthUserAttributeKey = AuthUserAttributeKey
> = {
	/**
	 * Auth step requires user to change their password with any requierd attributes.
	 *
	 * ```typescript
	 *  // Example
	 *
	 *   const attributes = {
	 *    email: 'email@email'
	 *    phone_number: '+11111111111'
	 *    }
	 *   const newPassword = 'my-new-password'
	 *   await confirmSignIn({
	 *     challengeResponse: newPassword,
	 *     options: {
	 *       serviceOptions: {
	 *        userAttributes: attributes
	 *       }
	 *     }
	 *    })
	 * ```
	 */
	signInStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED';
	missingAttributes?: UserAttributeKey[];
};

export type ConfirmSignInWithSMSCode = {
	/**
	 * Auth step requires user to use SMS as multifactor authentication by retriving a code sent to cellphone.
	 *
	 * ```typescript
	 *  // Example
	 *
	 *   // Code retrieved from cellphone
	 *   const smsCode = '112233'
	 *   await confirmSignIn({challengeResponse: smsCode})
	 * ```
	 */
	signInStep: 'CONFIRM_SIGN_IN_WITH_SMS_CODE';
	codeDeliveryDetails?: AuthCodeDeliveryDetails;
};

export type ConfirmSignUpStep = {
	/**
	 * Auth step requires to confirm user's sign-up.
	 *
	 * Try calling confirmSignUp.
	 */
	signInStep: 'CONFIRM_SIGN_UP';
};

export type ResetPasswordStep = {
	/**
	 * Auth step requires user to chage their password.
	 *
	 * Try calling resetPassword.
	 */
	signInStep: 'RESET_PASSWORD';
};

export type DoneSignInStep = {
	/**
	 * The sign-in process is complete.
	 *
	 * No further action is needed.
	 */
	signInStep: 'DONE';
};

export type AuthNextSignInStep<
	UserAttributeKey extends AuthUserAttributeKey = AuthUserAttributeKey
> =
	| ConfirmSignInWithCustomChallenge
	| ContinueSignInWithMFASelection
	| ConfirmSignInWithNewPasswordRequired<UserAttributeKey>
	| ConfirmSignInWithSMSCode
	| ConfirmSignInWithTOTPCode
	| ContinueSignInWithTOTPSetup
	| ConfirmSignUpStep
	| ResetPasswordStep
	| DoneSignInStep;

export type AuthStandardAttributeKey =
	| 'address'
	| 'birthdate'
	| 'email'
	| 'email_verified'
	| 'family_name'
	| 'gender'
	| 'given_name'
	| 'locale'
	| 'middle_name'
	| 'name'
	| 'nickname'
	| 'phone_number'
	| 'phone_number_verified'
	| 'picture'
	| 'preferred_username'
	| 'profile'
	| 'sub'
	| 'updated_at'
	| 'website'
	| 'zoneinfo';

/**
 * Key/value pairs describing a user attribute.
 */
export type AuthUserAttribute<
	UserAttributeKey extends AuthUserAttributeKey = AuthUserAttributeKey
> = {
	[Attribute in UserAttributeKey]?: string;
};

/**
 * A user attribute key type consisting of standard OIDC claims or custom attributes.
 */
export type AuthUserAttributeKey = AuthStandardAttributeKey | AnyAttribute;

/**
 * Data encapsulating the next step in the Sign Up process
 */
export type AuthNextSignUpStep<
	UserAttributeKey extends AuthUserAttributeKey = AuthUserAttributeKey
> = {
	signUpStep?: AuthSignUpStep;
	additionalInfo?: AdditionalInfo;
	codeDeliveryDetails?: AuthCodeDeliveryDetails<UserAttributeKey>;
};

export type ConfirmAttributeWithCodeAttributeStep<
	UserAttributeKey extends AuthUserAttributeKey = AuthUserAttributeKey
> = {
	updateAttributeStep: AuthUpdateAttributeStep.CONFIRM_ATTRIBUTE_WITH_CODE;
	codeDeliveryDetails: AuthCodeDeliveryDetails<UserAttributeKey>;
};

export type DoneAttributeStep = {
	updateAttributeStep: AuthUpdateAttributeStep.DONE;
};

export type AuthNextUpdateAttributeStep<
	UserAttributeKey extends AuthUserAttributeKey = AuthUserAttributeKey
> = ConfirmAttributeWithCodeAttributeStep<UserAttributeKey> | DoneAttributeStep;

/**
 * The AuthUser object contains username and userId from the idToken.
 */
export type AuthUser = {
	username: string;
	userId: string;
};
