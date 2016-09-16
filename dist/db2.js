/**********************************************************************
 *
 *  Just-JSON - small json-driven flat database
 *  inspired by diskdb (https://github.com/arvindr21/diskDB/)
 *  & flat-db (https://github.com/ndaidong/flat-db)
 *
 *  (c) 2016, justpromotion.ru
 *
 *  @author Ruslan Konev
 *  https://github.com/ruslankonev/just-json
 *
 ********************************************************************/
'use strict';

/**
 *  Dependencies
======================================================================
 */

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fp = require('lodash/fp');

var _foreach = require('lodash/foreach');

var _foreach2 = _interopRequireDefault(_foreach);

var _bellajs = require('bellajs');

var _bellajs2 = _interopRequireDefault(_bellajs);

var _child_process = require('child_process');

var _mkdirp = require('mkdirp');

var _collection = require('./collection');

var _collection2 = _interopRequireDefault(_collection);

var _fixPath = require('./fixPath');

var _fixPath2 = _interopRequireDefault(_fixPath);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *  Initial options
======================================================================
 */
var MIN_TEXT_LENG = 0;
var MAX_TEXT_LENG = 10000;

var _conf = {
    storeDir: 'stores/db',
    maxTextLength: MAX_TEXT_LENG
};
var _schemas = {};
var _collections = {};

/**
 *  Helper functions
======================================================================
 */
var isValidCol = function isValidCol() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    var re = /^([A-Z_])+([_A-Z0-9])+$/i;
    return _bellajs2.default.isString(name) && re.test(name);
};

var getCollection = function getCollection() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    if (!isValidCol(name)) {
        throw new Error('Invalid collection name. Only alphabet and numbers are allowed.');
    }
    var col = _bellajs2.default.strtolower(name);
    var c = _collections[col] || false;
    return c;
};

var _emptyCollection = function _emptyCollection(col) {
    var c = getCollection(col);
    if (c) {
        var d = c.dir;
        (0, _child_process.execSync)('rm -rf ' + d);
        return (0, _mkdirp.sync)(d);
    }
    return false;
};

var _removeCollection = function _removeCollection(col) {
    var c = getCollection(col);
    if (c) {
        var name = c.name;
        _collections[name] = null;
        delete _collections[name];
        return (0, _child_process.execSync)('rm -rf ' + c.dir);
    }
    return false;
};

var addCollection = function addCollection(col, schema) {
    if (!isValidCol(col)) {
        throw new Error('Invalid collection name. Only alphabet and numbers are allowed.');
    }
    if (_collections[col]) {
        return _collections[col];
    }

    var name = _bellajs2.default.strtolower(col);
    if (!_fs2.default.existsSync(_conf.storeDir)) {
        (0, _mkdirp.sync)(_conf.storeDir);
    }
    var sd = _conf.storeDir;
    var c = new _collection2.default(name, sd, schema);
    _schemas[name] = schema;
    _collections[name] = c;
    return c;
};

var loadPersistentData = function loadPersistentData(schema) {
    if (schema) {
        if (isValidPath((0, _fixPath2.default)(schema))) {
            var schemas = require(schema);
            (0, _foreach2.default)(schemas, function(value, key) {
                var name = key.toLowerCase();
                var dir = _conf.storeDir;
                var c = new _collection2.default(name, dir, value);
                _collections[name] = c;
                _schemas[name] = value;
            });
        } else {
            throw new Error('The schema url:\n        [' + schema + ']\n    does not seem to be valid. Recheck the path and try again');
        }
    } else {
        (function() {
            var sd = _conf.storeDir;
            var dirs = _fs2.default.readdirSync(sd, 'utf8');
            if (dirs && dirs.length) {
                dirs.forEach(function(item) {
                    var d = item.toLowerCase().replace(/\.json/, '');
                    // let p = fixPath(sd + '/' + d);
                    var p = (0, _fixPath2.default)(sd);
                    var c = new _collection2.default(d, p);
                    _collections[d] = c;
                });
            }
        })();
    }
};

var configure = function configure() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var p = opt.path || _conf.storeDir;
    if (p && _bellajs2.default.isString(p)) {
        var d = (0, _fixPath2.default)(p);
        _conf.storeDir = d;
    }
    var t = _conf.storeDir;
    if (!_fs2.default.existsSync(t)) {
        (0, _mkdirp.sync)(t);
    }
    var mtl = opt.maxTextLength;
    if (_bellajs2.default.isNumber(mtl) && mtl > MIN_TEXT_LENG && mtl < MAX_TEXT_LENG) {
        _conf.maxTextLength = mtl;
    }
    var schema = opt.schema || false;
    loadPersistentData(schema);
    // console.log('_schemas', _schemas);
    // console.log('_collections', _collections);
    return _conf;
};

var isValidPath = function isValidPath(path) {
    try {
        _fs2.default.accessSync(path, _fs2.default.F_OK);
        return true;
    } catch (e) {
        return false;
    }
};

var objectLowercase = function objectLowercase(obj, caller) {
    (0, _foreach2.default)(obj, function(key, n) {
        if (_bellajs2.default.isObject(key)) {
            key = objectLowercase(key);
        } else {
            if (_bellajs2.default.isString(key)) {
                key = key.toLowerCase();
            }
        }
        obj[n] = key;
    });
    return obj;
};

/**
 *  DataBase object
======================================================================
 */
var DB = {
    schemas: _schemas,
    config: function config(opts) {
        if (opts) {
            return configure(opts);
        } else {
            return _conf;
        }
    },
    select: function select(col, schema) {
        var collection = void 0;
        collection = getCollection(col);
        if (!collection) {
            collection = addCollection(col, schema);
        }
        return collection;
    },
    removeCollection: function removeCollection(name) {
        return _removeCollection(name);
    },
    emptyCollection: function emptyCollection(name) {
        return _emptyCollection(name);
    },
    reset: function reset() {
        _collections = Object.create(null);
        var d = _conf.storeDir;
        (0, _child_process.execSync)('rm -rf ' + d);
        (0, _child_process.execSync)('mkdir ' + d);
    }
};

/**
 *  Module exports
======================================================================
 */
module.exports = DB;