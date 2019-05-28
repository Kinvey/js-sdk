"use strict";
/* eslint no-underscore-dangle: "off" */
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("@kinveysdk/app");
var session_1 = require("@kinveysdk/session");
var js_base64_1 = require("js-base64");
var errors_1 = require("@kinveysdk/errors");
function kinveyAppAuth() {
    var credentials = js_base64_1.Base64.encode(app_1.getAppKey() + ":" + app_1.getAppSecret());
    return "Basic " + credentials;
}
exports.kinveyAppAuth = kinveyAppAuth;
function kinveySessionAuth() {
    var session = session_1.getSession();
    if (!session) {
        throw new errors_1.KinveyError('There is no active session to authorize the request.', 'Please login and retry the request.');
    }
    return "Kinvey " + session._kmd.authtoken;
}
exports.kinveySessionAuth = kinveySessionAuth;
function kinveySessionOrAppAuth() {
    try {
        return kinveySessionAuth();
    }
    catch (error) {
        return kinveyAppAuth();
    }
}
exports.kinveySessionOrAppAuth = kinveySessionOrAppAuth;
//# sourceMappingURL=auth.js.map