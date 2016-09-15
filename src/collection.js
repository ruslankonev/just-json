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
import bella from 'bellajs'
import Finder from './finder'
import fixPath from './fixPath'

/**
 *  Initial options
======================================================================
 */
const EXT = '.json';

/**
 *  Helper functions
======================================================================
 */
var checkCache = function (collection, force) {
    let collectionTime = new Date(collection.readTime).getTime();
    let updateTime = new Date(collectionTime + collection.CACHING_TIME * 60000);
    if (Date.now() > updateTime || force) {
        collection.readTime = Date.now();
        return getColData(collection.file);
    }
    return collection.collection;
}

var getColData = (f) => {
    let noop = {
        updated_at: bella.time(),
        entries: []
    };
    if (!fs.existsSync(f)) {
        return noop;
    } else {
        process.env
        && process.env.NODE_ENV
        && process.env.NODE_ENV === 'development'
        && console.log('read from file', f);
    }

    let s = fs.readFileSync(f, 'utf8');

    if (!s) {
        return noop;
    }
    return JSON.parse(s);
};

var setColData = (data = {}, f) => {
    let o = {
        updated_at: bella.time(),
        entries: data.entries || []
    };
    return fs.writeFileSync(f, JSON.stringify(o), 'utf8');
};

var clean = (data, fields = []) => {
    let keys = [];
    if (bella.isString(fields)) {
        keys = fields.split(' ');
    }
    let o = Object.assign({}, data);
    if (keys.length > 0) {
        let a = {};
        for (let i = 0; i < keys.length; i++) {
            let k = keys[i];
            a[k] = o[k];
        }
        o = a;
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
class Collection {

    constructor(name, dir, schema = {}) {
        let file = fixPath(dir + '/' + name + EXT);
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, '', 'utf8');
        }
        this.name = name;
        this.dir = dir;
        this.file = file;
        this.schema = schema;
        this.readTime = null;
        this.collection = [];
        this.CACHING_TIME = 5;
    }

    add(item) {
        if (!bella.isObject(item)) {
            throw new Error('Invalid parameter. Object required.');
        }
        let file = this.file;
        let data = getColData(file);
        let c = data.entries || [];
        let id = bella.createId(32);
        item._id = id;
        item._ts = bella.time();
        c.unshift(item);
        data.entries = c;
        setColData(data, file);
        this.collection = data;
        return id;
    }

    get(id, fields) {
        let file = this.file;

        // let data = getColData(file);
        let data = checkCache(this);

        let c = data.entries || [];

        if (!id) {
            return c;
        }
        if (!bella.isString(id)) {
            throw new Error('Invalid parameter. String required.');
        }

        let item;
        for (let i = 0; i < c.length; i++) {
            let m = c[i];
            if (m._id === id) {
                item = clean(m, fields);
                break;
            }
        }
        return item || null;
    }

    update(id, obj) {
        if (!bella.isString(id)) {
            throw new Error('Invalid parameter. String required.');
        }
        let file = this.file;
        let data = getColData(file);
        let c = data.entries || [];
        let item;
        for (let i = 0; i < c.length; i++) {
            let m = c[i];
            if (m._id === id) {
                item = bella.copies(obj, m, true, ['_id', '_ts']);
                c.splice(i, 1, item);
                break;
            }
        }

        if (item) {
            data.entries = c;
            setColData(data, file);
            this.collection = data;
        }
        return item;
    }

    remove(id) {
        if (!bella.isString(id)) {
            throw new Error('Invalid parameter. String required.');
        }
        let file = this.file;
        let data = getColData(file);
        let c = data.entries || [];
        let item;
        for (let i = c.length - 1; i >= 0; i--) {
            let m = c[i];
            if (m._id === id) {
                item = m;
                c.splice(i, 1);
                break;
            }
        }
        if (item) {
            data.entries = c;
            setColData(data, file);
            this.collection = data;
            return item;
        }
        return false;
    }

    count() {
        let data = checkCache(this);
        let c = data.entries || [];
        return c.length;
    }

    sync(newData) {
        let In = JSON.stringify(newData);
        let Has = JSON.stringify(getColData(this.file));
        if (In != Has) {
            setColData(newData, this.file);
            this.collection = newData;
            return true;
        }
        return false;
    }

    find() {
        let file = this.file;
        // let data = getColData(file);
        let data = checkCache(this);
        let c = data.entries || [];
        return new Finder(c);
    }

}

/**
 *  Module exports
======================================================================
 */
export default Collection;