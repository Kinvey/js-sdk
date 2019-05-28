"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var session_1 = require("@kinveysdk/session");
var store = __importStar(require("./store"));
function register() {
    session_1.setSessionStore(store);
}
exports.register = register;
//# sourceMappingURL=index.js.map