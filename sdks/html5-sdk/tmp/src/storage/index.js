Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var kinvey_js_sdk_1 = require("kinvey-js-sdk");
var IndexedDB = tslib_1.__importStar(require("./indexeddb"));
var LocalStorage = tslib_1.__importStar(require("./localstorage"));
var Memory = tslib_1.__importStar(require("./memory"));
var SessionStorage = tslib_1.__importStar(require("./sessionstorage"));
var WebSQL = tslib_1.__importStar(require("./websql"));
var StorageProvider;
(function (StorageProvider) {
    StorageProvider["IndexedDB"] = "IndexedDB";
    StorageProvider["LocalStorage"] = "LocalStorage";
    StorageProvider["Memory"] = "Memory";
    StorageProvider["SessionStorage"] = "SessionStorage";
    StorageProvider["WebSQL"] = "WebSQL";
})(StorageProvider = exports.StorageProvider || (exports.StorageProvider = {}));
;
function getStorageAdapter(storageProvider) {
    if (storageProvider === void 0) { storageProvider = StorageProvider.WebSQL; }
    if (storageProvider === StorageProvider.IndexedDB) {
        return IndexedDB;
    }
    else if (storageProvider === StorageProvider.LocalStorage) {
        return LocalStorage;
    }
    else if (storageProvider === StorageProvider.Memory) {
        return Memory;
    }
    else if (storageProvider === StorageProvider.SessionStorage) {
        return SessionStorage;
    }
    else if (storageProvider === StorageProvider.WebSQL) {
        return WebSQL;
    }
    throw new kinvey_js_sdk_1.Errors.KinveyError('You must override the default cache store.');
}
exports.getStorageAdapter = getStorageAdapter;
//# sourceMappingURL=index.js.map