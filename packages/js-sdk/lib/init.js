"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isNumber_1 = __importDefault(require("lodash/isNumber"));
var isString_1 = __importDefault(require("lodash/isString"));
var isEmpty_1 = __importDefault(require("lodash/isEmpty"));
var errors_1 = require("./errors");
var config = {
    appKey: '',
    appSecret: '',
    defaultTimeout: 60000,
    apiVersion: 4
};
function getAppKey() {
    if (isEmpty_1.default(config.appKey)) {
        throw new errors_1.KinveyError('An appKey has not been set. Please initialize the SDK.');
    }
    return config.appKey;
}
exports.getAppKey = getAppKey;
function setAppKey(appKey) {
    if (!isString_1.default(appKey)) {
        throw new errors_1.KinveyError('The appKey must be a string.');
    }
    config.appKey = appKey;
}
exports.setAppKey = setAppKey;
function getAppSecret() {
    if (isEmpty_1.default(config.appSecret)) {
        throw new errors_1.KinveyError('An appSecret has not been set. Please initialize the SDK.');
    }
    return config.appSecret;
}
exports.getAppSecret = getAppSecret;
function setAppSecret(appSecret) {
    if (!isString_1.default(appSecret)) {
        throw new errors_1.KinveyError('The appSecret must be a string.');
    }
    config.appSecret = appSecret;
}
exports.setAppSecret = setAppSecret;
function getInstanceId() {
    return config.instanceId;
}
exports.getInstanceId = getInstanceId;
function setInstanceId(instanceId) {
    if (!isString_1.default(instanceId)) {
        throw new errors_1.KinveyError('The instanceId must be a string.');
    }
    config.instanceId = instanceId;
}
exports.setInstanceId = setInstanceId;
function getDefaultTimeout() {
    return config.defaultTimeout;
}
exports.getDefaultTimeout = getDefaultTimeout;
function setDefaultTimeout(timeout) {
    if (!isNumber_1.default(timeout)) {
        throw new errors_1.KinveyError('The default timeout must be a number.', timeout + " was provided as a default timeout.");
    }
    config.defaultTimeout = timeout;
}
exports.setDefaultTimeout = setDefaultTimeout;
function getEncryptionKey() {
    return config.encryptionKey;
}
exports.getEncryptionKey = getEncryptionKey;
function setEncryptionKey(encryptionKey) {
    if (!isString_1.default(encryptionKey)) {
        throw new errors_1.KinveyError('The encryptionKey must be a string.');
    }
    config.encryptionKey = encryptionKey;
}
exports.setEncryptionKey = setEncryptionKey;
function getApiVersion() {
    return config.apiVersion;
}
exports.getApiVersion = getApiVersion;
function setApiVersion(version) {
    if (!isNumber_1.default(version)) {
        throw new errors_1.KinveyError('The api version must be a number.');
    }
    config.apiVersion = version;
}
exports.setApiVersion = setApiVersion;
function init(sdkConfig) {
    // Check that an appKey was provided
    if (sdkConfig.appKey === null && sdkConfig.appKey === undefined) {
        throw new errors_1.KinveyError('No app key was provided to initialize the Kinvey JavaScript SDK.');
    }
    // Check that an appSecret or masterSecret was provided
    if (sdkConfig.appSecret === null && sdkConfig.appSecret === undefined) {
        throw new errors_1.KinveyError('No app secret was provided to initialize the Kinvey JavaScript SDK.');
    }
    setAppKey(sdkConfig.appKey);
    setAppSecret(sdkConfig.appSecret);
    if (sdkConfig.instanceId) {
        setInstanceId(sdkConfig.instanceId);
    }
    if (sdkConfig.defaultTimeout) {
        setDefaultTimeout(sdkConfig.defaultTimeout);
    }
    if (sdkConfig.encryptionKey) {
        setEncryptionKey(sdkConfig.encryptionKey);
    }
    if (sdkConfig.apiVersion) {
        setApiVersion(sdkConfig.apiVersion);
    }
}
exports.init = init;
//# sourceMappingURL=init.js.map