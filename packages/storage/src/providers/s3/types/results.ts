// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
	StorageDownloadDataResult,
	StorageGetUrlResult,
	StorageUploadResult,
} from '../../../types';
import { StorageGetPropertiesResult } from '../../../types/results';

type S3Item = {
	/**
	 * Creation date of the object.
	 */
	lastModified?: Date;
	/**
	 * Size of the body in bytes.
	 */
	contentLength?: number;
	/**
	 * An entity tag (ETag) is an opaque identifier assigned by a web server to a specific version of a resource found at
	 * a URL.
	 */
	eTag?: string;
	/**
	 * The user-defined metadata for the object uploaded to S3.
	 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html#UserMetadata
	 */
	metadata?: Record<string, string>;
	//TODO add versionId
};

export type S3DownloadDataResult = StorageDownloadDataResult & S3Item;

export type S3DownloadFileResult = S3Item;

export type S3GetUrlResult = StorageGetUrlResult;

export type S3UploadDataResult = StorageUploadResult;

export type S3UploadFileResult = StorageUploadResult;

export type S3GetPropertiesResult = StorageGetPropertiesResult & S3Item;
