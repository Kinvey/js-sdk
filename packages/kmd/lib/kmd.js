"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
var errors_1 = require("@kinveysdk/errors");
var Kmd = /** @class */ (function () {
    function Kmd(kmd) {
        if (kmd && !isPlainObject_1.default(kmd)) {
            throw new errors_1.KinveyError('kmd must be an object.');
        }
        this.kmd = Object.assign({}, kmd);
    }
    Object.defineProperty(Kmd.prototype, "createdAt", {
        get: function () {
            if (this.kmd.ect) {
                return new Date(this.kmd.ect);
            }
            return undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Kmd.prototype, "updatedAt", {
        get: function () {
            if (this.kmd.lmt) {
                return new Date(this.kmd.lmt);
            }
            return undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Kmd.prototype, "authtoken", {
        get: function () {
            return this.kmd.authtoken;
        },
        enumerable: true,
        configurable: true
    });
    Kmd.prototype.isEmailConfirmed = function () {
        if (this.kmd.emailVerification) {
            return this.kmd.emailVerification.status === 'confirmed';
        }
        return false;
    };
    Kmd.prototype.isLocal = function () {
        return this.kmd.local === true;
    };
    return Kmd;
}());
exports.Kmd = Kmd;
//# sourceMappingURL=kmd.js.map