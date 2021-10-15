/*
 * Copyright 2017-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import { ReactElement, ReactNode } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import {
	InAppMessage,
	InAppMessageAction,
	InAppMessageButton,
	InAppMessageContent,
} from '@aws-amplify/notifications';

// TODO: replace with actual Component types
type ButtonProps = any;
type IconButtonProps = any;

type InAppMessageComponentStyle = {
	closeIconButton?: StyleProp<IconButtonProps['style']>;
	container?: StyleProp<ViewStyle>;
	header?: StyleProp<TextStyle>;
	message?: StyleProp<TextStyle>;
	primaryButton?: StyleProp<ButtonProps['style']>;
	secondaryButton?: StyleProp<ButtonProps['style']>;
};

export type InAppMessageComponentStyles = {
	BannerMessage?: InAppMessageComponentStyle;
	CarouselMessage?: InAppMessageComponentStyle;
	FullScreenMessage?: InAppMessageComponentStyle;
	ModalMessage?: InAppMessageComponentStyle;
};

export type InAppMessagingContextType = {
	clearInAppMessages: () => void;
	components: InAppMessageComponents;
	displayInAppMessage: (inAppMessage: InAppMessage) => void;
	inAppMessages: InAppMessage[];
	style: InAppMessageComponentStyles;
};

export type InAppMessagingProviderProps = {
	children: ReactNode;
	components?: InAppMessageComponents;
	style?: InAppMessageComponentStyles;
};

export type InAppMessageComponentActionHandler = (
	action: InAppMessageAction,
	url?: string
) => Promise<void>;

export interface InAppMessageComponentButtonProps
	extends Omit<InAppMessageButton, 'action' | 'url'> {
	onPress: () => void;
}

export type InAppMessageComponentPosition = 'bottom' | 'middle' | 'top';

export interface InAppMessageComponentContentProps
	extends Omit<InAppMessageContent, 'primaryButton' | 'secondaryButton'> {
	primaryButton?: InAppMessageComponentButtonProps;
	secondaryButton?: InAppMessageComponentButtonProps;
}

export interface InAppMessageBaseComponentProps
	extends InAppMessageComponentContentProps {
	id: string;
	onClose?: () => void;
	style?: InAppMessageComponentStyle;
}

export interface BannerMessageProps extends InAppMessageBaseComponentProps {
	position: InAppMessageComponentPosition;
}

export interface CarouselMessageProps
	extends Omit<InAppMessageBaseComponentProps, 'content'> {
	data: InAppMessageComponentContentProps[];
}

export interface FullScreenMessageProps
	extends InAppMessageBaseComponentProps {}

export type InAppMessageComponentProps =
	| BannerMessageProps
	| CarouselMessageProps
	| FullScreenMessageProps;

export type InAppMessageComponent = (
	props: InAppMessageComponentProps
) => ReactElement;

export type InAppMessageComponents = {
	BannerMessage?: (props: BannerMessageProps) => ReactElement;
	CarouselMessage?: (props: CarouselMessageProps) => ReactElement;
	FullScreenMessage?: (props: FullScreenMessageProps) => ReactElement;
};
