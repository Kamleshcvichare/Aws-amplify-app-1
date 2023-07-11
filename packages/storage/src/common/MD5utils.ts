// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Md5 } from '@aws-sdk/md5-js';
import { toBase64 } from '../AwsClients/S3/runtime';

export const calculateContentMd5 = async (
	content: Blob | File | string
): Promise<string> => {
	const hasher = new Md5();
	if (typeof content === 'string') {
		hasher.update(content);
	} else {
		const buffer = await readFile(content);
		hasher.update(buffer);
	}
	const digest = await hasher.digest();
	return toBase64(digest);
};

const readFile = (file: File | Blob): Promise<ArrayBuffer> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			if (reader.result) {
				resolve(reader.result as ArrayBuffer);
			} else {
				reject(new Error('Failed to read file!'));
			}
		};
		if (file !== undefined) reader.readAsArrayBuffer(file);
	});
};
