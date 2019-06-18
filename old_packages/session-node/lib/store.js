"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var store = new Map();
function get(key) {
    return store.get(key);
}
exports.get = get;
function set(key, session) {
    store.set(key, session);
}
exports.set = set;
function remove(key) {
    return store.delete(key);
}
exports.remove = remove;
//# sourceMappingURL=store.js.map