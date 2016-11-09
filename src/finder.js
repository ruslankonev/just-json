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
import bella from 'bellajs';
import Promise from 'promise-wtf';
import Paginator from './paginator'

/**
 *  Finder class
======================================================================
 */
class Finder {
    constructor(entries = []) {
        this.entries = entries;
    }

    equals(key, val) {
      let entries = this.entries;
      this.entries = entries.filter((item) => {
        if (bella.hasProperty(item, key)) {
          return item[key] === val;
        }
        return false;
      });
      return this;
    }

    notEqual(key, val) {
      let entries = this.entries;
      this.entries = entries.filter((item) => {
        if (bella.hasProperty(item, key)) {
          return item[key] !== val;
        }
        return true;
      });
      return this;
    }

    gt(key, val) {
      let entries = this.entries;
      this.entries = entries.filter((item) => {
        if (bella.hasProperty(item, key)) {
          let a = item[key];
          if (bella.isNumber(a)) {
            return a > val;
          }
        }
        return false;
      });
      return this;
    }

    gte(key, val) {
      let entries = this.entries;
      this.entries = entries.filter((item) => {
        if (bella.hasProperty(item, key)) {
          let a = item[key];
          if (bella.isNumber(a)) {
            return a >= val;
          }
        }
        return false;
      });
      return this;
    }

    lt(key, val) {
      let entries = this.entries;
      this.entries = entries.filter((item) => {
        if (bella.hasProperty(item, key)) {
          let a = item[key];
          if (bella.isNumber(a)) {
            return a < val;
          }
        }
        return false;
      });
      return this;
    }

    lte(key, val) {
      let entries = this.entries;
      this.entries = entries.filter((item) => {
        if (bella.hasProperty(item, key)) {
          let a = item[key];
          if (bella.isNumber(a)) {
            return a <= val;
          }
        }
        return false;
      });
      return this;
    }

    matches(key, reg) {
      let entries = this.entries;
      this.entries = entries.filter((item) => {
        if (bella.hasProperty(item, key)) {
          let a = item[key];
          if (bella.isString(a)) {
            return a.match(reg) !== null;
          }
        }
        return false;
      });
      return this;
    }

    paginate(count, sort) {
        if (sort) {
            this.entries = (sort === 'asc')
                ? bella.sort(this.entries, '_ts')
                : bella.sort(this.entries, {'_ts': -1})
        }
        this.entries = Paginator.paginate(count, this.entries);
        return this;
    }

    one(){
        if(this.entries.length > 0)
            this.entries = this.entries[0];
        return this;
    }

    run() {
      return Promise.resolve(this.entries);
    }

}

/**
 *  Module exports
======================================================================
 */
export default Finder;
