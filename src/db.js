/**********************************************************************
 *
 * Just-JSON - small json-driven flat-files database system
 * inspired by diskdb (https://github.com/arvindr21/diskDB/)
 * (c) 2016, justpromotion.ru
 *
 * @author Ruslan Konev
 * https://github.com/ruslankonev/just-json
 *
 ********************************************************************/
'use strict';

/***************************************
 *  Dependencies
 **************************************/
const paginator = require('./paginator')();
const fs = require('fs');
const _ = require('lodash');
const uuid = require('node-uuid');
let h;

/***************************************
 *  Initial db options
 **************************************/
let _modelsPath = '';
let _self = {
    cacheTime: 5, // in minutes
    _schema: {
        url: '',
        content: {}
    },
    Models: []
};
let _opts = {
    created_at: true,
    path: null,
    url: null,
};

/***************************************
 *
 *  Functions
 *
 **************************************/

/**
 *  Load collections from file into memory
 */
function loadCollections(collections, target) {
    let items = [];
    target.timing = {};
    _.forEach(collections, function (item, key) {
        let checkModel = _modelsPath + key + '.json';
        // if we have model & file does't exist — we create new file
        !h.isValidPath(checkModel) && h.writeToFile(checkModel);
        // load collections to memory
        items[key] = require(checkModel);
        // save read file time
        target.timing[key] = Date.now();
    });
    target.Models = items;
    return target;
};

/**
 * Update in collection logic
 */
function updateFiltered(collection, query, data, multi) {
    // break 2 loops at once - multi : false
    loop: for (let i = collection.length - 1; i >= 0; i--) {
        let c = collection[i];
        for (let p in query) {
            if (p in c && c[p] == query[p]) {
                collection[i] = _.merge(c, data);
                if (!multi) {
                    break loop;
                }
            }
        }
    }
    return collection;
};

/**
 * Remove items from collection
 */
function removeFiltered(collection, query, multi) {
    // break 2 loops at once -  multi : false
    loop: for (let i = collection.length - 1; i >= 0; i--) {
        let c = collection[i];
        for (let p in query) {
            if (p in c && c[p] == query[p]) {
                collection.splice(i, 1);
                if (!multi) {
                    break loop;
                }
            }
        }
    }
    return collection;
};

/**
 * Check timeout for update data from file
 */
function checkCache(file, force) {
    let model = getModel(file);
    let modelTime = new Date(_self.timing[model]);
    modelTime.setMinutes(modelTime.getMinutes() + _self.cacheTime);
    if (Date.now() > modelTime.getTime() || force) {
        _self.timing[model] = Date.now();
        return h.readData(file);
    } else {
        return _self.Models[model];
    };
};

/**
 * Connect logic with collections
 */
function connect(schema) {
    _opts.url = schema + '.json';
    let _schema = {};
    _modelsPath = schema.replace('/_schemas', '/db/');

    if (h.isValidPath(schema + '.json')) {
        _schema.url = schema + '.json';
        _schema.content = require(_schema.url);
        _self._schema = _schema;
        if (_schema.content) {
            _self = loadCollections(_schema.content, _self);
        }

        return _self;
    } else {
        throw new Error(`The schema url:
    [${_opts.url}]
does not seem to be valid. Recheck the path and try again`);
    }
};

/***************************************
 *
 *  Module exports
 *
 **************************************/
