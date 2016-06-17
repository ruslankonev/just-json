/**********************************************************************
 *
 * Just-JSON - small json-driven flat-files database system
 * inspired from diskdb (https://github.com/arvindr21/diskDB/)
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
const winston = require('winston');
require('./helpers');

/***************************************
 *  Initial db options
 **************************************/
let c = {
    _modelsPath: '',
    _self: {
        cacheTime: 5,   // in minutes
        _schema: {
            url: '',
            content: {}
        },
        Models: []
    },
    _opts: {
        dateBased: false,
        created_at: true,
        url: null,
    }
};

/***************************************
 *
 *  Functions
 *
 **************************************/

/**
 *  Load collections from file into memory
 */
function loadCollections (collections, target) {

    let items = [];
    target.timing = {};

    _.forEach(collections, function(item, key) {
        let checkModel = c._modelsPath + key + '.json';
        // if instance is date-based
        checkModel = modelDateBased(checkModel, key);
        // if we have model & file does't exist — we create new file
        !isValidPath(checkModel) && writeToFile(checkModel);
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
 *
 * @param collection {array}
 * @param query {object}
 * @param data {object}
 * @param multi {boolean} — multi-replacement
 * @returns {array} — updated collection
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
 *
 * @param collection {array}
 * @param query {object}
 * @param multi {boolean} — multi-remove
 * @returns {array} — updated collection
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
 *
 * @param file {string}
 * @param force {boolean}
 * @returns {array} - collection
 */
function checkCache (file, force) {
    let model = getModel(file);
    let modelTime = new Date(_self.timing[model]);
    modelTime.setMinutes(modelTime.getMinutes() + _self.cacheTime);
    if (Date.now() > modelTime.getTime() || force) {
        _self.timing[model] = Date.now();
        return readData(file);
    } else {
        return _self.Models[model];
    };
};

/**
 * Get name of model by filename
 *
 * @param model {string}
 * @returns {string} — model name
 */
function getModel(model) {
    if (Opts.dateBased == true) {
        return model
            .replace(__modelsPath, '')
            .replace('.json', '')
            .replace(getToday(), '')
            .replace('/', '');
    }
    return model
        .replace(__modelsPath, '')
        .replace('.json', '');
};

/**
 * Connect logic with collections
 *
 * @param schema {string}
 * @returns {object} — instance
 */
function connect(schema) {
    Opts.url = schema + '.json';
    let _schema = {};
    if (isValidPath(schema + '.json')) {
        _schema.url = schema + '.json';
        _schema.content = require(_schema.url);

        _self._schema = _schema;
        if (_schema.content) {
            _self = loadCollections(_schema.content, _self);
        }
        return _self;
    } else {
        throw new Error(`The same model is already exist DB Path:
        [${Opts.url}]
        does not seem to be valid. Recheck the path and try again`);
    }
};

/***************************************
 *
 *  Module exports
 *
 **************************************/
module.exports = function (config) {
    config = _.merge(c, config);


}