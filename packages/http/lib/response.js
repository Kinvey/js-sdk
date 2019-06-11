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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
var errors_1 = require("@kinveysdk/errors");
var headers_1 = require("./headers");
var parse_1 = require("./parse");
var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["Ok"] = 200] = "Ok";
    HttpStatusCode[HttpStatusCode["Created"] = 201] = "Created";
    HttpStatusCode[HttpStatusCode["Empty"] = 204] = "Empty";
    HttpStatusCode[HttpStatusCode["MovedPermanently"] = 301] = "MovedPermanently";
    HttpStatusCode[HttpStatusCode["Found"] = 302] = "Found";
    HttpStatusCode[HttpStatusCode["NotModified"] = 304] = "NotModified";
    HttpStatusCode[HttpStatusCode["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    HttpStatusCode[HttpStatusCode["PermanentRedirect"] = 308] = "PermanentRedirect";
    HttpStatusCode[HttpStatusCode["Unauthorized"] = 401] = "Unauthorized";
    HttpStatusCode[HttpStatusCode["Forbidden"] = 403] = "Forbidden";
    HttpStatusCode[HttpStatusCode["NotFound"] = 404] = "NotFound";
    HttpStatusCode[HttpStatusCode["ServerError"] = 500] = "ServerError";
})(HttpStatusCode = exports.HttpStatusCode || (exports.HttpStatusCode = {}));
var HttpResponse = /** @class */ (function () {
    function HttpResponse(config) {
        this.headers = new headers_1.HttpHeaders();
        if (config) {
            this.statusCode = config.statusCode;
            this.headers = new headers_1.HttpHeaders(config.headers);
            this.data = parse_1.parse(this.headers.contentType, config.data);
        }
    }
    HttpResponse.prototype.isSuccess = function () {
        return (this.statusCode >= 200 && this.statusCode < 300)
            || this.statusCode === HttpStatusCode.MovedPermanently
            || this.statusCode === HttpStatusCode.Found
            || this.statusCode === HttpStatusCode.NotModified
            || this.statusCode === HttpStatusCode.TemporaryRedirect
            || this.statusCode === HttpStatusCode.PermanentRedirect;
    };
    HttpResponse.prototype.toPlainObject = function () {
        return Object.assign({}, {
            statusCode: this.statusCode,
            headers: this.headers.toPlainObject(),
            data: this.data
        });
    };
    return HttpResponse;
}());
exports.HttpResponse = HttpResponse;
var KinveyHttpResponse = /** @class */ (function (_super) {
    __extends(KinveyHttpResponse, _super);
    function KinveyHttpResponse(config) {
        var _this = _super.call(this, config) || this;
        _this.headers = new headers_1.KinveyHttpHeaders();
        if (config) {
            _this.headers = new headers_1.KinveyHttpHeaders(config.headers);
        }
        return _this;
    }
    Object.defineProperty(KinveyHttpResponse.prototype, "error", {
        get: function () {
            if (!this.isSuccess()) {
                if (isPlainObject_1.default(this.data)) {
                    var message = this.data.message || this.data.description;
                    var name_1 = this.data.name || this.data.error;
                    var debug = this.data.debug;
                    if (name_1 === 'InvalidCredentials') {
                        return new errors_1.InvalidCredentialsError(message, debug);
                    }
                    return new errors_1.KinveyError(message, debug);
                }
                return new errors_1.KinveyError();
            }
            return null;
        },
        enumerable: true,
        configurable: true
    });
    return KinveyHttpResponse;
}(HttpResponse));
exports.KinveyHttpResponse = KinveyHttpResponse;
//# sourceMappingURL=response.js.map