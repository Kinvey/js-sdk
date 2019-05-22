"use strict";
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
var PQueue = require("p-queue");
var errors_1 = require("@kinveysdk/errors");
var utils_1 = require("./utils");
var queue = new PQueue({ concurrency: 1 });
var Storage = /** @class */ (function () {
    function Storage(dbName, collectionName) {
        this.dbName = dbName;
        this.collectionName = collectionName;
    }
    Object.defineProperty(Storage.prototype, "storageAdapter", {
        get: function () {
            throw new errors_1.KinveyError('You must override the Storage class and provide a storage adapter.');
        },
        enumerable: true,
        configurable: true
    });
    Storage.prototype.find = function () {
        var _this = this;
        return queue.add(function () { return _this.storageAdapter.find(_this.dbName, _this.collectionName); });
    };
    Storage.prototype.findById = function (id) {
        var _this = this;
        return queue.add(function () { return _this.storageAdapter.findById(_this.dbName, _this.collectionName, id); });
    };
    Storage.prototype.save = function (docsToSave) {
        var _this = this;
        return queue.add(function () { return __awaiter(_this, void 0, void 0, function () {
            var docs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        docs = docsToSave.slice(0, docsToSave.length);
                        // Add _id if it is missing
                        if (docs.length > 0) {
                            docs = docs.map(function (doc) {
                                if (!doc._id) {
                                    return Object.assign({}, doc, {
                                        _id: utils_1.generateId(),
                                        _kmd: Object.assign({}, doc._kmd, { local: true })
                                    });
                                }
                                return doc;
                            });
                        }
                        return [4 /*yield*/, this.storageAdapter.save(this.dbName, this.collectionName, docs)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, docs];
                }
            });
        }); });
    };
    Storage.prototype.remove = function (docs) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, queue.add(function () { return __awaiter(_this, void 0, void 0, function () {
                        var results;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Promise.all(docs.map(function (doc) {
                                        if (!doc._id) {
                                            throw new errors_1.KinveyError("Unable to remove doc " + JSON.stringify(doc), 'This is missing an _id.');
                                        }
                                        return _this.removeById(doc._id);
                                    }))];
                                case 1:
                                    results = _a.sent();
                                    return [2 /*return*/, results.reduce(function (totalCount, count) { return totalCount + count; }, 0)];
                            }
                        });
                    }); })];
            });
        });
    };
    Storage.prototype.removeById = function (id) {
        var _this = this;
        return queue.add(function () { return _this.storageAdapter.removeById(_this.dbName, _this.collectionName, id); });
    };
    Storage.prototype.clear = function () {
        var _this = this;
        return queue.add(function () { return _this.storageAdapter.clear(_this.dbName, _this.collectionName); });
    };
    return Storage;
}());
exports.Storage = Storage;
