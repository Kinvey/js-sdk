"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var session_1 = require("../session");
var user_1 = require("./user");
function getActiveUser() {
    var session = session_1.getSession();
    if (session) {
        return new user_1.User(session);
    }
    return null;
}
exports.getActiveUser = getActiveUser;
//# sourceMappingURL=getActiveUser.js.map