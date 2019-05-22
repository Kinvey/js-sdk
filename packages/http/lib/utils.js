"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isPlainObject_1 = require("lodash/isPlainObject");
var url_1 = require("url");
var url_join_1 = require("url-join");
var kinvey_app_1 = require("@kinveysdk/kinvey-app");
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
        protocol: kinvey_app_1.getBaasProtocol(),
        host: kinvey_app_1.getBaasHost(),
        pathname: path ? url_join_1.default(namespace, kinvey_app_1.getAppKey(), path) : url_join_1.default(namespace, kinvey_app_1.getAppKey()),
        query: query ? clean(query) : undefined
    });
}
exports.formatKinveyBaasUrl = formatKinveyBaasUrl;
