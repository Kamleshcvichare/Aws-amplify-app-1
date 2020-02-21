import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'amplify-strike',
  styleUrl: 'amplify-strike.scss',
  shadow: true,
})
export class AmplifyStrike {
  render() {
    return (
      <Host>
        <span class="strike-content">
          <slot />
        </span>
      </Host>
    );
  }
}
