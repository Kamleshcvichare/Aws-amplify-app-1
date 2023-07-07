// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import '@aws-amplify/core/polyfills/URL'; // TODO: [v6] install react-native-url-polyfill separately

export {
	listObjectsV2,
	ListObjectsV2Input,
	ListObjectsV2Output,
} from './listObjectsV2';
export { putObject, PutObjectInput, PutObjectOutput } from './putObject';
export {
	abortMultipartUpload,
	AbortMultipartUploadInput,
	AbortMultipartUploadOutput,
} from './abortMultipartUpload';
export {
	completeMultipartUpload,
	CompleteMultipartUploadInput,
	CompleteMultipartUploadOutput,
} from './completeMultipartUpload';
export {
	createMultipartUpload,
	CreateMultipartUploadInput,
	CreateMultipartUploadOutput,
} from './createMultipartUpload';
export { listParts, ListPartsInput, ListPartsOutput } from './listParts';
export { uploadPart, UploadPartInput, UploadPartOutput } from './uploadPart';
export { copyObject, CopyObjectInput, CopyObjectOutput } from './copyObject';
export {
	deleteObject,
	DeleteObjectInput,
	DeleteObjectOutput,
} from './deleteObject';
export { getObject, GetObjectInput, GetObjectOutput } from './getObject';
export { headObject, HeadObjectInput, HeadObjectOutput } from './headObject';
