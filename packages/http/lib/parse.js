"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isString_1 = require("lodash/isString");
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
    if (contentType.indexOf('application/json') !== -1) {
        return parseJSON(data);
    }
    return data;
}
exports.parse = parse;
