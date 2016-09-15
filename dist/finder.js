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

var _bellajs = require('bellajs');

var _bellajs2 = _interopRequireDefault(_bellajs);

var _promiseWtf = require('promise-wtf');

var _promiseWtf2 = _interopRequireDefault(_promiseWtf);

var _paginator = require('./paginator');

var _paginator2 = _interopRequireDefault(_paginator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *  Finder class
======================================================================
 */
var Finder = function () {
  function Finder() {
    var entries = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    _classCallCheck(this, Finder);

    this.entries = entries;
  }

  _createClass(Finder, [{
    key: 'equals',
    value: function equals(key, val) {
      var entries = this.entries;
      this.entries = entries.filter(function (item) {
        if (_bellajs2.default.hasProperty(item, key)) {
          return item[key] === val;
        }
        return false;
      });
      return this;
    }
  }, {
    key: 'notEqual',
    value: function notEqual(key, val) {
      var entries = this.entries;
      this.entries = entries.filter(function (item) {
        if (_bellajs2.default.hasProperty(item, key)) {
          return item[key] !== val;
        }
        return true;
      });
      return this;
    }
  }, {
    key: 'gt',
    value: function gt(key, val) {
      var entries = this.entries;
      this.entries = entries.filter(function (item) {
        if (_bellajs2.default.hasProperty(item, key)) {
          var a = item[key];
          if (_bellajs2.default.isNumber(a)) {
            return a > val;
          }
        }
        return false;
      });
      return this;
    }
  }, {
    key: 'gte',
    value: function gte(key, val) {
      var entries = this.entries;
      this.entries = entries.filter(function (item) {
        if (_bellajs2.default.hasProperty(item, key)) {
          var a = item[key];
          if (_bellajs2.default.isNumber(a)) {
            return a >= val;
          }
        }
        return false;
      });
      return this;
    }
  }, {
    key: 'lt',
    value: function lt(key, val) {
      var entries = this.entries;
      this.entries = entries.filter(function (item) {
        if (_bellajs2.default.hasProperty(item, key)) {
          var a = item[key];
          if (_bellajs2.default.isNumber(a)) {
            return a < val;
          }
        }
        return false;
      });
      return this;
    }
  }, {
    key: 'lte',
    value: function lte(key, val) {
      var entries = this.entries;
      this.entries = entries.filter(function (item) {
        if (_bellajs2.default.hasProperty(item, key)) {
          var a = item[key];
          if (_bellajs2.default.isNumber(a)) {
            return a <= val;
          }
        }
        return false;
      });
      return this;
    }
  }, {
    key: 'matches',
    value: function matches(key, reg) {
      var entries = this.entries;
      this.entries = entries.filter(function (item) {
        if (_bellajs2.default.hasProperty(item, key)) {
          var a = item[key];
          if (_bellajs2.default.isString(a)) {
            return a.match(reg) !== null;
          }
        }
        return false;
      });
      return this;
    }
  }, {
    key: 'paginate',
    value: function paginate(count, sort) {
      if (sort) {
        this.entries = sort === 'asc' ? bells.sort(this.entries, '_ts') : bells.sort(this.entries, { '_ts': -1 });
      }
      this.entries = _paginator2.default.paginate(count, this.entries);
      return this;
    }
  }, {
    key: 'run',
    value: function run() {
      return _promiseWtf2.default.resolve(this.entries);
    }
  }]);

  return Finder;
}();

/**
 *  Module exports
======================================================================
 */


exports.default = Finder;