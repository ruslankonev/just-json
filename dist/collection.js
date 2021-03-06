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

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bellajs = require('bellajs');

var _bellajs2 = _interopRequireDefault(_bellajs);

var _finder = require('./finder');

var _finder2 = _interopRequireDefault(_finder);

var _fixPath = require('./fixPath');

var _fixPath2 = _interopRequireDefault(_fixPath);

var _promiseWtf = require('promise-wtf');

var _promiseWtf2 = _interopRequireDefault(_promiseWtf);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
*  Initial options
======================================================================
*/
var EXT = '.json';

/**
*  Helper functions
======================================================================
*/
var checkCache = function checkCache(collection, force) {
  var collectionTime = new Date(collection.readTime).getTime();
  var updateTime = new Date(collectionTime + collection.CACHING_TIME * 60000);
  if (Date.now() > updateTime || force) {
    collection.readTime = Date.now();
    return collection.collection = getColData(collection.file);
  }
  return collection.collection;
};

var getColData = function getColData(f) {
  var noop = {
    updated_at: _bellajs2.default.time(),
    entries: []
  };
  if (!_fs2.default.existsSync(f)) {
    return noop;
  } else {
    process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'development' && console.log('read from file', f);
  }

  var s = _fs2.default.readFileSync(f, 'utf8');

  if (!s) {
    return noop;
  }
  return JSON.parse(s);
};

var setColData = function setColData() {
  var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var f = arguments[1];

  var o = {
    updated_at: _bellajs2.default.time(),
    entries: data.entries || []
  };
  return _fs2.default.writeFileSync(f, JSON.stringify(o), 'utf8');
};

var clean = function clean(data) {
  var fields = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  var keys = [];
  if (_bellajs2.default.isString(fields)) {
    keys = fields.split(' ');
  }
  var o = Object.assign({}, data);
  if (keys.length > 0) {
    var a = {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      a[k] = o[k];
    }
    o = a;
  }
  return o;
};

var removeKeys = function removeKeys(obj) {
  var fields = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  var keys = [];
  if (_bellajs2.default.isString(fields)) {
    keys = fields.split(' ');
  }
  var o = Object.assign({}, obj);
  if (keys.length > 0) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        key = _step.value;

        o[key] && delete o[key];
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }
  return o;
};

/**
*  Collection class
*
*  - на функции чтения и поиска навешан кеш чтения из файла
*  минимум — 5 минут
======================================================================
*/

var Collection = function () {
  function Collection(name, dir) {
    var schema = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, Collection);

    var file = (0, _fixPath2.default)(dir + '/' + name + EXT);
    // console.log('passed URL to Collection class', file);
    if (!_fs2.default.existsSync(file)) {
      _fs2.default.writeFileSync(file, '', 'utf8');
    }
    this.name = name;
    this.dir = dir;
    this.file = file;
    this.schema = schema;
    this.readTime = null;
    this.collection = [];
    this.CACHING_TIME = 5;
  }

  _createClass(Collection, [{
    key: 'add',
    value: function add(item) {
      var _this = this;

      return new _promiseWtf2.default(function (resolve, reject) {
        if (!_bellajs2.default.isObject(item)) {
          reject(new Error('Invalid parameter. Object required.'));
        }
        var file = _this.file;
        var data = getColData(file);
        var c = data.entries || [];
        var id = _bellajs2.default.createId(32);
        item._id = id;
        item._ts = _bellajs2.default.time();
        c.unshift(item);
        data.entries = c;
        setColData(data, file);
        _this.collection = data;
        resolve(id);
      });
    }
  }, {
    key: 'store',
    value: function store(item) {
      // alias for compability
      this.add(item);
    }
  }, {
    key: 'get',
    value: function get(id, fields, unsetFields) {
      var _this2 = this;

      return new _promiseWtf2.default(function (resolve, reject) {
        var file = _this2.file;
        // let data = getColData(file)
        var data = checkCache(_this2);
        var c = data.entries || [];

        if (!id) resolve(c);

        if (!_bellajs2.default.isString(id)) {
          reject(new Error('Invalid parameter. String required.'));
        }

        var item = void 0;
        for (var i = 0; i < c.length; i++) {
          var m = c[i];
          if (m._id === id) {
            m = removeKeys(m, unsetFields);
            item = clean(m, fields);
            break;
          }
        }

        resolve(item || null);
      });
    }
  }, {
    key: 'update',
    value: function update(id, obj) {
      var _this3 = this;

      return new _promiseWtf2.default(function (resolve, reject) {
        if (!_bellajs2.default.isString(id)) {
          reject(new Error('Invalid parameter. String required.'));
        }
        var file = _this3.file;
        var data = getColData(file);
        var c = data.entries || [];
        var item = void 0;
        for (var i = 0; i < c.length; i++) {
          var m = c[i];
          if (m._id === id) {
            item = _bellajs2.default.copies(obj, m, true, ['_id', '_ts']);
            c.splice(i, 1, item);
            break;
          }
        }
        if (item) {
          data.entries = c;
          setColData(data, file);
          _this3.collection = data;
        }
        resolve(item);
      });
    }
  }, {
    key: 'remove',
    value: function remove(id) {
      var _this4 = this;

      return new _promiseWtf2.default(function (resolve, reject) {
        if (!_bellajs2.default.isString(id)) {
          reject(new Error('Invalid parameter. String required.'));
        }
        var file = _this4.file;
        var data = getColData(file);
        var c = data.entries || [];
        var item = void 0;
        for (var i = c.length - 1; i >= 0; i--) {
          var m = c[i];
          if (m._id === id) {
            item = m;
            c.splice(i, 1);
            break;
          }
        }
        if (item) {
          data.entries = c;
          setColData(data, file);
          _this4.collection = data;
          resolve(item);
        }
        resolve(false);
      });
    }
  }, {
    key: 'count',
    value: function count() {
      var data = checkCache(this);
      var c = data.entries || [];
      return c.length;
    }
  }, {
    key: 'sync',
    value: function sync(newData) {
      var _this5 = this;

      return new _promiseWtf2.default(function (resolve, reject) {
        var In = JSON.stringify(newData);
        var Has = JSON.stringify(getColData(_this5.file));
        if (In != Has) {
          setColData(newData, _this5.file);
          _this5.collection = newData;
          resolve(true);
        }
        resolve(false);
      });
    }
  }, {
    key: 'find',
    value: function find() {
      var file = this.file;
      // let data = getColData(file)
      var data = checkCache(this);
      var c = data.entries || [];
      return new _finder2.default(c);
    }
  }]);

  return Collection;
}();

/**
*  Module exports
======================================================================
*/


exports.default = Collection;