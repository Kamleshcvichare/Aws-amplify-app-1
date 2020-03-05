import { Element, Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'amplify-radio-button',
  styleUrl: 'amplify-radio-button.scss',
  shadow: false,
})
export class AmplifyRadioButton {
  @Element() el!: HTMLElement;
  private radioGroup = null;

  /** The callback, called when the input is modified by the user. */
  @Prop() handleInputChange?: (inputEvent: Event) => void;
  /** (Optional) Name of radio button */
  @Prop() name?: string;
  /** (Optional) Value of radio button */
  @Prop() value?: string;
  /** (Optional) The placeholder for the input element.  Using hints is recommended, but placeholders can also be useful to convey information to users. */
  @Prop() placeholder?: string = '';
  /** Field ID used for the 'for' in the label */
  @Prop() fieldId: string;
  /** Label for the radio button */
  @Prop() label: string;
  /** If `true`, the radio button is selected. */
  @Prop() checked: boolean = false;
  /** If `true`, the checkbox is disabled */
  @Prop() disabled: boolean = false;

  connectedCallback() {
    const radioGroup = (this.radioGroup = this.el.closest('amplify-radio-group'));
    if (radioGroup) {
      this.updateState();
      radioGroup.addEventListener('radioChange', this.updateState);
    }
  }

  disconnectedCallback() {
    const radioGroup = this.radioGroup;
    if (radioGroup) {
      radioGroup.removeEventListener('radioChange', this.updateState);
      this.radioGroup = null;
    }
  }

  private updateState = () => {
    if (this.radioGroup) {
      this.checked = this.radioGroup.value === this.value;
    }
  };

  render() {
    return (
      <span class="radio-button">
        <input
          type="radio"
          name={this.name}
          value={this.value}
          onInput={this.handleInputChange}
          placeholder={this.placeholder}
          id={this.fieldId}
          checked={this.checked}
          disabled={this.disabled}
        />
        <amplify-label htmlFor={this.fieldId}>{this.label}</amplify-label>
      </span>
    );
  }
}
