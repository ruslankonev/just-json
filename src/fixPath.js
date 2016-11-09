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
import path from 'path';

/**
 *  Functions
======================================================================
 */
var fixPath = (p = '') => {
  return path.normalize(p);
};

/**
 *  Module exports
======================================================================
 */
export default fixPath;
