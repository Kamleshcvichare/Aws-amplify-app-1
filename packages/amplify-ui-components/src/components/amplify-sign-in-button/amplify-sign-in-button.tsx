import { Component, h, Prop, Host } from '@stencil/core';
import { icons, IconNameType } from '../amplify-icon/icons';

@Component({
  tag: 'amplify-sign-in-button',
  styleUrl: 'amplify-sign-in-button.scss',
  shadow: true,
})
export class AmplifySignInButton {
  @Prop() provider: 'amazon' | 'auth0' | 'facebook' | 'google' | 'oauth';

  render() {
    return (
      <Host class={`sign-in-button ${this.provider}`}>
        <button>
          {this.provider in icons && (
            <span class="icon">
              <amplify-icon name={this.provider as IconNameType} />
            </span>
          )}

          <span class="content">
            <slot />
          </span>
        </button>
      </Host>
    );
  }
}
