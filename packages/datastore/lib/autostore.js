"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
// import { getApiVersion } from '@kinveysdk/app';
var networkstore_1 = require("./networkstore");
var network_1 = require("./network");
var cache_1 = require("./cache");
var sync_1 = require("./sync");
var AutoStore = /** @class */ (function (_super) {
    __extends(AutoStore, _super);
    function AutoStore(collectionName, tag) {
        var _this = _super.call(this, collectionName) || this;
        if (tag && !cache_1.isValidTag(tag)) {
            throw new errors_1.KinveyError('The provided tag is not valid.', 'A tag can only contain letters, numbers, and "-".');
        }
        _this.tag = tag;
        return _this;
    }
    AutoStore.prototype.find = function (query, options) {
        return __awaiter(this, void 0, void 0, function () {
            var cache, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cache = new cache_1.DataStoreCache(this.collectionName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.pull(query, options)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, cache.find(query)];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_1.NetworkError) {
                            return [2 /*return*/, cache.find(query)];
                        }
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AutoStore.prototype.findById = function (id, options) {
        return __awaiter(this, void 0, void 0, function () {
            var cache, query, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cache = new cache_1.DataStoreCache(this.collectionName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = new query_1.Query().equalTo('_id', id);
                        return [4 /*yield*/, this.pull(query, options)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, cache.findById(id)];
                    case 3:
                        error_2 = _a.sent();
                        if (error_2 instanceof errors_1.NetworkError) {
                            return [2 /*return*/, cache.findById(id)];
                        }
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // create(doc: T, options?: NetworkOptions): Promise<SyncPushResult>
    // create(docs: T[], options?: NetworkOptions): Promise<SyncPushResult[]>
    // async create(docs: any, options?: NetworkOptions): Promise<any> {
    //   const apiVersion = getApiVersion();
    //   if (apiVersion < 5 && isArray(docs)) {
    //     throw new KinveyError('Unable to create an array of docs. Please create docs one by one.');
    //   }
    //   if (!isArray()) {
    //     const results = await this.create([docs], options);
    //     return results.shift();
    //   }
    //   const cache = new DataStoreCache(this.collectionName, this.tag);
    //   const sync = new Sync(this.collectionName, this.tag);
    //   // Save the docs to the cache
    //   const cachedDocs = await cache.save(docs as T[]);
    //   // Attempt to sync the docs with the backend
    //   const syncDocs = await sync.addCreateSyncOperation(cachedDocs);
    //   return sync.push(syncDocs, options);
    // }
    // async update(doc: T, options?: NetworkOptions): Promise<SyncPushResult> {
    //   if (isArray(doc)) {
    //     throw new KinveyError('Unable to update an array of docs. Please update docs one by one.');
    //   }
    //   const cache = new DataStoreCache(this.collectionName, this.tag);
    //   const sync = new Sync(this.collectionName, this.tag);
    //   // Save the doc to the cache
    //   const cachedDoc = await cache.save(doc);
    //   // Attempt to sync the docs with the backend
    //   const syncDocs = await sync.addCreateSyncOperation([cachedDoc]);
    //   const results = await sync.push(syncDocs, options);
    //   return results.shift();
    // }
    AutoStore.prototype.pull = function (query, options) {
        return __awaiter(this, void 0, void 0, function () {
            var network, cache, response, docs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        network = new network_1.DataStoreNetwork(this.collectionName);
                        cache = new cache_1.DataStoreCache(this.collectionName);
                        return [4 /*yield*/, network.find(query, options)];
                    case 1:
                        response = _a.sent();
                        docs = response.data;
                        return [4 /*yield*/, cache.save(docs)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, docs.length];
                }
            });
        });
    };
    AutoStore.prototype.push = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var sync, syncDocs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sync = new sync_1.Sync(this.collectionName, this.tag);
                        return [4 /*yield*/, sync.find()];
                    case 1:
                        syncDocs = _a.sent();
                        return [2 /*return*/, sync.push(syncDocs, options)];
                }
            });
        });
    };
    return AutoStore;
}(networkstore_1.NetworkStore));
exports.AutoStore = AutoStore;
//# sourceMappingURL=autostore.js.map