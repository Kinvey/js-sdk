"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isNumber_1 = __importDefault(require("lodash/isNumber"));
var errors_1 = require("@kinveysdk/errors");
var config = null;
function init(_config) {
    // Check that an appKey was provided
    if (_config.appKey === null && _config.appKey === undefined) {
        throw new errors_1.KinveyError('No app key was provided to initialize the Kinvey JavaScript SDK.');
    }
    // Check that an appSecret or masterSecret was provided
    if (_config.appSecret === null && _config.appSecret === undefined) {
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
    if (!config) {
        throw new errors_1.KinveyError('The Kinvey JavaScript SDK has not been initialized.');
    }
    return config.appKey;
}
exports.getAppKey = getAppKey;
function getAppSecret() {
    if (!config) {
        throw new errors_1.KinveyError('The Kinvey JavaScript SDK has not been initialized.');
    }
    return config.appSecret;
}
exports.getAppSecret = getAppSecret;
function getInstanceId() {
    if (!config) {
        throw new errors_1.KinveyError('The Kinvey JavaScript SDK has not been initialized.');
    }
    return config.instanceId;
}
exports.getInstanceId = getInstanceId;
function getDefaultTimeout() {
    if (config && isNumber_1.default(config.defaultTimeout)) {
        return config.defaultTimeout;
    }
    return 60000; // 1 minute
}
exports.getDefaultTimeout = getDefaultTimeout;
function getEncryptionKey() {
    if (!config) {
        throw new errors_1.KinveyError('The Kinvey JavaScript SDK has not been initialized.');
    }
    return config.encryptionKey;
}
exports.getEncryptionKey = getEncryptionKey;
//# sourceMappingURL=init.js.map