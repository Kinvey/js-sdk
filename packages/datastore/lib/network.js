"use strict";
/* eslint no-underscore-dangle: "off" */
/* eslint @typescript-eslint/camelcase: "off" */
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("@kinveysdk/http");
var errors_1 = require("@kinveysdk/errors");
;
var DataStoreNetwork = /** @class */ (function () {
    function DataStoreNetwork(collectionName) {
        this.collectionName = collectionName;
    }
    DataStoreNetwork.prototype.find = function (query, options) {
        if (options === void 0) { options = {}; }
        var queryObject = Object.assign(query ? query.toHttpQueryObject() : {}, { kinveyfile_ttl: options.kinveyFileTTL, kinveyfile_tls: options.kinveyFileTLS });
        var request = new http_1.KinveyHttpRequest({
            method: http_1.HttpRequestMethod.GET,
            auth: http_1.kinveySessionAuth,
            url: http_1.formatKinveyBaasUrl(http_1.KinveyBaasNamespace.AppData, "/" + this.collectionName, queryObject),
            skipBL: options.skipBL,
            trace: options.trace,
            properties: options.properties
        });
        return request.execute();
    };
    DataStoreNetwork.prototype.findById = function (id, options) {
        if (options === void 0) { options = {}; }
        var queryObject = Object.assign({ kinveyfile_ttl: options.kinveyFileTTL, kinveyfile_tls: options.kinveyFileTLS });
        var request = new http_1.KinveyHttpRequest({
            method: http_1.HttpRequestMethod.GET,
            auth: http_1.kinveySessionAuth,
            url: http_1.formatKinveyBaasUrl(http_1.KinveyBaasNamespace.AppData, "/" + this.collectionName + "/" + id, queryObject),
            skipBL: options.skipBL,
            trace: options.trace,
            properties: options.properties
        });
        return request.execute();
    };
    DataStoreNetwork.prototype.count = function (query, options) {
        if (options === void 0) { options = {}; }
        var queryObject = Object.assign(query ? query.toHttpQueryObject() : {}, { kinveyfile_ttl: options.kinveyFileTTL, kinveyfile_tls: options.kinveyFileTLS });
        var request = new http_1.KinveyHttpRequest({
            method: http_1.HttpRequestMethod.GET,
            auth: http_1.kinveySessionAuth,
            url: http_1.formatKinveyBaasUrl(http_1.KinveyBaasNamespace.AppData, "/" + this.collectionName + "/_count", queryObject),
            skipBL: options.skipBL,
            trace: options.trace,
            properties: options.properties
        });
        return request.execute();
    };
    DataStoreNetwork.prototype.create = function (docs, options) {
        if (options === void 0) { options = {}; }
        var request = new http_1.KinveyHttpRequest({
            method: http_1.HttpRequestMethod.POST,
            auth: http_1.kinveySessionAuth,
            url: http_1.formatKinveyBaasUrl(http_1.KinveyBaasNamespace.AppData, "/" + this.collectionName),
            body: docs,
            skipBL: options.skipBL,
            trace: options.trace,
            properties: options.properties
        });
        return request.execute();
    };
    DataStoreNetwork.prototype.update = function (doc, options) {
        if (options === void 0) { options = {}; }
        if (!doc._id) {
            throw new errors_1.KinveyError('The doc provided does not contain an _id. An _id is required to update the doc.');
        }
        var request = new http_1.KinveyHttpRequest({
            method: http_1.HttpRequestMethod.PUT,
            auth: http_1.kinveySessionAuth,
            url: http_1.formatKinveyBaasUrl(http_1.KinveyBaasNamespace.AppData, "/" + this.collectionName + "/" + doc._id),
            body: doc,
            skipBL: options.skipBL,
            trace: options.trace,
            properties: options.properties
        });
        return request.execute();
    };
    DataStoreNetwork.prototype.remove = function (query, options) {
        if (options === void 0) { options = {}; }
        var queryObject = Object.assign(query ? query.toHttpQueryObject() : {});
        var request = new http_1.KinveyHttpRequest({
            method: http_1.HttpRequestMethod.DELETE,
            auth: http_1.kinveySessionAuth,
            url: http_1.formatKinveyBaasUrl(http_1.KinveyBaasNamespace.AppData, "/" + this.collectionName, queryObject),
            skipBL: options.skipBL,
            trace: options.trace,
            properties: options.properties
        });
        return request.execute();
    };
    DataStoreNetwork.prototype.removeById = function (id, options) {
        if (options === void 0) { options = {}; }
        var request = new http_1.KinveyHttpRequest({
            method: http_1.HttpRequestMethod.DELETE,
            auth: http_1.kinveySessionAuth,
            url: http_1.formatKinveyBaasUrl(http_1.KinveyBaasNamespace.AppData, "/" + this.collectionName + "/" + id),
            skipBL: options.skipBL,
            trace: options.trace,
            properties: options.properties
        });
        return request.execute();
    };
    return DataStoreNetwork;
}());
exports.DataStoreNetwork = DataStoreNetwork;
//# sourceMappingURL=network.js.map