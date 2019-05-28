Object.defineProperty(exports, "__esModule", { value: true });
function get(key) {
    return window.localStorage.getItem(key);
}
exports.get = get;
function set(key, session) {
    window.localStorage.setItem(key, session);
    return true;
}
exports.set = set;
function remove(key) {
    window.localStorage.removeItem(key);
    return true;
}
exports.remove = remove;
//# sourceMappingURL=sessionStore.js.map