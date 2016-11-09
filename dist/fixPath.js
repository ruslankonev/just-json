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

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *  Functions
======================================================================
 */
var fixPath = function fixPath() {
  var p = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

  return _path2.default.normalize(p);
};

/**
 *  Module exports
======================================================================
 */
exports.default = fixPath;