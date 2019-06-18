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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isString_1 = __importDefault(require("lodash/isString"));
var isArray_1 = __importDefault(require("lodash/isArray"));
var kmd_1 = require("../kmd");
var init_1 = require("../init");
var errors_1 = require("../errors");
var network_1 = require("./network");
var NetworkStore = /** @class */ (function () {
    function NetworkStore(collectionName) {
        if (!isString_1.default(collectionName)) {
            throw new errors_1.KinveyError('A collectionName is required and must be a string.');
        }
        this.collectionName = collectionName;
    }
    NetworkStore.prototype.find = function (query, options) {
        return __awaiter(this, void 0, void 0, function () {
            var network, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        network = new network_1.DataStoreNetwork(this.collectionName);
                        return [4 /*yield*/, network.find(query, options)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    NetworkStore.prototype.create = function (docs, options) {
        return __awaiter(this, void 0, void 0, function () {
            var batchSize, apiVersion, i_1, batchCreate_1, network, response;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        batchSize = 100;
                        apiVersion = init_1.getApiVersion();
                        if (apiVersion !== 5 && isArray_1.default(docs)) {
                            throw new errors_1.KinveyError('Unable to create an array of docs. Please create docs one by one.');
                        }
                        if (isArray_1.default(docs) && docs.length > batchSize) {
                            i_1 = 0;
                            batchCreate_1 = function (result) {
                                if (result === void 0) { result = { entities: [], errors: [] }; }
                                return __awaiter(_this, void 0, void 0, function () {
                                    var batch, batchResult;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (i_1 >= docs.length) {
                                                    return [2 /*return*/, result];
                                                }
                                                batch = docs.slice(i_1, i_1 + batchSize);
                                                i_1 += batch.length;
                                                return [4 /*yield*/, this.create(batch, options)];
                                            case 1:
                                                batchResult = _a.sent();
                                                return [2 /*return*/, batchCreate_1({
                                                        entities: result.entities.concat(batchResult.entities),
                                                        errors: result.errors.concat(batchResult.errors)
                                                    })];
                                        }
                                    });
                                });
                            };
                            return [2 /*return*/, batchCreate_1()];
                        }
                        network = new network_1.DataStoreNetwork(this.collectionName);
                        return [4 /*yield*/, network.create(docs, options)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    NetworkStore.prototype.update = function (doc, options) {
        return __awaiter(this, void 0, void 0, function () {
            var network, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (isArray_1.default(doc)) {
                            throw new errors_1.KinveyError('Unable to update an array of docs. Please update docs one by one.');
                        }
                        if (!doc._id) {
                            throw new errors_1.KinveyError('The doc does not contain an _id. An _id is required to update the doc.');
                        }
                        network = new network_1.DataStoreNetwork(this.collectionName);
                        return [4 /*yield*/, network.update(doc, options)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    NetworkStore.prototype.save = function (docs, options) {
        if (!isArray_1.default(docs)) {
            var kmd = new kmd_1.Kmd(docs._kmd);
            if (docs._id && !kmd.isLocal()) {
                return this.update(docs, options);
            }
        }
        return this.create(docs, options);
    };
    return NetworkStore;
}());
exports.NetworkStore = NetworkStore;
//# sourceMappingURL=networkstore.js.map