// tslint:disable
/*
 * Copyright 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
// tslint:enable

<<<<<<< HEAD
import {
=======
import { 
>>>>>>> initial commit
  Component,
  Input,
  OnInit,
  ViewChild,
  ComponentFactoryResolver,
  OnDestroy
} from '@angular/core';
import { DynamicComponentDirective } from '../../../directives/dynamic.component.directive';
import { ComponentMount }      from '../../component.mount';
import { SignInClass } from './sign-in.class';
import { SignInComponentIonic } from './sign-in.component.ionic';
import { SignInComponentCore } from './sign-in.component.core';
import { AuthState } from '../../../providers';
import { authDecorator } from '../../../providers/auth.decorator';
import { AmplifyUIInterface } from '../../../assets/amplify-angular-theme.class';

@Component({
  selector: 'amplify-auth-sign-in',
  template: `
              <div>
                <ng-template component-host></ng-template>
              </div>
            `
})
export class SignInComponent implements OnInit, OnDestroy {
  @Input() framework: string;
  @Input() authState: AuthState;
<<<<<<< HEAD
  @Input() usernameAttributes: string = 'username';
  @Input() hide: string[] = [];
=======
  @Input() customCSS: AmplifyUIInterface;
  @Input() signInConfig: any;
>>>>>>> initial commit
  @ViewChild(DynamicComponentDirective) componentHost: DynamicComponentDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    this.loadComponent();
  }

  ngOnDestroy() {}

  loadComponent() {

<<<<<<< HEAD
    let authComponent = this.framework && this.framework === 'ionic' ? 
      new ComponentMount(
        SignInComponentIonic,{
          authState: this.authState,
          hide: this.hide,
          usernameAttributes: this.usernameAttributes
        }) 
        : 
      new ComponentMount(
        SignInComponentCore, {
          authState: this.authState,
          hide: this.hide,
          usernameAttributes: this.usernameAttributes
        });

    const componentFactory = this.componentFactoryResolver
    .resolveComponentFactory(authComponent.component);

=======
    const data = {
      authState: this.authState,
      signInConfig: this.signInConfig,
      customCSS: this.customCSS
    };

    const authComponent = this.framework && this.framework === 'ionic' ?
      new ComponentMount(SignInComponentIonic, data):
      new ComponentMount(SignInComponentCore, data);

    const componentFactory = this.componentFactoryResolver
    .resolveComponentFactory(authComponent.component);

>>>>>>> initial commit
    const viewContainerRef = this.componentHost.viewContainerRef;
    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<SignInClass>componentRef.instance).data = authComponent.data;
  }
}
