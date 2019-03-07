/*
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import { ConsoleLogger as Logger } from '@aws-amplify/core';
import { AWSKinesisProvider } from './index';
import * as Firehose from 'aws-sdk/clients/firehose';

const logger = new Logger('AWSKineisFirehoseProvider');

// events buffer
const BUFFER_SIZE = 1000;
const FLUSH_SIZE = 100;
const FLUSH_INTERVAL = 5*1000; // 5s
const RESEND_LIMIT = 5;

export default class AWSKinesisFirehoseProvider extends AWSKinesisProvider {

    private _kinesisFirehose;
    private _credentials;

    constructor(config?) {
        super(config);
    }

    /**
     * get provider name of the plugin
     */
    public getProviderName(): string {
        return 'AWSKinesisFirehose';
    }

    protected _sendEvents(group) {
        if (group.length === 0) {
            // logger.debug('events array is empty, directly return');
            return;
        }

        const { config, credentials } = group[0];

        const initClients = this._init(config, credentials);
        if (!initClients) return false;

        const records = {};

        group.map(params => {
            // spit by streamName
            const evt = params.event;
            const { streamName } = evt;
            if (records[streamName] === undefined) {
                records[streamName] = [];
            }

            const PartitionKey = evt.partitionKey || ('partition-' + credentials.identityId);
            Object.assign(evt.data, { PartitionKey });
            const Data = JSON.stringify(evt.data);
            const record = { Data };
            records[streamName].push(record);
        });

        Object.keys(records).map(streamName => {
            logger.debug('putting records to kinesis', streamName, 'with records', records[streamName]);
            this._kinesisFirehose.putRecordBatch(
                {
                    Records: records[streamName],
                    DeliveryStreamName: streamName
                },
                (err, data)=> {
                    if (err) logger.debug('Failed to upload records to Kinesis', err);
                    else logger.debug('Upload records to stream', streamName);
                }
            );
        });
    }

    protected _initKinesis(region, credentials) {
        logger.debug('initialize kinesis firehose with credentials', credentials);
        this._kinesisFirehose = new Firehose({
            apiVersion: '2015-08-04',
            region,
            credentials
        });
        return true;
    }
}