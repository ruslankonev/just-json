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
import fs from 'fs'
import { merge, cloneDeep, filter, includes, find, size } from 'lodash/fp'
import forEach from 'lodash/forEach'
import bella from 'bellajs'
import { execSync as exec } from 'child_process'
import { sync as mkdirp } from 'mkdirp'
import Collection from './collection'
import fixPath from './fixPath'

/**
*  Initial options
======================================================================
*/
const MIN_TEXT_LENG = 0
const MAX_TEXT_LENG = 10000

var _conf = {
  storeDir: 'stores/db',
  maxTextLength: MAX_TEXT_LENG
}
var _schemas = {}
var _collections = {}

/**
*  Helper functions
======================================================================
*/
var isValidCol = (name = '') => {
  let re = /^([A-Z_])+([_A-Z0-9])+$/i;
  return bella.isString(name) && re.test(name)
}

var getCollection = (name = '') => {
  if (!isValidCol(name)) {
    throw new Error('Invalid collection name. Only alphabet and numbers are allowed.')
  }
  let col = bella.strtolower(name)
  let c = _collections[col] || false
  return c
}

var emptyCollection = (col) => {
  let c = getCollection(col)
  if (c) {
    let d = c.file
    exec(`rm -rf ${d}`)
    return mkdirp(d)
  }
  return false
}

var removeCollection = (col) => {
  let c = getCollection(col)
  if (c) {
    let name = c.name
    _collections[name] = null
    delete _collections[name]
    return exec(`rm -rf ${c.file}`)
  }
  return false
}

var addCollection = (col, schema) => {
  if (!isValidCol(col)) {
    throw new Error('Invalid collection name. Only alphabet and numbers are allowed.')
  }
  if (_collections[col]) {
    return _collections[col]
  }

  let name = bella.strtolower(col)
  if (!fs.existsSync(_conf.storeDir)) {
    mkdirp(_conf.storeDir)
  }
  let sd = _conf.storeDir
  let c = new Collection(name, sd, schema)
  _schemas[name] = schema
  _collections[name] = c
  return c
}

var loadPersistentData = (schema) => {
  if (schema) {
    if (isValidPath(fixPath(schema))) {
      let schemas = require(schema)
      forEach(schemas, function(value, key) {
        let name = key.toLowerCase()
        let dir = _conf.storeDir
        let c = new Collection(name, dir, value)
        _collections[name] = c
        _schemas[name] = value
      })
    } else {
      throw new Error(`The schema url:
        [${schema}]
        does not seem to be valid. Recheck the path and try again`)
    }
  } else {
    let sd = _conf.storeDir
    let dirs = fs.readdirSync(sd, 'utf8')
    if (dirs && dirs.length) {
      dirs.forEach((item) => {
        let d = item.toLowerCase().replace(/\.json/, '')
        // let p = fixPath(sd + '/' + d)
        let p = fixPath(sd)
        let c = new Collection(d, p)
        _collections[d] = c
      })
    }
  }
}

var configure = (opt = {}) => {
  let p = opt.path || _conf.storeDir
  if (p && bella.isString(p)) {
    let d = fixPath(p)
    _conf.storeDir = d
  }
  let t = _conf.storeDir
  if (!fs.existsSync(t)) {
    mkdirp(t)
  }
  let mtl = opt.maxTextLength
  if (bella.isNumber(mtl) && mtl > MIN_TEXT_LENG && mtl < MAX_TEXT_LENG) {
    _conf.maxTextLength = mtl
  }
  let schema = opt.schema || false
  loadPersistentData(schema)
  return _conf
}

var isValidPath = function(path) {
  try {
    fs.accessSync(path, fs.F_OK)
    return true
  } catch (e) {
    return false
  }
}

var objectLowercase = function(obj, caller) {
  forEach(obj, function(key, n) {
    if (bella.isObject(key)) {
      key = objectLowercase(key)
    } else {
      if (bella.isString(key)) {
        key = key.toLowerCase()
      }
    }
    obj[n] = key
  })
  return obj
}


/**
*  DataBase object
======================================================================
*/
var DB = {
  schemas: _schemas,
  config(opts) {
    if (opts) {
      return configure(opts)
    } else {
      return _conf
    }
  },
  select(col, schema) {
    let collection
    collection = getCollection(col)
    if (!collection) {
      collection = addCollection(col, schema)
    }
    return collection
  },
  removeCollection(name) {
    return removeCollection(name)
  },
  emptyCollection(name) {
    return emptyCollection(name)
  },
  reset() {
    _collections = Object.create(null)
    let d = _conf.storeDir
    exec(`rm -rf ${d}`)
    // exec(`mkdir ${d}`)
  }
}

/**
*  Module exports
======================================================================
*/
export default DB
