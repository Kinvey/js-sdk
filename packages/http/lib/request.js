"use strict";
/* eslint no-underscore-dangle: "off" */
/* eslint @typescript-eslint/camelcase: "off" */
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
var p_queue_1 = __importDefault(require("p-queue"));
var errors_1 = require("@kinveysdk/errors");
var session_1 = require("@kinveysdk/session");
var app_1 = require("@kinveysdk/app");
var js_base64_1 = require("js-base64");
var headers_1 = require("./headers");
var response_1 = require("./response");
var http_1 = require("./http");
var serialize_1 = require("./serialize");
var auth_1 = require("./auth");
var utils_1 = require("./utils");
var HttpRequestMethod;
(function (HttpRequestMethod) {
    HttpRequestMethod["GET"] = "GET";
    HttpRequestMethod["POST"] = "POST";
    HttpRequestMethod["PUT"] = "PUT";
    HttpRequestMethod["DELETE"] = "DELETE";
})(HttpRequestMethod = exports.HttpRequestMethod || (exports.HttpRequestMethod = {}));
;
var HttpRequest = /** @class */ (function () {
    function HttpRequest(config) {
        this.method = HttpRequestMethod.GET;
        if (config) {
            this.headers = new headers_1.HttpHeaders(config.headers);
            if (config.method) {
                this.method = config.method;
            }
            this.url = config.url;
            this.body = serialize_1.serialize(this.headers.contentType, config.body);
            this.timeout = config.timeout;
        }
    }
    HttpRequest.prototype.toPlainObject = function () {
        return Object.assign({}, {
            headers: this.headers.toPlainObject(),
            method: this.method,
            url: this.url,
            body: this.body,
            timeout: this.timeout
        });
    };
    HttpRequest.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rawResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, http_1.send(this.toPlainObject())];
                    case 1:
                        rawResponse = _a.sent();
                        return [2 /*return*/, new response_1.HttpResponse(rawResponse)];
                }
            });
        });
    };
    return HttpRequest;
}());
exports.HttpRequest = HttpRequest;
var REQUEST_QUEUE = new p_queue_1.default();
function isRefreshRequestInProgress() {
    return REQUEST_QUEUE.isPaused;
}
function startRefreshProcess() {
    REQUEST_QUEUE.pause();
}
function stopRefreshProcess() {
    REQUEST_QUEUE.start();
}
var KinveyHttpRequest = /** @class */ (function (_super) {
    __extends(KinveyHttpRequest, _super);
    function KinveyHttpRequest(config) {
        var _this = _super.call(this, config) || this;
        _this.auth = config.auth;
        return _this;
    }
    KinveyHttpRequest.prototype.execute = function (refresh) {
        if (refresh === void 0) { refresh = true; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, httpResponse, response, error_1, micSession_1, refreshRequest, refreshResponse, newMicSession, session, loginRequest, loginResponse, newSession, refreshError_1, origResponse;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.headers;
                        return [4 /*yield*/, this.auth()];
                    case 1:
                        _a.authorization = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 12]);
                        return [4 /*yield*/, _super.prototype.execute.call(this)];
                    case 3:
                        httpResponse = _b.sent();
                        response = new response_1.KinveyHttpResponse(httpResponse.toPlainObject());
                        if (!response.isSuccess()) {
                            throw response.error;
                        }
                        return [2 /*return*/, response];
                    case 4:
                        error_1 = _b.sent();
                        if (!(refresh && error_1 instanceof errors_1.InvalidCredentialsError)) return [3 /*break*/, 11];
                        if (isRefreshRequestInProgress()) {
                            return [2 /*return*/, REQUEST_QUEUE.add(function () { return _this.execute(); })];
                        }
                        micSession_1 = session_1.getMICSession();
                        if (!(micSession_1 && micSession_1.refresh_token)) return [3 /*break*/, 11];
                        // Start refresh process
                        startRefreshProcess();
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 8, , 9]);
                        refreshRequest = new KinveyHttpRequest({
                            method: HttpRequestMethod.POST,
                            auth: function () { return __awaiter(_this, void 0, void 0, function () {
                                var credentials;
                                return __generator(this, function (_a) {
                                    credentials = js_base64_1.Base64.encode(micSession_1.client_id + ":" + app_1.getAppSecret());
                                    return [2 /*return*/, "Basic " + credentials];
                                });
                            }); },
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            url: utils_1.formatKinveyAuthUrl('/oauth/token'),
                            body: {
                                grant_type: 'refresh_token',
                                client_id: micSession_1.client_id,
                                redirect_uri: micSession_1.redirect_uri,
                                refresh_token: micSession_1.refresh_token
                            }
                        });
                        return [4 /*yield*/, refreshRequest.execute(false)];
                    case 6:
                        refreshResponse = _b.sent();
                        newMicSession = refreshResponse.data;
                        session = session_1.getSession();
                        loginRequest = new KinveyHttpRequest({
                            method: HttpRequestMethod.POST,
                            auth: auth_1.kinveyAppAuth,
                            url: utils_1.formatKinveyBaasUrl(utils_1.KinveyBaasNamespace.User, '/login'),
                            body: {
                                _socialIdentity: {
                                    kinveyAuth: {
                                        access_token: newMicSession.access_token,
                                        id: session._id
                                    }
                                }
                            }
                        });
                        return [4 /*yield*/, loginRequest.execute(false)];
                    case 7:
                        loginResponse = _b.sent();
                        newSession = loginResponse.data;
                        // Set the new session
                        session_1.setSession(newSession);
                        session_1.setMICSession(Object.assign(micSession_1, newMicSession));
                        return [3 /*break*/, 9];
                    case 8:
                        refreshError_1 = _b.sent();
                        // TODO: log error
                        throw error_1;
                    case 9: return [4 /*yield*/, this.execute()];
                    case 10:
                        origResponse = _b.sent();
                        // Stop refresh process
                        stopRefreshProcess();
                        // Return the original response
                        return [2 /*return*/, origResponse];
                    case 11: throw error_1;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    return KinveyHttpRequest;
}(HttpRequest));
exports.KinveyHttpRequest = KinveyHttpRequest;
//# sourceMappingURL=request.js.map