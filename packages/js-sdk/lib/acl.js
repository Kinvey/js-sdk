"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
var errors_1 = require("./errors");
var Acl = /** @class */ (function () {
    function Acl(acl) {
        if (acl && !isPlainObject_1.default(acl)) {
            throw new errors_1.KinveyError('acl must be an object.');
        }
        this.acl = Object.assign({}, acl);
    }
    Object.defineProperty(Acl.prototype, "creator", {
        get: function () {
            return this.acl.creator;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Acl.prototype, "readers", {
        get: function () {
            var readers = [];
            if (this.acl.r) {
                return readers.concat(this.acl.r);
            }
            return readers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Acl.prototype, "writers", {
        get: function () {
            var writers = [];
            if (this.acl.w) {
                return writers.concat(this.acl.w);
            }
            return writers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Acl.prototype, "readerGroups", {
        get: function () {
            var readerGroups = [];
            if (this.acl.groups && this.acl.groups.r) {
                return readerGroups.concat(this.acl.groups.r);
            }
            return readerGroups;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Acl.prototype, "writerGroups", {
        get: function () {
            var writerGroups = [];
            if (this.acl.groups && this.acl.groups.w) {
                return writerGroups.concat(this.acl.groups.w);
            }
            return writerGroups;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Acl.prototype, "globallyReadable", {
        set: function (gr) {
            this.acl.gr = gr === true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Acl.prototype, "globallyWritable", {
        set: function (gw) {
            this.acl.gw = gw === true;
        },
        enumerable: true,
        configurable: true
    });
    Acl.prototype.addReader = function (reader) {
        var readers = this.readers;
        if (readers.indexOf(reader) === -1) {
            readers.push(reader);
        }
        this.acl.r = readers;
        return this;
    };
    Acl.prototype.removeReader = function (reader) {
        var readers = this.readers;
        var index = readers.indexOf(reader);
        readers.splice(index, 1);
        this.acl.r = readers;
        return this;
    };
    Acl.prototype.addWriter = function (writer) {
        var writers = this.writers;
        if (writers.indexOf(writer) === -1) {
            writers.push(writer);
        }
        this.acl.w = writers;
        return this;
    };
    Acl.prototype.removeWriter = function (writer) {
        var writers = this.writers;
        var index = writers.indexOf(writer);
        writers.splice(index, 1);
        this.acl.w = writers;
        return this;
    };
    Acl.prototype.addReaderGroup = function (reader) {
        var readerGroups = this.readerGroups;
        if (readerGroups.indexOf(reader) === -1) {
            readerGroups.push(reader);
        }
        this.acl.groups = Object.assign({}, this.acl.groups, { r: readerGroups });
        return this;
    };
    Acl.prototype.removeReaderGroup = function (reader) {
        var readerGroups = this.readerGroups;
        var index = readerGroups.indexOf(reader);
        readerGroups.splice(index, 1);
        this.acl.groups = Object.assign({}, this.acl.groups, { r: readerGroups });
        return this;
    };
    Acl.prototype.addWriterGroup = function (writer) {
        var writerGroups = this.writerGroups;
        if (writerGroups.indexOf(writer) === -1) {
            writerGroups.push(writer);
        }
        this.acl.groups = Object.assign({}, this.acl.groups, { w: writerGroups });
        return this;
    };
    Acl.prototype.removeWriterGroup = function (writer) {
        var writerGroups = this.writerGroups;
        var index = writerGroups.indexOf(writer);
        writerGroups.splice(index, 1);
        this.acl.groups = Object.assign({}, this.acl.groups, { w: writerGroups });
        return this;
    };
    return Acl;
}());
exports.Acl = Acl;
//# sourceMappingURL=acl.js.map