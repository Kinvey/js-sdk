"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isNumber_1 = require("lodash/isNumber");
var errors_1 = require("@kinveysdk/errors");
var config = null;
function init(_config) {
    // Check that an appKey was provided
    if (_config.appKey === null && _config.appKey === undefined) {
        throw new errors_1.KinveyError('No app key was provided to initialize the Kinvey JavaScript SDK.');
    }
    // Check that an appSecret or masterSecret was provided
    if (_config.appSecret === null
        && _config.appSecret === undefined
        && _config.masterSecret === null
        && _config.masterSecret === undefined) {
        throw new errors_1.KinveyError('No app secret was provided to initialize the Kinvey JavaScript SDK.');
    }
    // Check that default timeout is a number
    if (_config.defaultTimeout && !isNumber_1.default(_config.defaultTimeout)) {
        throw new errors_1.KinveyError('The default timeout must be a number.', _config.defaultTimeout + " was provided as a default timeout.");
    }
    config = _config;
}
exports.init = init;
function getAppKey() {
    return config.appKey;
}
exports.getAppKey = getAppKey;
function getAppSecret() {
    return config.appSecret;
}
exports.getAppSecret = getAppSecret;
function getMasterSecret() {
    return config.masterSecret;
}
exports.getMasterSecret = getMasterSecret;
function getInstanceId() {
    return config.instanceId;
}
exports.getInstanceId = getInstanceId;
function getBaasProtocol() {
    return 'https';
}
exports.getBaasProtocol = getBaasProtocol;
function getBaasHost() {
    var instanceId = getInstanceId();
    if (instanceId) {
        return instanceId + "-baas.kinvey.com";
    }
    return 'baas.kinvey.com';
}
exports.getBaasHost = getBaasHost;
function getAuthProtocol() {
    return 'https';
}
exports.getAuthProtocol = getAuthProtocol;
function getAuthHost() {
    var instanceId = getInstanceId();
    if (instanceId) {
        return instanceId + "-auth.kinvey.com";
    }
    return 'auth.kinvey.com';
}
exports.getAuthHost = getAuthHost;
function getDefaultTimeout() {
    if (isNumber_1.default(config.defaultTimeout)) {
        return config.defaultTimeout;
    }
    return 60000; // 1 minute
}
exports.getDefaultTimeout = getDefaultTimeout;
function getEncryptionKey() {
    return config.encryptionKey;
}
exports.getEncryptionKey = getEncryptionKey;
