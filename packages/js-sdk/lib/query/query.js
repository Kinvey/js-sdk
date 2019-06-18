"use strict";
/* eslint no-useless-constructor: "off" */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isArray_1 = __importDefault(require("lodash/isArray"));
var isNumber_1 = __importDefault(require("lodash/isNumber"));
var isString_1 = __importDefault(require("lodash/isString"));
var isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
var isObject_1 = __importDefault(require("lodash/isObject"));
var isEmpty_1 = __importDefault(require("lodash/isEmpty"));
var cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
var sift_1 = __importDefault(require("sift"));
var errors_1 = require("../errors");
var utils_1 = require("./utils");
var UNSUPPORTED_CONDITIONS = ['$nearSphere'];
var PROTECTED_FIELDS = ['_id', '_acl'];
var Query = /** @class */ (function () {
    function Query(query) {
        this.filter = {};
        this.fields = [];
        this.sort = {};
        if (query instanceof Query || isPlainObject_1.default(query)) {
            this.fields = query.fields;
            this.filter = query.filter;
            this.sort = query.sort;
            this.limit = query.limit;
            this.skip = query.skip;
        }
    }
    Object.defineProperty(Query.prototype, "key", {
        get: function () {
            if ((isNumber_1.default(this.skip) && this.skip > 0) || (isNumber_1.default(this.limit) && this.limit < Number.MAX_SAFE_INTEGER)) {
                return null;
            }
            var toPlainObject = this.toPlainObject();
            return toPlainObject && !isEmpty_1.default(toPlainObject) ? JSON.stringify(toPlainObject) : '';
        },
        enumerable: true,
        configurable: true
    });
    Query.prototype.isSupportedOffline = function () {
        var _this = this;
        return Object.keys(this.filter).reduce(function (supported, key) {
            if (supported) {
                var value_1 = _this.filter[key];
                return UNSUPPORTED_CONDITIONS.some(function (unsupportedConditions) {
                    if (!value_1) {
                        return true;
                    }
                    if (!isObject_1.default(value_1)) {
                        return true;
                    }
                    return !Object.keys(value_1).some(function (condition) { return condition === unsupportedConditions; });
                });
            }
            return supported;
        }, true);
    };
    Query.prototype.equalTo = function (field, value) {
        return this.addFilter(field, '$eq', value);
    };
    Query.prototype.notEqualTo = function (field, value) {
        return this.addFilter(field, '$ne', value);
    };
    Query.prototype.contains = function (field, values) {
        if (!values) {
            throw new errors_1.KinveyError('You must supply a value.');
        }
        if (!isArray_1.default(values)) {
            return this.addFilter(field, '$in', [values]);
        }
        return this.addFilter(field, '$in', values);
    };
    Query.prototype.notContainedIn = function (field, values) {
        if (!values) {
            throw new errors_1.KinveyError('You must supply a value.');
        }
        if (!isArray_1.default(values)) {
            return this.addFilter(field, '$nin', [values]);
        }
        return this.addFilter(field, '$nin', values);
    };
    Query.prototype.containsAll = function (field, values) {
        if (!values) {
            throw new errors_1.KinveyError('You must supply a value.');
        }
        if (!isArray_1.default(values)) {
            return this.addFilter(field, '$all', [values]);
        }
        return this.addFilter(field, '$all', values);
    };
    Query.prototype.greaterThan = function (field, value) {
        if (!isNumber_1.default(value) && !isString_1.default(value)) {
            throw new errors_1.KinveyError('You must supply a number or string.');
        }
        return this.addFilter(field, '$gt', value);
    };
    Query.prototype.greaterThanOrEqualTo = function (field, value) {
        if (!isNumber_1.default(value) && !isString_1.default(value)) {
            throw new errors_1.KinveyError('You must supply a number or string.');
        }
        return this.addFilter(field, '$gte', value);
    };
    Query.prototype.lessThan = function (field, value) {
        if (!isNumber_1.default(value) && !isString_1.default(value)) {
            throw new errors_1.KinveyError('You must supply a number or string.');
        }
        return this.addFilter(field, '$lt', value);
    };
    Query.prototype.lessThanOrEqualTo = function (field, value) {
        if (!isNumber_1.default(value) && !isString_1.default(value)) {
            throw new errors_1.KinveyError('You must supply a number or string.');
        }
        return this.addFilter(field, '$lte', value);
    };
    Query.prototype.exists = function (field, flag) {
        if (flag === void 0) { flag = true; }
        return this.addFilter(field, '$exists', flag === true);
    };
    Query.prototype.mod = function (field, divisor, remainder) {
        if (remainder === void 0) { remainder = 0; }
        if (!isNumber_1.default(divisor)) {
            throw new errors_1.KinveyError('divisor must be a number');
        }
        if (!isNumber_1.default(remainder)) {
            throw new errors_1.KinveyError('remainder must be a number');
        }
        return this.addFilter(field, '$mod', [divisor, remainder]);
    };
    Query.prototype.matches = function (field, expression, options) {
        if (options === void 0) { options = {}; }
        var flags = [];
        var regExp = expression;
        if (!(regExp instanceof RegExp)) {
            regExp = new RegExp(regExp);
        }
        if (regExp.source.indexOf('^') !== 0) {
            throw new errors_1.KinveyError('regExp must have \'^\' at the beginning of the expression to make it an anchored expression.');
        }
        if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
            throw new errors_1.KinveyError('ignoreCase flag is not supported');
        }
        if ((regExp.multiline || options.multiline) && options.multiline !== false) {
            flags.push('m');
        }
        if (options.extended === true) {
            flags.push('x');
        }
        if (options.dotMatchesAll === true) {
            flags.push('s');
        }
        if (flags.length > 0) {
            this.addFilter(field, '$options', flags.join(''));
        }
        return this.addFilter(field, '$regex', regExp.source);
    };
    Query.prototype.near = function (field, coord, maxDistance) {
        if (!Array.isArray(coord) || !isNumber_1.default(coord[0]) || !isNumber_1.default(coord[1])) {
            throw new errors_1.KinveyError('coord must be a [number, number]');
        }
        this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);
        if (isNumber_1.default(maxDistance)) {
            this.addFilter(field, '$maxDistance', maxDistance);
        }
        return this;
    };
    Query.prototype.withinBox = function (field, bottomLeftCoord, upperRightCoord) {
        if (!Array.isArray(bottomLeftCoord)
            || !isNumber_1.default(bottomLeftCoord[0])
            || !isNumber_1.default(bottomLeftCoord[1])) {
            throw new errors_1.KinveyError('bottomLeftCoord must be a [number, number]');
        }
        if (!Array.isArray(upperRightCoord)
            || !isNumber_1.default(upperRightCoord[0])
            || !isNumber_1.default(upperRightCoord[1])) {
            throw new errors_1.KinveyError('upperRightCoord must be a [number, number]');
        }
        var coords = [
            [bottomLeftCoord[0], bottomLeftCoord[1]],
            [upperRightCoord[0], upperRightCoord[1]]
        ];
        return this.addFilter(field, '$within', { $box: coords });
    };
    Query.prototype.withinPolygon = function (field, coords) {
        if (Array.isArray(coords) === false || coords.length === 0 || coords[0].length > 3) {
            throw new errors_1.KinveyError('coords must be a [[number, number]]');
        }
        var withinCoords = coords.map(function (coord) {
            if (!isNumber_1.default(coord[0]) || !isNumber_1.default(coord[1])) {
                throw new errors_1.KinveyError('coords argument must be a [number, number]');
            }
            return [coord[0], coord[1]];
        });
        return this.addFilter(field, '$within', { $polygon: withinCoords });
    };
    Query.prototype.size = function (field, size) {
        if (!isNumber_1.default(size)) {
            throw new errors_1.KinveyError('size must be a number');
        }
        return this.addFilter(field, '$size', size);
    };
    Query.prototype.addFilter = function (field, condition, value) {
        var _a;
        this.filter[field] = Object.assign({}, this.filter[field], (_a = {}, _a[condition] = value, _a));
        return this;
    };
    Query.prototype.and = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // AND has highest precedence. Therefore, even if this query is part of a
        // JOIN already, apply it on this query.
        return this.join('$and', args);
    };
    Query.prototype.nor = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
        // apply the NOR onto the parent to make sure AND indeed precedes NOR.
        if (this.parent && Object.hasOwnProperty.call(this.parent.filter, '$and')) {
            return (_a = this.parent.nor).apply.apply(_a, [this.parent].concat(args));
        }
        return this.join('$nor', args);
    };
    Query.prototype.or = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // OR has lowest precedence. Therefore, if this query is part of any join,
        // apply the OR onto the parent to make sure OR has indeed the lowest
        // precedence.
        if (this.parent) {
            return (_a = this.parent.or).apply.apply(_a, [this.parent].concat(args));
        }
        return this.join('$or', args);
    };
    Query.prototype.join = function (operator, queries) {
        var _this = this;
        // Cast, validate, and parse arguments. If `queries` are supplied, obtain
        // the `filter` for joining. The eventual return function will be the
        // current query.
        var result = new Query(this);
        var filters = queries.map(function (queryObject) {
            var query = queryObject;
            if (!(queryObject instanceof Query)) {
                if (isPlainObject_1.default(queryObject)) {
                    query = new Query(queryObject);
                }
                else {
                    throw new errors_1.KinveyError('query argument must be of type: Kinvey.Query[] or Object[].');
                }
            }
            return query.toPlainObject().filter;
        });
        // If there are no `queries` supplied, create a new (empty) `Kinvey.Query`.
        // This query is the right-hand side of the join expression, and will be
        // returned to allow for a fluent interface.
        if (filters.length === 0) {
            result = new Query();
            filters = [result.toPlainObject().filter];
            result.parent = new Query(this);
        }
        // Join operators operate on the top-level of `_filter`. Since the `toJSON`
        // magic requires `_filter` to be passed by reference, we cannot simply re-
        // assign `_filter`. Instead, empty it without losing the reference.
        var currentFilter = Object.keys(this.filter).reduce(function (filter, key) {
            var _a;
            var newFilter = Object.assign(filter, (_a = {}, _a[key] = _this.filter[key], _a));
            delete _this.filter[key];
            return newFilter;
        }, {});
        // `currentFilter` is the left-hand side query. Join with `filters`.
        this.filter[operator] = [currentFilter].concat(filters);
        return result;
    };
    Query.prototype.ascending = function (field) {
        if (this.parent) {
            this.parent.ascending(field);
        }
        else {
            this.sort[field] = 1;
        }
        return this;
    };
    Query.prototype.descending = function (field) {
        if (this.parent) {
            this.parent.descending(field);
        }
        else {
            this.sort[field] = -1;
        }
        return this;
    };
    Query.prototype.process = function (docs) {
        if (docs === void 0) { docs = []; }
        var queryObject = this.toPlainObject();
        if (!Array.isArray(docs)) {
            throw new Error('data argument must be of type: Array.');
        }
        if (!this.isSupportedOffline()) {
            throw new Error('This query is not able to run locally.');
        }
        if (docs.length > 0) {
            var processedDocs = void 0;
            var filter = queryObject.filter;
            if (filter && !isEmpty_1.default(filter)) {
                processedDocs = docs.filter(sift_1.default(filter));
            }
            else {
                processedDocs = docs;
            }
            if (!isEmpty_1.default(queryObject.sort)) {
                // eslint-disable-next-line arrow-body-style
                processedDocs.sort(function (a, b) {
                    return Object.keys(queryObject.sort)
                        .reduce(function (result, field) {
                        if (typeof result !== 'undefined' && result !== 0) {
                            return result;
                        }
                        if (Object.prototype.hasOwnProperty.call(queryObject.sort, field)) {
                            var aField = utils_1.nested(a, field);
                            var bField = utils_1.nested(b, field);
                            var modifier = queryObject.sort[field]; // -1 (descending) or 1 (ascending)
                            if ((aField !== null && typeof aField !== 'undefined')
                                && (bField === null || typeof bField === 'undefined')) {
                                return 1 * modifier;
                            }
                            if ((bField !== null && typeof bField !== 'undefined')
                                && (aField === null || typeof aField === 'undefined')) {
                                return -1 * modifier;
                            }
                            if (typeof aField === 'undefined' && bField === null) {
                                return 0;
                            }
                            if (aField === null && typeof bField === 'undefined') {
                                return 0;
                            }
                            if (aField !== bField) {
                                return (aField < bField ? -1 : 1) * modifier;
                            }
                        }
                        return 0;
                    }, undefined);
                });
            }
            if (isNumber_1.default(queryObject.skip) && queryObject.skip > 0) {
                if (isNumber_1.default(queryObject.limit) && queryObject.limit < Number.MAX_SAFE_INTEGER) {
                    processedDocs = processedDocs.slice(queryObject.skip, queryObject.skip + queryObject.limit);
                }
                else {
                    processedDocs = processedDocs.slice(queryObject.skip);
                }
            }
            else if (isNumber_1.default(queryObject.limit) && queryObject.limit < Number.MAX_SAFE_INTEGER) {
                processedDocs = processedDocs.slice(0, queryObject.limit);
            }
            if (isArray_1.default(queryObject.fields) && queryObject.fields.length > 0) {
                processedDocs = processedDocs.map(function (doc) {
                    var modifiedDoc = doc;
                    Object.keys(modifiedDoc).forEach(function (key) {
                        if (queryObject.fields && queryObject.fields.indexOf(key) === -1 && PROTECTED_FIELDS.indexOf(key) === -1) {
                            delete modifiedDoc[key];
                        }
                    });
                    return modifiedDoc;
                });
            }
            return processedDocs;
        }
        return docs;
    };
    Query.prototype.toPlainObject = function () {
        if (this.parent) {
            return this.parent.toPlainObject();
        }
        return cloneDeep_1.default({
            fields: this.fields,
            filter: this.filter,
            sort: this.sort,
            skip: this.skip,
            limit: this.limit
        });
    };
    Query.prototype.toHttpQueryObject = function () {
        var queryObject = this.toPlainObject();
        var httpQueryObject = {};
        if (Object.keys(queryObject.filter).length > 0) {
            httpQueryObject.query = queryObject.filter;
        }
        if (queryObject.fields && queryObject.fields.length > 0) {
            httpQueryObject.fields = queryObject.fields.join(',');
        }
        if (isNumber_1.default(queryObject.limit) && queryObject.limit < Number.MAX_SAFE_INTEGER) {
            httpQueryObject.limit = queryObject.limit;
        }
        if (isNumber_1.default(queryObject.skip) && queryObject.skip > 0) {
            httpQueryObject.skip = queryObject.skip;
        }
        if (queryObject.sort && Object.keys(queryObject.sort).length > 0) {
            httpQueryObject.sort = queryObject.sort;
        }
        Object.keys(httpQueryObject).forEach(function (key) {
            httpQueryObject[key] = isString_1.default(httpQueryObject[key]) ? httpQueryObject[key] : JSON.stringify(httpQueryObject[key]);
        });
        return httpQueryObject;
    };
    return Query;
}());
exports.Query = Query;
//# sourceMappingURL=query.js.map