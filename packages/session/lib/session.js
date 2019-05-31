"use strict";
/* eslint no-underscore-dangle: "off" */
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("@kinveysdk/app");
var store_1 = require("./store");
var MIC_IDENTITY = 'kinveyAuth';
function getSessionKey() {
    return app_1.getAppKey() + ".active_user";
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
    var key = getSessionKey();
    store_1.set(key, JSON.stringify(session));
}
exports.setSession = setSession;
function removeSession() {
    var key = getSessionKey();
    return store_1.remove(key);
}
exports.removeSession = removeSession;
function getMICSession() {
    var session = getSession();
    if (session && session._socialIdentity && session._socialIdentity[MIC_IDENTITY]) {
        return session._socialIdentity[MIC_IDENTITY];
    }
    return null;
}
exports.getMICSession = getMICSession;
function setMICSession(micSession) {
    var _a;
    var session = getSession();
    session._socialIdentity = Object.assign(session._socialIdentity, (_a = {}, _a[MIC_IDENTITY] = micSession, _a));
    setSession(session);
}
exports.setMICSession = setMICSession;
//# sourceMappingURL=session.js.map