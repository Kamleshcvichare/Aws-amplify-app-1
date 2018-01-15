"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Common_1 = require("../Common");
var Auth_1 = require("../Auth");
var Cache_1 = require("../Cache");
var logger = new Common_1.ConsoleLogger('AnalyticsClass');
var NON_RETRYABLE_EXCEPTIONS = ['BadRequestException', 'SerializationException', 'ValidationException'];
var CACHE_EVENT_LIMIT = 200;
var CACHE_EVENT_ID_RANGE = 1000000;
/**
* Provide mobile analytics client functions
*/
var AnalyticsClass = /** @class */ (function () {
    /**
     * Initialize Analtyics
     * @param config - Configuration of the Analytics
     */
    function AnalyticsClass(config) {
        this.configure(config);
        var client_info = Common_1.ClientDevice.clientInfo();
        if (client_info.platform) {
            this._config.platform = client_info.platform;
        }
        // store endpointId into localstorage
        if (!this._config.endpointId) {
            /*
            if (window.localStorage) {
                let endpointId = window.localStorage.getItem('amplify_endpoint_id');
                if (!endpointId) {
                    endpointId = this.generateRandomString();
                    window.localStorage.setItem('amplify_endpoint_id', endpointId);
                }
                this._config.endpointId = endpointId;
            }
            else {
                this._config.endpointId = this.generateRandomString();
            }*/
            var credentials = this._config.credentials;
            if (credentials && credentials.identityId) {
                this._config.endpointId = credentials.identityId;
            }
        }
        this._buffer = [];
    }
    /**
     * configure Analytics
     * @param {Object} config - Configuration of the Analytics
     */
    AnalyticsClass.prototype.configure = function (config) {
        logger.debug('configure Analytics');
        var conf = config ? config.Analytics || config : {};
        // using app_id from aws-exports if provided
        if (conf['aws_mobile_analytics_app_id']) {
            conf = {
                appId: conf['aws_mobile_analytics_app_id'],
                region: conf['aws_project_region'],
                platform: 'other'
            };
        }
        // hard code region
        conf.region = 'us-east-1';
        this._config = Object.assign({}, this._config, conf);
        // no app id provided
        if (!this._config.appId) {
            logger.debug('Do not have appId yet.');
        }
        // async init clients
        this._initClients();
        return this._config;
    };
    /**
     * Record Session start
     * @return - A promise which resolves if event record successfully
     */
    AnalyticsClass.prototype.startSession = function () {
        var _this = this;
        logger.debug('record session start');
        var sessionId = this.generateRandomString();
        this._sessionId = sessionId;
        var clientContext = this._generateClientContext();
        var params = {
            clientContext: clientContext,
            events: [
                {
                    eventType: '_session.start',
                    timestamp: new Date().toISOString(),
                    'session': {
                        'id': sessionId,
                        'startTimestamp': new Date().toISOString()
                    }
                }
            ]
        };
        return new Promise(function (res, rej) {
            _this.mobileAnalytics.putEvents(params, _this._putEventsCallback(params, res, rej));
        });
    };
    /**
     * Record Session stop
     * @return - A promise which resolves if event record successfully
     */
    AnalyticsClass.prototype.stopSession = function () {
        var _this = this;
        logger.debug('record session stop');
        var sessionId = this._sessionId ? this._sessionId : this.generateRandomString();
        var clientContext = this._generateClientContext();
        var params = {
            clientContext: clientContext,
            events: [
                {
                    eventType: '_session.stop',
                    timestamp: new Date().toISOString(),
                    'session': {
                        'id': sessionId,
                        'startTimestamp': new Date().toISOString()
                    }
                }
            ]
        };
        return new Promise(function (res, rej) {
            _this.mobileAnalytics.putEvents(params, _this._putEventsCallback(params, res, rej));
        });
    };
    /**
     * @async
     * Restart Analytics client and record session stop
     * @return - A promise ehich resolves to be true if current credential exists
     */
    AnalyticsClass.prototype.restart = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.stopSession().then(function (data) {
                    return _this._initClients();
                }).catch(function (e) {
                    logger.debug('restart error', e);
                });
                return [2 /*return*/];
            });
        });
    };
    /**
    * Record one analytic event and send it to Pinpoint
    * @param {String} name - The name of the event
    * @param {Object} [attributs] - Attributes of the event
    * @param {Object} [metrics] - Event metrics
    * @return - A promise which resolves if event record successfully
    */
    AnalyticsClass.prototype.record = function (name, attributes, metrics) {
        var _this = this;
        logger.debug("record event: { name: " + name + ", attributes: " + attributes + ", metrics: " + metrics);
        // if mobile analytics client not ready, buffer it
        if (!this.mobileAnalytics) {
            logger.debug('mobileAnalytics not ready, put in buffer');
            this._buffer.push({
                name: name,
                attributes: attributes,
                metrics: metrics
            });
            return;
        }
        var clientContext = this._generateClientContext();
        var params = {
            clientContext: clientContext,
            events: [
                {
                    eventType: name,
                    timestamp: new Date().toISOString(),
                    attributes: attributes,
                    metrics: metrics
                }
            ]
        };
        return new Promise(function (res, rej) {
            _this.mobileAnalytics.putEvents(params, _this._putEventsCallback(params, res, rej));
        });
    };
    /**
     * @private
     * Callback function for MobileAnalytics putEvents
     */
    AnalyticsClass.prototype._putEventsCallback = function (params, res, rej) {
        var _this = this;
        return function (err, data) {
            if (err) {
                logger.debug('record event failed. ' + err);
                if (err.statusCode === undefined || err.statusCode === 400) {
                    if (err.code === 'ThrottlingException') {
                        logger.debug('get throttled, caching events');
                        _this._cacheEvents(params);
                    }
                }
                rej(err);
            }
            else {
                logger.debug('record event success. ' + data);
                _this._submitCachedEvents();
                res(data);
            }
        };
    };
    /**
     * @private
     * Submit cached events if put events succeeded
     */
    AnalyticsClass.prototype._submitCachedEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a, endpointId, appId, credentials, key, cachedEvents, first_item_id, params_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this._config, endpointId = _a.endpointId, appId = _a.appId, credentials = _a.credentials;
                        key = 'amplify_analytics_events_' + appId +
                            (credentials && credentials.authenticated ? '_' + endpointId : '');
                        return [4 /*yield*/, Cache_1.default.getItem(key)];
                    case 1:
                        cachedEvents = _b.sent();
                        if (!(cachedEvents && cachedEvents['length'] !== 0)) return [3 /*break*/, 3];
                        first_item_id = (cachedEvents['last_item_id']
                            - cachedEvents['length'] + 1
                            + cachedEvents['max_item_id'])
                            % cachedEvents['max_item_id'];
                        params_1 = cachedEvents[first_item_id];
                        logger.debug("getting cached event No." + first_item_id + " with params: ");
                        logger.debug(params_1);
                        // delete the event and restore cached events into cache
                        cachedEvents['length'] -= 1;
                        delete cachedEvents[first_item_id];
                        return [4 /*yield*/, Cache_1.default.setItem(key, cachedEvents)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, new Promise(function (res, rej) {
                                _this.mobileAnalytics.putEvents(params_1, _this._putEventsCallback(params_1, res, rej));
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @private
     * Cache events into the storage provided
     */
    AnalyticsClass.prototype._cacheEvents = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, endpointId, appId, credentials, key, cachedEvents;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this._config, endpointId = _a.endpointId, appId = _a.appId, credentials = _a.credentials;
                        key = 'amplify_analytics_events_' + appId +
                            (credentials && credentials.authenticated ? '_' + endpointId : '');
                        return [4 /*yield*/, Cache_1.default.getItem(key)];
                    case 1:
                        cachedEvents = _b.sent();
                        if (cachedEvents) {
                            if (cachedEvents['length'] > CACHE_EVENT_LIMIT) {
                                logger.debug('exceed limit of cached events. dumping it');
                                return [2 /*return*/];
                            }
                            cachedEvents['length'] += 1;
                            cachedEvents['last_item_id'] = (cachedEvents['last_item_id'] + 1) % cachedEvents['max_item_id'];
                            cachedEvents[cachedEvents['last_item_id']] = params;
                        }
                        else {
                            cachedEvents = {};
                            cachedEvents['length'] = 1;
                            cachedEvents['last_item_id'] = 0;
                            cachedEvents['max_item_id'] = CACHE_EVENT_ID_RANGE;
                            cachedEvents[cachedEvents['last_item_id']] = params;
                        }
                        return [4 /*yield*/, Cache_1.default.setItem(key, cachedEvents)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
    * Record one analytic event
    * @param {String} name - Event name
    * @param {Object} [attributes] - Attributes of the event
    * @param {Object} [metrics] - Event metrics
    */
    // async recordMonetization(name, attributes?: EventAttributes, metrics?: EventMetrics) {
    //     this.amaClient.recordMonetizationEvent(name, attributes, metrics);
    // }
    /**
     * @private
     * generate client context with endpoint Id and app Id provided
     */
    AnalyticsClass.prototype._generateClientContext = function () {
        var _a = this._config, endpointId = _a.endpointId, appId = _a.appId;
        var clientContext = {
            client: {
                client_id: endpointId
            },
            services: {
                mobile_analytics: {
                    app_id: appId
                }
            }
        };
        return JSON.stringify(clientContext);
    };
    /**
     * generate random string
     */
    AnalyticsClass.prototype.generateRandomString = function () {
        var result = '';
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (var i = 32; i > 0; i -= 1) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    };
    /**
     * @private
     * check if app Id exists
     */
    AnalyticsClass.prototype._checkConfig = function () {
        return !!this._config.appId;
    };
    /**
     * @private
     * check if current crednetials exists
     */
    AnalyticsClass.prototype._ensureCredentials = function () {
        var conf = this._config;
        // commented
        // will cause bug if another user logged in without refreshing page
        // if (conf.credentials) { return Promise.resolve(true); }
        return Auth_1.default.currentCredentials()
            .then(function (credentials) {
            var cred = Auth_1.default.essentialCredentials(credentials);
            logger.debug('set credentials for analytics', cred);
            conf.credentials = cred;
            if (!conf.endpointId && conf.credentials) {
                conf.endpointId = conf.credentials.identityId;
            }
            return true;
        })
            .catch(function (err) {
            logger.debug('ensure credentials error', err);
            return false;
        });
    };
    /**
     * @private
     * @async
     * init clients for Anlytics including mobile analytics and pinpoint
     * @return - True if initilization succeeds
     */
    AnalyticsClass.prototype._initClients = function () {
        return __awaiter(this, void 0, void 0, function () {
            var credentialsOK;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._checkConfig()) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this._ensureCredentials()];
                    case 1:
                        credentialsOK = _a.sent();
                        if (!credentialsOK) {
                            return [2 /*return*/, false];
                        }
                        this._initMobileAnalytics();
                        return [4 /*yield*/, this._initPinpoint()];
                    case 2:
                        _a.sent();
                        this.startSession();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * @private
     * Init mobile analytics and clear buffer
     */
    AnalyticsClass.prototype._initMobileAnalytics = function () {
        var _this = this;
        var _a = this._config, credentials = _a.credentials, region = _a.region;
        this.mobileAnalytics = new Common_1.MobileAnalytics({ credentials: credentials, region: region });
        if (this._buffer.length > 0) {
            logger.debug('something in buffer, flush it');
            var buffer = this._buffer;
            this._buffer = [];
            buffer.forEach(function (event) {
                _this.record(event.name, event.attributes, event.metrics);
            });
        }
    };
    /**
     * @private
     * Init Pinpoint with configuration and update pinpoint client endpoint
     * @return - A promise resolves if endpoint updated successfully
     */
    AnalyticsClass.prototype._initPinpoint = function () {
        var _this = this;
        var _a = this._config, region = _a.region, appId = _a.appId, endpointId = _a.endpointId, credentials = _a.credentials;
        this.pinpointClient = new Common_1.Pinpoint({
            region: region,
            credentials: credentials,
        });
        var request = this._endpointRequest();
        var update_params = {
            ApplicationId: appId,
            EndpointId: endpointId,
            EndpointRequest: request
        };
        logger.debug(update_params);
        return new Promise(function (res, rej) {
            _this.pinpointClient.updateEndpoint(update_params, function (err, data) {
                if (err) {
                    logger.debug('Pinpoint ERROR', err);
                    rej(err);
                }
                else {
                    logger.debug('Pinpoint SUCCESS', data);
                    res(data);
                }
            });
        });
    };
    /**
     * EndPoint request
     * @return {Object} - The request of updating endpoint
     */
    AnalyticsClass.prototype._endpointRequest = function () {
        var client_info = Common_1.ClientDevice.clientInfo();
        var credentials = this._config.credentials;
        var user_id = (credentials && credentials.authenticated) ? credentials.identityId : null;
        logger.debug('demographic user id: ' + user_id);
        return {
            Demographic: {
                AppVersion: this._config.appVersion || client_info.appVersion,
                Make: client_info.make,
                Model: client_info.model,
                ModelVersion: client_info.version,
                Platform: client_info.platform
            },
            User: { UserId: user_id }
        };
    };
    return AnalyticsClass;
}());
exports.default = AnalyticsClass;
//# sourceMappingURL=Analytics.js.map