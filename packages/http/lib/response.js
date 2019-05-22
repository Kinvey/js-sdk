"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        if (config) {
            this.statusCode = config.statusCode;
            this.headers = config.headers;
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
    return HttpResponse;
}());
exports.HttpResponse = HttpResponse;
