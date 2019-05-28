Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var kinvey_js_sdk_1 = require("kinvey-js-sdk");
var pubnub_1 = tslib_1.__importDefault(require("pubnub"));
var HttpAdapter = tslib_1.__importStar(require("./httpAdapter"));
var SessionStore = tslib_1.__importStar(require("./sessionStore"));
var Popup = tslib_1.__importStar(require("./popup"));
var storage_1 = require("./storage");
function init(config) {
    var kinveyConfig = kinvey_js_sdk_1.init({
        kinveyConfig: config,
        httpAdapter: HttpAdapter,
        sessionStore: SessionStore,
        popup: Popup,
        storageAdapter: storage_1.getStorageAdapter(config.storage),
        pubnub: pubnub_1.default
    });
    return Object.assign({}, kinveyConfig, { storage: config.storage });
}
exports.init = init;
function initialize(config) {
    return init(config);
}
exports.initialize = initialize;
//# sourceMappingURL=init.js.map