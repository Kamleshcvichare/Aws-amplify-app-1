/*
 * Copyright 2017-2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import React, { useMemo } from 'react';

import { Carousel } from '../../ui';

import MessageWrapper from '../MessageWrapper';
import { InAppMessageComponentContentProps } from '../types';

import CarouselMessageItem from './CarouselMessageItem';
import { defaultStyle } from './styles';
import { CarouselMessageProps } from './types';

export default function CarouselMessage(props: CarouselMessageProps) {
	const { data, ...rest } = props;
	const { style } = rest;

	const indicatorStyle = useMemo(
		() => ({
			active: [defaultStyle.pageIndicatorActive, style?.pageIndicatorActive],
			inactive: [defaultStyle.pageIndicatorInactive, style?.pageIndicatorInactive],
		}),
		[style]
	);

	const renderItem = ({ item }: { item: InAppMessageComponentContentProps }) => (
		<CarouselMessageItem {...item} {...rest} />
	);

	return (
		<MessageWrapper disableSafeAreaView>
			<Carousel
				data={data}
				renderItem={renderItem}
				indicatorActiveStyle={indicatorStyle.active}
				indicatorInactiveStyle={indicatorStyle.inactive}
			/>
		</MessageWrapper>
	);
}
