"use strict";
/* eslint no-underscore-dangle: "off" */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isString_1 = __importDefault(require("lodash/isString"));
var storage_1 = require("@kinveysdk/storage");
var app_1 = require("@kinveysdk/app");
var errors_1 = require("@kinveysdk/errors");
var util_1 = require("util");
var SYNC_CACHE_COLLECTION_NAME = 'Sync';
var QUERY_CACHE_COLLECTION_NAME = 'Query';
function isValidTag(tag) {
    var regexp = /^[a-z0-9-]+$/i;
    return isString_1.default(tag) && regexp.test(tag);
}
exports.isValidTag = isValidTag;
var DataStoreCache = /** @class */ (function (_super) {
    __extends(DataStoreCache, _super);
    function DataStoreCache(collectionName, tag) {
        var _this = this;
        if (tag && !isValidTag(tag)) {
            throw new errors_1.KinveyError('A tag can only contain letters, numbers, and "-".');
        }
        if (tag) {
            _this = _super.call(this, app_1.getAppKey(), collectionName + "." + tag) || this;
        }
        else {
            _this = _super.call(this, app_1.getAppKey(), collectionName) || this;
        }
        return _this;
    }
    DataStoreCache.prototype.find = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var docs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype.find.call(this)];
                    case 1:
                        docs = _a.sent();
                        if (query) {
                            return [2 /*return*/, query.process(docs)];
                        }
                        return [2 /*return*/, docs];
                }
            });
        });
    };
    DataStoreCache.prototype.save = function (docs) {
        return __awaiter(this, void 0, void 0, function () {
            var savedDocs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!util_1.isArray(docs)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.save([docs])];
                    case 1:
                        savedDocs = _a.sent();
                        return [2 /*return*/, savedDocs.shift()];
                    case 2: return [2 /*return*/, _super.prototype.save.call(this, docs)];
                }
            });
        });
    };
    DataStoreCache.prototype.remove = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var docs, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.find(query)];
                    case 1:
                        docs = _a.sent();
                        return [4 /*yield*/, Promise.all(docs.map(function (doc) {
                                if (!doc._id) {
                                    throw new errors_1.KinveyError("Unable to remove doc " + JSON.stringify(doc), 'This doc is missing an _id.');
                                }
                                return _this.removeById(doc._id);
                            }))];
                    case 2:
                        results = _a.sent();
                        return [2 /*return*/, results.reduce(function (totalCount, count) { return totalCount + count; }, 0)];
                }
            });
        });
    };
    return DataStoreCache;
}(storage_1.Storage));
exports.DataStoreCache = DataStoreCache;
var SyncOperation;
(function (SyncOperation) {
    SyncOperation["Create"] = "POST";
    SyncOperation["Update"] = "PUT";
    SyncOperation["Delete"] = "DELETE";
})(SyncOperation = exports.SyncOperation || (exports.SyncOperation = {}));
;
var SyncCache = /** @class */ (function (_super) {
    __extends(SyncCache, _super);
    function SyncCache(collectionName, tag) {
        return _super.call(this, SYNC_CACHE_COLLECTION_NAME + "." + collectionName, tag) || this;
    }
    return SyncCache;
}(DataStoreCache));
exports.SyncCache = SyncCache;
var QueryCache = /** @class */ (function (_super) {
    __extends(QueryCache, _super);
    function QueryCache(collectionName, tag) {
        return _super.call(this, QUERY_CACHE_COLLECTION_NAME + "." + collectionName, tag) || this;
    }
    return QueryCache;
}(DataStoreCache));
exports.QueryCache = QueryCache;
//# sourceMappingURL=cache.js.map