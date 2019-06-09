"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isString_1 = __importDefault(require("lodash/isString"));
function serialize(contentType, body) {
    if (contentType === void 0) { contentType = 'application/json'; }
    if (body && !isString_1.default(body)) {
        if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
            var str = Object
                .keys(body)
                .reduce(function (parts, key) {
                parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(body[key]));
                return parts;
            }, []);
            return str.join('&');
        }
        if (contentType.indexOf('application/json') === 0) {
            return JSON.stringify(body);
        }
    }
    return body;
}
exports.serialize = serialize;
//# sourceMappingURL=serialize.js.map