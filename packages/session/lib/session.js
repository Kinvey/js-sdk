"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("@kinveysdk/app");
var store_1 = require("./store");
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
//# sourceMappingURL=session.js.map