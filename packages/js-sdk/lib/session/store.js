"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DefaultSessionStore = /** @class */ (function () {
    function DefaultSessionStore() {
        this.store = new Map();
    }
    DefaultSessionStore.prototype.get = function (key) {
        return this.store.get(key);
    };
    DefaultSessionStore.prototype.set = function (key, session) {
        this.store.set(key, session);
    };
    DefaultSessionStore.prototype.remove = function (key) {
        return this.store.delete(key);
    };
    return DefaultSessionStore;
}());
var store = new DefaultSessionStore();
function getSessionStore() {
    return store;
}
exports.getSessionStore = getSessionStore;
function setSessionStore(_store) {
    store = _store;
}
exports.setSessionStore = setSessionStore;
function get(key) {
    return getSessionStore().get(key);
}
exports.get = get;
function set(key, session) {
    getSessionStore().set(key, session);
}
exports.set = set;
function remove(key) {
    return getSessionStore().remove(key);
}
exports.remove = remove;
//# sourceMappingURL=store.js.map