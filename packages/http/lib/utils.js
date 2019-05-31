"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
var url_1 = require("url");
var url_join_1 = __importDefault(require("url-join"));
var app_1 = require("@kinveysdk/app");
function clean(value) {
    return Object.keys(value)
        .reduce(function (cleanVal, key) {
        var _a;
        var objVal = value[key];
        if (isPlainObject_1.default(objVal)) {
            objVal = clean(objVal);
        }
        if (typeof objVal !== 'undefined' && objVal !== null) {
            return Object.assign(cleanVal, (_a = {}, _a[key] = objVal, _a));
        }
        return cleanVal;
    }, {});
}
exports.clean = clean;
function getKinveyBaasProtocol() {
    return 'https';
}
exports.getKinveyBaasProtocol = getKinveyBaasProtocol;
function getKinveyBaasHost() {
    var instanceId = app_1.getInstanceId();
    if (instanceId) {
        return instanceId + "-baas.kinvey.com";
    }
    return 'baas.kinvey.com';
}
exports.getKinveyBaasHost = getKinveyBaasHost;
function getKinveyAuthProtocol() {
    return 'https';
}
exports.getKinveyAuthProtocol = getKinveyAuthProtocol;
function getKinveyAuthHost() {
    var instanceId = app_1.getInstanceId();
    if (instanceId) {
        return instanceId + "-auth.kinvey.com";
    }
    return 'auth.kinvey.com';
}
exports.getKinveyAuthHost = getKinveyAuthHost;
var KinveyBaasNamespace;
(function (KinveyBaasNamespace) {
    KinveyBaasNamespace["AppData"] = "appdata";
    KinveyBaasNamespace["Blob"] = "blob";
    KinveyBaasNamespace["Push"] = "push";
    KinveyBaasNamespace["Rpc"] = "rpc";
    KinveyBaasNamespace["User"] = "user";
})(KinveyBaasNamespace = exports.KinveyBaasNamespace || (exports.KinveyBaasNamespace = {}));
function formatKinveyBaasUrl(namespace, path, query) {
    return url_1.format({
        protocol: getKinveyBaasProtocol(),
        host: getKinveyBaasHost(),
        pathname: path ? url_join_1.default(namespace, app_1.getAppKey(), path) : url_join_1.default(namespace, app_1.getAppKey()),
        query: query ? clean(query) : undefined
    });
}
exports.formatKinveyBaasUrl = formatKinveyBaasUrl;
function formatKinveyAuthUrl(path, query) {
    return url_1.format({
        protocol: getKinveyAuthProtocol(),
        host: getKinveyAuthHost(),
        pathname: path,
        query: query ? clean(query) : undefined
    });
}
exports.formatKinveyAuthUrl = formatKinveyAuthUrl;
//# sourceMappingURL=utils.js.map