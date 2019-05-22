"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sdk_config_1 = require("@kinveysdk/sdk-config");
var store_1 = require("./store");
function getSessionKey() {
    return sdk_config_1.getAppKey() + ".active_user";
}
function getSession() {
    var key = getSessionKey();
    var session = store_1.get(key);
    if (session) {
        return JSON.parse(session);
    }
    return null;
}
exports.getSession = getSession;
function setSession(session) {
    if (session) {
        var key = getSessionKey();
        return store_1.set(key, JSON.stringify(session));
    }
    return false;
}
exports.setSession = setSession;
function removeSession() {
    var key = getSessionKey();
    return store_1.remove(key);
}
exports.removeSession = removeSession;