module.exports = function(opts) {
    _opts = _.merge(_opts, opts);
    _opts._modelsPath = _opts.url.replace('/_schemas', '/db/');

    h = require('./helpers')(_opts);
    _opts.url && connect(_opts.url);

    return {
        _f: _self._f,
        _schema: _self._schema,
        connect: connect,
        select: function(model) {
            let _file = '';
            _file = _modelsPath + model + '.json';

            return {

                _f: _file,

                _schema: {
                    content: _self._schema.content[getModel(_file)]
                },

                search: function(query, one) {
                    let collection = checkCache(this._f);
                    let copyCollection = _.cloneDeep(collection);
                    h.objectLowercase(copyCollection);
                    if (!query) {
                        return collection;
                    } else {
                        let minifyQuery = query;
                        h.objectLowercase(minifyQuery);
                        let result = _.filter(copyCollection, minifyQuery);
                        if (JSON.stringify(result) !== JSON.stringify([])) {
                            let IDs = _.toArray(_.mapValues(result, '_id'));
                            let elements = _.filter(collection, function(item) {
                                return _.includes(IDs, item._id);
                            });
                            if (one) {
                                return elements[0];
                            } else {
                                return elements;
                            }
                        } else {
                            return [];
                        }
                    }
                },

                read: function() {
                    return checkCache(this._f);
                },

                readById: function(id, key) {
                    let collection = checkCache(this._f);
                    key = key || '_id';
                    let resi = _.find(collection, {
                        // [key]: `"${id}"`
                        [key]: id
                    });
                    return resi;
                },

                find: function(query) {
                    return this.search(query);
                },

                findOne: function(query) {
                    return this.search(query, true);
                },

                save: function(data) {
                    let collection = checkCache(this._f, true);
                    let schema = _self._schema.content[getModel(this._f)].fields;
                    // if data is Array
                    if (typeof data === 'object' && data.length) {
                        if (data.length === 1) {
                            if (data[0].length > 0) {
                                data = data[0];
                            }
                        }
                        _opts.created_at && !data['created_at'] && (data['created_at'] = new Date());
                        let retCollection = [];
                        for (let i = data.length - 1; i >= 0; i--) {
                            let d = data[i];
                            d._id = uuid.v4().replace(/-/g, '');
                            _self.Models[getModel(this._f)].push(d);
                            collection.push(d);
                            retCollection.push(d);
                        }
                        h.writeToFile(this._f, collection);
                        return retCollection;
                    } else if (typeof data === 'object' && _.size(data)) {
                        // if data is object
                        _.forEach(schema, function(item) {
                            if (/|/i.test(item)) {
                                item = item.split(':')[0];
                            } else {
                                !data[item] && (data[item] = '');
                            }
                        });
                        data._id = uuid.v4().replace(/-/g, '');
                        _opts.created_at && !data.created_at && (data.created_at = new Date());
                        _self.Models[getModel(this._f)].push(data);
                        collection.push(data);
                        h.writeToFile(this._f, collection);
                        return data;
                    }
                    data._id = uuid.v4().replace(/-/g, '');
                    _opts.created_at && !data.created_at && (data.created_at = new Date());
                    collection.push(data);
                    h.writeToFile(this._f, collection);
                    return data;
                },

                update: function(query, data, options) {
                    let collection = checkCache(this._f, true); // force load
                    let records = _.find(collection, query);
                    if (_.isObject(records) || _.isArray(records)) {
                        data.updated_at = new Date();
                        if (options && options.multi) {
                            collection = updateFiltered(collection, query, data, true);
                        } else {
                            collection = updateFiltered(collection, query, data, false);
                        }
                    } else {
                        if (options && options.upsert) {
                            data._id = uuid.v4().replace(/-/g, '');
                            collection.push(data);
                        }
                    }
                    _self.Models[getModel(this._f)] = collection;
                    h.writeToFile(this._f, collection);
                    return data;
                },

                remove: function(query, multi) {
                    if (query) {
                        let collection = checkCache(this._f, true);
                        if (typeof multi === 'undefined') {
                            multi = true;
                        }
                        try {
                            collection = removeFiltered(collection, query, multi);
                            _self.Models[getModel(this._f)] = collection;
                            h.writeToFile(this._f, collection);
                        } catch (err) {
                            return false;
                        }
                    } else {
                        h.removeFile(this._f);
                        delete _self.Models[getModel(this._f)];
                    }
                    return true;
                },

                empty: function(cb) {
                    _self.Models[getModel(this._f)] = [];
                    h.writeToFile(this._f);
                    cb();
                },

                first: function(order, query) {
                    !order && (order = 'asc');
                    let data = _.orderBy(this.search(query, true), 'created_at', order);
                    if (data[0]) {
                        return data[0];
                    }
                    return null;
                },

                paginate: function(count, filter, sort) {
                    let data;
                    if (filter) {
                        data = this.search(filter);
                    } else {
                        data = this.read();
                    }
                    if (sort) {
                        data = _.orderBy(data, 'created_at', sort);
                    }
                    let resp = paginator.paginate(count, data);
                    return resp;
                },

                count: function() {
                    return (checkCache(this._f)).length;
                },

                sync: function(data) {
                    let In = JSON.stringify(data);
                    let Has = JSON.stringify(checkCache(this._f));

                    if (In != Has) {
                        let model = getModel(this._f);
                        try {
                            h.writeToFile(this._f, data);
                            _self.Models[model] = data;

                            process.env
                                && process.env.NODE_ENV
                                && process.env.NODE_ENV === 'development'
                                && console.log('Syncing', model, 'db');

                            return true;
                        } catch (err) {
                            return false;
                        }
                    } else {
                        return true;
                    }
                },

                importJSON: function(data) {
                    let schema = _self._schema.content[getModel(this._f)].fields;
                    // if data if object
                    if (typeof data === 'object' && _.size(data)) {
                        // check & extend prop if needed
                        _.forEach(data, function(content, index) {
                            _.forEach(schema, function(item) {
                                if (/|/i.test(item)) {
                                    item = item.split(':')[0];
                                } else {
                                    !data[index][item] && (data[index][item] = '');
                                }
                            });
                            data[index]._id = uuid.v4().replace(/-/g, '');
                            // we have a created_at field? No? Create them.
                            _opts.created_at
                                && !data[index].created_at
                                && (data[index].created_at = new Date());
                        });
                        // update memory model
                        _self.Models[getModel(this._f)].push(data);
                        h.writeToFile(this._f, data);
                        return data;
                    }
                }

            }
        }

    }

}
