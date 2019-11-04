import { Component, State, Prop, h } from '@stencil/core';
import { AuthState, CognitoUserInterface } from '../../common/types/auth-types';
import { AuthStateTunnel } from '../../data/auth-state';

import { Logger } from '@aws-amplify/core';

const logger = new Logger('Authenticator');

@Component({
  tag: 'amplify-authenticator',
  shadow: false,
})
export class AmplifyAuthenticator {
  /** Initial starting state of the Authenticator component. E.g. If `signup` is passed the default component is set to AmplifySignUp */
  @Prop() initialAuthState: AuthState = AuthState.SignIn;
  /** Used as a flag in order to trigger the content displayed */
  @State() authState: AuthState = AuthState.Loading;

  @State() authData: CognitoUserInterface;

  componentWillLoad() {
    this.authState = this.initialAuthState;
  }

  onAuthStateChange = (nextAuthState: AuthState, data?: object) => {
    if (nextAuthState === undefined) return logger.info('nextAuthState cannot be undefined');

    logger.info('Inside onAuthStateChange Method current authState:', this.authState);
    this.authState = nextAuthState;
    if (data !== undefined) {
      this.authData = data;
      logger.log('Auth Data was set:', this.authData);
    }
    logger.info(`authState has been updated to ${this.authState}`);
  };

  renderAuthComponent(authState: AuthState) {
    switch (authState) {
      case AuthState.Loading:
        return <div>Loading...</div>;
      case AuthState.SignIn:
        return <amplify-sign-in handleAuthStateChange={this.onAuthStateChange} />;
      case AuthState.SignOut:
        // TODO: add sign out component
        return <div>Sign Out Component</div>;
      case AuthState.SignUp:
        return <amplify-sign-up handleAuthStateChange={this.onAuthStateChange} />;
      case AuthState.ConfirmSignUp:
        return <amplify-confirm-sign-up handleAuthStateChange={this.onAuthStateChange} user={this.authData.user} />;
      case AuthState.ForgotPassword:
        return <amplify-forgot-password handleAuthStateChange={this.onAuthStateChange} />;
      case AuthState.ResetPassword:
        // TODO: add forgot password component
        return <div>Reset Password Component</div>;
    }
  }

  render() {
    const tunnelState = {
      authState: this.authState,
      onAuthStateChange: this.onAuthStateChange,
    };
    return (
      <AuthStateTunnel.Provider state={tunnelState}>
        {this.renderAuthComponent(this.authState)}
      </AuthStateTunnel.Provider>
    );
  }
}
