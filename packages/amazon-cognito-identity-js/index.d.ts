declare module 'amazon-cognito-identity-js' {
	//import * as AWS from "aws-sdk";

	export type NodeCallback<E, T> = (err?: E, result?: T) => void;
	export namespace NodeCallback {
		export type Any = NodeCallback<Error | undefined, any>;
	}

	export interface CodeDeliveryDetails {
		AttributeName: string;
		DeliveryMedium: string;
		Destination: string;
	}

	export type ClientMetadata = { [key: string]: string } | undefined;

	export interface IAuthenticationCallback {
		onSuccess: (
			session: CognitoUserSession,
			userConfirmationNecessary?: boolean
		) => void;
		onFailure: (err: any) => void;
		newPasswordRequired?: (
			userAttributes: any,
			requiredAttributes: any
		) => void;
		mfaRequired?: (
			challengeName: ChallengeName,
			challengeParameters: any
		) => void;
		totpRequired?: (
			challengeName: ChallengeName,
			challengeParameters: any
		) => void;
		customChallenge?: (challengeParameters: any) => void;
		mfaSetup?: (challengeName: ChallengeName, challengeParameters: any) => void;
		selectMFAType?: (
			challengeName: ChallengeName,
			challengeParameters: any
		) => void;
	}

	export interface IMfaSettings {
		PreferredMfa: boolean;
		Enabled: boolean;
	}
	export interface IAuthenticationDetailsData {
		Username: string;
		Password?: string;
		ValidationData?: { [key: string]: any };
		ClientMetadata?: ClientMetadata;
	}

	export class AuthenticationDetails {
		constructor(data: IAuthenticationDetailsData);

		public getUsername(): string;
		public getPassword(): string;
		public getValidationData(): any[];
	}

	export interface ICognitoStorage {
		setItem(key: string, value: string): void;
		getItem(key: string): string | null;
		removeItem(key: string): void;
		clear(): void;
	}

	export interface ICognitoUserData {
		Username: string;
		Pool: CognitoUserPool;
		Storage?: ICognitoStorage;
	}

	export interface GetSessionOptions {
		clientMetadata: Record<string, string>;
	}

	export enum AuthenticationFlowType {
		USER_SRP_AUTH = 'USER_SRP_AUTH',
		USER_PASSWORD_AUTH = 'USER_PASSWORD_AUTH',
		CUSTOM_AUTH = 'CUSTOM_AUTH',
	}

	export type ChallengeName =
		| 'CUSTOM_CHALLENGE'
		| 'MFA_SETUP'
		| 'NEW_PASSWORD_REQUIRED'
		| 'SELECT_MFA_TYPE'
		| 'SMS_MFA'
		| 'SOFTWARE_TOKEN_MFA';

	export interface CognitoUser {
		attributes: {
			email: string;
			email_verified: boolean;
			family_name: string;
			given_name: string;
			phone_number: string;
			phone_number_verified: boolean;
			sub: string;
		};

		pool: CognitoUserPool;
		authenticationFlowType: AuthenticationFlowType;
		keyPrefix: string;
		signInUserSession: CognitoUserSession | null;
		userDataKey: string;
		username: string;
	}

	export class CognitoUser implements CognitoUser {
		constructor(data: ICognitoUserData);

		challengeName?: ChallengeName;

		public setSignInUserSession(signInUserSession: CognitoUserSession): void;
		public getSignInUserSession(): CognitoUserSession | null;
		public getUsername(): string;

		public getAuthenticationFlowType(): string;
		public setAuthenticationFlowType(authenticationFlowType: string): string;
		public getCachedDeviceKeyAndPassword(): void;

		public getSession(
			callback:
				| ((error: Error, session: null) => void)
				| ((error: null, session: CognitoUserSession) => void),
			options?: GetSessionOptions
		): void;
		public refreshSession(
			refreshToken: CognitoRefreshToken,
			callback: NodeCallback<any, any>,
			clientMetadata?: ClientMetadata
		): void;
		public authenticateUser(
			authenticationDetails: AuthenticationDetails,
			callbacks: IAuthenticationCallback
		): void;
		public initiateAuth(
			authenticationDetails: AuthenticationDetails,
			callbacks: IAuthenticationCallback
		): void;
		public confirmRegistration(
			code: string,
			forceAliasCreation: boolean,
			callback: NodeCallback<any, any>,
			clientMetadata?: ClientMetadata
		): void;
		public sendCustomChallengeAnswer(
			answerChallenge: any,
			callback: IAuthenticationCallback,
			clientMetaData?: ClientMetadata
		): void;
		public resendConfirmationCode(
			callback: NodeCallback<Error, any>,
			clientMetaData?: ClientMetadata
		): void;
		public changePassword(
			oldPassword: string,
			newPassword: string,
			callback: NodeCallback<Error, 'SUCCESS'>
		): void;
		public forgotPassword(
			callbacks: {
				onSuccess: (data: any) => void;
				onFailure: (err: Error) => void;
				inputVerificationCode?: (data: any) => void;
			},
			clientMetaData?: ClientMetadata
		): void;
		public confirmPassword(
			verificationCode: string,
			newPassword: string,
			callbacks: {
				onSuccess: (success: string) => void;
				onFailure: (err: Error) => void;
			},
			clientMetaData?: ClientMetadata
		): void;
		public setDeviceStatusRemembered(callbacks: {
			onSuccess: (success: string) => void;
			onFailure: (err: any) => void;
		}): void;
		public setDeviceStatusNotRemembered(callbacks: {
			onSuccess: (success: string) => void;
			onFailure: (err: any) => void;
		}): void;
		public getDevice(callbacks: {
			onSuccess: (success: string) => void;
			onFailure: (err: Error) => void;
		}): any;
		public forgetDevice(callbacks: {
			onSuccess: (success: string) => void;
			onFailure: (err: Error) => void;
		}): void;
		public forgetSpecificDevice(
			deviceKey: string,
			callbacks: {
				onSuccess: (success: string) => void;
				onFailure: (err: Error) => void;
			}
		): void;
		public sendMFACode(
			confirmationCode: string,
			callbacks: {
				onSuccess: (
					session: CognitoUserSession,
					userConfirmationNecessary?: boolean
				) => void;
				onFailure: (err: any) => void;
			},
			mfaType?: string,
			clientMetadata?: ClientMetadata
		): void;
		public listDevices(
			limit: number,
			paginationToken: string | null,
			callbacks: {
				onSuccess: (data: any) => void;
				onFailure: (err: Error) => void;
			}
		): void;
		public completeNewPasswordChallenge(
			newPassword: string,
			requiredAttributeData: any,
			callbacks: IAuthenticationCallback,
			clientMetadata?: ClientMetadata
		): void;
		public signOut(callback?: () => void): void;
		public globalSignOut(callbacks: {
			onSuccess: (msg: string) => void;
			onFailure: (err: Error) => void;
		}): void;
		public verifyAttribute(
			attributeName: string,
			confirmationCode: string,
			callbacks: {
				onSuccess: (success: string) => void;
				onFailure: (err: Error) => void;
			}
		): void;
		public getUserAttributes(
			callback: NodeCallback<Error, CognitoUserAttribute[]>
		): void;
		public updateAttributes(
			attributes: (CognitoUserAttribute | ICognitoUserAttributeData)[],
			callback: NodeCallback<Error, string>,
			clientMetadata?: ClientMetadata
		): void;
		public deleteAttributes(
			attributeList: string[],
			callback: NodeCallback<Error, string>
		): void;
		public getAttributeVerificationCode(
			name: string,
			callback: {
				onSuccess: (success: string) => void;
				onFailure: (err: Error) => void;
				inputVerificationCode?: (data: string) => void | null;
			}
		): void;
		public deleteUser(callback: NodeCallback<Error, string>): void;
		public enableMFA(callback: NodeCallback<Error, string>): void;
		public disableMFA(callback: NodeCallback<Error, string>): void;
		public getMFAOptions(callback: NodeCallback<Error, MFAOption[]>): void;
		public getUserData(
			callback: NodeCallback<Error, UserData>,
			params?: any
		): void;
		public associateSoftwareToken(callbacks: {
			associateSecretCode: (secretCode: string) => void;
			onFailure: (err: any) => void;
		}): void;
		public verifySoftwareToken(
			totpCode: string,
			friendlyDeviceName: string,
			callbacks: {
				onSuccess: (session: CognitoUserSession) => void;
				onFailure: (err: Error) => void;
			}
		): void;
		public setUserMfaPreference(
			smsMfaSettings: IMfaSettings | null,
			softwareTokenMfaSettings: IMfaSettings | null,
			callback: NodeCallback<Error, string>
		): void;
		public sendMFASelectionAnswer(
			answerChallenge: string,
			callbacks: {
				onSuccess: (session: CognitoUserSession) => void;
				onFailure: (err: any) => void;
				mfaRequired?: (
					challengeName: ChallengeName,
					challengeParameters: any
				) => void;
				totpRequired?: (
					challengeName: ChallengeName,
					challengeParameters: any
				) => void;
			}
		): void;
	}

	export interface MFAOption {
		DeliveryMedium: 'SMS' | 'EMAIL';
		AttributeName: string;
	}

	export interface UserData {
		MFAOptions: MFAOption[];
		PreferredMfaSetting: string;
		UserAttributes: ICognitoUserAttributeData[];
		UserMFASettingList: string[];
		Username: string;
	}

	export interface ICognitoUserAttributeData {
		Name: string;
		Value: string;
	}

	export class CognitoUserAttribute implements ICognitoUserAttributeData {
		constructor(data: ICognitoUserAttributeData);

		Name: string;
		Value: string;

		public getValue(): string;
		public setValue(value: string): CognitoUserAttribute;
		public getName(): string;
		public setName(name: string): CognitoUserAttribute;
		public toString(): string;
		public toJSON(): Object;
	}

	export interface ISignUpResult {
		user: CognitoUser;
		userConfirmed: boolean;
		userSub: string;
		codeDeliveryDetails: CodeDeliveryDetails;
	}

	export interface ICognitoUserPoolData {
		UserPoolId: string;
		ClientId: string;
		endpoint?: string;
		Storage?: ICognitoStorage;
		AdvancedSecurityDataCollectionFlag?: boolean;
	}

	export interface CognitoUserPool {
		advancedSecurityDataCollectionFlag: boolean;
		clientId: string;
		userPoolId: string;
	}

	export class CognitoUserPool implements CognitoUserPool {
		constructor(
			data: ICognitoUserPoolData,
			wrapRefreshSessionCallback?: (
				target: NodeCallback.Any
			) => NodeCallback.Any
		);

		public clientId: string;
		public userPoolId: string;
		public advancedSecurityDataCollectionFlag: boolean;

		public getUserPoolId(): string;
		public getClientId(): string;

		public signUp(
			username: string,
			password: string,
			userAttributes: CognitoUserAttribute[],
			validationData: CognitoUserAttribute[],
			callback: NodeCallback<Error, ISignUpResult>,
			clientMetadata?: ClientMetadata
		): void;

		public getCurrentUser(): CognitoUser | null;
	}

	export interface ICognitoUserSessionData {
		IdToken: CognitoIdToken;
		AccessToken: CognitoAccessToken;
		RefreshToken?: CognitoRefreshToken;
	}

	export interface CognitoUserSession {
		clockDrift: number;
		idToken: CognitoIdToken;
		accessToken: CognitoAccessToken;
		refreshToken: CognitoRefreshToken;
	}

	export class CognitoUserSession implements CognitoUserSession {
		constructor(data: ICognitoUserSessionData);

		public clockDrift: number;
		public idToken: CognitoIdToken;
		public accessToken: CognitoAccessToken;
		public refreshToken: CognitoRefreshToken;

		public getIdToken(): CognitoIdToken;
		public getRefreshToken(): CognitoRefreshToken;
		public getAccessToken(): CognitoAccessToken;
		public isValid(): boolean;
	}
	/*
    export class CognitoIdentityServiceProvider {
        public config: AWS.CognitoIdentityServiceProvider.Types.ClientConfiguration;
    }
    */

	export interface CognitoAccessToken {
		jwtToken: string;
		payload: {
			origin_jti: string;
			sub: string;
			event_id: string;
			token_use: string;
			scope: string;
			auth_time: number;
			iss: string;
			exp: number;
			iat: number;
			jti: string;
			client_id: string;
			username: string;
		};
	}

	export class CognitoAccessToken implements CognitoAccessToken {
		constructor({ AccessToken }: { AccessToken: string });

		public jwtToken: string;
		public payload: CognitoAccessToken['payload'];

		public getJwtToken(): string;
		public getExpiration(): number;
		public getIssuedAt(): number;
		public decodePayload(): { [id: string]: any };
	}

	export interface CognitoIdToken {
		jwtToken: string;
		payload: {
			sub: string;
			email_verified: boolean;
			iss: string;
			phone_number_verified: boolean;
			'cognito:username': string;
			given_name: string;
			origin_jti: string;
			aud: string;
			event_id: string;
			token_use: string;
			auth_time: number;
			phone_number: string;
			exp: number;
			iat: number;
			family_name: string;
			jti: string;
			email: string;
		};
	}

	export class CognitoIdToken implements CognitoIdToken {
		constructor({ IdToken }: { IdToken: string });

		public jwtToken: string;
		public payload: CognitoIdToken['payload'];

		public getJwtToken(): string;
		public getExpiration(): number;
		public getIssuedAt(): number;
		public decodePayload(): { [id: string]: any };
	}

	export interface CognitoRefreshToken {
		token: string;
	}

	export class CognitoRefreshToken implements CognitoRefreshToken {
		constructor({ RefreshToken }: { RefreshToken: string });

		public token: string;

		public getToken(): string;
	}

	export interface ICookieStorageData {
		domain: string;
		path?: string;
		expires?: number;
		secure?: boolean;
		sameSite?: 'strict' | 'lax' | 'none';
	}
	export class CookieStorage implements ICognitoStorage {
		constructor(data: ICookieStorageData);
		setItem(key: string, value: string): void;
		getItem(key: string): string;
		removeItem(key: string): void;
		clear(): void;
	}

	export class UserAgent {
		constructor();
	}

	export const appendToCognitoUserAgent: (content: string) => void;

	export class WordArray {
		constructor(words?: string[], sigBytes?: number);
		random(nBytes: number): WordArray;
		toString(): string;
	}
}
