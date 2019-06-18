"use strict";
/* eslint no-useless-constructor: "off" */
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
var isFunction_1 = __importDefault(require("lodash/isFunction"));
var isArray_1 = __importDefault(require("lodash/isArray"));
var init_1 = require("../init");
var HttpHeaders = /** @class */ (function () {
    function HttpHeaders(headers) {
        var _this = this;
        this.headers = new Map();
        this.normalizedNames = new Map();
        if (headers) {
            if (headers instanceof HttpHeaders) {
                this.join(headers);
            }
            else {
                Object.keys(headers).forEach(function (name) {
                    _this.set(name, headers[name]);
                });
            }
        }
    }
    Object.defineProperty(HttpHeaders.prototype, "contentType", {
        get: function () {
            return this.get('Content-Type');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HttpHeaders.prototype, "authorization", {
        get: function () {
            return this.get('Authorization');
        },
        set: function (value) {
            this.set('Authorization', value);
        },
        enumerable: true,
        configurable: true
    });
    HttpHeaders.prototype.has = function (name) {
        return this.headers.has(name.toLowerCase());
    };
    HttpHeaders.prototype.get = function (name) {
        return this.headers.get(name.toLowerCase());
    };
    HttpHeaders.prototype.keys = function () {
        return Array.from(this.normalizedNames.values());
    };
    HttpHeaders.prototype.set = function (name, value) {
        if (isFunction_1.default(value)) {
            return this.set(name, value());
        }
        if (isArray_1.default(value)) {
            return this.set(name, value.join(','));
        }
        var key = name.toLowerCase();
        this.headers.set(key, value);
        if (!this.normalizedNames.has(key)) {
            this.normalizedNames.set(key, name);
        }
        return this;
    };
    HttpHeaders.prototype.join = function (headers) {
        var _this = this;
        headers
            .keys()
            .forEach(function (name) {
            var value = headers.get(name);
            if (value) {
                _this.set(name, value);
            }
        });
        return this;
    };
    HttpHeaders.prototype.delete = function (name) {
        return this.headers.delete(name);
    };
    HttpHeaders.prototype.toPlainObject = function () {
        var _this = this;
        return this
            .keys()
            .reduce(function (headers, header) {
            var _a;
            var value = _this.get(header);
            if (value) {
                return Object.assign(headers, (_a = {}, _a[header] = value, _a));
            }
            return headers;
        }, {});
    };
    HttpHeaders.fromHeaders = function (headers) {
        var httpHeaders = new HttpHeaders();
        if (headers) {
            if (headers instanceof HttpHeaders) {
                httpHeaders.join(headers);
            }
            else {
                Object.keys(headers).forEach(function (name) {
                    httpHeaders.set(name, headers[name]);
                });
            }
        }
        return httpHeaders;
    };
    return HttpHeaders;
}());
exports.HttpHeaders = HttpHeaders;
var KinveyHttpHeaders = /** @class */ (function (_super) {
    __extends(KinveyHttpHeaders, _super);
    function KinveyHttpHeaders(headers) {
        var _this = _super.call(this, headers) || this;
        // Add the Accept header
        if (!_this.has('Accept')) {
            _this.set('Accept', 'application/json; charset=utf-8');
        }
        // Add Content-Type header
        if (!_this.has('Content-Type')) {
            _this.set('Content-Type', 'application/json; charset=utf-8');
        }
        // Add the X-Kinvey-API-Version header
        if (!_this.has('X-Kinvey-Api-Version')) {
            _this.set('X-Kinvey-Api-Version', String(init_1.getApiVersion()));
        }
        return _this;
    }
    Object.defineProperty(KinveyHttpHeaders.prototype, "requestStart", {
        get: function () {
            return this.get('X-Kinvey-Request-Start');
        },
        enumerable: true,
        configurable: true
    });
    return KinveyHttpHeaders;
}(HttpHeaders));
exports.KinveyHttpHeaders = KinveyHttpHeaders;
//# sourceMappingURL=headers.js.map