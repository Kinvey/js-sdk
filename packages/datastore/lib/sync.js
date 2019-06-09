"use strict";
/* eslint no-underscore-dangle: "off" */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("@kinveysdk/errors");
var query_1 = require("@kinveysdk/query");
var cache_1 = require("./cache");
var network_1 = require("./network");
var Sync = /** @class */ (function () {
    function Sync(collectionName, tag) {
        this.collectionName = collectionName;
        this.tag = tag;
    }
    Sync.prototype.find = function () {
        var syncCache = new cache_1.SyncCache(this.collectionName, this.tag);
        return syncCache.find();
    };
    Sync.prototype.addCreateSyncOperation = function (docs) {
        return this.addSyncOperation(cache_1.SyncOperation.Create, docs);
    };
    Sync.prototype.addUpdateSyncOperation = function (docs) {
        return this.addSyncOperation(cache_1.SyncOperation.Update, docs);
    };
    Sync.prototype.addDeleteSyncOperation = function (docs) {
        return this.addSyncOperation(cache_1.SyncOperation.Delete, docs);
    };
    Sync.prototype.addSyncOperation = function (operation, docs) {
        return __awaiter(this, void 0, void 0, function () {
            var syncCache, docsToSync, syncDocs, docWithNoId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        syncCache = new cache_1.SyncCache(this.collectionName, this.tag);
                        docsToSync = [].concat(docs);
                        syncDocs = [];
                        if (!(docsToSync.length > 0)) return [3 /*break*/, 3];
                        docWithNoId = docsToSync.find(function (doc) { return !doc._id; });
                        if (docWithNoId) {
                            throw new errors_1.KinveyError('A doc is missing an _id. All docs must have an _id in order to be added to the Kinvey sync collection.');
                        }
                        // Remove existing sync events that match the docs
                        return [4 /*yield*/, syncCache.remove(new query_1.Query().contains('doc._id', docsToSync.map(function (doc) { return doc._id; })))];
                    case 1:
                        // Remove existing sync events that match the docs
                        _a.sent();
                        // Don't add delete operations for docs that were created offline
                        if (operation === cache_1.SyncOperation.Delete) {
                            docsToSync = docsToSync.filter(function (doc) {
                                if (doc._kmd && doc._kmd.local === true) {
                                    return false;
                                }
                                return true;
                            });
                        }
                        return [4 /*yield*/, syncCache.save(docsToSync.map(function (doc) {
                                return {
                                    doc: doc,
                                    state: {
                                        operation: operation
                                    }
                                };
                            }))];
                    case 2:
                        // Add sync operations for the docs
                        syncDocs = _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, syncDocs];
                }
            });
        });
    };
    Sync.prototype.push = function (docs, options) {
        if (docs === void 0) { docs = []; }
        return __awaiter(this, void 0, void 0, function () {
            var network, cache, syncCache, batchSize, i_1, batchPush_1;
            var _this = this;
            return __generator(this, function (_a) {
                network = new network_1.DataStoreNetwork(this.collectionName);
                cache = new cache_1.DataStoreCache(this.collectionName, this.tag);
                syncCache = new cache_1.SyncCache(this.collectionName, this.tag);
                batchSize = 100;
                if (docs.length > 0) {
                    i_1 = 0;
                    batchPush_1 = function (pushResults) {
                        if (pushResults === void 0) { pushResults = []; }
                        return __awaiter(_this, void 0, void 0, function () {
                            var batch, results;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        batch = docs.slice(i_1, i_1 + batchSize);
                                        i_1 += batchSize;
                                        return [4 /*yield*/, Promise.all(batch.map(function (syncDoc) { return __awaiter(_this, void 0, void 0, function () {
                                                var _id, doc, state, operation, error_1, error_2, local, savedDoc, response, response, error_3;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            _id = syncDoc._id, doc = syncDoc.doc, state = syncDoc.state;
                                                            operation = state.operation;
                                                            if (!(operation === cache_1.SyncOperation.Delete)) return [3 /*break*/, 9];
                                                            _a.label = 1;
                                                        case 1:
                                                            _a.trys.push([1, 7, , 8]);
                                                            _a.label = 2;
                                                        case 2:
                                                            _a.trys.push([2, 4, , 5]);
                                                            // Remove the doc from the backend
                                                            return [4 /*yield*/, network.removeById(doc._id, options)];
                                                        case 3:
                                                            // Remove the doc from the backend
                                                            _a.sent();
                                                            return [3 /*break*/, 5];
                                                        case 4:
                                                            error_1 = _a.sent();
                                                            // Rethrow the error if it is not a NotFoundError
                                                            if (!(error_1 instanceof errors_1.NotFoundError)) {
                                                                throw error_1;
                                                            }
                                                            return [3 /*break*/, 5];
                                                        case 5: 
                                                        // Remove the sync doc
                                                        return [4 /*yield*/, syncCache.removeById(_id)];
                                                        case 6:
                                                            // Remove the sync doc
                                                            _a.sent();
                                                            // Return a result
                                                            return [2 /*return*/, {
                                                                    doc: doc,
                                                                    operation: operation
                                                                }];
                                                        case 7:
                                                            error_2 = _a.sent();
                                                            // Return a result with the error
                                                            return [2 /*return*/, {
                                                                    doc: doc,
                                                                    operation: operation,
                                                                    error: error_2
                                                                }];
                                                        case 8: return [3 /*break*/, 20];
                                                        case 9:
                                                            if (!(operation === cache_1.SyncOperation.Create || cache_1.SyncOperation.Update)) return [3 /*break*/, 20];
                                                            local = false;
                                                            savedDoc = void 0;
                                                            _a.label = 10;
                                                        case 10:
                                                            _a.trys.push([10, 19, , 20]);
                                                            if (!(operation === cache_1.SyncOperation.Create)) return [3 /*break*/, 12];
                                                            if (doc._kmd && doc._kmd.local === true) {
                                                                local = true;
                                                                delete doc._id;
                                                                delete doc._kmd.local;
                                                            }
                                                            return [4 /*yield*/, network.create(doc, options)];
                                                        case 11:
                                                            response = _a.sent();
                                                            savedDoc = response.data;
                                                            return [3 /*break*/, 14];
                                                        case 12: return [4 /*yield*/, network.update(doc, options)];
                                                        case 13:
                                                            response = _a.sent();
                                                            savedDoc = response.data;
                                                            _a.label = 14;
                                                        case 14: 
                                                        // Remove the sync doc
                                                        return [4 /*yield*/, syncCache.removeById(_id)];
                                                        case 15:
                                                            // Remove the sync doc
                                                            _a.sent();
                                                            // Save the doc to cache
                                                            return [4 /*yield*/, cache.save(savedDoc)];
                                                        case 16:
                                                            // Save the doc to cache
                                                            _a.sent();
                                                            if (!local) return [3 /*break*/, 18];
                                                            return [4 /*yield*/, cache.removeById(doc._id)];
                                                        case 17:
                                                            _a.sent();
                                                            _a.label = 18;
                                                        case 18: 
                                                        // Return a result
                                                        return [2 /*return*/, {
                                                                doc: savedDoc,
                                                                operation: operation
                                                            }];
                                                        case 19:
                                                            error_3 = _a.sent();
                                                            // Return a result with the error
                                                            return [2 /*return*/, {
                                                                    doc: savedDoc,
                                                                    operation: operation,
                                                                    error: error_3
                                                                }];
                                                        case 20: 
                                                        // Return a default result
                                                        return [2 /*return*/, {
                                                                doc: doc,
                                                                operation: operation,
                                                                error: new errors_1.KinveyError('Unable to push item in sync collection because the operation was not recognized.')
                                                            }];
                                                    }
                                                });
                                            }); }))];
                                    case 1:
                                        results = _a.sent();
                                        // Push remaining docs
                                        return [2 /*return*/, batchPush_1(pushResults.concat(results))];
                                }
                            });
                        });
                    };
                    return [2 /*return*/, batchPush_1([])];
                }
                return [2 /*return*/, []];
            });
        });
    };
    return Sync;
}());
exports.Sync = Sync;
//# sourceMappingURL=sync.js.map