"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isString_1 = __importDefault(require("lodash/isString"));
function parseJSON(data) {
    if (isString_1.default(data)) {
        try {
            return JSON.parse(data);
        }
        catch (error) {
            // TODO: log error
        }
    }
    return data;
}
function parse(contentType, data) {
    if (isString_1.default(contentType) && contentType.indexOf('application/json') !== -1) {
        return parseJSON(data);
    }
    return data;
}
exports.parse = parse;
//# sourceMappingURL=parse.js.map