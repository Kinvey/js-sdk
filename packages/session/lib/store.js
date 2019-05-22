"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sdk_config_1 = require("@kinveysdk/sdk-config");
function getStore() {
    return sdk_config_1.getConfig(sdk_config_1.ConfigKey.SessionStorageAdapter);
}
function get(key) {
    return getStore().get(key);
}
exports.get = get;
function set(key, session) {
    return getStore().set(key, session);
}
exports.set = set;
function remove(key) {
    return getStore().remove(key);
}
exports.remove = remove;
