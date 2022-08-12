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

import { gunzipSync, strFromU8 } from 'fflate';

export const convert = (stream: Blob): Promise<Uint8Array> => {
	return new Promise(async (res, rej) => {
		const blobURL = URL.createObjectURL(stream);
		const request = new XMLHttpRequest();
		request.responseType = 'arraybuffer';
		request.onload = _event => {
			return res(new Uint8Array(request.response));
		};
		request.onerror = rej;
		request.open('GET', blobURL, true);
		request.send();
	});
};

export const base64ToArrayBuffer = (base64: string): Uint8Array => {
	const binary_string = window.atob(base64);
	const len = binary_string.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes;
};

export const unGzipBase64AsJson = <T>(gzipBase64: string): T => {
	// base64 decode
	// gzip decompress and convert to string
	// string to obj
	return JSON.parse(
		strFromU8(gunzipSync(base64ToArrayBuffer(gzipBase64)))
	) as T;
};
