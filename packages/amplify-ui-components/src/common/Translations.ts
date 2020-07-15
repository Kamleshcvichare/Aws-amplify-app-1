import { AuthErrorStrings } from '@aws-amplify/auth';

export enum AuthStrings {
  BACK_TO_SIGN_IN = 'Back to Sign In',
  CHANGE_PASSWORD_ACTION = 'Change',
  CHANGE_PASSWORD = 'Change Password',
  CODE_LABEL = 'Verification code',
  CODE_PLACEHOLDER = 'Enter code',
  CONFIRM_SIGN_UP_CODE_LABEL = 'Confirmation Code',
  CONFIRM_SIGN_UP_CODE_PLACEHOLDER = 'Enter your code',
  CONFIRM_SIGN_UP_HEADER_TEXT = 'Confirm Sign up',
  CONFIRM_SIGN_UP_LOST_CODE = 'Lost your code?',
  CONFIRM_SIGN_UP_RESEND_CODE = 'Resend Code',
  CONFIRM_SIGN_UP_SUBMIT_BUTTON_TEXT = 'Confirm',
  CONFIRM_SMS_CODE = 'Confirm SMS Code',
  CONFIRM_TOTP_CODE = 'Confirm TOTP Code',
  CONFIRM = 'Confirm',
  CREATE_ACCOUNT_TEXT = 'Create account',
  EMAIL_LABEL = 'Email Address *',
  EMAIL_PLACEHOLDER = 'Enter your email address',
  FORGOT_PASSWORD_TEXT = 'Forgot your password?',
  LESS_THAN_TWO_MFA_VALUES_MESSAGE = 'Less than two mfa types available',
  NEW_PASSWORD_LABEL = 'New password',
  NEW_PASSWORD_PLACEHOLDER = 'Enter your new password',
  NO_ACCOUNT_TEXT = 'No account?',
  PASSWORD_LABEL = 'Password *',
  PASSWORD_PLACEHOLDER = 'Enter your password',
  PHONE_LABEL = 'Phone Number *',
  PHONE_PLACEHOLDER = '(555) 555-1212',
  QR_CODE_ALT = 'qrcode',
  RESET_PASSWORD_TEXT = 'Reset password',
  RESET_YOUR_PASSWORD = 'Reset your password',
  SELECT_MFA_TYPE_HEADER_TEXT = 'Select MFA Type',
  SELECT_MFA_TYPE_SUBMIT_BUTTON_TEXT = 'Verify',
  SEND_CODE = 'Send Code',
  SETUP_TOTP_REQUIRED = 'TOTP needs to be configured',
  SIGN_IN_ACTION = 'Sign In',
  SIGN_IN_HEADER_TEXT = 'Sign in to your account',
  SIGN_IN_TEXT = 'Sign in',
  SIGN_IN_WITH_AMAZON = 'Sign in with Amazon',
  SIGN_IN_WITH_AUTH0 = 'Sign in with Auth0',
  SIGN_IN_WITH_AWS = 'Sign in with AWS',
  SIGN_IN_WITH_FACEBOOK = 'Sign in with Facebook',
  SIGN_IN_WITH_GOOGLE = 'Sign in with Google',
  SIGN_OUT = 'Sign Out',
  SIGN_UP_EMAIL_PLACEHOLDER = 'Email',
  SIGN_UP_HAVE_ACCOUNT_TEXT = 'Have an account?',
  SIGN_UP_HEADER_TEXT = 'Create a new account',
  SIGN_UP_PASSWORD_PLACEHOLDER = 'Password',
  SIGN_UP_SUBMIT_BUTTON_TEXT = 'Create Account',
  SIGN_UP_USERNAME_PLACEHOLDER = 'Username',
  SUCCESS_MFA_TYPE = 'Success! Your MFA Type is now:',
  TOTP_HEADER_TEXT = 'Scan then enter verification code',
  TOTP_LABEL = 'Enter Security Code:',
  TOTP_SETUP_FAILURE = 'TOTP Setup has failed',
  TOTP_SUBMIT_BUTTON_TEXT = 'Verify Security Token',
  TOTP_SUCCESS_MESSAGE = 'Setup TOTP successfully!',
  UNABLE_TO_SETUP_MFA_AT_THIS_TIME = 'Failed! Unable to configure MFA at this time',
  USERNAME_LABEL = 'Username *',
  USERNAME_PLACEHOLDER = 'Enter your username',
  VERIFY_CONTACT_EMAIL_LABEL = 'Email',
  VERIFY_CONTACT_HEADER_TEXT = 'Account recovery requires verified contact information',
  VERIFY_CONTACT_PHONE_LABEL = 'Phone Number',
  VERIFY_CONTACT_SUBMIT_LABEL = 'Submit',
  VERIFY_CONTACT_VERIFY_LABEL = 'Verify',
  ADDRESS_LABEL = 'Address',
  ADDRESS_PLACEHOLDER = 'Enter your address',
  NICKNAME_LABEL = 'Nickname',
  NICKNAME_PLACEHOLDER = 'Enter your nickname',
  BIRTHDATE_LABEL = 'Birthday',
  BIRTHDATE_PLACEHOLDER = 'Enter your birthday',
  PICTURE_LABEL = 'Picture URL',
  PICTURE_PLACEHOLDER = 'Enter your picture URL',
  FAMILY_NAME_LABEL = 'Family Name',
  FAMILY_NAME_PLACEHOLDER = 'Enter your family name',
  PREFERRED_USERNAME_LABEL = 'Preferred Username',
  PREFERRED_USERNAME_PLACEHOLDER = 'Enter your preferred username',
  GENDER_LABEL = 'Gender',
  GENDER_PLACEHOLDER = 'Enter your gender',
  PROFILE_LABEL = 'Profile URL',
  PROFILE_PLACEHOLDER = 'Enter your profile URL',
  GIVEN_NAME_LABEL = 'First Name',
  GIVEN_NAME_PLACEHOLDER = 'Enter your first name',
  ZONEINFO_LABEL = 'Time zone',
  ZONEINFO_PLACEHOLDER = 'Enter your time zone',
  LOCALE_LABEL = 'Locale',
  LOCALE_PLACEHOLDER = 'Enter your locale',
  UPDATED_AT_LABEL = 'Updated At',
  UPDATED_AT_PLACEHOLDER = 'Enter the time the information was last updated',
  MIDDLE_NAME_LABEL = 'Middle Name',
  MIDDLE_NAME_PLACEHOLDER = 'Enter your middle name',
  WEBSITE_LABEL = 'Website',
  WEBSITE_PLACEHOLDER = 'Enter your website',
  NAME_LABEL = 'Full Name',
  NAME_PLACEHOLDER = 'Enter your full name',
  PHOTO_PICKER_TITLE = 'Picker Title',
  PHOTO_PICKER_HINT = 'Ancilliary text or content may occupy this space here',
  PHOTO_PICKER_PLACEHOLDER_HINT = 'Placeholder hint',
  PHOTO_PICKER_BUTTON_TEXT = 'Button',
  IMAGE_PICKER_TITLE = 'Add Profile Photo',
  IMAGE_PICKER_HINT = 'Preview the image before upload',
  IMAGE_PICKER_PLACEHOLDER_HINT = 'Tap to image select',
  IMAGE_PICKER_BUTTON_TEXT = 'Upload',
  PICKER_TEXT = 'Pick a file',
  TEXT_FALLBACK_CONTENT = 'Fallback Content',
}

type Translations = AuthErrorStrings | AuthStrings;
export const Translations = { ...AuthStrings, ...AuthErrorStrings };
