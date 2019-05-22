"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateId(length) {
    if (length === void 0) { length = 24; }
    var chars = 'abcdef0123456789';
    var id = '';
    for (var i = 0, j = chars.length; i < length; i += 1) {
        var pos = Math.floor(Math.random() * j);
        id += chars.substring(pos, pos + 1);
    }
    return id;
}
exports.generateId = generateId;
